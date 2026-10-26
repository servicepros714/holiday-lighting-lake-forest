import LightString from './LightString.jsx';
import { Reveal } from '../lib/useInView.jsx';
import s from './HowItWorks.module.css';

const STEPS = [
  { n: '01', title: 'Book', body: 'Pick your package, add-ons and install window online in a couple of minutes, or give us a call.' },
  { n: '02', title: 'Design', body: 'We walk your home, confirm outlets and power, and lay out a lighting design that fits your rooflines.' },
  { n: '03', title: 'Install', body: 'Our crew hangs commercial-grade LEDs, sets your timer, and we swap any bulb that goes out all season.' },
  { n: '04', title: 'Takedown', body: 'After the holidays we take everything down and haul it away. Nothing to untangle, nothing to store.' },
];

export default function HowItWorks() {
  return (
    <section id="how" className={`section on-dark ${s.wrap}`}>
      <div className="container">
        <Reveal className={s.head}>
          <span className="eyebrow">How it works</span>
          <h2 className="h2">From booking to takedown, we handle it</h2>
        </Reveal>

        <div className={s.rail}>
          <LightString className={s.string} wire="#2b7a3a" sagWidth={150} perSag={3} depth={14} height={44} />
          <ol className={s.steps}>
            {STEPS.map((st, i) => (
              <Reveal as="li" key={st.n} className={s.step} delay={i * 120}>
                <span className={s.hook} aria-hidden="true" />
                <span className={s.num}>{st.n}</span>
                <h3 className={s.title}>{st.title}</h3>
                <p className={s.body}>{st.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
