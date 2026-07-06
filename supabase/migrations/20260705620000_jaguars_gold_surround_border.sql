update public.board_themes
set colors = colors || '{"surroundBorder": "#D7A22A"}'::jsonb
where id = 'jaguars';
