-- Allow roster players (and anyone for completed published leagues) to read
-- standings/stats/results data: roster, teams, schedules, matches.

create or replace function public.is_completed_published_league(p_league_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.leagues l
    where l.id = p_league_id
      and l.published_at is not null
      and l.ends_at is not null
      and l.ends_at < now()
  );
$$;

revoke all on function public.is_completed_published_league(uuid) from public;
grant execute on function public.is_completed_published_league(uuid) to authenticated;

drop policy if exists "Authenticated can read completed published leagues" on public.leagues;
create policy "Authenticated can read completed published leagues"
  on public.leagues
  for select
  to authenticated
  using (
    published_at is not null
    and ends_at is not null
    and ends_at < now()
  );

drop policy if exists "Connected players can read league roster" on public.league_players;
create policy "Connected players can read league roster"
  on public.league_players
  for select
  to authenticated
  using (public.is_connected_league_player(league_id));

drop policy if exists "Authenticated can read completed league roster" on public.league_players;
create policy "Authenticated can read completed league roster"
  on public.league_players
  for select
  to authenticated
  using (public.is_completed_published_league(league_id));

drop policy if exists "Connected players can read league teams" on public.league_teams;
create policy "Connected players can read league teams"
  on public.league_teams
  for select
  to authenticated
  using (public.is_connected_league_player(league_id));

drop policy if exists "Authenticated can read completed league teams" on public.league_teams;
create policy "Authenticated can read completed league teams"
  on public.league_teams
  for select
  to authenticated
  using (public.is_completed_published_league(league_id));

drop policy if exists "Connected players can read league schedules" on public.league_schedules;
create policy "Connected players can read league schedules"
  on public.league_schedules
  for select
  to authenticated
  using (public.is_connected_league_player(league_id));

drop policy if exists "Authenticated can read completed league schedules" on public.league_schedules;
create policy "Authenticated can read completed league schedules"
  on public.league_schedules
  for select
  to authenticated
  using (public.is_completed_published_league(league_id));

drop policy if exists "Connected players can read league matches" on public.league_matches;
create policy "Connected players can read league matches"
  on public.league_matches
  for select
  to authenticated
  using (public.is_connected_league_player(league_id));

drop policy if exists "Authenticated can read completed league matches" on public.league_matches;
create policy "Authenticated can read completed league matches"
  on public.league_matches
  for select
  to authenticated
  using (public.is_completed_published_league(league_id));

drop policy if exists "Authenticated can read completed league venues" on public.organizations;
create policy "Authenticated can read completed league venues"
  on public.organizations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.leagues l
      where l.organization_id = organizations.id
        and public.is_completed_published_league(l.id)
    )
  );
