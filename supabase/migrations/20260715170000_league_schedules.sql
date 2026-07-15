-- League season schedules and scheduled matches.

create table if not exists public.league_schedules (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues (id) on delete cascade,
  status text not null default 'draft',
  frequency text not null default 'weekly',
  match_weekday integer,
  match_time text,
  weeks integer not null default 1,
  matches_per_night integer not null default 1,
  pattern text not null default 'round_robin',
  published_at timestamptz,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint league_schedules_status_valid
    check (status in ('draft', 'published')),
  constraint league_schedules_frequency_valid
    check (frequency in ('weekly', 'biweekly', 'custom')),
  constraint league_schedules_pattern_valid
    check (pattern in ('round_robin', 'custom')),
  constraint league_schedules_weeks_positive
    check (weeks > 0),
  constraint league_schedules_matches_per_night_positive
    check (matches_per_night > 0),
  constraint league_schedules_weekday_valid
    check (match_weekday is null or (match_weekday >= 0 and match_weekday <= 6))
);

create unique index if not exists league_schedules_league_uidx
  on public.league_schedules (league_id);

create index if not exists league_schedules_created_by_idx
  on public.league_schedules (created_by);

drop trigger if exists league_schedules_set_updated_at on public.league_schedules;
create trigger league_schedules_set_updated_at
  before update on public.league_schedules
  for each row
  execute function public.set_updated_at();

alter table public.league_schedules enable row level security;

create policy "Members can read league schedules"
  on public.league_schedules
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.leagues l
      where l.id = league_id
        and public.is_organization_member(l.organization_id)
    )
  );

create policy "Owners and admins can insert league schedules"
  on public.league_schedules
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.leagues l
      where l.id = league_id
        and public.has_organization_role(
          l.organization_id,
          array['owner', 'admin']::text[]
        )
    )
    and created_by = auth.uid()
  );

create policy "Owners and admins can update league schedules"
  on public.league_schedules
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.leagues l
      where l.id = league_id
        and public.has_organization_role(
          l.organization_id,
          array['owner', 'admin']::text[]
        )
    )
  )
  with check (
    exists (
      select 1
      from public.leagues l
      where l.id = league_id
        and public.has_organization_role(
          l.organization_id,
          array['owner', 'admin']::text[]
        )
    )
  );

create policy "Owners and admins can delete league schedules"
  on public.league_schedules
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.leagues l
      where l.id = league_id
        and public.has_organization_role(
          l.organization_id,
          array['owner', 'admin']::text[]
        )
    )
  );

create table if not exists public.league_matches (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues (id) on delete cascade,
  schedule_id uuid not null references public.league_schedules (id) on delete cascade,
  week_number integer not null,
  scheduled_at timestamptz not null,
  home_team_id uuid references public.league_teams (id) on delete set null,
  away_team_id uuid references public.league_teams (id) on delete set null,
  home_player_id uuid references public.league_players (id) on delete set null,
  away_player_id uuid references public.league_players (id) on delete set null,
  home_label text not null,
  away_label text not null,
  status text not null default 'scheduled',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint league_matches_week_positive check (week_number > 0),
  constraint league_matches_labels_not_blank
    check (
      char_length(trim(home_label)) > 0
      and char_length(trim(away_label)) > 0
    ),
  constraint league_matches_status_valid
    check (status in ('scheduled', 'in_progress', 'completed', 'cancelled'))
);

create index if not exists league_matches_schedule_id_idx
  on public.league_matches (schedule_id);

create index if not exists league_matches_league_id_idx
  on public.league_matches (league_id);

create index if not exists league_matches_week_idx
  on public.league_matches (schedule_id, week_number, sort_order);

drop trigger if exists league_matches_set_updated_at on public.league_matches;
create trigger league_matches_set_updated_at
  before update on public.league_matches
  for each row
  execute function public.set_updated_at();

alter table public.league_matches enable row level security;

create policy "Members can read league matches"
  on public.league_matches
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.leagues l
      where l.id = league_id
        and public.is_organization_member(l.organization_id)
    )
  );

create policy "Owners and admins can insert league matches"
  on public.league_matches
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.leagues l
      where l.id = league_id
        and public.has_organization_role(
          l.organization_id,
          array['owner', 'admin']::text[]
        )
    )
  );

create policy "Owners and admins can update league matches"
  on public.league_matches
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.leagues l
      where l.id = league_id
        and public.has_organization_role(
          l.organization_id,
          array['owner', 'admin']::text[]
        )
    )
  )
  with check (
    exists (
      select 1
      from public.leagues l
      where l.id = league_id
        and public.has_organization_role(
          l.organization_id,
          array['owner', 'admin']::text[]
        )
    )
  );

create policy "Owners and admins can delete league matches"
  on public.league_matches
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.leagues l
      where l.id = league_id
        and public.has_organization_role(
          l.organization_id,
          array['owner', 'admin']::text[]
        )
    )
  );
