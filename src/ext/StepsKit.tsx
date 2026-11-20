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
const Cutout: React.FC<{ src: string; x: number; y: number; w: number; rot: number; at: number; from?: "l" | "r" | "t" }> = ({ src, x, y, w, rot, at, from = "t" }) => {
  const t = useCurrentFrame() / 30, u = t - at;
  if (u < 0) return null;
  const k = back(u / 0.4, 1.3), d = 1 - Math.min(1, k);
  const dx = from === "l" ? -d * 900 : from === "r" ? d * 900 : 0, dy = from === "t" ? -d * 900 : 0;
  return (
    <div style={{ position: "absolute", left: x + dx, top: y + dy, width: w, transform: `rotate(${rot + d * (from === "l" ? -25 : 25)}deg) scale(${1 + 0.1 * clamp01(u / 3)})`, background: "#fff", padding: 14, boxShadow: "8px 14px 22px rgba(0,0,0,.28)" }}>
      <Img src={staticFile(src)} style={{ width: "100%", display: "block" }} />
    </div>
  );
};
/** كلمة تُكشف من اليمين (اتجاه الكتابة) */
const Rev: React.FC<{ at: number; style: React.CSSProperties; children: React.ReactNode }> = ({ at, style, children }) => {
  const k = easeOut((useCurrentFrame() / 30 - at) / 0.3);
  if (k <= 0) return null;
  return <div style={{ position: "absolute", direction: "rtl", whiteSpace: "nowrap", ...style, clipPath: `inset(-30% 0 -30% ${(1 - k) * 100}%)` }}>{children}</div>;
};
const StepHeader: React.FC<{ s: StepSpec }> = ({ s }) => {
  const t = useCurrentFrame() / 30, u = t - s.a;
  const kb = back(u / 0.35, 2), line = easeInOut((u - 0.1) / 0.35);
  return (
    <>
      <div style={{ position: "absolute", left: W / 2 - 85, top: 130, width: 170, height: 170, border: `4px dashed ${C.ink}`, transform: `rotate(${(1 - clamp01(u / 0.35)) * -140}deg) scale(${Math.max(0, kb)})`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: ff("rakkas"), fontSize: 140, color: C.maroon, lineHeight: 1 }}>{s.n}</div>
      <div style={{ position: "absolute", right: 0, top: 500, width: W * 0.9 * Math.max(0, line), height: 10, background: C.ink }} />
      <Rev at={s.a + 0.2} style={{ right: W * 0.05, top: 340, fontFamily: ff("rakkas"), fontSize: 170, color: C.ink }}>{s.top}</Rev>
      <Rev at={s.a + 0.35} style={{ right: W * 0.12, top: 520, fontFamily: ff("rakkas"), fontSize: 170, color: C.ink }}>{s.bottom}</Rev>
      <Rev at={s.a + 0.55} style={{ right: W * 0.12, top: 730, fontFamily: ff("ruqaa"), fontWeight: 700, fontSize: 100, color: C.teal }}>{s.sub}</Rev>
    </>
  );
};

