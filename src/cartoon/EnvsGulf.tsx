import React from 'react';
import {Pa, Re, El, INK} from './EnvsOffice';

/** Night street with a mosque, workshop, offices, a low tinted car with big rims, and small props for the Areefi film. World = 1080×1920 screen, extended sideways. Feet line ≈ y 1600. */
const KUFI = '"Noto Kufi Arabic", sans-serif';

export const NightStreet: React.FC<{t: number}> = ({t}) => (
  <g>
    <defs><linearGradient id="ns-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0f1b3a" /><stop offset="1" stopColor="#35508a" /></linearGradient></defs>
    <Re x={-900} y={-800} w={2880} h={2300} f="url(#ns-sky)" sw={0} />
    {[...Array(26)].map((_, i) => <El key={i} x={-600 + (i * 211) % 2300} y={-100 + (i * 97) % 900} rx={3.5} ry={3.5} f="#fff6d6" w={0} />)}
    <El x={880} y={330} rx={70} ry={70} f="#f6e7a8" w={0} /><El x={910} y={310} rx={62} ry={62} f="#0f1b3a" w={0} />
    {/* mosque */}
    <Re x={-120} y={760} w={560} h={640} f="#d8cdb4" sw={7} />
    <Pa d="M-60 760 Q160 520 380 760Z" f="#9fb6a0" w={7} /><El x={160} y={560} rx={16} ry={16} f="#f2c14e" w={4} />
    <Re x={440} y={420} w={80} h={980} f="#d8cdb4" sw={7} /><Pa d="M430 420 L480 300 L530 420Z" f="#9fb6a0" w={7} /><El x={480} y={285} rx={10} ry={10} f="#f2c14e" w={4} />
    {[0, 1, 2].map((i) => <Pa key={i} d={`M${20 + i * 150} 1400 L${20 + i * 150} 1130 Q${70 + i * 150} 1060 ${120 + i * 150} 1130 L${120 + i * 150} 1400`} f="#fdf3b8" w={5} />)}
    {/* ground */}
    <Re x={-900} y={1400} w={2880} h={120} f="#9a958a" sw={7} /><Re x={-900} y={1520} w={2880} h={600} f="#3d3f48" sw={7} />
    <Pa d="M-900 1760 L1980 1760" w={12} s="#d9d2b0" />
    {/* lamp post */}
    <g transform="translate(900 1400)"><Re x={-12} y={-560} w={24} h={560} f="#2f3640" sw={6} /><Re x={-60} y={-600} w={120} h={44} f="#2f3640" sw={6} rx={10} /><El x={0} y={-552} rx={36} ry={14} f="#fff1a8" w={4} />
      <Pa d="M-34 -540 L-190 0 L190 0 L34 -540Z" f="#fff1a8" w={0} o={.18 + .03 * Math.sin(t * 6)} /></g>
  </g>
);

/** a side-view low sedan with tinted windows and oversized rims (drawn in front, so people behind its windows show through the tint) */
export const Car: React.FC<{x: number; y: number; s?: number; flip?: boolean}> = ({x, y, s = 1, flip}) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    <path d="M-250 -46 L-250 -120 Q-250 -146 -222 -152 L-150 -162 L-96 -214 Q-84 -230 -62 -230 L112 -230 Q138 -230 152 -210 L190 -162 L232 -152 Q258 -146 258 -118 L258 -46Z M-92 -206 L-136 -162 L-12 -162 L-12 -214Z M10 -214 L10 -162 L152 -162 L122 -206Z" fill="#b3262a" fillRule="evenodd" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <Pa d="M-92 -206 L-136 -162 L-12 -162 L-12 -214Z" f="#10161d" w={5} o={.4} /><Pa d="M10 -214 L10 -162 L152 -162 L122 -206Z" f="#10161d" w={5} o={.4} />
    <Re x={-232} y={-48} w={472} h={34} f="#17181b" sw={0} />
    <Pa d="M-3 -222 L-3 -50" w={4} /><Pa d="M-224 -118 L-250 -112 M230 -118 L258 -112" w={5} s="#e8e2cf" />
    <El x={236} y={-122} rx={16} ry={10} f="#fff1a8" w={4} /><El x={-240} y={-120} rx={8} ry={12} f="#c0392b" w={4} />
    {[-150, 150].map((wx) => <g key={wx} transform={`translate(${wx} -64)`}><El x={0} y={0} rx={66} ry={66} f="#17181b" w={7} /><El x={0} y={0} rx={50} ry={50} f="#d8dde3" w={5} />{[0, 1, 2, 3, 4].map((k) => <Pa key={k} d={`M0 0 L${46 * Math.cos(k * 1.2566)} ${46 * Math.sin(k * 1.2566)}`} w={7} s="#8d96a0" />)}<El x={0} y={0} rx={9} ry={9} f="#434a52" w={3} /></g>)}
    <Pa d="M-250 -50 L258 -50" w={6} />
  </g>
);

