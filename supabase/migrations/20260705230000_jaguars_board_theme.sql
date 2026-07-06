insert into public.board_themes (id, name, description, colors, sort_order)
values (
  'jaguars',
  'Jaguars',
  'Black surround with teal wedges and gold scoring rings',
  '{
    "boardBase": "#101820",
    "segmentPrimary": "#101820",
    "segmentSecondary": "#006778",
    "triple": "#ffffff",
    "double": "#ffffff",
    "bullOuter": "#D7A22A",
    "bullInner": "#b91c3a",
    "wire": "#9F792C",
    "wireDark": "#050810",
    "label": "#ffffff",
    "alternateScoringRings": true,
    "scoringRingAccent": "#D7A22A",
    "playerColors": ["#006778", "#D7A22A"],
    "markColor": "#D7A22A"
  }'::jsonb,
  5
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  colors = excluded.colors,
  sort_order = excluded.sort_order,
  is_active = true;
