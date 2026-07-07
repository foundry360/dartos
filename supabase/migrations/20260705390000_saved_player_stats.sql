-- Per saved player profile stats (linked to public.players)

create table if not exists public.saved_player_stats (
  player_id uuid primary key references public.players (id) on delete cascade,
  darts_thrown integer not null default 0,
  total_score integer not null default 0,
  visits integer not null default 0,
  highest_visit integer not null default 0,
  visits100_plus integer not null default 0,
  visits140_plus integer not null default 0,
  first_nine_score integer not null default 0,
  first_nine_visits integer not null default 0,
  singles_hit integer not null default 0,
  doubles_hit integer not null default 0,
  triples_hit integer not null default 0,
  bull_hit integer not null default 0,
  checkout_attempts integer not null default 0,
  checkout_successes integer not null default 0,
  matches_played integer not null default 0,
  matches_won integer not null default 0,
  legs_played integer not null default 0,
  legs_won integer not null default 0,
  breaks_of_throw integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists saved_player_stats_player_id_idx on public.saved_player_stats (player_id);

alter table public.saved_player_stats enable row level security;

drop policy if exists "Users manage stats for own saved players" on public.saved_player_stats;

create policy "Users manage stats for own saved players"
  on public.saved_player_stats
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.players
      where players.id = saved_player_stats.player_id
        and players.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.players
      where players.id = saved_player_stats.player_id
        and players.owner_id = auth.uid()
    )
  );

drop trigger if exists saved_player_stats_set_updated_at on public.saved_player_stats;

create trigger saved_player_stats_set_updated_at
  before update on public.saved_player_stats
  for each row
  execute function public.set_updated_at();
