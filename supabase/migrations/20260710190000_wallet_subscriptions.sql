-- Stripe subscription records (synced via webhooks / server routes).

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  stripe_subscription_id text not null unique,
  stripe_customer_id text not null,
  stripe_price_id text not null,
  plan_name text not null,
  status text not null check (
    status in (
      'incomplete',
      'incomplete_expired',
      'trialing',
      'active',
      'past_due',
      'canceled',
      'unpaid',
      'paused'
    )
  ),
  amount_cents integer not null default 0,
  currency text not null default 'usd',
  interval text check (interval in ('day', 'week', 'month', 'year')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_user_id_idx on public.subscriptions (user_id);
create index subscriptions_user_status_idx on public.subscriptions (user_id, status);

alter table public.subscriptions enable row level security;

create policy "Users read own subscriptions"
  on public.subscriptions
  for select
  to authenticated
  using (auth.uid() = user_id);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row
  execute function public.set_updated_at();
