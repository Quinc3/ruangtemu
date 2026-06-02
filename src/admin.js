import './style.css'
import {
  supabase,
  isSupabaseConfigured,
  generateUniqueSlug,
  getGuestLink,
  getPublicLink,
} from './lib/supabase.js'
import { iconSelectField, bindIconSelectPreview } from './lib/material-icons.js'
import {
  INVITATION_IMAGES_BUCKET,
  resolveImageUrl,
  uploadInvitationImage,
  checkStorageBucket,
} from './lib/storage.js'

const AUTH_KEY = 'admin_authenticated'
const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'
const db = supabase

const TD = 'py-3.5 px-4 align-top border-b border-surface-container'
const TR = 'hover:bg-surface-container-low'
const BADGE_OK = 'inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-800'
const BADGE_NO = 'inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-error-container text-on-error-container'
const NAV_ACTIVE = 'admin-nav-item flex w-full items-center gap-3 rounded-xl bg-secondary px-4 py-3 text-left text-sm font-medium text-white'
const NAV_INACTIVE = 'admin-nav-item flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-on-surface-variant hover:bg-surface-container'

let invitedGuests = []
let rsvps = []
let wishes = []
let rundown = []
let guidelines = []
let modalMode = null
let modalId = null

const PANELS = [
  { id: 'panel-invited', label: 'Tamu', icon: 'group_add' },
  { id: 'panel-attendance', label: 'Hadir', icon: 'event_available' },
  { id: 'panel-wishes', label: 'Pesan', icon: 'mail' },
  { id: 'panel-settings', label: 'Setting', icon: 'settings' },
  { id: 'panel-rundown', label: 'Rundown', icon: 'schedule' },
  { id: 'panel-guidelines', label: 'Panduan', icon: 'checklist' },
]

function escapeHtml(t) {
  const d = document.createElement('div')
  d.textContent = t ?? ''
  return d.innerHTML
}

function formatDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast')
  if (!t) return
  const bg = type === 'success' ? 'bg-secondary text-white' : 'bg-error text-white'
  t.textContent = msg
  t.className = `fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 rounded-full text-sm shadow-lg opacity-100 ${bg}`
  setTimeout(() => t.classList.add('opacity-0'), 3500)
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    showToast('Link disalin!')
  } catch {
    showToast('Gagal menyalin link', 'error')
  }
}

function isAuthenticated() {
  return sessionStorage.getItem(AUTH_KEY) === 'true'
}

function showLogin() {
  document.getElementById('login-screen')?.classList.remove('hidden')
  document.getElementById('admin-app')?.classList.add('hidden')
}

function showAdmin() {
  document.getElementById('login-screen')?.classList.add('hidden')
  document.getElementById('admin-app')?.classList.remove('hidden')
  buildMobileNav()
}

function buildMobileNav() {
  const nav = document.getElementById('mobile-nav')
  if (!nav) return
  nav.innerHTML = PANELS.map((p, i) => `
    <button type="button" class="admin-nav-item shrink-0 flex items-center gap-1 rounded-full px-3 py-2 text-xs ${i === 0 ? 'bg-secondary text-white' : 'bg-surface-container text-on-surface-variant'}" data-panel="${p.id}">
      <span class="material-symbols-outlined text-sm">${p.icon}</span>${p.label}
    </button>
  `).join('') + `<button id="logout-btn-mobile" type="button" class="ml-auto shrink-0 rounded-full border border-error/20 px-3 py-2 text-xs text-error">Keluar</button>`
  nav.querySelectorAll('.admin-nav-item').forEach((b) => b.addEventListener('click', () => switchPanel(b.dataset.panel)))
  document.getElementById('logout-btn-mobile')?.addEventListener('click', handleLogout)
}

function updateNav(panelId) {
  document.querySelectorAll('.admin-nav-item').forEach((btn) => {
    const active = btn.dataset.panel === panelId
    const mobile = btn.closest('#mobile-nav')
    if (mobile) {
      btn.className = active
        ? 'admin-nav-item shrink-0 flex items-center gap-1 rounded-full px-3 py-2 text-xs bg-secondary text-white'
        : 'admin-nav-item shrink-0 flex items-center gap-1 rounded-full px-3 py-2 text-xs bg-surface-container text-on-surface-variant'
    } else {
      btn.className = active ? NAV_ACTIVE : NAV_INACTIVE
    }
  })
}

