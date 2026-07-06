update public.board_themes
set
  description = 'Black surround with gold wedges and white scoring rings',
  colors = colors || '{"triple": "#ffffff", "double": "#ffffff", "scoringRingAccent": "#B4975A"}'::jsonb
where id = 'golden-knights';

update public.board_themes
set colors = colors || '{"triple": "#ffffff", "double": "#ffffff", "scoringRingAccent": "#D7A22A"}'::jsonb
where id = 'jaguars';

update public.board_themes
set
  description = 'Navy surround with blue wedges and white scoring rings',
  colors = colors || '{"scoringRingAccent": "#4093D0"}'::jsonb
where id = 'patriot';

update public.board_themes
set colors = colors || '{"triple": "#ffffff", "double": "#ffffff"}'::jsonb
where id in ('yankees', 'gators', 'ohio-state', 'lsu')
  and (colors->>'triple' is distinct from '#ffffff' or colors->>'double' is distinct from '#ffffff');

update public.board_themes
set colors = colors || jsonb_build_object('scoringRingAccent', colors->'markColor')
where id in ('yankees', 'gators', 'ohio-state', 'lsu')
  and colors ? 'markColor';
