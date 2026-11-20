import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { HybridHost, HybridBg, VSlot } from "../hybrid/Slot";
import { frameBox } from "./ActiveSpeaker";
import { back, CrumplePaper, poly, tornLine } from "./PaperSteps";
import { ff, useFonts } from "./fonts";
import { clamp01, easeInOut, easeOut, lerp } from "./motion";
import { Cue, SfxTrack } from "./sfx";

/**
 * قالب «الخطوات الورقية» (المرجع الأول، دراسة §٣١؛ المرحلة ٥ من خطة التدرّب، 2026-11-20):
 * ورق مجعّد في طبقة الخلفية، صفحة ممزقة تتقشّر فتكشف صورة الشيخ بطاقةً بحدّ أبيض، ثم اندفاع داخل البطاقة حتى تصير الشاشة كلها (التسليم)،
 * ثم ستارة لونية تصعد (فاصل الفصل)، ثم خطوات مرقّمة: مربع منقّط ورقم يقفز، خط، كلمة فوقه وكلمة تحته بالكشيدة، سطر ملوّن، وشيء مقصوص
 * (صورة مولّدة أو بطاقة الشيخ الحيّة) يدخل ويستقر؛ وبين الخطوات سحب عمودي بضبابية (عائلة الانتقال الثابتة)؛ والختام سطور تُمسح عمودياً ثم الاسم.
 * كل أرضية معتمة في الخلفية (الرسوم فوق الفيديو دائماً في محرك الرندر).
 */
const W = 1080, H = 1920;
const C = { paper: "#ece4d4", ink: "#2a1518", maroon: "#6b1b2b", teal: "#1f6b66", cream: "#f6f0e2" };
const S = (s: number) => Math.round(s * 30);

export type StepSpec = { a: number; b: number; n: string; top: string; bottom: string; sub: string; img?: string; img2?: string; speaker?: boolean };
export type StepsScript = { hook: string; title: [string, string]; steps: StepSpec[]; end: string[]; name: string };

/* ───────── عناصر ───────── */
const Cutout: React.FC<{ src: string; x: number; y: number; w: number; rot: number; at: number; from?: "l" | "r" | "t" | "b" }> = ({ src, x, y, w, rot, at, from = "t" }) => {
  const t = useCurrentFrame() / 30, u = t - at;
  if (u < 0) return null;
  const k = back(u / 0.4, 1.3), d = 1 - Math.min(1, k);
  const dx = from === "l" ? -d * 900 : from === "r" ? d * 900 : 0, dy = from === "t" ? -d * 900 : from === "b" ? d * 1100 : 0;
  return (
    <div style={{ position: "absolute", left: x + dx, top: y + dy, width: w, transform: `rotate(${rot + d * (from === "l" ? -25 : 25)}deg) scale(${1 + 0.1 * clamp01(u / 3)})`, background: "#fff", padding: 14, boxShadow: "8px 14px 22px rgba(0,0,0,.28)" }}>
      <Img src={staticFile(src)} style={{ width: "100%", display: "block" }} />
    </div>
  );
};
/* ───────── تنويع الكتابة (تصحيح المستخدم 2026-11-20: «أنماط بدء وانتهاء الكتابة، ظهور واختفاء الكتابة متكررة، وهذا ممل»):
   لكل خطوة أسلوب ظهور مختلف لكل سطر، ورقم بشكل مختلف، وخط بشكل مختلف، فلا يتكرر أسلوب في خطوتين. ───────── */
