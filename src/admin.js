import './style.css'
import { supabase, isSupabaseConfigured } from './lib/supabase.js'

const AUTH_KEY = 'admin_authenticated'
const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'

const TD = 'py-3.5 px-4 text-on-surface align-top border-b border-surface-container'

const TR = 'hover:bg-surface-container-low transition-colors'

const BADGE_BASE =
  'inline-flex items-center px-2.5 py-0.5 rounded-full font-label-caps text-[10px] tracking-wide font-semibold'

const BADGE_SUCCESS = `${BADGE_BASE} bg-green-100 text-green-800`
const BADGE_DANGER = `${BADGE_BASE} bg-error-container text-on-error-container`
const BADGE_NEUTRAL = `${BADGE_BASE} bg-secondary-container text-on-secondary-container`

const SIDEBAR_NAV_ACTIVE =
  'admin-nav-item w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all bg-secondary text-white'
const SIDEBAR_NAV_INACTIVE =
  'admin-nav-item w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all hover:bg-surface-container text-on-surface-variant'

const MOBILE_NAV_ACTIVE =
  'admin-nav-item shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all bg-secondary text-white'
const MOBILE_NAV_INACTIVE =
  'admin-nav-item shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all bg-surface-container text-on-surface-variant'

let rsvps = []
let wishes = []

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text ?? ''
  return div.innerHTML
}

function formatDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast')
  if (!toast) return
  const bg = type === 'success' ? 'bg-secondary text-white' : 'bg-error text-white'
  toast.textContent = message
  toast.className = `fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full text-sm font-medium tracking-wide shadow-lg transition-all duration-300 opacity-100 ${bg}`
  setTimeout(() => {
    toast.classList.add('opacity-0', 'pointer-events-none')
  }, 3500)
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
}

function handleLogin(e) {
  e.preventDefault()
  const input = document.getElementById('admin-password')
  if (input?.value === adminPassword) {
    sessionStorage.setItem(AUTH_KEY, 'true')
    showAdmin()
    initNavigation()
    initSearch()
    loadData()
    return
  }
  showToast('Password salah.', 'error')
}

function handleLogout() {
  sessionStorage.removeItem(AUTH_KEY)
  showLogin()
}

function updateNavButtons(panelId) {
  document.querySelectorAll('.admin-nav-item').forEach((btn) => {
    const active = btn.dataset.panel === panelId
    const mobile = btn.classList.contains('shrink-0')
    btn.className = mobile
      ? active
        ? MOBILE_NAV_ACTIVE
        : MOBILE_NAV_INACTIVE
      : active
        ? SIDEBAR_NAV_ACTIVE
        : SIDEBAR_NAV_INACTIVE
  })
}

function switchPanel(panelId) {
  document.querySelectorAll('[data-panel-id]').forEach((el) => {
    el.classList.toggle('hidden', el.id !== panelId)
    el.classList.toggle('block', el.id === panelId)
  })
  updateNavButtons(panelId)
}

function initNavigation() {
  document.querySelectorAll('.admin-nav-item').forEach((btn) => {
    btn.addEventListener('click', () => switchPanel(btn.dataset.panel))
  })
  document.getElementById('logout-btn')?.addEventListener('click', handleLogout)
  document.getElementById('logout-btn-mobile')?.addEventListener('click', handleLogout)
  document.getElementById('refresh-btn')?.addEventListener('click', loadData)
}

function updateStats() {
  const attending = rsvps.filter((r) => r.will_attend)
  const notAttending = rsvps.filter((r) => !r.will_attend)
  const totalGuests = attending.reduce((sum, r) => sum + r.guest_count, 0)

  document.getElementById('stat-total-rsvp').textContent = rsvps.length
  document.getElementById('stat-attending').textContent = attending.length
  document.getElementById('stat-guest-count').textContent = totalGuests
  document.getElementById('stat-declined').textContent = notAttending.length
  document.getElementById('stat-wishes').textContent = wishes.length
}

function filterRows(rows, query, fields) {
  const q = query.trim().toLowerCase()
  if (!q) return rows
  return rows.filter((row) =>
    fields.some((f) => String(row[f] ?? '').toLowerCase().includes(q))
  )
}