/* ───────── التمرين ───────── */
const SCRIPT: StepsScript = {
  hook: "تريد أن تبدأ طلب العلم؟",
  title: ["٤ خطوات", "لطلب العلم"],
  steps: [
    { a: 5.0, b: 7.6, n: "١", top: "النيـ", bottom: "ـــة الصالحة", sub: "أصل كل عمل", img: "cine/hands_book.png", img2: "cine/pen_notebook.png" },
    { a: 7.6, b: 10.2, n: "٢", top: "المتـ", bottom: "ـــن المختصر", sub: "قبل المطوّلات", img: "cine/book_stack.png", img2: "cine/pen_notebook.png" },
    { a: 10.2, b: 12.8, n: "٣", top: "الشيـ", bottom: "ـــخ المتقن", sub: "تأخذ عنه وتسأله", speaker: true },
    { a: 12.8, b: 15.4, n: "٤", top: "المراجـ", bottom: "ـــعة الدائمة", sub: "ما لا يُراجَع يُنسى", img: "cine/library.png", img2: "cine/book_stack.png" },
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
const SFX: Cue[] = [[S(0.3), "tear"], [S(2.6), "whoosh_big"], [S(3.5), "popdeep", 0.8], [S(4.6), "swish"], [S(7.45), "fast"], [S(10.05), "fast"], [S(12.65), "fast"], [S(15.25), "fast"], [S(17.7), "sting"]];

export const StepsTemplate: React.FC<{ script?: StepsScript; src?: string }> = ({ script = SCRIPT, src = "dubkmr/src.mp4" }) => {
  useFonts(["rakkas", "ruqaa"]);
  const f = useCurrentFrame(), t = f / 30;
  const [x, y, w, h] = frameBox(t, VKF);
  /* التسليم: الاقتراب داخل البطاقة أُسّي متسارع (٢٫٦–٣٫١ ث) فيقع القطع عند أعلى سرعة */
  const crash = t >= 2.6 && t < 3.1 ? Math.pow(clamp01((t - 2.6) / 0.5), 3) : t >= 3.1 ? 1 : 0;
  const box = crash > 0 && crash < 1 ? [lerp(205, 0, crash), lerp(340, 0, crash), lerp(670, 1080, crash), lerp(1191, 1920, crash)] : [x, y, w, h];
  const card = box[2] < 1000;
  const peel = easeInOut((t - 0.05) / 0.45);
  const stepIdx = script.steps.findIndex((s) => t >= s.a && t < s.b);
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
      {peel < 1 && <>
        <div style={{ position: "absolute", inset: 0, transform: `translate(${-peel * 1000}px, ${peel * 300}px) rotate(${-peel * 14}deg)`, clipPath: `polygon(${poly(tornLine(W * 0.62, -20, W * 0.3, H + 20, 11))},-40px ${H + 40}px,-40px -40px)`, background: C.cream, filter: "drop-shadow(8px 0 10px rgba(0,0,0,.25))" }} />
        <div style={{ position: "absolute", inset: 0, transform: `translate(${peel * 900}px, ${peel * 700}px) rotate(${peel * 16}deg)`, clipPath: `polygon(${poly(tornLine(W * 0.62, -20, W * 0.3, H + 20, 11))},${W + 40}px ${H + 40}px,${W + 40}px -40px)`, background: C.cream, filter: "drop-shadow(-8px 0 10px rgba(0,0,0,.25))" }} />
      </>}

      {/* ٢) العنوان على صدر الشيخ (الشاشة كاملة) */}
      {t >= 3.1 && t < 4.7 && (() => { const k = back((t - 3.3) / 0.35, 1.6); return <div style={{ position: "absolute", left: W / 2 - 300, top: 1150, width: 600, height: 600, borderRadius: "50%", background: C.maroon, transform: `scale(${Math.max(0, k)})`, boxShadow: "0 18px 30px rgba(0,0,0,.3)" }}>
        <div style={{ position: "absolute", width: "100%", top: 130, textAlign: "center", fontFamily: ff("rakkas"), fontSize: 150, color: C.cream, direction: "rtl" }}>{script.title[0]}</div>
        <div style={{ position: "absolute", width: "100%", top: 330, textAlign: "center", fontFamily: ff("ruqaa"), fontWeight: 700, fontSize: 96, color: "#e8c77a", direction: "rtl" }}>{script.title[1]}</div></div>; })()}

      {/* ستارة الفصل: تصعد في ٥ إطارات وتغطي، ثم تكمل صعودها فتكشف الورق */}
      {t >= 4.55 && t < 5.15 && <div style={{ position: "absolute", left: 0, width: W, height: H, top: H * (1 - easeInOut((t - 4.55) / 0.17)) - H * easeInOut((t - 4.85) / 0.3), background: C.teal }} />}

      {/* ٣) الخطوات: سحب عمودي بضبابية بين كل خطوتين */}
      {stepIdx >= 0 && (() => { const s = script.steps[stepIdx];
        const inK = stepIdx === 0 ? 1 : easeOut((t - s.a) / 0.2), outK = clamp01((t - (s.b - 0.18)) / 0.18);
        const ty = (1 - inK) * 1500 - outK * outK * 1900, blur = (1 - inK) * 40 + outK * 50;
        return <AbsoluteFill style={{ transform: `translateY(${ty}px) scale(${1 + 0.04 * (t - s.a)})`, filter: blur > 1 ? `blur(${blur.toFixed(0)}px)` : undefined }}>
          <StepHeader s={s} />
          {s.img && <Cutout src={s.img} x={150} y={930} w={600} rot={stepIdx % 2 ? 4 : -4} at={s.a + 0.6} from={stepIdx % 2 ? "r" : "l"} />}
          {s.img2 && <Cutout src={s.img2} x={620} y={1250} w={360} rot={stepIdx % 2 ? -8 : 8} at={s.a + 1.3} from={stepIdx % 2 ? "l" : "r"} />}
        </AbsoluteFill>; })()}

      {/* ٤) الختام: سطور ثم مسح عمودي ثم الاسم */}
      {t >= 15.4 && (() => { const smear = clamp01((t - 17.4) / 0.25);
        return <>
          {smear < 1 && <div style={{ position: "absolute", inset: 0, transform: `scaleY(${1 + smear * 3}) scale(${1 + 0.05 * (t - 15.4)})`, filter: smear ? `blur(${smear * 30}px)` : undefined, opacity: 1 - smear }}>
            {script.end.map((l, i) => <Rev key={i} at={15.6 + i * 0.4} style={{ right: 0, left: 0, textAlign: "center", top: 700 + i * 230, fontFamily: ff(i ? "ruqaa" : "rakkas"), fontWeight: 700, fontSize: i ? 140 : 190, color: i ? C.teal : C.ink }}>{l}</Rev>)}
          </div>}
          {t >= 17.6 && (() => { const k = back((t - 17.6) / 0.4, 1.4); return <div style={{ position: "absolute", width: W, top: 860, textAlign: "center", fontFamily: ff("ruqaa"), fontWeight: 700, fontSize: 100, color: C.maroon, transform: `scale(${Math.max(0, k)})`, direction: "rtl" }}>{script.name}
            <div style={{ margin: "12px auto 0", width: 520 * easeOut((t - 17.9) / 0.4), height: 10, background: C.teal }} /></div>; })()}
        </>; })()}
      <SfxTrack cues={SFX} />
    </HybridHost>
  );
};