/** workshop / dawah office / residency office backgrounds (feet line ≈ y 1600) */
export const Room: React.FC<{kind: 'workshop' | 'dawah' | 'iqama'; t: number}> = ({kind, t}) => (
  <g>
    <Re x={-900} y={-800} w={2880} h={2300} f={kind === 'workshop' ? '#cfc7b4' : kind === 'dawah' ? '#e9dcc0' : '#d7e3e8'} sw={0} />
    <Re x={-900} y={1400} w={2880} h={700} f={kind === 'workshop' ? '#7d7a74' : '#a98a63'} sw={7} />
    {kind === 'workshop' && <>
      <Re x={60} y={380} w={560} h={640} f="#9aa3a8" sw={7} />{[0, 1, 2, 3, 4, 5].map((i) => <Pa key={i} d={`M60 ${440 + i * 100} L620 ${440 + i * 100}`} w={5} s="#7d868b" />)}
      <Re x={760} y={560} w={300} h={380} f="#7a5a3a" sw={7} />{[0, 1, 2, 3].map((i) => <g key={i}><Pa d={`M790 ${640 + i * 85} L1030 ${640 + i * 85}`} w={5} /><Re x={800 + i * 50} y={600 + i * 85 - 60} w={26} h={90} f={['#d94a3c', '#2f6f9f', '#f2c14e', '#5aa469'][i]} sw={4} rx={4} /></g>)}
      <g transform="translate(-30 1400)">{[0, 1, 2].map((i) => <El key={i} x={90} y={-34 - i * 60} rx={92} ry={30} f="#17181b" w={6} />)}</g>
      <Re x={880} y={1250} w={150} h={150} f="#2f6f9f" sw={7} rx={10} /><Pa d="M880 1300 L1030 1300 M880 1350 L1030 1350" w={5} />
    </>}
    {kind === 'dawah' && <>
      <Re x={40} y={300} w={460} h={680} f="#8a5a34" sw={7} />{[0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4, 5].map((c) => <Re key={r + '-' + c} x={60 + c * 72} y={330 + r * 160} w={58} h={120} f={['#2e8b57', '#c0392b', '#2f6f9f', '#f2c14e', '#7a4f9a', '#5aa469'][(r + c) % 6]} sw={4} />))}
      <Re x={600} y={300} w={400} h={110} f="#2e8b57" sw={7} rx={14} /><text x={800} y={378} fontSize={64} fontWeight={800} fill="#fffaf0" textAnchor="middle" fontFamily={KUFI}>مكتب الدعوة</text>
      <Re x={560} y={1180} w={520} h={60} f="#6e4526" sw={7} /><Re x={580} y={1240} w={480} h={200} f="#8a5a34" sw={7} />
    </>}
    {kind === 'iqama' && <>
      <Re x={40} y={300} w={460} h={340} f="#f4f1e4" sw={7} /><text x={270} y={400} fontSize={60} fontWeight={800} fill="#2f6f9f" textAnchor="middle" fontFamily={KUFI}>الإقامات</text>
      <Pa d="M80 450 L460 450 M80 510 L460 510 M80 570 L400 570" w={6} s="#9aa7ad" />
      <Re x={520} y={1130} w={600} h={70} f="#6e4526" sw={7} /><Re x={540} y={1200} w={560} h={240} f="#8a5a34" sw={7} />
      <Re x={560} y={800} w={520} h={330} f="#b9d4e0" sw={7} /><Pa d="M820 800 L820 1130" w={6} />
    </>}
  </g>
);

