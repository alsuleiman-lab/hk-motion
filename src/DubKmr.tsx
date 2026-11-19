import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT_TITLE } from "./localFonts";
import { BRAND, RED, alpha, applyBrand } from "./brand";
import { HybridHost, HybridBg, VSlot } from "./hybrid/Slot";

/**
 * دبلجة كرمنجية لمقطع «دفع الحسد وتسريع الزواج» (أمر المستخدم 2026-11-19): الشيخ بملء الشاشة أولاً ثم يتصغّر إلى إطار،
 * وتحته رسوم متحركة لكل جملة تُشغل النظر عن عدم تطابق الشفاه. لا كتابة كلامية على الشاشة (جواب المستخدم)؛ الصوت صوت «الطالب ج»
 * مضبوط طول كل جملة على نظيرتها العربية (public/dubkmr/mix.wav). الصورة: المقطع الأصلي بلا الفاصل (public/dubkmr/src.mp4).
 */
export const DUBKMR_FPS = 30;
export const DUBKMR_FRAMES = 2232;
export const W = 1080, H = 1920;
export const PX = 90, PY = 130, PW = 900, PH = 956;      // إطار الشيخ (يُقصّ من أعلى الصورة الأصلية: الرأس والكتفان واليدان)
export const SX = 90, SY = 1120, SW = 900, SH = 690;     // خانة الرسوم تحت الإطار
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (x: number) => { const c = clamp(x); return c * c * (3 - 2 * c); };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const outBack = (x: number) => { const c = clamp(x), s = 1.70158; return 1 + (s + 1) * Math.pow(c - 1, 3) + s * Math.pow(c - 1, 2); };

/** 0 = الشيخ بملء الشاشة، 1 = في الإطار. المقاطع بملء الشاشة: المقدمة والمشهد المركّب المحروق في الأصل (الصورة العلوية والكلمات). */
export const panelK = (t: number) =>
  t < 4.45 ? 0 : t < 4.95 ? smooth((t - 4.45) / 0.5) : t < 49.95 ? 1 : t < 50.3 ? 1 - smooth((t - 49.95) / 0.35) : t < 53.85 ? 0 : t < 54.3 ? smooth((t - 53.85) / 0.45) : 1;

/** مشاهد الرسوم بزمن الفيديو (مرتبطة ببدء الجملة الكرمنجية النظيرة) */
export const SC: { id: string; a: number; b: number }[] = [
  { id: "eye", a: 4.95, b: 7.17 }, { id: "door", a: 7.17, b: 9.95 }, { id: "heal", a: 9.95, b: 12.4 }, { id: "moon", a: 12.4, b: 14.26 },
  { id: "hang", a: 14.26, b: 16.85 }, { id: "book", a: 16.85, b: 20.16 }, { id: "ring", a: 20.16, b: 24.22 }, { id: "beads", a: 24.22, b: 28.48 },
  { id: "three", a: 28.48, b: 31.24 }, { id: "ringq", a: 31.24, b: 33.09 }, { id: "weak", a: 33.09, b: 35.51 }, { id: "pouch", a: 35.51, b: 37.7 },
  { id: "strong", a: 37.7, b: 39.98 }, { id: "cut", a: 39.98, b: 44.67 }, { id: "rope", a: 44.67, b: 49.95 },
  { id: "paper", a: 54.3, b: 55.48 }, { id: "paperx", a: 55.48, b: 58.56 }, { id: "rope2", a: 58.56, b: 60.37 }, { id: "book2", a: 60.37, b: 62.87 },
  { id: "ban", a: 62.87, b: 66.42 }, { id: "shield", a: 66.42, b: 71.73 }, { id: "bubbles", a: 71.73, b: 74.4 },
];

