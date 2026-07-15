-- Leagues belong to organizations (venues in League Management UI).

create table if not exists public.leagues (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leagues_name_not_blank check (char_length(trim(name)) > 0),
  constraint leagues_slug_not_blank check (char_length(trim(slug)) > 0),
  constraint leagues_org_slug_unique unique (organization_id, slug)
);

create index if not exists leagues_organization_id_idx
  on public.leagues (organization_id);

create index if not exists leagues_created_by_idx
  on public.leagues (created_by);

drop trigger if exists leagues_set_updated_at on public.leagues;
create trigger leagues_set_updated_at
  before update on public.leagues
  for each row
  execute function public.set_updated_at();

alter table public.leagues enable row level security;

create policy "Members can read org leagues"
  on public.leagues
  for select
  to authenticated
  using (public.is_organization_member(organization_id));

create policy "Owners and admins can update org leagues"
  on public.leagues
  for update
  to authenticated
  using (public.has_organization_role(organization_id, array['owner', 'admin']::text[]))
  with check (public.has_organization_role(organization_id, array['owner', 'admin']::text[]));

create or replace function public.create_league(
  org_id uuid,
  league_name text,
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

  if not public.has_organization_role(org_id, array['owner', 'admin']::text[]) then
    raise exception 'Not allowed to create a league for this venue';
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
    name,
    slug,
    description,
    created_by
  )
  values (
    org_id,
    trimmed_name,
    candidate_slug,
    trimmed_description,
    uid
  )
  returning * into new_league;

  return new_league;
end;
$$;

revoke all on function public.create_league(uuid, text, text) from public;
grant execute on function public.create_league(uuid, text, text) to authenticated;
