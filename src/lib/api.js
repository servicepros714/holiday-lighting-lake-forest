// Worker base URL, e.g. https://hcl-lakeforest-api.<your-subdomain>.workers.dev
const BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');

async function req(path, opts = {}) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON */ }
  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const getAvailability = (from, to) =>
  req(`/api/availability?from=${from}&to=${to}`);

export const createPaymentIntent = (payload) =>
  req('/api/create-payment-intent', { method: 'POST', body: JSON.stringify(payload) });

export const createBooking = (payload) =>
  req('/api/bookings', { method: 'POST', body: JSON.stringify(payload) });
