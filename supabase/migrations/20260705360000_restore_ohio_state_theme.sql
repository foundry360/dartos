update public.board_themes
set
  description = 'Charcoal surround with scarlet wedges and white scoring rings',
  colors = (colors
    - 'scoringRingOnSegmentPrimary'
    - 'scoringRingOnSegmentSecondary'
    - 'whiteScoringRingsOn'
    - 'scoringRingPrimary')
    || '{
      "triple": "#ffffff",
      "double": "#ffffff",
      "bullOuter": "#BB0000",
      "bullInner": "#b91c3a",
      "segmentMatchedScoringRings": true
    }'::jsonb
where id = 'ohio-state';
