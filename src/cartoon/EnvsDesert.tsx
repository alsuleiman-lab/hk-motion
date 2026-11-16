import React from 'react';
import {Pa, Re, El, INK} from './EnvsOffice';

/** Desert settings for story films (flat colour, thick ink): sky by time of day, dunes, rocks, tent, camp fire, camel, pebbles. World = 1080×1920 screen, extended sideways. Feet line ≈ y 1600. */
export type Tod = 'day' | 'dusk' | 'night' | 'dawn';
const SKY: Record<Tod, [string, string]> = {day: ['#8ec9ea', '#f7eed6'], dusk: ['#6a4a8a', '#f2a65a'], night: ['#0f1b3a', '#35508a'], dawn: ['#e8a8a0', '#fbe3b0']};
const SAND: Record<Tod, string> = {day: '#e9c98d', dusk: '#c9955a', night: '#6b6a7a', dawn: '#e2b789'};

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mixc = (c1: string, c2: string, k: number) => '#' + hex(c1).map((v, i) => Math.round(v + (hex(c2)[i] - v) * k).toString(16).padStart(2, '0')).join('');
const ORDER: Tod[] = ['night', 'dawn', 'day', 'dusk'];
const GROUND: Record<Tod, string> = {night: '#4a4a5e', dawn: '#d9ad7a', day: '#d4b078', dusk: '#a9764a'};
const tile = (x0: number, w: number, y: number, amp: number, fill: string, sw = 6) => (
  <Pa d={`M${x0} ${y} Q${x0 + w * .25} ${y - amp} ${x0 + w * .5} ${y} Q${x0 + w * .75} ${y + amp * .35} ${x0 + w} ${y} L${x0 + w} ${y + 700} L${x0} ${y + 700}Z`} f={fill} w={sw} />
);

/** desert backdrop. `tod` fixed time of day, or `sky` 0..3 = night → dawn → day → dusk (continuous colours, stars fade out, sun rises); `scroll` = world px travelled: every layer slides at its own depth, the sand marks move 1:1 so walking feet stay planted */
export const Desert: React.FC<{t: number; tod?: Tod; sky?: number; scroll?: number}> = ({t, tod = 'day', sky, scroll = 0}) => {
  const sv = sky ?? ORDER.indexOf(tod), i0 = Math.min(2, Math.max(0, Math.floor(sv))), k = Math.min(1, sv - i0), A = ORDER[i0], B = ORDER[Math.min(3, i0 + 1)];
  const top = mixc(SKY[A][0], SKY[B][0], k), bot = mixc(SKY[A][1], SKY[B][1], k), sand = mixc(SAND[A], SAND[B], k), far = mixc(GROUND[A], GROUND[B], k);
  const nightness = Math.max(0, Math.min(1, 1.2 - sv * 1.4)), id = 'ds-sky-' + Math.round(sv * 20);
  const W = 1500, off = (f: number) => -((scroll * f) % W);
  return (
    <g>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={top} /><stop offset="1" stopColor={bot} /></linearGradient></defs>
      <Re x={-1400} y={-800} w={3880} h={2300} f={`url(#${id})`} sw={0} />
      {nightness > .02 && <>{[...Array(30)].map((_, i) => <El key={i} x={-900 + (i * 233) % 2800} y={-100 + (i * 101) % 900} rx={3.5 * nightness} ry={3.5 * nightness} f="#fff6d6" w={0} />)}<El x={820} y={300 + 500 * (1 - nightness)} rx={74} ry={74} f="#f6e7a8" w={0} /><El x={852} y={282 + 500 * (1 - nightness)} rx={64} ry={64} f={top} w={0} /></>}
      {sv >= 0.8 && sv <= 3 && <El x={420 + 60 * Math.max(0, sv - 1)} y={1000 - 700 * Math.min(1, Math.max(0, (sv - 0.8) / 1.4))} rx={96} ry={96} f={sv > 2.4 ? '#ffd27a' : '#ffe27a'} w={0} />}
      {[-2, -1, 0, 1, 2].map((n) => <g key={'f' + n}>{tile(-1400 + n * W + off(.12), W, 1060, 150, far)}</g>)}
      {[-2, -1, 0, 1, 2].map((n) => <g key={'m' + n}>{tile(-1400 + n * W + off(.45), W, 1240, 120, sand)}</g>)}
      <Re x={-1400} y={1390} w={3880} h={1400} f={sand} sw={6} />
      {[...Array(16)].map((_, i) => { const px = ((-1400 + i * 260 - scroll) % 3880 + 3880) % 3880 - 1400; return <Pa key={i} d={`M${px} ${1450 + (i % 3) * 70} q40 -16 80 0`} w={4} s={mixc('#c7a367', '#55556a', nightness)} />; })}
    </g>
  );
};

