import React from 'react';
import {Pa, Re, El} from './EnvsOffice';
import type {CapWord} from './Overlays';
import {staticFile} from 'remotion';

/** Mosque settings and effects for the Abu Khatt «آداب المسجد» film (flat colour, thick ink). World = 1080×1920 screen, extended sideways. */
const CARPET = '#1f5a43', GOLD = '#d8b04a', WHITE = '#f6f4ee';

/** green smell cloud: wobbling blob + swirl strokes, drawn around/above something that stinks */
export const Stink: React.FC<{x: number; y: number; s?: number; t: number; seed?: number; ring?: boolean}> = ({x, y, s = 1, t, seed = 0, ring}) => {
  const n = 16, pts = [...Array(n)].map((_, i) => {
    const a = (i / n) * Math.PI * 2, r = 100 * (1 + .2 * Math.sin(t * 3.2 + i * 1.9 + seed) + .1 * Math.sin(t * 5.1 + i * 3 + seed));
    return [Math.cos(a) * r * 1.15, Math.sin(a) * r * .85] as const;
  });
  const d = pts.map((p, i) => { const q = pts[(i + 1) % n]; return `${i === 0 ? 'M' : 'L'}${((p[0] + q[0]) / 2).toFixed(1)} ${((p[1] + q[1]) / 2).toFixed(1)}`; }).join(' ') + 'Z';
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {ring ? <Pa d={d} f="none" w={20} s="#4cc13a" o={.8} /> : <Pa d={d} f="#a6e07a" w={12} s="#4cc13a" o={.85} />}
      {[0, 1, 2].map((i) => <Pa key={i} d={`M${-70 + i * 60} ${40 - i * 20} Q${-40 + i * 60 + 20 * Math.sin(t * 4 + i)} ${-10 - i * 30} ${-70 + i * 60 + 30} ${-70 - i * 10}`} w={9} s="#3fae3a" />)}
    </g>
  );
};

/** the mosque hall seen from the front: white wall, door, lamps, shoe rack, water cooler, ceiling fan, patterned carpet. Feet line ≈ y 1600. */
export const MosqueHall: React.FC<{t: number; fan?: boolean}> = ({t, fan = true}) => (
  <g>
    <defs>
      <linearGradient id="mh-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f2efe6" /><stop offset="1" stopColor="#e2ddd0" /></linearGradient>
      <pattern id="mh-dia" width="70" height="70" patternUnits="userSpaceOnUse"><path d="M35 8 L50 35 L35 62 L20 35Z" fill="#c9a24a" opacity=".7" /></pattern>
    </defs>
    <Re x={-900} y={-800} w={2880} h={2200} f="url(#mh-wall)" sw={0} />
    <Re x={-900} y={1280} w={2880} h={60} f="#d4cdbb" sw={6} />
    {/* door */}
    <Re x={30} y={560} w={260} h={720} f="#6b3f26" sw={8} /><Re x={60} y={600} w={200} h={420} f="#4a6b45" sw={6} /><El x={246} y={960} rx={10} ry={10} f={GOLD} w={4} />
    {/* wall lamps */}
    {[380, 700, 1010].map((x) => <g key={x}><Re x={x - 30} y={620} w={60} h={80} f="#fdf3d2" sw={6} rx={8} /><Pa d={`M${x - 30} 700 L${x - 40} 730 L${x + 40} 730 L${x + 30} 700`} f="#b88a5a" w={5} /></g>)}
    {/* shoe rack */}
    <Re x={760} y={1020} w={240} h={262} f="#7a4f37" sw={7} />{[1070, 1140, 1210].map((y) => <Pa key={y} d={`M760 ${y} L1000 ${y}`} w={6} />)}
    {[[790, 1118], [850, 1118], [800, 1188], [900, 1188]].map(([x, y], i) => <Re key={i} x={x} y={y - 16} w={46} h={16} f="#1c1c1c" sw={4} rx={6} />)}
    {/* water cooler */}
    <Re x={1090} y={1100} w={110} h={180} f="#fffdf5" sw={7} rx={8} /><Pa d="M1100 1100 Q1100 960 1145 950 Q1190 960 1190 1100Z" f="#9cc5ff" w={6} /><Re x={1128} y={1150} w={34} h={22} f="#2f55c7" sw={4} />
    {/* fan */}
    {fan && <g transform={`translate(540 40)`}><Pa d="M0 -60 L0 20" w={8} />{[0, 1, 2].map((i) => <g key={i} transform={`rotate(${t * 380 + i * 120})`}><Pa d="M0 0 Q60 -14 150 -6 Q60 14 0 8Z" f="#e9e4d4" w={6} /></g>)}<El x={0} y={20} rx={26} ry={16} f="#b88a5a" w={6} /></g>}
    {/* carpet */}
    <Re x={-900} y={1340} w={2880} h={1100} f={CARPET} sw={8} />
    <Re x={-900} y={1340} w={2880} h={1100} f="url(#mh-dia)" sw={0} />
    {[1420, 1580, 1760].map((y) => <Pa key={y} d={`M-900 ${y} L1980 ${y}`} w={10} s={GOLD} />)}
  </g>
);

