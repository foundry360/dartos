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
    "triple": "#6f9e24",
    "double": "#6f9e24",
    "bullOuter": "#6f9e24",
    "bullInner": "#b91c3a",
    "wire": "#6f9e24",
    "wireDark": "#17171d",
    "label": "#f4f4f5",
    "segmentMatchedScoringRings": true,
    "scoringRingOnSegmentPrimary": "#f4f4f5",
    "scoringRingOnSegmentSecondary": "#6f9e24",
    "playerColors": ["#6f9e24", "#f4f4f5"],
    "markColor": "#6f9e24",
    "primaryColor": "#6f9e24"
  }'::jsonb,
  0
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  colors = excluded.colors,
  sort_order = excluded.sort_order,
  is_active = true;