/* ───────── أشكال مرسومة (مربع 200×200) ───────── */
const BeadG: React.FC = () => (
  <g>
    <circle cx="100" cy="100" r="92" fill={BRAND.blue} /><circle cx="100" cy="100" r="70" fill={BRAND.card} /><circle cx="100" cy="100" r="48" fill={BRAND.light} /><circle cx="100" cy="100" r="24" fill={BRAND.ink} />
    <ellipse cx="68" cy="66" rx="20" ry="9" fill={BRAND.card} opacity=".35" transform="rotate(-35 68 66)" />
  </g>
);
const RingG: React.FC = () => (
  <g>
    <circle cx="100" cy="100" r="64" fill="none" stroke={BRAND.accentDeep} strokeWidth="28" /><circle cx="100" cy="100" r="64" fill="none" stroke={BRAND.accent} strokeWidth="15" />
    <path d="M52 70 A64 64 0 0 1 98 36" fill="none" stroke={BRAND.card} strokeWidth="5" strokeLinecap="round" opacity=".9" />
  </g>
);
const PouchG: React.FC = () => (
  <g>
    <path d="M24 42 H176 L100 180 Z" fill={BRAND.green} stroke={BRAND.accent} strokeWidth="6" strokeLinejoin="round" />
    <path d="M42 56 H158 L100 160 Z" fill="none" stroke={BRAND.accent} strokeWidth="3" strokeDasharray="6 7" />
    <circle cx="100" cy="92" r="17" fill={BRAND.accent} /><circle cx="100" cy="92" r="7" fill={BRAND.green} />
  </g>
);
const PaperG: React.FC<{ k?: number }> = ({ k = 1 }) => {
  const lines = ["M54 54 q9 -13 18 0 t18 0 t18 0 t18 0", "M54 82 q9 -13 18 0 t18 0 t18 0 t18 0", "M54 110 q9 -13 18 0 t18 0 t18 0 t18 0", "M54 138 q9 -13 18 0 t18 0 t18 0"];
  return (
    <g>
      <rect x="34" y="20" width="132" height="160" rx="6" fill={BRAND.card} stroke={BRAND.accentDeep} strokeWidth="4" />
      {lines.map((d, i) => { const kk = clamp(k * lines.length - i); return <path key={i} d={d} fill="none" stroke={BRAND.ink} strokeWidth="4.5" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - kk} />; })}
    </g>
  );
};
const HeartG: React.FC<{ c?: string }> = ({ c = RED }) => <path d="M100 176 C18 112 20 40 66 40 C86 40 96 52 100 64 C104 52 114 40 134 40 C180 40 182 112 100 176 Z" fill={c} stroke={BRAND.accentDeep} strokeWidth="5" strokeLinejoin="round" />;
const ShieldG: React.FC = () => <path d="M100 14 L170 40 V100 C170 144 138 170 100 188 C62 170 30 144 30 100 V40 Z" fill={BRAND.accent} stroke={BRAND.accent} strokeWidth="8" strokeLinejoin="round" />;
const BookG: React.FC<{ k?: number }> = ({ k = 1 }) => (
  <g>
    <path d="M100 52 C76 34 40 34 16 46 V160 C40 148 76 148 100 166 Z" fill={BRAND.card} stroke={BRAND.accentDeep} strokeWidth="5" strokeLinejoin="round" />
    <path d="M100 52 C124 34 160 34 184 46 V160 C160 148 124 148 100 166 Z" fill={BRAND.paper} stroke={BRAND.accentDeep} strokeWidth="5" strokeLinejoin="round" />
    {[62, 78, 94, 110, 126].map((y, i) => <path key={i} d={`M32 ${y} q28 -8 56 4`} stroke={BRAND.gray} strokeWidth="4" strokeLinecap="round" fill="none" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - clamp(k * 5 - i)} />)}
    {[62, 78, 94, 110, 126].map((y, i) => <path key={"r" + i} d={`M112 ${y + 4} q28 -12 56 -4`} stroke={BRAND.gray} strokeWidth="4" strokeLinecap="round" fill="none" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - clamp(k * 5 - i - 0.5)} />)}
    <path d="M96 52 V166 H104 V52 Z" fill={BRAND.accentDeep} />
    <path d="M140 34 V78 L148 70 L156 78 V38 Z" fill={RED} />
  </g>
);
const XG: React.FC<{ k: number; w?: number }> = ({ k, w = 16 }) => (
  <g stroke={RED} strokeWidth={w} strokeLinecap="round" fill="none">
    <path d="M36 36 L164 164" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - clamp(k * 2)} />
    <path d="M164 36 L36 164" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - clamp(k * 2 - 1)} />
  </g>
);
const BatteryG: React.FC<{ level: number }> = ({ level }) => {
  const col = level > 0.5 ? BRAND.green : level > 0.25 ? BRAND.accent : RED;
  return (
    <g>
      <rect x="14" y="56" width="152" height="88" rx="14" fill={BRAND.ink} stroke={BRAND.light} strokeWidth="7" /><rect x="168" y="82" width="16" height="36" rx="5" fill={BRAND.light} />
      <rect x="24" y="66" width={Math.max(6, 132 * level)} height="68" rx="8" fill={col} />
    </g>
  );
};
const BubbleG: React.FC<{ c: string; flip?: boolean }> = ({ c, flip }) => (
  <g transform={flip ? "translate(200 0) scale(-1 1)" : undefined}>
    <path d="M30 30 H170 Q184 30 184 44 V116 Q184 130 170 130 H96 L58 170 L62 130 H30 Q16 130 16 116 V44 Q16 30 30 30 Z" fill={c} stroke={BRAND.card} strokeWidth="5" strokeLinejoin="round" />
    <circle cx="62" cy="80" r="9" fill={BRAND.card} /><circle cx="100" cy="80" r="9" fill={BRAND.card} /><circle cx="138" cy="80" r="9" fill={BRAND.card} />
  </g>
);

