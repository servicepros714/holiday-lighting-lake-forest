import { PACKAGES, LIGHT_TYPES, TIME_WINDOWS, money } from '../data/business.js';

const KEY = 'hcl_booking_v2';

export const emptyBooking = {
  packageId: '',
  lightType: '',
  date: '',
  windowId: '',
  name: '',
  phone: '',
  email: '',
  address: '',
  details: '',
};

export function loadBooking() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? { ...emptyBooking, ...JSON.parse(raw) } : { ...emptyBooking };
  } catch {
    return { ...emptyBooking };
  }
}
export function saveBooking(b) {
  try { sessionStorage.setItem(KEY, JSON.stringify(b)); } catch { /* storage blocked */ }
}
export function clearBooking() {
  try { sessionStorage.removeItem(KEY); } catch { /* storage blocked */ }
}

export const pkgOf = (b) => PACKAGES.find((p) => p.id === b.packageId);
export const windowOf = (b) => TIME_WINDOWS.find((w) => w.id === b.windowId);

export const lightTypeOf = (b) => LIGHT_TYPES.find((l) => l.id === b.lightType);

/** "Permanent Lights · Front & Sides" → stored in the shared `vehicle` column. */
export function homeSummary(b) {
  const pkg = pkgOf(b);
  const lt = lightTypeOf(b);
  return [lt ? lt.short : '', pkg ? pkg.name : ''].filter(Boolean).join(' · ');
}

/** Starting price of the chosen package, or null when it isn't set yet. */
export function estimate(b) {
  const pkg = pkgOf(b);
  return pkg && pkg.startingAt != null ? Math.round(pkg.startingAt) : null;
}

export const estimateLabel = (b) => {
  const e = estimate(b);
  return e == null ? 'Confirmed at your on-site visit' : `${money(e)}+ (starting at)`;
};

export function formatPhone(v) {
  const d = String(v).replace(/\D/g, '').replace(/^1(?=\d{10})/, '').slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
export const phoneDigits = (v) => String(v).replace(/\D/g, '');
export const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());
