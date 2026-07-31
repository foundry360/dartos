-- Friend-request announcements: clearer CTA + clear notice on respond/cancel.
-- Safe to run even if 20260727260000 already applied.

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

notify pgrst, 'reload schema';
