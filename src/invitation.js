import {
  escapeHtml, setText, showToast, toggleDetails, waitForFonts,
  preloadImage, hidePageLoader,
  resolveGuest, applyGuestToForm,
  renderSettings, renderRundown, renderGuidelines,
  loadDresscodeForPublic, loadWishes,
  openGuestbookModal, closeGuestbookModal,
  handleRsvpSubmit, handleWishSubmit,
  observeReveal, observeRundownCards, initParallax,
  loadInvitationData,
  supabase, isSupabaseConfigured
} from "./main.js";

import { resolveImageUrl } from "./lib/storage.js";

/* ---------- COUNTDOWN ---------- */
let countdownInterval = null;
function padCountdown(n) { return String(Math.max(0, n)).padStart(2, "0"); }
function stopCountdown() {
  if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
}

function initCountdown(targetIso, enabled = true) {
  stopCountdown();
  const wrap = document.getElementById("event-countdown");
  const ended = document.getElementById("countdown-ended");
  const hideAll = () => { wrap?.classList.add("hidden"); ended?.classList.add("hidden"); };
  if (!wrap || !targetIso || !enabled) { hideAll(); return; }
  const target = new Date(targetIso).getTime();
  if (Number.isNaN(target)) { hideAll(); return; }
  const units = {
    days: document.getElementById("countdown-days"),
    hours: document.getElementById("countdown-hours"),
    minutes: document.getElementById("countdown-minutes"),
    seconds: document.getElementById("countdown-seconds"),
  };
  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) {
      stopCountdown();
      wrap.classList.add("hidden");
      ended?.classList.remove("hidden");
      return;
    }
    ended?.classList.add("hidden");
    wrap.classList.remove("hidden");
    const totalSec = Math.floor(diff / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    if (units.days) units.days.textContent = padCountdown(days);
    if (units.hours) units.hours.textContent = padCountdown(hours);
    if (units.minutes) units.minutes.textContent = padCountdown(minutes);
    if (units.seconds) units.seconds.textContent = padCountdown(seconds);
  }
  tick();
  countdownInterval = setInterval(tick, 1000);
}

/* ---------- GALERI + LIGHTBOX ---------- */
function openGalleryLightbox(src, caption) {
  const lb = document.getElementById("gallery-lightbox");
  const img = document.getElementById("gallery-lightbox-img");
  const cap = document.getElementById("gallery-lightbox-caption");
  if (!lb || !img) return;
  img.src = src;
  img.alt = caption || "Galeri";
  if (cap) {
    if (caption) { cap.textContent = caption; cap.classList.remove("hidden"); }
    else { cap.classList.add("hidden"); }
  }
  lb.classList.add("open");
  lb.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeGalleryLightbox() {
  const lb = document.getElementById("gallery-lightbox");
  if (!lb) return;
  lb.classList.remove("open");
  lb.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function initGalleryLightbox() {
  document.getElementById("gallery-lightbox-close")?.addEventListener("click", closeGalleryLightbox);
  document.getElementById("gallery-lightbox")?.addEventListener("click", (e) => {
    if (e.target.id === "gallery-lightbox") closeGalleryLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.getElementById("gallery-lightbox")?.classList.contains("open")) {
      closeGalleryLightbox();
    }
  });
}

function renderGallery(items) {
  const grid = document.getElementById("gallery-grid");
  const section = document.getElementById("gallery");
  if (!grid) return;
  if (!items?.length) { section?.classList.add("hidden"); return; }
  section?.classList.remove("hidden");
  grid.innerHTML = items.map((item) => {
    const url = resolveImageUrl(item.image_path);
    if (!url) return "";
    return `
    <button type="button" class="gallery-item block w-full text-left" data-gallery-src="${escapeHtml(url)}" data-gallery-caption="${escapeHtml(item.caption || "")}">
      <img src="${escapeHtml(url)}" alt="${escapeHtml(item.caption || "Foto galeri")}" loading="lazy" />
    </button>`;
  }).join("");
  grid.querySelectorAll("[data-gallery-src]").forEach((btn) => {
    btn.addEventListener("click", () => openGalleryLightbox(btn.dataset.gallerySrc, btn.dataset.galleryCaption));
  });
}

/* ---------- BOOT (Gabungan) ---------- */
async function boot() {
  try {
    initForms();
    initGalleryLightbox();

    const minLoaderTime = new Promise(r => setTimeout(r, 800));
    const urls = await loadInvitationData();

    let galleryData = [];
    if (isSupabaseConfigured) {
      try {
        const [galleryRes, settingsRes] = await Promise.all([
          supabase.from("gallery_images").select("*").eq("is_active", true).order("sort_order"),
          supabase.from("invitation_settings").select("event_starts_at, countdown_enabled, show_gallery").eq("id", 1).maybeSingle()
        ]);
        if (!galleryRes.error) galleryData = galleryRes.data;
        if (settingsRes.data) {
          initCountdown(settingsRes.data.event_starts_at, settingsRes.data.countdown_enabled !== false);
          // Hanya render galeri jika show_gallery true
          if (settingsRes.data.show_gallery !== false) {
            renderGallery(galleryData);
          } else {
            document.getElementById('gallery')?.classList.add('hidden');
          }
        }
      } catch (supaError) {
        console.warn("Gagal mengambil data dari Supabase:", supaError);
      }
    }

    await loadDresscodeForPublic();
    await loadWishes();

    await Promise.all([
      waitForFonts(),
      minLoaderTime,
      preloadImage(urls?.heroUrl),
      preloadImage(urls?.descUrl),
    ]);

  } catch (err) {
    console.error("Error during boot:", err);
  } finally {
    hidePageLoader();
    observeReveal();
    observeRundownCards();
    initParallax();

    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    navLinks.forEach(link => {
      let timer;
      link.addEventListener('mouseenter', () => {
        const id = link.getAttribute('href').substring(1);
        const target = document.getElementById(id);
        if (!target) return;
        timer = setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 400);
      });
      link.addEventListener('mouseleave', () => clearTimeout(timer));
    });

    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
      let current = '';
      sections.forEach(section => {
        if (window.scrollY >= section.offsetTop - 120) current = section.id;
      });
      navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${current}`));
    });
  }
}

function initForms() {
  document.getElementById("rsvp-form")?.addEventListener("submit", handleRsvpSubmit);
  document.getElementById("wish-form")?.addEventListener("submit", handleWishSubmit);
  document.getElementById("open-guestbook")?.addEventListener("click", openGuestbookModal);
  document.getElementById("close-guestbook")?.addEventListener("click", closeGuestbookModal);
  document.getElementById("guestbook-modal")?.addEventListener("click", (e) => {
    if (e.target.id === "guestbook-modal") closeGuestbookModal();
  });
  document.getElementById("toggle-bank")?.addEventListener("click", toggleDetails);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeGuestbookModal();
  });
}

export function startInvitation() {
  window.addEventListener("beforeunload", stopCountdown);
  boot();
  if (!isSupabaseConfigured) {
    console.warn("[Supabase] VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY belum diatur di .env");
  }
}

startInvitation();