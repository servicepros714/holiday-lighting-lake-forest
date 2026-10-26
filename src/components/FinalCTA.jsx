import { Link } from 'react-router-dom';
import { BUSINESS } from '../data/business.js';
import LightString from './LightString.jsx';
import { PhoneIcon } from './Header.jsx';
import s from './FinalCTA.module.css';

export default function FinalCTA() {
  return (
    <section className={s.wrap}>
      <LightString className={s.string} wire="#7d0a08" sagWidth={160} depth={18} height={52} offset={3} />
      <div className={`container ${s.inner}`}>
        <span className={s.script}>Make this the easy year</span>
        <h2 className={s.title}>Ready to be the brightest house on the block?</h2>
        <p className={s.sub}>Reserve your install date in {BUSINESS.city} in a few minutes, or call and we'll book it with you.</p>
        <div className={s.ctas}>
          <Link to="/book" className="btn btn-pine">Book Online</Link>
          <a href={BUSINESS.phoneHref} className="btn btn-ghost-dark"><PhoneIcon /> {BUSINESS.phoneDisplay}</a>
        </div>
      </div>
    </section>
  );
}
