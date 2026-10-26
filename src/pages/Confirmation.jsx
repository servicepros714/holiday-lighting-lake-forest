import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BUSINESS, DEPOSIT_DOLLARS, money } from '../data/business.js';
import { loadBooking, pkgOf, windowOf, homeSummary } from '../lib/booking.js';
import { prettyDate } from '../lib/schedule.js';
import { CONFIRM_KEY, finishBooking } from '../lib/finish.js';
import LightString from '../components/LightString.jsx';
import s from './Confirmation.module.css';

function readSnap() {
  try { return JSON.parse(sessionStorage.getItem(CONFIRM_KEY) || 'null'); } catch { return null; }
}

function icsHref(b, id) {
  const w = windowOf(b);
  const d = b.date.replace(/-/g, '');
  const start = String(w ? w.startHour : 8).padStart(2, '0');
  const end = String((w ? w.startHour : 8) + 4).padStart(2, '0');
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Holiday Christmas Lighting//EN', 'BEGIN:VEVENT',
    `UID:${id}@hcl-lakeforest`,
    `DTSTART;TZID=America/Los_Angeles:${d}T${start}0000`,
    `DTEND;TZID=America/Los_Angeles:${d}T${end}0000`,
    `SUMMARY:Christmas light install (${id})`,
    `LOCATION:${b.address.replace(/[,;]/g, ' ')}`,
    `DESCRIPTION:${BUSINESS.name} arrival window ${w ? w.label : ''}. Questions: ${BUSINESS.phoneDisplay}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

export default function Confirmation() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [snap, setSnap] = useState(readSnap);
  const [err, setErr] = useState('');

  // Return from a redirect-based payment method (Stripe appends payment_intent + redirect_status)
  useEffect(() => {
    const pi = params.get('payment_intent');
    const status = params.get('redirect_status');
    if (!pi || (snap && snap.id)) return;
    const draft = loadBooking();
    if (status === 'succeeded' && draft.date) {
      finishBooking(nav, draft, 'Paid', pi).then(() => setSnap(readSnap())).catch(() => setErr(`Your payment went through, but we couldn't save the booking automatically. Please call ${BUSINESS.phoneDisplay} and mention payment ${pi}.`));
    } else if (status && status !== 'succeeded') {
      setErr('Your payment was not completed.');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!snap) {
    return (
      <main className={s.page}>
        <div className={`container ${s.card}`}>
          <h1 className={s.h1}>{err ? 'Almost there' : 'No booking found'}</h1>
          <p className={s.lead}>{err || 'Start a new booking or give us a call.'}</p>
          <div className={s.ctas}>
            <Link to="/book" className="btn btn-berry">Book Online</Link>
            <a href={BUSINESS.phoneHref} className="btn btn-ghost-dark">Call {BUSINESS.phoneDisplay}</a>
          </div>
        </div>
      </main>
    );
  }

  const b = snap.booking;
  const pkg = pkgOf(b);
  const w = windowOf(b);
  const paid = snap.paymentStatus === 'Paid';

  return (
    <main className={s.page}>
      <div className={`container ${s.card}`}>
        <LightString className={s.string} sagWidth={130} perSag={3} depth={14} height={44} />
        <span className={s.script}>You're on the list!</span>
        <h1 className={s.h1}>Your install is reserved</h1>
        <p className={s.lead}>
          Confirmation <span className={s.id}>{snap.id}</span>
          {paid ? ` · ${money(DEPOSIT_DOLLARS)} deposit received` : ' · Payment at your visit'}
        </p>

        <dl className={s.list}>
          <div><dt>Package</dt><dd>{pkg && pkg.name}</dd></div>
          <div><dt>Home</dt><dd>{homeSummary(b)}</dd></div>
          <div><dt>Date</dt><dd>{prettyDate(b.date)}</dd></div>
          <div><dt>Arrival window</dt><dd>{w && w.label}</dd></div>
          <div><dt>Address</dt><dd>{b.address}</dd></div>
        </dl>

        <h2 className={s.h2}>What happens next</h2>
        <ol className={s.next}>
          <li>We'll reach out to confirm your appointment and answer any questions.</li>
          <li>On install day we walk your home, confirm power and design, and confirm your final price.</li>
          <li>{paid ? `Your ${money(DEPOSIT_DOLLARS)} deposit is applied to your final invoice.` : 'You can pay at the visit.'}</li>
        </ol>

        <div className={s.ctas}>
          <a className="btn btn-pine" href={icsHref(b, snap.id)} download={`install-${snap.id}.ics`}>Add to Calendar</a>
          <a className="btn btn-ghost-dark" href={BUSINESS.phoneHref}>Call {BUSINESS.phoneDisplay}</a>
        </div>
        <p className={s.home}><Link to="/">Back to home</Link></p>
      </div>
    </main>
  );
}
