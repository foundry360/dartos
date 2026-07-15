-- Searchable Vector profiles for league roster add flow.
-- Profiles remain private via RLS; this RPC returns limited public fields only.

create or replace function public.search_vector_profiles(
  search_query text,
  result_limit integer default 20
)
returns table (
  id uuid,
  display_name text,
  nickname text,
  avatar_url text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  normalized text := lower(trim(coalesce(search_query, '')));
  safe_limit integer := least(greatest(coalesce(result_limit, 20), 1), 50);
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if char_length(normalized) < 2 then
    return;
  end if;

  return query
  select
    p.id,
    p.display_name,
    p.nickname,
    p.avatar_url
  from public.profiles p
  where p.deactivated_at is null
    and (
      lower(coalesce(p.display_name, '')) like '%' || normalized || '%'
      or lower(coalesce(p.nickname, '')) like '%' || normalized || '%'
    )
  order by
    case
      when lower(coalesce(p.display_name, '')) = normalized then 0
      when lower(coalesce(p.nickname, '')) = normalized then 1
      when lower(coalesce(p.display_name, '')) like normalized || '%' then 2
      else 3
    end,
    p.display_name asc nulls last
  limit safe_limit;
end;
$$;

revoke all on function public.search_vector_profiles(text, integer) from public;
grant execute on function public.search_vector_profiles(text, integer) to authenticated;
