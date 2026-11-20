import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { HybridHost, HybridBg, VSlot } from "../hybrid/Slot";
import { ff, useFonts } from "./fonts";
import { clamp01, easeInOut, easeOut, lerp } from "./motion";
import { back } from "./PaperSteps";
import { Cue, SfxTrack } from "./sfx";

/**
 * ريل «كيف تعرف عقيدة المفسّر من آية واحدة؟» (طلب المستخدم 2026-11-20) بالأسلوب المعتمد (المرجع الثالث، Ref-ActiveSpeaker):
 * المتحدث عنصر حيّ يتحرك، وأرضية كريمية بشبكة، وكتابة فخمة بالعنابي والأخضر، وشاشات تدخل بالدائرة أو بالنمو وتخرج إلى أعلى،
 * وقلب بطاقة، ومربع يتنقّل بين الكلمات. المصدر: مقطع الشيخ سعيّد بن هليّل العمر من قناته الرسمية، مقصوص من «إذا أردتم أن تعرفوا عقيدة المفسّر»
 * إلى آخر كلامه، والسكتات الطويلة مختصرة (public/aqida/src.mp4، ٥١٫٩ ث). يُعرض من الأصل ما فوق الشريط السفلي (y < 940) بين الشعارين فقط.
 * الآيات من المصحف (الشاملة) لا من التفريغ. لا كتابة على الوجه: في اللقطات الكاملة الكتابة فوق الرأس فقط.
 */
export const AQIDA_FRAMES = 1383;
const W = 1080;
const C = { cream: "#ece3d3", maroon: "#6b1b2b", teal: "#1f6b66", ink: "#2a1518", gold: "#d9b24a" };
const SRC = { faceX: 980, bottom: 940, maxW: 1300 };

/** مستطيل المصدر الذي يُعرض في صندوق بنسبة w/h: أسفله فوق الشريط دائماً، ومركزه على الوجه */
const srcRect = (w: number, h: number) => {
  const a = w / h;
  let ch = Math.min(SRC.bottom, SRC.maxW / a), cw = ch * a;
  if (cw > 1920) { cw = 1920; ch = cw / a; }
  const cx = Math.max(0, Math.min(1920 - cw, SRC.faceX - cw / 2)), cy = SRC.bottom - ch;
  const s = w / cw;
  return { vw: 1920 * s, vh: 1080 * s, vx: -cx * s, vy: -cy * s };
};

/* مسار صورة المتحدث: [ثانية، يسار، أعلى، عرض، ارتفاع] */
const FULL = [0, 400, 1080, 1520];
const KF: number[][] = [
  [0, ...FULL], [3.77, ...FULL],
  [4.09, 560, 520, 460, 620], [5.45, 540, 500, 480, 648],
  [7.03, 540, 500, 480, 648], [8.61, 540, 500, 480, 648],
  [9.06, 190, 120, 700, 460], [12.08, 110, 64, 860, 566],
  [16.41, 160, 100, 760, 500], [16.72, 40, 520, 460, 620], [22.08, 10, 450, 520, 702],
  [22.6, ...FULL], [25.7, ...FULL],
  [35.01, ...FULL], [35.27, 190, 120, 700, 460], [41.02, 100, 64, 880, 579],
  [55.2, 100, 64, 880, 579],
];
const boxAt = (t: number) => {
  for (let i = 0; i < KF.length - 1; i++) {
    const a = KF[i], b = KF[i + 1];
    if (t >= a[0] && t < b[0]) { const u = (t - a[0]) / (b[0] - a[0]), k = b[0] - a[0] >= 0.7 ? u : easeInOut(u); return [1, 2, 3, 4].map((j) => lerp(a[j], b[j], k)); } /* الثبات انجراف منتظم بلا تباطؤ، والانتقال بتسارع وتباطؤ */
  }
  return KF[KF.length - 1].slice(1);
};
/* اقتراب بطيء في اللقطات الكاملة (نحو ٤٪ في الثانية) حتى لا تسكن */
/* اقتراب مستمر داخل البطاقة أثناء ثباتها (٣٫٥٪ في الثانية، حتى ٢٠٪)، ويرجع بنعومة أثناء انتقالها فلا قفزة ولا سكون */
const HOLD_MIN = 0.7, CARD_PUSH = 0.05;
const holdPush = (i: number) => (i >= 0 && KF[i + 1][0] - KF[i][0] >= HOLD_MIN ? Math.min(0.25, CARD_PUSH * (KF[i + 1][0] - KF[i][0])) : 0);
/* الاقتراب موزّع على الثبات كله فلا يبلغ حدّه ويقف قبل نهايته */
const cardPush = (t: number) => {
  for (let i = 0; i < KF.length - 1; i++) {
    const a = KF[i][0], b = KF[i + 1][0];
    if (t >= a && t < b) return b - a >= HOLD_MIN ? 1 + holdPush(i) * ((t - a) / (b - a)) : 1 + holdPush(i - 1) * (1 - easeInOut((t - a) / (b - a)));
  }
  return 1;
};
const fullPush = (t: number) => (t < 3.77 ? 1 + 0.04 * t : t >= 22.6 && t < 25.7 ? 1 + 0.04 * (t - 22.6) : 1);

