# Setup Supabase Storage (bucket `ruangtemu`)

## Bucket di Dashboard

Di **Storage** buat bucket **`ruangtemu`** (public), atau jalankan `storage.sql` yang membuatnya otomatis.

## 1. SQL (wajib untuk upload dari admin)

**SQL Editor** → jalankan `supabase/storage.sql` (policy RLS).

Tanpa ini, upload dari `/admin.html` gagal meski bucket sudah ada.

## 2. `.env` (Vite)

```env
VITE_SUPABASE_URL=https://esnkybtliiztlfgskrmd.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_SUPABASE_STORAGE_BUCKET=ruangtemu
VITE_ADMIN_PASSWORD=...
```

- URL **tanpa** slash di akhir.
- **Jangan** simpan S3 Access Key Secret di `VITE_*` — nilai itu bisa dibaca siapa saja di browser.

## 3. S3 Connection (opsional)

Di **Project Settings → Storage → S3**:

- Endpoint: `https://esnkybtliiztlfgskrmd.storage.supabase.co/storage/v1/s3`
- Region: `ap-south-1`

Itu untuk AWS CLI / backend / script server, **bukan** untuk panel admin Vite ini. Admin memakai `@supabase/supabase-js` + anon key.

## 4. Upload gambar

`/admin.html` → **Pengaturan Undangan** → pilih file → **Simpan**.

File tersimpan di bucket `ruangtemu`, folder `settings/`:

- `settings/hero.jpg`
- `settings/description.jpg`

Path itu disimpan di kolom `hero_image_path` / `description_image_path`.
