-- Signup defaults are shared announcement rows (reused by all new accounts).

alter table public.announcements
  add column if not exists is_signup_default boolean not null default false,
  add column if not exists slug text;

create unique index if not exists announcements_slug_unique_idx
  on public.announcements (slug)
  where slug is not null;

insert into public.announcements (
  id,
  title,
  body,
  cta_label,
  cta_href,
  severity,
  audience,
  active,
  is_signup_default,
  slug,
  published_at
)
values
  (
    'a1000000-0000-4000-8000-000000000001',
    'Welcome to VectorOS',
    'You’re in. Start a match, track your stats, and make VectorOS your home for scoring.',
    null,
    null,
    'info',
    'all',
    true,
    true,
    'signup-welcome',
    now() + interval '2 seconds'
  ),
  (
    'a1000000-0000-4000-8000-000000000002',
    'Complete your profile',
    'Add your display name, nickname, and avatar so you’re ready for match play.',
    'Open Profile',
    '/profile',
    'info',
    'all',
    true,
    true,
    'signup-complete-profile',
    now() + interval '1 second'
  ),
  (
    'a1000000-0000-4000-8000-000000000003',
    'Install VectorOS to your device',
    'Add VectorOS to your Home Screen or Dock for the full-screen scoring experience.',
    'Install app',
    '/settings?section=install',
    'info',
    'all',
    true,
    true,
    'signup-install',
    now()
  )
on conflict (id) do update
set
  title = excluded.title,
  body = excluded.body,
  cta_label = excluded.cta_label,
  cta_href = excluded.cta_href,
  severity = excluded.severity,
  audience = excluded.audience,
  active = excluded.active,
  is_signup_default = excluded.is_signup_default,
  slug = excluded.slug;

-- Stop copying per-user signup rows on account create.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, preferred_board_theme_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.email),
    'dartos'
  );

  insert into public.player_stats (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop function if exists public.seed_signup_user_announcements(uuid);

drop table if exists public.user_announcements;
