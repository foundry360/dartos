-- Allow users to clear their own read state (mark as unread).
create policy "Users delete own announcement reads"
  on public.announcement_reads
  for delete
  to authenticated
  using (auth.uid() = user_id);
