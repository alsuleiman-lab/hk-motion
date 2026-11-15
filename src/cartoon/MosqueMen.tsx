import React from 'react';
import {Pa, El, INK} from './EnvsOffice';
import {smooth} from './FilmKit';

/** Worshippers drawn as flat, thick-ink figures in the Abu Khatt look: a side view that performs the real prayer cycle
 *  (standing, bowing, prostrating, sitting) by blending joint positions, and a front view standing with folded arms.
 *  Silhouette trick: every body part is drawn once as a black outline stroke, then once as a coloured stroke, so the figure reads as one soft shape. */
type V = {x: number; y: number};
type Pose = {hip: V; knee: V; foot: V; sh: V; head: V; el: V; wr: V};
const P = (hx: number, hy: number, kx: number, ky: number, fx: number, fy: number, sx: number, sy: number, dx: number, dy: number, ex: number, ey: number, wx: number, wy: number): Pose => ({
  hip: {x: hx, y: hy}, knee: {x: kx, y: ky}, foot: {x: fx, y: fy}, sh: {x: sx, y: sy}, head: {x: dx, y: dy}, el: {x: ex, y: ey}, wr: {x: wx, y: wy},
});
export const POSES: Record<'stand' | 'ruku' | 'sujood' | 'sit' | 'takbir', Pose> = {
  stand: P(-2, -165, 0, -85, 8, -6, 0, -262, 8, -318, -8, -205, 30, -222),
  takbir: P(-2, -165, 0, -85, 8, -6, 0, -262, 8, -318, 26, -262, 38, -332),
  ruku: P(-30, -168, -8, -88, 6, -6, 66, -200, 138, -208, 50, -145, 20, -112),
  sujood: P(-26, -140, 36, -28, -50, -14, 72, -104, 138, -44, 108, -54, 150, -12),
  sit: P(-24, -72, 60, -30, -32, -16, -12, -176, -4, -230, 8, -126, 46, -84),
};
const mix = (a: V, b: V, k: number): V => ({x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k});
const blend = (a: Pose, b: Pose, k: number): Pose => ({hip: mix(a.hip, b.hip, k), knee: mix(a.knee, b.knee, k), foot: mix(a.foot, b.foot, k), sh: mix(a.sh, b.sh, k), head: mix(a.head, b.head, k), el: mix(a.el, b.el, k), wr: mix(a.wr, b.wr, k)});

/** prayer cycle (16 s): qiyam, bow, rise, prostrate, sit, prostrate, rise */
const CYCLE: [number, keyof typeof POSES][] = [[0, 'stand'], [3, 'stand'], [4, 'ruku'], [5.6, 'ruku'], [6.6, 'stand'], [7.6, 'sujood'], [9.6, 'sujood'], [10.6, 'sit'], [12, 'sit'], [13, 'sujood'], [14.6, 'sujood'], [16, 'stand']];
export const prayPose = (t: number, off = 0): Pose => {
  const u = (((t + off) % 16) + 16) % 16;
  let i = 0; while (i < CYCLE.length - 2 && CYCLE[i + 1][0] <= u) i++;
  const [a, pa] = CYCLE[i], [b, pb] = CYCLE[i + 1], k = smooth((u - a) / Math.max(.001, b - a));
  return blend(POSES[pa], POSES[pb], pa === pb ? 0 : k);
};
export const phaseName = (t: number, off = 0): 'stand' | 'ruku' | 'sujood' | 'sit' => {
  const u = (((t + off) % 16) + 16) % 16; return u < 3.6 ? 'stand' : u < 6 ? 'ruku' : u < 7.1 ? 'stand' : u < 10.1 ? 'sujood' : u < 12.5 ? 'sit' : u < 15 ? 'sujood' : 'stand';
};

