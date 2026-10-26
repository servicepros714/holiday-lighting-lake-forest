import { Link } from 'react-router-dom';
import { pacificParts, seasonRange } from '../lib/schedule.js';
import { Reveal } from '../lib/useInView.jsx';
import s from './SeasonStrip.module.css';

const dayNum = (ymd) => Date.UTC(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10)) / 864e5;

export default function SeasonStrip() {
  const { start, end, year } = seasonRange();
  const today = pacificParts().date;
  const total = dayNum(end) - dayNum(start);
  const done = Math.min(Math.max(dayNum(today) - dayNum(start), 0), total);
  const pct = Math.round((done / total) * 100);
  const left = Math.max(0, dayNum(end) - dayNum(today));
  const started = today >= start;

  const marks = [
    { at: 0, label: 'Oct 20', text: 'Installs begin' },
    { at: (dayNum(`${year}-11-15`) - dayNum(start)) / total, label: 'Mid-Nov', text: 'Lit before Thanksgiving' },
    { at: (dayNum(`${year}-12-01`) - dayNum(start)) / total, label: 'Dec 1', text: 'Peak holiday glow' },
    { at: 1, label: 'Dec 20', text: 'Last install date' },
  ];

  return (
    <section className={s.wrap} aria-labelledby="season-title">
      <div className={`container ${s.inner}`}>
        <Reveal className={s.lead}>
          <span className={s.count}>{left}</span>
          <div>
            <h2 id="season-title" className={s.title}>
              {started ? 'days left to get lit this season' : `days of install season ahead in ${year}`}
            </h2>
            <p className={s.note}>Install windows are limited and go in the order they're booked. Reserve early for the best choice of dates.</p>
          </div>
          <Link to="/book" className={`btn btn-gold ${s.cta}`}>Pick My Date</Link>
        </Reveal>

        <div className={s.track} role="img" aria-label={`Install season runs October 20 to December 20, ${year}. ${pct}% of the season has passed.`}>
          <div className={s.rail}><div className={s.fill} style={{ width: `${pct}%`, "--pct": `${pct}%` }} /></div>
          {started && left > 0 && <div className={s.today} style={{ left: `${pct}%` }}><span>Today</span></div>}
          {marks.map((m) => (
            <div key={m.label} className={`${s.mark} ${m.at === 0 ? s.first : ''} ${m.at === 1 ? s.last : ''}`} style={{ left: `${m.at * 100}%` }}>
              <span className={s.pin} />
              <span className={s.mLabel}>{m.label}</span>
              <span className={s.mText}>{m.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
