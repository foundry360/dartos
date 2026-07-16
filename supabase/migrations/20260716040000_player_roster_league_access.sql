-- Connected roster players can read their leagues as soon as they are added
-- (no longer require leagues.published_at).

drop policy if exists "Connected players can read published leagues"
  on public.leagues;
drop policy if exists "Connected players can read published league venues"
  on public.organizations;
drop policy if exists "Connected players can read published league seasons"
  on public.seasons;

create policy "Connected players can read their leagues"
  on public.leagues
  for select
  to authenticated
  using (public.is_connected_league_player(id));

create policy "Connected players can read their league venues"
  on public.organizations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.leagues l
      where l.organization_id = id
        and public.is_connected_league_player(l.id)
    )
  );

create policy "Connected players can read their league seasons"
  on public.seasons
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.leagues l
      where l.season_id = id
        and public.is_connected_league_player(l.id)
    )
  );