const SKIN = '#e6b98f';
type Look = {robe?: string; skin?: string; hair?: 'cap' | 'dark' | 'bald' | 'grey'; beard?: string | false; jacket?: string; trousers?: string; collar?: boolean};
const Seg: React.FC<{a: V; b: V; w: number; c: string; out?: boolean}> = ({a, b, w, c, out}) => <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={out ? INK : c} strokeWidth={out ? w + 10 : w} strokeLinecap="round" />;

/** a man in profile facing right (flip to face left) */
export const MenSide: React.FC<{x: number; y: number; s?: number; flip?: boolean; pose: Pose; look?: Look; nose?: boolean; frown?: boolean}> = ({x, y, s = 1, flip, pose: p, look = {}, nose, frown}) => {
  const robe = look.jacket ?? look.robe ?? '#f6f4ee', leg = look.trousers ?? look.robe ?? '#f6f4ee', skin = look.skin ?? SKIN, lw = look.trousers ? 40 : 64, tw = look.jacket ? 74 : 84;
  const hand: V = nose ? {x: p.head.x + 36, y: p.head.y + 10} : p.wr;
  const elb: V = nose ? {x: p.sh.x + 46, y: p.sh.y + 4} : p.el;
  const parts: {a: V; b: V; w: number; c: string}[] = [
    {a: p.hip, b: p.knee, w: lw, c: leg}, {a: p.knee, b: p.foot, w: lw - 6, c: leg}, {a: p.hip, b: p.sh, w: tw, c: robe},
  ];
  const hairC = look.hair === 'grey' ? '#cfcfcf' : '#2b2118';
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      {parts.map((q, i) => <Seg key={'o' + i} {...q} out />)}
      {parts.map((q, i) => <Seg key={'f' + i} {...q} />)}
      <El x={p.foot.x + 18} y={p.foot.y - 2} rx={26} ry={11} f={skin} w={6} />
      {look.jacket && look.collar !== false && <Pa d={`M${p.sh.x - 16} ${p.sh.y - 18} L${p.sh.x + 4} ${p.sh.y + 18} L${p.sh.x + 22} ${p.sh.y - 18}Z`} f="#f2c14e" w={4} />}
      <Seg a={p.sh} b={elb} w={26} c={look.jacket ?? '#f6f4ee'} out /><Seg a={elb} b={hand} w={24} c={look.jacket ?? '#f6f4ee'} out />
      <Seg a={p.sh} b={elb} w={26} c={look.jacket ?? '#f6f4ee'} /><Seg a={elb} b={hand} w={24} c={look.jacket ?? '#f6f4ee'} />
      <El x={hand.x} y={hand.y} rx={13} ry={13} f={skin} w={5} />
      <Seg a={p.sh} b={{x: p.head.x - 2, y: p.head.y + 28}} w={22} c={skin} out /><Seg a={p.sh} b={{x: p.head.x - 2, y: p.head.y + 28}} w={22} c={skin} />
      <g transform={`translate(${p.head.x} ${p.head.y})`}>
        <El x={0} y={0} rx={38} ry={40} f={skin} w={6} />
        {look.hair === 'cap' && <Pa d="M-38 -6 Q-40 -50 0 -52 Q40 -50 38 -6 Q0 -24 -38 -6Z" f="#fffdf5" w={5} />}
        {(look.hair === 'dark' || look.hair === 'grey') && <Pa d="M-38 -6 Q-42 -54 0 -54 Q40 -50 38 -10 Q10 -34 -38 -6Z" f={hairC} w={5} />}
        {look.beard !== false && look.beard && <Pa d="M-22 14 Q-16 52 12 48 Q38 42 40 6 Q22 24 -8 18Z" f={look.beard} w={5} />}
        <El x={38} y={4} rx={8} ry={8} f={skin} w={5} />
        <El x={18} y={-6} rx={4} ry={frown ? 3 : 5} f={INK} w={0} /><Pa d={frown ? 'M8 -20 L28 -13' : 'M8 -19 Q18 -24 28 -19'} w={4} />
      </g>
    </g>
  );
};

