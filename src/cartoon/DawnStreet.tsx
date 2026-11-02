import React from "react";

const INK = "#141414";
const mix = (a: string, b: string, u: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * u).toString(16).padStart(2, "0")).join("");
};
const ease = (u: number) => u * u * (3 - 2 * u);

/** Dawn street with the neighbourhood mosque (left) — world 1080×1920, ground line for characters at y≈1235. p = 0 (before Fajr) → 1 (first light). */
export const Street: React.FC<{p: number}> = ({p}) => {
  const e = ease(Math.max(0, Math.min(1, p)));
  const top = mix("#16224d", "#6b93c4", e), mid = mix("#2f4b84", "#ecb987", e), hor = mix("#5d72a4", "#ffdca8", e);
  const warm = 0.55 + 0.45 * (1 - e); // lit windows fade a little as the light comes
  const lamp = Math.max(0, 1 - Math.max(0, e - 0.55) * 2.2);
  const star = Math.max(0, 1 - e * 1.9);
  const stone = mix("#d8cbb0", "#efe2c6", e * 0.4);
  const wall = mix("#bdae98", "#d8c7ac", e * 0.6), wall2 = mix("#a39078", "#c0ad92", e * 0.6);
  const win = (x: number, y: number, w = 38, h = 58, lit = true) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={w} height={h} rx={w / 2} fill={lit ? mix("#ffd88a", "#ffe9b8", e * 0.5) : mix("#24304f", "#587099", e)} stroke={INK} strokeWidth={4} opacity={lit ? warm : 1} />
      <path d={`M${x + w / 2} ${y} V${y + h} M${x} ${y + h * 0.5} H${x + w}`} stroke={INK} strokeWidth={2.5} opacity={0.55} />
    </g>
  );
  return (
    <g>
      <defs>
        <linearGradient id="df-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} /><stop offset="0.55" stopColor={mid} /><stop offset="1" stopColor={hor} />
        </linearGradient>
        <radialGradient id="df-lampglow"><stop offset="0" stopColor="#ffe6a0" stopOpacity={0.85} /><stop offset="1" stopColor="#ffe6a0" stopOpacity={0} /></radialGradient>
        <radialGradient id="df-doorglow" cx="0.5" cy="0.2" r="0.8"><stop offset="0" stopColor="#ffe29a" stopOpacity={0.8} /><stop offset="1" stopColor="#ffe29a" stopOpacity={0} /></radialGradient>
        <linearGradient id="df-green" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3aa58c" /><stop offset="1" stopColor="#1f6e5d" /></linearGradient>
        <linearGradient id="df-road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={mix("#4b5062", "#6a6f80", e)} /><stop offset="1" stopColor={mix("#33374a", "#50556a", e)} /></linearGradient>
      </defs>
      <rect x={-320} y={-1000} width={1720} height={3240} fill="url(#df-sky)" />
      {/* stars + moon fade with the first light */}
      <g opacity={star}>
        {[[120, 330], [260, 470], [410, 300], [620, 380], [740, 260], [930, 440], [1010, 300], [820, 540], [540, 520]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 ? 3 : 4.5} fill="#fff4d0" />)}
        <path d="M900 300 a46 46 0 1 0 38 70 a36 36 0 1 1 -38 -70Z" fill="#fff0c0" stroke={INK} strokeWidth={4} />
      </g>
      {/* the sun comes up behind the skyline as Fajr turns to light */}
      {e > 0.5 && (() => { const k = (e - 0.5) * 2, y = 1030 - 190 * k; return (
        <g>
          <circle cx={760} cy={y} r={230} fill="url(#df-lampglow)" opacity={0.55 * k} />
          <circle cx={760} cy={y} r={72} fill="#ffe9a8" stroke={INK} strokeWidth={5} opacity={0.95} />
        </g>); })()}
      {/* far skyline */}
      <path d={`M-320 1000 V840 H-120 V780 H0 V860 H120 V740 H220 V820 H640 V770 H760 V830 H900 V720 H1010 V800 H1180 V860 H1400 V1000Z`} fill={mix("#27355d", "#8f9bb8", e * 0.7)} opacity={0.9} />
      {/* houses on the right */}
      <g>
        <rect x={560} y={690} width={300} height={330} fill={wall} stroke={INK} strokeWidth={5} />
        <rect x={860} y={760} width={360} height={260} fill={wall2} stroke={INK} strokeWidth={5} />
        <rect x={548} y={676} width={324} height={26} fill={mix("#7a6a56", "#9a8870", e * 0.5)} stroke={INK} strokeWidth={5} />
        {[0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => win(595 + c * 90, 735 + r * 90, 38, 58, (r * 3 + c) % 4 !== 1)))}
        {[0, 1].flatMap((r) => [0, 1, 2].map((c) => win(895 + c * 110, 800 + r * 95, 42, 60, (r + c) % 2 === 0)))}
        <rect x={650} y={915} width={70} height={105} rx={6} fill="#6a4a36" stroke={INK} strokeWidth={5} />
      </g>
      {/* the neighbourhood mosque */}
      <g>
        <rect x={40} y={770} width={390} height={250} fill={mix("#ebdfc4", "#f6ecd6", e * 0.5)} stroke={INK} strokeWidth={6} />
        <rect x={40} y={770} width={390} height={26} fill="#cdbd99" stroke={INK} strokeWidth={5} />
        {/* dome */}
        <path d="M88 770 C88 640 160 585 235 585 C310 585 382 640 382 770Z" fill="url(#df-green)" stroke={INK} strokeWidth={6} />
        <path d="M130 740 C135 665 170 625 215 612" fill="none" stroke="#9be0cb" strokeWidth={8} strokeLinecap="round" opacity={0.65} />
        <path d="M235 585 V552" stroke={INK} strokeWidth={6} />
        <path d="M235 520 a26 26 0 1 0 22 40 a20 20 0 1 1 -22 -40Z" fill="#f4c542" stroke={INK} strokeWidth={4} />
        {/* minaret */}
        <rect x={440} y={400} width={62} height={620} fill={mix("#efe3c8", "#fbf2dc", e * 0.5)} stroke={INK} strokeWidth={6} />
        <rect x={426} y={500} width={90} height={22} rx={6} fill="#cdbd99" stroke={INK} strokeWidth={5} />
        <rect x={436} y={430} width={70} height={70} fill={mix("#efe3c8", "#fbf2dc", e * 0.5)} stroke={INK} strokeWidth={5} />
        <path d="M430 430 L471 345 L512 430Z" fill="url(#df-green)" stroke={INK} strokeWidth={6} />
        <path d="M471 345 V318" stroke={INK} strokeWidth={5} />
        <path d="M471 290 a20 20 0 1 0 17 31 a15 15 0 1 1 -17 -31Z" fill="#f4c542" stroke={INK} strokeWidth={4} />
        {win(452, 585, 38, 70, true)}{win(452, 700, 38, 70, true)}
        {/* arched windows + lit door */}
        {win(80, 840, 56, 92, true)}{win(158, 840, 56, 92, true)}{win(256, 840, 56, 92, true)}{win(334, 840, 56, 92, true)}
        <path d="M188 1020 V930 a47 47 0 0 1 94 0 V1020Z" fill="#ffdf94" stroke={INK} strokeWidth={6} opacity={0.55 + 0.45 * warm} />
        <path d="M235 885 V1020" stroke={INK} strokeWidth={3} opacity={0.5} />
        <ellipse cx={235} cy={1080} rx={170} ry={46} fill="url(#df-doorglow)" opacity={warm} />
      </g>
      {/* pavement + road */}
      <rect x={-320} y={1010} width={1720} height={300} fill={stone} stroke={INK} strokeWidth={5} />
      {Array.from({length: 18}, (_, i) => <path key={i} d={`M${-300 + i * 100} 1010 L${-340 + i * 105} 1310`} stroke="#a89a7e" strokeWidth={3} opacity={0.55} />)}
      <path d="M-320 1090 H1400 M-320 1180 H1400" stroke="#a89a7e" strokeWidth={3} opacity={0.5} />
      <rect x={-320} y={1296} width={1720} height={26} fill="#9d9078" stroke={INK} strokeWidth={5} />
      <rect x={-320} y={1322} width={1720} height={1000} fill="url(#df-road)" />
      <path d="M-320 1700 H1400" stroke="#f4e7b0" strokeWidth={14} strokeDasharray="110 90" opacity={0.85} />
      {/* lamp */}
      <g>
        <ellipse cx={560} cy={640} rx={230} ry={230} fill="url(#df-lampglow)" opacity={lamp} />
        <path d="M560 1030 V600 Q560 560 600 560 H640" fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" />
        <path d="M560 1030 V600 Q560 560 600 560 H640" fill="none" stroke="#5b5d6a" strokeWidth={6} strokeLinecap="round" />
        <path d="M618 565 H666 L654 598 H630Z" fill={mix("#ffe9a8", "#cfcfcf", 1 - lamp)} stroke={INK} strokeWidth={4} />
      </g>
    </g>
  );
};

