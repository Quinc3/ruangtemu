-- ============================================================
-- Supabase Storage: bucket "ruangtemu" (gambar undangan)
-- Jalankan di Dashboard → SQL Editor (sekali per project)
-- ============================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'ruangtemu',
  'ruangtemu',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read ruangtemu images" on storage.objects;
drop policy if exists "Admin insert ruangtemu images" on storage.objects;
drop policy if exists "Admin update ruangtemu images" on storage.objects;
drop policy if exists "Admin delete ruangtemu images" on storage.objects;

create policy "Public read ruangtemu images"
  on storage.objects for select
  using (bucket_id = 'ruangtemu');

create policy "Admin insert ruangtemu images"
  on storage.objects for insert
  with check (bucket_id = 'ruangtemu');

create policy "Admin update ruangtemu images"
  on storage.objects for update
  using (bucket_id = 'ruangtemu')
  with check (bucket_id = 'ruangtemu');

create policy "Admin delete ruangtemu images"
  on storage.objects for delete
  using (bucket_id = 'ruangtemu');