/** a plain row-of-backs view from ground level: tall white robes + feet; optional smell */
export const RobesRear: React.FC<{t: number; stink?: boolean; shuffle?: number}> = ({t, stink, shuffle = 0}) => (
  <g>
    <Re x={-900} y={-800} w={2880} h={2400} f="#e9e5d9" sw={0} />
    <Re x={-900} y={1000} w={2880} h={1000} f={CARPET} sw={8} /><Re x={-900} y={1000} w={2880} h={1000} f="url(#mh-dia)" sw={0} />
    <Pa d="M-900 1330 L1980 1330 M-900 1600 L1980 1600" w={10} s={GOLD} />
    {[170, 520, 880].map((x, i) => (
      <g key={x} transform={`translate(${x + (i === 1 ? shuffle : 0)} 0)`}>
        <Pa d="M-210 -200 L-150 1520 L150 1520 L210 -200Z" f={WHITE} w={7} /><Pa d="M-60 200 L-40 1500 M40 200 L30 1500 M0 600 L0 1500" w={4} s="#c9c4b4" />
        <El x={-60} y={1540} rx={48} ry={24} f={i === 1 ? "#cfd6dd" : "#e0b890"} w={6} /><El x={64} y={1540} rx={48} ry={24} f={i === 1 ? "#cfd6dd" : "#e0b890"} w={6} />{i === 1 && <Pa d="M-100 1530 L-20 1530 M-104 1546 L-16 1546 M20 1530 L108 1530 M16 1546 L112 1546" w={7} s="#d0382d" />}
        <Pa d="M-102 1560 Q-60 1580 -18 1560 M16 1560 Q64 1580 112 1560" w={6} />
      </g>
    ))}
    {stink && <Stink x={540 + shuffle} y={1380} s={1.7} t={t} seed={2} />}
  </g>
);

