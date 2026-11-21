import React from "react";

/**
 * مصغّرات مرسومة بالحبر السيبيا بأسلوب الخرائط القديمة (للموشن التوضيحي التاريخي): فارس وجيش، وجمل وقافلة، ومدن (حرّان، دمشق، القاهرة،
 * الإسكندرية بمنارتها، قلعة)، وقضبان السجن، وخاتما الطلاق ينكسران، وسفينة. كلها SVG نقي بلا صور ولا أسود صرف؛ الحركة دوال من الزمن.
 */
export const MINI = { ink: "#5a4025", ink2: "#7a5a38", horse: "#8b6a43", cloth: "#b5402f", cloth2: "#2a8a8f", sand: "#f3e2b8", sand2: "#e6c98d", sand3: "#cfae6f", dome: "#6fa7a0", iron: "#8a7358", ironHi: "#c2ab86" };

/* ---------- نقطة ومماس على منحنى تربيعي (للحركة على المسار) ---------- */
export const qPoint = (a: { x: number; y: number }, b: { x: number; y: number }, bend: number, u: number) => {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y;
  const cx = mx - dy * bend, cy = my + dx * bend;
  const x = (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * cx + u * u * b.x;
  const y = (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * cy + u * u * b.y;
  const tx = 2 * (1 - u) * (cx - a.x) + 2 * u * (b.x - cx), ty = 2 * (1 - u) * (cy - a.y) + 2 * u * (b.y - cy);
  return { x, y, ang: Math.atan2(ty, tx) };
};

/* ---------- فارس راكب (يواجه اليسار افتراضياً) ---------- */
export const Horseman: React.FC<{ s?: number; phase?: number; flip?: boolean; cloth?: string; banner?: boolean }> = ({ s = 90, phase = 0, flip = false, cloth = MINI.cloth, banner }) => {
  const bob = Math.sin(phase) * 3, leg = Math.sin(phase) * 10;
  return (
    <svg width={s} height={s * 0.85} viewBox="0 0 120 100" style={{ overflow: "visible", transform: `${flip ? "scaleX(-1)" : ""} translateY(${bob}px)` }}>
      <g stroke={MINI.ink} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M28 54 C28 42 54 40 78 44 C90 46 98 52 96 60 C94 68 80 68 70 66 L44 66 C34 66 28 62 28 54 Z" fill={MINI.horse} />
        <path d="M86 46 C92 36 98 30 104 28 L113 32 C109 36 101 40 97 50 Z" fill={MINI.horse} />
        <path d="M104 28 L106 22 L110 28" fill={MINI.horse} />
        <path d={`M80 66 L${100 + leg} 86 M72 66 L${86 - leg} 92 M44 66 L${26 - leg} 86 M52 66 L${38 + leg} 92`} fill="none" strokeWidth={5} />
        <path d="M28 52 C16 50 8 58 6 72" fill="none" strokeWidth={4} />
        <path d="M60 44 L64 22" fill="none" strokeWidth={8} stroke={cloth} />
        <circle cx={65} cy={15} r={6.5} fill={MINI.sand2} />
        <path d="M58 12 L65 2 L72 12 Z" fill={cloth} />
        <path d="M74 12 Q92 32 74 52" fill="none" strokeWidth={3} />
        <path d="M74 12 L74 52" fill="none" strokeWidth={1.2} />
        {banner && <g><path d="M52 40 L40 -30" fill="none" strokeWidth={3} /><path d="M40 -30 L8 -22 L22 -12 L10 -2 L42 -8 Z" fill={cloth} /></g>}
      </g>
    </svg>
  );
};

/* ---------- جيش يتقدم على مسار: صفوف فرسان وراية وغبار ---------- */
export const Army: React.FC<{ a: { x: number; y: number }; b: { x: number; y: number }; bend: number; u: number; t: number; count?: number; size?: number; seed?: number; toward?: number }> = ({ a, b, bend, u, t, count = 24, size = 96, seed = 1 }) => {
  const lead = qPoint(a, b, bend, u);
  const dir = { x: Math.cos(lead.ang), y: Math.sin(lead.ang) }, perp = { x: -dir.y, y: dir.x };
  const faceLeft = dir.x < 0;
  const items = Array.from({ length: count }, (_, i) => {
    const r = Math.floor(i / 6), c = i % 6;
    const rnd = Math.sin((i + 1) * 12.9898 * seed) * 43758.5453; const j = rnd - Math.floor(rnd);
    const back = r * size * 0.78 + j * size * 0.25;
    const side = (c - 2.5) * size * 0.62 + (j - 0.5) * size * 0.2;
    return { x: lead.x - dir.x * back + perp.x * side, y: lead.y - dir.y * back + perp.y * side, ph: t * 11 + i * 1.7, key: i };
  }).sort((p, q) => p.y - q.y);
  return (
    <g>
      {items.map((p) => <ellipse key={`d${p.key}`} cx={p.x - dir.x * size * 0.55} cy={p.y + size * 0.62} rx={size * 0.55} ry={size * 0.13} fill="#c9a86a" opacity={0.35} />)}
      {items.map((p, idx) => (
        <foreignObject key={p.key} x={p.x - size / 2} y={p.y - size * 0.45} width={size * 1.3} height={size * 1.2} style={{ overflow: "visible" }}>
          <Horseman s={size} phase={p.ph} flip={!faceLeft} banner={idx === items.length - 1} />
        </foreignObject>
      ))}
    </g>
  );
};

/* ---------- جمل وراكب ---------- */
export const Camel: React.FC<{ s?: number; phase?: number; flip?: boolean; load?: boolean }> = ({ s = 110, phase = 0, flip = false, load }) => {
  const bob = Math.sin(phase) * 2.5, leg = Math.sin(phase) * 7;
  return (
    <svg width={s} height={s * 0.9} viewBox="0 0 130 112" style={{ overflow: "visible", transform: `${flip ? "scaleX(-1)" : ""} translateY(${bob}px)` }}>
      <g stroke={MINI.ink} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M30 64 C30 52 44 50 54 54 C58 40 70 40 74 54 C90 54 98 58 98 66 C98 74 86 76 76 74 L44 74 C34 74 30 70 30 64 Z" fill={MINI.sand3} />
        <path d="M92 58 C100 46 100 34 98 26 C102 22 110 20 116 24 C118 28 112 32 108 32 C108 40 108 52 102 64 Z" fill={MINI.sand3} />
        <path d={`M80 74 L${84 + leg} 104 M70 74 L${70 - leg} 104 M44 74 L${40 - leg} 104 M54 74 L${54 + leg} 104`} fill="none" strokeWidth={5} />
        <path d="M30 60 C22 62 20 70 22 80" fill="none" strokeWidth={3.5} />
        {load ? <g><rect x={44} y={34} width={30} height={20} rx={4} fill={MINI.cloth} /><rect x={50} y={26} width={18} height={10} rx={3} fill={MINI.sand2} /></g>
          : <g><path d="M58 40 L62 26" fill="none" strokeWidth={7} stroke={MINI.cloth2} /><circle cx={63} cy={19} r={6} fill={MINI.sand2} /><path d="M56 16 Q63 6 70 16 Z" fill={MINI.cloth2} /></g>}
      </g>
    </svg>
  );
};

/* ---------- قافلة جمال تسير على مسار ---------- */
export const Caravan: React.FC<{ a: { x: number; y: number }; b: { x: number; y: number }; bend: number; u: number; t: number; size?: number }> = ({ a, b, bend, u, t, size = 118 }) => (
  <g>
    {[0, 1, 2, 3].map((i) => {
      const uu = Math.max(0, u - i * 0.12);
      const p = qPoint(a, b, bend, uu);
      return (
        <foreignObject key={i} x={p.x - size / 2} y={p.y - size * 0.7} width={size * 1.2} height={size} style={{ overflow: "visible" }}>
          <Camel s={size} phase={t * 8 + i * 1.3} flip={Math.cos(p.ang) > 0} load={i === 1 || i === 3} />
        </foreignObject>
      );
    })}
  </g>
);

/* ---------- مدن مرسومة (مصغّرات 120×120) ---------- */
const Wall: React.FC<{ x: number; w: number; y?: number }> = ({ x, w, y = 78 }) => (
  <path d={`M${x} 104 V${y} H${x + 6} V${y - 6} H${x + 14} V${y} H${x + 22} V${y - 6} H${x + 30} V${y} H${x + w} V104 Z`} fill={MINI.sand2} />
);
export type CityKind = "harran" | "damascus" | "cairo" | "alex" | "citadel";
export const City: React.FC<{ kind: CityKind; s?: number }> = ({ kind, s = 150 }) => (
  <svg width={s} height={s} viewBox="0 0 120 120" style={{ overflow: "visible" }}>
    <g stroke={MINI.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx={60} cy={106} rx={52} ry={9} fill="#d5b877" stroke="none" opacity={0.55} />
      {kind === "harran" && (<g>
        <Wall x={14} w={92} />
        <path d="M44 78 V56 C44 40 76 40 76 56 V78 Z" fill={MINI.sand} />
        <path d="M48 56 C48 46 72 46 72 56 Z" fill={MINI.dome} />
        <path d="M60 40 V30" fill="none" /><path d="M65 21 A7 7 0 1 0 65 35 A5.5 5.5 0 1 1 65 21 Z" fill="#e0a93b" />
        <path d="M18 78 V50 H30 V78 Z M90 78 V50 H102 V78 Z" fill={MINI.sand} /><path d="M18 50 L24 40 L30 50 Z M90 50 L96 40 L102 50 Z" fill={MINI.cloth2} />
      </g>)}
      {kind === "damascus" && (<g>
        <Wall x={8} w={104} y={84} />
        <path d="M30 84 V58 C30 44 62 44 62 58 V84 Z" fill={MINI.sand} /><path d="M34 58 C34 50 58 50 58 58 Z" fill={MINI.dome} /><path d="M46 46 V38" fill="none" /><path d="M50 30 A6 6 0 1 0 50 42 A4.6 4.6 0 1 1 50 30 Z" fill="#e0a93b" />
        <path d="M70 84 V34 H80 V84 Z" fill={MINI.sand} /><path d="M70 34 L75 20 L80 34 Z" fill={MINI.cloth2} /><path d="M75 20 V14" fill="none" />
        <path d="M14 84 V50 H26 V84 Z" fill={MINI.sand} /><path d="M14 50 L20 38 L26 50 Z" fill={MINI.cloth2} />
        <path d="M88 84 V62 H104 V84 Z" fill={MINI.sand2} />
      </g>)}
      {kind === "cairo" && (<g>
        <Wall x={10} w={100} y={84} />
        <path d="M44 84 V52 H76 V84 Z" fill={MINI.sand} /><path d="M52 84 V66 A8 8 0 0 1 68 66 V84" fill={MINI.sand3} />
        <path d="M20 84 V36 H30 V84 Z" fill={MINI.sand} /><path d="M20 36 L25 22 L30 36 Z" fill={MINI.dome} /><path d="M90 84 V36 H100 V84 Z" fill={MINI.sand} /><path d="M90 36 L95 22 L100 36 Z" fill={MINI.dome} />
        <path d="M44 52 L60 40 L76 52 Z" fill={MINI.cloth} />
      </g>)}
      {kind === "alex" && (<g>
        <path d="M14 104 Q60 92 106 104 Z" fill="#9fc7c4" stroke="none" opacity={0.7} />
        <path d="M46 104 L50 44 H70 L74 104 Z" fill={MINI.sand} /><path d="M50 44 L52 26 H68 L70 44 Z" fill={MINI.sand2} /><path d="M54 26 H66 L62 14 H58 Z" fill={MINI.sand} />
        <path d="M60 12 C54 6 58 0 60 -4 C62 0 66 6 60 12 Z" fill="#e0a93b" />
        <path d="M30 104 V88 H46 V104 Z M74 104 V88 H90 V104 Z" fill={MINI.sand2} />
      </g>)}
      {kind === "citadel" && (<g>
        <path d="M12 104 V60 H26 V50 H34 V60 H42 V50 H50 V60 H70 V50 H78 V60 H86 V50 H94 V60 H108 V104 Z" fill={MINI.sand2} />
        <path d="M22 104 V52 H40 V104 Z M80 104 V52 H98 V104 Z" fill={MINI.sand} />
        <path d="M22 52 H26 V44 H32 V52 H36 V44 H40 V52 Z M80 52 H84 V44 H90 V52 H94 V44 H98 V52 Z" fill={MINI.sand} />
        <path d="M50 104 V80 A10 10 0 0 1 70 80 V104 Z" fill={MINI.sand3} /><path d="M60 40 V26 L74 31 L60 36" fill={MINI.cloth} />
      </g>)}
    </g>
  </svg>
);

/* ---------- قضبان السجن: غطاء كامل الشاشة يسقط ثم يرتفع (ارتداد خفيف عند الاصطدام) ---------- */
export const PrisonBars: React.FC<{ w: number; h: number; fall: number; lift: number }> = ({ w, h, fall, lift }) => {
  const settle = fall >= 1 ? Math.exp(-6 * (fall - 1)) * 0 : 0;
  const y = (fall - 1) * h * 1.0 + lift * -h * 1.05 + settle;
  const n = 13, gap = w / (n - 1);
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none", transform: `translateY(${y}px)` }}>
      <rect x={0} y={h * 0.045} width={w} height={24} fill={MINI.iron} stroke={MINI.ink} strokeWidth={3} />
      <rect x={0} y={h * 0.9} width={w} height={24} fill={MINI.iron} stroke={MINI.ink} strokeWidth={3} />
      {Array.from({ length: n }, (_, i) => (
        <g key={i}>
          <rect x={i * gap - 9} y={0} width={18} height={h} fill={MINI.iron} stroke={MINI.ink} strokeWidth={3} />
          <rect x={i * gap - 5} y={0} width={4} height={h} fill={MINI.ironHi} opacity={0.7} />
          <circle cx={i * gap} cy={h * 0.045 + 12} r={6} fill={MINI.ink2} /><circle cx={i * gap} cy={h * 0.9 + 12} r={6} fill={MINI.ink2} />
        </g>
      ))}
    </svg>
  );
};

/* ---------- نافذة قضبان صغيرة فوق مدينة (تدل على الحبس فيها) ---------- */
export const CellBars: React.FC<{ s?: number }> = ({ s = 150 }) => (
  <svg width={s} height={s} viewBox="0 0 100 100" style={{ overflow: "visible" }}>
    <rect x={8} y={8} width={84} height={84} rx={6} fill="rgba(123,111,95,0.22)" stroke={MINI.ink} strokeWidth={4} />
    <circle cx={50} cy={46} r={10} fill="#e6bf93" opacity={0.95} /><ellipse cx={50} cy={36} rx={14} ry={7} fill="#f4ead0" opacity={0.95} /><path d="M30 92 C30 66 40 58 50 58 C60 58 70 66 70 92 Z" fill="#cdb98b" opacity={0.95} />
    {[26, 42, 58, 74].map((x) => <rect key={x} x={x - 4} y={8} width={8} height={84} fill={MINI.iron} stroke={MINI.ink} strokeWidth={2} />)}
    <rect x={8} y={44} width={84} height={7} fill={MINI.iron} stroke={MINI.ink} strokeWidth={2} />
  </svg>
);

/* ---------- خاتما الزواج: يتشابكان ثم ينكسر الرباط ويفترقان (k من 0 إلى 1) ---------- */
export const BrokenRings: React.FC<{ size?: number; k: number }> = ({ size = 300, k }) => {
  const sep = k < 0.45 ? 0 : Math.min(1, (k - 0.45) / 0.35);
  const crack = k >= 0.4 ? Math.min(1, (k - 0.4) / 0.15) : 0;
  const dx = sep * 70, rot = sep * 14;
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 300 210" style={{ overflow: "visible" }}>
      <g fill="none" strokeLinecap="round">
        <g transform={`translate(${-dx} 0) rotate(${-rot} 118 105)`}><circle cx={118} cy={105} r={58} stroke="#e0a93b" strokeWidth={16} /><circle cx={118} cy={105} r={58} stroke={MINI.ink} strokeWidth={3} /><circle cx={118} cy={47} r={11} fill="#fff" stroke={MINI.ink} strokeWidth={3} /></g>
        <g transform={`translate(${dx} 0) rotate(${rot} 182 105)`}><circle cx={182} cy={105} r={58} stroke="#d98a1f" strokeWidth={16} /><circle cx={182} cy={105} r={58} stroke={MINI.ink} strokeWidth={3} /></g>
        {crack > 0 && sep < 0.95 && <path d="M150 26 L138 66 L160 86 L142 126 L156 150 L146 188" stroke={MINI.cloth} strokeWidth={9} strokeDasharray={`${300 * crack} 400`} opacity={1 - sep * 0.9} />}
        {sep > 0 && [0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${150 + (i - 2) * 6} ${96 + i * 4} l${(i - 2) * 14 * sep} ${-16 * sep}`} stroke={MINI.cloth} strokeWidth={5} opacity={1 - sep} />)}
      </g>
    </svg>
  );
};

/* ---------- سفينة شراعية (زينة بحرية للخريطة) ---------- */
export const Galley: React.FC<{ s?: number; t?: number }> = ({ s = 110, t = 0 }) => (
  <svg width={s} height={s * 0.8} viewBox="0 0 120 96" style={{ overflow: "visible", transform: `translateY(${Math.sin(t * 2) * 3}px) rotate(${Math.sin(t * 1.6) * 2}deg)` }}>
    <g stroke={MINI.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 66 L106 66 C100 82 86 88 70 88 L40 88 C26 88 18 78 14 66 Z" fill={MINI.horse} />
      <path d="M60 66 V10" fill="none" strokeWidth={3} />
      <path d="M60 14 C86 24 92 46 88 62 L60 62 Z" fill={MINI.sand} />
      <path d="M60 14 C38 26 32 46 36 62 L60 62 Z" fill="#f7efd6" />
      <path d="M60 10 L76 14 L60 18 Z" fill={MINI.cloth} />
      <path d="M8 92 Q20 86 32 92 T56 92 T80 92 T104 92" fill="none" stroke="#7fb3b0" strokeWidth={3} />
    </g>
  </svg>
);
