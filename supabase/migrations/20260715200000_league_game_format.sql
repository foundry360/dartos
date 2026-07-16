-- Game format for leagues (501, 301, 701, Cricket, Custom).

alter table public.leagues
  add column if not exists game_format text;

alter table public.leagues
  drop constraint if exists leagues_game_format_allowed;

alter table public.leagues
  add constraint leagues_game_format_allowed
  check (
    game_format is null
    or game_format in ('501', '301', '701', 'cricket', 'custom')
  );

drop function if exists public.create_league(
  uuid,
  text,
  uuid,
  text,
  timestamptz,
  timestamptz,
  text,
  integer,
  text
);

create or replace function public.create_league(
  org_id uuid,
  league_name text,
  season_id uuid,
  league_format text,
  league_starts_at timestamptz,
  league_ends_at timestamptz,
  league_description text default null,
  league_max_players integer default null,
  league_competition_format text default null,
  league_game_format text default null
)
returns public.leagues
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  trimmed_name text := trim(league_name);
  trimmed_description text := nullif(trim(coalesce(league_description, '')), '');
  trimmed_format text := lower(trim(coalesce(league_format, '')));
  trimmed_competition text := lower(trim(coalesce(league_competition_format, '')));
  trimmed_game text := lower(trim(coalesce(league_game_format, '')));
  base_slug text;
  candidate_slug text;
  suffix integer := 0;
  new_league public.leagues;
  season_org uuid;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if exists (
    select 1
    from public.subscriptions
    where user_id = uid
      and status in ('trialing', 'active', 'past_due')
  ) and not public.user_can_access_league_management() then
    raise exception 'League Pro subscription required for league management';
  end if;

  if org_id is null then
    raise exception 'Venue is required';
  end if;

  if season_id is null then
    raise exception 'Season is required';
  end if;

  if trimmed_format = '' or trimmed_format is null then
    raise exception 'League type is required';
  end if;

  if trimmed_format not in ('singles', 'team', 'doubles', 'blind_draw', 'ladder') then
    raise exception 'Invalid league type';
  end if;

  if trimmed_competition = '' then
    trimmed_competition := null;
  elsif trimmed_competition not in ('round_robin', 'points', 'ladder', 'custom') then
    raise exception 'Invalid league format';
  end if;

  if trimmed_game = '' then
    trimmed_game := null;
  elsif trimmed_game not in ('501', '301', '701', 'cricket', 'custom') then
    raise exception 'Invalid game format';
  end if;

  if league_starts_at is null then
    raise exception 'Start date and time is required';
  end if;

  if league_ends_at is null then
    raise exception 'Finish date and time is required';
  end if;

  if league_ends_at < league_starts_at then
    raise exception 'Finish must be on or after start';
  end if;

  if league_max_players is not null and league_max_players <= 0 then
    raise exception 'Maximum players must be greater than zero';
  end if;

  if not public.has_organization_role(org_id, array['owner', 'admin']::text[]) then
    raise exception 'Not allowed to create a league for this venue';
  end if;

  select organization_id into season_org
  from public.seasons
  where id = season_id;

  if season_org is null then
    raise exception 'Season not found';
  end if;

  if season_org <> org_id then
    raise exception 'Season does not belong to this venue';
  end if;

  if trimmed_name is null or trimmed_name = '' then
    raise exception 'League name is required';
  end if;

  base_slug := public.slugify_organization_name(trimmed_name);
  candidate_slug := base_slug;

  while exists (
    select 1
    from public.leagues
    where organization_id = org_id
      and slug = candidate_slug
  ) loop
    suffix := suffix + 1;
    candidate_slug := left(base_slug, 56) || '-' || suffix::text;
  end loop;

  insert into public.leagues (
    organization_id,
    season_id,
    name,
    slug,
    description,
    format,
    competition_format,
    game_format,
    max_players,
    starts_at,
    ends_at,
    created_by
  )
  values (
    org_id,
    season_id,
    trimmed_name,
    candidate_slug,
    trimmed_description,
    trimmed_format,
    trimmed_competition,
    trimmed_game,
    league_max_players,
    league_starts_at,
    league_ends_at,
    uid
  )
  returning * into new_league;

  return new_league;
end;
$$;

revoke all on function public.create_league(
  uuid,
  text,
  uuid,
  text,
  timestamptz,
  timestamptz,
  text,
  integer,
  text,
  text
) from public;

grant execute on function public.create_league(
  uuid,
  text,
  uuid,
  text,
  timestamptz,
  timestamptz,
  text,
  integer,
  text,
  text
) to authenticated;