function switchPanel(panelId) {
  document.querySelectorAll('[data-panel-id]').forEach((el) => {
    el.classList.toggle('hidden', el.id !== panelId)
    el.classList.toggle('block', el.id === panelId)
  })
  updateNav(panelId)
}

function openModal(title, fieldsHtml) {
  document.getElementById('modal-title').textContent = title
  const form = document.getElementById('modal-form')
  form.innerHTML = fieldsHtml
  document.getElementById('modal').classList.remove('hidden')
  document.getElementById('modal').classList.add('flex')
  bindIconSelectPreview(form)
  if (modalMode?.startsWith('guest')) bindGuestSlugAutoFill(form)
}

function guestTakenSlugs(excludeGuestId = null) {
  return invitedGuests.filter((g) => g.id !== excludeGuestId).map((g) => g.slug)
}

function bindGuestSlugAutoFill(form) {
  const nameInput = form.querySelector('[name="full_name"]')
  const slugInput = form.querySelector('[name="slug"]')
  if (!nameInput || !slugInput) return

  const excludeId = modalMode === 'guest-edit' ? modalId : null
  let slugManual = modalMode === 'guest-edit' && Boolean(slugInput.value.trim())

  slugInput.addEventListener('input', () => {
    slugManual = Boolean(slugInput.value.trim())
  })

  nameInput.addEventListener('input', () => {
    if (slugManual) return
    const name = nameInput.value.trim()
    slugInput.value = name ? generateUniqueSlug(name, guestTakenSlugs(excludeId)) : ''
  })

  if (!slugManual && nameInput.value.trim()) {
    slugInput.value = generateUniqueSlug(nameInput.value.trim(), guestTakenSlugs(excludeId))
  }
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden')
  document.getElementById('modal').classList.remove('flex')
  modalMode = null
  modalId = null
}

function updateStats() {
  const attending = rsvps.filter((r) => r.will_attend)
  document.getElementById('stat-invited').textContent = invitedGuests.length
  document.getElementById('stat-total-rsvp').textContent = rsvps.length
  document.getElementById('stat-attending').textContent = attending.length
  document.getElementById('stat-guest-count').textContent = attending.reduce((s, r) => s + r.guest_count, 0)
  document.getElementById('stat-declined').textContent = rsvps.filter((r) => !r.will_attend).length
  document.getElementById('stat-wishes').textContent = wishes.length
}

function renderInvitedGuests() {
  const tbody = document.getElementById('invited-tbody')
  if (!tbody) return
  if (!invitedGuests.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="py-8 text-center italic text-on-surface-variant">Belum ada tamu undangan.</td></tr>`
    return
  }
  tbody.innerHTML = invitedGuests.map((g) => `
    <tr class="${TR}">
      <td class="${TD} font-medium">${escapeHtml(g.full_name)}</td>
      <td class="${TD} text-sm text-on-surface-variant">${escapeHtml(g.slug)}</td>
      <td class="${TD}">${escapeHtml(g.category || '-')}</td>
      <td class="${TD}">
        <button type="button" data-copy="${escapeHtml(getGuestLink(g.slug))}" class="copy-link text-xs text-tertiary hover:underline">Salin Link</button>
      </td>
      <td class="${TD}">
        <button type="button" data-edit-guest="${g.id}" class="text-xs text-secondary mr-2">Edit</button>
        <button type="button" data-del-guest="${g.id}" class="text-xs text-error">Hapus</button>
      </td>
    </tr>
  `).join('')
  tbody.querySelectorAll('.copy-link').forEach((b) => b.addEventListener('click', () => copyText(b.dataset.copy)))
  tbody.querySelectorAll('[data-edit-guest]').forEach((b) => b.addEventListener('click', () => editGuest(b.dataset.editGuest)))
  tbody.querySelectorAll('[data-del-guest]').forEach((b) => b.addEventListener('click', () => deleteGuest(b.dataset.delGuest)))
}

function renderAttendance() {
  const tbody = document.getElementById('attendance-tbody')
  const q = (document.getElementById('search-attendance')?.value || '').toLowerCase()
  const rows = rsvps.filter((r) => !q || r.full_name.toLowerCase().includes(q))
  if (!tbody) return
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center italic text-on-surface-variant">Belum ada konfirmasi.</td></tr>`
    return
  }
  tbody.innerHTML = rows.map((r) => `
    <tr class="${TR}">
      <td class="${TD} font-medium">${escapeHtml(r.full_name)}</td>
      <td class="${TD}"><span class="${r.will_attend ? BADGE_OK : BADGE_NO}">${r.will_attend ? 'Hadir' : 'Tidak'}</span></td>
      <td class="${TD}">${r.guest_count}</td>
      <td class="${TD}">${escapeHtml(r.meal_preference)}</td>
      <td class="${TD} text-sm">${r.guest_id ? '<span class="text-tertiary">Personal</span>' : 'Publik'}</td>
      <td class="${TD} text-sm text-on-surface-variant whitespace-nowrap">${formatDate(r.created_at)}</td>
    </tr>
  `).join('')
}

