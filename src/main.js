import './style.css'
import { supabase, isSupabaseConfigured } from './lib/supabase.js'

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast')
  if (!toast) return
  toast.textContent = message
  toast.className = `toast ${type} show`
  setTimeout(() => toast.classList.remove('show'), 3500)
}

function toggleDetails() {
  document.getElementById('bank-details')?.classList.toggle('hidden')
}

function reveal() {
  document.querySelectorAll('.reveal').forEach((el) => {
    const top = el.getBoundingClientRect().top
    if (top < window.innerHeight - 150) el.classList.add('active')
  })
}

function initParallax() {
  const img = document.querySelector('header img')
  if (!img) return
  window.addEventListener('scroll', () => {
    const scroll = window.pageYOffset
    img.style.transform = `scale(${1.05 + scroll * 0.0001}) translateY(${scroll * 0.1}px)`
  })
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

const borderColors = ['border-l-tertiary', 'border-l-secondary', 'border-l-outline']

function renderWish(wish, index) {
  const border = borderColors[index % borderColors.length]
  return `
    <div class="glass-card p-6 rounded-xl border-l-4 ${border}">
      <p class="font-body-md text-on-surface-variant italic">"${escapeHtml(wish.message)}"</p>
      <p class="font-label-caps text-xs mt-4 text-secondary">— ${escapeHtml(wish.name.toUpperCase())}</p>
    </div>
  `
}

async function loadWishes() {
  const list = document.getElementById('guestbook-list')
  if (!list) return

  if (!isSupabaseConfigured) {
    list.innerHTML = `
      <div class="glass-card p-6 rounded-xl text-center text-on-surface-variant text-sm">
        Hubungkan Supabase di file <code class="text-tertiary">.env</code> untuk menampilkan ucapan tamu.
      </div>
    `
    return
  }

  const { data, error } = await supabase
    .from('wishes')
    .select('name, message, created_at')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    list.innerHTML = `<p class="text-error text-sm text-center">Gagal memuat ucapan.</p>`
    return
  }

  if (!data?.length) {
    list.innerHTML = `
      <div class="glass-card p-6 rounded-xl text-center text-on-surface-variant text-sm italic">
        Belum ada ucapan. Jadilah yang pertama memberi doa!
      </div>
    `
    return
  }

  list.innerHTML = data.map((w, i) => renderWish(w, i)).join('')
}

function openGuestbookModal() {
  document.getElementById('guestbook-modal')?.classList.add('open')
}

function closeGuestbookModal() {
  document.getElementById('guestbook-modal')?.classList.remove('open')
}

async function handleRsvpSubmit(e) {
  e.preventDefault()
  const form = e.target
  const submitBtn = form.querySelector('[type="submit"]')
  const name = form.full_name.value.trim()
  const attend = form.querySelector('input[name="attend"]:checked')

  if (!name) {
    showToast('Mohon isi nama lengkap.', 'error')
    return
  }
  if (!attend) {
    showToast('Mohon pilih konfirmasi kehadiran.', 'error')
    return
  }

  if (!isSupabaseConfigured) {
    showToast('Supabase belum dikonfigurasi. Salin .env.example ke .env', 'error')
    return
  }

  submitBtn.disabled = true
  submitBtn.textContent = 'Mengirim...'

  const { error } = await supabase.from('rsvps').insert({
    full_name: name,
    will_attend: attend.value === 'yes',
    guest_count: parseInt(form.guest_count.value, 10),
    meal_preference: form.meal_preference.value,
  })

  submitBtn.disabled = false
  submitBtn.textContent = 'Kirim Konfirmasi'

  if (error) {
    showToast('Gagal mengirim konfirmasi. Coba lagi.', 'error')
    return
  }

  form.reset()
  showToast('Konfirmasi kehadiran berhasil dikirim. Terima kasih!')
}

async function handleWishSubmit(e) {
  e.preventDefault()
  const form = e.target
  const submitBtn = form.querySelector('[type="submit"]')
  const name = form.wish_name.value.trim()
  const message = form.wish_message.value.trim()

  if (!name || !message) {
    showToast('Mohon isi nama dan ucapan.', 'error')
    return
  }

  if (!isSupabaseConfigured) {
    showToast('Supabase belum dikonfigurasi. Salin .env.example ke .env', 'error')
    return
  }

  submitBtn.disabled = true
  submitBtn.textContent = 'Mengirim...'

  const { error } = await supabase.from('wishes').insert({ name, message })

  submitBtn.disabled = false
  submitBtn.textContent = 'Kirim Ucapan'

  if (error) {
    showToast('Gagal mengirim ucapan. Coba lagi.', 'error')
    return
  }

  form.reset()
  closeGuestbookModal()
  showToast('Ucapan berhasil dikirim!')
  loadWishes()
}

function initForms() {
  document.getElementById('rsvp-form')?.addEventListener('submit', handleRsvpSubmit)
  document.getElementById('wish-form')?.addEventListener('submit', handleWishSubmit)
  document.getElementById('open-guestbook')?.addEventListener('click', openGuestbookModal)
  document.getElementById('close-guestbook')?.addEventListener('click', closeGuestbookModal)
  document.getElementById('guestbook-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'guestbook-modal') closeGuestbookModal()
  })
  document.getElementById('toggle-bank')?.addEventListener('click', toggleDetails)
}

window.addEventListener('scroll', reveal)
reveal()
initParallax()
initForms()
loadWishes()

if (!isSupabaseConfigured) {
  console.warn('[Supabase] VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY belum diatur di .env')
}
