-- Hosting a lobby and joining another room closes your open room first.

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

notify pgrst, 'reload schema';
