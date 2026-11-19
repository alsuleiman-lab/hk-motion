import React from "react";
import { MINI } from "./Miniatures";

/* =====================================================================
 * مشاهد حيّة مرسومة بلا ملامح وجه: عالِم، قاضٍ، أمير، تلميذ، سجين، درس، مجلس قضاء، زنزانة، وثيقة تتمزق، وأيقونات بهيئة مخطوطات
 * ===================================================================== */
export type FigKind = "scholar" | "elder" | "judge" | "emir" | "student" | "prisoner";
const FIG: Record<FigKind, { robe: string; turban: string; beard: string | null; stripe: string }> = {
  scholar: { robe: "#efe0b8", turban: "#fbf3dc", beard: "#e9e2cf", stripe: "#c08418" },
  elder: { robe: "#e6d3a3", turban: "#f6ecd0", beard: "#f1ede0", stripe: "#8a6a3b" },
  judge: { robe: "#5f8a6b", turban: "#2f7a73", beard: "#9a9a88", stripe: "#e9d9a1" },
  emir: { robe: "#a63a2b", turban: "#c9503a", beard: "#6b4a2a", stripe: "#e0a93b" },
  student: { robe: "#e9d7a8", turban: "#f4ead0", beard: null, stripe: "#b5a06a" },
  prisoner: { robe: "#cdb98b", turban: "#d8c8a0", beard: "#8a7a5a", stripe: "#a89870" },
};

/** شخص مرسوم بجبة وعمامة (بلا عينين ولا فم) */
export const Scholar: React.FC<{ kind?: FigKind; s?: number; book?: boolean; sway?: number }> = ({ kind = "scholar", s = 120, book = true, sway = 0 }) => {
  const f = FIG[kind];
  return (
    <svg width={s * 0.84} height={s} viewBox="0 0 100 120" style={{ overflow: "visible", transform: `rotate(${Math.sin(sway) * 1.2}deg)`, transformOrigin: "50% 100%" }}>
      <g stroke={MINI.ink} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round">
        <path d="M14 114 C14 76 28 58 50 58 C72 58 86 76 86 114 Z" fill={f.robe} />
        <path d="M26 88 C40 96 60 96 74 88" fill="none" stroke={f.stripe} strokeWidth={5} />
        {kind === "prisoner" && <g><path d="M24 104 L40 112" stroke={MINI.iron} strokeWidth={4} /><circle cx={22} cy={104} r={5} fill="none" stroke={MINI.iron} strokeWidth={3} /></g>}
        <circle cx={50} cy={42} r={15} fill="#e6bf93" />
        {f.beard && <path d="M36 47 C37 70 63 70 64 47 C58 55 42 55 36 47 Z" fill={f.beard} />}
        <ellipse cx={50} cy={28} rx={21} ry={12} fill={f.turban} />
        <path d="M31 30 C40 36 60 36 69 30" fill="none" stroke={f.stripe} strokeWidth={3} />
        <circle cx={50} cy={17} r={6} fill={f.turban} />
        {kind === "emir" && <path d="M34 20 L38 8 L45 16 L50 4 L55 16 L62 8 L66 20 Z" fill="#e0a93b" />}
        {book && kind !== "prisoner" && <g><rect x={28} y={86} width={44} height={24} rx={3} fill="#f6ecd0" /><path d="M33 94 H46 M33 100 H46 M54 94 H67 M54 100 H67" fill="none" strokeWidth={1.4} /></g>}
      </g>
    </svg>
  );
};

/** درس: معلّم على منبر وتلاميذ بالكتب داخل قوس */
export const LessonScene: React.FC<{ w?: number; t?: number }> = ({ w = 520, t = 0 }) => (
  <div style={{ position: "relative", width: w, height: w * 0.72 }}>
    <svg width={w} height={w * 0.72} viewBox="0 0 520 374" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <path d="M12 370 V150 C12 60 120 12 260 12 C400 12 508 60 508 150 V370 Z" fill={MINI.sand} stroke={MINI.ink} strokeWidth={5} />
      <path d="M32 370 V156 C32 78 130 34 260 34 C390 34 488 78 488 156 V370" fill="none" stroke={MINI.sand3} strokeWidth={5} />
      <rect x={150} y={250} width={220} height={26} fill={MINI.horse} stroke={MINI.ink} strokeWidth={3} />
      <rect x={30} y={338} width={460} height={28} fill={MINI.sand3} stroke={MINI.ink} strokeWidth={3} />
    </svg>
    <div style={{ position: "absolute", left: 200, top: 90 }}><Scholar kind="elder" s={170} sway={t * 2} /></div>
    {[0, 1, 2, 3].map((i) => <div key={i} style={{ position: "absolute", left: 40 + i * 112, top: 256 }}><Scholar kind="student" s={92} sway={t * 2 + i} /></div>)}
  </div>
);

