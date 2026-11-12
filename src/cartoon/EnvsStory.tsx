import React from 'react';

/** Props and settings for story films in the Dodo look: desert rest stop, loaves, coins, the light being (a character shown as light, never as a figure) and the "thirds" board. */
const INK = '#141414';
const P: React.FC<{d: string; f?: string; w?: number; s?: string; o?: number}> = ({d, f = 'none', w = 6, s = INK, o = 1}) => <path d={d} fill={f} stroke={s} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round" opacity={o} />;
const E: React.FC<{x: number; y: number; rx: number; ry: number; f: string; w?: number; o?: number}> = ({x, y, rx, ry, f, w = 6, o = 1}) => <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={f} stroke={w ? INK : 'none'} strokeWidth={w} opacity={o} />;
const R: React.FC<{x: number; y: number; w: number; h: number; f: string; sw?: number; rx?: number}> = ({x, y, w, h, f, sw = 6, rx = 0}) => <rect x={x} y={y} width={w} height={h} rx={rx} fill={f} stroke={sw ? INK : 'none'} strokeWidth={sw} />;

export const Loaf: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <E x={0} y={0} rx={50} ry={21} f="#e6b866" w={5} />
    <P d="M-26 -6 Q-10 -12 4 -6 M-4 6 Q12 0 26 6 M-14 -1 L-6 3" w={3} s="#a8742e" />
  </g>
);
/** n loaves stacked on one spot (bottom first) */
export const LoafStack: React.FC<{x: number; y: number; n: number; s?: number}> = ({x, y, n, s = 1}) => (
  <g>{[...Array(Math.max(0, n))].map((_, i) => <Loaf key={i} x={x + (i % 2 ? 6 : -6) * s} y={y - i * 26 * s} s={s} />)}</g>
);
export const Coin: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}><E x={0} y={0} rx={20} ry={9} f="#f0c23c" w={4} /><E x={0} y={-2} rx={11} ry={4.5} f="none" w={0} /><P d="M-8 -2 Q0 -6 8 -2" w={2} s="#a87a12" /></g>
);

/** a low cushion whose top is at the seat height of a seated Dodo actor (feet at y=1555, scale 1.25 → seat y≈1495) */
export const Cushion: React.FC<{x: number; y?: number; w?: number}> = ({x, y = 1495, w = 190}) => (
  <g><R x={x - w / 2} y={y} w={w} h={64} f="#7a3b6a" sw={6} rx={22} /><R x={x - w / 2 + 10} y={y - 10} w={w - 20} h={30} f="#a64f8e" sw={5} rx={14} /></g>
);

export const DesertRest: React.FC<{t: number}> = ({t}) => (
  <g>
    <defs><linearGradient id="ds-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8ec9ea" /><stop offset="1" stopColor="#fbeccd" /></linearGradient></defs>
    <rect x={-800} y={-700} width={2680} height={1700} fill="url(#ds-sky)" />
    <circle cx={880} cy={230} r={90} fill="#fff1a8" stroke={INK} strokeWidth={6} />
    <E x={220 + 14 * Math.sin(t * .3)} y={260} rx={110} ry={38} f="#fffaf0" w={0} /><E x={640} y={380} rx={80} ry={28} f="#fffaf0" w={0} />
    <P d="M-400 1010 Q60 740 520 1000 Q900 780 1500 1010Z" f="#e8c88e" w={6} />
    <P d="M-300 1040 Q300 900 800 1040Z" f="#dcb87a" w={6} />
    <g transform="translate(180 1010)">
      <P d="M0 0 L-6 -250" w={14} s="#6b4a2c" /><P d="M0 0 L-6 -250" w={7} s="#8a6238" />
      <E x={-6} y={-290} rx={150} ry={64} f="#5f9a5a" w={6} /><E x={-70} y={-250} rx={90} ry={40} f="#4f8a4f" w={0} />
    </g>
    <R x={-800} y={1000} w={2680} h={1140} f="#e9cf98" sw={6} />
    <P d="M-800 1180 Q540 1130 1880 1180 M-800 1420 Q540 1370 1880 1420" w={4} s="#cfae72" />
    <E x={540} y={1640} rx={560} ry={120} f="#b3453b" w={6} /><E x={540} y={1640} rx={470} ry={92} f="#d9a441" w={0} /><E x={540} y={1640} rx={410} ry={78} f="#b3453b" w={4} />
  </g>
);

