-- Community invite is scheduled via Resend (24h after welcome), not sent immediately.
alter table public.profiles
  rename column community_invite_email_sent_at to community_invite_email_scheduled_at;

comment on column public.profiles.community_invite_email_id is
  'Resend email id for the scheduled Discord community invite email.';
comment on column public.profiles.community_invite_email_scheduled_at is
  'When the Discord community invite email is scheduled to send (typically 24h after welcome).';
