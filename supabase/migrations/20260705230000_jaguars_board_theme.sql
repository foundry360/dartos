insert into public.board_themes (id, name, description, colors, sort_order)
values (
  'jaguars',
  'Jaguars',
  'Black surround with teal wedges and gold scoring rings',
  '{
    "boardBase": "#101820",
    "segmentPrimary": "#101820",
    "segmentSecondary": "#006778",
    "triple": "#D7A22A",
    "double": "#D7A22A",
    "bullOuter": "#D7A22A",
    "bullInner": "#006778",
    "wire": "#9F792C",
    "wireDark": "#050810",
    "label": "#ffffff",
    "alternateScoringRings": true,
    "scoringRingAccent": "#9F792C",
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
