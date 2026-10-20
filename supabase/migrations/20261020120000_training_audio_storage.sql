-- Move lecture audio out of the database and into private object storage.
--
-- Previously `audioUrl` held a base64 data: URL, which inflated every row,
-- every /api/train response, and every training page by megabytes. Rows now
-- store an object path; playback uses short-lived signed URLs.

alter table public.trainings
  add column if not exists "audioPath" text not null default '';

alter table public.trainings
  drop column if exists "audioUrl";

-- Private bucket: no public read. Access is granted only through the
-- per-user policies below plus signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('training-audio', 'training-audio', false, 52428800, array['audio/mpeg'])
on conflict (id) do nothing;

-- Objects are stored as <user_id>/<training_id>.mp3, so the first path
-- segment is the owner. Users can only touch their own folder.
drop policy if exists "Users can upload their own training audio" on storage.objects;
create policy "Users can upload their own training audio"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'training-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can read their own training audio" on storage.objects;
create policy "Users can read their own training audio"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'training-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can update their own training audio" on storage.objects;
create policy "Users can update their own training audio"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'training-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'training-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete their own training audio" on storage.objects;
create policy "Users can delete their own training audio"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'training-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
