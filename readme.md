Berikut adalah konten lengkap yang sudah dirapikan dan siap kamu gunakan untuk file `README.md` proyekmu. Kamu hanya perlu menyalin seluruh teks di dalam blok kode di bawah ini:

````markdown
# 🎓 Undangan Perpisahan Digital — Ruang Temu

Aplikasi undangan perpisahan & wisuda berbasis web, dibangun dengan **Vite**, **Supabase**, dan **Tailwind CSS**.  
Dilengkapi panel admin untuk mengelola tamu, rundown, galeri, panduan, dresscode, serta kontrol visibilitas dan urutan setiap section di halaman publik.

---

## ✨ Fitur Utama

- **Halaman Publik:** Desain yang _playful_ dan responsif (tema _Pastel Playtime_).
- **Panel Admin:** Dilengkapi proteksi password untuk mengelola berbagai modul:
  - **Tamu Undangan:** Pembuatan slug otomatis dan _link_ personal.
  - **Rundown Acara:** Pengaturan ikon, waktu, dan catatan acara.
  - **Galeri Foto:** Fitur upload, caption, dan visualisasi lightbox.
  - **Panduan Acara:** Manajemen ikon dan deskripsi informasi.
  - **Dresscode:** Pengaturan hingga 4 warna beserta toggle tampilkan/sembunyikan.
  - **Pengaturan Konten:** Kustomisasi hero, story, peta, hingga footer.
  - **Visibilitas Section:** Kontrol penuh untuk menampilkan/menyembunyikan bagian navbar, footer, story, galeri, dll.
  - **Layout Builder:** Fitur _drag-and-drop_ untuk mengatur urutan section.
- **Countdown Timer:** Penghitung waktu mundur interaktif menuju hari H.
- **RSVP & Guestbook:** Sistem konfirmasi kehadiran dan wadah ucapan/doa dari tamu.
- **Efek Visual Menarik:** Didukung oleh _parallax hero_, animasi _reveal_, dekorasi mengambang, dan hover interaktif.
- **Database & Storage:** Infrastruktur siap pakai terintegrasi langsung dengan Supabase.

---

## 🚀 Memulai

### 1. Prasyarat

Sebelum memulai, pastikan kamu sudah menyiapkan:

