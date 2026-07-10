-- Wallet / billing tables for Stripe payment methods and invoices.
-- Rows are written by server webhooks and API routes (service role), not the client.

create table public.billing_customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  stripe_payment_method_id text not null unique,
  stripe_customer_id text not null,
  type text not null default 'card' check (type in ('card', 'us_bank_account', 'link')),
  brand text,
  last4 text,
  exp_month integer check (exp_month is null or (exp_month >= 1 and exp_month <= 12)),
  exp_year integer check (exp_year is null or exp_year >= 2000),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  stripe_invoice_id text not null unique,
  stripe_customer_id text not null,
  number text,
  status text not null check (status in ('draft', 'open', 'paid', 'void', 'uncollectible')),
  amount_due_cents integer not null default 0,
  amount_paid_cents integer not null default 0,
  currency text not null default 'usd',
  description text,
  hosted_invoice_url text,
  invoice_pdf_url text,
  period_start timestamptz,
  period_end timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index billing_customers_user_id_idx on public.billing_customers (user_id);
create index payment_methods_user_id_idx on public.payment_methods (user_id);
create index payment_methods_user_default_idx on public.payment_methods (user_id, is_default desc);
create index invoices_user_id_idx on public.invoices (user_id);
create index invoices_user_created_idx on public.invoices (user_id, created_at desc);

alter table public.billing_customers enable row level security;
alter table public.payment_methods enable row level security;
alter table public.invoices enable row level security;

create policy "Users read own billing customer"
  on public.billing_customers
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users read own payment methods"
  on public.payment_methods
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users read own invoices"
  on public.invoices
  for select
  to authenticated
  using (auth.uid() = user_id);

create trigger billing_customers_set_updated_at
  before update on public.billing_customers
  for each row
  execute function public.set_updated_at();

create trigger payment_methods_set_updated_at
  before update on public.payment_methods
  for each row
  execute function public.set_updated_at();

create trigger invoices_set_updated_at
  before update on public.invoices
  for each row
  execute function public.set_updated_at();
