-- Profile identity preferences and career stat highlights

alter table public.profiles
  add column if not exists throwing_hand text check (throwing_hand in ('right', 'left')),
  add column if not exists skill_level text check (skill_level in ('beginner', 'intermediate', 'advanced', 'pro')),
  add column if not exists preferred_game text check (preferred_game in ('501', '301', '701', 'cricket')),
  add column if not exists home_league text,
  add column if not exists favorite_double text,
  add column if not exists favorite_practice text,
  add column if not exists default_match text;

alter table public.player_stats
  add column if not exists visits_180_plus integer not null default 0,
  add column if not exists highest_checkout integer not null default 0;
