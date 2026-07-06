-- Rolling trend windows for profile spark charts

alter table public.player_stats
  add column if not exists recent_visit_scores jsonb not null default '[]'::jsonb,
  add column if not exists recent_leg_results jsonb not null default '[]'::jsonb,
  add column if not exists recent_checkout_results jsonb not null default '[]'::jsonb;

alter table public.saved_player_stats
  add column if not exists recent_visit_scores jsonb not null default '[]'::jsonb,
  add column if not exists recent_leg_results jsonb not null default '[]'::jsonb,
  add column if not exists recent_checkout_results jsonb not null default '[]'::jsonb;