/** Al-Aqsa compound: Dome of the Rock (gold dome on the blue octagon) and the grey-domed Qibli prayer hall — drawn, not photographic. 640×440. */
export const AqsaArt: React.FC = () => (
  <g>
    <defs>
      <linearGradient id="df-aq-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8fd0ee" /><stop offset="1" stopColor="#ffe2b0" /></linearGradient>
      <linearGradient id="df-aq-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffe27a" /><stop offset="1" stopColor="#d9a21f" /></linearGradient>
    </defs>
    <rect width={640} height={440} fill="url(#df-aq-sky)" />
    <circle cx={110} cy={90} r={34} fill="#fff6cf" stroke={INK} strokeWidth={4} />
    {/* platform */}
    <path d="M0 360 H640 V440 H0Z" fill="#e6d4ad" stroke={INK} strokeWidth={5} />
    {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${20 + i * 110} 360 L${-10 + i * 120} 440`} stroke="#b8a37a" strokeWidth={3} />)}
    {/* trees */}
    {[[52, 330], [596, 336]].map(([x, y], i) => <path key={i} d={`M${x} ${y + 30} C${x - 34} ${y - 10} ${x - 14} ${y - 90} ${x} ${y - 120} C${x + 14} ${y - 90} ${x + 34} ${y - 10} ${x} ${y + 30}Z`} fill="#2d6b49" stroke={INK} strokeWidth={4} />)}
    {/* Qibli hall */}
    <rect x={410} y={268} width={190} height={92} fill="#d8cfc0" stroke={INK} strokeWidth={5} />
    <path d="M410 268 H600" stroke="#9aa3ad" strokeWidth={14} />
    {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${428 + i * 34} 360 V318 a12 12 0 0 1 24 0 V360Z`} fill="#6e6a62" stroke={INK} strokeWidth={3} />)}
    <path d="M458 268 C458 220 486 206 505 206 C524 206 552 220 552 268Z" fill="#9aa3ad" stroke={INK} strokeWidth={5} />
    <path d="M505 206 V190" stroke={INK} strokeWidth={4} />
    {/* Dome of the Rock */}
    <path d="M178 360 V262 L212 232 H388 L422 262 V360Z" fill="#2b6fa8" stroke={INK} strokeWidth={5} />
    {[0, 1, 2, 3, 4, 5, 6].map((i) => <path key={i} d={`M${200 + i * 32} 360 V300 a11 11 0 0 1 22 0 V360Z`} fill="#8fc1e6" stroke={INK} strokeWidth={3} />)}
    <path d="M178 262 L212 232 H388 L422 262" fill="none" stroke="#f4c542" strokeWidth={9} strokeLinejoin="round" />
    <rect x={240} y={196} width={120} height={40} fill="#2b6fa8" stroke={INK} strokeWidth={5} />
    <path d="M236 200 C236 120 270 86 300 86 C330 86 364 120 364 200Z" fill="url(#df-aq-gold)" stroke={INK} strokeWidth={5} />
    <path d="M262 190 C262 140 276 112 296 100" fill="none" stroke="#fff3b0" strokeWidth={7} strokeLinecap="round" opacity={0.8} />
    <path d="M300 86 V62" stroke={INK} strokeWidth={5} />
    <path d="M300 38 a20 20 0 1 0 17 31 a15 15 0 1 1 -17 -31Z" fill="#f4c542" stroke={INK} strokeWidth={4} />
  </g>
);