- **Node.js** ≥ versi 18
- **Akun Supabase** (bisa menggunakan tier gratis) — [supabase.com](https://supabase.com)
- **Git** (opsional, untuk _cloning_)

### 2. Instalasi proyek

Clone repositori ini dan masuk ke direktori proyek, lalu instal semua dependensi yang dibutuhkan:

```bash
git clone <url-repository>
cd ruangtemu-native
npm install
```
````

### 3. Konfigurasi Environment

Salin file contoh konfigurasi `.env.example` menjadi `.env`:

```bash
cp .env.example .env

```

Buka file `.env` tersebut, lalu isi dengan kredensial proyek Supabase kamu:

```env
VITE_SUPABASE_URL=[https://xxxxxxxxxxxx.supabase.co](https://xxxxxxxxxxxx.supabase.co)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
VITE_ADMIN_PASSWORD=admin123
VITE_SUPABASE_STORAGE_BUCKET=ruangtemu

```

> **Catatan:** Ubah isi `VITE_ADMIN_PASSWORD` dengan password pilihanmu untuk mengamankan login ke panel admin.

### 4. Setup Database Supabase

1. Masuk ke [Supabase Dashboard](https://supabase.com/dashboard) dan pilih proyekmu.
2. Navigasikan ke menu **SQL Editor** di sidebar kiri.
3. Salin seluruh kode yang ada di dalam file **`supabase/schema.sql`** proyekmu, lalu tempel (_paste_) ke SQL Editor dan jalankan (_Run_).
4. Langkah ini otomatis akan membuat seluruh tabel, indeks, policy keamanan, storage bucket, beserta seed data awal yang dibutuhkan aplikasi.

### 5. Menjalankan Server Lokal

Jalankan perintah berikut untuk memulai _development server_:

```bash
npm run dev

```

Aplikasi kamu kini sudah bisa diakses melalui tautan berikut:

- **Halaman Publik:** `http://localhost:5173`
- **Panel Admin:** `http://localhost:5173/admin.html`
- _Gunakan password yang telah kamu atur di file `.env` (default: `admin123`) untuk masuk ke panel admin._

---

## 📦 Build untuk Produksi

Jika aplikasi sudah siap disebarluaskan, kompilasi kode proyek menggunakan perintah:

```bash
npm run build

```

Seluruh hasil kompilasi siap pakai akan berada di dalam folder `dist/`. Kamu bisa langsung mengunggah (_deploy_) folder tersebut ke berbagai layanan hosting statis favoritmu seperti **Vercel**, **Netlify**, atau **GitHub Pages**.

---

## 📁 Struktur Proyek

```text
├── public/
│   └── favicon.svg
├── src/
│   ├── lib/
│   │   ├── supabase.js          # Konfigurasi Supabase client
│   │   ├── storage.js           # Utilitas upload/hapus gambar
│   │   └── material-icons.js    # Helper icon Material Symbols
│   ├── styles/
│   │   └── shared.css           # CSS tambahan (countdown, gallery)
│   ├── admin.js                 # Logika utama panel admin
│   ├── invitation.js            # Entry point publik (countdown, gallery)
│   ├── main.js                  # Fungsi inti (render, visibilitas, form)
│   ├── style.css                # Tema publik (Pastel Playtime + Tailwind)
│   └── style-admin.css          # Tema visual khusus halaman admin
├── supabase/
│   ├── schema.sql               # Skema database & konfigurasi lengkap
│   └── data/                    # Seed data CSV (opsional)
├── admin.html                   # Berkas HTML panel admin
├── index.html                   # Berkas HTML undangan publik
├── .env.example
├── package.json
└── vite.config.js

```

---

## 🎨 Kustomisasi

### Tema Warna

Seluruh palet warna diatur di dalam file `src/style.css` memanfaatkan fitur variabel konfigurasi Tailwind (`@theme`). Kamu bisa menyesuaikan kode warna di bawah ini sesuai keinginan:

```css
--brand-pink: #ffb6c1;
--brand-yellow: #ffd700;
--brand-mint: #98fb98;
--brand-orange: #ffb347;
--color-primary-2: #87ceeb; /* Sky Blue */
--color-tertiary: #78d97a; /* Mint Green */
```

### Font / Tipografi

Aplikasi ini menggunakan kombinasi font **Fredoka** (untuk judul/display) & **Poppins** (untuk teks body). Jika ingin mengubahnya, kamu bisa menyesuaikan bagian `--font-*` pada file `style.css` serta memperbarui tag `<link>` Google Fonts yang ada di file `index.html`.

---

## 🔧 Troubleshooting (Penyelesaian Masalah)

### 🚫 Halaman publik tidak muncul / stuck di loading screen

- Periksa kembali file `.env` milikmu. Pastikan isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` tidak tertukar atau salah salin.
- Buka **Console Browser** (tekan F12) untuk melihat pesan error yang spesifik.
- Pastikan tabel `invitation_settings` memiliki minimal satu baris data dengan `id = 1`. Jika kosong, jalankan kembali SQL Seed dari berkas `schema.sql`.

### 🚫 Gagal saat mengunggah (upload) gambar

- Pastikan bucket bernama `ruangtemu` sudah benar-benar terbuat di menu **Storage** pada dashboard Supabase kamu.
- Pastikan kebijakan keamanan (Storage Policies) sudah terpasang dengan benar (bisa dicek kembali lewat `schema.sql`).

### 🚫 Modul dresscode tidak tersimpan / muncul error policy

- Jalankan ulang baris perintah SQL khusus untuk policy dresscode yang ada di dalam `schema.sql`.
- Pastikan konfigurasi policy menggunakan aturan akses publik penuh: `FOR ALL USING (true) WITH CHECK (true)`.

---

## 🤝 Kontribusi

Proyek ini bersifat _open-source_. Jika kamu memiliki ide perbaikan, optimalisasi fitur, atau menemukan bug, silakan buat **Issue** baru atau langsung kirimkan **Pull Request**.

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah **MIT License** — © 2026 Ruang Temu.

---
