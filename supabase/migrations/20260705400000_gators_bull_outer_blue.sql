-- Gators outer bull: primary blue instead of orange
update public.board_themes
set colors = colors || '{"bullOuter": "#0021A5"}'::jsonb
where id = 'gators';
