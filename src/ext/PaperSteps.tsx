import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { clamp01, easeInOut, easeOut, lerp } from "./motion";
import { SfxTrack } from "./sfx";
import { mulberry32 } from "./rand";
import { ff, useFonts } from "./fonts";

/**
 * تمرين على مرجع «إعلان الخطوات الورقي» (فيديو جرافيكا على بنترست، 2026-11-19، المحفوظ في معرض المراجع):
 * ورق مجعّد يرتجف كأنه تصوير إطار بإطار، صفحة تتمزق فتكشف قصاصة، دخول عبر النافذة، دائرة العنوان،
 * مسحة لون، ثم خطوات مرقّمة: مربع منقّط يدور، خط أسود يشق العنوان، أشياء مقصوصة تسقط وتستقر، وانتقال سحب عمودي ضبابي،
 * ثم سطر الختام بحروف تومض والشعار. كل الرسوم من الكود؛ النص مثال.
 */
export const PAPER_STEPS_FRAMES = 780;
const W = 1080, H = 1920;

type Pal = { paper: string; ink: string; accent: string; sun: string; red: string; leaf: string; kraft: string };
const PALS: Record<string, Pal> = {
  /* ألوان المرجع نفسه للمقارنة فقط */
  ref: { paper: "#e9e9e7", ink: "#151515", accent: "#1d55f0", sun: "#e3ad35", red: "#e2433a", leaf: "#5f8f3a", kraft: "#b48a5a" },
  /* دافئ فاتح (الافتراضي: لا أسود ولا أزرق، ذوق المستخدم في الموشن المستقل) */
  warm: { paper: "#efe7d8", ink: "#3a2a1c", accent: "#1f7a72", sun: "#e3ad35", red: "#c4473a", leaf: "#6f8f3a", kraft: "#b48a5a" },
};

/* ---------- خطوط فخمة محلية (أمر المستخدم 2026-11-19: لا خطوط عادية في الموشن المستقل) ---------- */
export const useAlmarai = () => useFonts(["rakkas", "ruqaa", "kafRuqaa"]);
export const FONT = ff("rakkas");
export const FONT_HAND = ff("ruqaa");

/* ---------- أدوات ---------- */
export const back = (x: number, s = 1.7) => { const t = clamp01(x) - 1; return 1 + (s + 1) * t * t * t + s * t * t; };
export const settle = (t: number) => (t <= 0 ? 0 : Math.exp(-0.18 * t) * Math.sin(t * 0.55));

/** ورق مجعّد يتبدّل نسيجه كل 4 إطارات (ارتجاف التصوير إطاراً بإطار). */
export const CrumplePaper: React.FC<{ color: string; seed?: number; id: string }> = ({ color, seed = 0, id }) => {
  const f = useCurrentFrame();
  const s = seed + Math.floor(f / 4) % 3;
  return (
    <AbsoluteFill style={{ background: color }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, mixBlendMode: "multiply" }}>
        <filter id={id} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.0032 0.0045" numOctaves={5} seed={s} result="n" />
          <feDiffuseLighting in="n" lightingColor="#ffffff" surfaceScale={9} result="l"><feDistantLight azimuth={120} elevation={42} /></feDiffuseLighting>
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={W} height={H} filter={`url(#${id})`} opacity={0.85} />
      </svg>
    </AbsoluteFill>
  );
};

/** حافة ممزقة: مضلع من نقاط عشوائية ثابتة بالبذرة على خط من (x1,y1) إلى (x2,y2). */
export const tornLine = (x1: number, y1: number, x2: number, y2: number, seed: number, n = 46, amp = 16) => {
  const r = mulberry32(seed);
  return Array.from({ length: n + 1 }, (_, i) => { const t = i / n; const j = (r() - 0.5) * amp * (i % 3 === 0 ? 2.2 : 1); return [lerp(x1, x2, t) + j * 0.6, lerp(y1, y2, t) + j]; });
};
export const poly = (pts: number[][]) => pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(",");

/** قصاصة: ظل ورقي تحت أي رسم (مظهر الملصق المقصوص). */
const Cut: React.FC<{ x: number; y: number; w: number; h: number; rot?: number; s?: number; children: React.ReactNode; z?: number }> = ({ x, y, w, h, rot = 0, s = 1, children, z }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, transform: `rotate(${rot}deg) scale(${s})`, filter: "drop-shadow(0 10px 12px rgba(0,0,0,.28)) drop-shadow(0 0 0 #fff)", zIndex: z }}>{children}</div>
);

