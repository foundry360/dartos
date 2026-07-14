-- New profiles start with sound effects and voice announcements on.
alter table public.profiles
  alter column sound_enabled set default true;

alter table public.profiles
  alter column voice_announcements_enabled set default true;