/** a residency card whose religion line is stamped over: «هندوسي» struck, «مسلم» appears */
export const IqamaCard: React.FC<{x: number; y: number; t: number; at: number; s?: number}> = ({x, y, t, at, s = 1}) => {
  const k = Math.min(1, Math.max(0, (t - at) / .3));
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Re x={-230} y={-140} w={460} h={280} f="#f6f2de" sw={8} rx={22} />
      <Re x={-210} y={-120} w={120} h={150} f="#cfd8e8" sw={5} rx={10} /><El x={-150} y={-70} rx={30} ry={30} f="#e0b890" w={4} /><Pa d="M-195 20 Q-150 -20 -105 20Z" f="#9aa7ad" w={4} />
      <text x={200} y={-70} fontSize={34} fontWeight={800} fill="#2f3640" textAnchor="end" fontFamily={KUFI}>الاسم: عامل</text>
      <text x={200} y={-12} fontSize={34} fontWeight={800} fill="#2f3640" textAnchor="end" fontFamily={KUFI}>الديانة:</text>
      <text x={30} y={-12} fontSize={40} fontWeight={800} fill="#2f3640" textAnchor="end" fontFamily={KUFI}>هندوسي</text>
      {k > 0 && <Pa d={`M30 -24 L${30 - 130 * k} -24`} w={6} s="#8a1d1d" />}
      {k >= 1 && <text x={-20} y={60} fontSize={56} fontWeight={800} fill="#2e8b57" textAnchor="middle" fontFamily={KUFI}>مسلم</text>}
    </g>
  );
};

/** a wall calendar whose pages flip (2–3 weeks pass) */
export const CalendarFlip: React.FC<{x: number; y: number; t: number; at: number; s?: number}> = ({x, y, t, at, s = 1}) => {
  const n = Math.min(3, Math.max(0, Math.floor((t - at) / .5))), ph = ((t - at) % .5) / .5;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Re x={-170} y={-210} w={340} h={420} f="#fffaf0" sw={8} rx={14} /><Re x={-170} y={-210} w={340} h={80} f="#c0392b" sw={8} rx={14} />
      {[-110, -40, 40, 110].map((cx) => <El key={cx} x={cx} y={-210} rx={9} ry={9} f="#2f3640" w={4} />)}
      <text x={0} y={30} fontSize={70} fontWeight={800} fill="#2f3640" textAnchor="middle" fontFamily={KUFI}>أسبوع</text><text x={0} y={130} fontSize={84} fontWeight={800} fill="#c0392b" textAnchor="middle" fontFamily={KUFI}>{['الأول', 'الثاني', 'الثالث', 'الثالث'][Math.min(n, 3)]}</text>
      {n < 3 && t >= at && ph < .6 && <Pa d={`M-170 -130 L170 -130 L${170 - 60 * ph} ${80 + 140 * ph} L${-170 + 60 * ph} ${80 + 140 * ph}Z`} f="#fffaf0" w={6} />}
    </g>
  );
};

/** cigarette smoke puffs rising (grey) */
export const Smoke: React.FC<{x: number; y: number; t: number; s?: number}> = ({x, y, t, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[0, 1, 2, 3].map((i) => { const ph = (t * .5 + i / 4) % 1, r = 12 + 22 * ph; return <El key={i} x={14 * Math.sin(t * 2 + i * 2)} y={-ph * 190} rx={r} ry={r * .8} f="#d7dadd" w={4} />; })}
  </g>
);
export {INK};
