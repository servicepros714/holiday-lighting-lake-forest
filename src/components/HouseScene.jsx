import { useId } from 'react';

/*
 * Illustrated day / night house scenes.
 * PLACEHOLDER ART ONLY — the gallery swaps these for real install photos as soon
 * as image paths are added in src/components/Gallery.jsx (see TODO there).
 */

const MULTI = ['#ff3b30', '#fdc736', '#22c55e', '#3b82f6', '#fdc736'];
const WARM = '#ffe6a0';

export const HOUSES = {
  ranch: {
    walls: [{ x: 150, y: 262, w: 500, h: 158, c: '#c9c2b2' }],
    roofs: [{ pts: '118,264 400,168 682,264', c: '#4a4f57' }],
    windows: [[180, 300, 90, 62], [366, 300, 60, 62]],
    door: [300, 328, 52, 92],
    garage: [440, 318, 180, 102],
    lines: [
      [[118, 264], [400, 168], [682, 264]],
      [[118, 264], [682, 264]],
    ],
    trees: [70, 730],
  },
  two: {
    walls: [
      { x: 170, y: 282, w: 460, h: 138, c: '#cfc6b4' },
      { x: 230, y: 182, w: 340, h: 102, c: '#d7cfbd' },
    ],
    roofs: [
      { pts: '150,284 236,240 564,240 650,284', c: '#454b52' },
      { pts: '208,184 400,98 592,184', c: '#3e444b' },
    ],
    windows: [[262, 206, 70, 56], [468, 206, 70, 56], [200, 318, 80, 60]],
    door: [372, 326, 56, 94],
    garage: [470, 322, 140, 98],
    lines: [
      [[208, 184], [400, 98], [592, 184]],
      [[208, 184], [592, 184]],
      [[150, 284], [236, 240]],
      [[564, 240], [650, 284]],
      [[150, 284], [650, 284]],
    ],
    trees: [78, 722],
  },
  craft: {
    walls: [
      { x: 130, y: 252, w: 400, h: 168, c: '#bfb6a3' },
      { x: 520, y: 272, w: 170, h: 148, c: '#c8bfac' },
    ],
    roofs: [
      { pts: '104,254 330,150 556,254', c: '#3f454c' },
      { pts: '500,274 605,212 710,274', c: '#474d55' },
    ],
    windows: [[168, 296, 76, 60], [400, 296, 76, 60], [568, 310, 76, 56]],
    door: [286, 322, 56, 98],
    garage: null,
    lines: [
      [[104, 254], [330, 150], [556, 254]],
      [[104, 254], [520, 254]],
      [[500, 274], [605, 212], [710, 274]],
      [[520, 274], [710, 274]],
    ],
    trees: [60, 752],
  },
};

export function along(points, gap) {
  const out = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const len = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(1, Math.round(len / gap));
    for (let k = 0; k <= n; k += 1) {
      if (i > 0 && k === 0) continue;
      out.push([x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n]);
    }
  }
  return out;
}

function Tree({ x, night, glowId, seed = 0 }) {
  const base = 420, top = 236, half = 46;
  const wraps = [];
  if (night) {
    for (let r = 0; r < 6; r += 1) {
      const y = top + 26 + r * 27;
      const w = half * ((y - top) / (base - top));
      for (let k = 0; k <= 5; k += 1) {
        wraps.push({ x: x - w + (2 * w * k) / 5, y: y + (k % 2 ? 6 : -2), c: MULTI[(k + r + seed) % MULTI.length] });
      }
    }
  }
  return (
    <g>
      <rect x={x - 6} y={base - 18} width="12" height="22" fill="#4b3621" />
      <polygon points={`${x},${top} ${x - half},${base - 10} ${x + half},${base - 10}`} fill={night ? '#0b3517' : '#2f7a3b'} />
      {wraps.map((b, i) => <circle key={i} cx={b.x} cy={b.y} r="3.6" fill={b.c} filter={`url(#${glowId})`} />)}
      {night && <circle cx={x} cy={top - 4} r="6" fill="#fdc736" filter={`url(#${glowId})`} />}
    </g>
  );
}

