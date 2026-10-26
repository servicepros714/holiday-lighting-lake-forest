/**
 * Holiday Christmas Lighting Lake Forest — booking API
 * Worker name: hcl-lakeforest-api
 * Source tag:  hcl-lakeforest      Booking ID prefix: HCL-
 *
 * Single file, no imports: paste into Cloudflare dashboard → Workers → Edit code.
 *
 * Bindings / settings (all set in the Cloudflare dashboard):
 *   D1 binding  DB                 → your shared bookings D1 database
 *   Secret      STRIPE_SECRET_KEY  → sk_live_… / sk_test_…
 *   Secret      ADMIN_TOKEN        → (optional) enables GET/PATCH admin routes
 *   Variable    ALLOWED_ORIGINS    → (optional) extra comma-separated origins, e.g. your custom domain + admin dashboard
 *
 * Known-bug guards baked in:
 *   • ensureSchema never blocks payment: the PaymentIntent route doesn't await it, and schema errors are swallowed + logged.
 *   • No D1 .exec(): every statement is a single-line prepare().run() (exec splits on newlines and breaks multi-line SQL).
 *   • Availability + duplicate checks are source-scoped (AND source = ?), so sites sharing the table never block each other.
 */

// ── Site config (keep in sync with src/data/business.js) ─────────────────────
const SOURCE = 'hcl-lakeforest';
const ID_PREFIX = 'HCL';
const TABLE = 'bookings'; // shared table name used by the admin dashboard
const DEPOSIT_CENTS = 14900;
const CURRENCY = 'usd';
const TIME_ZONE = 'America/Los_Angeles';
const SEASON = { startMonth: 10, startDay: 20, endMonth: 12, endDay: 20 };
const TIME_WINDOWS = { '8AM–12PM': 8, '12PM–4PM': 12 };
const LEAD_HOURS = 48;
const CHECKOUT_GRACE_HOURS = 2; // customer may pick a slot at exactly 48h, then take a while to pay
const SLOT_CAPACITY = 1; // bookings allowed per date + time window
const SERVICES = ['Front Only', 'Front & Sides'];
const PAYMENT_STATUSES = ['Paid', 'Pay Later'];
const DEFAULT_STATUS = 'Booked';
const DEFAULT_ORIGINS = [
  'https://holiday-lighting-lake-forest.pages.dev',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];
// Shared-dashboard editable fields
const PATCHABLE = ['status', 'reschedule_date', 'reschedule_time', 'notes2', 'original_date', 'original_time', 'payment_status', 'date', 'time'];

// Shared D1 columns — exactly these, no others.
const COLUMNS = ['id', 'date', 'time', 'service', 'name', 'phone', 'email', 'vehicle', 'address', 'notes', 'source', 'created_at', 'status', 'reschedule_date', 'reschedule_time', 'notes2', 'original_date', 'original_time', 'payment_status'];

