import React from "react";
import { loadFont as loadAmiri } from "@remotion/google-fonts/Amiri";
import { loadFont as loadFell } from "@remotion/google-fonts/IMFellDoublePica";
import { loadFont as loadEB } from "@remotion/google-fonts/EBGaramond";

/**
 * الطابع التاريخي الإلزامي لفيديوهات التاريخ (الموشن التوضيحي): خطوط مخطوطات وطباعة قديمة، وأحبار وأصباغ مخطوطات (حبر عفص بني،
 * لازورد، قرمز، ورق ذهب، أخضر نحاسي)، ولوحات رق بحد مزدوج وأزرار زاوية، وشريط زمني على هيئة مسطرة مزخرفة.
 * كل عنصر شاشة (لوحات، أرقام، شريط، ميداليات) يُبنى من هنا فلا يظهر أي مكوّن بنمط حديث مسطّح.
 */
export const F_AR = loadAmiri("normal", { weights: ["400", "700"], subsets: ["arabic", "latin"] }).fontFamily;
export const F_LAT = loadFell("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily;

/** الأرقام بخط غراموند بأرقام اصطفافية (lnum) كي تُقرأ 1263 لا I263 كما في الأرقام القديمة */
export const F_NUM = loadEB("normal", { weights: ["500", "600"], subsets: ["latin"] }).fontFamily;

export const HS = {
  parch: "#f7e9c6", parch2: "#edd59f", parch3: "#e2c07c",
  ink: "#3f2b17", sepia: "#8a6a3b", mute: "#7a6648",
  gold: "#c08418", lapis: "#2b4a7a", vermilion: "#a63a2b", verdigris: "#2f7a73",
  shadow: "rgba(90,64,37,0.32)",
};

/** لوحة رق: تدرّج ورق، حدّ مزدوج بالسيبيا، أزرار في الزوايا. `pad` للحشو. */
export const HPanel: React.FC<{ children: React.ReactNode; pad?: string; style?: React.CSSProperties; dataQa?: string; accent?: string }> = ({ children, pad = "12px 28px 14px", style, dataQa, accent = HS.gold }) => (
  <div data-qa={dataQa} style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 20, padding: pad, background: `linear-gradient(180deg,${HS.parch} 0%,${HS.parch2} 100%)`, border: `3px solid ${HS.sepia}`, borderRadius: 8, boxShadow: `inset 0 0 0 5px ${HS.parch}, inset 0 0 0 7px ${accent}, inset 0 0 20px rgba(160,120,50,0.3), 0 10px 24px ${HS.shadow}`, ...style }}>
    {children}
  </div>
);

/** ميدالية دائرية بحلقتين تحمل رمزاً */
export const Medallion: React.FC<{ children: React.ReactNode; size?: number; accent?: string }> = ({ children, size = 190, accent = HS.vermilion }) => (
  <div style={{ width: size, height: size, borderRadius: size / 2, background: `radial-gradient(circle at 40% 35%, ${HS.parch} 0%, ${HS.parch2} 100%)`, border: `5px solid ${HS.sepia}`, boxShadow: `inset 0 0 0 7px ${HS.parch}, inset 0 0 0 10px ${accent}, 0 12px 28px ${HS.shadow}`, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
);

/** شريط زمني على هيئة مسطرة مخطوطة: خط مزدوج، علامات لكل سنة، علامات كبرى للأحداث بمعيّنات ذهبية، وختم يتقدم. */
export const HistTimeline: React.FC<{ w: number; h: number; y: number; x0: number; x1: number; y0: number; y1: number; events: number[]; prog: number }> = ({ w, h, y, x0, x1, y0, y1, events, prog }) => {
  const X = (v: number) => x0 + ((v - y0) / (y1 - y0)) * (x1 - x0);
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
      <rect x={x0 - 22} y={y - 20} width={x1 - x0 + 44} height={40} rx={6} fill={HS.parch} opacity={0.92} stroke={HS.sepia} strokeWidth={2.5} />
      <line x1={x0} x2={x1} y1={y - 4} y2={y - 4} stroke={HS.sepia} strokeWidth={2} />
      <line x1={x0} x2={x1} y1={y + 4} y2={y + 4} stroke={HS.sepia} strokeWidth={2} />
      {Array.from({ length: y1 - y0 + 1 }, (_, i) => y0 + i).map((v) => <line key={v} x1={X(v)} x2={X(v)} y1={y - 14} y2={y - 6} stroke={HS.sepia} strokeWidth={v % 10 === 0 ? 2.4 : 1.2} />)}
      <line x1={x0} x2={X(Math.max(y0, prog))} y1={y} y2={y} stroke={HS.gold} strokeWidth={6} strokeLinecap="round" />
      {events.map((v) => <path key={v} d={`M${X(v)} ${y - 12} l8 12 l-8 12 l-8 -12 z`} fill={prog >= v - 0.01 ? HS.gold : HS.parch} stroke={HS.sepia} strokeWidth={2.2} />)}
      <circle cx={X(prog)} cy={y} r={14} fill={HS.vermilion} stroke={HS.parch} strokeWidth={4} />
      <circle cx={X(prog)} cy={y} r={14} fill="none" stroke={HS.sepia} strokeWidth={2} />
    </svg>
  );
};
