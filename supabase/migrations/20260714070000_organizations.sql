-- Phase 1: Organizations foundation (orgs + memberships + create RPC)

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  logo_url text,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_name_not_blank check (char_length(trim(name)) > 0),
  constraint organizations_slug_not_blank check (char_length(trim(slug)) > 0)
);

create unique index if not exists organizations_slug_unique_idx
  on public.organizations (slug);

create index if not exists organizations_created_by_idx
  on public.organizations (created_by);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  constraint organization_members_unique_membership unique (organization_id, user_id)
);

create index if not exists organization_members_user_id_idx
  on public.organization_members (user_id);

create index if not exists organization_members_organization_id_idx
  on public.organization_members (organization_id);

drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at
  before update on public.organizations
  for each row
  execute function public.set_updated_at();

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

create or replace function public.is_organization_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = org_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.has_organization_role(org_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = org_id
      and user_id = auth.uid()
      and role = any (allowed_roles)
  );
$$;

revoke all on function public.is_organization_member(uuid) from public;
grant execute on function public.is_organization_member(uuid) to authenticated;

revoke all on function public.has_organization_role(uuid, text[]) from public;
grant execute on function public.has_organization_role(uuid, text[]) to authenticated;

create or replace function public.slugify_organization_name(raw_name text)
returns text
language plpgsql
immutable
as $$
declare
  slug text;
begin
  slug := lower(trim(raw_name));
  slug := regexp_replace(slug, '[^a-z0-9]+', '-', 'g');
  slug := regexp_replace(slug, '^-+|-+$', '', 'g');
  slug := left(slug, 60);

  if slug is null or slug = '' then
    slug := 'organization';
  end if;

  return slug;
end;
$$;

create or replace function public.create_organization(
  org_name text,
  org_description text default null
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
  base_slug text;
  candidate_slug text;
  suffix integer := 0;
  new_org public.organizations;
begin
  if uid is null then
    raise exception 'Not authenticated';
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
    created_by
  )
  values (
    trimmed_name,
    candidate_slug,
    trimmed_description,
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

revoke all on function public.create_organization(text, text) from public;
grant execute on function public.create_organization(text, text) to authenticated;

create policy "Members can read their organizations"
  on public.organizations
  for select
  to authenticated
  using (public.is_organization_member(id));

create policy "Owners can update their organizations"
  on public.organizations
  for update
  to authenticated
  using (public.has_organization_role(id, array['owner']::text[]))
  with check (public.has_organization_role(id, array['owner']::text[]));

create policy "Members can read organization memberships"
  on public.organization_members
  for select
  to authenticated
  using (public.is_organization_member(organization_id));
