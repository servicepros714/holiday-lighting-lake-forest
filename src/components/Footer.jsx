import { Link } from 'react-router-dom';
import { BUSINESS, NAV_LEFT, NAV_RIGHT, SERVICE_AREA } from '../data/business.js';
import LightString from './LightString.jsx';
import s from './Footer.module.css';

/** Centered, stacked footer: emblem → tagline → link row → contact row → legal bar. */
export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={s.footer}>
      <LightString className={s.string} wire="#1c6a2c" sagWidth={150} perSag={3} depth={16} height={48} offset={2} />
      <div className={`container ${s.inner}`}>
        <img className={s.logo} src="/images/logo-240.webp" width="132" height="132" alt={BUSINESS.name} loading="lazy" />
        <p className={s.tag}>Leased, professionally installed Christmas lights for {BUSINESS.city} homes. We design it, hang it, keep it glowing, and take it all down.</p>

        <nav className={s.links} aria-label="Footer">
          {[...NAV_LEFT, ...NAV_RIGHT].map((l) => <Link key={l.href} to={l.href}>{l.label}</Link>)}
          <Link to="/book">Book Online</Link>
        </nav>

        <div className={s.contact}>
          <a href={BUSINESS.phoneHref} className={s.phone}>{BUSINESS.phoneDisplay}</a>
          <span className={s.sep} aria-hidden="true">✦</span>
          <span>{BUSINESS.city}, {BUSINESS.region}</span>
          <span className={s.sep} aria-hidden="true">✦</span>
          <span>Installs Oct 20 – Dec 20</span>
        </div>
        <p className={s.area}>Serving {SERVICE_AREA.join(' · ')}</p>
      </div>
      <div className={s.legal}>
        <div className={`container ${s.legalInner}`}>
          <span>© {year} {BUSINESS.name}. All rights reserved.</span>
          <span>Prices shown are starting points; final price is confirmed at your on-site visit.</span>
        </div>
      </div>
    </footer>
  );
}
