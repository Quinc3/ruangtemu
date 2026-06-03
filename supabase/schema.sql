-- Jalankan di Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- ============================================================
-- Pengaturan undangan (singleton)
-- ============================================================
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
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Rundown acara
-- ============================================================
create table if not exists public.event_rundown (
  id uuid primary key default gen_random_uuid(),
  icon text not null default 'event',
  title text not null,
  time_range text,
  note text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Galeri foto
-- ============================================================
create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  image_path text not null,
  caption text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Panduan acara
-- ============================================================
create table if not exists public.guidelines (
  id uuid primary key default gen_random_uuid(),
  icon text not null default 'info',
  title text not null,
  description text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Daftar tamu undangan
-- ============================================================
create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  slug text not null unique,
  category text,
  created_at timestamptz not null default now()
);

create index if not exists guests_slug_idx on public.guests (slug);

-- ============================================================
-- RSVP (konfirmasi kehadiran)
-- ============================================================
create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid references public.guests(id) on delete set null,
  full_name text not null,
  will_attend boolean not null,
  guest_count integer not null default 1 check (guest_count between 1 and 10),
  meal_preference text not null default 'Tamu Undangan',
  created_at timestamptz not null default now()
);

-- ============================================================
-- Guestbook / Ucapan
-- ============================================================
create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.invitation_settings enable row level security;
alter table public.event_rundown enable row level security;
alter table public.gallery_images enable row level security;
alter table public.guidelines enable row level security;
alter table public.guests enable row level security;
alter table public.rsvps enable row level security;
alter table public.wishes enable row level security;

-- Public read: konten undangan
create policy "Public read invitation_settings"
  on public.invitation_settings for select using (true);

create policy "Public read active event_rundown"
  on public.event_rundown for select using (is_active = true);

create policy "Public read active gallery_images"
  on public.gallery_images for select using (is_active = true);

create policy "Public read active guidelines"
  on public.guidelines for select using (is_active = true);

create policy "Public read guests by slug"
  on public.guests for select using (true);

-- Public write: RSVP & ucapan
create policy "Anyone can insert rsvp"
  on public.rsvps for insert with check (true);

create policy "Anyone can read rsvps"
  on public.rsvps for select using (true);

create policy "Anyone can insert wish"
  on public.wishes for insert with check (true);

create policy "Anyone can read wishes"
  on public.wishes for select using (true);

-- Admin full access (service role bypasses RLS; anon needs these for admin panel)
create policy "Admin all invitation_settings"
  on public.invitation_settings for all using (true) with check (true);

create policy "Admin all event_rundown"
  on public.event_rundown for all using (true) with check (true);

create policy "Admin all gallery_images"
  on public.gallery_images for all using (true) with check (true);

create policy "Admin all guidelines"
  on public.guidelines for all using (true) with check (true);

create policy "Admin all guests"
  on public.guests for all using (true) with check (true);

create policy "Admin all rsvps"
  on public.rsvps for all using (true) with check (true);

create policy "Admin all wishes"
  on public.wishes for all using (true) with check (true);

-- Migrasi: tambah guest_id jika tabel rsvps sudah ada sebelumnya
alter table public.rsvps add column if not exists guest_id uuid references public.guests(id) on delete set null;

-- Index
create index if not exists wishes_created_at_idx on public.wishes (created_at desc);
create index if not exists event_rundown_sort_idx on public.event_rundown (sort_order);
create index if not exists gallery_images_sort_idx on public.gallery_images (sort_order);
create index if not exists guidelines_sort_idx on public.guidelines (sort_order);

-- Seed default settings (jika belum ada)
insert into public.invitation_settings (
  id,
  description_body
) values (
  1,
  'Dari hari pertama masuk kelas hingga momen terakhir berkumpul di aula, setiap langkah di SMA Ruang Temu membentuk cerita yang tak terlupakan. Kami tumbuh, belajar, dan saling mendukung — kini saatnya merayakan perjalanan ini sebelum melangkah ke bab berikutnya.'
) on conflict (id) do nothing;

-- Storage bucket: jalankan supabase/storage.sql setelah skema ini