/** سقوط واستقرار: يدخل من أعلى بدوران ويستقر بارتداد خفيف. */
const Drop: React.FC<{ at: number; x: number; y: number; w: number; h: number; rot?: number; from?: number; children: React.ReactNode }> = ({ at, x, y, w, h, rot = 0, from = -260, children }) => {
  const f = useCurrentFrame() - at;
  if (f < 0) return null;
  const k = back(f / 12, 1.4);
  return <Cut x={x} y={y + (1 - k) * from} w={w} h={h} rot={rot + (1 - k) * 18 + settle(f - 12) * 3} s={0.7 + 0.3 * k}>{children}</Cut>;
};

/** نص يُكشف من اليمين إلى اليسار (اتجاه الكتابة). */
export const Reveal: React.FC<{ at: number; dur?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ at, dur = 10, children, style }) => {
  const k = easeOut((useCurrentFrame() - at) / dur);
  return <div style={{ ...style, clipPath: `inset(-20% 0 -20% ${(1 - k) * 100}%)` }}>{children}</div>;
};

/** حروف تومض عشوائياً حتى تثبت (سطر الختام). */
const Flicker: React.FC<{ at: number; text: string; style: React.CSSProperties; seed: number }> = ({ at, text, style, seed }) => {
  const f = useCurrentFrame() - at;
  const chars = [...text];
  return (
    <div style={{ ...style, direction: "rtl", whiteSpace: "pre" }}>
      {chars.map((c, i) => { const r = mulberry32(seed + i)(); const on = f > 4 + r * 16 && (f > 24 || (Math.floor((f + r * 9) / 2) % 3 !== 0)); return <span key={i} style={{ opacity: on ? 1 : 0 }}>{c}</span>; })}
    </div>
  );
};

