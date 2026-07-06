update public.board_themes
set colors = colors || '{"primaryColor": "#006778"}'::jsonb
where id = 'jaguars';
