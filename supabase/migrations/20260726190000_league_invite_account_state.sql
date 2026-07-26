-- On invite accept: paid members show as Vector Account; free players as Player Profile.
create or replace function public.accept_league_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invite public.league_player_invites%rowtype;
  profile_row public.profiles%rowtype;
  names record;
  next_vector_account text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into invite
  from public.league_player_invites
  where token = trim(p_token);

  if not found then
    raise exception 'Invite not found';
  end if;

  if invite.accepted_at is not null then
    raise exception 'Invite already accepted';
  end if;

  if invite.expires_at < now() then
    raise exception 'Invite expired';
  end if;

  select * into profile_row from public.profiles where id = auth.uid();

  if invite.email is not null
     and trim(invite.email) <> ''
     and lower(trim(invite.email)) <> lower(coalesce(auth.jwt() ->> 'email', '')) then
    raise exception 'Invite email does not match signed-in account';
  end if;

  next_vector_account := case
    when coalesce(profile_row.account_kind, 'player') = 'member' then 'connected'
    else 'profile-only'
  end;

  if invite.league_player_id is not null then
    if exists (
      select 1
      from public.league_players
      where league_id = invite.league_id
        and profile_user_id = auth.uid()
        and id <> invite.league_player_id
    ) then
      raise exception 'Already registered for this league';
    end if;

    update public.league_players
    set profile_user_id = auth.uid(),
        vector_account = next_vector_account,
        status = 'active',
        email = coalesce(nullif(trim(email), ''), auth.jwt() ->> 'email'),
        updated_at = now()
    where id = invite.league_player_id;
  else
    if exists (
      select 1
      from public.league_players
      where league_id = invite.league_id
        and profile_user_id = auth.uid()
    ) then
      update public.league_players
      set vector_account = next_vector_account,
          status = 'active',
          updated_at = now()
      where league_id = invite.league_id
        and profile_user_id = auth.uid();
    else
      select * into names from public.split_display_name(profile_row.display_name);
      insert into public.league_players (
        league_id,
        first_name,
        last_name,
        nickname,
        email,
        status,
        vector_account,
        profile_user_id,
        created_by
      )
      values (
        invite.league_id,
        names.first_name,
        names.last_name,
        profile_row.nickname,
        auth.jwt() ->> 'email',
        'active',
        next_vector_account,
        auth.uid(),
        coalesce(invite.invited_by, auth.uid())
      );
    end if;
  end if;

  update public.league_player_invites
  set accepted_at = now(),
      accepted_user_id = auth.uid()
  where id = invite.id;

  return invite.league_id;
end;
$$;
