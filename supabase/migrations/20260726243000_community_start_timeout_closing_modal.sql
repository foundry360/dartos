-- Let either player close once the 5-minute start window has elapsed,
-- even if closing_at wasn't stamped yet (missed poll / older clients).

create or replace function public.close_community_room_now(target_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  room public.community_rooms;
  start_deadline_passed boolean := false;
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
    raise exception 'You are not in this room';
  end if;

  if room.host_id <> uid then
    start_deadline_passed :=
      room.status = 'lobby'
      and room.matched_at is not null
      and room.matched_at <= now() - interval '5 minutes';

    if room.closing_at is null and not start_deadline_passed then
      raise exception 'This room is not closing yet';
    end if;

    if room.status <> 'lobby' then
      raise exception 'This room is not closing yet';
    end if;
  end if;

  update public.community_rooms
  set status = 'ended', closing_at = null, updated_at = now()
  where id = room.id;

  delete from public.community_room_members where room_id = room.id;
end;
$$;
