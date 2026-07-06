update public.board_themes
set colors = (colors - 'alternateScoringRings' - 'scoringRingAccent')
  || '{"segmentMatchedScoringRings": true}'::jsonb
where id in ('yankees', 'gators', 'golden-knights', 'ohio-state', 'lsu');
