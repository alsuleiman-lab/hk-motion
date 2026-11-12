import React from 'react';
import {P, Sky, Cloud, Minaret, Pilgrim} from './EnvsHajj';

/** Makkah settings, drawn with care: the Kaaba (kiswa, gold hizam with cartouches, door, marble plinth), the plaza with the tawaf in its true direction
 *  (counter-clockwise seen from above = the near side of the crowd moves to the RIGHT of the screen), the Black Stone corner with the green light above it,
 *  and the long Mas'a corridor drawn wide enough for a following camera. */
const INK = '#242326';

export const KaabaModel: React.FC<{cx?: number; gy?: number; s?: number}> = ({cx = 540, gy = 1010, s = 1}) => (
  <g transform={`translate(${cx} ${gy}) scale(${s})`}>
    <defs>
      <linearGradient id="kb-front" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#1d1b21" /><stop offset="1" stopColor="#2a272f" /></linearGradient>
      <linearGradient id="kb-side" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#141217" /><stop offset="1" stopColor="#0f0d12" /></linearGradient>
    </defs>
    {/* side wall and front wall */}
    <P d="M165 -470 L270 -440 L270 36 L165 0Z" f="url(#kb-side)" w={5} />
    <P d="M-165 -470 L165 -470 L165 0 L-165 0Z" f="url(#kb-front)" w={5} />
    <P d="M-165 -470 L-80 -498 L270 -440 L165 -470Z" f="#3c3944" w={5} />
    {/* kiswa folds */}
    {[-140, -108, -76, -44, -12, 20, 52, 84, 116, 146].map((x) => <P key={x} d={`M${x} -460 L${x} -8`} w={1.6} s="#47434f" o={.75} />)}
    {[190, 215, 240].map((x, i) => <P key={x} d={`M${x} ${-448 + i * 8} L${x} ${28 + i * 3}`} w={1.4} s="#2a2730" o={.8} />)}
    {/* the gold band (hizam) with cartouches */}
    <P d="M-165 -332 L165 -332 L165 -262 L-165 -262Z" f="#d8ab3d" w={4} />
    <P d="M165 -332 L270 -302 L270 -233 L165 -262Z" f="#bf9230" w={4} />
    <P d="M-165 -322 L165 -322 M-165 -272 L165 -272" w={1.8} s="#7b5a14" />
    {[...Array(7)].map((_, i) => (
      <g key={i} transform={`translate(${-132 + i * 44} -297)`}>
        <P d="M-15 -17 Q-19 0 -15 17 L15 17 Q19 0 15 -17Z" f="#f4e2a1" w={2.4} s="#7b5a14" />
        <P d="M-8 -9 Q0 -16 8 -9 M-8 0 Q0 -7 8 0 M-8 9 Q0 2 8 9" w={1.8} s="#7b5a14" />
      </g>
    ))}
    {[...Array(3)].map((_, i) => <P key={i} d={`M${178 + i * 30} ${-318 + i * 9} Q${186 + i * 30} ${-296 + i * 9} ${178 + i * 30} ${-276 + i * 9}`} w={2} s="#7b5a14" />)}
    {/* the golden door, raised above the floor */}
    <P d="M34 -52 L34 -222 Q34 -262 76 -262 Q118 -262 118 -222 L118 -52Z" f="#e5bc55" w={5} />
    <P d="M46 -60 L46 -216 Q46 -248 76 -248 Q106 -248 106 -216 L106 -60Z" f="#c99a2e" w={3} />
    <P d="M76 -248 L76 -60 M46 -150 L106 -150" w={2.2} s="#7b5a14" />
    <circle cx={64} cy={-120} r={4.5} fill="#7b5a14" /><circle cx={88} cy={-120} r={4.5} fill="#7b5a14" />
    <P d="M24 -52 L128 -52 L128 -36 L24 -36Z" f="#cfc8b8" w={3} />
    {/* marble plinth */}
    <P d="M-170 0 L170 0 L170 -26 L-170 -26Z" f="#e4ddcb" w={4} />
    <P d="M170 0 L274 36 L274 10 L170 -26Z" f="#c9c1ae" w={4} />
    <P d="M-170 -13 L170 -13" w={1.6} s="#a79f8c" />
  </g>
);

