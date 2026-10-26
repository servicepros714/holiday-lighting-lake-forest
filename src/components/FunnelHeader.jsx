import { Link } from 'react-router-dom';
import { BUSINESS } from '../data/business.js';
import { PhoneIcon } from './Header.jsx';
import s from './FunnelHeader.module.css';

/** Distraction-free header for /book, /checkout, /confirmation. */
export default function FunnelHeader() {
  return (
    <header className={s.bar}>
      <div className={`container ${s.inner}`}>
        <Link to="/" className={s.back}>← <span className={s.backText}>Back to site</span></Link>
        <Link to="/" className={s.logo} aria-label={`${BUSINESS.name} — home`}>
          <img src="/images/logo-240.webp" alt={BUSINESS.name} width="64" height="64" />
        </Link>
        <a href={BUSINESS.phoneHref} className={s.phone}><PhoneIcon /><span className={s.phoneText}>{BUSINESS.phoneDisplay}</span></a>
      </div>
    </header>
  );
}
