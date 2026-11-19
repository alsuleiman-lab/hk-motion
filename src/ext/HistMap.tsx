import React from "react";
import { KX, KY, LAND_PATH, POLITIES, RIVER_PATH, WORLD } from "./eastMap";

export const HIST_COL = { sea: "#bfdad7", sea2: "#dcece6", land: "#f3e6c4", sepia: "#8a6a3b", river: "#5f9fa8", wave: "#8fbcbc" };

/**
 * خريطة تاريخية بمظهر أثري (لفيديوهات التاريخ): بحر مائل للأخضر الباهت بخطوط موج متدرجة حول السواحل، وأرض رقّ دافئة،
 * وحدود الكيانات السياسية التقريبية نحو 1300م منقّطة (الحدود التقريبية تُرسم متقطعة في الخرائط القديمة) بألوان باستيل مقصوصة على اليابسة،
 * وأنهار دقيقة، وشبكة درجات خفيفة. بلا أي نص. يوضع داخل حامل الكاميرا؛ `zoom` لتثبيت سُمك الخطوط على الشاشة.
 */
export const HistMap: React.FC<{ zoom: number }> = ({ zoom }) => {
  const z = zoom;
  return (
    <svg width={WORLD.w} height={WORLD.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs>
        <pattern id="waves" width="46" height="28" patternUnits="userSpaceOnUse"><path d="M2 16 q5 -7 10 0 t10 0 t10 0" fill="none" stroke="#6f9fa0" strokeWidth={1.8} opacity={0.5} /></pattern>
        <clipPath id="landclip"><path d={LAND_PATH} /></clipPath>
        <mask id="inland" maskUnits="userSpaceOnUse" x={-600} y={-600} width={WORLD.w + 1200} height={WORLD.h + 1200}>
          <rect x={-600} y={-600} width={WORLD.w + 1200} height={WORLD.h + 1200} fill="black" />
          <path d={LAND_PATH} fill="white" />
          <path d={LAND_PATH} fill="none" stroke="black" strokeWidth={22 / z} strokeLinejoin="round" />
        </mask>
      </defs>
      {/* موج البحر المرسوم */}
      <rect x={-400} y={-400} width={WORLD.w + 800} height={WORLD.h + 800} fill="url(#waves)" />
      {/* شبكة الدرجات */}
      {Array.from({ length: 11 }, (_, i) => <line key={`x${i}`} x1={i * 2 * KX} x2={i * 2 * KX} y1={-400} y2={WORLD.h + 400} stroke="rgba(138,106,59,0.16)" strokeWidth={1.6 / z} />)}
      {Array.from({ length: 8 }, (_, i) => <line key={`y${i}`} y1={i * 2 * KY} y2={i * 2 * KY} x1={-400} x2={WORLD.w + 400} stroke="rgba(138,106,59,0.16)" strokeWidth={1.6 / z} />)}
      {/* خطوط الموج حول السواحل */}
      <g fill="none" stroke={HIST_COL.wave} strokeLinejoin="round">
        <path d={LAND_PATH} strokeWidth={64 / z} opacity={0.14} />
        <path d={LAND_PATH} strokeWidth={42 / z} opacity={0.18} />
        <path d={LAND_PATH} strokeWidth={22 / z} opacity={0.24} />
      </g>
      {/* اليابسة وإطار الساحل بالحبر السيبيا (ظل حول الشكل الموحّد فلا تظهر حدود الدول الحديثة) */}
      <g style={{ filter: `drop-shadow(0 0 ${1.1 / z}px ${HIST_COL.sepia}) drop-shadow(0 0 ${1.1 / z}px ${HIST_COL.sepia})` }}>
        <path d={LAND_PATH} fill={HIST_COL.land} stroke={HIST_COL.land} strokeWidth={2 / z} strokeLinejoin="round" />
      </g>
      {/* الكيانات السياسية التقريبية: تلوين فاتح وحدود متقطعة، مقصوصة على اليابسة */}
      <g clipPath="url(#landclip)">
        {POLITIES.map((p, i) => <path key={i} d={p.d} fill={p.fill} opacity={0.9} />)}
        <g mask="url(#inland)">{POLITIES.map((p, i) => <path key={`b${i}`} d={p.d} fill="none" stroke={HIST_COL.sepia} strokeWidth={3.2 / z} strokeDasharray={`${16 / z} ${11 / z}`} strokeLinejoin="round" opacity={0.85} />)}</g>
      </g>
      <path d={RIVER_PATH} fill="none" stroke={HIST_COL.river} strokeWidth={3.6 / z} strokeLinecap="round" strokeLinejoin="round" opacity={0.95} />
    </svg>
  );
};

/** إطار الخريطة القديمة (شاشة): حد مزدوج بعلامات، ووردة الرياح، وحبيبات رق خفيفة، وتعتيم دافئ خفيف عند الأطراف (لا قتام). */
export const MapFrame: React.FC<{ w: number; h: number }> = ({ w, h }) => {
  const m = 14, m2 = 24;
  const ticks: React.ReactNode[] = [];
  for (let x = m2 + 60; x < w - m2; x += 120) { ticks.push(<line key={`tx${x}`} x1={x} x2={x} y1={m} y2={m2} stroke={HIST_COL.sepia} strokeWidth={2} />); ticks.push(<line key={`bx${x}`} x1={x} x2={x} y1={h - m} y2={h - m2} stroke={HIST_COL.sepia} strokeWidth={2} />); }
  for (let y = m2 + 60; y < h - m2; y += 120) { ticks.push(<line key={`ly${y}`} y1={y} y2={y} x1={m} x2={m2} stroke={HIST_COL.sepia} strokeWidth={2} />); ticks.push(<line key={`ry${y}`} y1={y} y2={y} x1={w - m} x2={w - m2} stroke={HIST_COL.sepia} strokeWidth={2} />); }
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}>
      <defs>
        <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" /><feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.35  0 0 0 0 0.2  0 0 0 0.55 0" /></filter>
        <radialGradient id="warm" cx="50%" cy="50%" r="75%"><stop offset="62%" stopColor="#c9a25a" stopOpacity="0" /><stop offset="100%" stopColor="#c9a25a" stopOpacity="0.28" /></radialGradient>
      </defs>
      <rect width={w} height={h} fill="url(#warm)" />
      <rect width={w} height={h} filter="url(#grain)" opacity={0.16} />
      <rect x={m} y={m} width={w - 2 * m} height={h - 2 * m} fill="none" stroke={HIST_COL.sepia} strokeWidth={3} />
      <rect x={m2} y={m2} width={w - 2 * m2} height={h - 2 * m2} fill="none" stroke={HIST_COL.sepia} strokeWidth={1.4} />
      {ticks}
      {/* زخارف الزوايا */}
      {[[m2, m2, 1, 1], [w - m2, m2, -1, 1], [m2, h - m2, 1, -1], [w - m2, h - m2, -1, -1]].map(([x, y, sx, sy], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${sx} ${sy})`} stroke={HIST_COL.sepia} fill="none" strokeWidth={2.6}>
          <path d="M0 0 H78 M0 0 V78 M12 12 H56 M12 12 V56" /><circle cx={92} cy={0} r={5} fill={HIST_COL.sepia} /><circle cx={0} cy={92} r={5} fill={HIST_COL.sepia} />
          <path d="M24 24 q26 -2 32 24 q-24 8 -32 -24 z" />
        </g>
      ))}
      {/* وردة الرياح (أسفل اليمين) */}
      <g transform={`translate(${w - 150} ${h - 190})`} stroke={HIST_COL.sepia} fill="none" strokeWidth={2.4} strokeLinejoin="round">
        <circle r={70} opacity={0.6} />
        <circle r={52} opacity={0.4} />
        <path d="M0 -92 L12 -12 L0 0 L-12 -12 Z" fill={HIST_COL.sepia} />
        <path d="M0 92 L12 12 L0 0 L-12 12 Z" />
        <path d="M-92 0 L-12 12 L0 0 L-12 -12 Z" />
        <path d="M92 0 L12 12 L0 0 L12 -12 Z" />
        <path d="M-50 -50 L-8 -8 M50 -50 L8 -8 M-50 50 L-8 8 M50 50 L8 8" strokeWidth={1.6} />
      </g>
    </svg>
  );
};
