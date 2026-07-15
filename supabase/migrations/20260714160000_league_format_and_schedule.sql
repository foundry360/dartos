-- League format + schedule window.

alter table public.leagues
  add column if not exists format text,
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz;

alter table public.leagues
  drop constraint if exists leagues_format_allowed;

alter table public.leagues
  add constraint leagues_format_allowed
  check (
    format is null
    or format in ('cricket', 'tactics', '201', '301', '501', '701')
  );

alter table public.leagues
  drop constraint if exists leagues_schedule_order;

alter table public.leagues
  add constraint leagues_schedule_order
  check (
    starts_at is null
    or ends_at is null
    or ends_at >= starts_at
  );

drop function if exists public.create_league(uuid, text, uuid, text);

create or replace function public.create_league(
  org_id uuid,
  league_name text,
  season_id uuid,
  league_format text,
  league_starts_at timestamptz,
  league_ends_at timestamptz,
  league_description text default null
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
  ) and not public.user_has_elite_subscription() then
    raise exception 'Elite subscription required to create a league';
  end if;

  if org_id is null then
    raise exception 'Venue is required';
  end if;

  if season_id is null then
    raise exception 'Season is required';
  end if;

  if trimmed_format = '' or trimmed_format is null then
    raise exception 'League format is required';
  end if;

  if trimmed_format not in ('cricket', 'tactics', '201', '301', '501', '701') then
    raise exception 'Invalid league format';
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
    league_starts_at,
    league_ends_at,
    uid
  )
  returning * into new_league;

  return new_league;
end;
$$;

revoke all on function public.create_league(uuid, text, uuid, text, timestamptz, timestamptz, text) from public;
grant execute on function public.create_league(uuid, text, uuid, text, timestamptz, timestamptz, text) to authenticated;
