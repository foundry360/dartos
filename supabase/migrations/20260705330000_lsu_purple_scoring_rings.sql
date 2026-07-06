update public.board_themes
set
  description = 'Purple surround with gold wedges and purple scoring rings',
  colors = (colors - 'whiteScoringRingsOn' - 'scoringRingPrimary')
    || '{
      "triple": "#461D7C",
      "double": "#461D7C",
      "scoringRingOnSegmentPrimary": "#FDD023",
      "scoringRingOnSegmentSecondary": "#461D7C"
    }'::jsonb
where id = 'lsu';
