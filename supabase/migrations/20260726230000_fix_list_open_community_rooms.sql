-- Repair: ensure join-request table + list_open_community_rooms match the app.

alter table public.profiles
  add column if not exists country_code text;

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

alter table public.community_room_join_requests enable row level security;

drop function if exists public.list_open_community_rooms(integer);

create function public.list_open_community_rooms(result_limit integer default 30)
returns table (
  room_id uuid,
  room_code text,
  host_id uuid,
  created_at timestamptz,
  game_type text,
  rules jsonb,
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
    r.game_type,
    coalesce(r.rules, '{}'::jsonb) as rules,
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

revoke all on function public.list_open_community_rooms(integer) from public;
grant execute on function public.list_open_community_rooms(integer) to authenticated;
