import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PACKAGES, LIGHT_TYPES, BUSINESS } from '../data/business.js';
import { loadBooking, saveBooking, formatPhone, phoneDigits, estimateLabel, pkgOf, homeSummary } from '../lib/booking.js';
import s from './Book.module.css';

const STEPS = ['Light type', 'Coverage', 'Your info'];
const TITLES = ['Permanent or seasonal lights?', 'How much of your home should we light?', 'Almost done — how can we reach you?'];

function Check({ type = 'checkbox' }) {
  return <span className={`${s.ind} ${type === 'radio' ? s.indRadio : ''}`} aria-hidden="true" />;
}

export default function Book() {
  const nav = useNavigate();
  const [b, setB] = useState(loadBooking);
  // If the light type was already picked in the hero card, open on step 2 (Back still returns to step 1)
  const [step, setStep] = useState(() => (loadBooking().lightType ? 1 : 0));
  const [error, setError] = useState('');
  const refs = useRef({});
  const firstMount = useRef(true);

  const update = (patch) => setB((prev) => { const next = { ...prev, ...patch }; saveBooking(next); return next; });

  // Scroll to top on every step change (not on first paint — the route change already did that)
  useEffect(() => {
    if (firstMount.current) { firstMount.current = false; return; }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [step]);

  const fail = (msg, key) => {
    setError(msg);
    requestAnimationFrame(() => {
      const el = refs.current[key];
      if (el) { el.focus({ preventScroll: true }); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    });
  };

  const validate = () => {
    if (step === 0 && !b.lightType) return fail('Please choose Permanent lights or Seasonal lights.', 'lightType');
    if (step === 1 && !b.packageId) return fail('Please choose how much of your home to light (Front Only or Front & Sides).', 'package');
    if (step === 2) {
      if (b.name.trim().length < 2) return fail('Please enter your Full Name.', 'name');
      if (phoneDigits(b.phone).length !== 10) return fail('Please enter a valid Phone number (10 digits).', 'phone');
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

  const pkg = pkgOf(b);

  return (
    <main className={s.page}>
      <div className={`container ${s.layout}`}>
        <div className={s.card}>
          <div className={s.progress}>
            <p className={s.stepCount}>Step {step + 1} of {STEPS.length}</p>
            <ol className={s.dots} style={{ gridTemplateColumns: `repeat(${STEPS.length}, 1fr)` }}>
              {STEPS.map((label, i) => (
                <li key={label} className={`${s.dot} ${i < step ? s.done : ''} ${i === step ? s.now : ''}`}>
                  <span className={s.dotNum}>{i < step ? '✓' : i + 1}</span>
                  <span className={s.dotLabel}>{label}</span>
                </li>
              ))}
            </ol>
          </div>

          <h1 className={s.h1}>{TITLES[step]}</h1>

          {error && <p className={s.error} role="alert">{error}</p>}

          {step === 0 && (
            <fieldset className={s.fs}>
              <legend className={s.hint}>Pick the kind of lighting you're interested in.</legend>
              <div className={s.optStack}>
                {LIGHT_TYPES.map((l, i) => (
                  <label key={l.id} className={`${s.opt} ${b.lightType === l.id ? s.optOn : ''}`}>
                    <input
                      ref={i === 0 ? (el) => { refs.current.lightType = el; } : undefined}
                      type="radio" name="lightType" value={l.id}
                      checked={b.lightType === l.id}
                      onChange={() => { update({ lightType: l.id }); setError(''); }}
                    />
                    <Check type="radio" />
                    <span className={s.optBody}>
                      <span className={s.optTitle}>{l.name}</span>
                      <span className={s.optSub}>{l.desc}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {step === 1 && (
            <fieldset className={s.fs}>
              <legend className={s.hint}>Pick the coverage you'd like.</legend>
              <div className={s.optStack}>
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
                      <span className={s.optSub}>{p.coverage}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {step === 2 && (
            <div>
              <p className={s.hint}>We'll text or call to confirm your booking.</p>
              <div className={s.form} style={{ gridTemplateColumns: '1fr' }}>
                {[
                  ['name', 'Name', 'text', 'name', 'Your full name'],
                  ['phone', 'Phone', 'tel', 'tel', '(949) 000-0000'],
                  ['address', 'Address', 'text', 'street-address', 'Street address in Lake Forest'],
                ].map(([key, label, type, ac, ph]) => (
                  <label key={key} className={s.field}>
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
                <label className={s.field}>
                  <span className={s.fLabel}>Details <span className={s.optional}>(optional)</span></span>
                  <textarea
                    className={s.input}
                    name="details"
                    rows={4}
                    maxLength={1000}
                    placeholder="Trees, walkways, gate codes, preferred install dates…"
                    value={b.details || ''}
                    onChange={(e) => update({ details: e.target.value })}
                    style={{ minHeight: 110, padding: '12px 14px', resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </label>
              </div>
            </div>
          )}

          <div className={s.actions}>
            <button type="button" className="btn btn-ghost-dark" onClick={back}>Back</button>
            <button type="button" className="btn btn-berry" onClick={next}>
              {step === STEPS.length - 1 ? 'Get Free Estimate' : 'Continue'}
            </button>
          </div>
        </div>

        <aside className={s.summary} aria-label="Booking summary">
          <h2 className={s.sumTitle}>Your install</h2>
          <dl className={s.sumList}>
            <div><dt>Lights</dt><dd>{b.lightType ? homeSummary(b) : '—'}</dd></div>
            <div><dt>Coverage</dt><dd>{pkg ? pkg.name : '—'}</dd></div>
            <div><dt>Install date</dt><dd>We'll call to schedule</dd></div>
            <div><dt>Estimate</dt><dd>{pkg ? estimateLabel(b) : '—'}</dd></div>
          </dl>
          <a href={BUSINESS.phoneHref} className={s.sumCall}>Questions? Call {BUSINESS.phoneDisplay}</a>
        </aside>
      </div>
    </main>
  );
}
