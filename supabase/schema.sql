-- ============================================================
-- DATABASE SCHEMA UNTUK UNDANGAN PERPISAHAN (Ruang Temu)
-- Jalankan di Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Undangan Settings (singleton)
create table if not exists public.invitation_settings (
  id integer primary key default 1 check (id = 1),
  org_name text not null default 'SMA Ruang Temu',
  hero_label text not null default 'Dengan penuh sukacita, kami mengundang',
  event_title text not null default 'Acara Perpisahan & Wisuda',
  event_subtitle text not null default 'Angkatan XII — Tahun Ajaran 2025/2026',
  event_date_display text not null default 'Sabtu, 14 Juni 2026',
  event_starts_at timestamptz,
  countdown_enabled boolean not null default true,
  hero_image_path text not null default '',
  description_label text not null default 'KENANGAN KITA',
  description_title text not null default 'Tiga Tahun Berjalan Bersama',
  description_body text not null default '',
  description_quote text,
  description_image_path text not null default '',
  venue_name text not null default 'SMA Ruang Temu',
  venue_address text not null default 'Jl. Pendidikan No. 12, Jakarta Selatan',
  gmaps_embed_url text,
  gmaps_link_url text default 'https://maps.google.com',
  guidelines_section_enabled boolean not null default true,
  guidelines_palette_title text default 'WARNA ANGKATAN',
  guidelines_palette_note text default 'Palet resmi: Slate, Gold, Sky Blue, dan Midnight.',
  footer_tagline text default 'Merajut kenangan, melangkah ke masa depan',
  footer_copyright text default 'Angkatan XII SMA Ruang Temu • 2026',
  rsvp_deadline_text text default 'Mohon konfirmasi sebelum 1 Juni 2026',
  -- Kolom visibilitas section (tambahan)
  show_navbar boolean not null default true,
  show_footer boolean not null default true,
  show_story boolean not null default true,
  show_kas_kenangan boolean not null default false,
  show_rsvp boolean not null default true,
  show_guestbook boolean not null default true,
  show_countdown boolean not null default false,
  show_gallery boolean not null default false,
  show_rundown boolean not null default false,
  show_guidelines boolean not null default false,
  show_dresscode boolean not null default false,
  show_map boolean not null default false,
  show_hero_button boolean not null default true,
  section_order text[] default ARRAY['story','gallery','details','guidelines-dresscode-row','kas-kenangan','rsvp'],
  updated_at timestamptz not null default now()
);

-- 2. Rundown Acara
create table if not exists public.event_rundown (
  id uuid primary key default gen_random_uuid(),
  icon text not null default 'event',
  title text not null,
  time_range text,
  note text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  bg_color text default null,
  text_color text default null,
  created_at timestamptz not null default now()
);

-- 3. Galeri Foto
create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  image_path text not null,
  caption text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 4. Panduan Acara
create table if not exists public.guidelines (
  id uuid primary key default gen_random_uuid(),
  icon text not null default 'info',
  title text not null,
  description text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 5. Tamu Undangan
create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  slug text not null unique,
  category text,
  created_at timestamptz not null default now()
);

-- 6. RSVP (Kehadiran)
create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid references public.guests(id) on delete set null,
  full_name text not null,
  will_attend boolean not null,
  guest_count integer not null default 1 check (guest_count between 1 and 10),
  meal_preference text not null default 'Tamu Undangan',
  created_at timestamptz not null default now()
);

-- 7. Ucapan / Guestbook
create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- 8. Dresscode Palette
create table if not exists public.dresscode_palette (
  id integer primary key default 1 check (id = 1),
  is_active boolean default false,
  color1 text default '#FFB6C1',
  color2 text default '#87CEEB',
  color3 text default '#98FB98',
  color4 text default '#FFD700',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- INDEX
-- ============================================================
create index if not exists guests_slug_idx on public.guests (slug);
create index if not exists event_rundown_sort_idx on public.event_rundown (sort_order);
create index if not exists gallery_images_sort_idx on public.gallery_images (sort_order);
create index if not exists guidelines_sort_idx on public.guidelines (sort_order);
create index if not exists wishes_created_at_idx on public.wishes (created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.invitation_settings enable row level security;
alter table public.event_rundown enable row level security;
alter table public.gallery_images enable row level security;
alter table public.guidelines enable row level security;
alter table public.guests enable row level security;
alter table public.rsvps enable row level security;
alter table public.wishes enable row level security;
alter table public.dresscode_palette enable row level security;

-- Hapus semua policy yang mungkin bentrok (jika ada)
do $$
declare
  pol record;
begin
  for pol in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end $$;

-- Policy: Public read untuk konten undangan
create policy "Public read" on public.invitation_settings for select using (true);
create policy "Public read" on public.event_rundown for select using (is_active = true);
create policy "Public read" on public.gallery_images for select using (is_active = true);
create policy "Public read" on public.guidelines for select using (is_active = true);
create policy "Public read" on public.guests for select using (true);
create policy "Public read" on public.rsvps for select using (true);
create policy "Public read" on public.wishes for select using (true);
create policy "Public read" on public.dresscode_palette for select using (true);

-- Policy: Public insert (RSVP & ucapan)
create policy "Public insert" on public.rsvps for insert with check (true);
create policy "Public insert" on public.wishes for insert with check (true);

-- Policy: Admin full access (semua tabel)
create policy "Admin all" on public.invitation_settings for all using (true) with check (true);
create policy "Admin all" on public.event_rundown for all using (true) with check (true);
create policy "Admin all" on public.gallery_images for all using (true) with check (true);
create policy "Admin all" on public.guidelines for all using (true) with check (true);
create policy "Admin all" on public.guests for all using (true) with check (true);
create policy "Admin all" on public.rsvps for all using (true) with check (true);
create policy "Admin all" on public.wishes for all using (true) with check (true);
create policy "Admin all" on public.dresscode_palette for all using (true) with check (true);

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values (
  'ruangtemu', 'ruangtemu', true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Hapus semua policy storage yang ada
do $$
declare
  pol record;
begin
  for pol in
    select name
    from storage.policies
    where bucket_id = 'ruangtemu'
  loop
    execute format('drop policy if exists %I on storage.objects', pol.name);
  end loop;
end $$;

-- Policy storage: public read, admin CRUD
create policy "Public read"
  on storage.objects for select
  using (bucket_id = 'ruangtemu');

create policy "Admin insert"
  on storage.objects for insert
  with check (bucket_id = 'ruangtemu');

create policy "Admin update"
  on storage.objects for update
  using (bucket_id = 'ruangtemu')
  with check (bucket_id = 'ruangtemu');

create policy "Admin delete"
  on storage.objects for delete
  using (bucket_id = 'ruangtemu');

-- ============================================================
-- SEED DATA
-- ============================================================
insert into public.invitation_settings (id, description_body) values (
  1,
  'Dari hari pertama masuk kelas hingga momen terakhir berkumpul di aula, setiap langkah di SMA Ruang Temu membentuk cerita yang tak terlupakan. Kami tumbuh, belajar, dan saling mendukung — kini saatnya merayakan perjalanan ini sebelum melangkah ke bab berikutnya.'
) on conflict (id) do nothing;

insert into public.dresscode_palette (id, is_active) values (1, false)
  on conflict (id) do nothing;