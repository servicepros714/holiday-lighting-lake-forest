import { PACKAGES, ADDONS, TWO_STORY_MULTIPLIER, TIME_WINDOWS, money } from '../data/business.js';

const KEY = 'hcl_booking_v1';

export const emptyBooking = {
  packageId: '',
  stories: '',
  addons: [],
  date: '',
  windowId: '',
  name: '',
  phone: '',
  email: '',
  address: '',
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

/** "2-Story · Front & Sides · +Wreaths, +Pathway" → stored in the shared `vehicle` column. */
export function homeSummary(b) {
  const pkg = pkgOf(b);
  const parts = [b.stories === '2' ? '2-Story' : '1-Story', pkg ? pkg.name : ''];
  const add = ADDONS.filter((a) => b.addons.includes(a.id)).map((a) => '+' + a.short);
  if (add.length) parts.push(add.join(', '));
  return parts.filter(Boolean).join(' · ');
}

/** Estimated starting total, or null when any needed price is still unset. */
export function estimate(b) {
  const pkg = pkgOf(b);
  if (!pkg || pkg.startingAt == null) return null;
  let total = pkg.startingAt * (b.stories === '2' ? TWO_STORY_MULTIPLIER : 1);
  for (const a of ADDONS) {
    if (!b.addons.includes(a.id)) continue;
    if (a.price == null) return null;
    total += a.price;
  }
  return Math.round(total);
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
