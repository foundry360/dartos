update public.board_themes
set
  description = 'Charcoal surround with scarlet wedges and black scoring rings',
  colors = (colors - 'whiteScoringRingsOn' - 'scoringRingPrimary')
    || '{
      "triple": "#000000",
      "double": "#000000",
      "scoringRingOnSegmentPrimary": "#BB0000",
      "scoringRingOnSegmentSecondary": "#000000"
    }'::jsonb
where id = 'ohio-state';
