-- Head-to-head records between the account owner and saved player profiles.

create table if not exists public.player_head_to_head (
  owner_id uuid not null references auth.users (id) on delete cascade,
  opponent_id uuid not null references public.players (id) on delete cascade,
  user_wins integer not null default 0,
  opponent_wins integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, opponent_id)
);

create index if not exists player_head_to_head_owner_id_idx on public.player_head_to_head (owner_id);

alter table public.player_head_to_head enable row level security;

drop policy if exists "Users manage own head to head records" on public.player_head_to_head;

create policy "Users manage own head to head records"
  on public.player_head_to_head
  for all
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop trigger if exists player_head_to_head_set_updated_at on public.player_head_to_head;

create trigger player_head_to_head_set_updated_at
  before update on public.player_head_to_head
  for each row
  execute function public.set_updated_at();
