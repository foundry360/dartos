-- League Pro: show/hide X01 checkout suggestion card on match play scoring.

alter table public.profiles
  add column if not exists league_checkout_suggestions_enabled boolean not null default false;
