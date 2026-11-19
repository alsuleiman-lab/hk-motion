import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { clamp01, easeInOut, easeOut, lerp } from "./motion";
import { back } from "./PaperSteps";
import { ff, useFonts } from "./fonts";

/**
 * تمرين على مرجع «حركة الكلمات» (ريل إنستغرام طولي 37ث، 2026-11-19، محفوظ في معرض المراجع):
 * أرضية كريمية بشبكة خفيفة، ألواح خمرية وخضراء مزرقة تنزلق بميل، كلمات كبيرة بظل منزاح ملوّن، شخصية مربعة يجرّ سلكها خطاً عبر الشاشة،
 * مربع تحديد بمقابض حول كلمة، صندوق يُكتب فيه حرفاً حرفاً، حرف يتمدد بالكشيدة، أشرطة تتراكم مع عدّاد ساعات، شبكة كل المشاهد، وحرف أخير نقطته الشخصية.
 * الخطوط فخمة ويدوية (أمر المستخدم 2026-11-19). النص مثال.
 */
export const KINETIC_TYPE_FRAMES = 690;
const W = 1080, H = 1920;
const C = { cream: "#ece3d3", maroon: "#6b1b2b", teal: "#1f6b66", dark: "#2a1518", ink: "#2a1518", line: "rgba(80,40,30,.07)" };

