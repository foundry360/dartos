-- Bump revision on raise/clear so Realtime always fans out the pause to both clients.

create or replace function public.raise_community_match_issue(target_room_id uuid)
returns public.community_match_states
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  room public.community_rooms;
  row public.community_match_states;
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

  if room.status <> 'playing' then
    raise exception 'Match is not in progress';
  end if;

  if not public.is_community_room_member(room.id) then
    raise exception 'You are not in this room';
  end if;

  select *
  into row
  from public.community_match_states s
  where s.room_id = room.id
  for update;

  if row.room_id is null then
    raise exception 'Match state is not ready yet';
  end if;

  if row.issue_raised_by is not null then
    return row;
  end if;

  update public.community_match_states
  set issue_raised_by = uid,
      issue_raised_at = now(),
      revision = row.revision + 1,
      updated_by = uid,
      updated_at = now()
  where room_id = room.id
  returning * into row;

  return row;
end;
$$;

create or replace function public.clear_community_match_issue(target_room_id uuid)
returns public.community_match_states
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  room public.community_rooms;
  row public.community_match_states;
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

  if not public.is_community_room_member(room.id) then
    raise exception 'You are not in this room';
  end if;

  select *
  into row
  from public.community_match_states s
  where s.room_id = room.id
  for update;

  if row.room_id is null then
    raise exception 'Match state is not ready yet';
  end if;

  if row.issue_raised_by is null then
    return row;
  end if;

  update public.community_match_states
  set issue_raised_by = null,
      issue_raised_at = null,
      revision = row.revision + 1,
      updated_by = uid,
      updated_at = now()
  where room_id = room.id
  returning * into row;

  return row;
end;
$$;

notify pgrst, 'reload schema';