export const Rock: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}><Pa d="M-120 0 L-90 -90 L-30 -140 L50 -120 L120 -50 L130 0Z" f="#8a8478" w={7} /><Pa d="M-30 -140 L-10 -60 L50 -120 M-10 -60 L20 0" w={4} s="#6a655c" /></g>
);

export const Tent: React.FC<{x: number; y: number; s?: number; open?: boolean}> = ({x, y, s = 1, open = true}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Pa d="M-260 0 L-220 -200 L0 -260 L220 -200 L260 0Z" f="#4a3322" w={8} />
    <Pa d="M-260 0 L-220 -200 L0 -260" f="#5b4030" w={0} />
    {open && <Pa d="M-70 0 L-50 -150 L50 -150 L70 0Z" f="#1b120c" w={6} />}
    <Pa d="M-220 -200 L-30 -150 M220 -200 L30 -150" w={5} s="#2b1d12" />
    <Pa d="M-260 0 L-300 40 M260 0 L300 40 M0 -260 L0 -310" w={6} s="#6b4a2a" />
  </g>
);

export const Fire: React.FC<{x: number; y: number; t: number; s?: number}> = ({x, y, t, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Pa d="M-60 6 L60 -6 M-50 -8 L55 12" w={14} s="#5b3a29" />
    <Pa d={`M-40 0 Q-50 -60 ${-10 + 6 * Math.sin(t * 9)} -110 Q${-4 + 5 * Math.sin(t * 7)} -60 20 -150 Q50 -80 42 0Z`} f="#f28a30" w={6} />
    <Pa d={`M-20 0 Q-26 -40 ${4 + 4 * Math.sin(t * 8)} -78 Q26 -30 22 0Z`} f="#ffd84a" w={0} />
    {[0, 1, 2].map((i) => <El key={i} x={-20 + i * 24 + 10 * Math.sin(t * 3 + i)} y={-140 - ((t * 60 + i * 40) % 120)} rx={3} ry={3} f="#ffd84a" w={0} />)}
  </g>
);

export const Camel: React.FC<{x: number; y: number; s?: number; flip?: boolean; t: number; walk?: boolean}> = ({x, y, s = 1, flip, t, walk}) => {
  const w = walk ? Math.sin(t * 5) : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <Pa d={`M-90 -150 L${-96 + 14 * w} 0 M-60 -150 L${-56 - 14 * w} 0 M60 -150 L${56 + 14 * w} 0 M92 -150 L${98 - 14 * w} 0`} w={14} s={INK} />
      <Pa d={`M-90 -150 L${-96 + 14 * w} 0 M-60 -150 L${-56 - 14 * w} 0 M60 -150 L${56 + 14 * w} 0 M92 -150 L${98 - 14 * w} 0`} w={8} s="#c9955a" />
      <El x={0} y={-190} rx={125} ry={58} f="#c9955a" w={7} />
      <El x={-30} y={-262} rx={34} ry={40} f="#c9955a" w={7} />
      <Pa d="M108 -214 Q150 -270 168 -330 Q190 -352 214 -334 Q226 -310 200 -300 Q176 -296 160 -250 Q136 -190 124 -170Z" f="#c9955a" w={7} />
      <El x={190} y={-322} rx={5} ry={5} f={INK} w={0} /><Pa d="M214 -312 Q222 -306 216 -300" w={4} />
      <Pa d="M-124 -200 Q-150 -190 -150 -160" w={8} s="#c9955a" />
    </g>
  );
};

/** a pebble thrown in an arc from (x0,y0) to (x1,y1) between a and b (seconds) */
export const Pebble: React.FC<{t: number; a: number; b: number; x0: number; y0: number; x1: number; y1: number}> = ({t, a, b, x0, y0, x1, y1}) => {
  if (t < a || t > b) return null;
  const k = (t - a) / (b - a);
  return <El x={x0 + (x1 - x0) * k} y={y0 + (y1 - y0) * k - 160 * Math.sin(Math.PI * k)} rx={9} ry={9} f="#8a8478" w={4} />;
};
