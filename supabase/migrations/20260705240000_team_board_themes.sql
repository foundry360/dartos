insert into public.board_themes (id, name, description, colors, sort_order)
values
  (
    'yankees',
    'Yankees',
    'Midnight navy surround with silver wedges and white scoring rings',
    '{
      "boardBase": "#0C2340",
      "segmentPrimary": "#0C2340",
      "segmentSecondary": "#C4CED4",
      "triple": "#ffffff",
      "double": "#ffffff",
      "bullOuter": "#ffffff",
      "bullInner": "#003087",
      "wire": "#C4CED4",
      "wireDark": "#001A33",
      "label": "#ffffff",
      "alternateScoringRings": true,
      "scoringRingAccent": "#C4CED4",
      "playerColors": ["#C4CED4", "#003087"],
      "markColor": "#C4CED4"
    }'::jsonb,
    6
  ),
  (
    'gators',
    'Gators',
    'Gator blue surround with orange wedges and white scoring rings',
    '{
      "boardBase": "#0021A5",
      "segmentPrimary": "#0021A5",
      "segmentSecondary": "#FA4616",
      "triple": "#ffffff",
      "double": "#ffffff",
      "bullOuter": "#ffffff",
      "bullInner": "#FA4616",
      "wire": "#FA4616",
      "wireDark": "#001233",
      "label": "#ffffff",
      "alternateScoringRings": true,
      "scoringRingAccent": "#FA4616",
      "playerColors": ["#FA4616", "#0021A5"],
      "markColor": "#FA4616"
    }'::jsonb,
    7
  ),
  (
    'golden-knights',
    'Golden Knights',
    'Black surround with gold wedges and red scoring rings',
    '{
      "boardBase": "#1A1A1A",
      "segmentPrimary": "#1A1A1A",
      "segmentSecondary": "#B4975A",
      "triple": "#C8102E",
      "double": "#C8102E",
      "bullOuter": "#B4975A",
      "bullInner": "#C8102E",
      "wire": "#B4975A",
      "wireDark": "#0A0A0A",
      "label": "#ffffff",
      "alternateScoringRings": true,
      "scoringRingAccent": "#C8102E",
      "playerColors": ["#B4975A", "#C8102E"],
      "markColor": "#B4975A"
    }'::jsonb,
    8
  ),
  (
    'ohio-state',
    'Ohio State',
    'Charcoal surround with scarlet wedges and white scoring rings',
    '{
      "boardBase": "#2B2B2B",
      "segmentPrimary": "#666666",
      "segmentSecondary": "#BB0000",
      "triple": "#ffffff",
      "double": "#ffffff",
      "bullOuter": "#ffffff",
      "bullInner": "#BB0000",
      "wire": "#A7B1B7",
      "wireDark": "#1A1A1A",
      "label": "#ffffff",
      "alternateScoringRings": true,
      "scoringRingAccent": "#BB0000",
      "playerColors": ["#BB0000", "#666666"],
      "markColor": "#BB0000"
    }'::jsonb,
    9
  ),
  (
    'lsu',
    'LSU',
    'Purple surround with gold wedges and white scoring rings',
    '{
      "boardBase": "#461D7C",
      "segmentPrimary": "#461D7C",
      "segmentSecondary": "#FDD023",
      "triple": "#ffffff",
      "double": "#ffffff",
      "bullOuter": "#FDD023",
      "bullInner": "#461D7C",
      "wire": "#FDD023",
      "wireDark": "#2E1250",
      "label": "#ffffff",
      "alternateScoringRings": true,
      "scoringRingAccent": "#FDD023",
      "playerColors": ["#FDD023", "#461D7C"],
      "markColor": "#FDD023"
    }'::jsonb,
    10
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  colors = excluded.colors,
  sort_order = excluded.sort_order,
  is_active = true;
