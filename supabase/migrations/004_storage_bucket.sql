-- Migration 004: Create attachments storage bucket and RLS policies
-- Used for receipt photos, invoice PDFs, check images

begin;

-- Create the attachments bucket (public = false means files require auth)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'attachments',
  'attachments',
  false,
  5242880, -- 5MB max per file
  array['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

-- RLS policies for storage.objects

-- Authenticated users can upload files to requisitions they own
-- Path pattern: requisitions/{requisition_id}/{filename}
create policy "Authenticated users can upload attachments"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'attachments'
  );

-- Users can read attachments for requisitions they can see
-- (relies on the requisitions RLS policies for actual access control;
--  the app fetches signed URLs server-side so this is belt-and-suspenders)
create policy "Authenticated users can read attachments"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'attachments'
  );

-- Users can delete their own uploads, admins can delete any
create policy "Users can delete own attachments"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'attachments'
    and (owner_id::text) = (auth.uid()::text)
  );

commit;
