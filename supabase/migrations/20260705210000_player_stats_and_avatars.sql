-- Player stats and profile avatars

alter table public.profiles
  add column if not exists avatar_url text;

create table public.player_stats (
  user_id uuid primary key references auth.users (id) on delete cascade,
  darts_thrown integer not null default 0,
  total_score integer not null default 0,
  visits integer not null default 0,
  highest_visit integer not null default 0,
  visits100_plus integer not null default 0,
  visits140_plus integer not null default 0,
  first_nine_score integer not null default 0,
  first_nine_visits integer not null default 0,
  singles_hit integer not null default 0,
  doubles_hit integer not null default 0,
  triples_hit integer not null default 0,
  bull_hit integer not null default 0,
  checkout_attempts integer not null default 0,
  checkout_successes integer not null default 0,
  matches_played integer not null default 0,
  matches_won integer not null default 0,
  legs_played integer not null default 0,
  legs_won integer not null default 0,
  breaks_of_throw integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.player_stats enable row level security;

create policy "Users can read own player stats"
  on public.player_stats
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own player stats"
  on public.player_stats
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own player stats"
  on public.player_stats
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger player_stats_set_updated_at
  before update on public.player_stats
  for each row
  execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, preferred_board_theme_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.email),
    'classic'
  );

  insert into public.player_stats (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly accessible"
  on storage.objects
  for select
  to public
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own avatar"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own avatar"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
