-- Public CDN cache for dynamically generated player voice clips (turn + Game On).

insert into storage.buckets (id, name, public)
values ('voice-clips', 'voice-clips', true)
on conflict (id) do nothing;

create policy "Voice clips are publicly accessible"
  on storage.objects
  for select
  to public
  using (bucket_id = 'voice-clips');
