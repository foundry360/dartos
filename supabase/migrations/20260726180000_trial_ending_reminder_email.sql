-- Track scheduled "trial ends in 3 days" reminder emails.
alter table public.profiles
  add column if not exists trial_ending_email_id text,
  add column if not exists trial_ending_email_scheduled_at timestamptz;

comment on column public.profiles.trial_ending_email_id is
  'Resend email id for the trial-ending reminder (day 4 of a 7-day trial).';
comment on column public.profiles.trial_ending_email_scheduled_at is
  'When the trial-ending reminder email is scheduled to send.';
