import { TIME_ZONE, SEASON, TIME_WINDOWS, LEAD_HOURS } from '../data/business.js';

const fmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hour12: false,
});

/** Wall-clock parts in California for an instant. */
export function pacificParts(ms = Date.now()) {
  const p = Object.fromEntries(fmt.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  const hour = p.hour === '24' ? '00' : p.hour;
  return { date: `${p.year}-${p.month}-${p.day}`, hm: `${hour}:${p.minute}`, year: +p.year };
}

const pad = (n) => String(n).padStart(2, '0');
export const ymd = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

/** Season window for the current (or next, once Dec 20 has passed) season. */
export function seasonRange(nowMs = Date.now()) {
  const today = pacificParts(nowMs);
  let year = today.year;
  if (today.date > ymd(year, SEASON.endMonth, SEASON.endDay)) year += 1;
  return {
    year,
    start: ymd(year, SEASON.startMonth, SEASON.startDay),
    end: ymd(year, SEASON.endMonth, SEASON.endDay),
  };
}

/** Earliest bookable moment (Pacific wall clock) = now + LEAD_HOURS. */
export function earliestSlot(nowMs = Date.now()) {
  const p = pacificParts(nowMs + LEAD_HOURS * 3600 * 1000);
  return `${p.date} ${p.hm}`;
}

export const slotKey = (date, startHour) => `${date} ${pad(startHour)}:00`;

/** Is this window open given lead time + capacity map {"date|windowId": count}. */
export function windowStatus(date, win, booked, capacity, nowMs = Date.now()) {
  const { start, end } = seasonRange(nowMs);
  if (date < start || date > end) return 'out';
  if (slotKey(date, win.startHour) < earliestSlot(nowMs)) return 'past';
  if ((booked[`${date}|${win.id}`] || 0) >= capacity) return 'full';
  return 'open';
}

export function dateStatus(date, booked, capacity, nowMs = Date.now()) {
  const st = TIME_WINDOWS.map((w) => windowStatus(date, w, booked, capacity, nowMs));
  if (st.includes('open')) return 'open';
  if (st.includes('full')) return 'full';
  return st[0];
}

export function prettyDate(date) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString('en-US', {
    timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}
