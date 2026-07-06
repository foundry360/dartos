update public.board_themes
set colors = colors || '{"bullInner": "#b91c3a"}'::jsonb
where id in ('yankees', 'gators', 'golden-knights', 'ohio-state', 'lsu', 'jaguars');

update public.board_themes
set colors = colors || '{"bullOuter": "#C4CED4"}'::jsonb
where id = 'yankees';

update public.board_themes
set colors = colors || '{"bullOuter": "#FA4616"}'::jsonb
where id = 'gators';

update public.board_themes
set colors = colors || '{"bullOuter": "#B4975A"}'::jsonb
where id = 'golden-knights';

update public.board_themes
set colors = colors || '{"bullOuter": "#BB0000"}'::jsonb
where id = 'ohio-state';

update public.board_themes
set colors = colors || '{"bullOuter": "#FDD023"}'::jsonb
where id = 'lsu';
