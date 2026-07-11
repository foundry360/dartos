alter table public.payment_methods
  add column if not exists is_active boolean not null default true;

create index if not exists payment_methods_user_active_idx
  on public.payment_methods (user_id, is_active desc, is_default desc);
