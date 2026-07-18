-- Board game type within a team night (singles / doubles slate).
alter table public.league_matches
  add column if not exists board_format text
    check (board_format is null or board_format in ('singles', 'doubles')),
  add column if not exists board_slot integer
    check (board_slot is null or board_slot >= 1);

comment on column public.league_matches.board_format is
  'For team leagues: singles or doubles board game inside a team pairing.';
comment on column public.league_matches.board_slot is
  '1-based index within board_format for that night pairing (Singles 1, Doubles 2, …).';
