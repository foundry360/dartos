update public.board_themes
set colors = colors || '{"bullOuter": "#666666"}'::jsonb
where id = 'ohio-state';
