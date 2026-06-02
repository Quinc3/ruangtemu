import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const isAdminSupabaseConfigured = Boolean(supabaseUrl && serviceRoleKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const adminSupabase = isAdminSupabaseConfigured
  ? createClient(supabaseUrl, serviceRoleKey)
  : null;

export function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Slug unik dari nama; jika bentrok tambah -2, -3, … */
export function generateUniqueSlug(name, takenSlugs = []) {
  const base = slugify(name) || "tamu";
  const taken = new Set(takenSlugs.filter(Boolean));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export function getGuestLink(slug) {
  const base = window.location.origin;
  return `${base}?to=${encodeURIComponent(slug)}`;
}

export function getPublicLink() {
  return window.location.origin;
}
