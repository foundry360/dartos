insert into public.board_themes (id, name, description, colors, sort_order)
values (
  'patriot',
  'Patriot',
  'Navy surround with blue wedges and red scoring rings',
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
    "alternateScoringRings": true,
    "scoringRingAccent": "#D12328",
    "playerColors": ["#4093D0", "#002A5B"],
    "markColor": "#D12328"
  }'::jsonb,
  4
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  colors = excluded.colors,
  sort_order = excluded.sort_order,
  is_active = true;
