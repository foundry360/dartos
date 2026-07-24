-- Keep pending registration requests visible in Discover with membership status.

drop function if exists public.search_joinable_leagues(text, int);

create or replace function public.search_joinable_leagues(
  search_query text default '',
  result_limit int default 20
)
returns table (
  id uuid,
  name text,
  slug text,
  description text,
  organization_id uuid,
  organization_name text,
  registration_mode text,
  starts_at timestamptz,
  ends_at timestamptz,
  published_at timestamptz,
  game_format text,
  format text,
  max_players integer,
  player_count integer,
  membership_status text
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  q text := trim(coalesce(search_query, ''));
  lim int := greatest(1, least(coalesce(result_limit, 20), 50));
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  return query
  select
    l.id,
    l.name,
    l.slug,
    l.description,
    l.organization_id,
    o.name as organization_name,
    l.registration_mode,
    l.starts_at,
    l.ends_at,
    l.published_at,
    l.game_format,
    l.format,
    l.max_players,
    (
      select count(*)::integer
      from public.league_players lp
      where lp.league_id = l.id
        and lp.status in ('active', 'invited', 'pending')
    ) as player_count,
    (
      select lp.status
      from public.league_players lp
      where lp.league_id = l.id
        and lp.profile_user_id = auth.uid()
      limit 1
    ) as membership_status
  from public.leagues l
  join public.organizations o on o.id = l.organization_id
  where l.published_at is not null
    and l.registration_mode in ('open', 'code')
    and not exists (
      select 1
      from public.league_players lp
      where lp.league_id = l.id
        and lp.profile_user_id = auth.uid()
        and lp.status = 'active'
        and lp.vector_account = 'connected'
    )
    and (
      q = ''
      or l.name ilike '%' || q || '%'
      or o.name ilike '%' || q || '%'
      or coalesce(l.description, '') ilike '%' || q || '%'
    )
  order by l.starts_at nulls last, l.name
  limit lim;
end;
$$;

revoke all on function public.search_joinable_leagues(text, int) from public;
grant execute on function public.search_joinable_leagues(text, int) to authenticated;
