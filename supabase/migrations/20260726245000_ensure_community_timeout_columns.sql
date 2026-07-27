-- Ensure timeout columns exist (Start match clears closing_at).
-- Safe to re-run if 20260726241000 was skipped.

alter table public.community_rooms
  add column if not exists matched_at timestamptz;

alter table public.community_rooms
  add column if not exists closing_at timestamptz;

notify pgrst, 'reload schema';
