-- Saved player profile avatars

alter table public.players
  add column if not exists avatar_url text;
