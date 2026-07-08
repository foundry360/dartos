-- Allow multiple in-progress matches per account (e.g. Cricket + 501).

alter table public.player_active_matches
  add column if not exists id uuid default gen_random_uuid();

update public.player_active_matches
set id = gen_random_uuid()
where id is null;

alter table public.player_active_matches
  alter column id set not null;

alter table public.player_active_matches
  drop constraint if exists player_active_matches_pkey;

alter table public.player_active_matches
  add primary key (id);

create index if not exists player_active_matches_owner_updated_idx
  on public.player_active_matches (owner_id, updated_at desc);