/* ---------- رسوم مقصوصة ---------- */
const Shutter: React.FC<{ w: number; h: number; c: string }> = ({ w, h, c }) => (
  <svg width={w} height={h}><rect x={3} y={3} width={w - 6} height={h - 6} fill={c} stroke="#fff" strokeWidth={6} />{Array.from({ length: 14 }, (_, i) => <rect key={i} x={w * 0.16} y={h * 0.08 + i * (h * 0.84 / 14)} width={w * 0.68} height={h * 0.84 / 14 - 7} fill="rgba(0,0,0,.18)" rx={2} />)}</svg>
);
const Lamp: React.FC<{ c: string }> = ({ c }) => (
  <svg width={120} height={420}><line x1={60} y1={0} x2={60} y2={300} stroke="#222" strokeWidth={4} /><rect x={48} y={290} width={24} height={26} fill="#555" /><circle cx={60} cy={350} r={42} fill={c} opacity={0.95} /><circle cx={60} cy={350} r={80} fill={c} opacity={0.18} /></svg>
);
const Leaf: React.FC<{ c: string }> = ({ c }) => (
  <svg width={240} height={380}><path d="M120 380 C 118 250 130 150 150 20" stroke={c} strokeWidth={5} fill="none" />{[60, 120, 180, 240, 300].map((y, i) => <ellipse key={i} cx={i % 2 ? 175 : 85} cy={y} rx={40} ry={16} fill={c} transform={`rotate(${i % 2 ? -30 : 30} ${i % 2 ? 175 : 85} ${y})`} />)}</svg>
);
const News: React.FC<{ w: number; h: number }> = ({ w, h }) => (
  <svg width={w} height={h}><rect width={w} height={h} fill="#d9d4c8" />{Array.from({ length: Math.floor(h / 16) }, (_, i) => <rect key={i} x={10 + (i % 4) * 4} y={8 + i * 16} width={w - 30 - (i % 5) * 18} height={6} fill="#8b857a" />)}</svg>
);
const Bird: React.FC<{ c: string }> = ({ c }) => (
  <svg width={110} height={90}><ellipse cx={55} cy={52} rx={34} ry={24} fill="#7a4a2a" /><ellipse cx={42} cy={58} rx={16} ry={14} fill={c} /><circle cx={80} cy={36} r={16} fill="#7a4a2a" /><circle cx={84} cy={33} r={3} fill="#111" /><polygon points="95,36 106,40 95,42" fill="#d9a23a" /><polygon points="22,48 2,40 20,60" fill="#5a3a20" /><line x1={50} y1={74} x2={46} y2={88} stroke="#333" strokeWidth={3} /><line x1={62} y1={74} x2={64} y2={88} stroke="#333" strokeWidth={3} /></svg>
);
const Cloud = () => <svg width={170} height={70}><ellipse cx={60} cy={45} rx={50} ry={22} fill="#fff" /><ellipse cx={100} cy={32} rx={44} ry={26} fill="#fff" /><ellipse cx={130} cy={48} rx={36} ry={18} fill="#fff" /></svg>;
const Book: React.FC<{ c: string; w?: number }> = ({ c, w = 300 }) => (
  <svg width={w} height={w * 0.72} viewBox="0 0 300 216"><path d="M150 30 C 110 10 50 10 10 24 L10 200 C 50 186 110 186 150 206 Z" fill="#fbf7ee" stroke="#fff" strokeWidth={6} /><path d="M150 30 C 190 10 250 10 290 24 L290 200 C 250 186 190 186 150 206 Z" fill="#f3ecdc" stroke="#fff" strokeWidth={6} />{[50, 70, 90, 110, 130, 150].map((y) => <React.Fragment key={y}><line x1={30} y1={y} x2={130} y2={y + 4} stroke="#b9ad96" strokeWidth={4} /><line x1={170} y1={y + 4} x2={270} y2={y} stroke="#b9ad96" strokeWidth={4} /></React.Fragment>)}<rect x={210} y={0} width={22} height={70} fill={c} /></svg>
);
const Stack: React.FC<{ c: string; k: string }> = ({ c, k }) => (
  <svg width={300} height={230}>{[0, 1, 2].map((i) => <rect key={i} x={20 + i * 6} y={150 - i * 56} width={250 - i * 12} height={50} rx={6} fill={[c, k, "#7a4a2a"][i]} stroke="#fff" strokeWidth={5} />)}</svg>
);
const Pen: React.FC<{ c: string }> = ({ c }) => <svg width={60} height={300}><rect x={18} y={10} width={24} height={230} rx={10} fill={c} stroke="#fff" strokeWidth={4} /><polygon points="18,240 42,240 30,290" fill="#e8d7b0" stroke="#fff" strokeWidth={4} /></svg>;
const Glass: React.FC = () => <svg width={220} height={220}><circle cx={90} cy={90} r={66} fill="rgba(255,255,255,.35)" stroke="#333" strokeWidth={14} /><line x1={138} y1={138} x2={205} y2={205} stroke="#333" strokeWidth={22} strokeLinecap="round" /></svg>;
const Calendar: React.FC<{ c: string }> = ({ c }) => (
  <svg width={300} height={300}><rect x={10} y={30} width={280} height={260} rx={18} fill="#fffaf0" stroke="#fff" strokeWidth={6} /><rect x={10} y={30} width={280} height={60} rx={18} fill={c} />{Array.from({ length: 12 }, (_, i) => <rect key={i} x={34 + (i % 4) * 64} y={112 + Math.floor(i / 4) * 56} width={40} height={36} rx={6} fill="#e6dccb" />)}</svg>
);
const Check: React.FC<{ c: string }> = ({ c }) => <svg width={90} height={90}><circle cx={45} cy={45} r={40} fill={c} stroke="#fff" strokeWidth={5} /><polyline points="26,46 40,60 66,32" fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" /></svg>;
const Dome: React.FC<{ c: string }> = ({ c }) => (
  <svg width={360} height={300}><path d="M60 260 L60 170 Q 180 30 300 170 L300 260 Z" fill={c} stroke="#fff" strokeWidth={6} /><rect x={160} y={190} width={40} height={70} rx={20} fill="rgba(255,255,255,.75)" /><rect x={20} y={258} width={320} height={22} fill="#7a4a2a" stroke="#fff" strokeWidth={5} /><line x1={180} y1={70} x2={180} y2={30} stroke={c} strokeWidth={6} /><circle cx={180} cy={24} r={8} fill={c} /></svg>
);
const Bubble: React.FC<{ c: string }> = ({ c }) => <svg width={150} height={130}><rect x={5} y={5} width={140} height={92} rx={22} fill={c} stroke="#fff" strokeWidth={5} /><polygon points="40,96 64,96 36,124" fill={c} /><circle cx={45} cy={51} r={9} fill="#fff" /><circle cx={75} cy={51} r={9} fill="#fff" /><circle cx={105} cy={51} r={9} fill="#fff" /></svg>;
const Heart: React.FC<{ c: string }> = ({ c }) => <svg width={110} height={110}><rect x={5} y={5} width={100} height={84} rx={14} fill={c} /><polygon points="40,88 60,88 44,106" fill={c} /><path d="M55 74 L30 50 A13 13 0 0 1 55 34 A13 13 0 0 1 80 50 Z" fill="#fff" /></svg>;

