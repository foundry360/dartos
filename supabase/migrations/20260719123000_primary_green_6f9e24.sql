-- Align primary green defaults and DartOS board theme to #6F9E24.

alter table public.league_players
  alter column color set default '#6F9E24';

alter table public.league_teams
  alter column color set default '#6F9E24';

update public.board_themes
set
  colors = jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  colors,
                  '{triple}',
                  '"#6f9e24"'::jsonb
                ),
                '{double}',
                '"#6f9e24"'::jsonb
              ),
              '{bullOuter}',
              '"#6f9e24"'::jsonb
            ),
            '{wire}',
            '"#6f9e24"'::jsonb
          ),
          '{scoringRingOnSegmentSecondary}',
          '"#6f9e24"'::jsonb
        ),
        '{markColor}',
        '"#6f9e24"'::jsonb
      ),
      '{primaryColor}',
      '"#6f9e24"'::jsonb
    ),
    '{playerColors}',
    '["#6f9e24", "#f4f4f5"]'::jsonb
  ),
  updated_at = now()
where id = 'dartos';
