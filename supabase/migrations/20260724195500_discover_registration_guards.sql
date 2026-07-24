-- Discover: return roster capacity, and block registration when closed/full/in progress/completed.

drop function if exists public.search_joinable_leagues(text, int);

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
  format text,
  max_players integer,
  player_count integer
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
    l.format,
    l.max_players,
    (
      select count(*)::integer
      from public.league_players lp
      where lp.league_id = l.id
        and lp.status in ('active', 'invited', 'pending')
    ) as player_count
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

create or replace function public.assert_league_registration_open(p_league public.leagues)
returns void
language plpgsql
stable
set search_path = public
as $$
declare
  roster_count integer;
begin
  if p_league.published_at is null
     or p_league.registration_mode not in ('open', 'code') then
    raise exception 'League is not open for registration';
  end if;

  if p_league.ends_at is not null and p_league.ends_at < now() then
    raise exception 'League is completed';
  end if;

  if p_league.starts_at is not null and p_league.starts_at <= now() then
    raise exception 'League is already in progress';
  end if;

  if p_league.max_players is not null and p_league.max_players > 0 then
    select count(*)::integer into roster_count
    from public.league_players lp
    where lp.league_id = p_league.id
      and lp.status in ('active', 'invited', 'pending');

    if roster_count >= p_league.max_players then
      raise exception 'League is full';
    end if;
  end if;
end;
$$;

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
  where id = p_league_id;

  if not found then
    raise exception 'League not found';
  end if;

  perform public.assert_league_registration_open(league_row);

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

  perform public.assert_league_registration_open(league_row);

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
