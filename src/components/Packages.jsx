import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PACKAGES, money } from '../data/business.js';
import { loadBooking, saveBooking } from '../lib/booking.js';
import { Reveal } from '../lib/useInView.jsx';
import s from './Packages.module.css';

export default function Packages() {
  const [active, setActive] = useState(PACKAGES[0].id);
  const tabsRef = useRef([]);
  const nav = useNavigate();
  const pkg = PACKAGES.find((p) => p.id === active);

  const onKey = (e, i) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + PACKAGES.length) % PACKAGES.length;
    setActive(PACKAGES[n].id);
    tabsRef.current[n] && tabsRef.current[n].focus();
  };

  const book = () => {
    saveBooking({ ...loadBooking(), packageId: active });
    nav('/book');
  };

  return (
    <section id="packages" className={`section ${s.wrap}`}>
      <div className="container">
        <Reveal className={`center ${s.head}`}>
          <span className="eyebrow">Our packages</span>
          <h2 className="h2">Two ways to light up your home</h2>
          <p className="lede">Every package is leased: we bring the commercial-grade LEDs, keep them working all season, and take them away after the holidays.</p>
        </Reveal>

        <div className={s.tabs} role="tablist" aria-label="Packages">
          {PACKAGES.map((p, i) => (
            <button
              key={p.id}
              ref={(el) => { tabsRef.current[i] = el; }}
              type="button"
              role="tab"
              id={`tab-${p.id}`}
              aria-selected={active === p.id}
              aria-controls={`panel-${p.id}`}
              tabIndex={active === p.id ? 0 : -1}
              className={`${s.tab} ${active === p.id ? s.tabOn : ''}`}
              onClick={() => setActive(p.id)}
              onKeyDown={(e) => onKey(e, i)}
            >
              <span className={s.tabName}>{p.name}</span>
              <span className={s.tabPrice}>{p.startingAt != null ? `starting at ${money(p.startingAt)}` : 'Online quoting'}</span>
            </button>
          ))}
        </div>

        <div className={s.panel} role="tabpanel" id={`panel-${pkg.id}`} aria-labelledby={`tab-${pkg.id}`} key={pkg.id}>
          <div className={s.main}>
            <span className={s.script}>{pkg.tagline}</span>
            <h3 className={s.pName}>{pkg.name}</h3>
            <p className={s.price}>
              {pkg.startingAt != null
                ? <>Starting at <span className={s.amount}>{money(pkg.startingAt)}</span></>
                : <span className={s.amount}>Online quoting</span>}
            </p>
            <ul className={s.features}>
              {pkg.features.map((f) => <li key={f}>{f}</li>)}
            </ul>
          </div>

        </div>

        <div className={s.foot}>
          <button type="button" className="btn btn-berry" onClick={book}>Book Now</button>
          <p className={s.fine}>Prices are starting points. Your final price is confirmed at the on-site visit.</p>
        </div>
      </div>
    </section>
  );
}
