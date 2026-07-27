-- Friendlier user-facing errors for community join conflicts.

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
    raise exception 'Close your current room before requesting to join another.';
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
