import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BUSINESS, PACKAGES, LIGHT_TYPES, DEPOSIT_DOLLARS, money } from '../data/business.js';
import { earliestSlot, prettyDate, seasonRange } from '../lib/schedule.js';
import { loadBooking, saveBooking } from '../lib/booking.js';
import HeroSkyline from './HeroSkyline.jsx';
import LightString from './LightString.jsx';
import { PhoneIcon } from './Header.jsx';
import s from './Hero.module.css';

function firstOpenDate() {
  const { start, end } = seasonRange();
  const e = earliestSlot();
  let d = e.slice(0, 10);
  if (e.slice(11) > '12:00') {
    const [y, m, dd] = d.split('-').map(Number);
    d = new Date(Date.UTC(y, m - 1, dd + 1)).toISOString().slice(0, 10);
  }
  if (d < start) d = start;
  return d > end ? null : d;
}

export default function Hero() {
  const nav = useNavigate();
  const [pkg, setPkg] = useState('front-sides');
  const [lightType, setLightType] = useState('seasonal');
  const first = firstOpenDate();

  const go = (e) => {
    e.preventDefault();
    const b = loadBooking();
    saveBooking({ ...b, packageId: pkg, lightType });
    nav('/book');
  };

  return (
    <section id="hero" className={s.hero}>
      <div className={s.stars} aria-hidden="true" />
      <HeroSkyline className={s.scene} />
      <div className={s.shade} aria-hidden="true" />
      <LightString className={s.topString} wire="#0f4a1f" sagWidth={170} depth={18} height={54} />

      <div className={`container ${s.grid}`}>
        <div className={s.copy}>
          <span className={s.script}>Lake Forest's holiday glow, done for you</span>
          <h1 className={s.h1}>
            Bright rooflines.
            <span className={s.gold}> Zero ladders.</span>
          </h1>
          <p className={s.sub}>
            We design, install, maintain and take down commercial-grade LED Christmas lights on your home.
            The lights are leased, so there's nothing to buy, untangle or store.
          </p>
          <div className={s.ctas}>
            <Link to="/book" className="btn btn-gold">Book Your Install</Link>
            <a href={BUSINESS.phoneHref} className="btn btn-ghost-light"><PhoneIcon /> {BUSINESS.phoneDisplay}</a>
          </div>
          <ul className={s.points}>
            <li>Design, install &amp; takedown included</li>
            <li>Bulb swaps all season</li>
            <li>Installs Oct 20 – Dec 20</li>
          </ul>
        </div>

        <form className={s.card} onSubmit={go} aria-labelledby="hero-card-title">
          <div className={s.cardHead}>
            <h2 id="hero-card-title" className={s.cardTitle}>Reserve your install</h2>
            {first && <p className={s.cardNote}>Earliest open date: <span className={s.em}>{prettyDate(first)}</span></p>}
          </div>

          <fieldset className={s.fs}>
            <legend className={s.legend}>Package</legend>
            {PACKAGES.map((p) => (
              <label key={p.id} className={`${s.opt} ${pkg === p.id ? s.optOn : ''}`}>
                <input type="radio" name="hero-pkg" value={p.id} checked={pkg === p.id} onChange={() => setPkg(p.id)} />
                <span className={s.check} aria-hidden="true" />
                <span className={s.optText}>
                  <span className={s.optName}>{p.name}</span>
                  <span className={s.optSub}>{p.tagline}</span>
                </span>
                <span className={s.optPrice}>{p.startingAt != null ? `from ${money(p.startingAt)}` : 'Online quoting'}</span>
              </label>
            ))}
          </fieldset>

          <fieldset className={s.fs}>
            <legend className={s.legend}>Lights</legend>
            <div className={s.toggle}>
              {LIGHT_TYPES.map((l) => (
                <label key={l.id} className={`${s.tog} ${lightType === l.id ? s.togOn : ''}`}>
                  <input type="radio" name="hero-light" value={l.id} checked={lightType === l.id} onChange={() => setLightType(l.id)} />
                  {l.id === 'permanent' ? 'Permanent' : 'Seasonal'}
                </label>
              ))}
            </div>
          </fieldset>

          <button type="submit" className="btn btn-berry btn-block">Book Now</button>
          <p className={s.fine}>{money(DEPOSIT_DOLLARS)} deposit holds your date and is applied to your final invoice.</p>
        </form>
      </div>
    </section>
  );
}
