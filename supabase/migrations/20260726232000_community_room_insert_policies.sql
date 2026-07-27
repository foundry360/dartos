-- Allow hosts to create rooms via direct table inserts (avoids PostgREST RPC schema cache issues).

drop policy if exists "Hosts can create community rooms" on public.community_rooms;
create policy "Hosts can create community rooms"
  on public.community_rooms
  for insert
  to authenticated
  with check (host_id = auth.uid());

-- Replace member-only select with host-or-member.
drop policy if exists "Members can read community rooms" on public.community_rooms;
drop policy if exists "Hosts can read own community rooms" on public.community_rooms;
create policy "Hosts and members can read community rooms"
  on public.community_rooms
  for select
  to authenticated
  using (host_id = auth.uid() or public.is_community_room_member(id));

drop policy if exists "Users can join community rooms as themselves" on public.community_room_members;
create policy "Users can join community rooms as themselves"
  on public.community_room_members
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Hosts can delete own community rooms" on public.community_rooms;
create policy "Hosts can delete own community rooms"
  on public.community_rooms
  for delete
  to authenticated
  using (host_id = auth.uid());

notify pgrst, 'reload schema';
