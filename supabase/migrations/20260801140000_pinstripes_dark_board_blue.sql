-- Align Pinstripes (yankees) scoring UI blue with the board's dark navy wedges.
update public.board_themes
set
  colors = jsonb_set(
    jsonb_set(
      colors,
      '{primaryColor}',
      '"#0C2340"'::jsonb
    ),
    '{playerColors}',
    '["#C4CED4", "#0C2340"]'::jsonb
  ),
  updated_at = now()
where id = 'yankees';
