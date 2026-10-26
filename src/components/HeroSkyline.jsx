import { useId } from 'react';
import { HOUSES, along } from './HouseScene.jsx';

/* A lit-up Lake Forest street silhouette for the hero (decorative). */
const ROW = [
  { v: 'craft', x: -60, s: 0.46 },
  { v: 'two', x: 250, s: 0.56 },
  { v: 'ranch', x: 600, s: 0.48 },
  { v: 'two', x: 930, s: 0.5 },
  { v: 'craft', x: 1230, s: 0.52 },
];
const TREES = [[240, 0.9], [585, 0.75], [905, 1], [1215, 0.85], [1560, 0.95]];
const MULTI = ['#ff3b30', '#fdc736', '#22c55e', '#3b82f6'];

export default function HeroSkyline({ className = '' }) {
  const uid = useId().replace(/:/g, '');
  const glow = `hg${uid}`;
  const BASE = 300;
  return (
    <svg className={className} viewBox="0 0 1600 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <defs>
        <filter id={glow} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="2.6" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <linearGradient id={`gr${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#04190c" />
          <stop offset="1" stopColor="#020d06" />
        </linearGradient>
      </defs>

      {ROW.map((h, i) => {
        const g = HOUSES[h.v];
        const bulbs = g.lines.flatMap((l) => along(l, 16));
        return (
          <g key={i} transform={`translate(${h.x} ${BASE - 420 * h.s}) scale(${h.s})`}>
            {g.walls.map((w, k) => <rect key={k} x={w.x} y={w.y} width={w.w} height={w.h} fill="#0b1f15" />)}
            {g.roofs.map((r, k) => <polygon key={k} points={r.pts} fill="#06130c" />)}
            {g.windows.map(([x, y, w, hh], k) => <rect key={k} x={x} y={y} width={w} height={hh} rx="3" fill="#f7c76a" opacity=".55" />)}
            {g.garage && <rect x={g.garage[0]} y={g.garage[1]} width={g.garage[2]} height={g.garage[3]} fill="#0e2219" />}
            <rect x={g.door[0]} y={g.door[1]} width={g.door[2]} height={g.door[3]} fill="#140d08" />
            <circle cx={g.door[0] + g.door[2] / 2} cy={g.door[1] + 30} r="15" fill="none" stroke="#1d8a3d" strokeWidth="6" filter={`url(#${glow})`} />
            {bulbs.map(([x, y], k) => (
              <circle key={k} className={k % 9 === 0 ? 'sky-tw' : undefined} cx={x} cy={y} r="5" fill={i === 1 ? MULTI[k % 4] : '#ffe6a0'} filter={`url(#${glow})`} style={{ animationDelay: `${(k % 5) * 0.6}s` }} />
            ))}
          </g>
        );
      })}

      {TREES.map(([x, s], i) => {
        const top = BASE - 130 * s, half = 30 * s;
        const dots = [];
        for (let r = 1; r <= 4; r += 1) {
          const y = top + r * 26 * s;
          const w = half * (r / 4.6);
          for (let k = -1; k <= 1; k += 1) dots.push([x + k * w, y + (k === 0 ? 4 : 0), MULTI[(r + k + i + 3) % 4]]);
        }
        return (
          <g key={`t${i}`}>
            <polygon points={`${x},${top} ${x - half},${BASE - 6} ${x + half},${BASE - 6}`} fill="#072612" />
            {dots.map(([dx, dy, c], k) => <circle key={k} cx={dx} cy={dy} r="2.6" fill={c} filter={`url(#${glow})`} />)}
            <circle cx={x} cy={top - 2} r="4" fill="#fdc736" filter={`url(#${glow})`} />
          </g>
        );
      })}

      <rect x="0" y={BASE - 8} width="1600" height="8" fill={`url(#gr${uid})`} />
    </svg>
  );
}
