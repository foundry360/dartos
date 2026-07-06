update public.board_themes
set colors = colors || '{"bullOuter": "#666666", "bullInner": "#b91c3a"}'::jsonb
where id = 'ohio-state';
