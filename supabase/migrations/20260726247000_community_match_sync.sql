-- Shared Community match state for synced scoring (X01 / Cricket).
-- Clients run the engine locally; this table is the authoritative snapshot + realtime fan-out.

create table if not exists public.community_match_states (
  room_id uuid primary key references public.community_rooms (id) on delete cascade,
  game_mode text not null check (game_mode in ('x01', 'cricket')),
  revision bigint not null default 1,
  state jsonb not null default '{}'::jsonb,
  current_user_id uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists community_match_states_updated_at_idx
  on public.community_match_states (updated_at desc);

alter table public.community_match_states enable row level security;

drop policy if exists "Members can read community match state" on public.community_match_states;
create policy "Members can read community match state"
  on public.community_match_states
  for select
  to authenticated
  using (public.is_community_room_member(room_id));

-- Realtime for opponents
do $$
begin
  begin
    alter publication supabase_realtime add table public.community_match_states;
  exception
    when duplicate_object then
      null;
    when undefined_object then
      null;
  end;
end;
$$;

create or replace function public.get_community_match_state(target_room_id uuid)
returns public.community_match_states
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  row public.community_match_states;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if target_room_id is null then
    raise exception 'Room is required';
  end if;

  if not public.is_community_room_member(target_room_id) then
    raise exception 'You are not in this room';
  end if;

  select *
  into row
  from public.community_match_states s
  where s.room_id = target_room_id;

  return row;
end;
$$;

create or replace function public.seed_community_match_state(
  target_room_id uuid,
  p_game_mode text,
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

  if p_game_mode is null or p_game_mode not in ('x01', 'cricket') then
    raise exception 'Invalid game mode';
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
    raise exception 'Only the host can seed match state';
  end if;

  if room.status <> 'playing' then
    raise exception 'Match is not in progress';
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

  insert into public.community_match_states (
    room_id,
    game_mode,
    revision,
    state,
    current_user_id,
    updated_by,
    updated_at
  )
  values (
    room.id,
    p_game_mode,
    1,
    p_state,
    p_current_user_id,
    uid,
    now()
  )
  on conflict (room_id) do update
    set game_mode = excluded.game_mode,
        -- Keep existing progress if already seeded (guest/host race).
        revision = public.community_match_states.revision,
        state = public.community_match_states.state,
        current_user_id = public.community_match_states.current_user_id,
        updated_by = public.community_match_states.updated_by,
        updated_at = public.community_match_states.updated_at
  returning * into row;

  return row;
end;
$$;

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

  -- Only the player whose turn it is may publish the next snapshot.
  if row.current_user_id is not null and row.current_user_id <> uid then
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

revoke all on function public.get_community_match_state(uuid) from public;
revoke all on function public.seed_community_match_state(uuid, text, jsonb, uuid) from public;
revoke all on function public.publish_community_match_state(uuid, bigint, jsonb, uuid) from public;

grant execute on function public.get_community_match_state(uuid) to authenticated;
grant execute on function public.seed_community_match_state(uuid, text, jsonb, uuid) to authenticated;
grant execute on function public.publish_community_match_state(uuid, bigint, jsonb, uuid) to authenticated;

notify pgrst, 'reload schema';