/** a man seen from the front, standing with folded arms */
export const MenFront: React.FC<{x: number; y: number; s?: number; look?: Look; mood?: 'neutral' | 'surprised' | 'sniff' | 'squeezed'; sway?: number; t?: number}> = ({x, y, s = 1, look = {}, mood = 'neutral', sway = 0, t = 0}) => {
  const robe = look.robe ?? '#f6f4ee', skin = look.skin ?? SKIN, a = sway * Math.sin(t * 1.4);
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${a})`}>
      <Pa d="M-48 -250 Q0 -268 48 -250 L70 -8 Q0 8 -70 -8Z" f={robe} w={7} />
      <Pa d="M0 -246 L0 -10" w={3} s="#c9c4b4" />
      <El x={-26} y={0} rx={20} ry={9} f={skin} w={6} /><El x={26} y={0} rx={20} ry={9} f={skin} w={6} />
      <Pa d="M-46 -246 Q-62 -200 -20 -192" w={26} s={INK} /><Pa d="M46 -246 Q62 -200 14 -196" w={26} s={INK} />
      <Pa d="M-46 -246 Q-62 -200 -20 -192" w={20} s={robe} /><Pa d="M46 -246 Q62 -200 14 -196" w={20} s={robe} />
      <El x={-14} y={-192} rx={13} ry={13} f={skin} w={5} /><El x={12} y={-196} rx={13} ry={13} f={skin} w={5} />
      <El x={0} y={-314} rx={42} ry={44} f={skin} w={6} />
      {look.hair === 'cap' && <Pa d="M-42 -322 Q-44 -366 0 -368 Q44 -366 42 -322 Q0 -340 -42 -322Z" f="#fffdf5" w={5} />}
      {(look.hair === 'dark' || look.hair === 'grey') && <Pa d={`M-42 -322 Q-46 -372 0 -372 Q44 -368 42 -322 Q10 -350 -42 -322Z`} f={look.hair === 'grey' ? '#cfcfcf' : '#2b2118'} w={5} />}
      {look.beard && <Pa d="M-34 -306 Q-30 -262 0 -258 Q30 -262 34 -306 Q18 -286 0 -290 Q-18 -286 -34 -306Z" f={look.beard} w={5} />}
      <El x={-16} y={-320} rx={4} ry={mood === 'surprised' ? 7 : 5} f={INK} w={0} /><El x={16} y={-320} rx={4} ry={mood === 'surprised' ? 7 : 5} f={INK} w={0} />
      <Pa d={mood === 'sniff' || mood === 'squeezed' ? 'M-24 -334 L-8 -328 M8 -328 L24 -334' : 'M-24 -332 Q-16 -336 -8 -332 M8 -332 Q16 -336 24 -332'} w={4} />
      {mood === 'surprised' ? <El x={0} y={-296} rx={6} ry={8} f={INK} w={0} /> : <Pa d={mood === 'sniff' || mood === 'squeezed' ? 'M-10 -296 Q0 -302 10 -296' : 'M-9 -298 Q0 -294 9 -298'} w={4} />}
    </g>
  );
};

/** small smell puffs rising from a source (they shrink away instead of fading) */
export const Puffs: React.FC<{x: number; y: number; t: number; s?: number; n?: number; dx?: number}> = ({x, y, t, s = 1, n = 4, dx = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[...Array(n)].map((_, i) => {
      const ph = ((t * .55 + i / n) % 1), r = 26 * Math.sin(Math.PI * ph) ** .6 + 4, px = dx * ph + 22 * Math.sin(t * 2.4 + i * 2), py = -ph * 150;
      return <g key={i} transform={`translate(${px} ${py})`}><El x={0} y={0} rx={r} ry={r * .85} f="#a6e07a" w={5} /><El x={r * .55} y={-r * .3} rx={r * .5} ry={r * .45} f="#a6e07a" w={0} /></g>;
    })}
  </g>
);
