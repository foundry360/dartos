-- Ensure join-request list RPC is present and PostgREST can see community tables.

create table if not exists public.community_room_join_requests (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.community_rooms (id) on delete cascade,
  requester_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

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
    jr.id,
    jr.room_id,
    jr.requester_id,
    jr.created_at,
    p.display_name,
    p.nickname,
    p.avatar_url,
    p.country_code,
    case
      when coalesce(s.visits, 0) = 0 then 0::numeric
      else round((s.total_score::numeric / s.visits::numeric), 2)
    end
  from public.community_room_join_requests jr
  inner join public.profiles p on p.id = jr.requester_id
  left join public.player_stats s on s.user_id = jr.requester_id
  where jr.room_id = target_room_id
    and jr.status = 'pending'
  order by jr.created_at asc;
end;
$$;

revoke all on function public.list_community_room_join_requests(uuid) from public;
grant execute on function public.list_community_room_join_requests(uuid) to authenticated;

notify pgrst, 'reload schema';
