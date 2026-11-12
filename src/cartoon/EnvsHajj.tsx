import React from 'react';

/** Hajj/Makkah cartoon settings (flat colour, thick ink outline). World = 1080×1920 screen, extended sideways for camera moves. */
const INK = '#242326';
export const P: React.FC<{d: string; f?: string; w?: number; s?: string; o?: number}> = ({d, f = 'none', w = 4, s = INK, o = 1}) => <path d={d} fill={f} stroke={s} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round" opacity={o} />;
export const E: React.FC<{x: number; y: number; rx: number; ry: number; f: string; w?: number}> = ({x, y, rx, ry, f, w = 4}) => <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={f} stroke={w ? INK : 'none'} strokeWidth={w} />;

/** a small faceless pilgrim in white ihram (men only), feet at (x,y), height ≈ 150·s */
export const Pilgrim: React.FC<{x: number; y: number; s?: number; arms?: number; flip?: boolean}> = ({x, y, s = 1, arms = 0, flip}) => (
  <g transform={`translate(${x} ${y}) scale(${(flip ? -1 : 1) * s} ${s})`}>
    <P d="M-14 -52 L-12 0 M14 -52 L12 0" w={5} />
    <P d="M-26 -118 Q0 -128 26 -118 L30 -50 L-30 -50Z" f="#fffdf5" w={4} />
    <E x={20} y={-114} rx={9} ry={8} f="#f0c9a8" w={0} />
    <P d={arms > 0.01 ? `M24 -112 Q44 ${-150 - 30 * arms} 38 ${-170 - 30 * arms}` : 'M24 -110 L34 -66'} w={5} />
    <P d={arms > 0.01 ? `M-24 -112 Q-44 ${-150 - 30 * arms} -38 ${-170 - 30 * arms}` : 'M-24 -110 L-34 -66'} w={5} />
    <E x={0} y={-140} rx={19} ry={20} f="#f0c9a8" w={4} />
    <P d="M-18 -148 Q0 -166 18 -148 Q4 -156 -18 -148Z" f="#3a2c22" w={2} />
  </g>
);

export const Sky: React.FC<{id: string; a: string; b: string; h?: number}> = ({id, a, b, h = 1000}) => (
  <>
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient></defs>
    <rect x={-800} y={-700} width={2680} height={h + 700} fill={`url(#${id})`} />
  </>
);
export const Cloud: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={.95}>
    <E x={0} y={0} rx={70} ry={26} f="#fffaf0" w={0} /><E x={-40} y={-14} rx={40} ry={26} f="#fffaf0" w={0} /><E x={34} y={-20} rx={46} ry={30} f="#fffaf0" w={0} />
  </g>
);
export const Minaret: React.FC<{x: number; base: number; h: number}> = ({x, base, h}) => (
  <g>
    <P d={`M${x - 30} ${base} L${x - 24} ${base - h} L${x + 24} ${base - h} L${x + 30} ${base}Z`} f="#f3e8d0" />
    <P d={`M${x - 36} ${base - h * .55} L${x + 36} ${base - h * .55} L${x + 32} ${base - h * .55 + 16} L${x - 32} ${base - h * .55 + 16}Z`} f="#d9b869" />
    <P d={`M${x - 36} ${base - h} L${x + 36} ${base - h} L${x + 28} ${base - h - 18} L${x - 28} ${base - h - 18}Z`} f="#d9b869" />
    <P d={`M${x - 22} ${base - h - 18} Q${x} ${base - h - 90} ${x + 22} ${base - h - 18}Z`} f="#6f8f7a" />
    <P d={`M${x} ${base - h - 78} L${x} ${base - h - 108}`} w={4} s="#c99a2e" />
    <P d={`M${x - 10} ${base - h * .3} L${x + 10} ${base - h * .3} M${x - 10} ${base - h * .75} L${x + 10} ${base - h * .75}`} w={3} />
  </g>
);