function renderWishes() {
  const tbody = document.getElementById('wishes-tbody')
  const q = (document.getElementById('search-wishes')?.value || '').toLowerCase()
  const rows = wishes.filter((w) => !q || w.name.toLowerCase().includes(q) || w.message.toLowerCase().includes(q))
  if (!tbody) return
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="3" class="py-8 text-center italic text-on-surface-variant">Belum ada ucapan.</td></tr>`
    return
  }
  tbody.innerHTML = rows.map((w) => `
    <tr class="${TR}">
      <td class="${TD} font-medium whitespace-nowrap">${escapeHtml(w.name)}</td>
      <td class="${TD} max-w-md">${escapeHtml(w.message)}</td>
      <td class="${TD} text-sm text-on-surface-variant whitespace-nowrap">${formatDate(w.created_at)}</td>
    </tr>
  `).join('')
}

function renderRundown() {
  const tbody = document.getElementById('rundown-tbody')
  if (!tbody) return
  if (!rundown.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center italic text-on-surface-variant">Belum ada rundown.</td></tr>`
    return
  }
  tbody.innerHTML = rundown.map((r) => `
    <tr class="${TR}">
      <td class="${TD}">${r.sort_order}</td>
      <td class="${TD}"><span class="material-symbols-outlined text-tertiary">${escapeHtml(r.icon)}</span></td>
      <td class="${TD} font-medium">${escapeHtml(r.title)}</td>
      <td class="${TD}">${escapeHtml(r.time_range || '-')}</td>
      <td class="${TD} text-sm">${escapeHtml(r.note || '-')}</td>
      <td class="${TD}">${r.is_active ? 'Ya' : 'Tidak'}</td>
      <td class="${TD}">
        <button type="button" data-edit-rundown="${r.id}" class="text-xs text-secondary mr-2">Edit</button>
        <button type="button" data-del-rundown="${r.id}" class="text-xs text-error">Hapus</button>
      </td>
    </tr>
  `).join('')
  tbody.querySelectorAll('[data-edit-rundown]').forEach((b) => b.addEventListener('click', () => editRundown(b.dataset.editRundown)))
  tbody.querySelectorAll('[data-del-rundown]').forEach((b) => b.addEventListener('click', () => deleteRundown(b.dataset.delRundown)))
}

