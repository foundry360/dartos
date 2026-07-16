-- Targeted in-app announcements (per recipient) for league registration, etc.

alter table public.announcements
  add column if not exists recipient_user_id uuid references auth.users (id) on delete cascade;

create index if not exists announcements_recipient_user_id_idx
  on public.announcements (recipient_user_id)
  where recipient_user_id is not null;

drop policy if exists "Authenticated users read active announcements"
  on public.announcements;

create policy "Authenticated users read active announcements"
  on public.announcements
  for select
  to authenticated
  using (
    active = true
    and published_at <= now()
    and (ends_at is null or ends_at > now())
    and audience = 'all'
    and (
      recipient_user_id is null
      or recipient_user_id = auth.uid()
    )
  );

-- League directors notify a Vector user that they were registered on a league.
create or replace function public.notify_league_player_registered(
  p_league_id uuid,
  p_user_id uuid,
  p_title text,
  p_body text,
  p_cta_label text default 'View league',
  p_cta_href text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  org_id uuid;
  trimmed_title text := nullif(trim(coalesce(p_title, '')), '');
  trimmed_body text := nullif(trim(coalesce(p_body, '')), '');
  notice_slug text;
  existing_id uuid;
  new_id uuid;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_league_id is null then
    raise exception 'League is required';
  end if;

  if p_user_id is null then
    raise exception 'Player account is required';
  end if;

  if trimmed_title is null or trimmed_body is null then
    raise exception 'Notification title and body are required';
  end if;

  select organization_id into org_id
  from public.leagues
  where id = p_league_id;

  if org_id is null then
    raise exception 'League not found';
  end if;

  if not public.has_organization_role(org_id, array['owner', 'admin']::text[]) then
    raise exception 'Not allowed to notify players for this league';
  end if;

  notice_slug := 'league-registered:' || p_league_id::text || ':' || p_user_id::text;

  select id into existing_id
  from public.announcements
  where slug = notice_slug;

  if existing_id is not null then
    return existing_id;
  end if;

  insert into public.announcements (
    title,
    body,
    cta_label,
    cta_href,
    audience,
    severity,
    active,
    is_signup_default,
    slug,
    recipient_user_id,
    published_at
  )
  values (
    trimmed_title,
    trimmed_body,
    nullif(trim(coalesce(p_cta_label, '')), ''),
    nullif(trim(coalesce(p_cta_href, '')), ''),
    'all',
    'info',
    true,
    false,
    notice_slug,
    p_user_id,
    now()
  )
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.notify_league_player_registered(
  uuid,
  uuid,
  text,
  text,
  text,
  text
) from public;

grant execute on function public.notify_league_player_registered(
  uuid,
  uuid,
  text,
  text,
  text,
  text
) to authenticated;
