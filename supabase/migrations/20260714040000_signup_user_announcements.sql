-- Personal inbox messages seeded for each new account.

create table if not exists public.user_announcements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text not null,
  cta_label text,
  cta_href text,
  severity text not null default 'info'
    check (severity in ('info', 'important')),
  published_at timestamptz not null default now(),
  read_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists user_announcements_user_published_idx
  on public.user_announcements (user_id, published_at desc);

alter table public.user_announcements enable row level security;

create policy "Users read own user announcements"
  on public.user_announcements
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users update own user announcements"
  on public.user_announcements
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.seed_signup_user_announcements(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_announcements (
    user_id,
    title,
    body,
    cta_label,
    cta_href,
    severity,
    published_at
  )
  values
    (
      target_user_id,
      'Welcome to VectorOS',
      'You’re in. Start a match, track your stats, and make VectorOS your home for scoring.',
      null,
      null,
      'info',
      now()
    ),
    (
      target_user_id,
      'Complete your profile',
      'Add your display name, nickname, and avatar so you’re ready for match play.',
      'Open Profile',
      '/profile',
      'info',
      now() + interval '1 second'
    ),
    (
      target_user_id,
      'Install VectorOS to your device',
      'Add VectorOS to your Home Screen or Dock for the full-screen scoring experience.',
      'Install app',
      '/settings?section=install',
      'info',
      now() + interval '2 seconds'
    );
end;
$$;

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
    'dartos'
  );

  insert into public.player_stats (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  perform public.seed_signup_user_announcements(new.id);

  return new;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.user_announcements;
exception
  when duplicate_object then null;
end $$;
