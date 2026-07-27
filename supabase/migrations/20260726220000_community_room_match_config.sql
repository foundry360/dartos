-- Community rooms require match config (game + rules) at create time.

drop function if exists public.create_community_room();

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

drop function if exists public.list_open_community_rooms(integer);

create function public.list_open_community_rooms(result_limit integer default 30)
returns table (
  room_id uuid,
  room_code text,
  host_id uuid,
  created_at timestamptz,
  game_type text,
  rules jsonb,
  host_display_name text,
  host_nickname text,
  host_avatar_url text,
  host_country_code text,
  host_three_dart_average numeric,
  already_requested boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  safe_limit integer := least(greatest(coalesce(result_limit, 30), 1), 50);
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  return query
  select
    r.id as room_id,
    r.code as room_code,
    r.host_id,
    r.created_at,
    r.game_type,
    r.rules,
    p.display_name as host_display_name,
    p.nickname as host_nickname,
    p.avatar_url as host_avatar_url,
    p.country_code as host_country_code,
    case
      when coalesce(s.visits, 0) = 0 then 0::numeric
      else round((s.total_score::numeric / s.visits::numeric), 2)
    end as host_three_dart_average,
    exists (
      select 1
      from public.community_room_join_requests jr
      where jr.room_id = r.id
        and jr.requester_id = uid
        and jr.status = 'pending'
    ) as already_requested
  from public.community_rooms r
  inner join public.profiles p on p.id = r.host_id
  left join public.player_stats s on s.user_id = r.host_id
  where r.status = 'lobby'
    and r.expires_at > now()
    and r.host_id <> uid
    and r.game_type is not null
    and p.deactivated_at is null
    and not exists (
      select 1
      from public.community_room_members m
      where m.room_id = r.id
        and m.user_id = uid
    )
    and not exists (
      select 1
      from public.community_room_members m
      where m.room_id = r.id
        and m.seat = 1
    )
  order by r.created_at desc
  limit safe_limit;
end;
$$;

revoke all on function public.list_open_community_rooms(integer) from public;
grant execute on function public.list_open_community_rooms(integer) to authenticated;
