-- Persist in-app Support form submissions for staff review.
create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category text not null,
  account_type text not null,
  subject text not null,
  message text not null,
  user_email text not null,
  alternative_email text,
  image_path text,
  image_filename text,
  resend_email_id text,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'resolved', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_requests_category_check
    check (category in ('account', 'login', 'technical', 'feature')),
  constraint support_requests_account_type_check
    check (account_type in ('club', 'elite', 'league_pro', 'free', 'unsure'))
);

create index if not exists support_requests_user_id_idx
  on public.support_requests (user_id);

create index if not exists support_requests_created_at_idx
  on public.support_requests (created_at desc);

create index if not exists support_requests_status_idx
  on public.support_requests (status);

comment on table public.support_requests is
  'In-app Support form submissions. Email is also sent via Resend.';

alter table public.support_requests enable row level security;

create policy "Users can view their own support requests"
  on public.support_requests
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create their own support requests"
  on public.support_requests
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Private attachments for support tickets (service role uploads from API).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'support-attachments',
  'support-attachments',
  false,
  4194304,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
)
on conflict (id) do nothing;

create policy "Users can upload their own support attachments"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'support-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view their own support attachments"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'support-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
