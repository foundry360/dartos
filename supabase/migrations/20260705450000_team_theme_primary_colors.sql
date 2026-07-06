update public.board_themes
set colors = colors || '{"primaryColor": "#003087"}'::jsonb
where id = 'yankees';

update public.board_themes
set colors = colors || '{"primaryColor": "#0021A5"}'::jsonb
where id = 'gators';

update public.board_themes
set colors = colors || '{"primaryColor": "#B4975A"}'::jsonb
where id = 'golden-knights';

update public.board_themes
set colors = colors || '{"primaryColor": "#BB0000"}'::jsonb
where id = 'ohio-state';

update public.board_themes
set colors = colors || '{"primaryColor": "#461D7C"}'::jsonb
where id = 'lsu';
