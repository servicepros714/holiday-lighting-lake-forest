import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, ExpressCheckoutElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { BUSINESS, DEPOSIT_DOLLARS, money } from '../data/business.js';
import { loadBooking, pkgOf, windowOf, homeSummary, estimateLabel, phoneDigits, validEmail } from '../lib/booking.js';
import { prettyDate } from '../lib/schedule.js';
import { createPaymentIntent } from '../lib/api.js';
import { bookingPayload, finishBooking } from '../lib/finish.js';
import s from './Checkout.module.css';

const PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = PK ? loadStripe(PK) : null;
const PI_KEY = 'hcl_pi_v1';

const appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#01380b',
    colorText: '#0f1a10',
    colorDanger: '#af0001',
    fontFamily: 'Manrope, system-ui, sans-serif',
    borderRadius: '12px',
    spacingUnit: '4px',
  },
  rules: { '.Input:focus': { boxShadow: '0 0 0 3px rgba(253,199,54,.45)', borderColor: '#0c4d1b' } },
};

function isComplete(b) {
  return b.packageId && b.lightType && b.name.trim().length > 1 &&
    phoneDigits(b.phone).length === 10 && b.address.trim().length > 5;
}

/* ── Payment form (inside <Elements>) ── */
function PayForm({ booking, clientSecret, piId, onPaid, busy, setBusy }) {
  const stripe = useStripe();
  const elements = useElements();
  const [err, setErr] = useState('');
  const [wallets, setWallets] = useState(false);
  const returnUrl = `${window.location.origin}/confirmation`;

  const afterConfirm = async (result) => {
    if (result.error) {
      setErr(result.error.message || 'Payment could not be completed.');
      setBusy(false);
      return;
    }
    const pi = result.paymentIntent;
    if (pi && (pi.status === 'succeeded' || pi.status === 'processing' || pi.status === 'requires_capture')) {
      await onPaid(pi.id);
    } else {
      setErr('Payment was not completed. Please try again.');
      setBusy(false);
    }
  };

  const payCard = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || busy) return;
    setErr('');
    setBusy(true);
    const { error: submitError } = await elements.submit();
    if (submitError) { setErr(submitError.message); setBusy(false); return; }
    const result = await stripe.confirmPayment({
      elements,
      clientSecret, // passed explicitly: required for Express Checkout + avoids the stale-secret bug
      confirmParams: {
        return_url: returnUrl,
        payment_method_data: { billing_details: { name: booking.name.trim(), phone: phoneDigits(booking.phone) } },
      },
      redirect: 'if_required',
    });
    afterConfirm(result);
  };

  const payExpress = async () => {
    if (!stripe || !elements) return;
    setErr('');
    setBusy(true);
    const result = await stripe.confirmPayment({
      elements,
      clientSecret, // ExpressCheckoutElement MUST get the clientSecret here
      confirmParams: { return_url: returnUrl },
      redirect: 'if_required',
    });
    afterConfirm(result);
  };

  return (
    <form onSubmit={payCard} className={s.payForm} data-pi={piId}>
      <div className={wallets ? s.express : s.expressHidden}>
        <ExpressCheckoutElement
          onConfirm={payExpress}
          onReady={({ availablePaymentMethods }) => setWallets(!!availablePaymentMethods && Object.values(availablePaymentMethods).some(Boolean))}
          options={{ buttonHeight: 50, buttonType: { applePay: 'book', googlePay: 'book' } }}
        />
      </div>
      {wallets && <div className={s.divider}><span>or pay with card</span></div>}
      <PaymentElement options={{ layout: 'tabs', defaultValues: { billingDetails: { name: booking.name, email: booking.email } } }} />
      {err && <p className={s.err} role="alert">{err}</p>}
      <button type="submit" className={`btn btn-gold btn-block ${s.payBtn}`} disabled={!stripe || busy}>
        {busy ? 'Processing…' : `Pay ${money(DEPOSIT_DOLLARS)} Deposit`}
      </button>
    </form>
  );
}