/** عنصر مرسوم مركزه (x,y) في الخانة وحجمه s؛ يدخل بقفزة نابضة عند d ثانية */
const Art: React.FC<{ u: number; d?: number; x: number; y: number; s: number; rot?: number; sc?: number; dy?: number; children: React.ReactNode }> = ({ u, d = 0, x, y, s, rot = 0, sc = 1, dy = 0, children }) => {
  const k = outBack((u - d) / 0.5);
  if (u < d) return null;
  return <svg width={s} height={s} viewBox="0 0 200 200" style={{ position: "absolute", left: x - s / 2, top: y - s / 2 + dy, overflow: "visible", transform: `rotate(${rot}deg) scale(${k * sc})`, filter: "drop-shadow(0 14px 18px rgba(0,0,0,.45))" }}>{children}</svg>;
};
const Coin: React.FC<{ x: number; y: number; k: number }> = ({ x, y, k }) => (
  <svg width="86" height="86" viewBox="0 0 100 100" style={{ position: "absolute", left: x - 43, top: y - 43, transform: `scale(${k})` }}>
    <circle cx="50" cy="50" r="44" fill={BRAND.accent} stroke={BRAND.accentDeep} strokeWidth="6" /><circle cx="50" cy="50" r="30" fill="none" stroke={BRAND.card} strokeWidth="5" />
  </svg>
);

