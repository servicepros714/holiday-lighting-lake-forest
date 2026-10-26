import { BUSINESS, REVIEWS, RATING } from '../data/business.js';
import { Reveal } from '../lib/useInView.jsx';
import s from './Reviews.module.css';

const Stars = ({ n = 5 }) => (
  <span className={s.stars} aria-label={`${n} out of 5 stars`}>{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>
);

/* Reviews come ONLY from REVIEWS / RATING in src/data/business.js (TODO: add real ones). */
export default function Reviews() {
  const has = REVIEWS.length > 0;
  return (
    <section id="reviews" className={`section ${s.wrap}`}>
      <div className="container">
        <Reveal className={s.head}>
          <div>
            <span className={`eyebrow ${s.eyebrow}`}>Reviews</span>
            <h2 className="h2">What our neighbors say</h2>
          </div>
          {RATING && (
            <div className={s.score}>
              <span className={s.big}>{RATING.rating.toFixed(1)}</span>
              <span className={s.scoreText}><Stars n={Math.round(RATING.rating)} /><span>{RATING.count} {RATING.source} reviews</span></span>
            </div>
          )}
        </Reveal>

        {has ? (
          <div className={s.grid}>
            {REVIEWS.map((r, i) => (
              <Reveal as="figure" key={i} className={s.card} delay={i * 100}>
                <Stars n={r.stars || 5} />
                <blockquote className={s.quote}>“{r.text}”</blockquote>
                <figcaption className={s.who}>{r.name}{r.city ? ` · ${r.city}` : ''}</figcaption>
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal className={s.empty}>
            <p className={s.emptyText}>Customer reviews will be posted here. Have we lit up your home? We'd love to hear how we did.</p>
            {BUSINESS.googleReviewUrl
              ? <a className="btn btn-gold" href={BUSINESS.googleReviewUrl} target="_blank" rel="noopener noreferrer">Leave a Google Review</a>
              : <a className="btn btn-gold" href={BUSINESS.phoneHref}>Call {BUSINESS.phoneDisplay}</a>}
          </Reveal>
        )}

        {has && BUSINESS.googleReviewUrl && (
          <div className={s.more}>
            <a className="btn btn-ghost-light" href={BUSINESS.googleReviewUrl} target="_blank" rel="noopener noreferrer">Read more on Google</a>
          </div>
        )}
      </div>
    </section>
  );
}
