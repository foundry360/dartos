update public.board_themes
set sort_order = sort_order + 1
where id != 'dartos';

insert into public.board_themes (id, name, description, colors, sort_order)
values (
  'dartos',
  'DartOS',
  'Black and white wedges with green scoring rings',
  '{
    "boardBase": "#070708",
    "segmentPrimary": "#070708",
    "segmentSecondary": "#f4f4f5",
    "triple": "#84c126",
    "double": "#84c126",
    "bullOuter": "#84c126",
    "bullInner": "#b91c3a",
    "wire": "#84c126",
    "wireDark": "#17171d",
    "label": "#f4f4f5",
    "segmentMatchedScoringRings": true,
    "scoringRingOnSegmentPrimary": "#f4f4f5",
    "scoringRingOnSegmentSecondary": "#84c126",
    "playerColors": ["#84c126", "#f4f4f5"],
    "markColor": "#84c126",
    "primaryColor": "#84c126"
  }'::jsonb,
  0
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  colors = excluded.colors,
  sort_order = excluded.sort_order,
  is_active = true;
