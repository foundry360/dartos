-- App settings and recent guest names stored on the user profile.

alter table public.profiles
  add column if not exists haptics_enabled boolean not null default true,
  add column if not exists sound_enabled boolean not null default false,
  add column if not exists confirm_finish_turn boolean not null default false,
  add column if not exists recent_guest_names jsonb not null default '[]'::jsonb;