function renderGuestTable(rows, tbodyId, emptyMsg) {
  const tbody = document.getElementById(tbodyId)
  if (!tbody) return

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-sm italic text-on-surface-variant">${emptyMsg}</td></tr>`
    return
  }

  tbody.innerHTML = rows
    .map(
      (r) => `
    <tr class="${TR}">
      <td class="${TD} font-medium">${escapeHtml(r.full_name)}</td>
      <td class="${TD}">
        <span class="${r.will_attend ? BADGE_SUCCESS : BADGE_DANGER}">
          ${r.will_attend ? 'Hadir' : 'Tidak Hadir'}
        </span>
      </td>
      <td class="${TD}">${r.guest_count}</td>
      <td class="${TD}"><span class="${BADGE_NEUTRAL}">${escapeHtml(r.meal_preference)}</span></td>
      <td class="${TD} text-sm text-on-surface-variant whitespace-nowrap">${formatDate(r.created_at)}</td>
    </tr>
  `
    )
    .join('')
}

function renderAttendanceTable(rows) {
  const tbody = document.getElementById('attendance-tbody')
  if (!tbody) return

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-sm italic text-on-surface-variant">Belum ada tamu yang konfirmasi hadir.</td></tr>`
    return
  }

  tbody.innerHTML = rows
    .map(
      (r, i) => `
    <tr class="${TR}">
      <td class="${TD} text-on-surface-variant">${i + 1}</td>
      <td class="${TD} font-medium">${escapeHtml(r.full_name)}</td>
      <td class="${TD}">${r.guest_count} orang</td>
      <td class="${TD}"><span class="${BADGE_NEUTRAL}">${escapeHtml(r.meal_preference)}</span></td>
      <td class="${TD} text-sm text-on-surface-variant whitespace-nowrap">${formatDate(r.created_at)}</td>
    </tr>
  `
    )
    .join('')
}

function renderWishesTable(rows) {
  const tbody = document.getElementById('wishes-tbody')
  if (!tbody) return

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="py-8 text-center text-sm italic text-on-surface-variant">Belum ada kesan dan pesan.</td></tr>`
    return
  }

  tbody.innerHTML = rows
    .map(
      (w, i) => `
    <tr class="${TR}">
      <td class="${TD} text-on-surface-variant">${i + 1}</td>
      <td class="${TD} font-medium whitespace-nowrap">${escapeHtml(w.name)}</td>
      <td class="${TD} max-w-md">${escapeHtml(w.message)}</td>
      <td class="${TD} text-sm text-on-surface-variant whitespace-nowrap">${formatDate(w.created_at)}</td>
    </tr>
  `
    )
    .join('')
}

function renderAll() {
  updateStats()

  const guestQuery = document.getElementById('search-guests')?.value ?? ''
  const attendanceQuery = document.getElementById('search-attendance')?.value ?? ''
  const wishesQuery = document.getElementById('search-wishes')?.value ?? ''

  renderGuestTable(
    filterRows(rsvps, guestQuery, ['full_name', 'meal_preference']),
    'guests-tbody',
    'Belum ada data tamu.'
  )

  renderAttendanceTable(
    filterRows(
      rsvps.filter((r) => r.will_attend),
      attendanceQuery,
      ['full_name', 'meal_preference']
    )
  )

  renderWishesTable(filterRows(wishes, wishesQuery, ['name', 'message']))
}

async function loadData() {
  if (!isSupabaseConfigured) {
    showToast('Supabase belum dikonfigurasi.', 'error')
    return
  }

  const refreshBtn = document.getElementById('refresh-btn')
  refreshBtn?.setAttribute('disabled', 'true')
  refreshBtn?.classList.add('opacity-50', 'cursor-not-allowed')

  const [rsvpRes, wishRes] = await Promise.all([
    supabase.from('rsvps').select('*').order('created_at', { ascending: false }),
    supabase.from('wishes').select('*').order('created_at', { ascending: false }),
  ])

  refreshBtn?.removeAttribute('disabled')
  refreshBtn?.classList.remove('opacity-50', 'cursor-not-allowed')

  if (rsvpRes.error || wishRes.error) {
    showToast('Gagal memuat data.', 'error')
    return
  }

  rsvps = rsvpRes.data ?? []
  wishes = wishRes.data ?? []
  renderAll()
}

function initSearch() {
  ;['search-guests', 'search-attendance', 'search-wishes'].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', renderAll)
  })
}

document.getElementById('login-form')?.addEventListener('submit', handleLogin)

if (isAuthenticated()) {
  showAdmin()
  initNavigation()
  initSearch()
  loadData()
} else {
  showLogin()
}

if (!isSupabaseConfigured) {
  console.warn('[Admin] Supabase belum dikonfigurasi di .env')
}
