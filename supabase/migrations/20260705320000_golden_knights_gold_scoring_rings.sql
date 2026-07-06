update public.board_themes
set
  description = 'Black and gold wedges with gold and red scoring rings',
  colors = (colors - 'whiteScoringRingsOn' - 'scoringRingPrimary')
    || '{
      "scoringRingOnSegmentPrimary": "#B4975A",
      "scoringRingOnSegmentSecondary": "#C8102E"
    }'::jsonb
where id = 'golden-knights';
