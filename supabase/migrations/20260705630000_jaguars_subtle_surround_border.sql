update public.board_themes
set colors = colors || '{"surroundBorder": "#1c1f26"}'::jsonb
where id = 'jaguars';
