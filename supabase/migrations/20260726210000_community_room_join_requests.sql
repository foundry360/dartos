-- Browseable open rooms + host-approved join requests.

create table if not exists public.community_room_join_requests (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.community_rooms (id) on delete cascade,
  requester_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

create unique index if not exists community_room_join_requests_pending_uidx
  on public.community_room_join_requests (room_id, requester_id)
  where status = 'pending';

create index if not exists community_room_join_requests_room_id_idx
  on public.community_room_join_requests (room_id, status);

create index if not exists community_room_join_requests_requester_id_idx
  on public.community_room_join_requests (requester_id, status);

alter table public.community_room_join_requests enable row level security;

drop policy if exists "Participants can read join requests" on public.community_room_join_requests;
create policy "Participants can read join requests"
  on public.community_room_join_requests
  for select
  to authenticated
  using (
    requester_id = auth.uid()
    or exists (
      select 1
      from public.community_rooms r
      where r.id = community_room_join_requests.room_id
        and r.host_id = auth.uid()
    )
  );

create or replace function public.list_open_community_rooms(result_limit integer default 30)
returns table (
  room_id uuid,
  room_code text,
  host_id uuid,
  created_at timestamptz,
  host_display_name text,
  host_nickname text,
  host_avatar_url text,
  host_country_code text,
  host_three_dart_average numeric,
  already_requested boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  safe_limit integer := least(greatest(coalesce(result_limit, 30), 1), 50);
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  return query
  select
    r.id as room_id,
    r.code as room_code,
    r.host_id,
    r.created_at,
    p.display_name as host_display_name,
    p.nickname as host_nickname,
    p.avatar_url as host_avatar_url,
    p.country_code as host_country_code,
    case
      when coalesce(s.visits, 0) = 0 then 0::numeric
      else round((s.total_score::numeric / s.visits::numeric), 2)
    end as host_three_dart_average,
    exists (
      select 1
      from public.community_room_join_requests jr
      where jr.room_id = r.id
        and jr.requester_id = uid
        and jr.status = 'pending'
    ) as already_requested
  from public.community_rooms r
  inner join public.profiles p on p.id = r.host_id
  left join public.player_stats s on s.user_id = r.host_id
  where r.status = 'lobby'
    and r.expires_at > now()
    and r.host_id <> uid
    and p.deactivated_at is null
    and not exists (
      select 1
      from public.community_room_members m
      where m.room_id = r.id
        and m.user_id = uid
    )
    and not exists (
      select 1
      from public.community_room_members m
      where m.room_id = r.id
        and m.seat = 1
    )
  order by r.created_at desc
  limit safe_limit;
end;
$$;

create or replace function public.request_community_room_join(target_room_id uuid)
returns public.community_room_join_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  room public.community_rooms;
  request public.community_room_join_requests;
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
    and r.status = 'lobby'
    and r.expires_at > now()
  for update;

  if room.id is null then
    raise exception 'Room not found or no longer open';
  end if;

  if room.host_id = uid then
    raise exception 'You already host this room';
  end if;

  if exists (
    select 1
    from public.community_room_members m
    where m.room_id = room.id
      and m.seat = 1
  ) then
    raise exception 'This room is already full';
  end if;

  if exists (
    select 1
    from public.community_room_members m
    where m.room_id = room.id
      and m.user_id = uid
  ) then
    raise exception 'You are already in this room';
  end if;

  select *
  into request
  from public.community_room_join_requests jr
  where jr.room_id = room.id
    and jr.requester_id = uid
    and jr.status = 'pending'
  limit 1;

  if request.id is not null then
    return request;
  end if;

  insert into public.community_room_join_requests (room_id, requester_id, status)
  values (room.id, uid, 'pending')
  returning * into request;

  return request;
end;
$$;

create or replace function public.respond_community_room_join(
  target_request_id uuid,
  accept_request boolean
)
returns public.community_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  request public.community_room_join_requests;
  room public.community_rooms;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select *
  into request
  from public.community_room_join_requests jr
  where jr.id = target_request_id
  for update;

  if request.id is null then
    raise exception 'Join request not found';
  end if;

  if request.status <> 'pending' then
    raise exception 'This join request is no longer pending';
  end if;

  select *
  into room
  from public.community_rooms r
  where r.id = request.room_id
  for update;

  if room.id is null or room.host_id <> uid then
    raise exception 'Only the host can respond to join requests';
  end if;

  if room.status <> 'lobby' or room.expires_at <= now() then
    update public.community_room_join_requests
    set status = 'declined', responded_at = now()
    where id = request.id;
    raise exception 'Room is no longer open';
  end if;

  if not accept_request then
    update public.community_room_join_requests
    set status = 'declined', responded_at = now()
    where id = request.id;
    return room;
  end if;

  if exists (
    select 1
    from public.community_room_members m
    where m.room_id = room.id
      and m.seat = 1
  ) then
    update public.community_room_join_requests
    set status = 'declined', responded_at = now()
    where id = request.id;
    raise exception 'This room is already full';
  end if;

  insert into public.community_room_members (room_id, user_id, seat, role)
  values (room.id, request.requester_id, 1, 'player')
  on conflict (room_id, user_id) do update
    set seat = 1,
        role = 'player';

  update public.community_room_join_requests
  set status = 'accepted', responded_at = now()
  where id = request.id;

  update public.community_room_join_requests
  set status = 'declined', responded_at = now()
  where room_id = room.id
    and status = 'pending'
    and id <> request.id;

  return room;
end;
$$;

create or replace function public.list_community_room_join_requests(target_room_id uuid)
returns table (
  request_id uuid,
  room_id uuid,
  requester_id uuid,
  created_at timestamptz,
  requester_display_name text,
  requester_nickname text,
  requester_avatar_url text,
  requester_country_code text,
  requester_three_dart_average numeric
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

  if not exists (
    select 1
    from public.community_rooms r
    where r.id = target_room_id
      and r.host_id = uid
  ) then
    raise exception 'Only the host can view join requests';
  end if;

  return query
  select
    jr.id as request_id,
    jr.room_id,
    jr.requester_id,
    jr.created_at,
    p.display_name as requester_display_name,
    p.nickname as requester_nickname,
    p.avatar_url as requester_avatar_url,
    p.country_code as requester_country_code,
    case
      when coalesce(s.visits, 0) = 0 then 0::numeric
      else round((s.total_score::numeric / s.visits::numeric), 2)
    end as requester_three_dart_average
  from public.community_room_join_requests jr
  inner join public.profiles p on p.id = jr.requester_id
  left join public.player_stats s on s.user_id = jr.requester_id
  where jr.room_id = target_room_id
    and jr.status = 'pending'
  order by jr.created_at asc;
end;
$$;

-- Guests should refresh into a room after host accepts.
create or replace function public.get_my_pending_community_join()
returns table (
  request_id uuid,
  room_id uuid,
  room_code text,
  host_id uuid,
  status text
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

  return query
  select
    jr.id as request_id,
    jr.room_id,
    r.code as room_code,
    r.host_id,
    jr.status
  from public.community_room_join_requests jr
  inner join public.community_rooms r on r.id = jr.room_id
  where jr.requester_id = uid
    and jr.status = 'pending'
    and r.status = 'lobby'
    and r.expires_at > now()
  order by jr.created_at desc
  limit 10;
end;
$$;

revoke all on function public.list_open_community_rooms(integer) from public;
revoke all on function public.request_community_room_join(uuid) from public;
revoke all on function public.respond_community_room_join(uuid, boolean) from public;
revoke all on function public.list_community_room_join_requests(uuid) from public;
revoke all on function public.get_my_pending_community_join() from public;

grant execute on function public.list_open_community_rooms(integer) to authenticated;
grant execute on function public.request_community_room_join(uuid) to authenticated;
grant execute on function public.respond_community_room_join(uuid, boolean) to authenticated;
grant execute on function public.list_community_room_join_requests(uuid) to authenticated;
grant execute on function public.get_my_pending_community_join() to authenticated;
