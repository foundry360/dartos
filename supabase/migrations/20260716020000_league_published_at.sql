-- League publish status (null = unpublished).

alter table public.leagues
  add column if not exists published_at timestamptz;

create index if not exists leagues_published_at_idx
  on public.leagues (published_at);
