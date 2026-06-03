import { supabase, isSupabaseConfigured } from "./lib/supabase.js";
import { resolveImageUrl } from "./lib/storage.js";

let currentGuest = null;

function isMobileInvitation() {
  return document.documentElement.dataset.invitation === "v1";
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove("show"), 3500);
}

function toggleDetails() {
  document.getElementById("bank-details")?.classList.toggle("hidden");
}

function reveal() {
  document.querySelectorAll(".reveal").forEach((el) => {
    const top = el.getBoundingClientRect().top;
    if (top < window.innerHeight - 150) el.classList.add("active");
  });
}

function initParallax() {
  const img = document.getElementById("hero-image");
  if (!img) return;
  window.addEventListener("scroll", () => {
    const scroll = window.pageYOffset;
    if (isMobileInvitation()) {
      img.style.transform = `translateY(${Math.min(scroll * 0.08, 48)}px)`;
    } else {
      img.style.transform = `scale(${1.05 + scroll * 0.0001}) translateY(${scroll * 0.1}px)`;
    }
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el && text != null) el.textContent = text;
}

function getGuestSlug() {
  return new URLSearchParams(window.location.search).get("to")?.trim() || null;
}

function preloadImage(src) {
  if (!src) return Promise.resolve();
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = resolve;
    img.src = src;
  });
}

function waitForFonts() {
  return document.fonts?.ready ?? Promise.resolve();
}

function hidePageLoader() {
  document.getElementById("page-loader")?.classList.add("loaded");
  document.body.classList.remove("is-loading");
  document.getElementById("page-loader")?.setAttribute("aria-busy", "false");
}

