-- Free league player accounts: account_kind, join codes, invites, and join RPCs.

-- ---------------------------------------------------------------------------
-- profiles.account_kind
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists account_kind text not null default 'member';

alter table public.profiles
  drop constraint if exists profiles_account_kind_valid;

alter table public.profiles
  add constraint profiles_account_kind_valid
    check (account_kind in ('player', 'member'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  kind text;
begin
  kind := lower(coalesce(new.raw_user_meta_data ->> 'account_kind', 'member'));
  if kind not in ('player', 'member') then
    kind := 'member';
  end if;

  insert into public.profiles (id, display_name, preferred_board_theme_id, account_kind)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.email),
    'classic',
    kind
  );

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- leagues: join_code + registration_mode
-- ---------------------------------------------------------------------------

alter table public.leagues
  add column if not exists join_code text;

alter table public.leagues
  add column if not exists registration_mode text not null default 'invite_only';

alter table public.leagues
  drop constraint if exists leagues_registration_mode_valid;

alter table public.leagues
  add constraint leagues_registration_mode_valid
    check (registration_mode in ('invite_only', 'code', 'open'));

create unique index if not exists leagues_join_code_uidx
  on public.leagues (join_code)
  where join_code is not null;

-- ---------------------------------------------------------------------------
-- league_player_invites
-- ---------------------------------------------------------------------------

create table if not exists public.league_player_invites (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues (id) on delete cascade,
  league_player_id uuid references public.league_players (id) on delete cascade,
  email text,
  token text not null,
  invited_by uuid not null references auth.users (id) on delete restrict,
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  accepted_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists league_player_invites_token_uidx
  on public.league_player_invites (token);

create index if not exists league_player_invites_league_id_idx
  on public.league_player_invites (league_id);

create index if not exists league_player_invites_player_id_idx
  on public.league_player_invites (league_player_id);

alter table public.league_player_invites enable row level security;

create policy "Org admins can read league invites"
  on public.league_player_invites
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.leagues l
      where l.id = league_id
        and public.has_organization_role(
          l.organization_id,
          array['owner', 'admin']::text[]
        )
    )
  );

create policy "Org admins can insert league invites"
  on public.league_player_invites
  for insert
  to authenticated
  with check (
    invited_by = auth.uid()
    and exists (
      select 1
      from public.leagues l
      where l.id = league_id
        and public.has_organization_role(
          l.organization_id,
          array['owner', 'admin']::text[]
        )
    )
  );

create policy "Org admins can update league invites"
  on public.league_player_invites
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.leagues l
      where l.id = league_id
        and public.has_organization_role(
          l.organization_id,
          array['owner', 'admin']::text[]
        )
    )
  );

-- ---------------------------------------------------------------------------
-- Discovery RLS: published joinable leagues readable by any authenticated user
-- ---------------------------------------------------------------------------

drop policy if exists "Authenticated can read joinable published leagues" on public.leagues;
create policy "Authenticated can read joinable published leagues"
  on public.leagues
  for select
  to authenticated
  using (
    published_at is not null
    and registration_mode in ('open', 'code')
  );

-- Connected / pending roster players can read their own league_players row
drop policy if exists "Players can read own league membership" on public.league_players;
create policy "Players can read own league membership"
  on public.league_players
  for select
  to authenticated
  using (profile_user_id = auth.uid());

-- Broader membership helper so pending free-player registrations can read league data
create or replace function public.is_connected_league_player(p_league_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.league_players lp
    where lp.league_id = p_league_id
      and lp.profile_user_id = auth.uid()
      and lp.status in ('active', 'pending', 'invited')
      and lp.vector_account in ('connected', 'invitation-pending')
  );
$$;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.generate_league_join_code()
returns text
language plpgsql
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..8 loop
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return result;
end;
$$;

create or replace function public.split_display_name(p_name text)
returns table (first_name text, last_name text)
language plpgsql
immutable
as $$
declare
  trimmed text := trim(coalesce(p_name, ''));
  space_at int;
begin
  if trimmed = '' then
    first_name := 'Player';
    last_name := '';
    return next;
    return;
  end if;

  space_at := position(' ' in trimmed);
  if space_at = 0 then
    first_name := trimmed;
    last_name := '';
  else
    first_name := substr(trimmed, 1, space_at - 1);
    last_name := trim(substr(trimmed, space_at + 1));
  end if;
  return next;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

create or replace function public.rotate_league_join_code(p_league_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
  attempts int := 0;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
    from public.leagues l
    where l.id = p_league_id
      and public.has_organization_role(
        l.organization_id,
        array['owner', 'admin']::text[]
      )
  ) then
    raise exception 'Not allowed to manage this league';
  end if;

  loop
    new_code := public.generate_league_join_code();
    begin
      update public.leagues
      set join_code = new_code,
          registration_mode = case
            when registration_mode = 'invite_only' then 'code'
            else registration_mode
          end,
          updated_at = now()
      where id = p_league_id;
      return new_code;
    exception
      when unique_violation then
        attempts := attempts + 1;
        if attempts > 8 then
          raise;
        end if;
    end;
  end loop;
end;
$$;

revoke all on function public.rotate_league_join_code(uuid) from public;
grant execute on function public.rotate_league_join_code(uuid) to authenticated;

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

  new_token := encode(gen_random_bytes(24), 'hex');
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
        vector_account = 'connected',
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
      set vector_account = 'connected',
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
        'connected',
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

