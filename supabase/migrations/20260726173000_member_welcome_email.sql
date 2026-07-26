-- Track one-time welcome emails for paid Club / Elite members.
alter table public.profiles
  add column if not exists welcome_email_id text,
  add column if not exists welcome_email_sent_at timestamptz;

comment on column public.profiles.welcome_email_id is
  'Resend email id for the paid Club/Elite welcome email.';
comment on column public.profiles.welcome_email_sent_at is
  'When the paid Club/Elite welcome email was sent.';