function renderGuidelinesAdmin() {
  const tbody = document.getElementById('guidelines-tbody')
  if (!tbody) return
  if (!guidelines.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center italic text-on-surface-variant">Belum ada panduan.</td></tr>`
    return
  }
  tbody.innerHTML = guidelines.map((g) => `
    <tr class="${TR}">
      <td class="${TD}">${g.sort_order}</td>
      <td class="${TD}"><span class="material-symbols-outlined text-tertiary">${escapeHtml(g.icon)}</span></td>
      <td class="${TD} font-medium">${escapeHtml(g.title)}</td>
      <td class="${TD} text-sm max-w-xs">${escapeHtml(g.description)}</td>
      <td class="${TD}">${g.is_active ? 'Ya' : 'Tidak'}</td>
      <td class="${TD}">
        <button type="button" data-edit-gl="${g.id}" class="text-xs text-secondary mr-2">Edit</button>
        <button type="button" data-del-gl="${g.id}" class="text-xs text-error">Hapus</button>
      </td>
    </tr>
  `).join('')
  tbody.querySelectorAll('[data-edit-gl]').forEach((b) => b.addEventListener('click', () => editGuideline(b.dataset.editGl)))
  tbody.querySelectorAll('[data-del-gl]').forEach((b) => b.addEventListener('click', () => deleteGuideline(b.dataset.delGl)))
}

function setSettingsImagePreview(kind, path) {
  const form = document.getElementById('settings-form')
  if (!form) return
  const field = kind === 'hero' ? 'hero_image_path' : 'description_image_path'
  const hidden = form.elements[field]
  if (hidden) hidden.value = path || ''
  const img = form.querySelector(`[data-settings-preview="${kind}"]`)
  const pathEl = form.querySelector(`[data-settings-path="${kind}"]`)
  const url = resolveImageUrl(path)
  if (img) {
    if (url) {
      img.src = url
      img.classList.remove('hidden')
    } else {
      img.classList.add('hidden')
      img.removeAttribute('src')
    }
  }
  if (pathEl) {
    pathEl.textContent = path ? `File tersimpan: ${path}` : 'Belum ada gambar. Pilih file lalu simpan.'
  }
}

function bindSettingsImageFileInputs() {
  const pairs = [
    ['hero_image_file', 'hero'],
    ['description_image_file', 'description'],
  ]
  pairs.forEach(([inputId, kind]) => {
    const input = document.getElementById(inputId)
    if (!input || input.dataset.bound) return
    input.dataset.bound = '1'
    input.addEventListener('change', () => {
      const file = input.files?.[0]
      const form = document.getElementById('settings-form')
      const img = form?.querySelector(`[data-settings-preview="${kind}"]`)
      if (!file || !img) return
      img.src = URL.createObjectURL(file)
      img.classList.remove('hidden')
      const pathEl = form.querySelector(`[data-settings-path="${kind}"]`)
      if (pathEl) pathEl.textContent = `File baru: ${file.name}`
    })
  })
}

function fillSettingsForm(s) {
  const form = document.getElementById('settings-form')
  if (!form || !s) return
  const skip = new Set(['hero_image_path', 'description_image_path'])
  Object.keys(s).forEach((key) => {
    if (skip.has(key)) return
    const el = form.elements[key]
    if (!el) return
    if (el.type === 'checkbox') el.checked = !!s[key]
    else el.value = s[key] ?? ''
  })
  setSettingsImagePreview('hero', s.hero_image_path || s.hero_image_url)
  setSettingsImagePreview('description', s.description_image_path || s.description_image_url)
}

async function updateStorageStatus() {
  const box = document.getElementById('storage-status')
  const text = document.getElementById('storage-status-text')
  const nameEl = document.getElementById('storage-bucket-name')
  if (nameEl) nameEl.textContent = INVITATION_IMAGES_BUCKET
  if (!text) return
  const { ok, message } = await checkStorageBucket()
  text.textContent = message
  if (box) {
    box.classList.toggle('border-green-300/60', ok)
    box.classList.toggle('bg-green-50/50', ok)
    box.classList.toggle('border-error/30', !ok)
    box.classList.toggle('bg-error-container/30', !ok)
  }
}

async function loadSettings() {
  const { data } = await db.from('invitation_settings').select('*').eq('id', 1).maybeSingle()
  fillSettingsForm(data)
  await updateStorageStatus()
}