const topMan = (kind: 'back' | 'nar' | 'takbir', x: number, y: number, t: number, i: number) => (
  <g key={i} transform={`translate(${x} ${y})`}>
    {kind === 'takbir' ? <>
      <Pa d="M-120 40 Q-120 -60 0 -70 Q120 -60 120 40 Q120 120 0 130 Q-120 120 -120 40Z" f="#3f6fd1" w={7} />
      <El x={0} y={-8} rx={44} ry={44} f="#e6b98f" w={7} /><Pa d="M-30 -38 Q0 -62 30 -38" w={4} /><El x={0} y={-8} rx={22} ry={22} f="#e6b98f" w={0} />
      {[-1, 1].map((sd) => <g key={sd}><Pa d={`M${sd * 110} 20 L${sd * 150} -90`} w={26} s="#3f6fd1" /><El x={sd * 158} y={-118} rx={26} ry={36} f="#fffdf5" w={6} /></g>)}
    </> : <>
      <Pa d="M-76 -96 Q-76 -150 0 -154 Q76 -150 76 -96 L84 84 Q84 130 0 134 Q-84 130 -84 84Z" f={kind === 'nar' ? '#3f6fd1' : WHITE} w={7} />
      {kind === 'nar' ? <Pa d="M-24 -150 L0 -100 L24 -150" f={GOLD} w={5} /> : <Pa d="M0 -140 L0 120 M-40 -60 Q0 -30 40 -60" w={4} s="#c9c4b4" />}
      <El x={0} y={150} rx={34} ry={32} f={i % 3 === 0 ? '#2b2118' : '#e0b890'} w={7} />
      <El x={-50} y={176} rx={20} ry={14} f="#e0b890" w={5} /><El x={50} y={176} rx={20} ry={14} f="#e0b890" w={5} />
    </>}
    {i === 1 && <Stink x={0} y={-6} s={.8} t={t} seed={i} ring />}
  </g>
);
/** the mosque seen from straight above (prayer rows) */
export const TopRows: React.FC<{t: number; kind: 'takbir' | 'sujood'}> = ({t, kind}) => (
  <g>
    <Re x={-900} y={-800} w={2880} h={3600} f={CARPET} sw={0} /><Re x={-900} y={-800} w={2880} h={3600} f="url(#mh-dia)" sw={0} />
    {[300, 800, 1300, 1800].map((y) => <Pa key={y} d={`M-900 ${y} L1980 ${y}`} w={12} s={GOLD} />)}
    {kind === 'takbir'
      ? <>{[0, 1, 2].map((i) => topMan(i === 1 ? 'takbir' : 'takbir', 200 + i * 340, 1300, t, i))}{[0, 1, 2].map((i) => topMan('back', 200 + i * 340, 760, t, i + 3))}
          <Stink x={540} y={1250} s={1.1} t={t} ring /></>
      : <>{[0, 1, 2, 3].map((i) => topMan(i === 1 ? 'nar' : 'back', 90 + i * 300, 1250, t, i))}{[0, 1, 2, 3].map((i) => topMan('back', 90 + i * 300, 700, t, i + 4))}
          <Stink x={90 + 3 * 300} y={1250} s={.8} t={t} seed={3} /></>}
  </g>
);

/** carpet seen from the floor in prostration: big neighbours' sleeves with hands, a foot that creeps in and a foot that withdraws */
export const PovFloor: React.FC<{t: number; lt: number; mode: 'feet' | 'up'}> = ({t, lt, mode}) => {
  const cyc = (lt % 1.9) / 1.9, near = Math.sin(Math.min(1, cyc * 1.6) * Math.PI / 2), away = cyc > .35 ? Math.min(1, (cyc - .35) / .25) : 0;
  return (
    <g>
      <Re x={-900} y={-800} w={2880} h={3000} f={CARPET} sw={0} /><Re x={-900} y={-800} w={2880} h={3000} f="url(#mh-dia)" sw={0} />
      <Pa d="M-900 1280 L1980 1280 M-900 1560 L1980 1560" w={22} s={GOLD} />
      {mode === 'feet' ? <>
        <Pa d="M-60 1920 Q80 1400 200 1380 L430 1440 Q520 1700 560 1920Z" f={WHITE} w={8} />
        <Pa d={`M${640 + away * 160} 1920 Q${700 + away * 160} 1500 ${840 + away * 160} 1460 L1100 1500 L1140 1920Z`} f={WHITE} w={8} />
        {[0, 1, 2, 3].map((i) => <Pa key={i} d={`M${240 + i * 44} 1390 L${236 + i * 44} 1310`} w={26} s="#e0b890" />)}
        <El x={320} y={1400} rx={110} ry={58} f="#e0b890" w={8} />
        <g transform={`translate(${760 + away * 190} ${900 + 80 * (1 - near) + away * 40})`}>
          <Pa d="M-90 -140 Q-120 60 -70 190 Q0 240 80 190 Q120 40 90 -140Z" f="#e0b890" w={8} />{[0, 1, 2, 3, 4].map((i) => <El key={i} x={-76 + i * 38} y={-142} rx={20} ry={26} f="#e0b890" w={6} />)}
        </g>
        <g transform={`translate(${120 + near * 90} ${1180 - near * 30})`}>
          <Pa d="M-80 -100 Q-100 60 -50 150 Q20 190 80 150 Q110 20 84 -100Z" f="#d9a97a" w={8} />{[0, 1, 2, 3, 4].map((i) => <El key={i} x={-64 + i * 32} y={-102} rx={18} ry={24} f="#d9a97a" w={6} />)}
        </g>
      </> : <>
        <Pa d="M-100 -100 L-100 700 Q200 760 420 700 L420 -100Z" f={WHITE} w={8} /><Pa d="M660 -100 L660 700 Q860 760 1180 700 L1180 -100Z" f={WHITE} w={8} />
        <Pa d="M-60 700 L-60 600 M60 700 L60 600 M720 700 L720 600 M840 700 L840 600" w={26} s="#e0b890" />
      </>}
    </g>
  );
};

