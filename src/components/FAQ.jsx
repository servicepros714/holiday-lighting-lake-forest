import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BUSINESS } from '../data/business.js';
import s from './FAQ.module.css';

const FAQS = [
  {
    q: 'Do I need special outlets or extra power?',
    a: 'Usually not. During your design visit we check your exterior outlets and circuits and plan the layout around them. If your home needs a different power setup, we explain the options before anything goes up.',
  },
  {
    q: 'Do I buy the lights or lease them?',
    a: 'Our packages are leased. We supply commercial-grade LEDs, maintain them through the season, and take them back after the holidays, so there is nothing to buy or store. Already own lights? Let us know when we confirm your appointment.',
  },
  {
    q: 'Will my lights be on a timer?',
    a: 'Yes. Timer setup is included with every package, so your lights come on in the evening and shut off on the schedule you choose. Just tell your installer what you prefer.',
  },
  {
    q: 'What happens if it rains or gets windy?',
    a: 'Commercial-grade LEDs are built for outdoor use. If weather knocks a section out, call us. In-season maintenance and bulb replacement are included. If conditions make an install unsafe, we reschedule with you.',
  },
  {
    q: 'When do you take the lights down?',
    a: 'After the holidays. We contact you in the new year to set a takedown date that works for you, then remove everything and haul it away.',
  },
  {
    q: 'Is the price on the website my final price?',
    a: 'Website prices are starting points. Your final price is confirmed at the on-site visit once we see your rooflines, home height and the add-ons you want.',
  },
  {
    q: 'Which areas do you serve?',
    a: `We are based in ${BUSINESS.city} and serve nearby South Orange County communities. See the list above, or call ${BUSINESS.phoneDisplay} to check your address.`,
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className={`section on-dark ${s.wrap}`}>
      <div className={`container ${s.grid}`}>
        <div className={s.side}>
          <span className="eyebrow">FAQ</span>
          <h2 className="h2">Good questions, straight answers</h2>
          <p className="lede">Still wondering about something? We're happy to talk it through.</p>
          <div className={s.sideCtas}>
            <a href={BUSINESS.phoneHref} className="btn btn-gold">Call {BUSINESS.phoneDisplay}</a>
            <Link to="/book" className="btn btn-ghost-light">Book Online</Link>
          </div>
        </div>

        <div className={s.list}>
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className={`${s.item} ${isOpen ? s.open : ''}`}>
                <h3 className={s.qWrap}>
                  <button
                    type="button"
                    className={s.q}
                    aria-expanded={isOpen}
                    aria-controls={`faq-a-${i}`}
                    id={`faq-q-${i}`}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                  >
                    <span>{f.q}</span>
                    <span className={s.icon} aria-hidden="true" />
                  </button>
                </h3>
                <div id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`} className={s.a} hidden={!isOpen}>
                  <p>{f.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
