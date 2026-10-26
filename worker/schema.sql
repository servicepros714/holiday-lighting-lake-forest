-- Shared bookings table (same columns as the detailing sites; the Worker also runs these with IF NOT EXISTS).
-- Paste into Cloudflare dashboard → D1 → your database → Console. One statement per line on purpose.
CREATE TABLE IF NOT EXISTS bookings (id TEXT PRIMARY KEY, date TEXT, time TEXT, service TEXT, name TEXT, phone TEXT, email TEXT, vehicle TEXT, address TEXT, notes TEXT, source TEXT, created_at TEXT, status TEXT, reschedule_date TEXT, reschedule_time TEXT, notes2 TEXT, original_date TEXT, original_time TEXT, payment_status TEXT);
CREATE INDEX IF NOT EXISTS idx_bookings_source_date ON bookings (source, date);
