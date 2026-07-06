update public.board_themes
set colors = (colors - 'segmentMatchedScoringRings')
  || '{"alternateScoringRings": true, "scoringRingAccent": "#D7A22A"}'::jsonb
where id = 'jaguars';
