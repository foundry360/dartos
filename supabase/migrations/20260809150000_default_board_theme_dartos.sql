-- New accounts must start on the DartOS / VectorOS board theme.
-- 20260724180000 accidentally reset handle_new_user to preferred_board_theme_id = 'classic'.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  kind text;
begin
  kind := lower(coalesce(new.raw_user_meta_data ->> 'account_kind', 'member'));
  if kind not in ('player', 'member') then
    kind := 'member';
  end if;

  insert into public.profiles (id, display_name, preferred_board_theme_id, account_kind)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.email),
    'dartos',
    kind
  );

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Creates a profile for each new auth user with preferred_board_theme_id = dartos.';