revoke all on function public.accept_league_invite(text) from public;
grant execute on function public.accept_league_invite(text) to authenticated;

create or replace function public.join_league_by_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  league_row public.leagues%rowtype;
  profile_row public.profiles%rowtype;
  names record;
  existing_id uuid;
  normalized text := upper(trim(coalesce(p_code, '')));
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if normalized = '' then
    raise exception 'Join code is required';
  end if;

  select * into league_row
  from public.leagues
  where join_code = normalized
    and registration_mode in ('code', 'open');

  if not found then
    raise exception 'Invalid join code';
  end if;

  select id into existing_id
  from public.league_players
  where league_id = league_row.id
    and profile_user_id = auth.uid()
  limit 1;

  if existing_id is not null then
    update public.league_players
    set vector_account = 'connected',
        status = 'active',
        updated_at = now()
    where id = existing_id;
    return league_row.id;
  end if;

  select * into profile_row from public.profiles where id = auth.uid();
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
    league_row.id,
    names.first_name,
    names.last_name,
    profile_row.nickname,
    auth.jwt() ->> 'email',
    'active',
    'connected',
    auth.uid(),
    auth.uid()
  );

  return league_row.id;
end;
$$;

revoke all on function public.join_league_by_code(text) from public;
grant execute on function public.join_league_by_code(text) to authenticated;

create or replace function public.request_league_registration(p_league_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  league_row public.leagues%rowtype;
  profile_row public.profiles%rowtype;
  names record;
  existing_id uuid;
  next_status text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into league_row
  from public.leagues
  where id = p_league_id
    and published_at is not null
    and registration_mode in ('open', 'code');

  if not found then
    raise exception 'League is not open for registration';
  end if;

  select id into existing_id
  from public.league_players
  where league_id = league_row.id
    and profile_user_id = auth.uid()
  limit 1;

  if existing_id is not null then
    return existing_id;
  end if;

  next_status := case
    when league_row.registration_mode = 'open' then 'active'
    else 'pending'
  end;

  select * into profile_row from public.profiles where id = auth.uid();
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
    league_row.id,
    names.first_name,
    names.last_name,
    profile_row.nickname,
    auth.jwt() ->> 'email',
    next_status,
    case when next_status = 'active' then 'connected' else 'invitation-pending' end,
    auth.uid(),
    auth.uid()
  )
  returning id into existing_id;

  return existing_id;
end;
$$;

revoke all on function public.request_league_registration(uuid) from public;
grant execute on function public.request_league_registration(uuid) to authenticated;

create or replace function public.approve_league_registration(p_league_player_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  player public.league_players%rowtype;
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
    raise exception 'Not allowed to approve registrations';
  end if;

  update public.league_players
  set status = 'active',
      vector_account = case
        when profile_user_id is not null then 'connected'
        else vector_account
      end,
      updated_at = now()
  where id = player.id;
end;
$$;

revoke all on function public.approve_league_registration(uuid) from public;
grant execute on function public.approve_league_registration(uuid) to authenticated;

create or replace function public.search_joinable_leagues(
  search_query text default '',
  result_limit int default 20
)
returns table (
  id uuid,
  name text,
  slug text,
  description text,
  organization_id uuid,
  organization_name text,
  registration_mode text,
  starts_at timestamptz,
  ends_at timestamptz,
  published_at timestamptz,
  game_format text,
  format text
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  q text := trim(coalesce(search_query, ''));
  lim int := greatest(1, least(coalesce(result_limit, 20), 50));
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  return query
  select
    l.id,
    l.name,
    l.slug,
    l.description,
    l.organization_id,
    o.name as organization_name,
    l.registration_mode,
    l.starts_at,
    l.ends_at,
    l.published_at,
    l.game_format,
    l.format
  from public.leagues l
  join public.organizations o on o.id = l.organization_id
  where l.published_at is not null
    and l.registration_mode in ('open', 'code')
    and not exists (
      select 1
      from public.league_players lp
      where lp.league_id = l.id
        and lp.profile_user_id = auth.uid()
    )
    and (
      q = ''
      or l.name ilike '%' || q || '%'
      or o.name ilike '%' || q || '%'
      or coalesce(l.description, '') ilike '%' || q || '%'
    )
  order by l.starts_at nulls last, l.name
  limit lim;
end;
$$;

revoke all on function public.search_joinable_leagues(text, int) from public;
grant execute on function public.search_joinable_leagues(text, int) to authenticated;

create or replace function public.update_league_registration_settings(
  p_league_id uuid,
  p_registration_mode text,
  p_ensure_join_code boolean default false
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  mode text := lower(trim(coalesce(p_registration_mode, '')));
  current_code text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if mode not in ('invite_only', 'code', 'open') then
    raise exception 'Invalid registration mode';
  end if;

  if not exists (
    select 1
    from public.leagues l
    where l.id = p_league_id
      and public.has_organization_role(
        l.organization_id,
        array['owner', 'admin']::text[]
      )
  ) then
    raise exception 'Not allowed to manage this league';
  end if;

  update public.leagues
  set registration_mode = mode,
      updated_at = now()
  where id = p_league_id
  returning join_code into current_code;

  if (mode in ('code', 'open') and (current_code is null or p_ensure_join_code))
     or p_ensure_join_code then
    return public.rotate_league_join_code(p_league_id);
  end if;

  return current_code;
end;
$$;

revoke all on function public.update_league_registration_settings(uuid, text, boolean) from public;
grant execute on function public.update_league_registration_settings(uuid, text, boolean) to authenticated;
