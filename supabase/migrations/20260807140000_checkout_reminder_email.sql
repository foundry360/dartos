-- Delayed nudge for members who signed up but never finished Stripe checkout
-- (GHL tag subscription:None). Scheduled 3 days after account creation.
alter table public.profiles
  add column if not exists checkout_reminder_email_id text,
  add column if not exists checkout_reminder_email_scheduled_at timestamptz,
  add column if not exists checkout_reminder_email_opt_out boolean not null default false;

comment on column public.profiles.checkout_reminder_email_id is
  'Resend email id for the incomplete-checkout reminder (scheduled 3 days after signup).';
comment on column public.profiles.checkout_reminder_email_scheduled_at is
  'When the incomplete-checkout reminder is scheduled to send via Resend.';
comment on column public.profiles.checkout_reminder_email_opt_out is
  'True when the user unsubscribed from incomplete-checkout reminder emails.';
