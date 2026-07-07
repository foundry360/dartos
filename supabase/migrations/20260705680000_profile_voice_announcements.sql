alter table public.profiles
  add column if not exists voice_announcements_enabled boolean not null default false;
