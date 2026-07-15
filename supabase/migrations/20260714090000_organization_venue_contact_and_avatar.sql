-- Venue contact fields for organizations (venues in League Management UI).

alter table public.organizations
  add column if not exists primary_contact_name text,
  add column if not exists primary_contact_email text,
  add column if not exists primary_contact_phone text;

drop function if exists public.create_organization(text, text);
drop function if exists public.create_organization(text, text, text, text, text);

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
  ) and not public.user_has_elite_subscription() then
    raise exception 'Elite subscription required to create an organization';
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