// Single-line statements only (see header).
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS ${TABLE} (id TEXT PRIMARY KEY, date TEXT, time TEXT, service TEXT, name TEXT, phone TEXT, email TEXT, vehicle TEXT, address TEXT, notes TEXT, source TEXT, created_at TEXT, status TEXT, reschedule_date TEXT, reschedule_time TEXT, notes2 TEXT, original_date TEXT, original_time TEXT, payment_status TEXT)`,
  `CREATE INDEX IF NOT EXISTS idx_${TABLE}_source_date ON ${TABLE} (source, date)`,
];

let schemaPromise = null;
function ensureSchema(env) {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      for (const sql of SCHEMA) await env.DB.prepare(sql).run();
    })().catch((err) => {
      console.error('ensureSchema failed (continuing):', err && err.message);
      schemaPromise = null; // retry on a later request
    });
  }
  return schemaPromise;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, '0');
const ymd = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function pacific(ms) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date(ms));
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hm: `${p.hour === '24' ? '00' : p.hour}:${p.minute}`, year: +p.year };
}

function season(now = Date.now()) {
  const t = pacific(now);
  let year = t.year;
  if (t.date > ymd(year, SEASON.endMonth, SEASON.endDay)) year += 1;
  return { start: ymd(year, SEASON.startMonth, SEASON.startDay), end: ymd(year, SEASON.endMonth, SEASON.endDay) };
}

function slotError(date, time, now = Date.now()) {
  if (!DATE_RE.test(String(date || ''))) return 'Please choose an install date.';
  if (!(time in TIME_WINDOWS)) return 'Please choose a valid time window.';
  const { start, end } = season(now);
  if (date < start || date > end) return `Install dates run ${start} to ${end}.`;
  const earliest = pacific(now + (LEAD_HOURS - CHECKOUT_GRACE_HOURS) * 3600e3);
  if (`${date} ${pad(TIME_WINDOWS[time])}:00` < `${earliest.date} ${earliest.hm}`) return 'That time is too soon to book. Please choose a later slot.';
  return null;
}

const clean = (v, max = 200) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
const digits = (v) => String(v || '').replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const extra = String(env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const list = [...DEFAULT_ORIGINS, ...extra];
  const previewOk = /^https:\/\/[a-z0-9-]+\.holiday-lighting-lake-forest\.pages\.dev$/.test(origin);
  const allow = list.includes(origin) || previewOk ? origin : list[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(data, status, cors) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cors },
  });
}

async function readJson(request) {
  try { return await request.json(); } catch { return null; }
}

async function bookedCount(env, date, time) {
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM ${TABLE} WHERE source = ? AND date = ? AND time = ? AND (status IS NULL OR LOWER(status) NOT IN ('cancelled','canceled'))`,
  ).bind(SOURCE, date, time).first();
  return row ? Number(row.n) : 0;
}

async function stripe(env, method, path, form) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form ? new URLSearchParams(form).toString() : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data.error && data.error.message) || `Stripe error ${res.status}`);
  return data;
}

function newId() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `${ID_PREFIX}-${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')}`;
}

function validateCustomer(body) {
  const name = clean(body.name, 120);
  const phone = digits(body.phone);
  const email = clean(body.email, 160).toLowerCase();
  const address = clean(body.address, 240);
  const service = clean(body.service, 60);
  if (!SERVICES.includes(service)) return { error: 'Please choose a package.' };
  if (name.length < 2) return { error: 'Please enter your Full Name.' };
  if (phone.length !== 10) return { error: 'Please enter a valid Phone number.' };
  if (!isEmail(email)) return { error: 'Please enter a valid Email.' };
  if (address.length < 6) return { error: 'Please enter your Service Address.' };
  return { name, phone, email, address, service, vehicle: clean(body.vehicle, 200) };
}

function isAdmin(request, env) {
  if (!env.ADMIN_TOKEN) return false;
  const auth = request.headers.get('Authorization') || '';
  const key = request.headers.get('X-Admin-Key') || '';
  return auth === `Bearer ${env.ADMIN_TOKEN}` || key === env.ADMIN_TOKEN;
}

// ── Routes ────────────────────────────────────────────────────────────────────
async function availability(url, env, cors) {
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  if (!DATE_RE.test(from || '') || !DATE_RE.test(to || '')) return json({ error: 'from and to are required (YYYY-MM-DD).' }, 400, cors);
  await ensureSchema(env);
  const { results } = await env.DB.prepare(
    `SELECT date, time, COUNT(*) AS count FROM ${TABLE} WHERE source = ? AND date >= ? AND date <= ? AND (status IS NULL OR LOWER(status) NOT IN ('cancelled','canceled')) GROUP BY date, time`,
  ).bind(SOURCE, from, to).all();
  return json({ source: SOURCE, capacity: SLOT_CAPACITY, booked: results || [] }, 200, cors);
}