/** مجلس القضاة: قاضيان خلف منضدة وميزان نحاسي */
export const JudgesScene: React.FC<{ w?: number; t?: number }> = ({ w = 380, t = 0 }) => (
  <div style={{ position: "relative", width: w, height: w * 0.66 }}>
    <div style={{ position: "absolute", left: 20, top: 0 }}><Scholar kind="judge" s={150} sway={t * 1.6} /></div>
    <div style={{ position: "absolute", left: 210, top: 0 }}><Scholar kind="judge" s={150} sway={t * 1.6 + 1} /></div>
    <svg width={w} height={w * 0.66} viewBox="0 0 380 250" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <rect x={4} y={150} width={372} height={70} rx={6} fill="#c9a56a" stroke={MINI.ink} strokeWidth={3} />
      <path d="M190 150 V100 M150 100 H230" stroke={MINI.ink} strokeWidth={4} fill="none" strokeLinecap="round" />
      <path d="M150 100 L134 130 H166 Z M230 100 L214 130 H246 Z" fill="#e0a93b" stroke={MINI.ink} strokeWidth={2.4} />
    </svg>
  </div>
);

/** أمير على عرش */
export const EmirScene: React.FC<{ w?: number; t?: number }> = ({ w = 220, t = 0 }) => (
  <div style={{ position: "relative", width: w, height: w * 1.2 }}>
    <svg width={w} height={w * 1.2} viewBox="0 0 220 264" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <path d="M30 250 V70 C30 30 80 14 110 14 C140 14 190 30 190 70 V250 Z" fill={MINI.cloth} stroke={MINI.ink} strokeWidth={4} opacity={0.85} />
      <rect x={20} y={226} width={180} height={28} rx={5} fill={MINI.horse} stroke={MINI.ink} strokeWidth={3} />
    </svg>
    <div style={{ position: "absolute", left: 40, top: 50 }}><Scholar kind="emir" s={170} sway={t * 1.4} book={false} /></div>
  </div>
);

