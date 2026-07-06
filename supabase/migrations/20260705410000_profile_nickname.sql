-- Optional nickname on the signed-in user's profile

alter table public.profiles
  add column if not exists nickname text;
