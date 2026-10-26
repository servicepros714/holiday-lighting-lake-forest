import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BUSINESS, NAV_LEFT, NAV_RIGHT } from '../data/business.js';
import { seasonRange } from '../lib/schedule.js';
import s from './Header.module.css';

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
    </svg>
  );
}
export { PhoneIcon };

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const loc = useLocation();
  const closeRef = useRef(null);
  const burgerRef = useRef(null);
  const drawerRef = useRef(null);
  const season = seasonRange();
  const allLinks = [...NAV_LEFT, ...NAV_RIGHT];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [loc.pathname, loc.hash]);

  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = 'hidden';
    closeRef.current && closeRef.current.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'Tab' && drawerRef.current) {
        const f = drawerRef.current.querySelectorAll('a, button');
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      burgerRef.current && burgerRef.current.focus();
    };
  }, [open]);

  const navItem = (l) => (
    <Link key={l.href} to={l.href} className={s.link}>{l.label}</Link>
  );

  return (
    <>
      <div className={s.strip}>
        <div className={`container ${s.stripInner}`}>
          <span className={s.stripMsg}>
            <span className={s.dot} aria-hidden="true" />
            <span className={s.stripLong}>Now booking the {season.year} season · installs Oct 20 – Dec 20 · Lake Forest &amp; nearby</span>
            <span className={s.stripShort}>Booking {season.year} installs now</span>
          </span>
          <a href={BUSINESS.phoneHref} className={s.stripPhone}><PhoneIcon /> {BUSINESS.phoneDisplay}</a>
        </div>
      </div>

      <header className={`${s.header} ${scrolled ? s.scrolled : ''}`}>
        <div className={`container ${s.bar}`}>
          <nav className={s.left} aria-label="Primary">{NAV_LEFT.map(navItem)}</nav>

          <Link to="/" className={s.logo} aria-label={`${BUSINESS.name} — home`}>
            <img src="/images/logo-240.webp" width="240" height="240" alt={BUSINESS.name} />
          </Link>

          <div className={s.right}>
            <nav className={s.rightNav} aria-label="Secondary">{NAV_RIGHT.map(navItem)}</nav>
            <Link to="/book" className={`btn btn-gold ${s.cta}`}>Book Now</Link>
          </div>

          <Link to="/" className={s.brand} tabIndex={-1} aria-hidden="true">
            <span className={s.brandTop}>Holiday</span>
            <span className={s.brandBottom}>Christmas Lighting · Lake Forest</span>
          </Link>

          <button
            ref={burgerRef}
            type="button"
            className={s.burger}
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(true)}
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      <div className={`${s.backdrop} ${open ? s.show : ''}`} onClick={() => setOpen(false)} aria-hidden="true" />
      <div
        id="mobile-menu"
        ref={drawerRef}
        className={`${s.drawer} ${open ? s.drawerOpen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <div className={s.drawerHead}>
          <img src="/images/logo-240.webp" alt="" width="64" height="64" />
          <button ref={closeRef} type="button" className={s.close} aria-label="Close menu" onClick={() => setOpen(false)}>✕</button>
        </div>
        <nav className={s.drawerNav} aria-label="Mobile">
          {allLinks.map((l) => (
            <Link key={l.href} to={l.href} onClick={() => setOpen(false)}>{l.label}</Link>
          ))}
        </nav>
        <div className={s.drawerActions}>
          <a href={BUSINESS.phoneHref} className="btn btn-ghost-light"><PhoneIcon /> Call Now</a>
          <Link to="/book" className="btn btn-gold" onClick={() => setOpen(false)}>Book Online</Link>
        </div>
      </div>
    </>
  );
}