async function resolveGuest() {
  const slug = getGuestSlug();
  if (!slug || !isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from("guests")
    .select("id, full_name, category, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

function applyGuestToForm(guest) {
  const nameInput = document.getElementById("full_name");
  const categorySelect = document.getElementById("meal_preference");
  if (!nameInput) return;

  nameInput.value = guest.full_name;
  nameInput.readOnly = true;
  nameInput.classList.add("opacity-80", "cursor-not-allowed");

  if (categorySelect && guest.category) {
    const option = [...categorySelect.options].find(
      (o) => o.value === guest.category,
    );
    if (option) categorySelect.value = guest.category;
  }
}

function renderSettings(s) {
  document.title = `Undangan Perpisahan | ${s.org_name}`;
  setText("nav-org-name", s.org_name);
  setText("footer-org-name", s.org_name);
  setText("hero-label", s.hero_label);
  setText("hero-title", s.event_title);
  setText("hero-subtitle", s.event_subtitle);
  setText("hero-date", s.event_date_display);
  setText("description-label", s.description_label);
  setText("description-title", s.description_title);
  setText("description-body", s.description_body);
  setText("footer-tagline", s.footer_tagline);
  setText("footer-copyright", s.footer_copyright);
  setText("rsvp-deadline", s.rsvp_deadline_text);
  setText("guidelines-palette-title", s.guidelines_palette_title);
  setText("guidelines-palette-note", s.guidelines_palette_note);

  const heroSrc = resolveImageUrl(s.hero_image_path || s.hero_image_url);
  const heroImg = document.getElementById("hero-image");
  if (heroImg && heroSrc) heroImg.src = heroSrc;

  const descSrc = resolveImageUrl(
    s.description_image_path || s.description_image_url,
  );
  const descImg = document.getElementById("description-image");
  if (descImg && descSrc) descImg.src = descSrc;

  const quoteEl = document.getElementById("description-quote");
  if (quoteEl) {
    if (s.description_quote) {
      quoteEl.textContent = `"${s.description_quote}"`;
      quoteEl.classList.remove("hidden");
    } else {
      quoteEl.classList.add("hidden");
    }
  }

  const greetingEl = document.getElementById("guest-greeting");
  if (greetingEl && currentGuest) {
    greetingEl.textContent = `Kepada Yth. ${currentGuest.full_name}`;
    greetingEl.classList.remove("hidden");
  }

  const gmapsLink = document.getElementById("gmaps-link-btn");
  if (gmapsLink && s.gmaps_link_url) gmapsLink.href = s.gmaps_link_url;

  const embed = document.getElementById("gmaps-embed");
  const fallback = document.getElementById("map-fallback");
  if (embed && s.gmaps_embed_url) {
    embed.src = s.gmaps_embed_url;
    embed.classList.remove("hidden");
    fallback?.classList.add("hidden");
  }

  const guidelinesSection = document.getElementById("guidelines");
  const navGuidelines = document.getElementById("nav-guidelines-link");
  if (!s.guidelines_section_enabled) {
    guidelinesSection?.classList.add("hidden");
    navGuidelines?.classList.add("hidden");
  } else {
    guidelinesSection?.classList.remove("hidden");
    navGuidelines?.classList.remove("hidden");
  }

  return {
    heroUrl: heroSrc,
    descUrl: descSrc,
  };
}

function renderRundown(items) {
  const grid = document.getElementById("rundown-grid");
  if (!grid) return;

  if (!items?.length) {
    grid.innerHTML =
      '<p class="col-span-3 text-center text-on-surface-variant italic h-40 flex items-center justify-center">Belum ada rundown acara.</p>';
    return;
  }

  grid.innerHTML = items
    .map(
      (item) => `
    <div class="glass-card p-10 text-center space-y-4 rounded-xl">
      <span class="material-symbols-outlined text-4xl text-inverse-primary-2">${escapeHtml(item.icon)}</span>
      <h3 class="font-headline-sm text-headline-sm text-inverse-primary-2">${escapeHtml(item.title)}</h3>
      ${item.time_range ? `<p class="font-body-md text-body-md text-inverse-primary-2">${escapeHtml(item.time_range)}</p>` : ""}
      ${item.note ? `<p class="font-label-caps text-label-caps text-inverse-primary-2">${escapeHtml(item.note)}</p>` : ""}
    </div>
  `,
    )
    .join("");
}

function renderGuidelines(items) {
  const grid = document.getElementById("guidelines-grid");
  if (!grid) return;

  if (!items?.length) {
    grid.innerHTML =
      '<p class="col-span-2 text-on-surface-variant italic text-sm">Belum ada panduan acara.</p>';
    return;
  }

  grid.innerHTML = items
    .map(
      (g) => `
    <div class="flex gap-4 rounded-xl">
      <span class="material-symbols-outlined text-primary-4">${escapeHtml(g.icon)}</span>
      <div>
        <h4 class="font-headline-sm text-lg mb-1">${escapeHtml(g.title)}</h4>
        <p class="text-on-surface-variant text-sm">${escapeHtml(g.description)}</p>
      </div>
    </div>
  `,
    )
    .join("");
}

async function loadInvitationData() {
  if (!isSupabaseConfigured) return { heroUrl: null, descUrl: null };

  currentGuest = await resolveGuest();
  if (currentGuest) applyGuestToForm(currentGuest);

  const [settingsRes, rundownRes, guidelinesRes] = await Promise.all([
    supabase.from("invitation_settings").select("*").eq("id", 1).maybeSingle(),
    supabase
      .from("event_rundown")
      .select("*")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("guidelines")
      .select("*")
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  let urls = { heroUrl: null, descUrl: null };
  if (settingsRes.data) urls = renderSettings(settingsRes.data) ?? urls;
  renderRundown(rundownRes.data);
  renderGuidelines(guidelinesRes.data);
  return urls;
}

const borderColors = [
  "border-l-primary-3",
  "border-l-primary-2",
  "border-l-outline",
];

function renderWish(wish, index) {
  const border = borderColors[index % borderColors.length];
  return `
    <div class="glass-card !bg-primary-2-container/10 p-6 rounded-xl border-l-4 ${border}">
      <p class="font-body-md text-inverse-primary-1 italic">"${escapeHtml(wish.message)}"</p>
      <p class="font-label-caps text-xs mt-4 text-primary-2">— ${escapeHtml(wish.name.toUpperCase())}</p>
    </div>
  `;
}

async function loadWishes() {
  const list = document.getElementById("guestbook-list");
  if (!list) return;

  if (!isSupabaseConfigured) {
    list.innerHTML = `<div class="glass-card p-6 rounded-xl text-center text-inverse-primary-2 text-sm">Hubungkan Supabase di file <code class="text-primary-3">.env</code> untuk menampilkan ucapan.</div>`;
    return;
  }

  const { data, error } = await supabase
    .from("wishes")
    .select("name, message, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    list.innerHTML = `<p class="text-error text-sm text-center">Gagal memuat ucapan.</p>`;
    return;
  }

  if (!data?.length) {
    list.innerHTML = `<div class="glass-card !bg-primary-2-container/10 p-6 rounded-xl text-center text-inverse-primary-2 text-sm italic">Belum ada ucapan. Jadilah yang pertama memberi doa!</div>`;
    return;
  }

  list.innerHTML = data.map((w, i) => renderWish(w, i)).join("");
}

function openGuestbookModal() {
  const modal = document.getElementById("guestbook-modal");
  if (!modal) return;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  if (currentGuest) {
    const wishName = document.getElementById("wish_name");
    if (wishName) {
      wishName.value = currentGuest.full_name;
      wishName.readOnly = true;
    }
  }
}

function closeGuestbookModal() {
  const modal = document.getElementById("guestbook-modal");
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

async function handleRsvpSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('[type="submit"]');
  const name = form.full_name.value.trim();
  const attend = form.querySelector('input[name="attend"]:checked');

  if (!name) {
    showToast("Mohon isi nama lengkap.", "error");
    return;
  }
  if (!attend) {
    showToast("Mohon pilih konfirmasi kehadiran.", "error");
    return;
  }

  if (!isSupabaseConfigured) {
    showToast("Supabase belum dikonfigurasi.", "error");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Mengirim...";

  const payload = {
    full_name: name,
    will_attend: attend.value === "yes",
    guest_count: parseInt(form.guest_count.value, 10),
    meal_preference: form.meal_preference.value,
  };
  if (currentGuest) payload.guest_id = currentGuest.id;

  const { error } = await supabase.from("rsvps").insert(payload);

  submitBtn.disabled = false;
  submitBtn.textContent = "Kirim Konfirmasi";

  if (error) {
    showToast("Gagal mengirim konfirmasi. Coba lagi.", "error");
    return;
  }

  if (!currentGuest) form.reset();
  showToast("Konfirmasi kehadiran berhasil dikirim. Terima kasih!");
}

async function handleWishSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('[type="submit"]');
  const name = form.wish_name.value.trim();
  const message = form.wish_message.value.trim();

  if (!name || !message) {
    showToast("Mohon isi nama dan ucapan.", "error");
    return;
  }

  if (!isSupabaseConfigured) {
    showToast("Supabase belum dikonfigurasi.", "error");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Mengirim...";

  const { error } = await supabase.from("wishes").insert({ name, message });

  submitBtn.disabled = false;
  submitBtn.textContent = "Kirim Ucapan";

  if (error) {
    showToast("Gagal mengirim ucapan. Coba lagi.", "error");
    return;
  }

  if (!currentGuest) form.reset();
  closeGuestbookModal();
  showToast("Ucapan berhasil dikirim!");
  loadWishes();
}

function initForms() {
  document
    .getElementById("rsvp-form")
    ?.addEventListener("submit", handleRsvpSubmit);
  document
    .getElementById("wish-form")
    ?.addEventListener("submit", handleWishSubmit);
  document
    .getElementById("open-guestbook")
    ?.addEventListener("click", openGuestbookModal);
  document
    .getElementById("close-guestbook")
    ?.addEventListener("click", closeGuestbookModal);
  document.getElementById("guestbook-modal")?.addEventListener("click", (e) => {
    if (e.target.id === "guestbook-modal") closeGuestbookModal();
  });
  document
    .getElementById("toggle-bank")
    ?.addEventListener("click", toggleDetails);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeGuestbookModal();
  });
}

async function boot() {
  initForms();

  const minLoaderTime = new Promise((r) => setTimeout(r, 800));
  const urls = await loadInvitationData();

  await Promise.all([
    loadWishes(),
    waitForFonts(),
    minLoaderTime,
    preloadImage(urls?.heroUrl),
    preloadImage(urls?.descUrl),
  ]);

  hidePageLoader();
  reveal();
  initParallax();
}

export function startInvitation() {
  window.addEventListener("scroll", reveal);

  boot().catch(() => {
    hidePageLoader();
    reveal();
  });

  if (!isSupabaseConfigured) {
    console.warn(
      "[Supabase] VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY belum diatur di .env",
    );
  }
}