/** the Kaaba with its gold band and door; (cx, ground) = front-face centre / ground line */
export const Kaaba: React.FC<{cx?: number; gy?: number; s?: number}> = ({cx = 540, gy = 1010, s = 1}) => (
  <g transform={`translate(${cx} ${gy}) scale(${s})`}>
    <P d="M130 -450 L250 -418 L250 32 L130 0Z" f="#17151a" w={5} />
    <P d="M-130 -450 L130 -450 L130 0 L-130 0Z" f="#232127" w={5} />
    <P d="M-130 -450 L-60 -478 L250 -418 L130 -450Z" f="#3b3841" w={5} />
    <P d="M-130 -366 L130 -366 L130 -290 L-130 -290Z" f="#e0b44a" w={4} />
    <P d="M130 -366 L250 -336 L250 -262 L130 -290Z" f="#c79b36" w={4} />
    {[...Array(9)].map((_, i) => <P key={i} d={`M${-112 + i * 28} -352 L${-112 + i * 28} -304 M${-112 + i * 28} -352 Q${-98 + i * 28} -332 ${-112 + i * 28} -304`} w={2.5} s="#7a5b14" />)}
    <P d="M-130 -290 L130 -290" w={4} s="#7a5b14" />
    <P d="M22 -200 Q22 -250 56 -250 Q90 -250 90 -200 L90 0 L22 0Z" f="#e8c25a" w={5} />
    <P d="M38 -190 Q38 -228 56 -228 Q74 -228 74 -190 L74 -20 L38 -20Z" f="#c99a2e" w={3} />
    <E x={74} y={-100} rx={4} ry={4} f="#7a5b14" w={2} />
    {[-90, -50, -10].map((x) => <P key={x} d={`M${x} -270 L${x} 0`} w={2} s="#3d3a44" o={.7} />)}
    <P d="M-130 -4 L130 -4 L250 28" w={4} s="#6b665c" />
  </g>
);

/** plaza with orbiting pilgrims; the seated pair stands in front of this */
export const KaabaPlaza: React.FC<{t: number; time?: 'day' | 'dusk'}> = ({t, time = 'day'}) => {
  const n = 9, cx = 540, cy = 1060, rx = 420, ry = 72;
  const ring = [...Array(n)].map((_, i) => {
    const a = t * .42 + (i / n) * Math.PI * 2, sx = cx + Math.cos(a) * rx, sy = cy + Math.sin(a) * ry, d = (Math.sin(a) + 1) / 2;
    return {sx, sy, s: .55 + .35 * d, front: Math.sin(a) > 0, flip: Math.cos(a) < 0, i};
  });
  const dusk = time === 'dusk';
  return (
    <g>
      <Sky id="kz-sky" a={dusk ? '#f2a56a' : '#8cc7ea'} b={dusk ? '#fbe0b0' : '#f6efd9'} h={900} />
      <circle cx={880} cy={250} r={dusk ? 110 : 80} fill={dusk ? '#fff0b8' : '#fff4c2'} stroke={INK} strokeWidth={4} />
      <Cloud x={190} y={210} s={1.1} /><Cloud x={600} y={330} s={.8} />
      <Minaret x={90} base={880} h={560} /><Minaret x={990} base={880} h={560} /><Minaret x={-180} base={880} h={440} /><Minaret x={1260} base={880} h={440} />
      <P d="M-500 640 L1580 640 L1580 900 L-500 900Z" f="#f1e4c8" />
      <P d="M-500 640 L1580 640 L1580 672 L-500 672Z" f="#d9b869" />
      {[...Array(26)].map((_, i) => <P key={i} d={`M${-470 + i * 82} 900 L${-470 + i * 82} 750 Q${-440 + i * 82} 704 ${-410 + i * 82} 750 L${-410 + i * 82} 900Z`} f="#7d6a52" w={3} />)}
      <defs><linearGradient id="kz-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#efe3c8" /><stop offset="1" stopColor="#d6c4a0" /></linearGradient></defs>
      <rect x={-800} y={900} width={2680} height={1500} fill="url(#kz-floor)" stroke={INK} strokeWidth={4} />
      {[...Array(9)].map((_, i) => <ellipse key={i} cx={540} cy={1060} rx={500 + i * 130} ry={100 + i * 66} fill="none" stroke="#c9b58c" strokeWidth={3} opacity={.75} />)}
      {ring.filter((r) => !r.front).map((r) => <Pilgrim key={r.i} x={r.sx} y={r.sy} s={r.s * .95} flip={r.flip} />)}
      <Kaaba cx={540} gy={1010} s={1.15} />
      {ring.filter((r) => r.front).map((r) => <Pilgrim key={r.i} x={r.sx} y={r.sy} s={r.s * .95} flip={r.flip} />)}
    </g>
  );
};

