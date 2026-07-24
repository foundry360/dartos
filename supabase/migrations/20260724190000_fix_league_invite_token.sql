-- Fix create_league_invite: search_path=public hides extensions.gen_random_bytes.
create or replace function public.create_league_invite(p_league_player_id uuid)
returns table (invite_id uuid, token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  player public.league_players%rowtype;
  new_token text;
  new_id uuid;
  new_expires timestamptz;
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

  -- Avoid extensions.gen_random_bytes (not on search_path=public).
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

  invite_id := new_id;
  token := new_token;
  expires_at := new_expires;
  return next;
end;
$$;

revoke all on function public.create_league_invite(uuid) from public;
grant execute on function public.create_league_invite(uuid) to authenticated;
