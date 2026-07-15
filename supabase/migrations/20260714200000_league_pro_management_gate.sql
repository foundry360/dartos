-- League management requires League Pro. Elite (+ League Pro) keeps league-play eligibility.

create or replace function public.user_has_elite_subscription()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.subscriptions
    where user_id = auth.uid()
      and status in ('trialing', 'active', 'past_due')
      and lower(trim(plan_name)) in ('elite', 'league pro')
  );
$$;

revoke all on function public.user_has_elite_subscription() from public;
grant execute on function public.user_has_elite_subscription() to authenticated;

create or replace function public.user_can_access_league_management()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.subscriptions
    where user_id = auth.uid()
      and status in ('trialing', 'active', 'past_due')
      and lower(trim(plan_name)) = 'league pro'
  );
$$;

revoke all on function public.user_can_access_league_management() from public;
grant execute on function public.user_can_access_league_management() to authenticated;

create or replace function public.create_organization(
  org_name text,
  org_description text default null,
  contact_name text default null,
  contact_email text default null,
  contact_phone text default null
)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  trimmed_name text := trim(org_name);
  trimmed_description text := nullif(trim(coalesce(org_description, '')), '');
  trimmed_contact_name text := nullif(trim(coalesce(contact_name, '')), '');
  trimmed_contact_email text := nullif(trim(coalesce(contact_email, '')), '');
  trimmed_contact_phone text := nullif(trim(coalesce(contact_phone, '')), '');
  base_slug text;
  candidate_slug text;
  suffix integer := 0;
  new_org public.organizations;
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

  if trimmed_name is null or trimmed_name = '' then
    raise exception 'Organization name is required';
  end if;

  base_slug := public.slugify_organization_name(trimmed_name);
  candidate_slug := base_slug;

  while exists (
    select 1 from public.organizations where slug = candidate_slug
  ) loop
    suffix := suffix + 1;
    candidate_slug := left(base_slug, 56) || '-' || suffix::text;
  end loop;

  insert into public.organizations (
    name,
    slug,
    description,
    primary_contact_name,
    primary_contact_email,
    primary_contact_phone,
    created_by
  )
  values (
    trimmed_name,
    candidate_slug,
    trimmed_description,
    trimmed_contact_name,
    trimmed_contact_email,
    trimmed_contact_phone,
    uid
  )
  returning * into new_org;

  insert into public.organization_members (
    organization_id,
    user_id,
    role
  )
  values (
    new_org.id,
    uid,
    'owner'
  );

  return new_org;
end;
$$;

revoke all on function public.create_organization(text, text, text, text, text) from public;
grant execute on function public.create_organization(text, text, text, text, text) to authenticated;

drop policy if exists "Owners can update organizations" on public.organizations;
drop policy if exists "Elite owners can update their organizations" on public.organizations;
drop policy if exists "Owners can update their organizations" on public.organizations;

create policy "League Pro owners can update their organizations"
  on public.organizations
  for update
  to authenticated
  using (
    public.has_organization_role(id, array['owner']::text[])
    and (
      not exists (
        select 1
        from public.subscriptions
        where user_id = auth.uid()
          and status in ('trialing', 'active', 'past_due')
      )
      or public.user_can_access_league_management()
    )
  )
  with check (
    public.has_organization_role(id, array['owner']::text[])
    and (
      not exists (
        select 1
        from public.subscriptions
        where user_id = auth.uid()
          and status in ('trialing', 'active', 'past_due')
      )
      or public.user_can_access_league_management()
    )
  );

create or replace function public.create_season(
  org_id uuid,
  season_name text
)
returns public.seasons
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  trimmed_name text := trim(season_name);
  base_slug text;
  candidate_slug text;
  suffix integer := 0;
  new_season public.seasons;
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

  if not public.has_organization_role(org_id, array['owner', 'admin']::text[]) then
    raise exception 'Not allowed to create a season for this venue';
  end if;

  if trimmed_name is null or trimmed_name = '' then
    raise exception 'Season name is required';
  end if;

  base_slug := public.slugify_organization_name(trimmed_name);
  candidate_slug := base_slug;

  while exists (
    select 1
    from public.seasons
    where organization_id = org_id
      and slug = candidate_slug
  ) loop
    suffix := suffix + 1;
    candidate_slug := left(base_slug, 56) || '-' || suffix::text;
  end loop;

  insert into public.seasons (
    organization_id,
    name,
    slug,
    created_by
  )
  values (
    org_id,
    trimmed_name,
    candidate_slug,
    uid
  )
  returning * into new_season;

  return new_season;
end;
$$;

revoke all on function public.create_season(uuid, text) from public;
grant execute on function public.create_season(uuid, text) to authenticated;

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
