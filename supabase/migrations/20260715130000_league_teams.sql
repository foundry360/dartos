-- First-class league teams + optional FK from roster players.

create table if not exists public.league_teams (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues (id) on delete cascade,
  name text not null,
  color text not null default '#84C126',
  status text not null default 'active',
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint league_teams_name_not_blank
    check (char_length(trim(name)) > 0),
  constraint league_teams_status_valid
    check (status in ('active', 'inactive'))
);

create index if not exists league_teams_league_id_idx
  on public.league_teams (league_id);

create index if not exists league_teams_created_by_idx
  on public.league_teams (created_by);

create unique index if not exists league_teams_league_name_uidx
  on public.league_teams (league_id, lower(trim(name)));

drop trigger if exists league_teams_set_updated_at on public.league_teams;
create trigger league_teams_set_updated_at
  before update on public.league_teams
  for each row
  execute function public.set_updated_at();

alter table public.league_teams enable row level security;

create policy "Members can read league teams"
  on public.league_teams
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

create policy "Owners and admins can insert league teams"
  on public.league_teams
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

create policy "Owners and admins can update league teams"
  on public.league_teams
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

create policy "Owners and admins can delete league teams"
  on public.league_teams
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

grant select, insert, update, delete on public.league_teams to authenticated;

alter table public.league_players
  add column if not exists team_id uuid references public.league_teams (id) on delete set null;

create index if not exists league_players_team_id_idx
  on public.league_players (team_id);

-- Backfill teams from existing free-text team_name values.
do $$
declare
  league_owner uuid;
  team_row record;
  new_team_id uuid;
begin
  for team_row in
    select
      lp.league_id,
      trim(lp.team_name) as team_name
    from public.league_players lp
    where lp.team_name is not null
      and char_length(trim(lp.team_name)) > 0
      and lp.team_id is null
    group by lp.league_id, trim(lp.team_name)
  loop
    select l.created_by into league_owner
    from public.leagues l
    where l.id = team_row.league_id;

    if league_owner is null then
      continue;
    end if;

    select t.id into new_team_id
    from public.league_teams t
    where t.league_id = team_row.league_id
      and lower(trim(t.name)) = lower(team_row.team_name)
    limit 1;

    if new_team_id is null then
      insert into public.league_teams (league_id, name, created_by)
      values (team_row.league_id, team_row.team_name, league_owner)
      returning id into new_team_id;
    end if;

    update public.league_players
    set team_id = new_team_id
    where league_id = team_row.league_id
      and team_id is null
      and trim(team_name) = team_row.team_name;
  end loop;
end $$;
