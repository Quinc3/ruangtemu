-- Migrasi: URL gambar → path file di Storage (jalankan sekali di SQL Editor)

-- Kolom pengaturan undangan
alter table public.invitation_settings
  rename column hero_image_url to hero_image_path;

alter table public.invitation_settings
  rename column description_image_url to description_image_path;

alter table public.invitation_settings
  alter column hero_image_path set default '';

alter table public.invitation_settings
  alter column description_image_path set default '';

-- Kosongkan URL eksternal lama (upload ulang lewat admin)
update public.invitation_settings
set
  hero_image_path = case when hero_image_path ~ '^https?://' then '' else hero_image_path end,
  description_image_path = case when description_image_path ~ '^https?://' then '' else description_image_path end
where id = 1;

-- Bucket + policy: jalankan supabase/storage.sql
