-- Repair: create_community_room(p_game_type, p_rules) + refresh PostgREST schema cache.

do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'create_community_room'
  loop
    execute format('drop function if exists %s', r.sig);
  end loop;
end;
$$;

create function public.create_community_room(
  p_game_type text,
  p_rules jsonb default '{}'::jsonb
)
returns public.community_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  room public.community_rooms;
  normalized_type text := lower(trim(coalesce(p_game_type, '')));
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if normalized_type not in ('x01', 'cricket') then
    raise exception 'Choose X01 or Cricket for this room';
  end if;

  if p_rules is null or jsonb_typeof(p_rules) <> 'object' then
    raise exception 'Match rules are required';
  end if;

  if to_regprocedure('public.generate_community_room_code()') is null then
    raise exception 'generate_community_room_code() is missing — run community_play migrations first';
  end if;

  delete from public.community_room_members
  where room_id in (
    select id
    from public.community_rooms
    where host_id = uid
      and status = 'lobby'
  );

  update public.community_rooms
  set status = 'ended', updated_at = now()
  where host_id = uid
    and status = 'lobby';

  insert into public.community_rooms (code, host_id, game_type, rules)
  values (
    public.generate_community_room_code(),
    uid,
    normalized_type,
    coalesce(p_rules, '{}'::jsonb)
  )
  returning * into room;

  insert into public.community_room_members (room_id, user_id, seat, role)
  values (room.id, uid, 0, 'host');

  return room;
end;
$$;

revoke all on function public.create_community_room(text, jsonb) from public;
grant execute on function public.create_community_room(text, jsonb) to authenticated;
grant execute on function public.create_community_room(text, jsonb) to service_role;

-- Force PostgREST to reload so the new signature is visible immediately.
notify pgrst, 'reload schema';
