-- Community match score-issue pause (raise hand): either member can undo while active.

alter table public.community_match_states
  add column if not exists issue_raised_by uuid references auth.users (id) on delete set null,
  add column if not exists issue_raised_at timestamptz;

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

-- Allow either member to publish snapshots while a score issue is active (undo/fix).
create or replace function public.publish_community_match_state(
  target_room_id uuid,
  expected_revision bigint,
  p_state jsonb,
  p_current_user_id uuid
)
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

  if target_room_id is null or p_state is null then
    raise exception 'Room and state are required';
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

  if row.revision <> expected_revision then
    raise exception 'Match state conflict';
  end if;

  -- Normal play: only the current thrower. Score-issue pause: either member.
  if row.issue_raised_by is null
     and row.current_user_id is not null
     and row.current_user_id <> uid then
    raise exception 'Not your turn';
  end if;

  if p_current_user_id is not null
     and not exists (
       select 1
       from public.community_room_members m
       where m.room_id = room.id
         and m.user_id = p_current_user_id
     ) then
    raise exception 'Current player must be in the room';
  end if;

  update public.community_match_states
  set revision = row.revision + 1,
      state = p_state,
      current_user_id = p_current_user_id,
      updated_by = uid,
      updated_at = now()
  where room_id = room.id
  returning * into row;

  return row;
end;
$$;

revoke all on function public.raise_community_match_issue(uuid) from public;
revoke all on function public.clear_community_match_issue(uuid) from public;

grant execute on function public.raise_community_match_issue(uuid) to authenticated;
grant execute on function public.clear_community_match_issue(uuid) to authenticated;

notify pgrst, 'reload schema';
