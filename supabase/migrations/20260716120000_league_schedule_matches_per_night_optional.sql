-- Allow null matches_per_night = Auto (full round; bye when roster is odd).

alter table public.league_schedules
  drop constraint if exists league_schedules_matches_per_night_positive;

alter table public.league_schedules
  alter column matches_per_night drop not null;

alter table public.league_schedules
  alter column matches_per_night drop default;

alter table public.league_schedules
  add constraint league_schedules_matches_per_night_valid
    check (matches_per_night is null or matches_per_night > 0);

comment on column public.league_schedules.matches_per_night is
  'Optional. Null = auto full round (everyone plays once; bye when odd). Positive = custom night size.';
