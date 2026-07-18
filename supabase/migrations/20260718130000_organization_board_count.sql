-- Venue board capacity for League Night Boards card + Match Control dropdowns.

alter table public.organizations
  add column if not exists board_count integer not null default 4;

alter table public.organizations
  drop constraint if exists organizations_board_count_check;

alter table public.organizations
  add constraint organizations_board_count_check
  check (board_count >= 1 and board_count <= 64);

drop function if exists public.create_organization(text, text, text, text, text);
drop function if exists public.create_organization(text, text, text, text, text, integer);

create or replace function public.create_organization(
  org_name text,
  org_description text default null,
  contact_name text default null,
  contact_email text default null,
  contact_phone text default null,
  org_board_count integer default 4
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
  resolved_board_count integer := greatest(1, least(64, coalesce(org_board_count, 4)));
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
    board_count,
    created_by
  )
  values (
    trimmed_name,
    candidate_slug,
    trimmed_description,
    trimmed_contact_name,
    trimmed_contact_email,
    trimmed_contact_phone,
    resolved_board_count,
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

revoke all on function public.create_organization(text, text, text, text, text, integer) from public;
grant execute on function public.create_organization(text, text, text, text, text, integer) to authenticated;
