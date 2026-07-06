insert into public.board_themes (id, name, description, colors, sort_order)
values
  (
    'classic',
    'Classic',
    'Traditional sisal tournament board',
    '{
      "boardBase": "#5a3d28",
      "segmentPrimary": "#1e1812",
      "segmentSecondary": "#f2e8cf",
      "triple": "#15803d",
      "double": "#15803d",
      "bullOuter": "#15803d",
      "bullInner": "#b91c3a",
      "wire": "#9ca3af",
      "wireDark": "#374151",
      "label": "#f2e8cf",
      "alternateScoringRings": true,
      "scoringRingAccent": "#b91c3a"
    }'::jsonb,
    0
  ),
  (
    'gold',
    'Gold',
    'Rich gold wedges on a deep charcoal base',
    '{
      "boardBase": "#14100a",
      "segmentPrimary": "#1f1810",
      "segmentSecondary": "#c9a227",
      "triple": "#f5d547",
      "double": "#a67c00",
      "bullOuter": "#f5d547",
      "bullInner": "#8b6914",
      "wire": "#d4af37",
      "wireDark": "#3d3018",
      "label": "#f8ecc8"
    }'::jsonb,
    1
  ),
  (
    'teal',
    'Teal',
    'Cool teal singles with bright aqua scoring rings',
    '{
      "boardBase": "#071418",
      "segmentPrimary": "#0c2229",
      "segmentSecondary": "#5eead4",
      "triple": "#2dd4bf",
      "double": "#0f766e",
      "bullOuter": "#14b8a6",
      "bullInner": "#115e59",
      "wire": "#5eead4",
      "wireDark": "#134e4a",
      "label": "#ccfbf1"
    }'::jsonb,
    2
  ),
  (
    'black',
    'Black',
    'Monochrome singles with silver scoring rings',
    '{
      "boardBase": "#050505",
      "segmentPrimary": "#121212",
      "segmentSecondary": "#3f3f46",
      "triple": "#71717a",
      "double": "#a1a1aa",
      "bullOuter": "#52525b",
      "bullInner": "#d4d4d8",
      "wire": "#737373",
      "wireDark": "#262626",
      "label": "#e4e4e7"
    }'::jsonb,
    3
  ),
  (
    'patriot',
    'Patriot',
    'Navy surround with blue wedges and white scoring rings',
    '{
      "boardBase": "#002A5B",
      "segmentPrimary": "#002A5B",
      "segmentSecondary": "#4093D0",
      "triple": "#ffffff",
      "double": "#ffffff",
      "bullOuter": "#ffffff",
      "bullInner": "#D12328",
      "wire": "#cbd5e1",
      "wireDark": "#001833",
      "label": "#ffffff",
      "segmentMatchedScoringRings": true,
      "playerColors": ["#4093D0", "#002A5B"],
      "markColor": "#D12328"
    }'::jsonb,
    4
  ),
  (
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
  ),
  (
    'yankees',
    'Yankees',
    'Midnight navy and silver wedges with white and blue scoring rings',
    '{
      "boardBase": "#0C2340",
      "segmentPrimary": "#0C2340",
      "segmentSecondary": "#C4CED4",
      "triple": "#ffffff",
      "double": "#ffffff",
      "bullOuter": "#C4CED4",
      "bullInner": "#b91c3a",
      "wire": "#C4CED4",
      "wireDark": "#001A33",
      "label": "#ffffff",
      "segmentMatchedScoringRings": true,
      "whiteScoringRingsOn": "segmentPrimary",
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
      "bullOuter": "#FA4616",
      "bullInner": "#b91c3a",
      "wire": "#FA4616",
      "wireDark": "#001233",
      "label": "#ffffff",
      "segmentMatchedScoringRings": true,
      "playerColors": ["#FA4616", "#0021A5"],
      "markColor": "#FA4616"
    }'::jsonb,
    7
  ),
  (
    'golden-knights',
    'Golden Knights',
    'Black and gold wedges with gold and red scoring rings',
    '{
      "boardBase": "#1A1A1A",
      "segmentPrimary": "#1A1A1A",
      "segmentSecondary": "#B4975A",
      "triple": "#ffffff",
      "double": "#ffffff",
      "bullOuter": "#B4975A",
      "bullInner": "#b91c3a",
      "wire": "#B4975A",
      "wireDark": "#0A0A0A",
      "label": "#ffffff",
      "segmentMatchedScoringRings": true,
      "scoringRingOnSegmentPrimary": "#B4975A",
      "scoringRingOnSegmentSecondary": "#C8102E",
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
      "bullOuter": "#666666",
      "bullInner": "#b91c3a",
      "wire": "#A7B1B7",
      "wireDark": "#1A1A1A",
      "label": "#ffffff",
      "segmentMatchedScoringRings": true,
      "playerColors": ["#BB0000", "#666666"],
      "markColor": "#BB0000"
    }'::jsonb,
    9
  ),
  (
    'lsu',
    'LSU',
    'Purple surround with gold wedges and purple scoring rings',
    '{
      "boardBase": "#461D7C",
      "segmentPrimary": "#461D7C",
      "segmentSecondary": "#FDD023",
      "triple": "#461D7C",
      "double": "#461D7C",
      "bullOuter": "#FDD023",
      "bullInner": "#b91c3a",
      "wire": "#FDD023",
      "wireDark": "#2E1250",
      "label": "#ffffff",
      "segmentMatchedScoringRings": true,
      "scoringRingOnSegmentPrimary": "#FDD023",
      "scoringRingOnSegmentSecondary": "#461D7C",
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
