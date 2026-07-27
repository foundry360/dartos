-- Avoid returning a null-composite row (PostgREST/JS then queries uuid "null").
-- Return type change requires drop + recreate.

drop function if exists public.get_my_community_room();

create function public.get_my_community_room()
returns setof public.community_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  return query
  select r.*
  from public.community_rooms r
  inner join public.community_room_members m on m.room_id = r.id
  where m.user_id = uid
    and r.status in ('lobby', 'playing')
    and r.expires_at > now()
  order by r.created_at desc
  limit 1;
end;
$$;

revoke all on function public.get_my_community_room() from public;
grant execute on function public.get_my_community_room() to authenticated;