const Tower: React.FC<{x: number; base: number}> = ({x, base}) => (
  <g>
    <P d={`M${x - 70} ${base} L${x - 62} ${base - 520} L${x + 62} ${base - 520} L${x + 70} ${base}Z`} f="#d9cfb8" w={4} />
    {[...Array(12)].map((_, i) => <P key={i} d={`M${x - 58} ${base - 40 - i * 40} L${x + 58} ${base - 40 - i * 40}`} w={2} s="#9d927a" />)}
    <P d={`M${x - 92} ${base - 520} L${x + 92} ${base - 520} L${x + 80} ${base - 600} L${x - 80} ${base - 600}Z`} f="#cdbf9f" w={4} />
    <circle cx={x} cy={base - 560} r={34} fill="#fffaf0" stroke={INK} strokeWidth={4} />
    <P d={`M${x} ${base - 560} L${x} ${base - 584} M${x} ${base - 560} L${x + 18} ${base - 552}`} w={3.4} />
    <P d={`M${x - 36} ${base - 600} Q${x} ${base - 690} ${x + 36} ${base - 600}Z`} f="#6f9f86" w={4} />
    <P d={`M${x} ${base - 668} L${x} ${base - 712}`} w={4} s="#c99a2e" />
  </g>
);

/** the plaza: orbiting pilgrims move counter-clockwise seen from above (near side → right) */
export const MakkahPlaza: React.FC<{t: number; time?: 'day' | 'dusk'}> = ({t, time = 'day'}) => {
  const n = 22, cx = 540, cy = 1075;
  const ring = [...Array(n)].map((_, i) => {
    const f = .78 + ((i * 37) % 10) / 10 * .5;                       // lanes of the crowd
    const a = -t * .26 + (i / n) * Math.PI * 2 + (i % 3) * .05;
    const rx = 470 * f, ry = 80 * f;
    const sn = Math.sin(a), d = (sn + 1) / 2;
    return {i, x: cx + Math.cos(a) * rx, y: cy + sn * ry, s: .5 + .42 * d, front: sn > 0, flip: sn < 0, bob: 3 * Math.sin(t * 5 + i)};
  });
  const dusk = time === 'dusk';
  return (
    <g>
      <Sky id="mk-sky" a={dusk ? '#f1a46b' : '#86c3e6'} b={dusk ? '#fbe2b6' : '#f7f0da'} h={900} />
      <circle cx={900} cy={dusk ? 300 : 230} r={dusk ? 108 : 78} fill={dusk ? '#fff0b8' : '#fff4c2'} stroke={INK} strokeWidth={4} />
      <Cloud x={190} y={200} s={1.1} /><Cloud x={640} y={330} s={.8} />
      <Tower x={-10} base={900} />
      <Minaret x={150} base={880} h={560} /><Minaret x={960} base={880} h={560} /><Minaret x={1250} base={880} h={440} />
      <P d="M-500 640 L1580 640 L1580 900 L-500 900Z" f="#f1e4c8" />
      <P d="M-500 640 L1580 640 L1580 672 L-500 672Z" f="#d9b869" />
      {[...Array(26)].map((_, i) => <P key={i} d={`M${-470 + i * 82} 900 L${-470 + i * 82} 752 Q${-440 + i * 82} 704 ${-410 + i * 82} 752 L${-410 + i * 82} 900Z`} f="#7d6a52" w={3} />)}
      <defs><linearGradient id="mk-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#efe3c8" /><stop offset="1" stopColor="#d6c4a0" /></linearGradient></defs>
      <rect x={-800} y={900} width={2680} height={1500} fill="url(#mk-floor)" stroke={INK} strokeWidth={4} />
      {[...Array(9)].map((_, i) => <ellipse key={i} cx={540} cy={1075} rx={520 + i * 130} ry={104 + i * 66} fill="none" stroke="#c9b58c" strokeWidth={3} opacity={.75} />)}
      {ring.filter((r) => !r.front).map((r) => <Pilgrim key={r.i} x={r.x} y={r.y + r.bob} s={r.s * .9} flip={r.flip} />)}
      <KaabaModel cx={540} gy={1015} s={1.18} />
      {ring.filter((r) => r.front).map((r) => <Pilgrim key={r.i} x={r.x} y={r.y + r.bob} s={r.s * .9} flip={r.flip} />)}
    </g>
  );
};

