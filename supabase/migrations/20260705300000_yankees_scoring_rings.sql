update public.board_themes
set
  description = 'Midnight navy and silver wedges with white and blue scoring rings',
  colors = (colors - 'scoringRingPrimary') || '{"whiteScoringRingsOn": "segmentPrimary"}'::jsonb
where id = 'yankees';