/* ───────── المشاهد ───────── */
export const Scene: React.FC<{ id: string; u: number }> = ({ id, u }) => {
  const cx = SW / 2, cy = SH / 2;
  const sway = (amp: number, sp = 3) => Math.sin(u * sp) * amp;
  switch (id) {
    case "eye": {
      const rays = Array.from({ length: 12 }, (_, i) => i);
      return (
        <>
          <svg width={SW} height={SH} style={{ position: "absolute", left: 0, top: 0 }}>
            {rays.map((i) => { const a = (i / 12) * Math.PI * 2 + u * 0.6, p = (u * 0.9 + i * 0.13) % 1, r0 = 210 + p * 80, r1 = r0 + 40; return <line key={i} x1={cx + Math.cos(a) * r0} y1={cy + Math.sin(a) * r0} x2={cx + Math.cos(a) * r1} y2={cy + Math.sin(a) * r1} stroke={BRAND.light} strokeWidth="9" strokeLinecap="round" opacity={1 - p} />; })}
          </svg>
          <Art u={u} x={cx} y={cy} s={380} sc={1 + 0.035 * Math.sin(u * 5)}><BeadG /></Art>
        </>
      );
    }
    case "door": {
      const open = smooth((u - 0.35) / 0.8);
      return (
        <>
          <svg width={SW} height={SH} style={{ position: "absolute", left: 0, top: 0 }}>
            <rect x={cx - 150} y={50} width={300} height={560} rx="10" fill={BRAND.accent} opacity={0.25 + 0.75 * open} />
            <polygon points={`${cx - 150},${610} ${cx + 150},${610} ${cx + 150 + 220 * open},${700} ${cx - 150 - 220 * open},${700}`} fill={BRAND.card} opacity={0.55 * open} />
            <rect x={cx - 150} y={50} width={300} height={560} rx="10" fill="none" stroke={BRAND.accentDeep} strokeWidth="16" />
            <g transform={`translate(${cx - 150} 0) scale(${1 - 0.88 * open} 1)`}><rect x="0" y="50" width="300" height="560" rx="6" fill={BRAND.navy} stroke={BRAND.navyDeep} strokeWidth="8" /><rect x="40" y="100" width="220" height="190" rx="6" fill="none" stroke={BRAND.navyDeep} strokeWidth="6" /><rect x="40" y="330" width="220" height="230" rx="6" fill="none" stroke={BRAND.navyDeep} strokeWidth="6" /><circle cx="260" cy="340" r="14" fill={BRAND.accent} /></g>
          </svg>
          {[0, 1, 2, 3, 4].map((i) => { const k = outBack((u - 1.0 - i * 0.16) / 0.5); const up = Math.sin(u * 4 + i) * 6; return u > 1.0 + i * 0.16 ? <Coin key={i} x={cx - 160 + i * 80} y={330 + (i % 2) * 90 + up} k={k} /> : null; })}
        </>
      );
    }
    case "heal": {
      const beat = 1 + 0.07 * Math.max(0, Math.sin(u * 7)) ** 3;
      return (
        <>
          <Art u={u} x={cx} y={cy - 20} s={340} sc={beat}><HeartG /></Art>
          <svg width="520" height="160" viewBox="0 0 200 200" style={{ position: "absolute", left: cx - 260, top: cy - 80, overflow: "visible" }}>
            <polyline points="0,100 62,100 76,66 92,142 108,50 122,100 200,100" fill="none" stroke={BRAND.card} strokeWidth="9" strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - clamp((u - 0.4) / 0.9)} />
          </svg>
        </>
      );
    }
    case "moon": {
      const g = 0.5 + 0.5 * Math.sin(u * 3);
      return (
        <>
          <svg width={SW} height={SH} style={{ position: "absolute", left: 0, top: 0 }}>
            <circle cx={cx} cy={cy} r={170 + 24 * g} fill={BRAND.accent} opacity=".14" /><circle cx={cx} cy={cy} r={120 + 14 * g} fill={BRAND.accent} opacity=".2" />
          </svg>
          <Art u={u} x={cx} y={cy} s={380}>
            <path d="M138 28 A78 78 0 1 0 172 132 A62 62 0 1 1 138 28 Z" fill={BRAND.accent} stroke={BRAND.accentDeep} strokeWidth="5" strokeLinejoin="round" />
            <path d="M150 62 l5 12 l13 1 l-10 8 l4 13 l-12 -7 l-11 8 l3 -13 l-10 -9 l13 -1 Z" fill={BRAND.card} />
          </Art>
        </>
      );
    }
    case "hang": {
      const a = sway(7, 3.2) * Math.min(1, u / 0.4);
      const drop = outBack(u / 0.6);
      return (
        <>
          <svg width={SW} height={SH} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <g transform={`rotate(${a} ${cx} 0)`}>
              <line x1={cx} y1="0" x2={cx} y2={120 + 190 * drop} stroke={BRAND.light} strokeWidth="10" strokeLinecap="round" />
              <svg x={cx - 150} y={50 + 190 * drop} width="300" height="300" viewBox="0 0 200 200" overflow="visible"><BeadG /><g opacity={u > 1.5 ? 1 : 0}><XG k={(u - 1.5) / 0.6} /></g></svg>
            </g>
          </svg>
        </>
      );
    }
    case "book": case "book2": {
      const k = clamp((u - 0.3) / 1.2);
      return <Art u={u} x={cx} y={cy} s={430} rot={sway(1.5, 2)} dy={sway(8, 2.4)}><BookG k={k} /></Art>;
    }
    case "ring": {
      const spin = Math.abs(Math.cos(u * 1.6));
      return (
        <>
          <Art u={u} x={cx} y={cy} s={420} sc={0.35 + 0.65 * spin + 0.0}><RingG /></Art>
          {u > 0.8 && <svg width="120" height="120" viewBox="0 0 100 100" style={{ position: "absolute", left: cx + 70, top: cy - 190, transform: `scale(${outBack((u - 0.8) / 0.4) * (1 + 0.15 * Math.sin(u * 8))}) rotate(${u * 40}deg)` }}><path d="M50 4 L60 40 L96 50 L60 60 L50 96 L40 60 L4 50 L40 40 Z" fill={BRAND.card} /></svg>}
        </>
      );
    }
    case "beads": {
      const n = 13;
      const cols = [BRAND.blue, BRAND.light, BRAND.card, BRAND.blue, BRAND.accent];
      return (
        <svg width={SW} height={SH} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <g transform={`rotate(${sway(2.5, 2)} ${cx} 40)`}>
            {Array.from({ length: n }, (_, i) => { const p = i / (n - 1), x = lerp(120, SW - 120, p), y = 70 + Math.sin(p * Math.PI) * 190, k = outBack((u - i * 0.07) / 0.35); return u > i * 0.07 ? <circle key={i} cx={x} cy={y} r={34 * k} fill={cols[i % cols.length]} stroke={BRAND.ink} strokeWidth="5" /> : null; })}
            {u > 1.1 && <svg x={cx - 120} y={270} width="240" height="240" viewBox="0 0 200 200" overflow="visible" style={{ transformOrigin: "center", transform: `scale(${outBack((u - 1.1) / 0.5)})` }}><PouchG /></svg>}
          </g>
        </svg>
      );
    }
    case "three": {
      const it = [<BeadG key="b" />, <PouchG key="p" />, <RingG key="r" />];
      return <>{it.map((g, i) => <Art key={i} u={u} d={i * 0.4} x={cx - 270 + i * 270} y={cy} s={250} dy={sway(10, 2.6 + i * 0.3)}>{g}</Art>)}</>;
    }
    case "ringq": {
      return (
        <>
          <Art u={u} x={cx} y={cy + 70} s={340} sc={0.8 + 0.2 * Math.abs(Math.cos(u * 1.6))}><RingG /></Art>
          {u > 0.45 && <svg width="190" height="190" viewBox="0 0 100 100" style={{ position: "absolute", left: cx - 95, top: 8, transform: `scale(${outBack((u - 0.45) / 0.45)})` }}><circle cx="50" cy="50" r="46" fill={BRAND.accent} stroke={BRAND.accentDeep} strokeWidth="5" /><path d="M36 38 C36 22 66 22 66 40 C66 52 50 54 50 66" fill="none" stroke={BRAND.ink} strokeWidth="9" strokeLinecap="round" /><circle cx="50" cy="82" r="6" fill={BRAND.ink} /></svg>}
        </>
      );
    }
    case "weak": {
      const level = lerp(0.85, 0.07, smooth((u - 0.35) / 1.4));
      return (
        <>
          <Art u={u} x={cx} y={cy} s={430}><BatteryG level={level} /></Art>
          {u > 0.9 && [0, 1, 2].map((i) => { const p = (u * 0.8 + i * 0.33) % 1; return <svg key={i} width="70" height="70" viewBox="0 0 100 100" style={{ position: "absolute", left: cx - 190 + i * 150, top: cy + 100 + p * 90, opacity: 1 - p }}><path d="M50 82 L18 40 H38 V14 H62 V40 H82 Z" fill={RED} /></svg>; })}
        </>
      );
    }
    case "pouch": return <Art u={u} x={cx} y={cy} s={400} rot={sway(8, 3)} dy={sway(10, 2.2)}><PouchG /></Art>;
    case "strong": {
      const beat = 1 + 0.07 * Math.max(0, Math.sin(u * 7)) ** 3;
      const up = (u * 1.2) % 1;
      return (
        <>
          <Art u={u} x={cx - 170} y={cy} s={300} sc={beat}><HeartG /></Art>
          <Art u={u} d={0.25} x={cx + 190} y={cy + 20} s={300}>
            <path d="M100 18 L168 100 H128 V182 H72 V100 H32 Z" fill={BRAND.green} stroke={BRAND.navyDeep} strokeWidth="6" strokeLinejoin="round" transform={`translate(0 ${-10 * Math.sin(u * 5)})`} />
          </Art>
          {u > 0.5 && <svg width="60" height="60" viewBox="0 0 100 100" style={{ position: "absolute", left: cx + 160, top: cy - 160 - up * 40, opacity: 1 - up }}><path d="M50 4 L60 40 L96 50 L60 60 L50 96 L40 60 L4 50 L40 40 Z" fill={BRAND.card} /></svg>}
        </>
      );
    }
    case "cut": {
      const split = smooth((u - 1.3) / 1.0), fall = split * split;
      const lvl = lerp(0.8, 0.07, smooth((u - 3.0) / 1.3));
      if (u > 2.9) return <><Art u={u} d={2.9} x={cx} y={cy} s={420}><BatteryG level={lvl} /></Art></>;
      return (
        <>
          <svg width="420" height="420" viewBox="0 0 200 200" style={{ position: "absolute", left: cx - 210, top: cy - 210 - 6, overflow: "visible", transform: `scale(${outBack(u / 0.5)})` }}>
            <g transform={`translate(${-60 * split} ${280 * fall}) rotate(${-50 * split} 100 100)`} style={{ clipPath: "inset(0 50% 0 0)" }}><RingG /></g>
            <g transform={`translate(${60 * split} ${280 * fall}) rotate(${50 * split} 100 100)`} style={{ clipPath: "inset(0 0 0 50%)" }}><RingG /></g>
            <line x1="100" y1="-10" x2="100" y2={-10 + 220 * clamp((u - 1.1) / 0.3)} stroke={RED} strokeWidth="7" strokeLinecap="round" />
          </svg>
        </>
      );
    }
    case "rope": case "rope2": {
      const a = sway(6, 3) * Math.min(1, u / 0.3), tight = id === "rope2" ? 1 : 0;
      return (
        <svg width={SW} height={SH} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <g transform={`rotate(${a} ${cx} 0)`}>
            <line x1={cx} y1="0" x2={cx} y2="250" stroke={BRAND.light} strokeWidth="11" strokeLinecap="round" />
            <circle cx={cx} cy="250" r={tight ? 20 : 14} fill={BRAND.accentDeep} />
            <svg x={cx - 130} y="215" width="260" height="260" viewBox="0 0 200 200" overflow="visible" style={{ transformOrigin: `${cx}px 215px`, transform: `scale(${outBack(u / 0.5)})` }}><PouchG /></svg>
            {id === "rope" && u > 1.0 && <svg x={cx + 90} y="340" width="150" height="150" viewBox="0 0 200 200" overflow="visible"><BeadG /></svg>}
            {id === "rope" && u > 3.4 && <svg x={cx - 130} y="215" width="260" height="260" viewBox="0 0 200 200" overflow="visible"><XG k={(u - 3.4) / 0.7} /></svg>}
          </g>
        </svg>
      );
    }
    case "paper": {
      const k = clamp((u - 0.35) / 0.8);
      return <Art u={u} x={cx} y={cy} s={430} rot={-4}><PaperG k={k} /></Art>;
    }
    case "paperx": {
      const crumple = smooth((u - 2.2) / 0.7);
      return (
        <>
          <Art u={u} x={cx} y={cy} s={430} rot={-4 + 30 * crumple} sc={1 - 0.7 * crumple}><PaperG k={1} /></Art>
          {u > 0.9 && u < 2.0 && <svg width="190" height="190" viewBox="0 0 100 100" style={{ position: "absolute", left: cx + 50, top: 20, transform: `scale(${outBack((u - 0.9) / 0.4)})` }}><circle cx="50" cy="50" r="46" fill={BRAND.accent} stroke={BRAND.accentDeep} strokeWidth="5" /><path d="M36 38 C36 22 66 22 66 40 C66 52 50 54 50 66" fill="none" stroke={BRAND.ink} strokeWidth="9" strokeLinecap="round" /><circle cx="50" cy="82" r="6" fill={BRAND.ink} /></svg>}
          {u > 1.8 && <Art u={u} d={1.8} x={cx} y={cy} s={430} sc={1 - 0.7 * crumple}><XG k={(u - 1.8) / 0.6} w={20} /></Art>}
        </>
      );
    }
    case "ban": {
      const k = clamp((u - 0.5) / 0.7);
      return (
        <>
          <Art u={u} x={cx - 80} y={cy + 10} s={300} rot={sway(5, 3)}><PouchG /></Art>
          <Art u={u} d={0.15} x={cx + 130} y={cy - 30} s={230}><BeadG /></Art>
          <svg width="520" height="520" viewBox="0 0 200 200" style={{ position: "absolute", left: cx - 260, top: cy - 270, transform: `scale(${1 + 0.02 * Math.sin(u * 6)})` }}>
            <circle cx="100" cy="100" r="86" fill="none" stroke={RED} strokeWidth="14" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - k} strokeLinecap="round" />
            <line x1="40" y1="160" x2="160" y2="40" stroke={RED} strokeWidth="14" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - clamp((k - 0.5) * 2)} />
          </svg>
        </>
      );
    }
    case "shield": {
      const off = smooth((u - 1.0) / 1.2);
      const chk = clamp((u - 2.3) / 0.6);
      const it = [{ g: <BeadG />, dx: -330, dy: -90 }, { g: <PouchG />, dx: 330, dy: -60 }, { g: <RingG />, dx: 0, dy: 260 }];
      return (
        <>
          {it.map((o, i) => <Art key={i} u={u} d={0.2 + i * 0.12} x={cx + o.dx * off * 0.9 + (i === 0 ? -150 : i === 1 ? 150 : 0) * (1 - off)} y={cy + o.dy * off + (i === 2 ? 100 : -30) * (1 - off)} s={170 - 20 * off} rot={off * (i - 1) * 140} sc={1 - 0.15 * off}>{o.g}</Art>)}
          <Art u={u} x={cx} y={cy + 10} s={400} sc={1 + 0.02 * Math.sin(u * 4)}>
            <ShieldG />
            <path d="M62 104 L90 132 L142 72" fill="none" stroke={BRAND.card} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - chk} />
          </Art>
        </>
      );
    }
    case "bubbles": {
      const b = [{ c: BRAND.accent, x: cx - 150, y: cy + 80, d: 0.0, f: false, s: 300 }, { c: BRAND.green, x: cx + 160, y: cy - 60, d: 0.45, f: true, s: 280 }];
      return <>{b.map((o, i) => <Art key={i} u={u} d={o.d} x={o.x} y={o.y} s={o.s} dy={sway(12, 2 + i * 0.5)}><BubbleG c={o.c} flip={o.f} /></Art>)}</>;
    }
    default: return null;
  }
};

