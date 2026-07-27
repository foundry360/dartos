-- Allow host re-seed to repair null current_user_id left by early sync bugs.

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
        current_user_id = coalesce(
          public.community_match_states.current_user_id,
          excluded.current_user_id
        ),
        updated_by = uid,
        updated_at = now()
  returning * into row;

  return row;
end;
$$;