/* ---------- عنوان الخطوة: مربع منقّط ورقم، وخط يشق العنوان ---------- */
const StepHeader: React.FC<{ at: number; n: string; top: string; bottom: string; sub: string; p: Pal }> = ({ at, n, top, bottom, sub, p }) => {
  const f = useCurrentFrame() - at;
  const kb = back(f / 12, 2.2), rot = (1 - clamp01(f / 12)) * -140;
  const line = easeInOut(f / 12);
  return (
    <>
      <div style={{ position: "absolute", left: W / 2 - 62, top: 150, width: 124, height: 124, border: `3px dashed ${p.ink}`, transform: `rotate(${rot}deg) scale(${Math.max(0, kb)})`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontWeight: 800, fontSize: 135, color: p.accent, lineHeight: 1 }}>{n}</div>
      <div style={{ position: "absolute", left: 0, top: 362, width: (W * 0.86) * line, height: 9, background: p.ink }} />
      <Reveal at={at + 5} style={{ position: "absolute", right: W * 0.08, top: 286, fontFamily: FONT, fontWeight: 800, fontSize: 107, color: p.ink, direction: "rtl", whiteSpace: "nowrap" }}>{top}</Reveal>
      <Reveal at={at + 9} style={{ position: "absolute", right: W * 0.14, top: 380, fontFamily: FONT, fontWeight: 800, fontSize: 107, color: p.ink, direction: "rtl", whiteSpace: "nowrap" }}>{bottom}</Reveal>
      <Reveal at={at + 14} style={{ position: "absolute", right: W * 0.14, top: 486, fontFamily: FONT_HAND, fontWeight: 700, fontSize: 78, color: p.accent, direction: "rtl", whiteSpace: "nowrap" }}>{sub}</Reveal>
    </>
  );
};

/** سحب عمودي ضبابي: المشهد يندفع إلى أعلى (خروج) أو يصعد من أسفل (دخول) مع ضبابية حركة عمودية. */
const Whip: React.FC<{ from: number; to: number; outAt: number; children: React.ReactNode; id: string }> = ({ from, to, outAt, children, id }) => {
  const f = useCurrentFrame();
  if (f < from || f >= to) return null;
  const inK = easeOut((f - from) / 7), outK = clamp01((f - outAt) / 7);
  const y = (1 - inK) * 900 - outK * outK * 1500;
  const blur = (1 - inK) * 60 + outK * 70;
  return (
    <AbsoluteFill style={{ transform: `translateY(${y}px)`, filter: blur > 1 ? `url(#${id})` : undefined }}>
      <svg width={0} height={0} style={{ position: "absolute" }}><filter id={id} x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation={`0 ${blur.toFixed(1)}`} /></filter></svg>
      {children}
    </AbsoluteFill>
  );
};

/** تكبير أشياء الخطوة حول وسط منطقتها (أشياء المرجع كبيرة تملأ الوسط). */
const Big: React.FC<{ children: React.ReactNode; k?: number }> = ({ children, k = 1.5 }) => <AbsoluteFill style={{ transform: `scale(${k})`, transformOrigin: "540px 1290px" }}>{children}</AbsoluteFill>;

/* ---------- الجدول ---------- */
const T = { tear: 0, window: 30, zoom: 120, title: 132, wipe: 222, s1: 240, s2: 340, s3: 440, s4: 540, end: 640, logo: 720 };

