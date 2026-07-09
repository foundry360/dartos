-- Completed practice drill sessions (separate from match stats).

create table public.practice_session_history (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  drill_id text not null,
  drill_title text not null,
  config jsonb not null default '{}'::jsonb,
  started_at timestamptz not null,
  completed_at timestamptz not null default now(),
  darts_thrown integer not null default 0,
  successes integer,
  attempts integer,
  duration_seconds integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index practice_session_history_owner_completed_idx
  on public.practice_session_history (owner_id, completed_at desc);

create index practice_session_history_owner_drill_idx
  on public.practice_session_history (owner_id, drill_id, completed_at desc);

alter table public.practice_session_history enable row level security;

create policy "Users manage own practice sessions"
  on public.practice_session_history
  for all
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
