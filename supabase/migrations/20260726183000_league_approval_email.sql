-- Track one-time approval emails when a league director approves a player.
alter table public.league_players
  add column if not exists approval_email_sent_at timestamptz;

comment on column public.league_players.approval_email_sent_at is
  'When the league registration approval email was sent to the player.';
