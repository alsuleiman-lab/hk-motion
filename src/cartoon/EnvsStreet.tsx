import React from 'react';

/** Everyday settings in the Dodo look (flat colour, thick ink line): street corner, living room. World = 1080×1920 screen, extended sideways for camera moves. */
const INK = '#141414';
const P: React.FC<{d: string; f?: string; w?: number; s?: string; o?: number}> = ({d, f = 'none', w = 6, s = INK, o = 1}) => <path d={d} fill={f} stroke={s} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round" opacity={o} />;
const R: React.FC<{x: number; y: number; w: number; h: number; f: string; sw?: number; rx?: number}> = ({x, y, w, h, f, sw = 6, rx = 0}) => <rect x={x} y={y} width={w} height={h} rx={rx} fill={f} stroke={sw ? INK : 'none'} strokeWidth={sw} />;
const E: React.FC<{x: number; y: number; rx: number; ry: number; f: string; w?: number}> = ({x, y, rx, ry, f, w = 6}) => <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={f} stroke={w ? INK : 'none'} strokeWidth={w} />;

const Windows: React.FC<{x: number; y: number; cols: number; rows: number; dx?: number; dy?: number; lit?: boolean}> = ({x, y, cols, rows, dx = 120, dy = 150, lit}) => (
  <>{[...Array(rows)].map((_, r) => [...Array(cols)].map((__, c) => (
    <g key={r + '-' + c}>
      <R x={x + c * dx} y={y + r * dy} w={70} h={100} f={lit && (r + c) % 3 === 0 ? '#ffe9a6' : '#9cc3d6'} sw={5} rx={4} />
      <P d={`M${x + c * dx + 35} ${y + r * dy} L${x + c * dx + 35} ${y + r * dy + 100} M${x + c * dx} ${y + r * dy + 50} L${x + c * dx + 70} ${y + r * dy + 50}`} w={3} />
    </g>
  )))}</>
);

/** a sunny street corner with a kiosk; sidewalk to y≈1600, road below */
export const StreetCorner: React.FC<{t: number}> = ({t}) => (
  <g>
    <defs><linearGradient id="st-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9fd0ea" /><stop offset="1" stopColor="#f7eed6" /></linearGradient></defs>
    <rect x={-800} y={-700} width={2680} height={1700} fill="url(#st-sky)" />
    <E x={900 + 10 * Math.sin(t * .3)} y={200} rx={120} ry={46} f="#fffaf0" w={0} /><E x={200} y={330} rx={90} ry={34} f="#fffaf0" w={0} />
    <R x={-300} y={240} w={560} h={800} f="#e7c9a0" />
    <Windows x={-230} y={300} cols={4} rows={4} dx={125} dy={170} lit />
    <R x={-300} y={196} w={560} h={46} f="#c9a374" />
    <R x={860} y={170} w={520} h={870} f="#e8b8b0" />
    <Windows x={900} y={240} cols={3} rows={4} dx={140} dy={190} />
    <R x={860} y={126} w={520} h={46} f="#c58e86" />
    <R x={270} y={560} w={580} h={480} f="#f3e2b8" />
    <P d="M250 560 L870 560 L840 640 L280 640Z" f="#d94a3c" w={6} />
    {[0, 1, 2, 3, 4, 5].map((i) => <P key={i} d={`M${280 + i * 100} 560 L${300 + i * 98} 640 L${340 + i * 98} 640 L${330 + i * 100} 560Z`} f="#fffaf0" w={0} />)}
    <P d="M250 560 L870 560 L840 640 L280 640Z" w={6} />
    <R x={310} y={690} w={500} h={170} f="#cfa16b" sw={6} />
    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <g key={i}><R x={326 + i * 60} y={706} w={42} h={56} f={['#e85d4a', '#5aa469', '#f2c14e', '#4f86c6'][i % 4]} sw={4} rx={6} /><R x={326 + i * 60} y={782} w={42} h={56} f={['#4f86c6', '#f2c14e', '#e85d4a', '#5aa469'][i % 4]} sw={4} rx={6} /></g>)}
    <R x={310} y={860} w={500} h={34} f="#8a6a44" sw={6} />
    <R x={-800} y={1010} w={2680} h={620} f="#dcd0b6" sw={6} />
    {[...Array(14)].map((_, i) => <P key={i} d={`M${-700 + i * 160} 1010 L${-760 + i * 200} 1620`} w={3} s="#b8a888" />)}
    <P d="M-800 1180 L1880 1180 M-800 1380 L1880 1380" w={3} s="#b8a888" />
    <R x={-800} y={1612} w={2680} h={34} f="#b9b2a3" sw={6} />
    <R x={-800} y={1646} w={2680} h={400} f="#5d5d66" sw={6} />
    <P d="M-800 1830 L1880 1830" w={10} s="#f3e9c6" />
    <g transform="translate(70 1010)"><R x={-12} y={-540} w={24} h={540} f="#3d4a55" sw={6} /><R x={-50} y={-580} w={100} h={46} f="#3d4a55" sw={6} rx={10} /><E x={0} y={-536} rx={30} ry={14} f="#ffe9a6" w={4} /></g>
  </g>
);