export default function Checkout() {
  const nav = useNavigate();
  const booking = useMemo(loadBooking, []);
  const [intent, setIntent] = useState(null); // { clientSecret, id }
  const [loadErr, setLoadErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [laterErr, setLaterErr] = useState('');

  const pkg = pkgOf(booking);
  const win = windowOf(booking);
  const ok = isComplete(booking);

  useEffect(() => {
    if (!ok) { nav('/book', { replace: true }); return; }
    if (!stripePromise) { setLoadErr('Online payment is not available right now.'); return; }
    const sig = [booking.date, booking.windowId, booking.email, booking.packageId].join('|');
    try {
      const saved = JSON.parse(sessionStorage.getItem(PI_KEY) || 'null');
      if (saved && saved.sig === sig && saved.clientSecret) { setIntent(saved); return; }
    } catch { /* ignore */ }
    createPaymentIntent(bookingPayload(booking))
      .then((d) => {
        const v = { clientSecret: d.clientSecret, id: d.id, sig };
        try { sessionStorage.setItem(PI_KEY, JSON.stringify(v)); } catch { /* ignore */ }
        setIntent(v);
      })
      .catch((e) => {
        if (e.status === 409) setLoadErr(`${e.message} Please go back and choose another time.`);
        else setLoadErr('We couldn\'t start online payment. You can still reserve and pay at the visit, or call us.');
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onPaid = async (piId) => {
    try {
      await finishBooking(nav, booking, 'Paid', piId);
      try { sessionStorage.removeItem(PI_KEY); } catch { /* ignore */ }
    } catch (e) {
      setBusy(false);
      setLoadErr(`Your payment went through, but we couldn't save the booking automatically. Please call ${BUSINESS.phoneDisplay} and mention payment ${piId}.`);
    }
  };

  const payLater = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setLaterErr('');
    try {
      await finishBooking(nav, booking, 'Pay Later');
    } catch (err) {
      setBusy(false);
      setLaterErr(err.status === 409 ? `${err.message} Please go back and choose another time.` : `We couldn't save your booking. Please try again or call ${BUSINESS.phoneDisplay}.`);
    }
  };

  if (!ok) return null;

  return (
    <main className={s.page}>
      <div className={`container ${s.wrap}`}>
        <header className={s.head}>
          <ol className={s.crumbs} aria-label="Progress">
            <li className={s.crumbDone}>Booking details</li>
            <li className={s.crumbNow} aria-current="step">Checkout</li>
            <li>Confirmed</li>
          </ol>
          <h1 className={s.h1}>Reserve your install</h1>
          <p className={s.sub}>A {money(DEPOSIT_DOLLARS)} reservation deposit holds your spot. We'll call to schedule your install date, and the deposit is applied to your final invoice.</p>
        </header>

        <div className={s.grid}>
          <section className={s.payCard} aria-labelledby="pay-title">
            <div className={s.payHead}>
              <h2 id="pay-title" className={s.payTitle}>Reservation deposit</h2>
              <span className={s.payAmt}>{money(DEPOSIT_DOLLARS)}</span>
            </div>

            {loadErr && <p className={s.err} role="alert">{loadErr}</p>}

            {intent && stripePromise && (
              <Elements stripe={stripePromise} options={{ clientSecret: intent.clientSecret, appearance }} key={intent.clientSecret}>
                <PayForm booking={booking} clientSecret={intent.clientSecret} piId={intent.id} onPaid={onPaid} busy={busy} setBusy={setBusy} />
              </Elements>
            )}
            {!intent && !loadErr && <div className={s.loading} aria-live="polite">Loading secure payment…</div>}

            <p className={s.secure}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
              Secure payment processed by Stripe. We never see your card number.
            </p>

            {laterErr && <p className={s.err} role="alert">{laterErr}</p>}
            <p className={s.laterWrap}>
              <a href="#pay-later" className={s.later} onClick={payLater} aria-disabled={busy}>I'll pay at the visit</a>
            </p>
          </section>

          <aside className={s.summary} aria-labelledby="sum-title">
            <div className={s.sumHead}>
              <h2 id="sum-title" className={s.sumTitle}>Order summary</h2>
              <Link to="/book" className={s.edit}>Edit</Link>
            </div>
            <dl className={s.list}>
              <div><dt>Package</dt><dd>{pkg && pkg.name}</dd></div>
              <div><dt>Lights</dt><dd>{homeSummary(booking)}</dd></div>
              <div><dt>Install date</dt><dd>We'll call to schedule</dd></div>
              <div><dt>Name</dt><dd>{booking.name}</dd></div>
              <div><dt>Phone</dt><dd>{booking.phone}</dd></div>
              <div><dt>Address</dt><dd>{booking.address}</dd></div>
            </dl>
            <div className={s.totals}>
              <div><span>Estimated total</span><span>{estimateLabel(booking)}</span></div>
              <div className={s.due}><span>Due today</span><span>{money(DEPOSIT_DOLLARS)}</span></div>
            </div>
            <p className={s.note}>Final price is confirmed at your on-site visit. Your deposit is applied to that invoice.</p>
          </aside>
        </div>
      </div>
    </main>
  );
}