async function createPaymentIntent(request, env, cors) {
  if (!env.STRIPE_SECRET_KEY) return json({ error: 'Online payments are not configured.' }, 503, cors);
  const body = await readJson(request);
  if (!body) return json({ error: 'Invalid request.' }, 400, cors);
  const slotErr = slotError(body.date, body.time);
  if (slotErr) return json({ error: slotErr }, 400, cors);
  const c = validateCustomer(body);
  if (c.error) return json({ error: c.error }, 400, cors);

  // Capacity pre-check. Deliberately NOT awaiting ensureSchema and never letting a DB error block payment.
  try {
    if ((await bookedCount(env, body.date, body.time)) >= SLOT_CAPACITY) {
      return json({ error: 'Sorry, that time window was just booked.' }, 409, cors);
    }
  } catch (err) {
    console.error('capacity pre-check skipped:', err && err.message);
  }

  try {
    const pi = await stripe(env, 'POST', 'payment_intents', {
      amount: String(DEPOSIT_CENTS),
      currency: CURRENCY,
      'automatic_payment_methods[enabled]': 'true',
      description: `Install reservation deposit · ${c.service} · ${body.date} ${body.time}`,
      receipt_email: c.email,
      'metadata[source]': SOURCE,
      'metadata[date]': body.date,
      'metadata[time]': body.time,
      'metadata[service]': c.service,
      'metadata[home]': c.vehicle,
      'metadata[name]': c.name,
      'metadata[phone]': c.phone,
    });
    return json({ clientSecret: pi.client_secret, id: pi.id }, 200, cors);
  } catch (err) {
    console.error('Stripe PI error:', err.message);
    return json({ error: 'Could not start payment. Please try again.' }, 502, cors);
  }
}

async function createBooking(request, env, cors) {
  const body = await readJson(request);
  if (!body) return json({ error: 'Invalid request.' }, 400, cors);
  if (body.source && body.source !== SOURCE) return json({ error: 'Wrong source.' }, 400, cors);
  const paymentStatus = PAYMENT_STATUSES.includes(body.payment_status) ? body.payment_status : null;
  if (!paymentStatus) return json({ error: 'Invalid payment status.' }, 400, cors);
  const c = validateCustomer(body);
  if (c.error) return json({ error: c.error }, 400, cors);

  const date = clean(body.date, 10);
  const time = clean(body.time, 20);
  const piId = paymentStatus === 'Paid' ? clean(body.payment_intent_id, 80) : '';
  // Paid bookings get the grace window extended (customer may have paid via a slow redirect method)
  const slotErr = slotError(date, time, paymentStatus === 'Paid' ? Date.now() - 6 * 3600e3 : Date.now());
  if (slotErr) return json({ error: slotErr }, 400, cors);

  await ensureSchema(env);

  let overCapacity = false;
  if (paymentStatus === 'Paid') {
    if (!/^pi_[A-Za-z0-9]+$/.test(piId)) return json({ error: 'Missing payment reference.' }, 400, cors);
    if (!env.STRIPE_SECRET_KEY) return json({ error: 'Payments are not configured.' }, 503, cors);
    // Idempotent: the same PaymentIntent never creates two bookings
    const existing = await env.DB.prepare(`SELECT id FROM ${TABLE} WHERE source = ? AND notes LIKE ? LIMIT 1`).bind(SOURCE, `%${piId}%`).first();
    if (existing) return json({ ok: true, id: existing.id, duplicate: true }, 200, cors);
    let pi;
    try { pi = await stripe(env, 'GET', `payment_intents/${piId}`); } catch (err) {
      return json({ error: 'Could not verify payment.' }, 502, cors);
    }
    const okStatus = ['succeeded', 'processing', 'requires_capture'].includes(pi.status);
    if (!okStatus || Number(pi.amount) !== DEPOSIT_CENTS || (pi.metadata && pi.metadata.source !== SOURCE)) {
      return json({ error: 'Payment not completed.' }, 402, cors);
    }
    overCapacity = (await bookedCount(env, date, time)) >= SLOT_CAPACITY; // paid: still save, flag for admin
  } else if ((await bookedCount(env, date, time)) >= SLOT_CAPACITY) {
    return json({ error: 'Sorry, that time window was just booked.' }, 409, cors);
  }

  const addons = Array.isArray(body.addons) ? body.addons.map((a) => clean(a, 60)).filter(Boolean).slice(0, 10) : [];
  const est = Number.isFinite(Number(body.estimate)) && body.estimate !== null ? `$${Math.round(Number(body.estimate))}+` : 'at visit';
  const notes = [
    addons.length ? `Add-ons: ${addons.join(', ')}` : 'Add-ons: none',
    `Est. starting price: ${est}`,
    paymentStatus === 'Paid' ? `Deposit $${DEPOSIT_CENTS / 100} paid (${piId})` : 'Deposit: pay at visit',
    overCapacity ? 'WARNING: slot was already full when this paid booking arrived' : '',
  ].filter(Boolean).join(' | ');

  const row = {
    id: '', date, time, service: c.service, name: c.name, phone: c.phone, email: c.email,
    vehicle: c.vehicle, address: c.address, notes, source: SOURCE,
    created_at: new Date().toISOString(), status: DEFAULT_STATUS,
    reschedule_date: null, reschedule_time: null, notes2: null, original_date: null, original_time: null,
    payment_status: paymentStatus,
  };

  const sql = `INSERT INTO ${TABLE} (${COLUMNS.join(', ')}) VALUES (${COLUMNS.map(() => '?').join(', ')})`;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    row.id = newId();
    try {
      await env.DB.prepare(sql).bind(...COLUMNS.map((k) => row[k])).run();
      return json({ ok: true, id: row.id }, 201, cors);
    } catch (err) {
      if (!/UNIQUE|constraint/i.test(String(err && err.message))) {
        console.error('insert failed:', err && err.message);
        return json({ error: 'Could not save booking.' }, 500, cors);
      }
    }
  }
  return json({ error: 'Could not save booking.' }, 500, cors);
}

