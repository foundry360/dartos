-- In-app announcements (Phase 1) + per-user notification preference.

alter table public.profiles
  add column if not exists notifications_enabled boolean not null default true;

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  cta_label text,
  cta_href text,
  audience text not null default 'all'
    check (audience in ('all', 'club', 'elite')),
  severity text not null default 'info'
    check (severity in ('info', 'important')),
  active boolean not null default true,
  published_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists announcements_active_published_idx
  on public.announcements (active, published_at desc);

create table if not exists public.announcement_reads (
  announcement_id uuid not null references public.announcements (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  read_at timestamptz not null default now(),
  dismissed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (announcement_id, user_id)
);

create index if not exists announcement_reads_user_id_idx
  on public.announcement_reads (user_id);

create or replace function public.set_announcements_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists announcements_set_updated_at on public.announcements;
create trigger announcements_set_updated_at
  before update on public.announcements
  for each row
  execute function public.set_announcements_updated_at();

alter table public.announcements enable row level security;
alter table public.announcement_reads enable row level security;

create policy "Authenticated users read active announcements"
  on public.announcements
  for select
  to authenticated
  using (
    active = true
    and published_at <= now()
    and (ends_at is null or ends_at > now())
    and audience = 'all'
  );

create policy "Users read own announcement reads"
  on public.announcement_reads
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own announcement reads"
  on public.announcement_reads
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users update own announcement reads"
  on public.announcement_reads
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Realtime delivery for newly published announcements.
do $$
begin
  alter publication supabase_realtime add table public.announcements;
exception
  when duplicate_object then null;
end $$;
