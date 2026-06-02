import { supabase, isSupabaseConfigured } from './supabase.js'

/** Nama bucket — samakan dengan supabase/storage.sql dan .env */
export const INVITATION_IMAGES_BUCKET =
  import.meta.env.VITE_SUPABASE_STORAGE_BUCKET?.trim() || 'ruangtemu'

export const STORAGE_SETTINGS_PREFIX = 'settings'
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/** Path di bucket → URL publik; URL lama (http) tetap didukung */
export function resolveImageUrl(pathOrUrl) {
  if (!pathOrUrl?.trim()) return null
  const v = pathOrUrl.trim()
  if (/^https?:\/\//i.test(v)) return v
  if (!supabase) return null
  const { data } = supabase.storage.from(INVITATION_IMAGES_BUCKET).getPublicUrl(v)
  return data?.publicUrl ?? null
}

export function validateImageFile(file) {
  if (!file) return
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Format gambar: JPG, PNG, WebP, atau GIF')
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Ukuran gambar maksimal 5 MB')
  }
}

function imageExtension(file) {
  const m = file.name.match(/\.(jpe?g|png|webp|gif)$/i)
  if (m) return `.${m[1].toLowerCase().replace('jpeg', 'jpg')}`
  const byType = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
  }
  return byType[file.type] || '.jpg'
}

/** Nama aman dari nama file asli (tanpa ekstensi) */
export function sanitizeFileBaseName(filename) {
  const base = filename.replace(/\.[^.]+$/, '').trim()
  const safe = base
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return (safe || 'gambar').slice(0, 48)
}

/**
 * Path unik: settings/{slot}-{timestamp}-{nama-asli}.ext
 * slot: 'hero' | 'description' (hanya label folder logis, bukan nama file tetap)
 */
export function buildSettingsImagePath(file, slot) {
  const ext = imageExtension(file)
  const base = sanitizeFileBaseName(file.name)
  return `${STORAGE_SETTINGS_PREFIX}/${slot}-${Date.now()}-${base}${ext}`
}

export async function uploadSettingsImage(file, slot) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi')
  validateImageFile(file)
  const objectPath = buildSettingsImagePath(file, slot)
  const { error } = await supabase.storage
    .from(INVITATION_IMAGES_BUCKET)
    .upload(objectPath, file, { upsert: false, contentType: file.type })
  if (error) throw error
  return objectPath
}

/** Hapus file lama di bucket saat diganti upload baru */
export async function removeInvitationImage(path) {
  if (!path?.trim() || !supabase || /^https?:\/\//i.test(path)) return
  await supabase.storage.from(INVITATION_IMAGES_BUCKET).remove([path.trim()])
}

/** Cek bucket siap dipakai (untuk panel admin) */
export async function checkStorageBucket() {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, message: 'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum diisi di .env' }
  }
  const { error } = await supabase.storage.from(INVITATION_IMAGES_BUCKET).list(STORAGE_SETTINGS_PREFIX, {
    limit: 1,
  })
  if (!error) {
    return { ok: true, message: `Bucket "${INVITATION_IMAGES_BUCKET}" siap. Upload gambar di bawah.` }
  }
  const msg = error.message || ''
  if (/not found|does not exist|Bucket/i.test(msg)) {
    return {
      ok: false,
      message: `Bucket "${INVITATION_IMAGES_BUCKET}" belum ada. Jalankan supabase/storage.sql di SQL Editor.`,
    }
  }
  if (/policy|permission|denied|403/i.test(msg)) {
    return {
      ok: false,
      message: 'Akses Storage ditolak. Jalankan supabase/storage.sql (policy RLS).',
    }
  }
  return { ok: false, message: msg }
}
