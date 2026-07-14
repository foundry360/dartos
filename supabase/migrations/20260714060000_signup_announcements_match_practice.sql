-- Additional shared signup defaults: first match + practice.

with base as (
  select coalesce(min(published_at), now()) as published_at
  from public.announcements
  where is_signup_default = true
)
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
select
  seed.id,
  seed.title,
  seed.body,
  seed.cta_label,
  seed.cta_href,
  seed.severity,
  'all',
  true,
  true,
  seed.slug,
  base.published_at + seed.offset_interval
from base
cross join (
  values
    (
      'a1000000-0000-4000-8000-000000000004'::uuid,
      'Play your first match',
      'Jump into Match Play or Classic Games from Home and throw your first scored match.',
      'Go to Home',
      '/home',
      'info',
      'signup-first-match',
      interval '1 second'
    ),
    (
      'a1000000-0000-4000-8000-000000000005'::uuid,
      'Try a practice session',
      'Warm up with a practice routine to sharpen your scoring before the next match.',
      'Start practice',
      '/practice/setup',
      'info',
      'signup-practice',
      interval '0 seconds'
    )
) as seed (
  id,
  title,
  body,
  cta_label,
  cta_href,
  severity,
  slug,
  offset_interval
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
  slug = excluded.slug,
  published_at = excluded.published_at;