/** the narrator's boxing-gym studio: blue wall, punching bag, poster, red floor */
export const Studio: React.FC<{t: number}> = ({t}) => (
  <g>
    <Re x={-900} y={-800} w={2880} h={2300} f="#2f55c7" sw={0} />
    <Re x={-900} y={-90} w={2880} h={40} f="#e8f1ff" sw={0} />
    <Re x={-900} y={1380} w={2880} h={700} f="#8a2a3a" sw={8} />
    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <Pa key={i} d={`M${-900 + i * 400} 1380 L${-1100 + i * 480} 2000`} w={4} s="#5a1a26" />)}
    <Pa d="M120 -50 L120 480" w={6} /><Re x={40} y={480} w={160} h={420} f="#b8472f" sw={8} rx={40} /><Pa d="M40 560 L200 560 M40 640 L200 640" w={5} />
    <Re x={600} y={520} w={380} h={440} f="#e8f1ff" sw={9} /><Re x={632} y={552} w={316} h={376} f="#9aa9c9" sw={0} />
    <El x={790} y={700} rx={70} ry={78} f="#6b7794" w={0} /><Pa d="M650 930 Q700 800 790 790 Q880 800 930 930Z" f="#6b7794" w={0} />
    <Pa d="M-900 1380 L1980 1380" w={7} />
  </g>
);

/** papyrus card on a dark ground: title, then each point written word by word at its spoken moment */
export const Scroll: React.FC<{t: number; titleAt: number; lines: {words: CapWord[]}[]}> = ({t, titleAt, lines}) => {
  const jag = (y0: number, up: boolean) => [...Array(34)].map((_, i) => `L${60 + i * 28} ${y0 + (i % 2 ? (up ? -10 : 10) : 0)}`).join(' ');
  return (
    <g>
      <Re x={-900} y={-800} w={2880} h={3600} f="#3a2616" sw={0} />
      {[...Array(30)].map((_, i) => <g key={i}><Re x={-900} y={-800 + i * 130} w={2880} h={130} f={i % 2 ? '#3f2a19' : '#342213'} sw={0} /><Pa d={`M-900 ${-800 + i * 130} L1980 ${-800 + i * 130}`} w={4} s="#1d130b" /><Pa d={`M${-300 + (i * 211) % 900} ${-800 + i * 130 + 40} q60 -14 120 0 M${200 + (i * 137) % 700} ${-800 + i * 130 + 90} q50 12 100 0`} w={3} s="#2a1a0f" /></g>)}
      <g transform="rotate(-1.2 540 960)">
        <Pa d={`M60 330 ${jag(330, true)} L1020 330 L1030 1560 ${jag(1560, false).split(' ').reverse().join(' ')} L50 1560Z`} f="#d9b86e" w={0} />
        <Re x={64} y={338} w={950} h={1216} f="#e0c07c" sw={0} />
        {[...Array(26)].map((_, i) => <Pa key={'fb' + i} d={`M${70 + (i * 97) % 880} ${350 + (i * 53) % 1180} q18 -9 40 0 q22 9 44 0`} w={2.5} s="#c9a45e" />)}
        <Pa d="M70 350 L1010 350 M70 1540 L1010 1540" w={6} s="#b8924a" />
        <text x={540} y={560} fontSize={118} fontWeight={800} fill="#2f7d3a" textAnchor="middle" fontFamily='"Noto Kufi Arabic", sans-serif'>{t >= titleAt ? 'آداب المسجد' : ''}</text>
        <Pa d="M260 610 Q540 640 820 610" w={6} s="#2f7d3a" o={t >= titleAt ? 1 : 0} />
        {lines.map((l, i) => {
          const shown = l.words.filter((w) => t >= w.at - 0.001);
          return <text key={i} x={540} y={790 + i * 118} fontSize={60} fontWeight={800} fill="#fffaf0" stroke="#3a2a14" strokeWidth={9} paintOrder="stroke" direction="rtl" textAnchor="middle" fontFamily='"Noto Kufi Arabic", sans-serif' style={{unicodeBidi: 'isolate'}}>{shown.map((w) => w.t).join(' ')}</text>;
        })}
      </g>
    </g>
  );
};

