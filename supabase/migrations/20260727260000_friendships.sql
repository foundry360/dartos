-- Friendships: request / accept graph for Community (and later matchmaking).

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users (id) on delete cascade,
  addressee_id uuid not null references auth.users (id) on delete cascade,
  status text not null
    check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint friendships_distinct_users check (requester_id <> addressee_id)
);

create unique index if not exists friendships_ordered_pair_uidx
  on public.friendships (requester_id, addressee_id);

create unique index if not exists friendships_unordered_pair_uidx
  on public.friendships (
    least(requester_id, addressee_id),
    greatest(requester_id, addressee_id)
  );

create index if not exists friendships_addressee_pending_idx
  on public.friendships (addressee_id, created_at desc)
  where status = 'pending';

create index if not exists friendships_requester_idx
  on public.friendships (requester_id, status);

alter table public.friendships enable row level security;

drop policy if exists "Users read own friendships" on public.friendships;
create policy "Users read own friendships"
  on public.friendships
  for select
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Mutations go through security-definer RPCs only.
revoke insert, update, delete on public.friendships from authenticated;
revoke insert, update, delete on public.friendships from anon;

create or replace function public.get_friendship_status(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  row public.friendships;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_user_id is null then
    raise exception 'Player is required';
  end if;

  if p_user_id = uid then
    return 'self';
  end if;

  select *
  into row
  from public.friendships f
  where (f.requester_id = uid and f.addressee_id = p_user_id)
     or (f.requester_id = p_user_id and f.addressee_id = uid)
  limit 1;

  if row.id is null then
    return 'none';
  end if;

  if row.status = 'accepted' then
    return 'friends';
  end if;

  if row.status = 'pending' then
    if row.requester_id = uid then
      return 'pending_outgoing';
    end if;
    return 'pending_incoming';
  end if;

  -- declined / cancelled → allow a new request from the UI
  return 'none';
end;
$$;

create or replace function public.request_friend(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  existing public.friendships;
  requester_name text;
  notice_slug text;
  existing_notice uuid;
  invite_title text;
  invite_body text;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_user_id is null then
    raise exception 'Player is required';
  end if;

  if p_user_id = uid then
    raise exception 'You cannot add yourself';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = p_user_id
      and p.deactivated_at is null
  ) then
    raise exception 'Player not found';
  end if;

  select *
  into existing
  from public.friendships f
  where (f.requester_id = uid and f.addressee_id = p_user_id)
     or (f.requester_id = p_user_id and f.addressee_id = uid)
  limit 1
  for update;

  if existing.id is not null then
    if existing.status = 'accepted' then
      return 'friends';
    end if;

    if existing.status = 'pending' then
      if existing.requester_id = uid then
        return 'pending_outgoing';
      end if;
      return 'pending_incoming';
    end if;

    -- Re-open declined/cancelled as a fresh request from current user.
    update public.friendships
    set
      requester_id = uid,
      addressee_id = p_user_id,
      status = 'pending',
      created_at = now(),
      responded_at = null
    where id = existing.id;
  else
    insert into public.friendships (requester_id, addressee_id, status)
    values (uid, p_user_id, 'pending');
  end if;

  select coalesce(nullif(trim(p.display_name), ''), 'A player')
  into requester_name
  from public.profiles p
  where p.id = uid;

  invite_title := 'Friend request';
  invite_body := requester_name || ' wants to be friends on Vector.';
  notice_slug := 'friend-request:' || uid::text || ':' || p_user_id::text;

  select id into existing_notice
  from public.announcements
  where slug = notice_slug;

  if existing_notice is not null then
    update public.announcements
    set
      title = invite_title,
      body = invite_body,
      cta_label = 'Open Friends',
      cta_href = '/friends',
      active = true,
      published_at = now(),
      updated_at = now()
    where id = existing_notice;

    delete from public.announcement_reads
    where announcement_id = existing_notice
      and user_id = p_user_id;
  else
    insert into public.announcements (
      title,
      body,
      cta_label,
      cta_href,
      audience,
      severity,
      active,
      is_signup_default,
      slug,
      recipient_user_id,
      published_at
    )
    values (
      invite_title,
      invite_body,
      'Open Friends',
      '/friends',
      'all',
      'info',
      true,
      false,
      notice_slug,
      p_user_id,
      now()
    );
  end if;

  return 'pending_outgoing';
end;
$$;

create or replace function public.respond_friend_request(
  p_requester_id uuid,
  p_accept boolean
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  existing public.friendships;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_requester_id is null then
    raise exception 'Player is required';
  end if;

  select *
  into existing
  from public.friendships f
  where f.requester_id = p_requester_id
    and f.addressee_id = uid
    and f.status = 'pending'
  for update;

  if existing.id is null then
    raise exception 'Friend request not found';
  end if;

  if p_accept then
    update public.friendships
    set status = 'accepted', responded_at = now()
    where id = existing.id;
  else
    update public.friendships
    set status = 'declined', responded_at = now()
    where id = existing.id;
  end if;

  -- Clear the in-app notification once the recipient responds.
  update public.announcements
  set active = false, updated_at = now()
  where slug = 'friend-request:' || p_requester_id::text || ':' || uid::text
    and recipient_user_id = uid;

  if p_accept then
    return 'friends';
  end if;

  return 'none';
end;
$$;

create or replace function public.cancel_friend_request(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  existing public.friendships;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select *
  into existing
  from public.friendships f
  where f.requester_id = uid
    and f.addressee_id = p_user_id
    and f.status = 'pending'
  for update;

  if existing.id is null then
    return public.get_friendship_status(p_user_id);
  end if;

  update public.friendships
  set status = 'cancelled', responded_at = now()
  where id = existing.id;

  update public.announcements
  set active = false, updated_at = now()
  where slug = 'friend-request:' || uid::text || ':' || p_user_id::text
    and recipient_user_id = p_user_id;

  return 'none';
end;
$$;

create or replace function public.list_pending_friend_requests()
returns table (
  requester_id uuid,
  display_name text,
  nickname text,
  avatar_url text,
  country_code text,
  created_at timestamptz
)
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
  select
    f.requester_id,
    p.display_name,
    p.nickname,
    p.avatar_url,
    p.country_code,
    f.created_at
  from public.friendships f
  join public.profiles p on p.id = f.requester_id
  where f.addressee_id = uid
    and f.status = 'pending'
    and p.deactivated_at is null
  order by f.created_at desc;
end;
$$;

create or replace function public.list_friends()
returns table (
  friend_id uuid,
  display_name text,
  nickname text,
  avatar_url text,
  country_code text,
  friends_since timestamptz
)
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
  select
    case
      when f.requester_id = uid then f.addressee_id
      else f.requester_id
    end as friend_id,
    p.display_name,
    p.nickname,
    p.avatar_url,
    p.country_code,
    coalesce(f.responded_at, f.created_at) as friends_since
  from public.friendships f
  join public.profiles p
    on p.id = case
      when f.requester_id = uid then f.addressee_id
      else f.requester_id
    end
  where f.status = 'accepted'
    and (f.requester_id = uid or f.addressee_id = uid)
    and p.deactivated_at is null
  order by friends_since desc;
end;
$$;

revoke all on function public.get_friendship_status(uuid) from public;
revoke all on function public.request_friend(uuid) from public;
revoke all on function public.respond_friend_request(uuid, boolean) from public;
revoke all on function public.cancel_friend_request(uuid) from public;
revoke all on function public.list_pending_friend_requests() from public;
revoke all on function public.list_friends() from public;

grant execute on function public.get_friendship_status(uuid) to authenticated;
grant execute on function public.request_friend(uuid) to authenticated;
grant execute on function public.respond_friend_request(uuid, boolean) to authenticated;
grant execute on function public.cancel_friend_request(uuid) to authenticated;
grant execute on function public.list_pending_friend_requests() to authenticated;
grant execute on function public.list_friends() to authenticated;

notify pgrst, 'reload schema';
