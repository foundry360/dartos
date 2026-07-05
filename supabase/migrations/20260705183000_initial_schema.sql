-- DartOS initial Supabase schema

create table public.board_themes (
  id text primary key,
  name text not null,
  description text not null,
  colors jsonb not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  preferred_board_theme_id text references public.board_themes (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  nickname text,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  game_type text not null,
  status text not null default 'completed',
  payload jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index players_owner_id_idx on public.players (owner_id);
create index matches_owner_id_idx on public.matches (owner_id);
create index matches_started_at_idx on public.matches (started_at desc);

alter table public.board_themes enable row level security;
alter table public.profiles enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;

create policy "Anyone can read active board themes"
  on public.board_themes
  for select
  to anon, authenticated
  using (is_active = true);

create policy "Users can read own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users manage own players"
  on public.players
  for all
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Users manage own matches"
  on public.matches
  for all
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

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

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger board_themes_set_updated_at
  before update on public.board_themes
  for each row
  execute function public.set_updated_at();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

create trigger players_set_updated_at
  before update on public.players
  for each row
  execute function public.set_updated_at();

insert into public.board_themes (id, name, description, colors, sort_order) values
  (
    'classic',
    'Classic',
    'Traditional sisal tournament board',
    '{
      "boardBase": "#5a3d28",
      "segmentPrimary": "#1e1812",
      "segmentSecondary": "#f2e8cf",
      "triple": "#15803d",
      "double": "#15803d",
      "bullOuter": "#15803d",
      "bullInner": "#b91c3a",
      "wire": "#9ca3af",
      "wireDark": "#374151",
      "label": "#f2e8cf",
      "alternateScoringRings": true,
      "scoringRingAccent": "#b91c3a"
    }'::jsonb,
    0
  ),
  (
    'gold',
    'Gold',
    'Rich gold wedges on a deep charcoal base',
    '{
      "boardBase": "#14100a",
      "segmentPrimary": "#1f1810",
      "segmentSecondary": "#c9a227",
      "triple": "#f5d547",
      "double": "#a67c00",
      "bullOuter": "#f5d547",
      "bullInner": "#8b6914",
      "wire": "#d4af37",
      "wireDark": "#3d3018",
      "label": "#f8ecc8"
    }'::jsonb,
    1
  ),
  (
    'teal',
    'Teal',
    'Cool teal singles with bright aqua scoring rings',
    '{
      "boardBase": "#071418",
      "segmentPrimary": "#0c2229",
      "segmentSecondary": "#5eead4",
      "triple": "#2dd4bf",
      "double": "#0f766e",
      "bullOuter": "#14b8a6",
      "bullInner": "#115e59",
      "wire": "#5eead4",
      "wireDark": "#134e4a",
      "label": "#ccfbf1"
    }'::jsonb,
    2
  ),
  (
    'black',
    'Black',
    'Monochrome singles with silver scoring rings',
    '{
      "boardBase": "#050505",
      "segmentPrimary": "#121212",
      "segmentSecondary": "#3f3f46",
      "triple": "#71717a",
      "double": "#a1a1aa",
      "bullOuter": "#52525b",
      "bullInner": "#d4d4d8",
      "wire": "#737373",
      "wireDark": "#262626",
      "label": "#e4e4e7"
    }'::jsonb,
    3
  );