/** زنزانة: قوس حجري ونافذة بضوء وسجين جالس بسلسلة */
export const PrisonCell: React.FC<{ w?: number; t?: number }> = ({ w = 440, t = 0 }) => (
  <div style={{ position: "relative", width: w, height: w * 1.2 }}>
    <svg width={w} height={w * 1.2} viewBox="0 0 440 528" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs><linearGradient id="cellg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d9c493" /><stop offset="1" stopColor="#b79f6c" /></linearGradient></defs>
      <path d="M10 520 V190 C10 70 110 10 220 10 C330 10 430 70 430 190 V520 Z" fill="url(#cellg)" stroke={MINI.ink} strokeWidth={6} />
      {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M10 ${80 + i * 50} H430`} stroke={MINI.sand3} strokeWidth={2} opacity={0.7} />)}
      {Array.from({ length: 6 }, (_, i) => <path key={`v${i}`} d={`M${60 + i * 64} ${100 + (i % 2) * 25} V${150 + (i % 2) * 25}`} stroke={MINI.sand3} strokeWidth={2} opacity={0.7} />)}
      <path d="M160 160 V100 C160 60 280 60 280 100 V160 Z" fill="#fbeab5" stroke={MINI.ink} strokeWidth={4} />
      <path d="M190 160 V90 M220 160 V82 M250 160 V90" stroke={MINI.iron} strokeWidth={6} />
      <path d="M170 160 L120 520 H320 L270 160 Z" fill="#f6df9b" opacity={0.35 + 0.05 * Math.sin(t * 2)} />
      <rect x={10} y={470} width={420} height={50} fill={MINI.sand3} stroke={MINI.ink} strokeWidth={4} />
    </svg>
    <div style={{ position: "absolute", left: w * 0.5 - 100, top: w * 1.2 - 270 }}><Scholar kind="prisoner" s={230} book={false} sway={t * 1.2} /></div>
  </div>
);

/** وثيقة بختم أحمر تتمزق نصفين (k من 0 إلى 1) */
export const TornDeed: React.FC<{ w?: number; k: number }> = ({ w = 220, k }) => {
  const sp = Math.min(1, Math.max(0, (k - 0.5) / 0.4)) * 40;
  const half = (side: 1 | -1) => (
    <g transform={`translate(${side * sp} ${sp * 0.3 * side}) rotate(${side * sp * 0.25} 110 90)`}>
      <clipPath id={`deed${side}`}><path d={side < 0 ? "M0 0 H116 L100 30 L120 58 L98 86 L118 114 L104 150 H0 Z" : "M120 0 H220 V150 H104 L118 114 L98 86 L120 58 L100 30 L116 0 Z"} /></clipPath>
      <g clipPath={`url(#deed${side})`}>
        <rect x={0} y={0} width={220} height={150} rx={6} fill={MINI.sand} stroke={MINI.ink} strokeWidth={3} />
        {[28, 52, 76, 100].map((y) => <path key={y} d={`M26 ${y} H194`} stroke={MINI.ink2} strokeWidth={2.4} opacity={0.65} />)}
        <circle cx={110} cy={124} r={14} fill={MINI.cloth} stroke={MINI.ink} strokeWidth={2.4} />
      </g>
    </g>
  );
  return <svg width={w} height={w * 0.7} viewBox="0 0 220 154" style={{ overflow: "visible" }}>{half(-1)}{half(1)}</svg>;
};

/* أيقونات مخطوطات مملوءة (بدل الخطوط الرفيعة الحديثة) */
export const Codex: React.FC<{ s?: number }> = ({ s = 120 }) => (
  <svg width={s} height={s} viewBox="0 0 100 100"><g stroke={MINI.ink} strokeWidth={2.6} strokeLinejoin="round">
    <path d="M12 26 L50 20 L88 26 V76 L50 82 L12 76 Z" fill={MINI.horse} />
    <path d="M18 30 L50 25 L82 30 V72 L50 77 L18 72 Z" fill="#f6ecd0" />
    <path d="M50 25 V77" fill="none" />
    <path d="M26 38 H44 M26 46 H44 M26 54 H44 M56 38 H74 M56 46 H74 M56 54 H74" fill="none" strokeWidth={1.6} />
    <rect x={44} y={44} width={12} height={14} rx={2} fill={MINI.sand3} /><circle cx={50} cy={51} r={3} fill="#e0a93b" />
  </g></svg>
);
export const BrassScales: React.FC<{ s?: number }> = ({ s = 120 }) => (
  <svg width={s} height={s} viewBox="0 0 100 100"><g stroke={MINI.ink} strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round">
    <path d="M50 14 V80" /><path d="M28 86 H72 L66 78 H34 Z" fill={MINI.sand3} /><path d="M16 28 H84" strokeWidth={4} /><circle cx={50} cy={14} r={6} fill="#e0a93b" />
    <path d="M16 28 L6 58 H32 Z" fill="#e0a93b" /><path d="M84 28 L74 58 H100 Z" fill="#e0a93b" />
    <path d="M16 28 L6 58 M16 28 L32 58 M84 28 L74 58 M84 28 L100 58" fill="none" strokeWidth={1.4} />
  </g></svg>
);
export const Hourglass: React.FC<{ s?: number }> = ({ s = 120 }) => (
  <svg width={s} height={s} viewBox="0 0 100 100"><g stroke={MINI.ink} strokeWidth={2.6} strokeLinejoin="round">
    <rect x={22} y={10} width={56} height={9} rx={3} fill={MINI.horse} /><rect x={22} y={81} width={56} height={9} rx={3} fill={MINI.horse} />
    <path d="M28 19 H72 C72 40 56 46 56 50 C56 54 72 60 72 81 H28 C28 60 44 54 44 50 C44 46 28 40 28 19 Z" fill="#f6efd6" />
    <path d="M32 21 H68 C66 34 56 40 50 44 C44 40 34 34 32 21 Z" fill="#d9a441" stroke="none" /><path d="M36 79 H64 C62 70 54 64 50 60 C46 64 38 70 36 79 Z" fill="#d9a441" stroke="none" />
  </g></svg>
);
export const Mausoleum: React.FC<{ s?: number }> = ({ s = 150 }) => (
  <svg width={s} height={s} viewBox="0 0 120 120"><g stroke={MINI.ink} strokeWidth={2.6} strokeLinejoin="round">
    <path d="M26 104 V66 H94 V104 Z" fill={MINI.sand2} />
    <path d="M32 66 C32 40 48 28 60 28 C72 28 88 40 88 66 Z" fill={MINI.dome} />
    <path d="M60 28 V16" fill="none" /><path d="M66 8 A9 9 0 1 0 66 24 A7 7 0 1 1 66 8 Z" fill="#e0a93b" />
    <path d="M48 104 V82 A12 12 0 0 1 72 82 V104" fill={MINI.sand3} />
    <path d="M14 104 H106" fill="none" strokeWidth={4} />
  </g></svg>
);
export const Gravestone: React.FC<{ s?: number }> = ({ s = 150 }) => (
  <svg width={s} height={s} viewBox="0 0 120 120"><g stroke={MINI.ink} strokeWidth={2.6} strokeLinejoin="round">
    <path d="M32 106 V54 C32 30 46 18 60 18 C74 18 88 30 88 54 V106 Z" fill={MINI.sand2} />
    <path d="M42 106 V58 C42 42 50 32 60 32 C70 32 78 42 78 58 V106" fill="none" />
    <path d="M48 62 H72 M48 74 H72 M48 86 H72" fill="none" strokeWidth={1.8} />
    <path d="M18 106 H102" fill="none" strokeWidth={4} />
    <ellipse cx={60} cy={20} rx={22} ry={11} fill="#f6ecd0" /><path d="M40 22 C50 28 70 28 80 22" fill="none" stroke="#c08418" strokeWidth={3} /><circle cx={60} cy={10} r={5} fill="#f6ecd0" />
    <path d="M24 106 C22 96 18 92 14 90 M24 106 C28 96 32 94 36 94 M96 106 C98 96 102 92 106 90" fill="none" stroke="#2f7a73" strokeWidth={3} />
  </g></svg>
);
