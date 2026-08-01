-- Track one-time Discord community invite emails for new members.
-- Note: 20260801211000 renames community_invite_email_sent_at → scheduled_at.
alter table public.profiles
  add column if not exists community_invite_email_id text,
  add column if not exists community_invite_email_sent_at timestamptz;

comment on column public.profiles.community_invite_email_id is
  'Resend email id for the Discord community invite email.';
comment on column public.profiles.community_invite_email_sent_at is
  'When the Discord community invite email was sent (renamed to scheduled_at in a later migration).';
