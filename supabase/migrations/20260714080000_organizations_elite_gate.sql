-- Restrict organization (league management) writes to Elite subscribers.

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
      and lower(trim(plan_name)) = 'elite'
  );
$$;

revoke all on function public.user_has_elite_subscription() from public;
grant execute on function public.user_has_elite_subscription() to authenticated;

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

  -- Block Club (and any other non-Elite active plan). Allow when there is no
  -- active subscription row (local/dev without billing enforcement).
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

drop policy if exists "Owners can update their organizations" on public.organizations;

create policy "Elite owners can update their organizations"
  on public.organizations
  for update
  to authenticated
  using (
    public.has_organization_role(id, array['owner']::text[])
    and (
      public.user_has_elite_subscription()
      or not exists (
        select 1
        from public.subscriptions
        where user_id = auth.uid()
          and status in ('trialing', 'active', 'past_due')
      )
    )
  )
  with check (
    public.has_organization_role(id, array['owner']::text[])
    and (
      public.user_has_elite_subscription()
      or not exists (
        select 1
        from public.subscriptions
        where user_id = auth.uid()
          and status in ('trialing', 'active', 'past_due')
      )
    )
  );