/** the light being: a radiant orb with a ring of rays, no body, no face; pulses with its own speech (speak 0..1) */
export const NurBeing: React.FC<{x: number; y: number; t: number; speak?: number; s?: number}> = ({x, y, t, speak = 0, s = 1}) => {
  const bob = 10 * Math.sin(t * 1.4), pulse = 1 + .1 * speak + .02 * Math.sin(t * 3);
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${s * pulse})`}>
      <defs>
        <radialGradient id="nur-glow"><stop offset="0" stopColor="#fffbe6" stopOpacity="1" /><stop offset=".35" stopColor="#ffe9a0" stopOpacity=".95" /><stop offset=".7" stopColor="#f6c85a" stopOpacity=".35" /><stop offset="1" stopColor="#f6c85a" stopOpacity="0" /></radialGradient>
      </defs>
      <circle r={230 + 28 * speak} fill="url(#nur-glow)" />
      <g transform={`rotate(${t * 14})`}>
        {[...Array(12)].map((_, i) => <P key={i} d={`M0 ${-120 - 10 * Math.sin(t * 2 + i)} L${i % 2 ? 12 : 8} ${-170 - 18 * speak} L-${i % 2 ? 12 : 8} ${-170 - 18 * speak}Z`} f="#ffeaa0" w={4} s="#c99a2e" o={.9} />).map((el, i) => <g key={i} transform={`rotate(${i * 30})`}>{el}</g>)}
      </g>
      <circle r={96} fill="#fffbe6" stroke="#c99a2e" strokeWidth={7} />
      <circle r={70} fill="#fff3bf" />
      <g transform={`rotate(${-t * 20})`}><P d="M0 -58 L9 -9 L58 0 L9 9 L0 58 L-9 9 L-58 0 L-9 -9Z" f="#fff8d0" w={4} s="#e0b13a" /></g>
      {speak > 0.05 && [0, 1].map((k) => <circle key={k} r={120 + ((t * 80 + k * 70) % 140)} fill="none" stroke="#f0c23c" strokeWidth={4} opacity={Math.max(0, .6 - ((t * 80 + k * 70) % 140) / 230)} />)}
    </g>
  );
};

const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const seg = (t: number, a: number, b: number) => Math.max(0, Math.min(1, (t - a) / Math.max(.001, b - a)));
const Wedges: React.FC<{x: number; y: number; n: number; w: number; color: string; eaten?: number; gift?: number; cols?: number}> = ({x, y, n, w, color, eaten = 0, gift = 0, cols = 9}) => (
  <g>{[...Array(n)].map((_, i) => {
    const c = i % cols, r = Math.floor(i / cols), xx = x + c * (w + 6), yy = y + r * (w + 6);
    const isGift = i >= n - gift && gift > 0, isEaten = !isGift && i < eaten * n / Math.max(1, n) && i < n - Math.max(0, gift);
    return <path key={i} d={`M${xx} ${yy + w} L${xx + w / 2} ${yy} L${xx + w} ${yy + w}Z`} fill={isGift ? '#f0c23c' : isEaten ? '#d9d2bf' : color} stroke={INK} strokeWidth={3} strokeLinejoin="round" />;
  })}</g>
);

/** the "thirds" board shown while the light explains the shares (times from the spoken words, seconds in the film) */
export const ThirdsBoard: React.FC<{t: number; cx?: number; cy?: number}> = ({t, cx = 540, cy = 560}) => {
  const A = '#4f86c6', B = '#e8a63a';
  const w = 56;
  const show = (a: number, b: number) => t >= a && t < b;
  const eight = show(84.2, 91.6), rows = t >= 91.6 && t < 111;
  return (
    <g transform={`translate(${cx - 470} ${cy - 250})`} opacity={t > 83.6 && t < 111 ? 1 : 0}>
      <R x={0} y={0} w={940} h={520} f="#fff7e2" sw={7} rx={26} />
      {eight && (
        <g>
          {[...Array(8)].map((_, i) => <g key={i} transform={`translate(${90 + (i % 4) * 210} ${100 + Math.floor(i / 4) * 200})`} opacity={seg(t, 84.4 + i * .05, 85.2) > 0 ? 1 : 0}>
            <E x={80} y={70} rx={86} ry={70} f="#e6b866" w={5} /><P d="M80 70 L80 0 M80 70 L141 105 M80 70 L19 105" w={4} s="#a8742e" />
            {t > 88.6 && <E x={80} y={70} rx={86} ry={70} f="none" w={0} />}
          </g>)}
          {t > 89.4 && [A, B, '#5aa469'].map((c, k) => <g key={k} transform={`translate(${70 + k * 290} 470)`}>{[...Array(8)].map((_, i) => <rect key={i} x={(i % 4) * 56} y={-Math.floor(i / 4) * 46} width={48} height={38} rx={6} fill={c} stroke={INK} strokeWidth={3} />)}</g>)}
        </g>
      )}
      {rows && (
        <g>
          <g opacity={seg(t, 91.7, 92.6)}><circle cx={56} cy={120} r={34} fill={A} stroke={INK} strokeWidth={5} /><Wedges x={120} y={90} n={9} w={w} color={A} eaten={t > 95.3 ? 8 : 0} gift={t > 97.8 ? 1 : 0} /></g>
          <g opacity={seg(t, 99.8, 100.6)}><circle cx={56} cy={320} r={34} fill={B} stroke={INK} strokeWidth={5} /><Wedges x={120} y={250} n={15} w={w} color={B} cols={8} eaten={t > 103.1 ? 8 : 0} gift={t > 104.5 ? 7 : 0} /></g>
          {t > 106.7 && <g>
            {[...Array(1)].map((_, i) => <Coin key={i} x={810} y={120} s={1.6} />)}
            {[...Array(7)].map((_, i) => <Coin key={i} x={730 + (i % 4) * 64} y={290 + Math.floor(i / 4) * 56} s={1.5} />)}
          </g>}
        </g>
      )}
    </g>
  );
};
export {lerp};
