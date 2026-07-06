-- Leg scores for individual match history rows.

alter table public.player_match_history
  add column user_legs integer not null default 0,
  add column opponent_legs integer not null default 0;
