import { useEffect, useMemo, useRef, useState } from 'react';
import { useInView } from '../lib/useInView.jsx';

// Bulb colors pulled from the string of C9 bulbs in the logo
const COLORS = ['#e8241f', '#fdc736', '#18a84a', '#2e8cf0', '#fdc736', '#e8241f', '#18a84a'];

/**
 * A sagging string of C9 bulbs that draws itself in when scrolled into view.
 * Geometry is computed at the real rendered width, so bulbs never stretch.
 * Purely decorative (aria-hidden).
 */
export default function LightString({ sagWidth = 190, perSag = 4, depth = 22, height = 60, className = '', wire = '#0d5b22', twinkle = true, offset = 0 }) {
  const [ref, inView] = useInView({ threshold: 0.1 });
  const pathRef = useRef(null);
  const [W, setW] = useState(1200);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const measure = () => setW(Math.max(280, Math.round(el.getBoundingClientRect().width)));
    measure();
    if (!('ResizeObserver' in window)) return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  const { d, bulbs } = useMemo(() => {
    const sags = Math.max(2, Math.round(W / sagWidth));
    const seg = W / sags;
    const top = 4;
    let path = `M0 ${top}`;
    const pts = [];
    for (let i = 0; i < sags; i += 1) {
      const x0 = i * seg, x1 = x0 + seg, cx = x0 + seg / 2, cy = top + depth * 2;
      path += ` Q${cx.toFixed(1)} ${cy} ${x1.toFixed(1)} ${top}`;
      for (let k = 1; k <= perSag; k += 1) {
        const t = k / (perSag + 1);
        const x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1;
        const y = (1 - t) ** 2 * top + 2 * (1 - t) * t * cy + t * t * top;
        const dx = 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx);
        const dy = 2 * (1 - t) * (cy - top) + 2 * t * (top - cy);
        pts.push({ x, y, rot: Math.atan2(dy, dx) * (180 / Math.PI) * 0.6 });
      }
    }
    return { d: path, bulbs: pts };
  }, [W, sagWidth, perSag, depth]);

  useEffect(() => {
    if (pathRef.current && pathRef.current.getTotalLength) {
      pathRef.current.style.setProperty('--len', Math.ceil(pathRef.current.getTotalLength()));
    }
  }, [d]);

  return (
    <svg
      ref={ref}
      className={`string-draw ${inView ? 'drawn' : ''} ${className}`}
      viewBox={`0 0 ${W} ${height}`}
      aria-hidden="true"
      focusable="false"
      style={{ width: '100%', height, overflow: 'visible' }}
    >
      <path ref={pathRef} className="wire" d={d} fill="none" stroke={wire} strokeWidth="2.5" strokeLinecap="round" />
      {bulbs.map((b, i) => {
        const color = COLORS[(i + offset) % COLORS.length];
        return (
          <g key={i} transform={`translate(${b.x.toFixed(1)} ${b.y.toFixed(1)}) rotate(${b.rot.toFixed(1)})`}>
            <g
              className={`bulb ${twinkle && i % 3 === 0 ? 'tw' : ''}`}
              style={{ color, transitionDelay: `${0.4 + (i / bulbs.length) * 1.6}s`, animationDelay: `${(i % 7) * 0.5}s` }}
            >
              <rect x="-3" y="-1" width="6" height="6" rx="1.2" fill="#2f3d22" />
              <path d="M0 4 C 6 7, 6.5 15, 0 20 C -6.5 15, -6 7, 0 4 Z" fill="currentColor" />
              <ellipse cx="-1.6" cy="10" rx="1.3" ry="3" fill="#fff" opacity=".55" />
            </g>
          </g>
        );
      })}
    </svg>
  );
}