/** the Black Stone corner: stone and its silver frame at the left (the student stands to its right and raises his RIGHT hand), the green light above it */
export const BlackStoneCorner: React.FC<{t: number}> = ({t}) => {
  const glow = .5 + .5 * Math.sin(t * 3);
  return (
    <g>
      <defs>
        <linearGradient id="bs-l" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#100e13" /><stop offset="1" stopColor="#1a181e" /></linearGradient>
        <linearGradient id="bs-r" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#25222a" /><stop offset="1" stopColor="#1d1b21" /></linearGradient>
        <linearGradient id="bs-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e8dcc0" /><stop offset="1" stopColor="#d2bf9a" /></linearGradient>
        <radialGradient id="bs-green"><stop offset="0" stopColor="#7dffb0" stopOpacity=".9" /><stop offset="1" stopColor="#4be38a" stopOpacity="0" /></radialGradient>
      </defs>
      <rect x={-800} y={-700} width={2680} height={2200} fill="#1d1b21" />
      <P d="M-800 -700 L330 -700 L330 1500 L-800 1500Z" f="url(#bs-l)" w={0} />
      <P d="M330 -700 L1880 -700 L1880 1500 L330 1500Z" f="url(#bs-r)" w={0} />
      {[...Array(14)].map((_, i) => <P key={i} d={`M${350 + i * 70} -700 L${350 + i * 70} 1480`} w={1.6} s="#37333f" o={.8} />)}
      {[...Array(6)].map((_, i) => <P key={i} d={`M${290 - i * 60} -700 L${290 - i * 60} 1480`} w={1.6} s="#26232b" o={.8} />)}
      <P d="M330 -700 L330 1500" w={9} s="#0b0a0d" />
      <P d="M318 -700 L318 1500 L342 1500 L342 -700Z" f="#c79b36" w={3} o={.9} />
      {/* hizam across both faces */}
      <P d="M-800 540 L330 540 L330 690 L-800 690Z" f="#bf9230" w={5} /><P d="M330 540 L1880 540 L1880 690 L330 690Z" f="#d8ab3d" w={5} />
      {[...Array(16)].map((_, i) => (
        <g key={i} transform={`translate(${-640 + i * 120} 615)`}>
          <P d="M-24 -34 Q-30 0 -24 34 L24 34 Q30 0 24 -34Z" f="#f4e2a1" w={3} s="#7b5a14" />
          <P d="M-12 -18 Q0 -28 12 -18 M-12 0 Q0 -10 12 0 M-12 18 Q0 8 12 18" w={2.4} s="#7b5a14" />
        </g>
      ))}
      {/* the green light above the stone */}
      <circle cx={330} cy={900} r={90 + 14 * glow} fill="url(#bs-green)" />
      <P d="M330 800 L330 842" w={5} s="#9a9aa4" />
      <rect x={288} y={842} width={84} height={34} rx={9} fill="#4be38a" stroke={INK} strokeWidth={5} />
      <rect x={298} y={850} width={64} height={8} rx={4} fill="#d9ffe6" />
      {/* the Black Stone and its silver frame, at the corner */}
      <P d="M200 1075 Q200 1042 232 1042 L428 1042 Q460 1042 460 1075 L460 1295 Q460 1330 426 1330 L234 1330 Q200 1330 200 1295Z" f="#c9ced6" w={8} />
      <P d="M214 1086 Q214 1056 242 1056 L418 1056 Q446 1056 446 1086 L446 1288 Q446 1316 418 1316 L242 1316 Q214 1316 214 1288Z" f="#9aa0aa" w={3} />
      <P d="M226 1092 Q226 1070 248 1070 L412 1070 Q434 1070 434 1092 L434 1282 Q434 1302 412 1302 L248 1302 Q226 1302 226 1282Z" f="#352724" w={3} />
      <P d="M250 1100 Q300 1090 322 1140 Q290 1186 246 1164Z M342 1090 Q410 1088 420 1150 Q390 1196 348 1170Z M252 1206 Q320 1186 338 1234 Q312 1282 256 1268Z M356 1214 Q412 1210 418 1262 Q380 1290 352 1272Z" f="#4b3430" w={2.6} s="#1a1210" />
      {[[222, 1062], [438, 1062], [222, 1310], [438, 1310], [330, 1050], [330, 1322]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={5} fill="#7c828d" stroke={INK} strokeWidth={2} />)}
      {/* marble plinth and the floor */}
      <P d="M-800 1480 L1880 1480 L1880 1522 L-800 1522Z" f="#e4ddcb" w={5} />
      <rect x={-800} y={1522} width={2680} height={800} fill="url(#bs-floor)" stroke={INK} strokeWidth={4} />
      {[...Array(8)].map((_, i) => <ellipse key={i} cx={330} cy={1700} rx={500 + i * 160} ry={90 + i * 50} fill="none" stroke="#c9b58c" strokeWidth={3} opacity={.7} />)}
      {/* the crowd passing in front of the wall, moving to the right (tawaf keeps the Kaaba on the walkers' left) */}
      {[0, 1, 2, 3, 4].map((i) => <Pilgrim key={i} x={((i * 260 + t * 34) % 1500) - 200} y={1560 + (i % 3) * 14} s={.5 + (i % 3) * .04} />)}
    </g>
  );
};

