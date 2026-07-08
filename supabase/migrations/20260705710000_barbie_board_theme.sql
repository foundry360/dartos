insert into public.board_themes (id, name, description, colors, sort_order)
values (
  'barbie',
  'Barbie',
  'Hot pink surround with soft pink wedges and white scoring rings',
  '{
    "boardBase": "#e305ad",
    "segmentPrimary": "#e305ad",
    "segmentSecondary": "#f29ad8",
    "triple": "#ffffff",
    "double": "#ffffff",
    "bullOuter": "#ee71c3",
    "bullInner": "#b91c3a",
    "wire": "#f658b8",
    "wireDark": "#5c0249",
    "label": "#ffffff",
    "segmentMatchedScoringRings": true,
    "scoringRingOnSegmentPrimary": "#ffffff",
    "scoringRingOnSegmentSecondary": "#f039b1",
    "playerColors": ["#f039b1", "#f29ad8"],
    "markColor": "#f039b1",
    "primaryColor": "#e305ad",
    "surroundBorder": "#f658b8"
  }'::jsonb,
  11
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  colors = excluded.colors,
  sort_order = excluded.sort_order,
  is_active = true;