/** close shot of the corner with the Black Stone in its silver frame; green light strip on the pillar */
export const BlackStoneWall: React.FC<{t: number}> = ({t}) => (
  <g>
    <Sky id="bs-sky" a="#8cc7ea" b="#f6efd9" h={700} />
    <P d="M-500 560 L1580 560 L1580 820 L-500 820Z" f="#f1e4c8" />
    {[...Array(14)].map((_, i) => <P key={i} d={`M${-400 + i * 150} 820 L${-400 + i * 150} 700 Q${-360 + i * 150} 650 ${-320 + i * 150} 700 L${-320 + i * 150} 820Z`} f="#7d6a52" w={3} />)}
    <rect x={-800} y={820} width={2680} height={1300} fill="#e3d4b3" stroke={INK} strokeWidth={4} />
    {[...Array(7)].map((_, i) => <ellipse key={i} cx={540} cy={1480} rx={560 + i * 150} ry={120 + i * 70} fill="none" stroke="#c9b58c" strokeWidth={3} opacity={.7} />)}
    <P d="M300 140 L840 100 L840 1180 L300 1180Z" f="#232127" w={6} />
    <P d="M840 100 L1400 160 L1400 1220 L840 1180Z" f="#15131a" w={6} />
    {[...Array(7)].map((_, i) => <P key={i} d={`M${330 + i * 76} 140 L${330 + i * 76} 1180`} w={2} s="#3d3a44" o={.7} />)}
    <P d="M300 520 L840 500 L840 590 L300 610Z" f="#e0b44a" w={4} /><P d="M840 500 L1400 530 L1400 620 L840 590Z" f="#c79b36" w={4} />
    <P d="M640 640 Q640 560 760 560 L880 560 Q990 560 990 650 L990 850 Q990 930 880 930 L760 930 Q640 930 640 850Z" f="#c7ccd2" w={7} />
    <P d="M672 660 Q672 596 770 596 L870 596 Q954 596 954 660 L954 842 Q954 896 870 896 L770 896 Q672 896 672 842Z" f="#3a2a26" w={4} />
    <P d="M700 700 Q760 690 790 740 Q760 790 700 770Z M830 650 Q910 650 930 720 Q900 790 840 770Z M760 820 Q830 800 900 840 Q860 880 770 870Z" f="#5a3f38" w={2.5} o={.9} />
    <g>
      <rect x={60} y={560} width={70} height={520} fill="#e8e0cc" stroke={INK} strokeWidth={5} />
      <rect x={78} y={610} width={34} height={150} rx={10} fill="#4be38a" stroke={INK} strokeWidth={4} />
      <circle cx={95} cy={685} r={60 + 6 * Math.sin(t * 3)} fill="#4be38a" opacity={.25} />
    </g>
    {[0, 1, 2, 3].map((i) => <Pilgrim key={i} x={1100 - i * 120 + 12 * Math.sin(t + i)} y={1020 + i * 30} s={.9 - i * .08} flip arms={i === 1 ? .5 + .5 * Math.sin(t * 2) : 0} />)}
  </g>
);

