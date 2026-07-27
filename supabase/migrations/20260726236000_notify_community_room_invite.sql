-- In-app notification when a host invites a Vector player to a Community room.

create or replace function public.notify_community_room_invite(
  p_room_id uuid,
  p_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  room public.community_rooms;
  host_name text;
  notice_slug text;
  existing_id uuid;
  new_id uuid;
  invite_title text;
  invite_body text;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_room_id is null then
    raise exception 'Room is required';
  end if;

  if p_user_id is null then
    raise exception 'Player is required';
  end if;

  if p_user_id = uid then
    raise exception 'You cannot invite yourself';
  end if;

  select *
  into room
  from public.community_rooms r
  where r.id = p_room_id
  for update;

  if room.id is null then
    raise exception 'Room not found';
  end if;

  if room.host_id <> uid then
    raise exception 'Only the host can invite players to this room';
  end if;

  if room.status <> 'lobby' or room.expires_at <= now() then
    raise exception 'Room is no longer open';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = p_user_id
      and p.deactivated_at is null
  ) then
    raise exception 'Player not found';
  end if;

  select coalesce(nullif(trim(p.display_name), ''), 'A player')
  into host_name
  from public.profiles p
  where p.id = uid;

  invite_title := 'Community Play invite';
  invite_body :=
    host_name
    || ' invited you to a Community Play room. Use code '
    || room.code
    || ' to join.';

  notice_slug := 'community-invite:' || room.id::text || ':' || p_user_id::text;

  select id into existing_id
  from public.announcements
  where slug = notice_slug;

  if existing_id is not null then
    update public.announcements
    set
      title = invite_title,
      body = invite_body,
      cta_label = 'Open Community',
      cta_href = '/community',
      active = true,
      published_at = now(),
      updated_at = now()
    where id = existing_id;

    delete from public.announcement_reads
    where announcement_id = existing_id
      and user_id = p_user_id;

    return existing_id;
  end if;

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
    'Open Community',
    '/community',
    'all',
    'info',
    true,
    false,
    notice_slug,
    p_user_id,
    now()
  )
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.notify_community_room_invite(uuid, uuid) from public;
grant execute on function public.notify_community_room_invite(uuid, uuid) to authenticated;

notify pgrst, 'reload schema';