function guestFormFields(g = {}) {
  return `
    <div><label class="text-xs text-on-surface-variant">Nama Lengkap</label><input name="full_name" required value="${escapeHtml(g.full_name || '')}" class="mt-1 w-full border-b py-2 outline-none focus:border-tertiary" /></div>
    <div><label class="text-xs text-on-surface-variant">Slug URL</label><input name="slug" value="${escapeHtml(g.slug || '')}" placeholder="Terisi otomatis dari nama" class="mt-1 w-full border-b py-2 outline-none focus:border-tertiary" /><p class="mt-1 text-[10px] text-on-surface-variant">Otomatis dari nama. Jika slug sama, ditambah angka (mis. nama-2).</p></div>
    <div><label class="text-xs text-on-surface-variant">Kategori</label>
      <select name="category" class="mt-1 w-full border-b py-2">
        <option value="">-</option>
        ${['Siswa','Guru','Orang Tua','Alumni','Tamu Undangan'].map((c) => `<option value="${c}" ${g.category === c ? 'selected' : ''}>${c}</option>`).join('')}
      </select>
    </div>`
}

function rundownFormFields(r = {}) {
  return `
    ${iconSelectField('icon', r.icon, 'event', 'Icon (Material Symbols)')}
    <div><label class="text-xs text-on-surface-variant">Judul</label><input name="title" required value="${escapeHtml(r.title || '')}" class="mt-1 w-full border-b py-2" /></div>
    <div><label class="text-xs text-on-surface-variant">Waktu</label><input name="time_range" value="${escapeHtml(r.time_range || '')}" class="mt-1 w-full border-b py-2" /></div>
    <div><label class="text-xs text-on-surface-variant">Catatan</label><input name="note" value="${escapeHtml(r.note || '')}" class="mt-1 w-full border-b py-2" /></div>
    <div><label class="text-xs text-on-surface-variant">Urutan</label><input name="sort_order" type="number" value="${r.sort_order ?? 0}" class="mt-1 w-full border-b py-2" /></div>
    <div class="flex items-center gap-2"><input type="checkbox" name="is_active" ${r.is_active !== false ? 'checked' : ''} /><label class="text-sm">Aktif</label></div>`
}

function guidelineFormFields(g = {}) {
  return `
    ${iconSelectField('icon', g.icon, 'info', 'Icon (Material Symbols)')}
    <div><label class="text-xs text-on-surface-variant">Judul</label><input name="title" required value="${escapeHtml(g.title || '')}" class="mt-1 w-full border-b py-2" /></div>
    <div><label class="text-xs text-on-surface-variant">Deskripsi</label><textarea name="description" required rows="3" class="mt-1 w-full border rounded-lg p-2">${escapeHtml(g.description || '')}</textarea></div>
    <div><label class="text-xs text-on-surface-variant">Urutan</label><input name="sort_order" type="number" value="${g.sort_order ?? 0}" class="mt-1 w-full border-b py-2" /></div>
    <div class="flex items-center gap-2"><input type="checkbox" name="is_active" ${g.is_active !== false ? 'checked' : ''} /><label class="text-sm">Aktif</label></div>`
}

function addGuest() {
  modalMode = 'guest-add'
  openModal('Tambah Tamu Undangan', guestFormFields())
}

function editGuest(id) {
  const g = invitedGuests.find((x) => x.id === id)
  if (!g) return
  modalMode = 'guest-edit'
  modalId = id
  openModal('Edit Tamu', guestFormFields(g))
}

async function saveGuestModal() {
  const form = document.getElementById('modal-form')
  const fd = new FormData(form)
  const full_name = fd.get('full_name')?.toString().trim()
  const excludeId = modalMode === 'guest-edit' ? modalId : null
  const taken = guestTakenSlugs(excludeId)
  let slug = fd.get('slug')?.toString().trim()
  if (!slug) slug = generateUniqueSlug(full_name, taken)
  else if (taken.includes(slug)) slug = generateUniqueSlug(slug, taken)
  const category = fd.get('category')?.toString() || null
  if (!full_name) { showToast('Nama wajib diisi', 'error'); return }

  const payload = { full_name, slug, category }
  let err
  if (modalMode === 'guest-edit') {
    ;({ error: err } = await db.from('guests').update(payload).eq('id', modalId))
  } else {
    ;({ error: err } = await db.from('guests').insert(payload))
  }
  if (err) { showToast(err.message, 'error'); return }
  closeModal()
  showToast('Tamu disimpan')
  loadData()
}

