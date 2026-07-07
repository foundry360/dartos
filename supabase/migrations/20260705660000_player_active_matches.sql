-- In-progress matches the account owner can resume from any device.

create table if not exists public.player_active_matches (
  owner_id uuid primary key references auth.users (id) on delete cascade,
  game_mode text not null check (game_mode in ('x01', 'cricket')),
  resume_href text not null,
  match_type text not null,
  opponent_id uuid references public.players (id) on delete set null,
  opponent_name text not null,
  progress text not null default '',
  game_state jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists player_active_matches_updated_at_idx
  on public.player_active_matches (updated_at desc);

alter table public.player_active_matches enable row level security;

drop policy if exists "Users manage own active matches" on public.player_active_matches;

create policy "Users manage own active matches"
  on public.player_active_matches
  for all
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
