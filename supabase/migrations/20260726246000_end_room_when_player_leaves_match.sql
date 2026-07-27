-- Leaving a live Community match ends the room for both players.

create or replace function public.leave_community_room(target_room_id uuid)
returns void
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

  select * into room
  from public.community_rooms r
  where r.id = target_room_id
  for update;

  if room.id is null then
    return;
  end if;

  if not exists (
    select 1
    from public.community_room_members m
    where m.room_id = room.id
      and m.user_id = uid
  ) then
    return;
  end if;

  -- Host always ends the room. Any player leaving a live match does too.
  if room.host_id = uid or room.status = 'playing' then
    update public.community_rooms
    set status = 'ended',
        closing_at = null,
        updated_at = now()
    where id = room.id;
    delete from public.community_room_members where room_id = room.id;
    return;
  end if;

  -- Lobby guest leave — free the seat so the host can wait for someone else.
  delete from public.community_room_members
  where room_id = room.id
    and user_id = uid;

  update public.community_rooms
  set matched_at = null,
      closing_at = null,
      updated_at = now()
  where id = room.id;
end;
$$;
