-- Leg scores for individual match history rows.

alter table public.player_match_history
  add column if not exists user_legs integer not null default 0,
  add column if not exists opponent_legs integer not null default 0;