async function deleteGuest(id) {
  if (!confirm('Hapus tamu ini?')) return
  const { error } = await db.from('guests').delete().eq('id', id)
  if (error) { showToast(error.message, 'error'); return }
  showToast('Tamu dihapus')
  loadData()
}

function addRundown() {
  modalMode = 'rundown-add'
  openModal('Tambah Rundown', rundownFormFields({ sort_order: rundown.length + 1 }))
}

function editRundown(id) {
  const r = rundown.find((x) => x.id === id)
  if (!r) return
  modalMode = 'rundown-edit'
  modalId = id
  openModal('Edit Rundown', rundownFormFields(r))
}

async function saveRundownModal() {
  const form = document.getElementById('modal-form')
  const fd = new FormData(form)
  const payload = {
    icon: fd.get('icon')?.toString() || 'event',
    title: fd.get('title')?.toString().trim(),
    time_range: fd.get('time_range')?.toString() || null,
    note: fd.get('note')?.toString() || null,
    sort_order: parseInt(fd.get('sort_order')?.toString() || '0', 10),
    is_active: fd.get('is_active') === 'on',
  }
  if (!payload.title) { showToast('Judul wajib', 'error'); return }
  let err
  if (modalMode === 'rundown-edit') {
    ;({ error: err } = await db.from('event_rundown').update(payload).eq('id', modalId))
  } else {
    ;({ error: err } = await db.from('event_rundown').insert(payload))
  }
  if (err) { showToast(err.message, 'error'); return }
  closeModal()
  showToast('Rundown disimpan')
  loadData()
}

async function deleteRundown(id) {
  if (!confirm('Hapus item rundown?')) return
  const { error } = await db.from('event_rundown').delete().eq('id', id)
  if (error) { showToast(error.message, 'error'); return }
  loadData()
}

function addGuideline() {
  modalMode = 'guideline-add'
  openModal('Tambah Panduan', guidelineFormFields({ sort_order: guidelines.length + 1 }))
}

function editGuideline(id) {
  const g = guidelines.find((x) => x.id === id)
  if (!g) return
  modalMode = 'guideline-edit'
  modalId = id
  openModal('Edit Panduan', guidelineFormFields(g))
}

async function saveGuidelineModal() {
  const form = document.getElementById('modal-form')
  const fd = new FormData(form)
  const payload = {
    icon: fd.get('icon')?.toString() || 'info',
    title: fd.get('title')?.toString().trim(),
    description: fd.get('description')?.toString().trim(),
    sort_order: parseInt(fd.get('sort_order')?.toString() || '0', 10),
    is_active: fd.get('is_active') === 'on',
  }
  if (!payload.title || !payload.description) { showToast('Judul & deskripsi wajib', 'error'); return }
  let err
  if (modalMode === 'guideline-edit') {
    ;({ error: err } = await db.from('guidelines').update(payload).eq('id', modalId))
  } else {
    ;({ error: err } = await db.from('guidelines').insert(payload))
  }
  if (err) { showToast(err.message, 'error'); return }
  closeModal()
  showToast('Panduan disimpan')
  loadData()
}

async function deleteGuideline(id) {
  if (!confirm('Hapus panduan ini?')) return
  const { error } = await db.from('guidelines').delete().eq('id', id)
  if (error) { showToast(error.message, 'error'); return }
  loadData()
}