async function listBookings(url, env, cors) {
  await ensureSchema(env);
  const from = url.searchParams.get('from') || '0000-01-01';
  const to = url.searchParams.get('to') || '9999-12-31';
  const { results } = await env.DB.prepare(
    `SELECT ${COLUMNS.join(', ')} FROM ${TABLE} WHERE source = ? AND date >= ? AND date <= ? ORDER BY date, time`,
  ).bind(SOURCE, from, to).all();
  return json({ source: SOURCE, bookings: results || [] }, 200, cors);
}

async function patchBooking(id, request, env, cors) {
  const body = await readJson(request);
  if (!body) return json({ error: 'Invalid request.' }, 400, cors);
  const keys = Object.keys(body).filter((k) => PATCHABLE.includes(k));
  if (!keys.length) return json({ error: `Nothing to update. Patchable: ${PATCHABLE.join(', ')}` }, 400, cors);
  if (keys.includes('payment_status') && !PAYMENT_STATUSES.includes(body.payment_status)) {
    return json({ error: `payment_status must be one of ${PAYMENT_STATUSES.join(', ')}` }, 400, cors);
  }
  await ensureSchema(env);
  const sets = keys.map((k) => `${k} = ?`).join(', ');
  const vals = keys.map((k) => (body[k] === null ? null : clean(body[k], 1000)));
  const res = await env.DB.prepare(`UPDATE ${TABLE} SET ${sets} WHERE id = ? AND source = ?`).bind(...vals, id, SOURCE).run();
  const changed = res && res.meta ? res.meta.changes : 0;
  if (!changed) return json({ error: 'Booking not found.' }, 404, cors);
  return json({ ok: true, id, updated: keys }, 200, cors);
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '');

    try {
      if (path === '/api/health') return json({ ok: true, source: SOURCE, worker: 'hcl-lakeforest-api' }, 200, cors);
      if (path === '/api/availability' && request.method === 'GET') return await availability(url, env, cors);
      if (path === '/api/create-payment-intent' && request.method === 'POST') return await createPaymentIntent(request, env, cors);
      if (path === '/api/bookings' && request.method === 'POST') return await createBooking(request, env, cors);

      if (path === '/api/bookings' && request.method === 'GET') {
        if (!isAdmin(request, env)) return json({ error: 'Unauthorized' }, 401, cors);
        return await listBookings(url, env, cors);
      }
      const m = path.match(/^\/api\/bookings\/([A-Za-z0-9-]+)$/);
      if (m && request.method === 'PATCH') {
        if (!isAdmin(request, env)) return json({ error: 'Unauthorized' }, 401, cors);
        return await patchBooking(m[1], request, env, cors);
      }
      return json({ error: 'Not found' }, 404, cors);
    } catch (err) {
      console.error('Unhandled:', err && err.stack);
      return json({ error: 'Server error' }, 500, cors);
    }
  },
};