/** prayer beads in a big open hand (close-up) */
export const BeadsHand: React.FC<{t: number}> = ({t}) => (
  <g transform={`translate(540 1000) rotate(${-8 + 2 * Math.sin(t * 1.5)})`}>
    <Pa d="M-170 -260 Q-210 60 -120 230 Q-20 330 150 250 Q230 80 190 -260Z" f="#d9c38a" w={9} />{[0, 1, 2, 3, 4].map((i) => <El key={i} x={-140 + i * 70} y={-262} rx={36} ry={52} f="#d9c38a" w={8} />)}
    {[...Array(14)].map((_, i) => <El key={i} x={-120 + i * 24 + 6 * Math.sin(i + t * 2)} y={-30 + 60 * Math.sin(i * .55)} rx={24} ry={24} f="#2b2b2b" w={6} />)}
    <Pa d="M-130 -30 Q-20 90 150 -30" w={5} />
  </g>
);

/** a toddler crawling on all fours toward the left (head leads) */
export const Crawler: React.FC<{x: number; y: number; t: number; s?: number}> = ({x, y, t, s = 1}) => {
  const sw = (k: number) => 22 * Math.sin(t * 9 + k);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Pa d={`M-46 20 L${-58 + sw(0)} 112 M-26 24 L${-30 + sw(2)} 112`} w={13} s="#2c4f86" />
      <Pa d={`M44 22 L${52 + sw(3)} 112 M64 18 L${72 + sw(1)} 112`} w={13} s="#2c4f86" />
      <El x={10} y={4} rx={92} ry={50} f="#4f86c6" w={7} />
      <Pa d="M-70 -6 Q-96 -22 -98 -10" w={6} />
      <El x={-98} y={-26} rx={42} ry={40} f="#f1c9a0" w={7} />
      <Pa d="M-118 -62 Q-100 -92 -84 -64" f="#2b2118" w={6} />
      <El x={-112} y={-30} rx={4} ry={5} f="#141414" w={0} /><El x={-90} y={-30} rx={4} ry={5} f="#141414" w={0} />
      <Pa d="M-112 -14 Q-100 -4 -88 -14" w={4} />
    </g>
  );
};

/** a locally generated flat-vector picture filling the 9:16 frame (faceless men, no text) */
export const Plate: React.FC<{src: string}> = ({src}) => (
  <g><Re x={-900} y={-800} w={2880} h={3600} f="#2f7a55" sw={0} /><image href={staticFile(src)} x={-3} y={0} width={1086} height={1920} preserveAspectRatio="xMidYMid slice" /></g>
);

