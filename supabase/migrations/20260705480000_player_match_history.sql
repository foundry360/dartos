-- Individual match results between the account owner and saved player profiles.

create table if not exists public.player_match_history (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  opponent_id uuid not null references public.players (id) on delete cascade,
  user_won boolean not null,
  match_type text not null,
  played_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists player_match_history_owner_played_at_idx
  on public.player_match_history (owner_id, played_at desc);

alter table public.player_match_history enable row level security;

drop policy if exists "Users manage own match history" on public.player_match_history;

create policy "Users manage own match history"
  on public.player_match_history
  for all
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
