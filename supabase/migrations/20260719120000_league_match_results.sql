-- Persist match results for standings / statistics (winner + scoreline).

alter table public.league_matches
  add column if not exists winner_side text,
  add column if not exists home_score integer not null default 0,
  add column if not exists away_score integer not null default 0,
  add column if not exists completed_at timestamptz;

alter table public.league_matches
  drop constraint if exists league_matches_winner_side_valid;

alter table public.league_matches
  add constraint league_matches_winner_side_valid
  check (winner_side is null or winner_side in ('home', 'away'));

alter table public.league_matches
  drop constraint if exists league_matches_scores_non_negative;

alter table public.league_matches
  add constraint league_matches_scores_non_negative
  check (home_score >= 0 and away_score >= 0);