const Bg: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill style={{
    background: `radial-gradient(circle at 50% 50%, ${alpha(BRAND.accent, 0.35)} 0 3px, transparent 4px) ${t * 6}px ${t * 4}px/90px 90px, radial-gradient(circle at 0 0, ${alpha(BRAND.base2, 1)} 0 30px, transparent 31px) 0 0/90px 90px, radial-gradient(ellipse at 50% 30%, ${BRAND.base2} 0%, ${BRAND.base} 70%, ${BRAND.base3} 100%)`,
  }} />
);

export const DubKmr: React.FC<{ audio?: string }> = ({ audio = "dubkmr/mix.wav" }) => {
  FONT_TITLE(); applyBrand("kraft");   // نمط هوية القناة «كرافت وحبر» (src/brand.ts): بلا أسود ولا أزرق
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps;
  const k = panelK(t);
  // إطار الشيخ: من الشاشة الكاملة إلى الإطار؛ وفي المقاطع الكاملة تقريب بطيء خفيف يحرّك الصورة
  const push = k < 0.01 ? 1 + 0.045 * smooth((t - (t > 50 ? 50.3 : 0)) / (t > 50 ? 3.6 : 4.45)) : 1;
  const bw = lerp(W, PW, k), bh = lerp(H, PH, k), bx = lerp(0, PX, k), by = lerp(0, PY, k), br = lerp(0, 40, k);
  const vw = bw * push, vh = (vw * H) / W;
  const vx = -(vw - bw) / 2, vy = -(vh - bh) * 0.15;
  const sc = SC.find((s) => t >= s.a && t < s.b);
  return (
    <HybridHost>
      <HybridBg><Bg t={t} /></HybridBg>
      <Audio src={staticFile(audio)} />
      <AbsoluteFill>
        <VSlot src="dubkmr/src.mp4" w={bw} h={bh} radius={br} vx={vx} vy={vy} vw={vw} vh={vh} style={{ left: bx, top: by }} grow={0} />
        <div style={{ position: "absolute", left: bx - 6, top: by - 6, width: bw + 12, height: bh + 12, borderRadius: br + 6, border: `6px solid ${BRAND.accent}`, opacity: k, boxShadow: "0 18px 50px rgba(0,0,0,.55)", pointerEvents: "none" }} />
        {sc && <div style={{ position: "absolute", left: SX, top: SY + (1 - k) * 820, width: SW, height: SH, borderRadius: 38, background: `linear-gradient(160deg,${BRAND.base2},${BRAND.base3})`, border: `5px solid ${BRAND.accent}`, boxShadow: "0 18px 50px rgba(0,0,0,.5)", overflow: "hidden" }}>
          {k > 0.02 && <div key={sc.id + sc.a} style={{ position: "absolute", left: 0, top: 0, width: SW, height: SH }}><Scene id={sc.id} u={t - sc.a} /></div>}
        </div>}
        <div style={{ position: "absolute", left: 0, right: 0, top: 1846, textAlign: "center", color: BRAND.light, fontFamily: "Noto Kufi Arabic", fontWeight: 800, fontSize: 40, opacity: k, direction: "rtl" }}>محمد بن شمس الدين</div>
      </AbsoluteFill>
    </HybridHost>
  );
};

// النسخة السورانية: التركيبة نفسها بصوت كردي سوراني
export const DubCkb: React.FC = () => <DubKmr audio="dubkmr/mix_ckb.wav" />;