export default function HouseScene({ variant = 'two', mode = 'night', className = '', slice = false, title }) {
  const uid = useId().replace(/:/g, '');
  const glowId = `glow${uid}`, skyId = `sky${uid}`;
  const h = HOUSES[variant] || HOUSES.two;
  const night = mode === 'night';
  const roofBulbs = night ? h.lines.flatMap((l) => along(l, 17)) : [];

  return (
    <svg
      className={className}
      viewBox="0 0 800 500"
      preserveAspectRatio={slice ? 'xMidYMax slice' : 'xMidYMid meet'}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : 'true'}
    >
      <defs>
        <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
          {night ? (
            <>
              <stop offset="0" stopColor="#020c07" />
              <stop offset=".6" stopColor="#06251a" />
              <stop offset="1" stopColor="#0d3a2a" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#8ec9f0" />
              <stop offset="1" stopColor="#dff1fb" />
            </>
          )}
        </linearGradient>
        <filter id={glowId} x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <rect width="800" height="500" fill={`url(#${skyId})`} />
      {night
        ? [[60, 40], [140, 90], [250, 30], [330, 70], [470, 26], [560, 64], [660, 34], [740, 92], [700, 140], [90, 150]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 3 ? 1.2 : 1.8} fill="#fdee85" opacity=".75" />
        ))
        : <circle cx="690" cy="80" r="34" fill="#ffe98a" opacity=".9" />}
      {night && <circle cx="120" cy="70" r="20" fill="#f4efd6" opacity=".85" />}

      {/* ground */}
      <rect y="418" width="800" height="82" fill={night ? '#062014' : '#7cb35d'} />
      <path d="M360 500 L392 420 L408 420 L440 500 Z" fill={night ? '#1e2b24' : '#cfc8b8'} />
      <rect x="440" y="420" width="190" height="80" fill={night ? '#17211c' : '#b9b3a6'} opacity={h.garage ? 1 : 0} />

      {/* house */}
      {h.walls.map((w, i) => (
        <rect key={i} x={w.x} y={w.y} width={w.w} height={w.h} fill={night ? '#1d2a2a' : w.c} />
      ))}
      {h.roofs.map((r, i) => <polygon key={i} points={r.pts} fill={night ? '#0f1716' : r.c} />)}
      {h.windows.map(([x, y, w, hh], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={hh} rx="3" fill={night ? '#ffd98a' : '#9fc4d8'} opacity={night ? 0.95 : 1} />
          <path d={`M${x + w / 2} ${y} V${y + hh} M${x} ${y + hh / 2} H${x + w}`} stroke={night ? '#a9762a' : '#f4f4f4'} strokeWidth="3" />
        </g>
      ))}
      <rect x={h.door[0]} y={h.door[1]} width={h.door[2]} height={h.door[3]} rx="4" fill={night ? '#2a1a12' : '#6b3b25'} />
      {night && (
        <g filter={`url(#${glowId})`}>
          <circle cx={h.door[0] + h.door[2] / 2} cy={h.door[1] + 30} r="15" fill="none" stroke="#1d8a3d" strokeWidth="7" />
          <circle cx={h.door[0] + h.door[2] / 2} cy={h.door[1] + 16} r="3.5" fill="#ff3b30" />
        </g>
      )}
      {h.garage && (
        <g>
          <rect x={h.garage[0]} y={h.garage[1]} width={h.garage[2]} height={h.garage[3]} fill={night ? '#1a2322' : '#e9e5dc'} />
          {[1, 2, 3].map((k) => (
            <line key={k} x1={h.garage[0]} x2={h.garage[0] + h.garage[2]} y1={h.garage[1] + (h.garage[3] * k) / 4} y2={h.garage[1] + (h.garage[3] * k) / 4} stroke={night ? '#2b3634' : '#cfc9bd'} strokeWidth="3" />
          ))}
        </g>
      )}

      {/* shrubs */}
      {[[200, 418], [262, 420], [480 - (h.garage ? 0 : 60), 420]].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx="34" ry="18" fill={night ? '#0a3015' : '#3c8a43'} />
      ))}
      {night && [[200, 418], [262, 420], [480 - (h.garage ? 0 : 60), 420]].flatMap(([x, y], i) =>
        [-22, -8, 6, 20].map((dx, k) => <circle key={`${i}-${k}`} cx={x + dx} cy={y - 6 + (k % 2) * 8} r="2.6" fill={WARM} filter={`url(#${glowId})`} />))}

      <Tree x={h.trees[0]} night={night} glowId={glowId} />
      <Tree x={h.trees[1]} night={night} glowId={glowId} seed={2} />

      {/* roofline lights */}
      {roofBulbs.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.4" fill={WARM} filter={`url(#${glowId})`} />)}

      {/* pathway stakes */}
      {night && [[370, 440], [430, 440], [358, 468], [442, 468], [346, 494], [454, 494]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="#ffe6a0" filter={`url(#${glowId})`} />
      ))}
    </svg>
  );
}
