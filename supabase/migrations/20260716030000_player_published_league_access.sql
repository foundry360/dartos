-- Allow connected Vector roster players to read published leagues they belong to
-- (My Leagues for Elite / Club users who are not org members).

create or replace function public.is_connected_league_player(p_league_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.league_players lp
    where lp.league_id = p_league_id
      and lp.profile_user_id = auth.uid()
      and lp.vector_account = 'connected'
  );
$$;

revoke all on function public.is_connected_league_player(uuid) from public;
grant execute on function public.is_connected_league_player(uuid) to authenticated;

create policy "Connected players can read own league membership"
  on public.league_players
  for select
  to authenticated
  using (
    profile_user_id = auth.uid()
    and vector_account = 'connected'
  );

create policy "Connected players can read published leagues"
  on public.leagues
  for select
  to authenticated
  using (
    published_at is not null
    and public.is_connected_league_player(id)
  );

create policy "Connected players can read published league venues"
  on public.organizations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.leagues l
      where l.organization_id = id
        and l.published_at is not null
        and public.is_connected_league_player(l.id)
    )
  );

create policy "Connected players can read published league seasons"
  on public.seasons
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.leagues l
      where l.season_id = id
        and l.published_at is not null
        and public.is_connected_league_player(l.id)
    )
  );
