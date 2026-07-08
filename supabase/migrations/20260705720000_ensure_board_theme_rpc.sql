create or replace function public.ensure_board_theme(
  theme_id text,
  theme_name text,
  theme_description text,
  theme_colors jsonb,
  theme_sort_order integer default 99
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.board_themes (id, name, description, colors, sort_order, is_active)
  values (theme_id, theme_name, theme_description, theme_colors, theme_sort_order, true)
  on conflict (id) do update set
    name = excluded.name,
    description = excluded.description,
    colors = excluded.colors,
    sort_order = excluded.sort_order,
    is_active = true;
end;
$$;

revoke all on function public.ensure_board_theme(text, text, text, jsonb, integer) from public;
grant execute on function public.ensure_board_theme(text, text, text, jsonb, integer) to authenticated;
