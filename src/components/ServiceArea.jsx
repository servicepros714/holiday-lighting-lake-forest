import { BUSINESS, SERVICE_AREA } from '../data/business.js';
import { Reveal } from '../lib/useInView.jsx';
import s from './ServiceArea.module.css';

export default function ServiceArea() {
  return (
    <section id="area" className={`section ${s.wrap}`}>
      <div className={`container ${s.grid}`}>
        <Reveal className={s.copy}>
          <span className="eyebrow">Service area</span>
          <h2 className="h2">Based in Lake Forest, lighting up the neighborhood</h2>
          <p className="lede">We install throughout Lake Forest and the surrounding South Orange County communities. Don't see your city? Call us and we'll let you know if we can reach you.</p>
          <a href={BUSINESS.phoneHref} className={`btn btn-pine ${s.btn}`}>Check my address: {BUSINESS.phoneDisplay}</a>
        </Reveal>

        <ul className={s.ornaments} aria-label="Cities we serve">
          {SERVICE_AREA.map((c, i) => (
            <Reveal as="li" key={c} className={`${s.orn} ${i === 0 ? s.home : ''}`} delay={i * 50}>
              <span className={s.cap} aria-hidden="true" />
              {c}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