/** the Mas'a: a long hall with arches, the two hills at the ends and green posts marking the running stretch */
export const SaiHall: React.FC<{t: number}> = ({t}) => (
  <g>
    <Sky id="sa-sky" a="#cfe6f2" b="#f7f0dc" h={760} />
    <P d="M-300 360 L1380 360 L1380 900 L-300 900Z" f="#efe3c8" />
    {[...Array(7)].map((_, i) => <P key={i} d={`M${-250 + i * 220} 900 L${-250 + i * 220} 560 Q${-180 + i * 220} 470 ${-110 + i * 220} 560 L${-110 + i * 220} 900Z`} f="#7d6a52" w={4} />)}
    <P d="M-300 340 L1380 340 L1380 392 L-300 392Z" f="#d9b869" />
    <defs><linearGradient id="sa-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ece0c4" /><stop offset="1" stopColor="#d1be98" /></linearGradient></defs>
    <rect x={-800} y={900} width={2680} height={1300} fill="url(#sa-floor)" stroke={INK} strokeWidth={4} />
    <P d="M540 900 L90 2000 M540 900 L990 2000 M540 900 L540 2000" w={3} s="#b39d72" />
    <P d="M120 640 Q220 520 330 600 Q420 520 520 640 L520 900 L120 900Z" f="#b9a58a" w={5} />
    <P d="M560 640 Q660 520 770 600 Q860 520 960 640 L960 900 L560 900Z" f="#b9a58a" w={5} />
    {[0, 1].map((k) => (
      <g key={k} transform={`translate(${k ? 780 : 320} 900)`}>
        <rect x={-14} y={-210} width={28} height={210} fill="#e8e0cc" stroke={INK} strokeWidth={4} />
        <rect x={-8} y={-190} width={16} height={90} rx={6} fill="#4be38a" stroke={INK} strokeWidth={3} />
      </g>
    ))}
    {[0, 1, 2, 3, 4].map((i) => <Pilgrim key={i} x={140 + ((i * 190 + t * 38) % 860)} y={1000 + (i % 3) * 36} s={.5 + (i % 3) * .06} flip={i % 2 === 0} />)}
  </g>
);

/** Arafat: the hill of mercy with the white pillar, a plain of white-clad men with raised hands */
export const Arafat: React.FC<{t: number}> = ({t}) => (
  <g>
    <Sky id="ar-sky" a="#7fc3ea" b="#fbeccd" h={900} />
    <circle cx={160} cy={220} r={96} fill="#fff1a8" stroke={INK} strokeWidth={4} />
    <Cloud x={600} y={250} s={1.2} /><Cloud x={920} y={400} s={.8} />
    <P d="M-200 1000 L200 640 L330 700 L520 380 L700 560 L860 450 L1300 1000Z" f="#c9a77a" w={6} />
    <P d="M520 380 L610 480 L560 540 L470 470Z" f="#b58d5e" w={3} /><P d="M200 640 L260 760 L150 800Z" f="#b58d5e" w={3} />
    <P d="M508 330 L532 330 L536 420 L504 420Z" f="#fffdf5" w={4} /><P d="M504 420 L536 420 L540 440 L500 440Z" f="#d9d2bf" w={3} />
    <rect x={-800} y={980} width={2680} height={1200} fill="#e2c890" stroke={INK} strokeWidth={4} />
    <P d="M-100 1100 Q540 1020 1180 1100" w={3} s="#c3a56c" /><P d="M-100 1300 Q540 1210 1180 1300" w={3} s="#c3a56c" />
    {[...Array(14)].map((_, i) => <Pilgrim key={i} x={60 + i * 74 + (i % 2) * 14} y={1060 + (i % 4) * 46} s={.46 + (i % 4) * .08} flip={i % 3 === 0} arms={.5 + .5 * Math.sin(t * 1.4 + i)} />)}
  </g>
);

