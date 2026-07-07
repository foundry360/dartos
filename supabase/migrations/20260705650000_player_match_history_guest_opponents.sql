-- Track match history against guest opponents (no saved player profile).

alter table public.player_match_history
  add column if not exists opponent_name text;

update public.player_match_history pmh
set opponent_name = p.name
from public.players p
where pmh.opponent_id = p.id
  and pmh.opponent_name is null;

alter table public.player_match_history
  alter column opponent_name set not null;

alter table public.player_match_history
  alter column opponent_id drop not null;

alter table public.player_match_history
  drop constraint if exists player_match_history_opponent_check;

alter table public.player_match_history
  add constraint player_match_history_opponent_check
  check (
    opponent_id is not null
    or length(trim(opponent_name)) > 0
  );
