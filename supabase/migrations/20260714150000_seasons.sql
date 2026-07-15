-- Seasons for venues; leagues optionally (and for new creates, required) belong to a season.

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  slug text not null,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seasons_name_not_blank check (char_length(trim(name)) > 0),
  constraint seasons_slug_not_blank check (char_length(trim(slug)) > 0),
  constraint seasons_org_slug_unique unique (organization_id, slug)
);

create index if not exists seasons_organization_id_idx
  on public.seasons (organization_id);

drop trigger if exists seasons_set_updated_at on public.seasons;
create trigger seasons_set_updated_at
  before update on public.seasons
  for each row
  execute function public.set_updated_at();

alter table public.seasons enable row level security;

create policy "Members can read org seasons"
  on public.seasons
  for select
  to authenticated
  using (public.is_organization_member(organization_id));

create policy "Owners and admins can update org seasons"
  on public.seasons
  for update
  to authenticated
  using (public.has_organization_role(organization_id, array['owner', 'admin']::text[]))
  with check (public.has_organization_role(organization_id, array['owner', 'admin']::text[]));

alter table public.leagues
  add column if not exists season_id uuid references public.seasons (id) on delete restrict;

create index if not exists leagues_season_id_idx
  on public.leagues (season_id);

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
  ) and not public.user_has_elite_subscription() then
    raise exception 'Elite subscription required to create a season';
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

drop function if exists public.create_league(uuid, text, text);

create or replace function public.create_league(
  org_id uuid,
  league_name text,
  season_id uuid,
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
    created_by
  )
  values (
    org_id,
    season_id,
    trimmed_name,
    candidate_slug,
    trimmed_description,
    uid
  )
  returning * into new_league;

  return new_league;
end;
$$;

revoke all on function public.create_league(uuid, text, uuid, text) from public;
grant execute on function public.create_league(uuid, text, uuid, text) to authenticated;
