import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PACKAGES, ADDONS, TIME_WINDOWS, DEPOSIT_DOLLARS, BUSINESS, money } from '../data/business.js';
import { loadBooking, saveBooking, formatPhone, phoneDigits, validEmail, estimateLabel, pkgOf, windowOf, homeSummary } from '../lib/booking.js';
import { seasonRange, dateStatus, windowStatus, prettyDate, ymd } from '../lib/schedule.js';
import { getAvailability } from '../lib/api.js';
import s from './Book.module.css';

const STEPS = ['Package', 'Home & add-ons', 'Install date', 'Time window', 'Your info'];
const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function Check({ type = 'checkbox' }) {
  return <span className={`${s.ind} ${type === 'radio' ? s.indRadio : ''}`} aria-hidden="true" />;
}

export default function Book() {
  const nav = useNavigate();
  const [b, setB] = useState(loadBooking);
  // If a package was already picked on the homepage, open on step 2 (Back still returns to step 1)
  const [step, setStep] = useState(() => (loadBooking().packageId ? 1 : 0));
  const [error, setError] = useState('');
  const [avail, setAvail] = useState({ loading: true, failed: false, capacity: 1, booked: {} });
  const refs = useRef({});
  const season = useMemo(() => seasonRange(), []);
  const firstMount = useRef(true);

  const update = (patch) => setB((prev) => { const next = { ...prev, ...patch }; saveBooking(next); return next; });

  // Scroll to top on every step change (not on first paint — the route change already did that)
  useEffect(() => {
    if (firstMount.current) { firstMount.current = false; return; }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [step]);

  const loadAvail = () => {
    setAvail((a) => ({ ...a, loading: true, failed: false }));
    getAvailability(season.start, season.end)
      .then((d) => {
        const booked = {};
        (d.booked || []).forEach((r) => { booked[`${r.date}|${r.time}`] = r.count; });
        setAvail({ loading: false, failed: false, capacity: d.capacity || 1, booked });
      })
      .catch(() => setAvail({ loading: false, failed: true, capacity: 1, booked: {} }));
  };
  useEffect(loadAvail, []); // eslint-disable-line react-hooks/exhaustive-deps

  // If a previously chosen date/window has since become unavailable, clear it
  useEffect(() => {
    if (avail.loading) return;
    if (b.date && dateStatus(b.date, avail.booked, avail.capacity) !== 'open') update({ date: '', windowId: '' });
    else if (b.date && b.windowId) {
      const w = TIME_WINDOWS.find((x) => x.id === b.windowId);
      if (!w || windowStatus(b.date, w, avail.booked, avail.capacity) !== 'open') update({ windowId: '' });
    }
  }, [avail.loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const fail = (msg, key) => {
    setError(msg);
    requestAnimationFrame(() => {
      const el = refs.current[key];
      if (el) { el.focus({ preventScroll: true }); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    });
  };

  const validate = () => {
    if (step === 0 && !b.packageId) return fail('Please choose a Package to continue.', 'package');
    if (step === 1 && !b.stories) return fail('Please choose your Home height (1-Story or 2-Story).', 'stories');
    if (step === 2 && !b.date) return fail('Please choose an Install date.', 'date');
    if (step === 3 && !b.windowId) return fail('Please choose a Time window.', 'window');
    if (step === 4) {
      if (b.name.trim().length < 2) return fail('Please enter your Full Name.', 'name');
      if (phoneDigits(b.phone).length !== 10) return fail('Please enter a valid Phone number (10 digits).', 'phone');
      if (!validEmail(b.email)) return fail('Please enter a valid Email address.', 'email');
      if (b.address.trim().length < 6) return fail('Please enter your Service Address (street, city).', 'address');
    }
    return true;
  };

  const next = () => {
    if (validate() !== true) return;
    setError('');
    if (step < STEPS.length - 1) setStep(step + 1);
    else nav('/checkout');
  };
  const back = () => {
    setError('');
    if (step === 0) nav('/');
    else setStep(step - 1);
  };

  // ── Calendar month state ──
  const months = useMemo(() => {
    const list = [];
    let y = +season.start.slice(0, 4), m = +season.start.slice(5, 7);
    const ey = +season.end.slice(0, 4), em = +season.end.slice(5, 7);
    while (y < ey || (y === ey && m <= em)) { list.push({ y, m }); m += 1; if (m > 12) { m = 1; y += 1; } }
    return list;
  }, [season]);

  const firstOpenMonth = useMemo(() => {
    if (avail.loading) return 0;
    for (let i = 0; i < months.length; i += 1) {
      const { y, m } = months[i];
      const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
      for (let d = 1; d <= days; d += 1) if (dateStatus(ymd(y, m, d), avail.booked, avail.capacity) === 'open') return i;
    }
    return 0;
  }, [avail, months]);
  const [monthIdx, setMonthIdx] = useState(null);
  const mi = monthIdx ?? (b.date ? Math.max(0, months.findIndex((x) => ymd(x.y, x.m, 1).slice(0, 7) === b.date.slice(0, 7))) : firstOpenMonth);

  const renderCalendar = () => {
    const { y, m } = months[mi];
    const lead = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
    const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const cells = [];
    for (let i = 0; i < lead; i += 1) cells.push(<span key={`e${i}`} className={s.dayEmpty} />);
    let firstOpenSet = false;
    for (let d = 1; d <= days; d += 1) {
      const date = ymd(y, m, d);
      const st = avail.loading ? 'loading' : dateStatus(date, avail.booked, avail.capacity);
      const open = st === 'open';
      const sel = b.date === date;
      const refKey = (sel || (!b.date && open && !firstOpenSet)) ? 'date' : null;
      if (refKey && !sel) firstOpenSet = true;
      cells.push(
        <button
          key={date}
          type="button"
          ref={refKey ? (el) => { if (el) refs.current.date = el; } : undefined}
          className={`${s.day} ${sel ? s.daySel : ''} ${st === 'full' ? s.dayFull : ''}`}
          disabled={!open}
          aria-pressed={sel}
          aria-label={`${prettyDate(date)}${st === 'full' ? ', fully booked' : ''}${!open && st !== 'full' ? ', unavailable' : ''}`}
          onClick={() => { update({ date, windowId: b.date === date ? b.windowId : '' }); setError(''); }}
        >
          {d}
        </button>,
      );
    }
    return (
      <div className={s.cal}>
        <div className={s.calHead}>
          <button type="button" className={s.calNav} onClick={() => setMonthIdx(Math.max(0, mi - 1))} disabled={mi === 0} aria-label="Previous month">‹</button>
          <span className={s.calTitle} aria-live="polite">{MONTHS[m - 1]} {y}</span>
          <button type="button" className={s.calNav} onClick={() => setMonthIdx(Math.min(months.length - 1, mi + 1))} disabled={mi === months.length - 1} aria-label="Next month">›</button>
        </div>
        <div className={s.week} aria-hidden="true">{WEEK.map((w) => <span key={w}>{w}</span>)}</div>
        <div className={s.days}>{cells}</div>
        <div className={s.calLegend}>
          <span><i className={s.lgOpen} /> Available</span>
          <span><i className={s.lgSel} /> Selected</span>
          <span><i className={s.lgFull} /> Booked</span>
        </div>
      </div>
    );
  };

  const pkg = pkgOf(b);
  const win = windowOf(b);

  return (
    <main className={s.page}>
      <div className={`container ${s.layout}`}>
        <div className={s.card}>
          <div className={s.progress}>
            <p className={s.stepCount}>Step {step + 1} of {STEPS.length}</p>
            <ol className={s.dots}>
              {STEPS.map((label, i) => (
                <li key={label} className={`${s.dot} ${i < step ? s.done : ''} ${i === step ? s.now : ''}`}>
                  <span className={s.dotNum}>{i < step ? '✓' : i + 1}</span>
                  <span className={s.dotLabel}>{label}</span>
                </li>
              ))}
            </ol>
          </div>

          <h1 className={s.h1}>{['Choose your package', 'Tell us about your home', 'Pick your install date', 'Pick a time window', 'Your info'][step]}</h1>

          {error && <p className={s.error} role="alert">{error}</p>}

          {step === 0 && (
            <fieldset className={s.fs}>
              <legend className="sr-only">Package</legend>
              <div className={s.optGrid}>
                {PACKAGES.map((p, i) => (
                  <label key={p.id} className={`${s.opt} ${b.packageId === p.id ? s.optOn : ''}`}>
                    <input
                      ref={i === 0 ? (el) => { refs.current.package = el; } : undefined}
                      type="radio" name="package" value={p.id}
                      checked={b.packageId === p.id}
                      onChange={() => { update({ packageId: p.id }); setError(''); }}
                    />
                    <Check type="radio" />
                    <span className={s.optBody}>
                      <span className={s.optTitle}>{p.name}</span>
                      <span className={s.optPrice}>{p.startingAt != null ? `Starting at ${money(p.startingAt)}` : 'Priced at your on-site visit'}</span>
                      <ul className={s.optList}>{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {step === 1 && (
            <>
              <fieldset className={s.fs}>
                <legend className={s.legend}>Home height</legend>
                <div className={s.optGrid}>
                  {[['1', '1-Story', 'Single-level home'], ['2', '2-Story', '+50% of package price']].map(([v, t, sub], i) => (
                    <label key={v} className={`${s.opt} ${s.optRow} ${b.stories === v ? s.optOn : ''}`}>
                      <input
                        ref={i === 0 ? (el) => { refs.current.stories = el; } : undefined}
                        type="radio" name="stories" value={v}
                        checked={b.stories === v}
                        onChange={() => { update({ stories: v }); setError(''); }}
                      />
                      <Check type="radio" />
                      <span className={s.optBody}>
                        <span className={s.optTitle}>{t}</span>
                        <span className={s.optSub}>{sub}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset className={s.fs}>
                <legend className={s.legend}>Add-ons <span className={s.optional}>(optional)</span></legend>
                <div className={s.optGrid}>
                  {ADDONS.map((a) => {
                    const on = b.addons.includes(a.id);
                    return (
                      <label key={a.id} className={`${s.opt} ${s.optRow} ${on ? s.optOn : ''}`}>
                        <input
                          type="checkbox" checked={on}
                          onChange={() => update({ addons: on ? b.addons.filter((x) => x !== a.id) : [...b.addons, a.id] })}
                        />
                        <Check />
                        <span className={s.optBody}>
                          <span className={s.optTitle}>{a.name}</span>
                          <span className={s.optSub}>{a.price != null ? `${a.flat ? '' : '+'}${money(a.price)}` : 'Quoted at visit'}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </>
          )}

          {step === 2 && (
            <div>
              <p className={s.hint}>Installs run {prettyDate(season.start).replace(/^\w+, /, '')} – {prettyDate(season.end).replace(/^\w+, /, '')}, 7 days a week. The earliest you can book is 48 hours from now (California time).</p>
              {avail.failed && (
                <p className={s.warn}>We couldn't load live availability. You can still pick a date; we'll confirm it. <button type="button" className={s.linkBtn} onClick={loadAvail}>Try again</button></p>
              )}
              {renderCalendar()}
              {b.date && <p className={s.picked}>Selected: <span className={s.pickedVal}>{prettyDate(b.date)}</span></p>}
            </div>
          )}

          {step === 3 && (
            <fieldset className={s.fs}>
              <legend className={s.legend}>{b.date ? prettyDate(b.date) : 'Choose a date first'}</legend>
              <div className={s.optGrid}>
                {TIME_WINDOWS.map((w) => {
                  const st = b.date ? windowStatus(b.date, w, avail.booked, avail.capacity) : 'out';
                  const open = st === 'open';
                  const firstOpen = TIME_WINDOWS.find((x) => b.date && windowStatus(b.date, x, avail.booked, avail.capacity) === 'open');
                  const isRef = firstOpen ? firstOpen.id === w.id : w === TIME_WINDOWS[0];
                  return (
                    <label key={w.id} className={`${s.opt} ${s.optRow} ${b.windowId === w.id ? s.optOn : ''} ${!open ? s.optOff : ''}`}>
                      <input
                        ref={isRef ? (el) => { refs.current.window = el; } : undefined}
                        type="radio" name="window" value={w.id}
                        disabled={!open}
                        checked={b.windowId === w.id}
                        onChange={() => { update({ windowId: w.id }); setError(''); }}
                      />
                      <Check type="radio" />
                      <span className={s.optBody}>
                        <span className={s.optTitle}>{w.label}</span>
                        <span className={s.optSub}>{open ? `${w.part} arrival window` : st === 'full' ? 'Booked' : 'Too soon to book'}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}

          {step === 4 && (
            <div className={s.form}>
              {[
                ['name', 'Full Name', 'text', 'name', 'Jane Smith'],
                ['phone', 'Phone', 'tel', 'tel', '(949) 555-0123'],
                ['email', 'Email', 'email', 'email', 'you@example.com'],
                ['address', 'Service Address', 'text', 'street-address', 'Street, City, ZIP'],
              ].map(([key, label, type, ac, ph]) => (
                <label key={key} className={`${s.field} ${key === 'address' ? s.full : ''}`}>
                  <span className={s.fLabel}>{label}</span>
                  <input
                    ref={(el) => { refs.current[key] = el; }}
                    className={s.input}
                    type={type}
                    name={key}
                    autoComplete={ac}
                    inputMode={key === 'phone' ? 'tel' : undefined}
                    placeholder={ph}
                    value={b[key]}
                    onChange={(e) => { update({ [key]: key === 'phone' ? formatPhone(e.target.value) : e.target.value }); setError(''); }}
                    required
                  />
                </label>
              ))}
            </div>
          )}

          <div className={s.actions}>
            <button type="button" className="btn btn-ghost-dark" onClick={back}>Back</button>
            <button type="button" className="btn btn-berry" onClick={next}>
              {step === STEPS.length - 1 ? 'Continue to Checkout' : 'Continue'}
            </button>
          </div>
        </div>

        <aside className={s.summary} aria-label="Booking summary">
          <h2 className={s.sumTitle}>Your install</h2>
          <dl className={s.sumList}>
            <div><dt>Package</dt><dd>{pkg ? pkg.name : '—'}</dd></div>
            <div><dt>Home</dt><dd>{b.stories ? homeSummary(b) : '—'}</dd></div>
            <div><dt>Date</dt><dd>{b.date ? prettyDate(b.date) : '—'}</dd></div>
            <div><dt>Window</dt><dd>{win ? win.label : '—'}</dd></div>
            <div><dt>Estimate</dt><dd>{pkg ? estimateLabel(b) : '—'}</dd></div>
          </dl>
          <p className={s.sumDeposit}>{money(DEPOSIT_DOLLARS)} deposit at checkout, applied to your final invoice.</p>
          <a href={BUSINESS.phoneHref} className={s.sumCall}>Questions? Call {BUSINESS.phoneDisplay}</a>
        </aside>
      </div>
    </main>
  );
}