const Grid: React.FC<{ c: string; dark?: boolean }> = ({ c, dark }) => (
  <AbsoluteFill style={{ background: c, backgroundImage: `linear-gradient(${dark ? "rgba(255,255,255,.06)" : C.line} 2px, transparent 2px), linear-gradient(90deg, ${dark ? "rgba(255,255,255,.06)" : C.line} 2px, transparent 2px)`, backgroundSize: "54px 54px" }} />
);
/** لوح ملوّن ينزلق من جهة بميل خفيف ثم يستقيم. */
const Panel: React.FC<{ at: number; c: string; from: "r" | "l" | "b" | "t"; children?: React.ReactNode }> = ({ at, c, from, children }) => {
  const f = useCurrentFrame() - at;
  if (f < 0) return null;
  const k = easeOut(f / 10), d = (1 - k);
  const tx = from === "r" ? d * W * 1.1 : from === "l" ? -d * W * 1.1 : 0, ty = from === "b" ? d * H : from === "t" ? -d * H : 0;
  return <AbsoluteFill style={{ transform: `translate(${tx}px, ${ty}px) rotate(${d * (from === "r" ? 6 : -6)}deg)`, boxShadow: "0 0 60px rgba(0,0,0,.25)" }}><Grid c={c} dark />{children}</AbsoluteFill>;
};
/** كلمة كبيرة بظل منزاح ملوّن، تقفز إلى مكانها. */
const Big: React.FC<{ at: number; text: string; x: number; y: number; size: number; font: Parameters<typeof ff>[0]; c: string; sh: string; rot?: number; anchor?: "c" | "r" }> = ({ at, text, x, y, size, font, c, sh, rot = 0, anchor = "c" }) => {
  const f = useCurrentFrame() - at;
  if (f < 0) return null;
  const z = font === "kafRuqaa" || font === "kafRuqaaSw" ? 1.45 : font === "ruqaa" || font === "ruqaaInk" ? 1.25 : 1; size = size * z;
  const k = back(f / 9, 2), off = size * 0.06 * clamp01(f / 6);
  const pos: React.CSSProperties = anchor === "c" ? { left: 0, width: W, textAlign: "center", top: y } : { right: W - x, top: y };
  return (
    <div style={{ position: "absolute", ...pos, fontFamily: ff(font), fontSize: size, lineHeight: 1.15, color: c, direction: "rtl", whiteSpace: "nowrap", transform: `rotate(${rot}deg) scale(${Math.max(0, k)})`, transformOrigin: anchor === "c" ? "50% 50%" : "100% 50%", textShadow: `${off}px ${off}px 0 ${sh}` }}>{text}</div>
  );
};
/** الشخصية: مربع بوجه مبتسم، وسلك يُرسم من خارج الإطار إليه. */
const Mascot: React.FC<{ at: number; x: number; y: number; path: string; c: string; face?: string; dur?: number }> = ({ at, x, y, path, c, face = C.cream, dur = 16 }) => {
  const f = useCurrentFrame() - at;
  if (f < 0) return null;
  const k = easeInOut(f / dur), blink = Math.floor((f + 7) / 40) % 6 === 0 && (f + 7) % 40 < 3;
  return (
    <>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}><path d={path} stroke={c} strokeWidth={6} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={`${k} 1`} /></svg>
      {k > 0.85 && <svg width={70} height={70} style={{ position: "absolute", left: x - 35, top: y - 35, transform: `scale(${back((f - dur * 0.85) / 8, 2.4)})` }}>
        <rect x={4} y={4} width={62} height={62} rx={8} fill={c} />
        <rect x={10} y={10} width={50} height={50} rx={5} fill={face} />
        {blink ? <><line x1={20} y1={28} x2={30} y2={28} stroke={c} strokeWidth={4} /><line x1={40} y1={28} x2={50} y2={28} stroke={c} strokeWidth={4} /></> : <><rect x={21} y={22} width={7} height={11} fill={c} /><rect x={42} y={22} width={7} height={11} fill={c} /></>}
        <path d="M20 42 Q35 54 50 42" stroke={c} strokeWidth={5} fill="none" strokeLinecap="round" />
      </svg>}
    </>
  );
};
/** مربع تحديد منقّط بمقابض حول كلمة (كأنه برنامج تصميم). */
const SelectBox: React.FC<{ at: number; x: number; y: number; w: number; h: number; c: string }> = ({ at, x, y, w, h, c }) => {
  const k = easeOut((useCurrentFrame() - at) / 8);
  if (k <= 0) return null;
  return (
    <div style={{ position: "absolute", left: x + (w * (1 - k)) / 2, top: y + (h * (1 - k)) / 2, width: w * k, height: h * k, border: `3px solid ${c}` }}>
      {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b], i) => <div key={i} style={{ position: "absolute", left: a ? undefined : -10, right: a ? -10 : undefined, top: b ? undefined : -10, bottom: b ? -10 : undefined, width: 16, height: 16, background: C.cream, border: `3px solid ${c}` }} />)}
    </div>
  );
};
/** صندوق يُكتب فيه النص حرفاً حرفاً مع مؤشر، ثم زر «أرسل». */
const TypeBox: React.FC<{ at: number; text: string; y: number }> = ({ at, text, y }) => {
  const f = useCurrentFrame() - at;
  if (f < 0) return null;
  const k = back(f / 10, 1.4), chars = [...text], n = Math.max(0, Math.floor((f - 10) / 1.6));
  const shown = chars.slice(0, n).join(""), caret = Math.floor(f / 8) % 2 === 0;
  return (
    <div style={{ position: "absolute", left: 120, top: y, width: W - 240, transform: `scale(${Math.max(0, k)})`, transformOrigin: "50% 0" }}>
      <div style={{ background: C.cream, padding: "26px 34px", minHeight: 330, direction: "rtl", fontFamily: ff("ruqaa"), color: C.ink }}>
        <div style={{ fontSize: 34, color: C.maroon }}>الوصف:</div>
        <div style={{ fontSize: 74, lineHeight: 1.35 }}>{shown}<span style={{ opacity: caret ? 1 : 0, color: C.maroon }}>|</span></div>
      </div>
      {n >= chars.length + 4 && <div style={{ marginTop: 26, marginRight: 0, width: 220, padding: "10px 0", background: C.teal, color: C.cream, textAlign: "center", fontFamily: ff("ruqaa"), fontSize: 48, transform: `scale(${back((n - chars.length - 4) / 6, 2)})` }}>أرسل</div>}
    </div>
  );
};
/** كلمة تتمدد بالكشيدة: يزيد عدد المدّات حتى يمتد الخط. */
const Stretch: React.FC<{ at: number; a: string; b: string; y: number; font: Parameters<typeof ff>[0]; c: string }> = ({ at, a, b, y, font, c }) => {
  const f = useCurrentFrame() - at;
  if (f < 0) return null;
  const n = Math.round(easeInOut(f / 24) * 9);
  return <div style={{ position: "absolute", left: 0, width: W, top: y, textAlign: "center", fontFamily: ff(font), fontSize: 150, color: c, direction: "rtl", whiteSpace: "nowrap", transform: `scaleX(${1 + Math.sin(clamp01(f / 24) * Math.PI) * 0.05})` }}>{a}{"ـ".repeat(n)}{b}</div>;
};
/** أشرطة تتراكم من أسفل إلى أعلى، كل شريط بتسميته ومدته. */
const Bars: React.FC<{ at: number; items: [string, string, string][] }> = ({ at, items }) => {
  const f = useCurrentFrame() - at;
  return (
    <>
      {items.map(([t, v, c], i) => { const a = i * 12; if (f < a) return null; const k = easeOut((f - a) / 9);
        return <div key={i} style={{ position: "absolute", left: 130 + (1 - k) * 900, top: 1240 - i * 130, width: 820, height: 104, background: c, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 40px", direction: "rtl", fontFamily: ff("ruqaa"), fontWeight: 700, fontSize: 74, color: c === C.cream ? C.ink : C.cream, boxShadow: "0 10px 20px rgba(0,0,0,.3)" }}><span>{t}</span><span style={{ fontFamily: ff("rakkas"), fontSize: 56 }}>{v}</span></div>; })}
    </>
  );
};

/* ---------- الجدول ---------- */
const T = { s1: 0, s2: 75, s3: 150, s4: 225, s5: 300, s6: 420, s7: 490, s8: 590, s9: 630 };
const SC = [T.s1, T.s2, T.s3, T.s4, T.s5, T.s6, T.s7, T.s8, T.s9, KINETIC_TYPE_FRAMES];

const Scene: React.FC<{ i: number }> = ({ i }) => {
  const f = useCurrentFrame();
  switch (i) {
    case 0: return (<>
      <Grid c={C.cream} />
      <Big at={4} text="ما راح" x={820} y={330} size={130} font="rakkas" c={C.ink} sh={C.teal} anchor="r" />
      <Mascot at={10} x={300} y={560} path={`M${W + 20} 520 C 700 520 600 470 420 500 S 300 560 300 560`} c={C.maroon} />
      <Big at={22} text="تصدق" x={0} y={600} size={260} font="kafRuqaa" c={C.maroon} sh={C.teal} rot={-4} />
    </>);
    case 1: return (<Panel at={T.s2} c={C.maroon} from="r">
      <Big at={T.s2 + 8} text="هالموشن" x={0} y={420} size={170} font="rakkas" c={C.cream} sh={C.dark} />
      <SelectBox at={T.s2 + 16} x={160} y={430} w={760} h={210} c={C.cream} />
      <Big at={T.s2 + 26} text="جرافيك كله" x={0} y={700} size={150} font="ruqaa" c={C.cream} sh={C.dark} />
      <Mascot at={T.s2 + 30} x={760} y={1380} path={`M${W + 20} 1300 C 980 1400 900 1380 760 1380`} c={C.cream} face={C.maroon} />
    </Panel>);
    case 2: return (<>
      <Grid c={C.cream} />
      <Mascot at={T.s3 + 2} x={180} y={300} path={`M 520 -20 C 400 160 220 200 180 300`} c={C.maroon} />
      <Big at={T.s3 + 6} text="بدون ما تفتح" x={900} y={250} size={84} font="ruqaa" c={C.ink} sh="transparent" anchor="r" />
      <Big at={T.s3 + 16} text="برنامج" x={0} y={520} size={250} font="typokar" c={C.maroon} sh={C.teal} />
      <Big at={T.s3 + 26} text="مونتاج" x={0} y={820} size={230} font="typokar" c={C.maroon} sh={C.teal} rot={-3} />
      {f > T.s3 + 40 && <div style={{ position: "absolute", left: 200, top: 1000, width: 680 * easeOut((f - T.s3 - 40) / 8), height: 18, background: C.teal, transform: "rotate(-8deg)" }} />}
    </>);
    case 3: return (<Panel at={T.s4} c={C.teal} from="l">
      <Big at={T.s4 + 8} text="ولا" x={0} y={480} size={140} font="ruqaaInk" c={C.cream} sh={C.dark} />
      <Big at={T.s4 + 16} text="قالب جاهز" x={0} y={700} size={190} font="kafRuqaaSw" c={C.cream} sh={C.dark} rot={-4} />
      <Mascot at={T.s4 + 20} x={880} y={1260} path={`M -20 1500 C 200 1200 300 1000 540 1000 S 980 1100 880 1260`} c={C.cream} face={C.teal} dur={22} />
    </Panel>);
    case 4: return (<Panel at={T.s5} c={C.maroon} from="b">
      <Big at={T.s5 + 8} text="توصف له" x={0} y={250} size={120} font="ruqaa" c={C.cream} sh={C.dark} />
      <Big at={T.s5 + 14} text="الحركة بالكلام" x={0} y={410} size={140} font="rakkas" c={C.cream} sh={C.dark} />
      <TypeBox at={T.s5 + 26} y={700} text="خلّ الكلمة تتمدد، والكاميرا تطير، وبدون ولا قطع." />
    </Panel>);
    case 5: return (<Panel at={T.s6} c={C.teal} from="r">
      <Big at={T.s6 + 6} text="شوف الحروف كيف" x={0} y={420} size={110} font="ruqaa" c={C.cream} sh={C.dark} />
      <Stretch at={T.s6 + 16} a="تتمـ" b="ـدد" y={760} font="rakkas" c={C.cream} />
      <Mascot at={T.s6 + 10} x={260} y={700} path={`M -20 900 C 120 820 200 760 260 700`} c={C.cream} face={C.teal} />
    </Panel>);
    case 6: { const hrs = Math.min(14, Math.floor(clamp01((f - T.s7 - 10) / 60) * 14)); return (<Panel at={T.s7} c={C.dark} from="t">
      <Big at={T.s7 + 6} text="شغلك الحين:" x={900} y={230} size={80} font="ruqaa" c={C.cream} sh="transparent" anchor="r" />
      <div style={{ position: "absolute", right: 180, top: 360, fontFamily: ff("rakkas"), fontSize: 170, color: C.cream, direction: "rtl" }}>{hrs.toLocaleString("ar-EG")} ساعة</div>
      <Bars at={T.s7 + 16} items={[["مونتاج", "+٣ س", C.maroon], ["طبقات", "+٤ س", C.teal], ["تحريك", "+٤ س", C.cream], ["تصدير", "+٣ س", C.maroon]]} />
    </Panel>); }
    case 7: { const k = easeInOut((f - T.s8) / 30), s = lerp(3.2, 1, k);
      const tiles = ["تصدق", "هالموشن", "مونتاج", "قالب", "الكلام", "تتمدد", "ساعة", "ما راح", "جرافيك"]; const cols = [C.cream, C.maroon, C.cream, C.teal, C.maroon, C.teal, C.dark, C.cream, C.maroon];
      return (<AbsoluteFill style={{ background: C.dark, transform: `scale(${s})`, transformOrigin: "50% 50%" }}>
        {tiles.map((t, i) => <div key={i} style={{ position: "absolute", left: (i % 3) * 360 + 6, top: Math.floor(i / 3) * 640 + 6, width: 348, height: 628, background: cols[i], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: ff(i % 2 ? "ruqaa" : "kafRuqaa"), fontSize: 92, color: cols[i] === C.cream ? C.maroon : C.cream, direction: "rtl" }}>{t}</div>)}
      </AbsoluteFill>); }
    case 8: return (<>
      <Grid c={C.cream} />
      <Big at={T.s9 + 4} text="ب" x={0} y={560} size={520} font="kafRuqaa" c={C.maroon} sh={C.teal} />
      <Mascot at={T.s9 + 14} x={W / 2} y={1260} path={`M ${W + 20} 1700 C 800 1600 700 1400 ${W / 2} 1260`} c={C.maroon} />
      <Big at={T.s9 + 30} text="محمد بن شمس الدين" x={0} y={1600} size={84} font="ruqaa" c={C.ink} sh="transparent" />
    </>);
  }
  return null;
};

export const KineticType: React.FC = () => {
  useFonts(["rakkas", "kafRuqaa", "kafRuqaaSw", "ruqaa", "ruqaaInk", "typokar"]);
  const f = useCurrentFrame();
  const i = SC.findIndex((s, j) => f >= s && f < SC[j + 1]);
  /* المشهد السابق يبقى تحت اللوح الداخل حتى يغطيه (10 إطارات) */
  const prev = i > 0 && f - SC[i] < 10 && [1, 3, 4, 5, 6].includes(i) ? i - 1 : -1;
  /* خروج سريع بميل وضبابية في آخر 5 إطارات من بعض المشاهد (كاميرا تطير) */
  const left = SC[i + 1] - f, out = [0, 2, 7].includes(i) && left <= 5 ? (6 - left) / 6 : 0;
  return (
    <AbsoluteFill style={{ background: C.cream, overflow: "hidden" }}>
      {prev >= 0 && <Scene i={prev} />}
      <AbsoluteFill style={{ transform: out ? `translateY(${-out * out * 900}px) rotate(${-out * 8}deg)` : undefined, filter: out ? `blur(${out * 10}px)` : undefined }}>
        <Scene i={i} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