async function saveSettings(e) {
  e.preventDefault()
  const form = e.target
  const fd = new FormData(form)
  const payload = { id: 1, updated_at: new Date().toISOString() }
  const skip = new Set(['hero_image_path', 'description_image_path'])
  for (const [key, val] of fd.entries()) {
    if (skip.has(key)) continue
    if (key === 'guidelines_section_enabled') payload[key] = true
    else payload[key] = val
  }
  if (!fd.has('guidelines_section_enabled')) payload.guidelines_section_enabled = false

  payload.hero_image_path = fd.get('hero_image_path')?.toString() || ''
  payload.description_image_path = fd.get('description_image_path')?.toString() || ''

  try {
    const heroFile = document.getElementById('hero_image_file')?.files?.[0]
    const descFile = document.getElementById('description_image_file')?.files?.[0]
    if (heroFile) payload.hero_image_path = await uploadInvitationImage(heroFile, 'settings/hero')
    if (descFile) payload.description_image_path = await uploadInvitationImage(descFile, 'settings/description')
  } catch (err) {
    showToast(err.message || 'Gagal mengunggah gambar', 'error')
    return
  }

  const { error } = await db.from('invitation_settings').upsert(payload)
  if (error) { showToast(error.message, 'error'); return }

  document.getElementById('hero_image_file').value = ''
  document.getElementById('description_image_file').value = ''
  setSettingsImagePreview('hero', payload.hero_image_path)
  setSettingsImagePreview('description', payload.description_image_path)
  await updateStorageStatus()
  showToast('Pengaturan disimpan')
}

async function handleModalSave() {
  if (modalMode?.startsWith('guest')) return saveGuestModal()
  if (modalMode?.startsWith('rundown')) return saveRundownModal()
  if (modalMode?.startsWith('guideline')) return saveGuidelineModal()
}

async function loadData() {
  // if (!isAdminSupabaseConfigured) {
  //   showToast('Set VITE_SUPABASE_SERVICE_ROLE_KEY di .env', 'error')
  //   return
  // }

  const [gRes, rRes, wRes, rdRes, glRes] = await Promise.all([
    db.from('guests').select('*').order('full_name'),
    db.from('rsvps').select('*').order('created_at', { ascending: false }),
    db.from('wishes').select('*').order('created_at', { ascending: false }),
    db.from('event_rundown').select('*').order('sort_order'),
    db.from('guidelines').select('*').order('sort_order'),
  ])

  invitedGuests = gRes.data ?? []
  rsvps = rRes.data ?? []
  wishes = wRes.data ?? []
  rundown = rdRes.data ?? []
  guidelines = glRes.data ?? []

  updateStats()
  renderInvitedGuests()
  renderAttendance()
  renderWishes()
  renderRundown()
  renderGuidelinesAdmin()
  await loadSettings()
}

function initNavigation() {
  document.querySelectorAll('aside .admin-nav-item').forEach((btn) => {
    btn.addEventListener('click', () => switchPanel(btn.dataset.panel))
  })
  document.getElementById('logout-btn')?.addEventListener('click', handleLogout)
  document.getElementById('refresh-btn')?.addEventListener('click', loadData)
  document.getElementById('copy-public-link')?.addEventListener('click', () => copyText(getPublicLink()))
  document.getElementById('btn-add-guest')?.addEventListener('click', addGuest)
  document.getElementById('btn-add-rundown')?.addEventListener('click', addRundown)
  document.getElementById('btn-add-guideline')?.addEventListener('click', addGuideline)
  document.getElementById('settings-form')?.addEventListener('submit', saveSettings)
  bindSettingsImageFileInputs()
  document.getElementById('search-attendance')?.addEventListener('input', renderAttendance)
  document.getElementById('search-wishes')?.addEventListener('input', renderWishes)
  document.getElementById('modal-cancel')?.addEventListener('click', closeModal)
  document.getElementById('modal-save')?.addEventListener('click', handleModalSave)
}

function handleLogin(e) {
  e.preventDefault()
  const input = document.getElementById('admin-password')
  if (input?.value === adminPassword) {
    sessionStorage.setItem(AUTH_KEY, 'true')
    showAdmin()
    initNavigation()
    loadData()
    return
  }
  showToast('Password salah', 'error')
}

function handleLogout() {
  sessionStorage.removeItem(AUTH_KEY)
  showLogin()
}

document.getElementById('login-form')?.addEventListener('submit', handleLogin)

if (isAuthenticated()) {
  showAdmin()
  initNavigation()
  loadData()
} else {
  showLogin()
}
