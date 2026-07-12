-- Soft-delete accounts by marking the profile inactive instead of removing auth.users.

alter table public.profiles
  add column if not exists deactivated_at timestamptz;

create index if not exists profiles_deactivated_at_idx
  on public.profiles (deactivated_at)
  where deactivated_at is not null;