/** a living room: sofa, rug, window, shelf — for the father/son films */
export const LivingRoom: React.FC<{t: number}> = ({t}) => (
  <g>
    <R x={-800} y={-700} w={2680} h={1800} f="#e9cfa3" sw={0} />
    {[...Array(14)].map((_, i) => <R key={i} x={-700 + i * 200} y={-700} w={100} h={1800} f="#e2c596" sw={0} />)}
    <R x={-800} y={1040} w={2680} h={1100} f="#a9754a" sw={6} />
    {[...Array(8)].map((_, i) => <P key={i} d={`M${-800 + i * 300} 1040 L${-800 + i * 300} 2140`} w={3} s="#8e5f3a" />)}
    <R x={100} y={200} w={420} h={420} f="#9cc3d6" sw={8} rx={10} />
    <P d="M310 200 L310 620 M100 410 L520 410" w={6} />
    <P d="M60 190 Q120 380 70 640 M560 190 Q500 380 550 640" f="#d9b3d3" w={6} />
    <R x={640} y={420} w={360} h={26} f="#8a6a44" sw={6} /><R x={640} y={560} w={360} h={26} f="#8a6a44" sw={6} />
    {[0, 1, 2, 3, 4].map((i) => <R key={i} x={656 + i * 66} y={346} w={46} h={74} f={['#e85d4a', '#5aa469', '#f2c14e', '#4f86c6', '#b07ac0'][i]} sw={4} rx={4} />)}
    {[0, 1, 2, 3].map((i) => <R key={i} x={664 + i * 80} y={490} w={56} h={70} f={['#f2c14e', '#e85d4a', '#4f86c6', '#5aa469'][i]} sw={4} rx={4} />)}
    <E x={540} y={1600} rx={560} ry={120} f="#c0584a" w={6} /><E x={540} y={1600} rx={470} ry={92} f="none" w={4} />
    <g><R x={150} y={800} w={780} h={150} f="#5a7da0" sw={7} rx={34} /><R x={120} y={900} w={840} h={150} f="#6c8fb3" sw={7} rx={30} /><R x={90} y={850} w={100} h={210} f="#5a7da0" sw={7} rx={34} /><R x={890} y={850} w={100} h={210} f="#5a7da0" sw={7} rx={34} /><P d="M540 910 L540 1040" w={4} /></g>
  </g>
);

/** a school classroom: blackboard, window, teacher's desk */
export const Classroom: React.FC<{t: number}> = ({t}) => (
  <g>
    <R x={-800} y={-700} w={2680} h={1800} f="#d6e3c2" sw={0} />
    <R x={-800} y={1000} w={2680} h={1140} f="#b88a58" sw={6} />
    {[...Array(9)].map((_, i) => <P key={i} d={`M${-800 + i * 300} 1000 L${-900 + i * 340} 2140`} w={3} s="#8e6a40" />)}
    <R x={90} y={330} w={900} h={460} f="#3f5a4d" sw={10} rx={6} />
    <R x={90} y={790} w={900} h={26} f="#8a6a44" sw={8} />
    <P d="M170 450 Q300 400 420 470 M180 560 Q330 520 470 590 M560 440 Q700 400 840 470 M580 580 Q720 540 860 600" w={5} s="#e8efe1" o={.8} />
    <R x={870} y={770} w={50} h={14} f="#fffaf0" sw={3} rx={4} />
    <R x={-90} y={150} w={110} h={420} f="#9cc3d6" sw={8} rx={8} />
    <E x={560 + 10 * Math.sin(t * .4)} y={190} rx={80} ry={28} f="#fffaf0" w={0} />
    <R x={430} y={1010} w={250} h={26} f="#8a6a44" sw={6} />
    <E x={540} y={1650} rx={520} ry={96} f="#a77a50" w={0} />
  </g>
);

/** a grand majlis: carved arches, lanterns, bookshelf, rich carpet and the sheikh's high-backed chair (seat top at y≈1478 in world px, chair centre x≈720) */
export const Majlis: React.FC<{t: number; chairX?: number}> = ({t, chairX = 720}) => (
  <g>
    <defs><linearGradient id="mj-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6a3b2a" /><stop offset="1" stopColor="#8a5238" /></linearGradient></defs>
    <R x={-800} y={-700} w={2680} h={1900} f="url(#mj-wall)" sw={0} />
    {[0, 1, 2].map((i) => (
      <g key={i}>
        <P d={`M${-120 + i * 420} 1000 L${-120 + i * 420} 520 Q${60 + i * 420} 330 ${240 + i * 420} 520 L${240 + i * 420} 1000Z`} f="#9a6a48" w={7} />
        <P d={`M${-80 + i * 420} 1000 L${-80 + i * 420} 540 Q${60 + i * 420} 380 ${200 + i * 420} 540 L${200 + i * 420} 1000Z`} f="#d8c08a" w={4} />
        <P d={`M${60 + i * 420} 400 L${60 + i * 420} 1000`} w={3} s="#9a7a4a" o={.6} />
      </g>
    ))}
    {[170, 590, 1010].map((x, i) => <g key={x} transform={`translate(${x} ${130 + 6 * Math.sin(t * 1.3 + i)})`}><P d="M0 -130 L0 0" w={4} /><P d="M-34 0 L34 0 L22 70 L-22 70Z" f="#e3b94d" w={5} /><E x={0} y={34} rx={14} ry={22} f="#fff0b8" w={0} /></g>)}
    <R x={-800} y={1000} w={2680} h={1900} f="#5a3524" sw={6} />
    <E x={540} y={1650} rx={640} ry={170} f="#a3302e" w={7} /><E x={540} y={1650} rx={560} ry={140} f="none" w={5} /><E x={540} y={1650} rx={420} ry={104} f="#d9a441" w={0} />
    <E x={540} y={1650} rx={330} ry={80} f="#a3302e" w={4} />
    <g transform={`translate(${chairX} 1478)`}>
      <R x={-130} y={-350} w={260} h={350} f="#7b2d2d" sw={8} rx={34} />
      <R x={-100} y={-310} w={200} h={290} f="#a14646" sw={5} rx={24} />
      <R x={-150} y={-20} w={300} h={64} f="#c9923a" sw={8} rx={14} />
      <R x={-150} y={44} w={300} h={50} f="#7b2d2d" sw={8} rx={10} />
    </g>
  </g>
);
