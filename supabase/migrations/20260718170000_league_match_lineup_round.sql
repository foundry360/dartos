-- Which pass through the team Night Lineup this board match belongs to (1 = first slate).
alter table public.league_matches
  add column if not exists lineup_round integer
    check (lineup_round is null or lineup_round >= 1);

comment on column public.league_matches.lineup_round is
  'For team leagues: 1-based pass through the Night Lineup slate (Singles/Doubles × rounds).';
