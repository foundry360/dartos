-- One active seat at a time: accepting a join cancels that player's other pending requests.
-- Also block join/request if the player is already in another lobby or match.

create or replace function public.request_community_room_join(target_room_id uuid)
returns public.community_room_join_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  room public.community_rooms;
  request public.community_room_join_requests;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if target_room_id is null then
    raise exception 'Room is required';
  end if;

  if exists (
    select 1
    from public.community_room_members m
    inner join public.community_rooms r on r.id = m.room_id
    where m.user_id = uid
      and r.status in ('lobby', 'playing')
      and r.expires_at > now()
  ) then
    raise exception 'You are already in another room';
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
    raise exception 'You already host this room';
  end if;

  if exists (
    select 1
    from public.community_room_members m
    where m.room_id = room.id
      and m.seat = 1
  ) then
    raise exception 'This room is already full';
  end if;

  if exists (
    select 1
    from public.community_room_members m
    where m.room_id = room.id
      and m.user_id = uid
  ) then
    raise exception 'You are already in this room';
  end if;

  select *
  into request
  from public.community_room_join_requests jr
  where jr.room_id = room.id
    and jr.requester_id = uid
    and jr.status = 'pending'
  limit 1;

  if request.id is not null then
    return request;
  end if;

  insert into public.community_room_join_requests (room_id, requester_id, status)
  values (room.id, uid, 'pending')
  returning * into request;

  return request;
end;
$$;

create or replace function public.respond_community_room_join(
  target_request_id uuid,
  accept_request boolean
)
returns public.community_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  request public.community_room_join_requests;
  room public.community_rooms;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select *
  into request
  from public.community_room_join_requests jr
  where jr.id = target_request_id
  for update;

  if request.id is null then
    raise exception 'Join request not found';
  end if;

  if request.status <> 'pending' then
    raise exception 'This join request is no longer pending';
  end if;

  select *
  into room
  from public.community_rooms r
  where r.id = request.room_id
  for update;

  if room.id is null or room.host_id <> uid then
    raise exception 'Only the host can respond to join requests';
  end if;

  if room.status <> 'lobby' or room.expires_at <= now() then
    update public.community_room_join_requests
    set status = 'declined', responded_at = now()
    where id = request.id;
    raise exception 'Room is no longer open';
  end if;

  if not accept_request then
    update public.community_room_join_requests
    set status = 'declined', responded_at = now()
    where id = request.id;
    return room;
  end if;

  if exists (
    select 1
    from public.community_room_members m
    where m.room_id = room.id
      and m.seat = 1
  ) then
    update public.community_room_join_requests
    set status = 'declined', responded_at = now()
    where id = request.id;
    raise exception 'This room is already full';
  end if;

  -- Player already seated elsewhere cannot be accepted here.
  if exists (
    select 1
    from public.community_room_members m
    inner join public.community_rooms r on r.id = m.room_id
    where m.user_id = request.requester_id
      and r.id <> room.id
      and r.status in ('lobby', 'playing')
      and r.expires_at > now()
  ) then
    update public.community_room_join_requests
    set status = 'cancelled', responded_at = now()
    where id = request.id;
    raise exception 'This player already joined another room';
  end if;

  insert into public.community_room_members (room_id, user_id, seat, role)
  values (room.id, request.requester_id, 1, 'player')
  on conflict (room_id, user_id) do update
    set seat = 1,
        role = 'player';

  update public.community_room_join_requests
  set status = 'accepted', responded_at = now()
  where id = request.id;

  -- Same room: clear competing pending requests.
  update public.community_room_join_requests
  set status = 'declined', responded_at = now()
  where room_id = room.id
    and status = 'pending'
    and id <> request.id;

  -- All other rooms: cancel this player's remaining pending requests.
  update public.community_room_join_requests
  set status = 'cancelled', responded_at = now()
  where requester_id = request.requester_id
    and status = 'pending'
    and id <> request.id;

  return room;
end;
$$;

notify pgrst, 'reload schema';
