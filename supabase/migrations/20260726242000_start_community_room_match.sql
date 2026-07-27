-- Host starts the match from the waiting room → status becomes playing.

create or replace function public.start_community_room_match(target_room_id uuid)
returns public.community_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  room public.community_rooms;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if target_room_id is null then
    raise exception 'Room is required';
  end if;

  select *
  into room
  from public.community_rooms r
  where r.id = target_room_id
  for update;

  if room.id is null then
    raise exception 'Room not found';
  end if;

  if room.host_id <> uid then
    raise exception 'Only the host can start this match';
  end if;

  if room.status = 'playing' then
    return room;
  end if;

  if room.status <> 'lobby' or room.expires_at <= now() then
    raise exception 'This room is no longer open';
  end if;

  if not exists (
    select 1
    from public.community_room_members m
    where m.room_id = room.id
      and m.seat = 1
  ) then
    raise exception 'Wait for an opponent before starting';
  end if;

  update public.community_rooms
  set status = 'playing',
      closing_at = null,
      updated_at = now()
  where id = room.id
  returning * into room;

  return room;
end;
$$;

revoke all on function public.start_community_room_match(uuid) from public;
grant execute on function public.start_community_room_match(uuid) to authenticated;

notify pgrst, 'reload schema';
