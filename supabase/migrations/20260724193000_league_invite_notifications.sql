-- Send league invites as in-app announcements when the player has a Vector account.
-- Also deliver pending email-matched invites after a player signs in.

drop function if exists public.create_league_invite(uuid);

create or replace function public.create_league_invite(p_league_player_id uuid)
returns table (
  invite_id uuid,
  token text,
  expires_at timestamptz,
  notified boolean,
  recipient_user_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  player public.league_players%rowtype;
  league_name text;
  new_token text;
  new_id uuid;
  new_expires timestamptz;
  target_user_id uuid;
  notice_slug text;
  notice_href text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into player
  from public.league_players
  where id = p_league_player_id;

  if not found then
    raise exception 'League player not found';
  end if;

  if not exists (
    select 1
    from public.leagues l
    where l.id = player.league_id
      and public.has_organization_role(
        l.organization_id,
        array['owner', 'admin']::text[]
      )
  ) then
    raise exception 'Not allowed to invite for this league';
  end if;

  select l.name into league_name
  from public.leagues l
  where l.id = player.league_id;

  new_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  new_expires := now() + interval '14 days';

  insert into public.league_player_invites (
    league_id,
    league_player_id,
    email,
    token,
    invited_by,
    expires_at
  )
  values (
    player.league_id,
    player.id,
    player.email,
    new_token,
    auth.uid(),
    new_expires
  )
  returning id, league_player_invites.token, league_player_invites.expires_at
  into new_id, new_token, new_expires;

  update public.league_players
  set status = case when status = 'active' then status else 'invited' end,
      vector_account = case
        when vector_account = 'connected' then vector_account
        else 'invitation-pending'
      end,
      updated_at = now()
  where id = player.id;

  target_user_id := player.profile_user_id;

  if target_user_id is null
     and player.email is not null
     and trim(player.email) <> '' then
    select u.id into target_user_id
    from auth.users u
    where lower(u.email) = lower(trim(player.email))
    limit 1;

    if target_user_id is not null then
      update public.league_players
      set profile_user_id = target_user_id,
          updated_at = now()
      where id = player.id
        and profile_user_id is null;
    end if;
  end if;

  if target_user_id is not null then
    notice_slug := 'league-invite:' || player.league_id::text || ':' || target_user_id::text;
    notice_href := '/player/join/invite/' || new_token;

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
      published_at,
      ends_at
    )
    values (
      'League invite: ' || coalesce(nullif(trim(league_name), ''), 'League'),
      'You’ve been invited to join '
        || coalesce(nullif(trim(league_name), ''), 'a league')
        || '. Tap to accept.',
      'Accept invite',
      notice_href,
      'all',
      'info',
      true,
      false,
      notice_slug,
      target_user_id,
      now(),
      new_expires
    )
    on conflict (slug) do update
      set title = excluded.title,
          body = excluded.body,
          cta_label = excluded.cta_label,
          cta_href = excluded.cta_href,
          active = true,
          published_at = now(),
          ends_at = excluded.ends_at,
          recipient_user_id = excluded.recipient_user_id;
  end if;

  invite_id := new_id;
  token := new_token;
  expires_at := new_expires;
  notified := target_user_id is not null;
  recipient_user_id := target_user_id;
  return next;
end;
$$;

revoke all on function public.create_league_invite(uuid) from public;
grant execute on function public.create_league_invite(uuid) to authenticated;

-- After player signup/login, turn pending email invites into inbox notifications.
create or replace function public.deliver_pending_league_invites()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  user_email text;
  invite_row public.league_player_invites%rowtype;
  league_name text;
  notice_slug text;
  delivered integer := 0;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select lower(email) into user_email
  from auth.users
  where id = uid;

  if user_email is null or user_email = '' then
    return 0;
  end if;

  for invite_row in
    select *
    from public.league_player_invites i
    where i.accepted_at is null
      and i.expires_at > now()
      and i.email is not null
      and lower(trim(i.email)) = user_email
  loop
    update public.league_players
    set profile_user_id = coalesce(profile_user_id, uid),
        updated_at = now()
    where id = invite_row.league_player_id
      and (profile_user_id is null or profile_user_id = uid);

    select l.name into league_name
    from public.leagues l
    where l.id = invite_row.league_id;

    notice_slug := 'league-invite:' || invite_row.league_id::text || ':' || uid::text;

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
      published_at,
      ends_at
    )
    values (
      'League invite: ' || coalesce(nullif(trim(league_name), ''), 'League'),
      'You’ve been invited to join '
        || coalesce(nullif(trim(league_name), ''), 'a league')
        || '. Tap to accept.',
      'Accept invite',
      '/player/join/invite/' || invite_row.token,
      'all',
      'info',
      true,
      false,
      notice_slug,
      uid,
      now(),
      invite_row.expires_at
    )
    on conflict (slug) do update
      set title = excluded.title,
          body = excluded.body,
          cta_label = excluded.cta_label,
          cta_href = excluded.cta_href,
          active = true,
          published_at = greatest(public.announcements.published_at, now()),
          ends_at = excluded.ends_at,
          recipient_user_id = excluded.recipient_user_id;

    delivered := delivered + 1;
  end loop;

  return delivered;
end;
$$;

revoke all on function public.deliver_pending_league_invites() from public;
grant execute on function public.deliver_pending_league_invites() to authenticated;
