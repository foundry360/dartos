-- After an opponent joins, the host has 5 minutes to start the match.
-- If still in lobby after that, give the opponent a 10-second closing window.

alter table public.community_rooms
  add column if not exists matched_at timestamptz;

alter table public.community_rooms
  add column if not exists closing_at timestamptz;

-- Backfill: rooms that already have an opponent seated.
update public.community_rooms r
set matched_at = coalesce(
  r.matched_at,
  (
    select m.joined_at
    from public.community_room_members m
    where m.room_id = r.id
      and m.seat = 1
    order by m.joined_at asc
    limit 1
  )
)
where r.status = 'lobby'
  and r.matched_at is null
  and exists (
    select 1
    from public.community_room_members m
    where m.room_id = r.id
      and m.seat = 1
  );

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
    -- No opponent yet — clear any stale closing / matched markers.
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

  -- Opponent can force-close once the start-timeout window is active;
  -- host can always close.
  if room.host_id <> uid
     and (room.closing_at is null or room.status <> 'lobby') then
    raise exception 'This room is not closing yet';
  end if;

  update public.community_rooms
  set status = 'ended', closing_at = null, updated_at = now()
  where id = room.id;

  delete from public.community_room_members where room_id = room.id;
end;
$$;

create or replace function public.get_my_community_room()
returns setof public.community_rooms
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

  select r.*
  into room
  from public.community_rooms r
  inner join public.community_room_members m on m.room_id = r.id
  where m.user_id = uid
    and r.status in ('lobby', 'playing')
    and r.expires_at > now()
  order by r.created_at desc
  limit 1;

  if room.id is null then
    return;
  end if;

  room := public.maintain_community_room_match_start(room.id);

  if room.id is null or room.status = 'ended' then
    return;
  end if;

  return next room;
end;
$$;

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
      and id <> target_room_id
  );

  update public.community_rooms
  set status = 'ended', updated_at = now(), closing_at = null, matched_at = null
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
    return public.maintain_community_room_match_start(room.id);
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

    update public.community_rooms
    set matched_at = coalesce(matched_at, now()),
        closing_at = null,
        updated_at = now()
    where id = room.id
    returning * into room;
  end if;

  update public.community_room_join_requests
  set status = 'cancelled', responded_at = now()
  where room_id = room.id
    and status = 'pending';

  return public.maintain_community_room_match_start(room.id);
end;
$$;

revoke all on function public.maintain_community_room_match_start(uuid) from public;
revoke all on function public.close_community_room_now(uuid) from public;
-- Drop earlier presence helper if a prior draft of this migration created it.
drop function if exists public.touch_community_room_presence(uuid);
drop function if exists public.maintain_community_room_host_presence(uuid);

grant execute on function public.close_community_room_now(uuid) to authenticated;

notify pgrst, 'reload schema';
