-- Allow league match rows to record forfeit / walkover endings distinctly.
alter table public.league_matches
  drop constraint if exists league_matches_status_valid;

alter table public.league_matches
  add constraint league_matches_status_valid
  check (
    status in (
      'scheduled',
      'in_progress',
      'completed',
      'forfeited',
      'walkover',
      'cancelled'
    )
  );
