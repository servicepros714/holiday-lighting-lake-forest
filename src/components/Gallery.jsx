import { useCallback, useRef, useState } from 'react';
import { Reveal } from '../lib/useInView.jsx';
import s from './Gallery.module.css';

/*
 * Gallery photos live in /public/images/gallery/.
 * A scene with both `day` and `night` gets the drag slider; a scene with only `night` shows the night photo.
 * `preview: true` shows a small "Design preview" tag — set it to false for photos of your own real installs.
 */
const SCENES = [
  {
    id: 'red-white',
    title: 'Red & white',
    caption: 'Alternating red and warm white bulbs along every roofline.',
    day: '/images/gallery/red-white-day.webp',
    night: '/images/gallery/red-white-night.webp',
    preview: true,
  },
  {
    id: 'warm-white',
    title: 'Warm white',
    caption: 'Classic warm white bulbs tracing the gable and full roofline.',
    day: '/images/gallery/warm-white-day.webp',
    night: '/images/gallery/warm-white-night.webp',
    preview: true,
  },
  {
    id: 'multi-color',
    title: 'Multi-color',
    caption: 'Bright multi-color bulbs across both gables and the front roofline.',
    day: null,
    night: '/images/gallery/multi-color-night.webp',
    preview: true,
  },
];

export default function Gallery() {
  const [idx, setIdx] = useState(0);
  const [pos, setPos] = useState(50);
  const frameRef = useRef(null);
  const dragging = useRef(false);
  const scene = SCENES[idx];
  const hasSlider = Boolean(scene.day && scene.night);

  const setFromX = useCallback((clientX) => {
    const r = frameRef.current.getBoundingClientRect();
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  }, []);

  const down = (e) => { if (!hasSlider) return; dragging.current = true; e.currentTarget.setPointerCapture?.(e.pointerId); setFromX(e.clientX); };
  const move = (e) => { if (hasSlider && dragging.current) setFromX(e.clientX); };
  const up = () => { dragging.current = false; };

  return (
    <section id="gallery" className={`section ${s.wrap}`}>
      <div className="container">
        <Reveal className={s.head}>
          <div>
            <span className="eyebrow">Day vs. night</span>
            <h2 className="h2">See the difference after dark</h2>
          </div>
          <p className="lede">Drag the handle to compare the same home in daylight and lit up for the season.</p>
        </Reveal>

        <div className={s.stage}>
          <div
            ref={frameRef}
            className={`${s.frame} ${hasSlider ? '' : s.static}`}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
          >
            <img src={scene.night} alt={`${scene.title} Christmas lights at night`} className={s.media} />
            {hasSlider && (
              <div className={s.dayLayer} style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
                <img src={scene.day} alt={`${scene.title} home in daylight`} className={s.media} />
              </div>
            )}
            {hasSlider && <span className={`${s.chip} ${s.chipL}`}>Day</span>}
            <span className={`${s.chip} ${s.chipR}`}>Night</span>
            {scene.preview && <span className={s.sample}>Design preview</span>}
            {hasSlider && (
              <>
                <div className={s.handle} style={{ left: `${pos}%` }} aria-hidden="true">
                  <span className={s.knob}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M9 6l-6 6 6 6M15 6l6 6-6 6" /></svg>
                  </span>
                </div>
                <label className="sr-only" htmlFor="ba-range">Compare day and night view</label>
                <input
                  id="ba-range"
                  className={s.range}
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(pos)}
                  onChange={(e) => setPos(Number(e.target.value))}
                />
              </>
            )}
          </div>

          <div className={s.info}>
            <h3 className={s.sTitle}>{scene.title}</h3>
            <p className={s.sCap}>{scene.caption}</p>
            <div className={s.thumbs} role="group" aria-label="Choose a lighting style">
              {SCENES.map((sc, i) => (
                <button
                  key={sc.id}
                  type="button"
                  className={`${s.thumb} ${i === idx ? s.thumbOn : ''}`}
                  aria-pressed={i === idx}
                  aria-label={sc.title}
                  onClick={() => { setIdx(i); setPos(50); }}
                >
                  <img src={sc.night} alt="" loading="lazy" />
                  <span className={s.thumbLabel}>{sc.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
