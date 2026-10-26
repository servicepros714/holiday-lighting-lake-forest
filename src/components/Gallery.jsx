import { useCallback, useRef, useState } from 'react';
import HouseScene from './HouseScene.jsx';
import { Reveal } from '../lib/useInView.jsx';
import s from './Gallery.module.css';

/*
 * TODO: replace the illustrated placeholders with REAL install photos.
 * Put matching day + night shots (same angle) in /public/images/gallery/ as .webp,
 * then set `day` and `night` below, e.g. day: '/images/gallery/oak-day.webp'.
 * When both are set, the photo replaces the illustration and the "Sample" chip disappears.
 */
const SCENES = [
  { id: 'two', title: 'Two-story, front & sides', caption: 'Upper and lower rooflines, wrapped trees, wreath and pathway stakes.', variant: 'two', day: null, night: null },
  { id: 'ranch', title: 'Single-story ranch', caption: 'Clean roofline and gutter-line run with bush lighting.', variant: 'ranch', day: null, night: null },
  { id: 'craft', title: 'Craftsman with side gable', caption: 'Multiple peaks traced in warm white with tree wraps.', variant: 'craft', day: null, night: null },
];

function Frame({ scene, mode }) {
  const src = mode === 'day' ? scene.day : scene.night;
  if (scene.day && scene.night) {
    return <img src={src} alt={`${scene.title} — ${mode === 'day' ? 'daytime before' : 'night after'} install`} className={s.media} loading="lazy" />;
  }
  return <HouseScene variant={scene.variant} mode={mode} className={s.media} slice />;
}

export default function Gallery() {
  const [idx, setIdx] = useState(0);
  const [pos, setPos] = useState(50);
  const frameRef = useRef(null);
  const dragging = useRef(false);
  const scene = SCENES[idx];
  const isPlaceholder = !(scene.day && scene.night);

  const setFromX = useCallback((clientX) => {
    const r = frameRef.current.getBoundingClientRect();
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  }, []);

  const down = (e) => { dragging.current = true; e.currentTarget.setPointerCapture?.(e.pointerId); setFromX(e.clientX); };
  const move = (e) => { if (dragging.current) setFromX(e.clientX); };
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
            className={s.frame}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
          >
            <Frame scene={scene} mode="night" />
            <div className={s.dayLayer} style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
              <Frame scene={scene} mode="day" />
            </div>
            <span className={`${s.chip} ${s.chipL}`}>Day</span>
            <span className={`${s.chip} ${s.chipR}`}>Night</span>
            {isPlaceholder && <span className={s.sample}>Sample illustration</span>}
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
          </div>

          <div className={s.info}>
            <h3 className={s.sTitle}>{scene.title}</h3>
            <p className={s.sCap}>{scene.caption}</p>
            <div className={s.thumbs} role="group" aria-label="Choose a home">
              {SCENES.map((sc, i) => (
                <button
                  key={sc.id}
                  type="button"
                  className={`${s.thumb} ${i === idx ? s.thumbOn : ''}`}
                  aria-pressed={i === idx}
                  aria-label={sc.title}
                  onClick={() => { setIdx(i); setPos(50); }}
                >
                  {sc.night ? <img src={sc.night} alt="" loading="lazy" /> : <HouseScene variant={sc.variant} mode="night" slice />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
