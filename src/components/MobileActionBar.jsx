import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BUSINESS } from '../data/business.js';
import { PhoneIcon } from './Header.jsx';
import s from './MobileActionBar.module.css';

/** Slides in after the visitor scrolls past the hero. App unmounts it on /book, /checkout, /confirmation. */
export default function MobileActionBar() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const hero = document.getElementById('hero');
      const limit = hero ? hero.offsetTop + hero.offsetHeight - 80 : 420;
      setShow(window.scrollY > limit);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('has-action-bar', show);
    return () => document.body.classList.remove('has-action-bar');
  }, [show]);

  return (
    <div className={`${s.bar} ${show ? s.in : ''}`} aria-hidden={!show}>
      <a href={BUSINESS.phoneHref} className="btn btn-ghost-light" tabIndex={show ? 0 : -1}><PhoneIcon /> Call Now</a>
      <Link to="/book" className="btn btn-gold" tabIndex={show ? 0 : -1}>Book Online</Link>
    </div>
  );
}
