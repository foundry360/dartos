-- Shorten host start timeout from 10 minutes to 5 minutes.

create or replace function public.maintain_community_room_match_start(target_room_id uuid)
returns public.community_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  room public.community_rooms;
  opponent_joined_at timestamptz;
begin
  if target_room_id is null then
    return null;
  end if;

  select *
  into room
  from public.community_rooms r
  where r.id = target_room_id
  for update;

  if room.id is null then
    return null;
  end if;

  if room.status <> 'lobby' then
    return room;
  end if;

  if room.expires_at <= now() then
    update public.community_rooms
    set status = 'ended', closing_at = null, updated_at = now()
    where id = room.id
    returning * into room;
    delete from public.community_room_members where room_id = room.id;
    return room;
  end if;

  select m.joined_at
  into opponent_joined_at
  from public.community_room_members m
  where m.room_id = room.id
    and m.seat = 1
  order by m.joined_at asc
  limit 1;

  if opponent_joined_at is null then
    if room.matched_at is not null or room.closing_at is not null then
      update public.community_rooms
      set matched_at = null, closing_at = null, updated_at = now()
      where id = room.id
      returning * into room;
    end if;
    return room;
  end if;

  if room.matched_at is null then
    update public.community_rooms
    set matched_at = opponent_joined_at, updated_at = now()
    where id = room.id
    returning * into room;
  end if;

  -- Host has 5 minutes after the opponent joins to start the match.
  if room.matched_at <= now() - interval '5 minutes' then
    if room.closing_at is null then
      update public.community_rooms
      set closing_at = now() + interval '10 seconds',
          updated_at = now()
      where id = room.id
      returning * into room;
    end if;
  end if;

  if room.closing_at is not null and room.closing_at <= now() then
    update public.community_rooms
    set status = 'ended', closing_at = null, updated_at = now()
    where id = room.id
    returning * into room;

    delete from public.community_room_members where room_id = room.id;
  end if;

  return room;
end;
$$;

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