/** the Mas'a seen from the side, wide enough for a following camera: arcades on two levels, the Safa rock at the start, green-lit posts, a low rail between the two lanes */
export const SaiCorridor: React.FC<{t: number}> = ({t}) => (
  <g>
    <defs>
      <linearGradient id="sc-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#efe5cc" /><stop offset="1" stopColor="#e2d4b2" /></linearGradient>
      <linearGradient id="sc-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e9dec3" /><stop offset="1" stopColor="#cfbb94" /></linearGradient>
    </defs>
    <rect x={-1200} y={-700} width={5200} height={1300} fill="#cfe5f1" />
    <rect x={-1200} y={400} width={5200} height={820} fill="url(#sc-wall)" stroke={INK} strokeWidth={4} />
    <P d="M-1200 392 L4000 392 L4000 432 L-1200 432Z" f="#d9b869" w={4} />
    {[...Array(30)].map((_, i) => <P key={i} d={`M${-1100 + i * 180} 700 L${-1100 + i * 180} 520 Q${-1040 + i * 180} 462 ${-980 + i * 180} 520 L${-980 + i * 180} 700Z`} f="#9fc3d6" w={3} />)}
    <P d="M-1200 706 L4000 706" w={5} /><P d="M-1200 720 L4000 720 L4000 740 L-1200 740Z" f="#d9b869" w={3} />
    {[...Array(15)].map((_, i) => <P key={i} d={`M${-1100 + i * 360} 1180 L${-1100 + i * 360} 880 Q${-1010 + i * 360} 786 ${-920 + i * 360} 880 L${-920 + i * 360} 1180Z`} f="#8a7860" w={4} />)}
    {[...Array(15)].map((_, i) => <P key={i} d={`M${-1070 + i * 360} 1180 L${-1070 + i * 360} 890 Q${-1010 + i * 360} 820 ${-950 + i * 360} 890 L${-950 + i * 360} 1180Z`} f="#cfc4aa" w={2.4} />)}
    <rect x={-1200} y={1180} width={5200} height={1100} fill="url(#sc-floor)" stroke={INK} strokeWidth={4} />
    {[...Array(34)].map((_, i) => <P key={i} d={`M${-1100 + i * 180} 1180 L${-1100 + i * 180 - 120} 2200`} w={2.4} s="#b8a47c" />)}
    {[1260, 1420, 1650, 1950].map((y) => <P key={y} d={`M-1200 ${y} L4000 ${y}`} w={2.4} s="#b8a47c" />)}
    {/* the low rail between the two lanes */}
    <P d="M-1200 1322 L4000 1322" w={7} s="#7d7664" />
    {[...Array(40)].map((_, i) => <P key={i} d={`M${-1150 + i * 140} 1322 L${-1150 + i * 140} 1372`} w={6} s="#7d7664" />)}
    {/* Safa: the rock at the start, with its little shelter */}
    <P d="M-420 1180 Q-380 900 -220 860 Q-60 800 60 900 Q180 960 230 1180Z" f="#b9a58a" w={6} />
    <P d="M-300 1000 Q-200 960 -120 1010 M-340 1100 Q-220 1060 -100 1120" w={3} s="#8c7a5e" />
    <P d="M-120 1180 L-120 1010 Q-60 930 0 1010 L0 1180Z" f="#6f604a" w={4} />
    {/* the green-lit posts that mark the stretch men hurry through */}
    {[900, 2020].map((x) => (
      <g key={x}>
        <rect x={x - 22} y={760} width={44} height={560} fill="#e8e0cc" stroke={INK} strokeWidth={5} />
        <rect x={x - 12} y={820} width={24} height={150} rx={9} fill="#4be38a" stroke={INK} strokeWidth={4} />
        <circle cx={x} cy={895} r={70 + 8 * Math.sin(t * 3)} fill="#4be38a" opacity={.2} />
      </g>
    ))}
    {/* the far lane: other pilgrims walking both ways */}
    {[0, 1, 2, 3, 4, 5, 6].map((i) => <Pilgrim key={i} x={((((i * 470 + (i % 2 ? -t * 30 : t * 30)) % 2600) + 2600) % 2600) - 300} y={1290} s={.4} flip={i % 2 === 1} />)}
  </g>
);
