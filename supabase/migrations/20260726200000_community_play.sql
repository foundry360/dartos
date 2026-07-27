-- Community Play: optional profile country + social rooms (lobby create/join).

alter table public.profiles
  add column if not exists country_code text;

alter table public.profiles
  drop constraint if exists profiles_country_code_check;

alter table public.profiles
  add constraint profiles_country_code_check
  check (
    country_code is null
    or country_code ~ '^[A-Z]{2}$'
  );

create table if not exists public.community_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'lobby'
    check (status in ('lobby', 'playing', 'ended')),
  game_type text,
  rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '6 hours')
);

create index if not exists community_rooms_host_id_idx
  on public.community_rooms (host_id);

create index if not exists community_rooms_status_idx
  on public.community_rooms (status);

create table if not exists public.community_room_members (
  room_id uuid not null references public.community_rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  seat smallint check (seat is null or seat in (0, 1)),
  role text not null check (role in ('host', 'player', 'spectator')),
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create unique index if not exists community_room_members_seat_uidx
  on public.community_room_members (room_id, seat)
  where seat is not null;

create index if not exists community_room_members_user_id_idx
  on public.community_room_members (user_id);

alter table public.community_rooms enable row level security;
alter table public.community_room_members enable row level security;

create or replace function public.is_community_room_member(target_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_room_members m
    where m.room_id = target_room_id
      and m.user_id = auth.uid()
  );
$$;

revoke all on function public.is_community_room_member(uuid) from public;
grant execute on function public.is_community_room_member(uuid) to authenticated;

drop policy if exists "Members can read community rooms" on public.community_rooms;
create policy "Members can read community rooms"
  on public.community_rooms
  for select
  to authenticated
  using (public.is_community_room_member(id));

drop policy if exists "Host can update community rooms" on public.community_rooms;
create policy "Host can update community rooms"
  on public.community_rooms
  for update
  to authenticated
  using (host_id = auth.uid())
  with check (host_id = auth.uid());

drop policy if exists "Members can read community room members" on public.community_room_members;
create policy "Members can read community room members"
  on public.community_room_members
  for select
  to authenticated
  using (public.is_community_room_member(room_id));

create or replace function public.generate_community_room_code()
returns text
language plpgsql
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
  i integer;
  j integer;
begin
  for i in 1..20 loop
    candidate := '';
    for j in 1..6 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;

    if not exists (select 1 from public.community_rooms r where r.code = candidate) then
      return candidate;
    end if;
  end loop;

  raise exception 'Unable to generate room code';
end;
$$;

create or replace function public.create_community_room()
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

  -- End any prior lobby rooms this user still hosts.
  delete from public.community_room_members
  where room_id in (
    select id
    from public.community_rooms
    where host_id = uid
      and status = 'lobby'
  );

  update public.community_rooms
  set status = 'ended', updated_at = now()
  where host_id = uid
    and status = 'lobby';

  insert into public.community_rooms (code, host_id)
  values (public.generate_community_room_code(), uid)
  returning * into room;

  insert into public.community_room_members (room_id, user_id, seat, role)
  values (room.id, uid, 0, 'host');

  return room;
end;
$$;

create or replace function public.join_community_room(join_code text)
returns public.community_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  normalized text := upper(trim(coalesce(join_code, '')));
  room public.community_rooms;
  existing_member boolean;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if char_length(normalized) < 4 then
    raise exception 'Enter a valid room code';
  end if;

  select *
  into room
  from public.community_rooms r
  where r.code = normalized
    and r.status = 'lobby'
    and r.expires_at > now()
  for update;

  if room.id is null then
    raise exception 'Room not found or no longer open';
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

  return room;
end;
$$;

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
  where r.id = target_room_id;

  if room.id is null then
    return;
  end if;

  if room.host_id = uid then
    update public.community_rooms
    set status = 'ended', updated_at = now()
    where id = room.id;
    delete from public.community_room_members where room_id = room.id;
    return;
  end if;

  delete from public.community_room_members
  where room_id = room.id
    and user_id = uid;
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
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  return query
  select r.*
  from public.community_rooms r
  inner join public.community_room_members m on m.room_id = r.id
  where m.user_id = uid
    and r.status in ('lobby', 'playing')
    and r.expires_at > now()
  order by r.created_at desc
  limit 1;
end;
$$;

-- Public join-decision profile card (limited fields + career highlights).
create or replace function public.get_community_profile(target_user_id uuid)
returns table (
  id uuid,
  display_name text,
  nickname text,
  avatar_url text,
  country_code text,
  throwing_hand text,
  skill_level text,
  preferred_game text,
  home_league text,
  member_since timestamptz,
  three_dart_average numeric,
  checkout_percent numeric,
  highest_checkout integer,
  matches_won integer,
  matches_played integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if target_user_id is null then
    return;
  end if;

  return query
  select
    p.id,
    p.display_name,
    p.nickname,
    p.avatar_url,
    p.country_code,
    p.throwing_hand,
    p.skill_level,
    p.preferred_game,
    p.home_league,
    p.created_at as member_since,
    case
      when coalesce(s.visits, 0) = 0 then 0::numeric
      else round((s.total_score::numeric / s.visits::numeric), 2)
    end as three_dart_average,
    case
      when coalesce(s.checkout_attempts, 0) = 0 then 0::numeric
      else round((s.checkout_successes::numeric / s.checkout_attempts::numeric) * 1000) / 10
    end as checkout_percent,
    coalesce(s.highest_checkout, 0) as highest_checkout,
    coalesce(s.matches_won, 0) as matches_won,
    coalesce(s.matches_played, 0) as matches_played
  from public.profiles p
  left join public.player_stats s on s.user_id = p.id
  where p.id = target_user_id
    and p.deactivated_at is null;
end;
$$;

revoke all on function public.generate_community_room_code() from public;
revoke all on function public.create_community_room() from public;
revoke all on function public.join_community_room(text) from public;
revoke all on function public.leave_community_room(uuid) from public;
revoke all on function public.get_my_community_room() from public;
revoke all on function public.get_community_profile(uuid) from public;

grant execute on function public.create_community_room() to authenticated;
grant execute on function public.join_community_room(text) to authenticated;
grant execute on function public.leave_community_room(uuid) to authenticated;
grant execute on function public.get_my_community_room() to authenticated;
grant execute on function public.get_community_profile(uuid) to authenticated;
