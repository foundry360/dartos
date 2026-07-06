update public.board_themes
set
  colors = (colors - 'alternateScoringRings' - 'scoringRingAccent')
    || '{"segmentMatchedScoringRings": true}'::jsonb
where id = 'patriot';
