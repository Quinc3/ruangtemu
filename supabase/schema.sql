-- Jalankan di Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- Tabel RSVP
create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  will_attend boolean not null,
  guest_count integer not null default 1 check (guest_count between 1 and 10),
  meal_preference text not null default 'Standard',
  created_at timestamptz not null default now()
);

-- Tabel Guestbook / Ucapan
create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table public.rsvps enable row level security;
alter table public.wishes enable row level security;

-- Tamu boleh mengirim RSVP dan membaca daftar RSVP (opsional, bisa dihapus jika tidak perlu)
create policy "Anyone can insert rsvp"
  on public.rsvps for insert
  with check (true);

create policy "Anyone can read rsvps"
  on public.rsvps for select
  using (true);

-- Tamu boleh menulis dan membaca ucapan
create policy "Anyone can insert wish"
  on public.wishes for insert
  with check (true);

create policy "Anyone can read wishes"
  on public.wishes for select
  using (true);

-- Index untuk urutan guestbook
create index if not exists wishes_created_at_idx on public.wishes (created_at desc);
