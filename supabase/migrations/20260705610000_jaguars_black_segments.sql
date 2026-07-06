update public.board_themes
set colors = colors
  || '{"boardBase": "#000000", "segmentPrimary": "#000000", "wireDark": "#000000"}'::jsonb
where id = 'jaguars';
