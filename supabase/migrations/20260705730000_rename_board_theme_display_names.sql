-- Rename board theme display names to avoid trademark issues (IDs unchanged).
update public.board_themes set name = 'Hot Pink' where id = 'barbie';
update public.board_themes set name = 'Midnight Teal' where id = 'jaguars';
update public.board_themes set name = 'Pinstripes' where id = 'yankees';
update public.board_themes set name = 'Swamp' where id = 'gators';
update public.board_themes set name = 'Vegas Gold' where id = 'golden-knights';
update public.board_themes set name = 'Scarlet' where id = 'ohio-state';
update public.board_themes set name = 'Purple & Gold' where id = 'lsu';
