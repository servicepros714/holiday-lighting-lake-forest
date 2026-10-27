import { SOURCE_TAG } from '../data/business.js';
import { pkgOf, windowOf, homeSummary, estimate, phoneDigits, clearBooking } from './booking.js';
import { createBooking } from './api.js';

export const CONFIRM_KEY = 'hcl_confirmed_v1';

/** Maps the booking draft onto the shared D1 columns. */
export function bookingPayload(b) {
  const pkg = pkgOf(b);
  const win = windowOf(b);
  const est = estimate(b);
  return {
    source: SOURCE_TAG,
    date: b.date,
    time: win ? win.id : b.windowId,
    service: pkg ? pkg.name : b.packageId,
    vehicle: homeSummary(b), // light type + package live in the shared `vehicle` column
    name: b.name.trim(),
    phone: phoneDigits(b.phone),
    email: b.email.trim(),
    address: b.address.trim(),
    details: (b.details || '').trim(),
    addons: [],
    estimate: est,
  };
}

/** Saves the booking via the Worker, stores the confirmation snapshot and routes to /confirmation. */
export async function finishBooking(nav, b, paymentStatus, paymentIntentId) {
  const res = await createBooking({
    ...bookingPayload(b),
    payment_status: paymentStatus,
    payment_intent_id: paymentIntentId || undefined,
  });
  const snap = { id: res.id, paymentStatus, booking: b, at: Date.now() };
  try { sessionStorage.setItem(CONFIRM_KEY, JSON.stringify(snap)); } catch { /* ignore */ }
  clearBooking();
  nav('/confirmation', { replace: true });
  return res;
}
