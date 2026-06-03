-- Countdown acara + galeri foto
-- Jalankan di Supabase SQL Editor setelah schema.sql

alter table public.invitation_settings
  add column if not exists event_starts_at timestamptz,
  add column if not exists countdown_enabled boolean not null default true;

create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  image_path text not null,
  caption text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists gallery_images_sort_idx on public.gallery_images (sort_order);

alter table public.gallery_images enable row level security;

create policy "Public read active gallery_images"
  on public.gallery_images for select using (is_active = true);

create policy "Admin all gallery_images"
  on public.gallery_images for all using (true) with check (true);