/** كلمة تدخل بانكماش من الكبير وتخرج بالتلاشي (كلمة كلمة، لا حرفاً حرفاً) */
const Word: React.FC<{ at: number; out?: number; x?: number; y: number; w?: number; size: number; text: string; color?: string; shadow?: string; font?: Parameters<typeof ff>[0]; stretch?: number; align?: "center" | "right" }> = ({ at, out, x = 0, y, w = W, size, text, color = C.maroon, shadow = C.cream, font = "rakkas", stretch = 0, align = "center" }) => {
  const t = useCurrentFrame() / 30;
  if (t < at || (out !== undefined && t >= out)) return null;
  const k = back((t - at) / 0.22, 1.4), fade = out !== undefined ? clamp01((out - t) / 0.12) : 1;
  return <div style={{ position: "absolute", left: x, top: y, width: w, textAlign: align, fontFamily: ff(font), fontSize: size, lineHeight: 1.15, color, textShadow: `${Math.round(size * 0.05)}px ${Math.round(size * 0.05)}px 0 ${shadow}`, direction: "rtl", letterSpacing: stretch ? stretch * clamp01((t - at) / 2.4) : undefined, opacity: fade * clamp01((t - at) / 0.1), transform: `scale(${0.7 + 0.3 * Math.max(0, k)})`, transformOrigin: align === "right" ? "100% 50%" : "50% 50%" }}>{text}</div>;
};
/** سطر آية: يظهر بالضبابية والصعود، بخط المصحف */
const Aya: React.FC<{ at: number; y: number; text: string; size?: number }> = ({ at, y, text, size = 78 }) => {
  const t = useCurrentFrame() / 30;
  if (t < at) return null;
  const k = easeOut((t - at) / 0.35);
  return <div style={{ position: "absolute", left: 60, width: W - 120, top: y, textAlign: "center", fontFamily: ff("amiri"), fontWeight: 700, fontSize: size, lineHeight: 1.6, color: C.cream, direction: "rtl", opacity: k, filter: `blur(${(1 - k) * 8}px)`, transform: `translateY(${(1 - k) * 18}px)` }}>{text}</div>;
};
/** شاشة كاملة بانتقالات المرجع: دائرة تتسع من نقطة، أو نمو من مربع صغير، وخروج إلى أعلى بضبابية؛ والشبكة تنجرف دائماً */
const Screen: React.FC<{ at: number; until: number; color: string; enter: "iris" | "grow"; ox?: number; oy?: number; children: React.ReactNode }> = ({ at, until, color, enter, ox = 540, oy = 1700, children }) => {
  const t = useCurrentFrame() / 30;
  if (t < at || t >= until) return null;
  const u = t - at;
  let tf = "", clip: string | undefined, blur = 0;
  if (enter === "iris") { clip = `circle(${easeInOut(u / 0.4) * 2400}px at ${ox}px ${oy}px)`; tf = `rotate(${(1 - easeOut(u / 0.6)) * 4}deg)`; }
  else { const gw = easeOut(u / 0.45), gh = easeOut((u - 0.08) / 0.45); const iw = lerp(1070, 0, gw) / 2, ih = lerp(820, 0, Math.max(0, gh)); clip = gw < 0.999 || gh < 0.999 ? `inset(${ih}px ${iw}px ${ih}px ${iw}px round 18px)` : undefined; tf = `rotate(${(1 - gw) * -6}deg)`; }
  const e = clamp01((t - (until - 0.35)) / 0.35);
  if (e > 0) { tf += ` translateY(${-e * e * 2100}px)`; blur = e * 14; }
  return (
    <div style={{ position: "absolute", inset: 0, transform: tf || undefined, clipPath: clip, filter: blur ? `blur(${blur}px)` : undefined, background: color, backgroundImage: "linear-gradient(rgba(255,255,255,.07) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,.07) 2px, transparent 2px)", backgroundSize: "54px 54px", backgroundPosition: `${u * 18}px ${u * 30}px` }}>
      <svg width={1080} height={1920} viewBox="-540 -960 1080 1920" style={{ position: "absolute", inset: 0, opacity: 0.3 }}><g transform={`rotate(${u * 22})`}>{[520, 400, 280].map((rr, i) => <polygon key={rr} points={Array.from({ length: 16 }, (_, j) => { const q = (Math.PI * j) / 8, R = j % 2 ? rr * 0.72 : rr; return `${(Math.cos(q) * R).toFixed(1)},${(Math.sin(q) * R).toFixed(1)}`; }).join(" ")} fill="none" stroke="#f2d27a" strokeWidth={4} transform={`rotate(${i * 11.25})`} />)}</g></svg>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${1 + 0.1 * clamp01(u / 3) + 0.012 * Math.max(0, u - 3)}) translateY(${-6 * Math.max(0, u - 3)}px)` }}>{children}</div>
    </div>
  );
};
/** المربع الذي يتنقّل بين الكلمات (أعجب المستخدم في المرجع): [ثانية، يسار، أعلى، عرض، ارتفاع]، يُرسم أول مرة */
const MovingBox: React.FC<{ kf: number[][]; until: number }> = ({ kf, until }) => {
  const t = useCurrentFrame() / 30;
  if (t < kf[0][0] || t >= until) return null;
  let r = kf[kf.length - 1].slice(1);
  for (let i = 0; i < kf.length - 1; i++) { const a = kf[i], b = kf[i + 1]; if (t >= a[0] && t < b[0]) { const k = easeInOut((t - a[0]) / (b[0] - a[0])); r = [1, 2, 3, 4].map((j) => lerp(a[j], b[j], k)); break; } }
  const draw = easeOut((t - kf[0][0]) / 0.5);
  /* خط ذهبي يجري على الإطار بلا توقف (المربع الذي له خط يتحرك في المرجع) */
  const sw = ((t - kf[0][0]) / 1.4) % 1, a0 = Math.max(0, sw * 130 - 30), a1 = Math.min(100, sw * 130);
  return <><div style={{ position: "absolute", left: r[0], top: r[1], width: r[2], height: r[3], border: `7px solid ${C.maroon}`, borderRadius: 16, boxSizing: "border-box", clipPath: `inset(0 ${(1 - draw) * 100}% 0 0)` }} />{draw >= 1 && <div style={{ position: "absolute", left: r[0], top: r[1], width: r[2], height: r[3], border: `7px solid ${C.gold}`, borderRadius: 16, boxSizing: "border-box", clipPath: `inset(0 ${100 - a1}% 0 ${a0}%)` }} />}</>;
};
/** خط أحمر يُرسم فوق كلمة مرفوضة */
const Strike: React.FC<{ at: number; until: number; x: number; y: number; w: number }> = ({ at, until, x, y, w }) => {
  const t = useCurrentFrame() / 30, k = easeOut((t - at) / 0.3);
  if (t < at || t >= until) return null;
  return <div style={{ position: "absolute", left: x + w * (1 - k), top: y, width: w * k, height: 12, background: "#c4342a", borderRadius: 6, transform: "rotate(-4deg)" }} />;
};
/** اسم الشيخ في شارة */
const NameTag: React.FC<{ at: number; until: number; x: number; y: number; w: number }> = ({ at, until, x, y, w }) => {
  const t = useCurrentFrame() / 30;
  if (t < at || t >= until) return null;
  const k = back((t - at) / 0.3, 1.6);
  return <div style={{ position: "absolute", left: x, top: y, width: w, padding: "10px 0", borderRadius: 40, background: C.maroon, boxShadow: `5px 5px 0 ${C.teal}`, textAlign: "center", fontFamily: ff("ruqaa"), fontWeight: 700, fontSize: 44, color: C.cream, direction: "rtl", transform: `scale(${Math.max(0, k)})` }}>الشيخ سعيّد بن هليّل العُمَر</div>;
};

const SFX: Cue[] = [[117, "swish"], [213, "whoosh_big"], [366, "subdrop", 0.8], [774, "whoosh_big"], [1233, "subdrop", 0.8], [1359, "sting"]];

export const AqidaReel: React.FC = () => {
  useFonts(["rakkas", "ruqaa", "amiri"]);
  const t = useCurrentFrame() / 30;
  const [x, y, w, h] = boxAt(t);
  const full = w > 1000 && y < 420;
  const p = full ? fullPush(t) : cardPush(t);
  const r = srcRect(w, h);
  /* قلب البطاقة ٦٫٤–٨٫٦: ظهرها «تفسيره» */
  const flipping = t >= 5.5 && t < 7.03;
  const flipAng = t < 5.5 ? 0 : t < 5.8 ? (180 * (t - 5.5)) / 0.3 : t < 6.73 ? 180 : t < 7.03 ? 180 + (180 * (t - 6.73)) / 0.3 : 360;
  return (
    <HybridHost>
      <HybridBg>
        <AbsoluteFill style={{ background: C.cream, backgroundImage: "linear-gradient(rgba(42,28,31,.06) 2px, transparent 2px), linear-gradient(90deg, rgba(42,28,31,.06) 2px, transparent 2px)", backgroundSize: "54px 54px" }} />
      </HybridBg>
      <Audio src={staticFile("aqida-mufassir_cut_s.mp4")} volume={0.63} />
      {!flipping && <VSlot src="aqida-mufassir_cut_s.mp4" w={w} h={h} radius={full ? 0 : 26} vx={r.vx - (r.vw * (p - 1)) / 2} vy={r.vy - (r.vh * (p - 1)) * 0.3} vw={r.vw * p} vh={r.vh * p} style={{ left: x, top: y }} grow={0} />}
      {!full && !flipping && <div style={{ position: "absolute", left: x - 12, top: y - 12, width: w + 24, height: h + 24, boxSizing: "border-box", border: "12px solid #fffdf6", borderRadius: 30 }} />}

      {/* قلب البطاقة: وجه ثابت من المقطع، وظهر «تفسيره» */}
      {flipping && (
        <div style={{ position: "absolute", left: x, top: y, width: w, height: h, perspective: 1400 }}>
          <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateY(${flipAng}deg) scale(${1 + 0.05 * clamp01((t - 5.78) / 1.0)})` }}>
            <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", borderRadius: 26, background: C.maroon }} />
            <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)", borderRadius: 26, background: "#fffdf6", boxShadow: "0 18px 34px rgba(0,0,0,.28)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <svg width={300} height={220} viewBox="0 0 300 220"><path d="M150 40 C110 15 50 15 14 32 V200 C50 183 110 183 150 205 Z" fill="#f3ead7" stroke={C.maroon} strokeWidth={8} /><path d="M150 40 C190 15 250 15 286 32 V200 C250 183 190 183 150 205 Z" fill="#efe3c9" stroke={C.maroon} strokeWidth={8} />{[60, 85, 110, 135, 160].map((yy) => <React.Fragment key={yy}><line x1={36} y1={yy} x2={128} y2={yy + 4} stroke={C.teal} strokeWidth={5} /><line x1={172} y1={yy + 4} x2={264} y2={yy} stroke={C.teal} strokeWidth={5} /></React.Fragment>)}</svg>
              <div style={{ fontFamily: ff("rakkas"), fontSize: 96, color: C.maroon, direction: "rtl", marginTop: 10 }}>تفسيره</div>
            </div>
          </div>
        </div>
      )}

      {/* ١) ٠–٣: فوق الرأس */}
      <Word at={0} out={3.84} y={150} size={104} text="إذا أردتم أن تعرفوا" font="ruqaa" />
      {/* ٢) ٣٫١–٦٫٣: عقيدة المفسّر يساراً والمربع حولها */}
      <Word at={3.92} out={5.48} x={20} y={600} w={520} size={160} text="عقيدة" />
      <Word at={5.11} out={5.48} x={20} y={800} w={520} size={150} text="المفسّر" color={C.teal} />
      <MovingBox kf={[[4.05, 50, 610, 460, 200], [5.06, 50, 610, 460, 200], [5.26, 50, 800, 460, 190], [5.45, 50, 800, 460, 190]]} until={5.48} />
      <NameTag at={4.14} until={5.48} x={540} y={1180} w={500} />
      {/* ٣) ٦٫٤–٨٫٦: فاذهبوا إلى تفسيره (البطاقة تنقلب) */}
      <Word at={5.5} out={7.1} x={20} y={640} w={520} size={110} text="فاذهبوا" font="ruqaa" />
      <Word at={6.47} out={7.1} x={20} y={800} w={520} size={110} text="إلى تفسيره" font="ruqaa" color={C.teal} />
      {/* ٤) ٨٫٧–١٠٫٥: الآية بملء الشاشة */}
      <Screen at={7.1} until={8.7} color={C.teal} enter="iris" ox={780} oy={820}>
        <Word at={7.19} y={560} size={70} text="لتفسير قوله تعالى" font="ruqaa" color={C.gold} shadow={C.ink} />
        <Aya at={7.37} y={720} size={100} text="﴿وَجَاءَ رَبُّكَ" />
        <Aya at={7.37} y={880} size={100} text="وَالْمَلَكُ صَفًّا صَفًّا﴾" />
        <Word at={7.72} y={1100} size={52} text="الفجر: ٢٢" font="ruqaa" color={C.cream} shadow={C.ink} />
      </Screen>
      {/* ٥) ١٠٫٥–١٣٫٤: التأويل المردود */}
      <Word at={8.82} out={12.2} y={700} size={80} text="إن قال:" font="ruqaa" />
      <Word at={9.18} out={12.2} y={860} size={120} text="جاءت ملائكته" />
      <Strike at={10.39} until={12.2} x={190} y={940} w={700} />
      <Word at={10.99} out={12.2} y={1060} size={120} text="جاءت رحمته" />
      <Strike at={11.72} until={12.2} x={210} y={1140} w={660} />
      {/* ٦) ١٣٫٤–١٨٫٣: فاغسلوا كفّيكم منه */}
      <Screen at={12.2} until={16.5} color={C.maroon} enter="grow">
        <Word at={12.64} y={700} size={170} text="فاغسلوا" color={C.cream} shadow={C.ink} stretch={30} />
        <Word at={13.25} y={920} size={130} text="كفّيكم منه" color={C.gold} shadow={C.ink} font="ruqaa" />
      </Screen>
      {/* ٧) ١٨٫٣–٢٤٫٢: أئمة التفسير على قول السلف */}
      <Word at={16.57} out={22.19} x={500} y={360} w={560} size={90} text="وإذا قال" font="ruqaa" />
      <Word at={17.3} out={22.19} x={520} y={540} w={540} size={120} text="ابن كثير" />
      <Word at={18.3} out={22.19} x={520} y={720} w={540} size={120} text="ابن جرير" color={C.teal} />
      <Word at={19.2} out={22.19} x={520} y={900} w={540} size={120} text="ابن سعدي" />
      <Word at={20.1} out={22.19} y={1260} size={100} text="وعامة علماء السلف" color={C.teal} />
      <Word at={21.27} out={22.19} y={1440} size={110} text="المفسّرين" font="ruqaa" />
      <MovingBox kf={[[17.4, 560, 545, 460, 160], [18.1, 560, 545, 460, 160], [18.38, 560, 725, 460, 160], [19.04, 560, 725, 460, 160], [19.31, 560, 905, 460, 160], [19.99, 560, 905, 460, 160], [20.43, 120, 1255, 840, 150], [21.2, 120, 1255, 840, 150], [21.55, 90, 1235, 900, 345], [22.19, 80, 1228, 920, 360]]} until={22.19} />
      <NameTag at={16.86} until={22.19} x={20} y={1150} w={480} />
      {/* ٨) ٢٤٫٣–٢٧٫٦: فوق الرأس */}
      <Word at={22.4} out={25.75} y={90} size={120} text="هو الذي يجيء" />
      <Word at={23.7} out={25.75} y={250} size={84} text="لفصل القضاء" font="ruqaa" color={C.teal} />
      {/* ٩) ٢٧٫٧–٣٨٫٦: آيتا الفرقان */}
      <Screen at={25.8} until={35.1} color={C.teal} enter="iris" ox={540} oy={300}>
        <Aya at={25.97} y={330} size={78} text="﴿وَيَوْمَ تَشَقَّقُ السَّمَاءُ بِالْغَمَامِ" />
        <Aya at={28.3} y={500} size={78} text="وَنُزِّلَ الْمَلَائِكَةُ تَنْزِيلًا ۝" />
        <Aya at={30.2} y={700} size={78} text="الْمُلْكُ يَوْمَئِذٍ الْحَقُّ لِلرَّحْمَنِ" />
        <Aya at={32.8} y={870} size={78} text="وَكَانَ يَوْمًا عَلَى الْكَافِرِينَ عَسِيرًا﴾" />
        <Word at={33.31} y={1120} size={52} text="الفرقان: ٢٥–٢٦" font="ruqaa" color={C.cream} shadow={C.ink} />
      </Screen>
      {/* ١٠) ٣٨٫٧–٤٥٫٨: يجيء، ينزل، يدنو */}
      <Word at={35.22} out={41.1} y={700} size={110} text="هو الذي يجيء" />
      <Word at={36.5} out={41.1} y={900} size={80} text="وينزل في الثلث الأخير من الليل" font="ruqaa" color={C.teal} />
      <Word at={39} out={41.1} y={1080} size={110} text="ويدنو عشية عرفة" />
      <MovingBox kf={[[35.33, 190, 700, 700, 150], [36.38, 190, 700, 700, 150], [36.72, 60, 895, 960, 120], [38.78, 110, 880, 860, 150], [39.17, 140, 1080, 800, 150], [41.1, 140, 1080, 800, 150]]} until={41.1} />
      {/* ١١) ٤٥٫٩–النهاية: قول المعطّلة */}
      <Screen at={41.1} until={99} color={C.maroon} enter="grow">
        <Word at={41.22} y={480} size={96} text="لا يُقال:" font="ruqaa" color={C.cream} shadow={C.ink} />
        <Word at={41.5} y={640} size={130} text="الملائكة والرحمة" color={C.gold} shadow={C.ink} />
        <Word at={43.3} y={900} size={84} text="هذا قول" font="ruqaa" color={C.cream} shadow={C.ink} />
        <Word at={43.9} y={1040} size={104} text="المعطّلة والمبتدعة والضُّلّال" color={C.cream} shadow={C.teal} />
        <NameTag at={44.96} until={99} x={240} y={1480} w={600} />
      </Screen>
      <SfxTrack cues={SFX} />
    </HybridHost>
  );
};