/** Muzdalifah / Mina: tents and the stoning pillar, calm evening */
export const MinaJamarat: React.FC<{t: number}> = ({t}) => (
  <g>
    <Sky id="mi-sky" a="#5b6aa8" b="#f6c493" h={920} />
    <path d="M820 220 a70 70 0 1 0 60 120 a56 56 0 1 1 -60 -120z" fill="#fff4c9" stroke={INK} strokeWidth={4} />
    {[[140, 180], [330, 320], [560, 140], [700, 260], [960, 480], [90, 460]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={4 + (i % 2) * 2} fill="#fff7d9" opacity={.6 + .4 * Math.sin(t * 2 + i)} />)}
    <P d="M-300 920 L-100 780 L120 920Z" f="#f8f1de" w={4} /><P d="M80 920 L260 800 L440 920Z" f="#f8f1de" w={4} /><P d="M700 920 L900 790 L1100 920Z" f="#f8f1de" w={4} /><P d="M1000 920 L1180 810 L1380 920Z" f="#f8f1de" w={4} />
    <rect x={-800} y={900} width={2680} height={1300} fill="#cdb998" stroke={INK} strokeWidth={4} />
    <P d="M-100 1000 Q540 940 1180 1000" w={3} s="#a99771" />
    <g transform="translate(540 1000)">
      <P d="M-70 0 L-50 -420 Q0 -450 50 -420 L70 0Z" f="#bdb6a8" w={6} />
      <P d="M-50 -330 L50 -330 M-56 -200 L56 -200 M-62 -90 L62 -90" w={3} s="#8c8576" />
      <E x={0} y={6} rx={250} ry={52} f="#cfc6b3" w={5} />
      <E x={0} y={6} rx={220} ry={38} f="#a9a08c" w={3} />
      {[...Array(18)].map((_, i) => <E key={i} x={-190 + i * 22 + (i % 3) * 5} y={8 + (i % 4) * 9 - 12} rx={6} ry={4} f="#7d7364" w={1.5} />)}
    </g>
    {[0, 1, 2].map((i) => <Pilgrim key={i} x={110 + i * 120} y={1330 + (i % 2) * 40} s={.8} />)}
  </g>
);

/** a mosque courtyard (stone floor, arched facade, dome, two minarets, palms) for everyday talk scenes */
export const MosqueYard: React.FC<{t: number}> = ({t}) => (
  <g>
    <Sky id="my-sky" a="#8cc7ea" b="#f6efd9" h={900} />
    <circle cx={160} cy={240} r={80} fill="#fff4c2" stroke={INK} strokeWidth={4} />
    <Cloud x={560} y={260} s={1.1} /><Cloud x={900} y={430} s={.8} />
    <Minaret x={150} base={900} h={620} /><Minaret x={930} base={900} h={620} />
    <P d="M260 900 L260 560 L820 560 L820 900Z" f="#f3e8d0" w={5} />
    <P d="M320 560 Q320 330 540 300 Q760 330 760 560Z" f="#6f9f86" w={6} />
    <P d="M540 300 L540 240 M520 258 L560 258" w={5} s="#c99a2e" />
    <P d="M440 900 L440 700 Q540 610 640 700 L640 900Z" f="#7d6a52" w={5} />
    {[300, 360, 700, 760].map((x) => <P key={x} d={`M${x - 24} 900 L${x - 24} 700 Q${x} 650 ${x + 24} 700 L${x + 24} 900Z`} f="#a79678" w={4} />)}
    <P d="M260 560 L820 560" w={6} /><P d="M240 548 L840 548 L820 560 L260 560Z" f="#d9b869" w={4} />
    <defs><linearGradient id="my-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#efe3c8" /><stop offset="1" stopColor="#d6c4a0" /></linearGradient></defs>
    <rect x={-800} y={900} width={2680} height={1300} fill="url(#my-floor)" stroke={INK} strokeWidth={4} />
    {[...Array(9)].map((_, i) => <P key={i} d={`M${-600 + i * 250} 900 L${-1100 + i * 380} 2200`} w={3} s="#c9b58c" />)}
    {[1050, 1250, 1520, 1850].map((y) => <P key={y} d={`M-800 ${y} L1880 ${y}`} w={3} s="#c9b58c" />)}
    {[0, 1].map((k) => (
      <g key={k} transform={`translate(${k ? 960 : 120} 1010)`}>
        <P d="M0 0 L-4 -150 M0 -150 Q-60 -170 -80 -120 M0 -150 Q60 -170 80 -120 M0 -150 Q-20 -230 -50 -240 M0 -150 Q20 -230 50 -240" w={5} s="#3f6a4a" />
        <path d="M-26 0 L-20 -52 L20 -52 L26 0Z" fill="#c0764a" stroke={INK} strokeWidth={4} />
      </g>
    ))}
    {[0, 1, 2].map((i) => <Pilgrim key={i} x={640 + i * 100 + 14 * Math.sin(t * .6 + i)} y={1040 + (i % 2) * 30} s={.5 - i * .03} flip={i % 2 === 0} />)}
  </g>
);