type WK = "wipe" | "stretch" | "stamp" | "rise" | "drop" | "focus" | "flicker" | "center";
const FLK = [1, 0, 1, 1, 0, 0, 1, 0.3, 1, 1];
const WordFx: React.FC<{ at: number; kind: WK; style: React.CSSProperties; children: React.ReactNode; fadeAt?: number }> = ({ at, kind, style, children, fadeAt }) => {
  const u = useCurrentFrame() / 30 - at;
  if (u < 0) return null;
  const k = easeOut(u / 0.3);
  let tr = "", clip: string | undefined, op = 1, filt = "", origin = "100% 50%";
  if (kind === "wipe") clip = `inset(-30% 0 -30% ${(1 - k) * 100}%)`;
  if (kind === "stretch") { tr = `scaleX(${lerp(0.12, 1, back(u / 0.45, 1.1))})`; op = clamp01(u / 0.1); }
  if (kind === "stamp") { const e = clamp01(u / 0.12); tr = `scale(${lerp(1.9, 1, e * e)}) rotate(${lerp(-10, -2, e)}deg) translateX(${u > 0.12 && u < 0.3 ? Math.sin(u * 140) * 7 * (0.3 - u) / 0.18 : 0}px)`; op = e; origin = "50% 50%"; }
  if (kind === "drop") { const e = back(u / 0.45, 1.8); tr = `translateY(${lerp(-460, 0, e)}px) rotate(${(1 - Math.min(1, e)) * -14}deg)`; op = clamp01(u / 0.08); }
  if (kind === "focus") { tr = `scale(${lerp(1.4, 1, k)})`; filt = `blur(${((1 - k) * 26).toFixed(1)}px)`; op = clamp01(u / 0.15); origin = "50% 50%"; }
  if (kind === "flicker") op = u < 0.6 ? FLK[Math.floor((u * 30) / 2) % FLK.length] : 1;
  if (kind === "center") clip = `inset(-30% ${(1 - k) * 50}% -30% ${(1 - k) * 50}%)`;
  if (fadeAt !== undefined && u > fadeAt - at) { const q = easeInOut((u - (fadeAt - at)) / 0.8); op *= 1 - 0.85 * q; filt += ` blur(${(q * 7).toFixed(1)}px)`; tr += ` translateY(${-26 * q}px)`; }
  const base: React.CSSProperties = { position: "absolute", direction: "rtl", whiteSpace: "nowrap", ...style };
  if (kind === "rise") /* يصعد من تحت الخط: قناع بحدّ السطر */
    return <div style={{ ...base, overflow: "hidden", lineHeight: 1.45, paddingBottom: 10 }}><div style={{ transform: `translateY(${(1 - back(u / 0.4, 1.2)) * 115}%)` }}>{children}</div></div>;
  return <div style={{ ...base, clipPath: clip, opacity: op, filter: filt || undefined, transform: tr || undefined, transformOrigin: origin, textShadow: kind === "flicker" && u < 0.6 ? "0 0 18px rgba(232,199,122,.9)" : undefined }}>{children}</div>;
};
/** السطر الصغير: قلم يخطّ تحته، أو قلم تحديد، أو بطاقة ممزقة، أو كلمات تظهر واحدة واحدة (وآخرها «يُنسى» يبهت فعلاً) */
const Sub: React.FC<{ at: number; kind: "pen" | "marker" | "label" | "ghost"; text: string; top: number }> = ({ at, kind, text, top }) => {
  const u = useCurrentFrame() / 30 - at;
  if (u < 0) return null;
  const font: React.CSSProperties = { fontFamily: ff("ruqaa"), fontWeight: 700, fontSize: 100, color: C.teal };
  if (kind === "pen") return <WordFx at={at} kind="wipe" style={{ right: W * 0.12, top, ...font }}>{text}
    <div style={{ position: "absolute", right: 0, bottom: 4, height: 9, width: `${easeOut((u - 0.3) / 0.35) * 100}%`, background: C.maroon, borderRadius: 5 }} /></WordFx>;
  if (kind === "marker") return <div style={{ position: "absolute", right: W * 0.1, top, direction: "rtl", whiteSpace: "nowrap", ...font, color: C.ink }}>
    <div style={{ position: "absolute", right: -16, left: -16, top: "34%", height: "52%", background: "rgba(232,199,122,.85)", transform: `skewX(-12deg) scaleX(${easeOut(u / 0.3)})`, transformOrigin: "100% 50%" }} />
    <span style={{ position: "relative", clipPath: `inset(-30% 0 -30% ${(1 - easeOut((u - 0.18) / 0.3)) * 100}%)`, display: "inline-block" }}>{text}</span></div>;
  if (kind === "label") { const k = back(u / 0.4, 1.5); return <div style={{ position: "absolute", left: 120, top: top + 10, width: 840, height: 130, transform: `translateX(${(1 - k) * -1100}px) rotate(${-3 + (1 - Math.min(1, k)) * -20}deg)`, filter: "drop-shadow(0 8px 10px rgba(0,0,0,.28))" }}>
    <div style={{ position: "absolute", inset: 0, background: C.maroon, clipPath: `polygon(${poly(tornLine(0, 0, 840, 0, 7, 18, 10))},${poly(tornLine(840, 130, 0, 130, 8, 18, 10))})` }} />
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", direction: "rtl", ...font, fontSize: 82, color: C.cream }}>{text}</div></div>; }
  const words = text.split(" ");
  return <div style={{ position: "absolute", right: W * 0.1, left: W * 0.05, top, direction: "rtl", whiteSpace: "nowrap", ...font }}>
    {words.map((wd, i) => { const v = u - i * 0.18, e = clamp01(v / (4 / 30)), last = i === words.length - 1, fq = last ? easeInOut((u - 0.9) / 0.6) : 0;
      return <span key={i} style={{ display: "inline-block", marginLeft: 24, opacity: v < 0 ? 0 : lerp(0.3, 1, e) * (1 - 0.85 * fq), transform: `translateY(${(1 - e) * 14 - 30 * fq}px)`, filter: fq > 0 ? `blur(${(fq * 7).toFixed(1)}px)` : undefined }}>{wd}</span>; })}</div>;
};
/** رقم الخطوة بأربعة أشكال: مربع منقّط يدور، ختم أحمر، بطاقة معلّقة تتأرجح، بطاقة تنقلب */
const Num: React.FC<{ at: number; kind: number; n: string }> = ({ at, kind, n }) => {
  const u = useCurrentFrame() / 30 - at;
  if (u < 0) return null;
  const box: React.CSSProperties = { position: "absolute", left: W / 2 - 85, top: 130, width: 170, height: 170, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: ff("rakkas"), fontSize: 140, color: C.maroon, lineHeight: 1 };
  if (kind === 0) return <div style={{ ...box, border: `4px dashed ${C.ink}`, transform: `rotate(${(1 - clamp01(u / 0.35)) * -140}deg) scale(${Math.max(0, back(u / 0.35, 2))})` }}>{n}</div>;
  if (kind === 1) { const e = clamp01(u / 0.12); return <div style={{ ...box, borderRadius: "50%", border: `9px double ${C.maroon}`, opacity: e, transform: `scale(${lerp(2.2, 1, e * e)}) rotate(-12deg)` }}>{n}</div>; }
  if (kind === 2) { const e = back(u / 0.5, 1.6), sw = Math.exp(-2.2 * u) * 22 * Math.sin(u * 9);
    return <div style={{ position: "absolute", left: W / 2 - 85, top: -40, width: 170, height: 340, transformOrigin: "85px 0px", transform: `translateY(${lerp(-420, 0, e)}px) rotate(${sw}deg)` }}>
      <div style={{ position: "absolute", left: 83, top: 0, width: 4, height: 175, background: C.ink }} />
      <div style={{ ...box, top: 170, left: 0, background: "#e9d4a0", borderRadius: "10px 10px 10px 60px", boxShadow: "4px 8px 10px rgba(0,0,0,.25)" }}>{n}</div></div>; }
  const e = easeOut(u / 0.4), a = 180 * (1 - e);
  return <div style={{ ...box, perspective: 900 }}><div style={{ position: "absolute", inset: 0, background: C.cream, border: `5px solid ${C.ink}`, transform: `rotateY(${a}deg)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "6px 10px 14px rgba(0,0,0,.25)" }}>{a < 90 ? n : ""}</div></div>;
};
/** الخط بين الكلمتين بأربعة أشكال: يُرسم من اليمين، شريط ممزق ينزلق، خط منقّط، خطان يتسعان من الوسط */
const Rule: React.FC<{ at: number; kind: number }> = ({ at, kind }) => {
  const u = useCurrentFrame() / 30 - at;
  if (u < 0) return null;
  const e = easeInOut(u / 0.35);
  if (kind === 0) return <div style={{ position: "absolute", right: 0, top: 500, width: W * 0.9 * e, height: 10, background: C.ink }} />;
  if (kind === 1) return <div style={{ position: "absolute", left: 0, top: 492, width: W * 0.92, height: 26, background: C.maroon, transform: `translateX(${(1 - back(u / 0.4, 1.3)) * -1100}px)`, clipPath: `polygon(${poly(tornLine(0, 0, W * 0.92, 0, 12, 30, 5))},${poly(tornLine(W * 0.92, 26, 0, 26, 13, 30, 5))})` }} />;
  if (kind === 2) return <div style={{ position: "absolute", right: 40, top: 500, width: (W - 80) * e, borderTop: `12px dotted ${C.ink}` }} />;
  return <>{[0, 18].map((d) => <div key={d} style={{ position: "absolute", left: W / 2 - (W * 0.44) * e, top: 494 + d, width: W * 0.88 * e, height: 6, background: C.ink }} />)}</>;
};
/* أسلوب كل خطوة: [الكلمة العليا، الكلمة السفلى، السطر الصغير] */
const STYLE: [WK, WK, "pen" | "marker" | "label" | "ghost"][] = [["wipe", "stretch", "pen"], ["stamp", "rise", "marker"], ["drop", "focus", "label"], ["flicker", "center", "ghost"]];
const StepHeader: React.FC<{ s: StepSpec; i: number }> = ({ s, i }) => {
  const [kt, kb, ks] = STYLE[i % 4];
  return (
    <>
      <Num at={s.a + 0.2} kind={i % 4} n={s.n} />
      <Rule at={s.a + 0.3} kind={i % 4} />
      <WordFx at={s.a + 0.45} kind={kt} style={{ right: W * 0.05, top: 340, fontFamily: ff("rakkas"), fontSize: 170, color: C.ink }}>{s.top}</WordFx>
      <WordFx at={s.a + 0.65} kind={kb} style={{ right: W * 0.12, top: 520, fontFamily: ff("rakkas"), fontSize: 170, color: C.ink }}>{s.bottom}</WordFx>
      <Sub at={s.a + 0.9} kind={ks} text={s.sub} top={730} />
    </>
  );
};
/** التقشير المعتمد (افتتاح القالب): صفحة كريمية تتقشّر قطعتين على خط ممزق */
const Peel: React.FC<{ p: number; seed: number; cover?: number }> = ({ p, seed, cover = 0 }) => {
  const cut = tornLine(W * 0.62, -20, W * 0.3, H + 20, seed);
  return <div style={{ position: "absolute", inset: 0, transform: `translateX(${(1 - cover) * W * 1.1}px)`, filter: cover < 1 ? "drop-shadow(-20px 0 24px rgba(0,0,0,.3))" : undefined }}>
    <div style={{ position: "absolute", inset: 0, transform: `translate(${-p * 1000}px, ${p * 300}px) rotate(${-p * 14}deg)`, clipPath: `polygon(${poly(cut)},-40px ${H + 40}px,-40px -40px)`, background: C.cream, filter: "drop-shadow(8px 0 10px rgba(0,0,0,.25))" }} />
    <div style={{ position: "absolute", inset: 0, transform: `translate(${p * 900}px, ${p * 700}px) rotate(${p * 16}deg)`, clipPath: `polygon(${poly(cut)},${W + 40}px ${H + 40}px,${W + 40}px -40px)`, background: C.cream, filter: "drop-shadow(-8px 0 10px rgba(0,0,0,.25))" }} />
  </div>;
};
/* ───────── الانتقال بين الخطوات: لكل حدّ نوع مختلف، والخطوة التالية تحتها جاهزة ─────────
   ١→٢ تمزّق الصفحة نصفين، ٢→٣ تنقلب الصفحة لأعلى كدفتر، ٣→٤ تُكرمش كرةً وتُرمى، ٤→الختام تندفع الكاميرا داخل الرقم. */
const OUTK = ["tear", "flip", "crumple", "zoom"] as const;
const StepLayer: React.FC<{ s: StepSpec; i: number; hole?: number[]; children: React.ReactNode }> = ({ s, i, hole, children }) => {
  const t = useCurrentFrame() / 30, inU = t - s.a, o = clamp01((t - s.b) / 0.42), e = easeInOut(o);
  const cam = [`scale(${1 + 0.04 * inU})`, `translateX(${-12 * inU}px)`, `rotate(${0.35 * inU}deg)`, `scale(${1.07 - 0.025 * inU})`][i % 4];
  const settle = i > 0 && inU < 0.35 ? ` scale(${lerp(1.05, 1, easeOut(inU / 0.35))})` : "";
  const holeClip = hole && hole[1] < H && hole[1] + hole[3] > 0 ? `path(evenodd, "M0 0 H${W} V${H} H0 Z M${hole[0]} ${hole[1]} h${hole[2]} v${hole[3]} h${-hole[2]} Z")` : undefined;
  const sheet = (clip?: string, tf?: string, key?: string) => (
    <AbsoluteFill key={key} style={{ clipPath: clip ?? holeClip, transform: tf }}>
      <CrumplePaper color={C.paper} id={`st-l${i}`} seed={10 + i} />
      <AbsoluteFill style={{ transform: cam + settle }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
  if (o <= 0) return sheet();
  const kind = OUTK[i % 4];
  if (kind === "tear") return null; /* تغطيها ورقة التقشير (Peel) ثم تتقشّر عن الخطوة التالية */
  if (kind === "flip") return <AbsoluteFill style={{ transform: `perspective(1900px) rotateX(${e * 105}deg)`, transformOrigin: "50% 0%", filter: `brightness(${1 - 0.45 * e}) drop-shadow(0 30px 30px rgba(0,0,0,.35))` }}>{sheet()}</AbsoluteFill>;
  if (kind === "crumple") { const sq = easeInOut(clamp01(o / 0.6)), fly = clamp01((o - 0.55) / 0.45);
    return <AbsoluteFill style={{ transform: `translate(${-fly * fly * 900}px, ${fly * 700}px) scale(${1 - 0.86 * sq}) rotate(${sq * 200 + fly * 120}deg)`, borderRadius: `${sq * 50}%`, overflow: "hidden", filter: `contrast(${1 + 0.5 * sq}) drop-shadow(0 20px 20px rgba(0,0,0,.35))` }}>{sheet()}</AbsoluteFill>; }
  return <AbsoluteFill style={{ transform: `scale(${1 + 5 * e * e})`, transformOrigin: `${W / 2}px 215px`, opacity: 1 - e, filter: `blur(${(e * 18).toFixed(0)}px)` }}>{sheet()}</AbsoluteFill>;
};

/* ───────── التمرين ───────── */
const SCRIPT: StepsScript = {
  hook: "تريد أن تبدأ طلب العلم؟",
  title: ["٤ خطوات", "لطلب العلم"],
  steps: [
    { a: 5.0, b: 7.6, n: "١", top: "النيّة", bottom: "الصالحـــة", sub: "أصل كل عمل", img: "cine/hands_book.png", img2: "cine/pen_notebook.png" },
    { a: 7.6, b: 10.2, n: "٢", top: "المتن", bottom: "المختصـــر", sub: "قبل المطوّلات", img: "cine/book_stack.png", img2: "cine/pen_notebook.png" },
    { a: 10.2, b: 12.8, n: "٣", top: "الشيخ", bottom: "المتقـــن", sub: "تأخذ عنه وتسأله", speaker: true },
    { a: 12.8, b: 15.4, n: "٤", top: "المراجعة", bottom: "الدائمـــة", sub: "ما لا يُراجَع يُنسى", img: "cine/library.png", img2: "cine/book_stack.png" },
  ],
  end: ["ابدأ طريقك", "بخطى ثابتة"],
  name: "محمد بن شمس الدين",
};
export const STEPS_FRAMES = S(19.5);
/* مسار صورة الشيخ: بطاقة ← اندفاع حتى الشاشة كلها ← خروج ← بطاقة الخطوة الثالثة ← خروج */
const VKF: number[][] = [
  [0, 230, 380, 620, 1102], [2.6, 205, 340, 670, 1191],
  [3.1, 0, 0, 1080, 1920], [4.6, 0, 0, 1080, 1920], [4.75, 0, -1950, 1080, 1920], [10.3, 0, -1950, 1080, 1920], [10.35, 1200, 900, 500, 889],
  [10.4, 1200, 900, 500, 889], [10.85, 290, 900, 500, 889], [12.62, 250, 860, 580, 1031], [12.8, 250, -1300, 580, 1031],
  [99, 250, -1300, 580, 1031],
];
const SFX: Cue[] = [[S(0.3), "tear"], [S(2.6), "whoosh_big"], [S(3.5), "popdeep", 0.8], [S(4.6), "swish"], [S(7.4), "swipe", 0.6], [S(7.65), "tear"], [S(8.05), "hit", 0.6], [S(10.2), "swish"], [S(10.45), "tap"], [S(12.8), "popdeep"], [S(13.25), "glitch", 0.4], [S(15.4), "whoosh_big"], [S(17.7), "shimmer", 0.3]];

export const StepsTemplate: React.FC<{ script?: StepsScript; src?: string }> = ({ script = SCRIPT, src = "dubkmr/src.mp4" }) => {
  useFonts(["rakkas", "ruqaa"]);
  const f = useCurrentFrame(), t = f / 30;
  const [x, y, w, h] = frameBox(t, VKF);
  /* التسليم: الاقتراب داخل البطاقة أُسّي متسارع (٢٫٦–٣٫١ ث) فيقع القطع عند أعلى سرعة */
  const crash = t >= 2.6 && t < 3.1 ? Math.pow(clamp01((t - 2.6) / 0.5), 3) : t >= 3.1 ? 1 : 0;
  const box = crash > 0 && crash < 1 ? [lerp(205, 0, crash), lerp(340, 0, crash), lerp(670, 1080, crash), lerp(1191, 1920, crash)] : [x, y, w, h];
  const card = box[2] < 1000;
  const peel = easeInOut((t - 0.05) / 0.45);
  return (
    <HybridHost>
      <HybridBg><CrumplePaper color={C.paper} id="st-bg" seed={5} /></HybridBg>
      {card && <div style={{ position: "absolute", left: box[0] - 16, top: box[1] - 16, width: box[2] + 32, height: box[3] + 32, boxSizing: "border-box", border: "16px solid #fff", boxShadow: "10px 16px 26px rgba(0,0,0,.25)" }} />}
      <VSlot src={src} w={box[2]} h={box[3]} radius={0} vx={0} vy={0} vw={box[2]} vh={box[3]} style={{ left: box[0], top: box[1] }} grow={0} />

      {/* ١) الافتتاح: سؤال على شريط ممزق، وشيء مقصوص يدخل */}
      {t < 2.6 && <>
        {t > 0.8 && (() => { const k = back((t - 0.8) / 0.4, 1.5); return <div style={{ position: "absolute", left: 120, top: 1520, width: 840, height: 140, transform: `translate(${(1 - k) * -600}px, 0) rotate(${-4 + (1 - k) * -30}deg)`, filter: "drop-shadow(0 10px 12px rgba(0,0,0,.3))" }}>
          <div style={{ position: "absolute", inset: 0, background: C.maroon, clipPath: `polygon(${poly(tornLine(0, 0, 840, 0, 3, 18, 10))},${poly(tornLine(840, 140, 0, 140, 4, 18, 10))})` }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: ff("rakkas"), fontSize: 76, color: C.cream, direction: "rtl" }}>{script.hook}</div></div>; })()}
        <Cutout src="cine/pen_notebook.png" x={-40} y={120} w={300} rot={-12} at={1.2} from="l" />
      </>}
      {/* الصفحة الممزقة فوق كل شيء ثم تتقشّر قطعتين */}
      {peel < 1 && <Peel p={peel} seed={11} cover={1} />}

      {/* ٢) العنوان على صدر الشيخ (الشاشة كاملة) */}
      {t >= 3.1 && t < 4.7 && (() => { const k = back((t - 3.3) / 0.35, 1.6); return <div style={{ position: "absolute", left: W / 2 - 300, top: 1150, width: 600, height: 600, borderRadius: "50%", background: C.maroon, transform: `scale(${Math.max(0, k)})`, boxShadow: "0 18px 30px rgba(0,0,0,.3)" }}>
        <div style={{ position: "absolute", width: "100%", top: 130, textAlign: "center", fontFamily: ff("rakkas"), fontSize: 150, color: C.cream, direction: "rtl" }}>{script.title[0]}</div>
        <div style={{ position: "absolute", width: "100%", top: 330, textAlign: "center", fontFamily: ff("ruqaa"), fontWeight: 700, fontSize: 96, color: "#e8c77a", direction: "rtl" }}>{script.title[1]}</div></div>; })()}

      {/* ستارة الفصل: تصعد في ٥ إطارات وتغطي، ثم تكمل صعودها فتكشف الورق */}
      {t >= 4.55 && t < 5.15 && <div style={{ position: "absolute", left: 0, width: W, height: H, top: H * (1 - easeInOut((t - 4.55) / 0.17)) - H * easeInOut((t - 4.85) / 0.3), background: C.teal }} />}

      {/* ٣) الخطوات: كل خطوة صفحة ورق خاصة بها، والتالية تحتها، وكل حدّ بانتقال مختلف (الأسبق فوق) */}
      {script.steps.map((s, i) => ({ s, i })).reverse().map(({ s, i }) => {
        if (t < (i === 0 ? 4.8 : s.a) || t >= s.b + 0.42) return null;
        const from: ("l" | "r" | "t" | "b")[][] = [["l", "r"], ["t", "r"], ["r", "l"], ["b", "l"]];
        return <StepLayer key={i} s={s} i={i} hole={s.speaker ? [box[0] - 18, box[1] - 18, box[2] + 36, box[3] + 36] : undefined}>
          <StepHeader s={s} i={i} />
          {s.img && <Cutout src={s.img} x={150} y={930} w={600} rot={i % 2 ? 4 : -4} at={s.a + 0.95} from={from[i % 4][0]} />}
          {s.img2 && <Cutout src={s.img2} x={620} y={1250} w={360} rot={i % 2 ? -8 : 8} at={s.a + 1.55} from={from[i % 4][1]} />}
        </StepLayer>; })}

      {(() => { const T = script.steps[0].b; if (t < T - 0.22 || t > T + 0.55) return null;
        return <Peel p={easeInOut((t - T - 0.05) / 0.45)} seed={11} cover={easeOut((t - (T - 0.22)) / 0.22)} />; })()}
      {/* ٤) الختام: سطور ثم مسح عمودي ثم الاسم */}
      {t >= 15.4 && (() => { const smear = clamp01((t - 17.4) / 0.25);
        return <>
          {smear < 1 && <div style={{ position: "absolute", inset: 0, transform: `scaleY(${1 + smear * 3}) scale(${1 + 0.05 * (t - 15.4)})`, filter: smear ? `blur(${smear * 30}px)` : undefined, opacity: 1 - smear }}>
            {script.end.map((l, i) => <WordFx key={i} at={15.75 + i * 0.45} kind={i ? "stretch" : "focus"} style={{ right: 0, left: 0, textAlign: "center", top: 700 + i * 230, fontFamily: ff(i ? "ruqaa" : "rakkas"), fontWeight: 700, fontSize: i ? 140 : 190, color: i ? C.teal : C.ink }}>{l}</WordFx>)}
          </div>}
          {t >= 17.6 && (() => { const k = back((t - 17.6) / 0.4, 1.4); return <div style={{ position: "absolute", width: W, top: 860, textAlign: "center", fontFamily: ff("ruqaa"), fontWeight: 700, fontSize: 100, color: C.maroon, transform: `scale(${Math.max(0, k)})`, direction: "rtl" }}>{script.name}
            <div style={{ margin: "12px auto 0", width: 520 * easeOut((t - 17.9) / 0.4), height: 10, background: C.teal }} /></div>; })()}
        </>; })()}
      <SfxTrack cues={SFX} />
    </HybridHost>
  );
};
