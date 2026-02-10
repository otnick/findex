-- Avatar storage bucket + policies
-- 1) Create public bucket (id must be unique)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 2) Allow public read access
create policy "avatars_public_read"
on storage.objects
for select
using (bucket_id = 'avatars');

-- 3) Allow authenticated users to manage their own avatar files
create policy "avatars_user_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "avatars_user_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "avatars_user_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);