export const PaperSteps: React.FC<{ palette?: "warm" | "ref" }> = ({ palette = "warm" }) => {
  useAlmarai();
  const f = useCurrentFrame();
  const p = PALS[palette] ?? PALS.warm;

  /* المشهد الأول: الصفحة تتمزق قطعتين فتكشف القصاصة */
  const tearA = easeInOut((f - 6) / 22), tearB = easeInOut((f - 22) / 22);
  const edge = tornLine(W * 1.05, H * 0.52, W * 0.15, H * 1.05, 7);
  const edge2 = tornLine(W * 0.62, -20, W * 0.3, H * 1.05, 11);
  /* الدخول عبر النافذة */
  const zoom = f < T.zoom ? 1 : 1 + Math.pow(clamp01((f - T.zoom) / 12), 2) * 7;
  const shut = easeOut((f - T.window - 18) / 16);
  const lampSwing = Math.sin(f / 14) * 7;

  return (
    <AbsoluteFill style={{ background: p.paper, overflow: "hidden" }}>
      <CrumplePaper color={p.paper} id="ps-bg" />

      {/* ١) القصاصة الافتتاحية (حتى الدخول عبر النافذة) */}
      {f < T.title && (
        <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: "50% 40%", filter: zoom > 1.2 ? `blur(${(zoom - 1) * 3}px)` : undefined }}>
          <div style={{ position: "absolute", right: -40, top: 640, transform: "rotate(14deg)" }}><News w={330} h={1400} /></div>
          <div style={{ position: "absolute", left: 140, top: 620, width: 800, height: 640, background: "#cfe3ee", boxShadow: "inset 0 0 0 10px #fff" }} />
          {/* المصراعان يفتحان من مفصليهما */}
          <div style={{ position: "absolute", left: 140, top: 620, transformOrigin: "0% 50%", transform: `perspective(1600px) rotateY(${-72 * shut}deg)` }}><Shutter w={400} h={640} c={p.accent} /></div>
          <div style={{ position: "absolute", left: 540, top: 620, transformOrigin: "100% 50%", transform: `perspective(1600px) rotateY(${72 * shut}deg)` }}><Shutter w={400} h={640} c={p.accent} /></div>
          <div style={{ position: "absolute", left: 120, top: 1150, transform: "rotate(-8deg)" }}><Leaf c={p.leaf} /></div>
          <div style={{ position: "absolute", left: 120, top: -40, transformOrigin: "60px 0", transform: `rotate(${lampSwing}deg)` }}><Lamp c={p.sun} /></div>
          <Drop at={T.window + 8} x={760} y={420} w={260} h={260} rot={-6}><svg width={260} height={260}><circle cx={130} cy={130} r={124} fill="#2a1f18" stroke="#fff" strokeWidth={6} /><circle cx={130} cy={130} r={44} fill={p.sun} /><circle cx={130} cy={130} r={6} fill="#2a1f18" /></svg></Drop>
          {/* الملصق الممزق يلتف ويستقر داخل النافذة */}
          {f >= T.window + 34 && (() => { const k = back((f - T.window - 34) / 14, 1.6); return (
            <div style={{ position: "absolute", left: 540 - 380, top: 860, width: 760, padding: "18px 26px", whiteSpace: "nowrap", background: p.accent, color: "#fff", fontFamily: FONT, fontWeight: 800, fontSize: 78, direction: "rtl", textAlign: "center", transform: `translate(${(1 - k) * -380}px, ${(1 - k) * -260}px) rotate(${-6 + (1 - k) * -70}deg)`, clipPath: `polygon(${poly(tornLine(0, 0, 760, 0, 3, 18, 10))},${poly(tornLine(760, 120, 0, 120, 4, 18, 10))})`, boxShadow: "0 12px 18px rgba(0,0,0,.3)" }}>تريد أن تبدأ طلب العلم؟</div>); })()}
          {/* الصفحة الممزقة فوق كل شيء */}
          <div style={{ position: "absolute", inset: 0, background: p.paper, clipPath: `polygon(${poly(edge2)},-40px ${H + 40}px,-40px -40px)`, transform: `translate(${-tearB * 900}px, ${-tearB * 120}px) rotate(${-tearB * 12}deg)`, filter: "drop-shadow(8px 0 10px rgba(0,0,0,.25))" }}><CrumplePaper color={p.paper} id="ps-tear2" seed={4} /></div>
          <div style={{ position: "absolute", inset: 0, background: p.paper, clipPath: `polygon(${poly(edge)},${W + 60}px ${H + 60}px,${W + 60}px ${H * 0.5}px)`, transform: `translate(${tearA * 700}px, ${tearA * 900}px) rotate(${tearA * 18}deg)`, filter: "drop-shadow(-8px -6px 10px rgba(0,0,0,.25))" }}><CrumplePaper color={p.paper} id="ps-tear1" seed={9} /></div>
        </AbsoluteFill>
      )}

      {/* ٢) دائرة العنوان والطائر */}
      <Whip from={T.title} to={T.wipe + 8} outAt={T.wipe} id="ps-w0">
        {(() => { const k = back((f - T.title) / 14, 1.5); return (
          <>
            <div style={{ position: "absolute", left: W / 2 - 330, top: 520, width: 660, height: 660, borderRadius: "50%", background: p.sun, transform: `scale(${Math.max(0, k)})`, boxShadow: "0 18px 30px rgba(0,0,0,.18)" }} />
            <div style={{ position: "absolute", left: W / 2 - 80, top: 440 + (f < T.title + 16 ? (1 - easeOut((f - T.title - 4) / 12)) * -500 : 0) }}><Bird c={p.red} /></div>
            <div style={{ position: "absolute", left: W / 2 + 90 + Math.sin(f / 20) * 18, top: 590 }}><Cloud /></div>
            {f > T.title + 12 && <div style={{ position: "absolute", left: W / 2 + 40, top: 640, fontFamily: FONT, fontWeight: 800, fontSize: 273, color: p.accent, transform: `scale(${back((f - T.title - 12) / 10, 2)})`, lineHeight: 1 }}>٤</div>}
            <Reveal at={T.title + 20} style={{ position: "absolute", right: W / 2 - 20, top: 690, fontFamily: FONT, fontWeight: 800, fontSize: 130, color: "#fff", direction: "rtl" }}>خطوات</Reveal>
            <Reveal at={T.title + 30} style={{ position: "absolute", width: W, textAlign: "center", top: 850, fontFamily: FONT, fontWeight: 800, fontSize: 99, color: "#fff", direction: "rtl" }}>لطلب العلم</Reveal>
            <Reveal at={T.title + 40} style={{ position: "absolute", width: W, textAlign: "center", top: 960, fontFamily: FONT, fontWeight: 700, fontSize: 73, color: p.accent, direction: "rtl" }}>بداية ثابتة ومتينة</Reveal>
          </>); })()}
      </Whip>

      {/* مسحة لون كاملة بين الفصلين */}
      {f >= T.wipe && f < T.s1 + 4 && <div style={{ position: "absolute", left: 0, width: W, top: H * (1 - easeInOut((f - T.wipe) / 8)) - H * easeInOut((f - T.wipe - 10) / 8), height: H, background: p.accent }} />}

      {/* ٣) الخطوات الأربع */}
      <Whip from={T.s1} to={T.s2 + 4} outAt={T.s2 - 4} id="ps-w1">
        <StepHeader at={T.s1 + 4} n="١" top="النيـ" bottom="ـــة الصالحة" sub="أصل كل عمل" p={p} />
        <Big>
        <Drop at={T.s1 + 26} x={560} y={1180} w={300} h={230} rot={-4}><Stack c={p.accent} k={p.kraft} /></Drop>
        <Drop at={T.s1 + 36} x={300} y={1310} w={300} h={216} rot={8}><Book c={p.red} /></Drop>
        <Drop at={T.s1 + 46} x={820} y={1330} w={60} h={300} rot={-28}><Pen c={p.accent} /></Drop>
        <Drop at={T.s1 + 54} x={760} y={1060} w={90} h={90}><Check c={p.leaf} /></Drop>
        </Big>
      </Whip>
      <Whip from={T.s2} to={T.s3 + 4} outAt={T.s3 - 4} id="ps-w2">
        <StepHeader at={T.s2 + 4} n="٢" top="المتـ" bottom="ـــن المختصر" sub="قبل المطوّلات" p={p} />
        <Big>
        <Drop at={T.s2 + 24} x={540} y={1240} w={420} h={302} rot={-3} from={-400}><Book c={p.accent} w={420} /></Drop>
        <Drop at={T.s2 + 40} x={760} y={1080} w={220} h={220} rot={12}><Glass /></Drop>
        {[0, 1, 2].map((i) => <Drop key={i} at={T.s2 + 50 + i * 5} x={250 + i * 70} y={1500} w={90} h={90} rot={-8 + i * 8}><Check c={[p.red, p.sun, p.leaf][i]} /></Drop>)}
        </Big>
      </Whip>
      <Whip from={T.s3} to={T.s4 + 4} outAt={T.s4 - 4} id="ps-w3">
        <StepHeader at={T.s3 + 4} n="٣" top="الشيـ" bottom="ـــخ المتقن" sub="تأخذ عنه وتسأله" p={p} />
        <Big>
        {(() => { const k = back((f - T.s3 - 20) / 12, 1.4); return <div style={{ position: "absolute", left: W / 2 - 260, top: 960, width: 520, height: 520, borderRadius: "50%", background: p.kraft, border: `18px solid ${p.accent}`, transform: `scale(${Math.max(0, k)})` }} />; })()}
        <Drop at={T.s3 + 30} x={540} y={1210} w={360} h={300} from={-300}><Dome c={p.accent} /></Drop>
        {[0, 1, 2].map((i) => { const a = T.s3 + 46 + i * 8; const g = clamp01((f - a) / 30); return f >= a ? <div key={i} style={{ position: "absolute", left: 600 + i * 60 - g * 40, top: 1000 - g * (260 + i * 60), transform: `scale(${back((f - a) / 10, 1.6)})` }}><Bubble c={[p.red, p.accent, p.leaf][i]} /></div> : null; })}
        </Big>
      </Whip>
      <Whip from={T.s4} to={T.end + 4} outAt={T.end - 4} id="ps-w4">
        <StepHeader at={T.s4 + 4} n="٤" top="المراجـ" bottom="ـــعة الدائمة" sub="ما لا يُراجَع يُنسى" p={p} />
        <Big>
        <div style={{ position: "absolute", left: -60, top: 1040, width: 620, height: 640, background: p.kraft, clipPath: `polygon(${poly(tornLine(0, 0, 620, 60, 21, 20, 18))},620px 640px,0px 640px)`, transform: `translateX(${(1 - easeOut((f - T.s4 - 18) / 12)) * -600}px)` }} />
        <Drop at={T.s4 + 26} x={360} y={1290} w={300} h={300} rot={-6}><Calendar c={p.accent} /></Drop>
        {[0, 1, 2, 3, 4].map((i) => { const a = T.s4 + 44 + i * 4; const g = easeOut((f - a) / 16); const ang = -60 + i * 26; return f >= a ? <div key={i} style={{ position: "absolute", left: 560 + Math.cos((ang * Math.PI) / 180) * 340 * g, top: 1280 + Math.sin((ang * Math.PI) / 180) * 340 * g, transform: `rotate(${ang}deg) scale(${0.4 + 0.6 * g})` }}><Check c={[p.red, p.sun, p.leaf, p.accent, p.red][i]} /></div> : null; })}
        </Big>
      </Whip>

      {/* ٤) سطر الختام بحروف تومض، ثم الشعار */}
      <Whip from={T.end} to={T.logo + 6} outAt={T.logo} id="ps-w5">
        <div style={{ position: "absolute", left: W / 2 - 55, top: 640, transform: `scale(${back((f - T.end - 4) / 10, 2)})` }}><Heart c={p.red} /></div>
        <Flicker at={T.end + 6} seed={31} text="ابدأ طريقك" style={{ position: "absolute", width: W, textAlign: "center", top: 770, fontFamily: FONT, fontWeight: 800, fontSize: 120, color: p.ink }} />
        <Flicker at={T.end + 14} seed={57} text="بخطى ثابتـــة" style={{ position: "absolute", width: W, textAlign: "center", top: 930, fontFamily: FONT, fontWeight: 800, fontSize: 109, color: p.accent }} />
        <Flicker at={T.end + 22} seed={83} text="مع محمد بن شمس الديـــن" style={{ position: "absolute", width: W, textAlign: "center", top: 1080, fontFamily: FONT, fontWeight: 800, fontSize: 91, color: p.accent }} />
      </Whip>
      {f >= T.logo && (() => { const k = back((f - T.logo - 4) / 12, 1.5); return (
        <div style={{ position: "absolute", width: W, top: 840, display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${Math.max(0, k)})` }}>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 125, color: p.ink, direction: "rtl" }}>محمد بن شمس الدين</div>
          <div style={{ marginTop: 18, width: 520, height: 10, background: p.accent, transform: `scaleX(${easeOut((f - T.logo - 14) / 12)})` }} />
        </div>); })()}
      <SfxTrack cues={[[6,"tear"],[48,"swish"],[64,"popin"],[118,"whoosh_big"],[144,"popdeep"],[220,"fast"],[266,"thud"],[336,"fast"],[364,"thud"],[436,"fast"],[470,"thud"],[536,"fast"],[570,"thud"],[636,"fast"],[646,"glitch"],[724,"sting"]]} />
    </AbsoluteFill>
  );
};
