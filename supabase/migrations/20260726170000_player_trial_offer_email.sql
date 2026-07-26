-- Track one-time 7-day trial offer emails for free player accounts.
alter table public.profiles
  add column if not exists trial_offer_email_id text,
  add column if not exists trial_offer_email_scheduled_at timestamptz,
  add column if not exists trial_offer_email_opt_out boolean not null default false;

comment on column public.profiles.trial_offer_email_id is
  'Resend email id for the scheduled free-player trial offer.';
comment on column public.profiles.trial_offer_email_scheduled_at is
  'When the free-player trial offer email is scheduled to send.';
comment on column public.profiles.trial_offer_email_opt_out is
  'When true, do not schedule or send the free-player trial offer email.';