/** low rear view of three men standing in a row: the middle man (blue jacket) edges his foot toward his right neighbour, who pulls away — twice */
export const FeetNudge: React.FC<{t: number}> = ({t}) => {
  const pulse = (a: number, b: number) => (t < a || t > b ? 0 : Math.sin(Math.PI * (t - a) / (b - a)) ** 1.5);
  const k = Math.max(pulse(36.0, 37.5), pulse(38.0, 39.5)), away = 120 * k, reach = 110 * k;
  const foot = (x: number, y: number, key: string) => <El key={key} x={x} y={y} rx={46} ry={22} f="#e0b890" w={6} />;
  return (
    <g>
      <Re x={-900} y={-800} w={2880} h={2400} f="#e9e5d9" sw={0} />
      <Re x={-900} y={900} w={2880} h={1500} f={CARPET} sw={8} /><Re x={-900} y={900} w={2880} h={1500} f="url(#mh-dia)" sw={0} />
      <Pa d="M-900 1330 L1980 1330 M-900 1620 L1980 1620" w={10} s={GOLD} />
      {/* left man */}
      <Pa d="M-60 -200 L-10 1500 L330 1500 L380 -200Z" f={WHITE} w={7} /><Pa d="M80 200 L100 1480 M240 200 L230 1480" w={4} s="#c9c4b4" />
      {foot(110, 1530, 'l1')}{foot(240, 1530, 'l2')}
      {/* right man (pulls away) */}
      <g transform={`translate(${away} 0)`}>
        <Pa d="M700 -200 L750 1500 L1090 1500 L1140 -200Z" f={WHITE} w={7} /><Pa d="M840 200 L860 1480 M1000 200 L990 1480" w={4} s="#c9c4b4" />
        {foot(770, 1530 - 26 * k, 'r1')}{foot(1000, 1530, 'r2')}
      </g>
      {/* narrator: jacket hem, trousers, bare feet */}
      <Pa d="M390 -200 L400 1000 L690 1000 L700 -200Z" f="#3f6fd1" w={7} /><Pa d="M470 1000 L470 1500 M620 1000 L620 1500" w={0} />
      <Pa d="M410 1000 L430 1500 L520 1500 L540 1000Z" f="#f4f1ea" w={7} /><Pa d={`M${545 + reach} 1000 L${540 + reach} 1500 L${650 + reach} 1500 L${670 + reach * .4} 1000Z`} f="#f4f1ea" w={7} />
      {foot(470, 1535, 'n1')}{foot(600 + reach, 1535 - 18 * k, 'n2')}
    </g>
  );
};

/** a proper onion: papery bulb with layer lines, a dry sprout at the top and a tuft of roots below */
export const Onion: React.FC<{x?: number; y?: number; s?: number; rot?: number}> = ({x = 0, y = 0, s = 1, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <Pa d="M-12 46 L-16 66 M-4 50 L-5 70 M5 50 L8 70 M13 46 L19 64" w={3} s="#8a7a5a" />
    <Pa d="M0 -66 Q-6 -44 -32 -28 Q-58 -6 -50 22 Q-42 52 0 54 Q42 52 50 22 Q58 -6 32 -28 Q6 -44 0 -66Z" f="#d9a441" w={5} />
    <Pa d="M0 -60 Q-34 -12 -22 50 M0 -60 Q34 -12 22 50 M0 -60 Q-12 0 -3 54 M0 -60 Q12 0 4 54" w={2.4} s="#a8742a" />
    <Pa d="M-2 -66 Q0 -80 5 -88" w={5} s="#c9a56a" />
    <El x={-22} y={-4} rx={8} ry={18} f="#f0cf84" w={0} />
  </g>
);

/** a bucket of onion water: onions floating in blue water */
export const OnionBucket: React.FC<{x: number; y: number; t: number; s?: number}> = ({x, y, t, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Pa d="M-90 -110 L-70 0 L70 0 L90 -110Z" f="#4f86c6" w={6} />
    <El x={0} y={-110} rx={90} ry={22} f="#9fd0f0" w={6} />
    {[-44, 4, 48].map((ox, i) => <Onion key={i} x={ox} y={-122 + 3 * Math.sin(t * 2.4 + i * 2)} s={.42} rot={i * 24 - 20} />)}
    <Pa d="M-90 -110 Q0 -150 90 -110" w={5} />
  </g>
);
