-- League roster membership.
-- Guest / inline profiles, optional link to personal saved players or Vector users.

create table if not exists public.league_players (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues (id) on delete cascade,
  first_name text not null,
  last_name text not null default '',
  nickname text,
  email text,
  phone text,
  color text not null default '#84C126',
  avatar_url text,
  team_name text,
  status text not null default 'active',
  vector_account text not null default 'profile-only',
  saved_player_id uuid references public.players (id) on delete set null,
  profile_user_id uuid references auth.users (id) on delete set null,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint league_players_first_name_not_blank
    check (char_length(trim(first_name)) > 0),
  constraint league_players_status_valid
    check (status in ('active', 'invited', 'pending', 'inactive')),
  constraint league_players_vector_account_valid
    check (
      vector_account in (
        'connected',
        'profile-only',
        'invitation-pending',
        'no-account'
      )
    )
);

create index if not exists league_players_league_id_idx
  on public.league_players (league_id);

create index if not exists league_players_created_by_idx
  on public.league_players (created_by);

create unique index if not exists league_players_league_saved_player_uidx
  on public.league_players (league_id, saved_player_id)
  where saved_player_id is not null;

create unique index if not exists league_players_league_profile_user_uidx
  on public.league_players (league_id, profile_user_id)
  where profile_user_id is not null;

drop trigger if exists league_players_set_updated_at on public.league_players;
create trigger league_players_set_updated_at
  before update on public.league_players
  for each row
  execute function public.set_updated_at();

alter table public.league_players enable row level security;

create policy "Members can read league players"
  on public.league_players
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

create policy "Owners and admins can insert league players"
  on public.league_players
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

create policy "Owners and admins can update league players"
  on public.league_players
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

create policy "Owners and admins can delete league players"
  on public.league_players
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

grant select, insert, update, delete on public.league_players to authenticated;
