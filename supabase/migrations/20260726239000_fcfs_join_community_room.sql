-- First-come-first-serve: join an open room by id and take seat 1 immediately.
-- Also harden code-join with the same "one active room" rule.

create or replace function public.join_community_room_by_id(target_room_id uuid)
returns public.community_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  room public.community_rooms;
  existing_member boolean;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if target_room_id is null then
    raise exception 'Room is required';
  end if;

  -- Drop any outgoing pending requests; FCFS join replaces that flow.
  update public.community_room_join_requests
  set status = 'cancelled', responded_at = now()
  where requester_id = uid
    and status = 'pending';

  -- Auto-close lobbies you host before joining someone else's room.
  delete from public.community_room_members
  where room_id in (
    select id
    from public.community_rooms
    where host_id = uid
      and status = 'lobby'
      and id <> target_room_id
  );

  update public.community_rooms
  set status = 'ended', updated_at = now()
  where host_id = uid
    and status = 'lobby'
    and id <> target_room_id;

  if exists (
    select 1
    from public.community_room_members m
    inner join public.community_rooms r on r.id = m.room_id
    where m.user_id = uid
      and r.id <> target_room_id
      and r.status in ('lobby', 'playing')
      and r.expires_at > now()
  ) then
    raise exception 'Close your current room before joining another.';
  end if;

  select *
  into room
  from public.community_rooms r
  where r.id = target_room_id
    and r.status = 'lobby'
    and r.expires_at > now()
  for update;

  if room.id is null then
    raise exception 'Room not found or no longer open';
  end if;

  if room.host_id = uid then
    return room;
  end if;

  select exists (
    select 1
    from public.community_room_members m
    where m.room_id = room.id
      and m.user_id = uid
  ) into existing_member;

  if not existing_member then
    if exists (
      select 1
      from public.community_room_members m
      where m.room_id = room.id
        and m.seat = 1
    ) then
      raise exception 'This room is already full';
    end if;

    insert into public.community_room_members (room_id, user_id, seat, role)
    values (room.id, uid, 1, 'player');
  end if;

  -- Room is full — clear leftover pending requests for this room.
  update public.community_room_join_requests
  set status = 'cancelled', responded_at = now()
  where room_id = room.id
    and status = 'pending';

  return room;
end;
$$;

create or replace function public.join_community_room(join_code text)
returns public.community_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  normalized text := upper(trim(coalesce(join_code, '')));
  room public.community_rooms;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if char_length(normalized) < 4 then
    raise exception 'Enter a valid room code';
  end if;

  select *
  into room
  from public.community_rooms r
  where r.code = normalized
    and r.status = 'lobby'
    and r.expires_at > now();

  if room.id is null then
    raise exception 'Room not found or no longer open';
  end if;

  return public.join_community_room_by_id(room.id);
end;
$$;

-- Hosting no longer depends on revoking join requests (FCFS).
create or replace function public.create_community_room(
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

  -- Cancel outgoing join requests when starting your own room.
  update public.community_room_join_requests
  set status = 'cancelled', responded_at = now()
  where requester_id = uid
    and status = 'pending';

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

  -- Still a guest (or player) in someone else's active room — must leave first.
  if exists (
    select 1
    from public.community_room_members m
    inner join public.community_rooms r on r.id = m.room_id
    where m.user_id = uid
      and r.status in ('lobby', 'playing')
      and r.expires_at > now()
  ) then
    raise exception 'Close your current room before joining another.';
  end if;

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

revoke all on function public.join_community_room_by_id(uuid) from public;
grant execute on function public.join_community_room_by_id(uuid) to authenticated;

notify pgrst, 'reload schema';
