import React from "react";
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame } from "remotion";
import { HybridHost, HybridBg, VSlot } from "./hybrid/Slot";
import { frameBox } from "./ext/ActiveSpeaker";
import { C, Clutter, Pin } from "./ext/BoardKit";
import { CrumplePaper } from "./ext/PaperSteps";
import { ff, useFonts } from "./ext/fonts";
import { clamp01, easeInOut, easeOut, lerp } from "./ext/motion";
import { mulberry32 } from "./ext/rand";
import { Cue, SfxTrack } from "./ext/sfx";
import { DUBKMR_FRAMES } from "./DubKmr";

/**
 * الدبلجة الكرمنجية «لوحة التحقيق» مبنية على قاعدة المرجع الثاني (§٣٧، تصحيح المستخدم 2026-11-20: «ما عندك غير حركتين وعم تكررها»
 * و«وجد بيده حلقة مو خاتم، المقصود أسوار»): كل اسم يُدخل شيئه عند نطقه، وكل فعل يحرّك الشيء بمعناه عند نطقه، والتبديل في السكتات.
 * أزمنة الكلمات: موضع الكلمة في الجملة الكرمنجية × مدة الجملة (phrases2.json). ستة عشر نوع حركة لا يتكرر نوعٌ مرتين متتاليتين.
 */
const W = 1080, H = 1920;
type Act = { at: number; k: "push" | "glow" | "wilt" | "flip" | "break" | "x" | "q" | "far" | "old" };
type Item = { id: string; src: string; x: number; y: number; w: number; rot?: number; back?: string;
  inAt: number; inK: "drop" | "slideL" | "slideR" | "rise" | "swing" | "pop";
  outAt?: number; outK?: "fall" | "sweepL" | "sweepR" | "up" | "crumple" | "far"; acts?: Act[]; tag?: number };

/* ───────── الأسوار مرسومة (نحاس مجسّم) ───────── */
const Bangle: React.FC = () => (
  <svg viewBox="0 0 400 584" style={{ width: "100%", display: "block", background: "radial-gradient(ellipse at 50% 45%, #4a2e22, #1a0f0a 75%)" }}>
    <defs>
      <linearGradient id="br1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f6dd96" /><stop offset=".35" stopColor="#c7922f" /><stop offset=".6" stopColor="#7d5717" /><stop offset=".85" stopColor="#d9aa4c" /><stop offset="1" stopColor="#6b4610" /></linearGradient>
      <linearGradient id="br2" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#3b250c" /><stop offset="1" stopColor="#9a6c24" /></linearGradient>
      <radialGradient id="shd" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#000" stopOpacity=".55" /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient>
    </defs>
    <ellipse cx="200" cy="350" rx="170" ry="62" fill="url(#shd)" />
    <ellipse cx="200" cy="300" rx="132" ry="60" fill="none" stroke="url(#br2)" strokeWidth="38" />
    <path d="M68 300 A132 60 0 0 0 332 300" fill="none" stroke="url(#br1)" strokeWidth="38" strokeLinecap="round" />
    <path d="M90 316 A112 48 0 0 0 310 316" fill="none" stroke="#fff3c8" strokeWidth="6" opacity=".55" />
    <path d="M110 268 A100 40 0 0 1 290 268" fill="none" stroke="#e7c27a" strokeWidth="4" opacity=".35" />
    {Array.from({ length: 9 }, (_, i) => { const q = Math.PI * (0.12 + (i / 8) * 0.76); return <circle key={i} cx={200 - Math.cos(q) * 132} cy={300 + Math.sin(q) * 60} r="6" fill="#4a300c" />; })}
  </svg>
);
const Pic: React.FC<{ src: string }> = ({ src }) => src === "bangle" ? <Bangle /> : <Img src={staticFile(src)} style={{ width: "100%", display: "block" }} />;

/* ───────── عنصر بحركات دخوله وخروجه وأفعاله ───────── */
const Thing: React.FC<{ it: Item; t: number }> = ({ it, t }) => {
  if (t < it.inAt || (it.outAt !== undefined && t > it.outAt + 0.6)) return null;
  const u = t - it.inAt, h = it.w * 1.46;
  let tx = 0, ty = 0, sc = 1, rot = it.rot ?? 0, filt = "", radius = 0;
  /* الدخول */
  const k = easeOut(u / 0.4), d = 1 - k;
  if (it.inK === "drop") { sc *= lerp(1.4, 1, k); }
  if (it.inK === "slideL") { tx -= d * 1200; rot -= d * 20; }
  if (it.inK === "slideR") { tx += d * 1200; rot += d * 20; }
  if (it.inK === "rise") { ty += d * 1500; }
  if (it.inK === "pop") { sc *= u < 0.25 ? lerp(0.2, 1.15, u / 0.25) : lerp(1.15, 1, clamp01((u - 0.25) / 0.15)); }
  /* الأرجحة من حبل معلّق: زاوية تخمد ثم تمايل خفيف */
  let swing = 0;
  if (it.inK === "swing") { ty -= d * 900; swing = Math.exp(-1.6 * u) * 16 * Math.sin(u * 5.5) + Math.sin(u * 1.6) * 2.5; }
  /* الأفعال */
  let flipped = 0, broken = -1, xAt = -1, qAt = -1, glow = 0, oldK = 0;
  for (const a of it.acts ?? []) {
    const v = t - a.at; if (v < 0) continue;
    if (a.k === "push") sc *= 1 + 0.2 * easeInOut(v / 0.6);
    if (a.k === "glow") glow = Math.max(glow, Math.sin(Math.PI * clamp01(v / 1.4)));
    if (a.k === "wilt") { const w = easeInOut(v / 0.7); rot += 9 * w; ty += 40 * w; filt += ` grayscale(${w}) brightness(${1 - 0.3 * w})`; sc *= 1 - 0.08 * w; }
    if (a.k === "flip") flipped += easeInOut(v / 0.45);
    if (a.k === "break") broken = v;
    if (a.k === "x") xAt = v;
    if (a.k === "q") qAt = v;
    if (a.k === "old") { const o = easeInOut(v / 0.6); filt += ` sepia(${0.9 * o}) contrast(${1 + 0.15 * o}) brightness(${1 - 0.12 * o})`; oldK = o; }
    if (a.k === "far") { const f = easeInOut(v / 0.6); sc *= 1 - 0.85 * f; tx += 300 * f; ty -= 500 * f; }
  }
  /* الخروج */
  if (it.outAt !== undefined && t > it.outAt) {
    const o = easeInOut((t - it.outAt) / 0.5);
    if (it.outK === "fall") { ty += o * o * 2200; rot += o * 35; }
    if (it.outK === "sweepL") tx -= o * 1300;
    if (it.outK === "sweepR") tx += o * 1300;
    if (it.outK === "up") ty -= o * 2200;
    if (it.outK === "crumple") { sc *= 1 - 0.95 * o; rot += o * 300; radius = o * 400; filt += ` contrast(${1 + o})`; }
    if (it.outK === "far") { sc *= 1 - 0.9 * o; tx += 350 * o; ty -= 700 * o; }
  }
  const ang = (flipped % 2) * 180, showBack = it.back && Math.cos((ang * Math.PI) / 180) < 0;
  const card = (src: string, extra?: React.CSSProperties) => <div style={{ position: "absolute", inset: 0, border: `12px solid ${C.edge}`, background: "#fff", overflow: "hidden", borderRadius: radius, ...extra }}><Pic src={src} /></div>;
  const pivotY = -it.y;
  return (
    <>
      {it.inK === "swing" && <svg width={W} height={H} style={{ position: "absolute", inset: 0, transform: `rotate(${swing}deg)`, transformOrigin: `${it.x + it.w / 2}px 0px` }}><line x1={it.x + it.w / 2} y1={0} x2={it.x + it.w / 2} y2={it.y + ty + 10} stroke="#3a2a1c" strokeWidth={5} /></svg>}
      {glow > 0 && <div style={{ position: "absolute", left: it.x - 140 + tx, top: it.y - 140 + ty, width: it.w + 280, height: h + 280, borderRadius: "50%", background: `radial-gradient(circle, rgba(255,214,120,${0.75 * glow}), rgba(255,214,120,0) 70%)` }} />}
      <div style={{ position: "absolute", left: it.x + tx, top: it.y + ty, width: it.w, height: h, perspective: 1600,
        transform: `${it.inK === "swing" ? `rotate(${swing}deg)` : ""} scale(${sc}) rotate(${rot}deg)`, transformOrigin: it.inK === "swing" ? `50% ${pivotY}px` : "50% 50%",
        filter: `drop-shadow(${it.inK === "drop" ? lerp(40, 8, k) : 8}px ${it.inK === "drop" ? lerp(60, 14, k) : 14}px ${it.inK === "drop" ? lerp(30, 8, k) : 8}px rgba(0,0,0,.4))${filt}` }}>
        {broken < 0 ? (
          <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateY(${flipped * 180}deg)` }}>
            <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden" }}>{card(it.src)}</div>
            {it.back && <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>{card(it.back)}</div>}
          </div>
        ) : (
          [0, 1].map((half) => { const s = half ? 1 : -1, sp = easeOut(broken / 0.35), settle = easeOut(clamp01((broken - 0.3) / 0.5)), droop = Math.max(0, broken - 1.25);
            /* ينكسر فيستقرّ النصفان مائلين، ثم عند «lawaziyê» (الوهن) يذبلان ويغوصان ببطء ويعتمان: «لا تزيدك إلا وهناً» */
            return <div key={half} style={{ position: "absolute", inset: 0, clipPath: half ? "polygon(52% 0,100% 0,100% 100%,47% 100%,55% 62%,44% 38%)" : "polygon(0 0,52% 0,44% 38%,55% 62%,47% 100%,0 100%)",
              filter: `brightness(${1 - Math.min(0.55, droop * 0.4)})`,
              transform: `translate(${s * (sp * 110 + settle * 40)}px, ${settle * 260 + droop * 120}px) rotate(${s * (sp * 14 + settle * 22 + droop * 10)}deg)` }}>{card(it.src)}</div>; })
        )}
        {showBack && null}
        {oldK > 0 && broken < 0 && <svg width={it.w} height={h} style={{ position: "absolute", inset: 0, opacity: 0.55 * oldK }}>{Array.from({ length: 14 }, (_, j) => { const rr = mulberry32(j * 7 + 3); const x1 = rr() * it.w, y1 = rr() * h; return <line key={j} x1={x1} y1={y1} x2={x1 + (rr() - 0.5) * 60} y2={y1 + 80 + rr() * 220} stroke="#f3e2b8" strokeWidth={1.5 + rr() * 2} />; })}</svg>}
        {it.tag && broken < 0 && (() => { const tk = easeOut((u - 0.35) / 0.25); return tk > 0 && <div style={{ position: "absolute", left: 26, bottom: -52, width: 150, height: 74, transformOrigin: "62px -30px", transform: `rotate(${-9 + Math.sin(u * 2.2) * 2}deg) scale(${tk})`, background: "#e9d4a0", border: "2px solid #b89a5c", borderRadius: "6px 6px 6px 30px", boxShadow: "3px 5px 6px rgba(0,0,0,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Courier New', monospace", fontWeight: 700, fontSize: 42, color: C.red, letterSpacing: 2 }}>
          <div style={{ position: "absolute", left: 10, top: 23, width: 14, height: 14, borderRadius: 7, background: "#7a5a2a" }} />{String(it.tag).padStart(2, "0")}</div>; })()}
      </div>
      {broken >= 0 && broken < 1.2 && Array.from({ length: 14 }, (_, j) => { const rr = mulberry32(j * 13 + 1), a = rr() * Math.PI * 2, sp = 260 + rr() * 520, k = easeOut(broken / 0.6), g = broken * broken * 900;
        return <div key={"sh" + j} style={{ position: "absolute", left: it.x + it.w / 2 + Math.cos(a) * sp * k, top: it.y + h * 0.5 + Math.sin(a) * sp * k + g, width: 26 + rr() * 40, height: 14 + rr() * 22, background: "linear-gradient(135deg,#f6dd96,#a8741f)", clipPath: "polygon(0 0,100% 30%,40% 100%)", transform: `rotate(${broken * (400 + rr() * 600)}deg)`, opacity: 1 - clamp01((broken - 0.8) / 0.4) }} />; })}
      {broken >= 0 && broken < 0.25 && <AbsoluteFill style={{ background: `radial-gradient(circle at ${(it.x + it.w / 2) / W * 100}% ${(it.y + h / 2) / H * 100}%, rgba(255,250,235,${1 - broken / 0.25}), rgba(255,220,150,${0.5 * (1 - broken / 0.25)}) 30%, transparent 65%)` }} />}
      {xAt >= 0 && <svg width={it.w} height={it.w} viewBox="0 0 100 100" style={{ position: "absolute", left: it.x + tx, top: it.y + ty + (h - it.w) / 2, overflow: "visible", transform: `scale(${sc})`, filter: "drop-shadow(0 4px 4px rgba(0,0,0,.35))" }}>
        <path d="M14 14 L86 86" stroke={C.red} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray={`${easeOut(xAt / 0.18)} 1`} fill="none" />
        <path d="M86 14 L14 86" stroke={C.red} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray={`${Math.max(0, easeOut((xAt - 0.15) / 0.18))} 1`} fill="none" /></svg>}
      {qAt >= 0 && qAt < 2.6 && <svg width={220} height={300} viewBox="0 0 100 140" style={{ position: "absolute", left: it.x + it.w + tx - 40, top: it.y + ty + 60, overflow: "visible", transform: `rotate(10deg) scale(${easeOut(qAt / 0.3)})` }}>
        <path d="M22 40 C 22 8, 82 6, 80 40 C 78 66, 50 66, 50 92" stroke={C.red} strokeWidth={11} strokeLinecap="round" fill="none" pathLength={1} strokeDasharray={`${easeOut(qAt / 0.45)} 1`} />
        <circle cx="50" cy="122" r={qAt > 0.45 ? 8 : 0} fill={C.red} /></svg>}
    </>
  );
};

/** مطر أشياء يتكوّم أسفل الشاشة ثم يُكنس */
const Rain: React.FC<{ at: number; out: number; t: number; srcs: string[]; seed: number }> = ({ at, out, t, srcs, seed }) => {
  if (t < at || t > out + 0.6) return null;
  const r = mulberry32(seed), o = t > out ? easeInOut((t - out) / 0.5) : 0;
  return <>{Array.from({ length: 16 }, (_, i) => { const x = 40 + r() * 860, y = 1180 + r() * 520, w = 170 + r() * 90, a0 = at + i * 0.09, rot = (r() - 0.5) * 50, src = srcs[i % srcs.length];
    const u = t - a0; if (u < 0) return null; const k = easeOut(u / 0.35);
    return <div key={i} style={{ position: "absolute", left: x - o * 1300, top: lerp(-500, y, k), width: w, transform: `rotate(${rot + (1 - k) * 160}deg)`, filter: `blur(${(1 - k) * 6}px) drop-shadow(4px 8px 6px rgba(0,0,0,.35))` }}>
      <div style={{ border: `8px solid ${C.edge}`, background: "#fff" }}><Pic src={src} /></div></div>; })}</>;
};

/* ───────── الجدول (أزمنة الكلمات من الجمل الكرمنجية) ───────── */
const ITEMS: Item[] = [
  /* «Çavê xerab û hesûdiyê … dûr dixe» العين والحسد ← تُبعَد */
  { id: "eye", tag: 1, src: "cine/amulet.png", x: 540, y: 520, w: 460, inAt: 4.8, inK: "drop", rot: 3, acts: [{ at: 6.5, k: "far" }], outAt: 7.1, outK: "far" },
  /* «Deriyên rizqê … vedike» أبواب الرزق ← الباب يدخل ثم يُضاء ويقترب على «vedike» */
  { id: "door", tag: 2, src: "cine/door_light.png", x: 320, y: 900, w: 660, inAt: 7.2, inK: "slideR", rot: -2, acts: [{ at: 9.35, k: "glow" }], outAt: 9.95, outK: "fall" },
  /* «nexweşiyek … şifa dike» المرض ← الدواء يقفز، والشفاء ← توهّج */
  { id: "med", tag: 3, src: "cine/medicine.png", x: 540, y: 560, w: 460, inAt: 10.35, inK: "pop", rot: 4, acts: [{ at: 11.75, k: "glow" }], outAt: 12.55, outK: "up" },
  /* «daliqînin» يعلّقون ← التميمة تتدلّى من حبل وتتأرجح */
  { id: "hang", src: "cine/amulet.png", x: 580, y: 640, w: 400, inAt: 16.2, inK: "swing", outAt: 20.1, outK: "up" },
  /* «rewayetkirin» الرواية ← الكتب تنزلق */
  { id: "books", src: "cine/book_stack.png", x: 560, y: 1260, w: 400, inAt: 19.2, inK: "slideR", rot: 5, outAt: 20.15, outK: "sweepR" },
  { id: "books2", src: "cine/book_stack.png", x: 90, y: 260, w: 420, inAt: 20.6, inK: "slideL", rot: -4, outAt: 23.1, outK: "up" },
  /* «xelekek dît» رأى حلقة (أسوار) ← تسقط من الكاميرا ثم اقتراب */
  { id: "bangle", tag: 4, src: "bangle", x: 90, y: 150, w: 520, inAt: 23.45, inK: "drop", rot: -2, acts: [{ at: 25.15, k: "old" }], outAt: 26.75, outK: "sweepL" },
  /* «tilsim» التمائم ← الطلسم ينزلق */
  { id: "tals", tag: 5, src: "cine/talisman.png", x: 580, y: 300, w: 420, inAt: 26.9, inK: "slideR", rot: 4, acts: [{ at: 30.75, k: "x" }], outAt: 31.2, outK: "fall" },
  /* «ev xelek çi ye?» ما هذه الحلقة؟ ← الأسوار تصعد وعلامة استفهام؛ «lawaziyê» الوهن ← تذبل؛ «tilsimekê» ← تنقلب إلى طلسم؛ ثم تعود */
  { id: "bangle2", tag: 4, src: "bangle", back: "cine/talisman.png", x: 70, y: 980, w: 540, inAt: 31.3, inK: "rise",
    acts: [{ at: 32.7, k: "q" }, { at: 35.0, k: "wilt" }, { at: 36.1, k: "flip" }, { at: 39.95, k: "flip" }, { at: 40.7, k: "push" }, { at: 42.0, k: "break" }], outAt: 44.6, outK: "fall" },
  /* «şifayê … hêzê» الشفاء والقوة ← الدواء ينزلق ويتوهج */
  { id: "med2", src: "cine/medicine.png", x: 620, y: 1060, w: 380, inAt: 37.8, inK: "slideR", rot: 5, acts: [{ at: 39.05, k: "glow" }], outAt: 39.95, outK: "sweepR" },
  { id: "reader2", src: "cine/reader_back_soft.png", x: 600, y: 960, w: 400, inAt: 44.75, inK: "slideR", rot: 4, outAt: 46.3, outK: "sweepR" },
  /* «girêdayî bibe» من تعلّق ← التميمة على حبل؛ «tê hiştin» وُكل إليه ← تُترك فتسقط */
  { id: "hang2", src: "cine/amulet.png", x: 600, y: 560, w: 400, inAt: 46.5, inK: "swing", outAt: 48.2, outK: "fall" },
  /* «Xerezeyek şîn» خرزة زرقاء ← تقفز */
  { id: "beads", tag: 7, src: "cine/beads.png", x: 560, y: 1020, w: 420, inAt: 48.75, inK: "pop", rot: -4, outAt: 49.9, outK: "fall" },
  /* «Bila sûd bide» فلتنفعك ← الطلسم يسقط؛ «kaxez» هذه الورقة ← اقتراب؛ «Na» لا ← يُكرمش */
  { id: "paper", tag: 5, src: "cine/talisman.png", x: 520, y: 600, w: 480, inAt: 54.45, inK: "drop", rot: 3, outAt: 57.4, outK: "crumple" },
  /* «Kî girêdayî bibe» من تعلّق ← على حبل */
  { id: "hang3", src: "cine/amulet.png", x: 600, y: 560, w: 380, inAt: 58.65, inK: "swing", outAt: 60.35, outK: "up" },
  /* «rewayetekê … hedîsekê» رواية وحديث ← القارئ والمكتبة */
  { id: "reader", tag: 6, src: "cine/reader_back_soft.png", x: 560, y: 520, w: 440, inAt: 60.5, inK: "slideR", rot: 3, outAt: 62.85, outK: "sweepR" },
  { id: "lib", src: "cine/library.png", x: 70, y: 1040, w: 440, inAt: 61.6, inK: "rise", rot: -3, outAt: 62.85, outK: "sweepL" },
  /* «tilsimekê … şirk kiriye» تميمة ← شرك: علامة كبيرة بوميض */
  { id: "a3", tag: 1, src: "cine/amulet.png", x: 80, y: 1000, w: 420, inAt: 63.45, inK: "drop", rot: -4, acts: [{ at: 65.75, k: "x" }], outAt: 66.4, outK: "fall" },
  { id: "b3", tag: 7, src: "cine/beads.png", x: 580, y: 1060, w: 400, inAt: 63.7, inK: "drop", rot: 5, acts: [{ at: 65.85, k: "x" }], outAt: 66.4, outK: "fall" },
  /* «Ji Xwedê … bitirse» اتّق الله ← المكتبة تصعد في ضوء */
  { id: "lib2", src: "cine/library.png", x: 560, y: 1040, w: 440, inAt: 71.9, inK: "rise", rot: 3, acts: [{ at: 72.3, k: "glow" }] },
];
/* صورة الشيخ: كاملة في المقدمة والمقطع المحروق، وبطاقة تتنقل بين الأركان بحسب مكان الأشياء */
const VKF: number[][] = [
  [0, 0, 0, 1080, 1920], [4.45, 0, 0, 1080, 1920], [4.95, 60, 140, 420, 747], [20.1, 60, 140, 420, 747],
  [20.45, 620, 1060, 400, 711], [26.6, 620, 1060, 400, 711], [26.95, 60, 140, 420, 747], [31.15, 60, 140, 420, 747],
  [31.5, 600, 110, 420, 747], [44.6, 600, 110, 420, 747], [44.95, 60, 120, 420, 747], [49.95, 60, 120, 420, 747],
  [50.3, 0, 0, 1080, 1920], [53.85, 0, 0, 1080, 1920], [54.3, 60, 140, 420, 747], [62.8, 60, 140, 420, 747],
  [63.15, 330, 110, 420, 747], [71.5, 330, 110, 420, 747], [72.4, 240, 120, 600, 1067], [74.4, 240, 120, 600, 1067],
];
const S = (s: number) => Math.round(s * 30);
const SFX: Cue[] = [[S(1.3), "swish", 0.6], [S(3.35), "typing", 0.8], [S(20.0), "swipe"], [S(31.1), "swipe"], [S(44.5), "swipe"], [S(60.2), "swipe"], [S(31.6), "tap", 0.6], [S(4.45), "swish"], [S(6.5), "fast"], [S(7.2), "swipe"], [S(9.35), "shimmer"], [S(10.35), "popin"], [S(16.2), "swish", 0.8], [S(20.2), "whoosh_big"],
  [S(23.45), "thud"], [S(25.15), "shimmer", 0.5], [S(26.9), "swipe"], [S(30.75), "hit"], [S(32.7), "tap"], [S(36.1), "fast"], [S(42.0), "blast"], [S(46.5), "swish", 0.8], [S(48.2), "thud"],
  [S(54.45), "thud"], [S(57.4), "tear"], [S(60.5), "swipe"], [S(63.6), "subdrop"], [S(65.75), "hit"], [S(67.0), "popdeep", 0.7], [S(71.0), "fast"], [S(72.3), "sting"]];

/* ───────── الكاميرا: تقترب إلى الشيء المهم ثم تعود ───────── */
const CAM = [
  { a: 9.3, b: 9.95, cx: 650, cy: 1380, z: 1.25 },   // «vedike» الباب
  { a: 23.6, b: 24.2, cx: 350, cy: 470, z: 1.2 },   // «xelekek» الأسوار
  { a: 56.55, b: 57.45, cx: 760, cy: 950, z: 1.28 }, // «kaxez» الورقة
];
const camAt = (t: number) => {
  for (const c of CAM) if (t > c.a - 0.01 && t < c.b + 0.4) {
    const k = easeInOut((t - c.a) / 0.5) * (1 - easeInOut((t - c.b) / 0.4)), z = 1 + (c.z - 1) * k;
    const Cx = lerp(c.cx, W / 2, 0.5 * k), Cy = lerp(c.cy, H / 2, 0.5 * k);
    return { z, ox: Cx - c.cx * z, oy: Cy - c.cy * z };
  }
  return { z: 1, ox: 0, oy: 0 };
};
/* ───────── انتقال ورق في بداية الفصل: صفحة بحافة ممزقة تعبر الشاشة وتخفي التبديل تحتها ───────── */
const WIPES: { t: number; k: "up" | "left" }[] = [{ t: 20.16, k: "up" }, { t: 31.24, k: "left" }, { t: 44.67, k: "up" }, { t: 60.37, k: "left" }];
const Wipe: React.FC<{ t: number }> = ({ t }) => <>{WIPES.map((wp, i) => { const p = (t - (wp.t - 0.28)) / 0.56; if (p <= 0 || p >= 1) return null; const e = easeInOut(p) * 2;
  const r = mulberry32(i * 31 + 5), edge = Array.from({ length: 24 }, (_, j) => (r() - 0.5) * 50);
  if (wp.k === "up") { const top = H - e * H; return <div key={i} style={{ position: "absolute", left: -20, top, width: W + 40, height: H + 60, background: C.note, boxShadow: "0 -24px 40px rgba(0,0,0,.35)", clipPath: `polygon(${edge.map((v, j) => `${(j / 23) * 100}% ${30 + v}px`).join(",")},100% 100%,0% 100%)` }} />; }
  const left = W - e * W; return <div key={i} style={{ position: "absolute", top: -20, left, height: H + 40, width: W + 60, background: C.note, boxShadow: "-24px 0 40px rgba(0,0,0,.35)", clipPath: `polygon(${edge.map((v, j) => `${30 + v}px ${(j / 23) * 100}%`).join(",")},100% 100%,100% 0%)` }} />; })}</>;
/* ───────── خيوط من الشاهد (دبوس صورة الشيخ) إلى الدليل عند «قال» ───────── */
const THREADS = [
  { at: 31.6, until: 44.55, a: [810, 116], b: [340, 990] },
  { at: 45.0, until: 46.3, a: [270, 126], b: [800, 960] },
  { at: 58.8, until: 60.3, a: [270, 146], b: [790, 560] },
];
const Thread: React.FC<{ t: number }> = ({ t }) => <>{THREADS.map((th, i) => { if (t < th.at || t > th.until) return null; const k = easeInOut((t - th.at) / 0.45);
  const [ax, ay] = th.a, [bx, by] = th.b, mx = (ax + bx) / 2, my = Math.max(ay, by) - 80;
  return <svg key={i} width={W} height={H} style={{ position: "absolute", inset: 0 }}><path d={`M${ax} ${ay} Q${mx} ${my} ${bx} ${by}`} stroke={C.red} strokeWidth={5} fill="none" pathLength={1} strokeDasharray={`${k} 1`} />{k > 0.98 && <circle cx={bx} cy={by} r={15} fill="#7a2a22" />}</svg>; })}</>;
/* ───────── الافتتاح: عقدة تُحلّ عند «sêhrê vedike»، وتقويم تتطاير أوراقه عند «zû û bi lez» ───────── */
const Opening: React.FC<{ t: number }> = ({ t }) => {
  if (t > 4.6) return null;
  const un = easeInOut((t - 1.3) / 0.6), gone = easeInOut((t - 2.2) / 0.5), rin = easeOut(t / 0.5);
  const loop = 70 * (1 - un), yR = 1610;
  const path = `M -40 ${yR} C 260 ${yR - 20}, 420 ${yR + 10}, ${540 - loop} ${yR} C ${540 - loop} ${yR - 1.6 * loop}, ${540 + loop} ${yR - 1.6 * loop}, ${540 + loop} ${yR} C ${540 + 30 * un} ${yR + 40 * (1 - un)}, ${540 - 30 * un} ${yR + 40 * (1 - un)}, 560 ${yR + 6} C 700 ${yR - 10}, 900 ${yR + 20}, 1120 ${yR}`;
  const pages = 9, flipA = 3.35, flipB = 4.35;
  return <>
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, transform: `translateX(${(1 - rin) * -1200 + gone * 1300}px)` }}>
      <path d={path} stroke="#7a3a1c" strokeWidth={22} fill="none" strokeLinecap="round" />
      <path d={path} stroke="#c98a4a" strokeWidth={8} fill="none" strokeLinecap="round" strokeDasharray="14 18" />
    </svg>
    {t > 2.9 && (() => { const ci = easeOut((t - 2.9) / 0.35); return <div style={{ position: "absolute", left: 800, top: 1180, width: 230, height: 250, transform: `translateX(${(1 - ci) * 500}px) rotate(5deg)`, perspective: 900 }}>
      <div style={{ position: "absolute", inset: 0, background: "#f4ecdb", boxShadow: "6px 10px 16px rgba(0,0,0,.35)" }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 230, height: 54, background: C.red }} />
      {Array.from({ length: pages }, (_, i) => { const pa = flipA + ((flipB - flipA) * i) / pages, u = (t - pa) / 0.22, z = pages - i;
        if (u > 1.2) return null; const k = clamp01(u);
        return <div key={i} style={{ position: "absolute", left: 0, top: 54, width: 230, height: 196, background: i % 2 ? "#fbf6ea" : "#f4ecdb", zIndex: z, transformOrigin: "50% 0%", transform: `rotateX(${k * 160}deg) translateY(${-k * 60}px)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: ff("rakkas"), fontSize: 110, color: C.ink }}>{(i + 3).toLocaleString("ar-EG")}</div>; })}
    </div>; })()}
  </>;
};

export const DubKmrSync: React.FC = () => {
  useFonts(["ruqaa"]);
  const f = useCurrentFrame(), t = f / 30;
  const full = t < 4.45 || (t >= 49.95 && t < 54.3);
  const [x0, y0, w0, h0] = frameBox(t, VKF);
  const cm = full ? { z: 1, ox: 0, oy: 0 } : camAt(t);
  /* اقتراب الكاميرا لا يُخرج صورته من الإطار ولا يقصّ وجهه: البطاقة تُحبس داخل الشاشة */
  const w = w0 * cm.z, h = h0 * cm.z;
  const x = Math.min(Math.max(x0 * cm.z + cm.ox, 30), W - 30 - w), y = Math.min(Math.max(y0 * cm.z + cm.oy, 30), H - 30 - h);
  /* ارتجاف التحذير «ya herî xeternak e» (الأخطر) */
  const dx = Math.sin(t * 0.55) * 26, dy = Math.cos(t * 0.43) * 18;
  const sh0 = t > 63.5 && t < 64.0 ? Math.sin(t * 120) * (64.0 - t) * 40 : 0;
  const sh = sh0 + (full ? 0 : dx);
  const warn = t > 63.5 && t < 65.6 ? Math.sin(Math.PI * clamp01((t - 63.5) / 2.1)) : 0;
  const rays = t > 12.55 && t < 14.3 ? Math.sin(Math.PI * clamp01((t - 12.55) / 1.75)) : 0;
  return (
    <HybridHost>
      <HybridBg>
        <CrumplePaper color={C.board} id="dks-bg" seed={8} />
        <Clutter seed={1} />
        <AbsoluteFill style={{ boxShadow: "inset 0 0 240px rgba(80,55,25,.45)" }} />
      </HybridBg>
      <Audio src={staticFile("dubkmr/dub_kmr.wav")} />
      {!full && <div style={{ position: "absolute", left: x - 14 + sh, top: y - 14 + (full ? 0 : dy), width: w + 28, height: h + 28, boxSizing: "border-box", border: `14px solid ${C.edge}`, boxShadow: "8px 14px 24px rgba(0,0,0,.3)" }} />}
      <VSlot src="dubkmr/src.mp4" w={w} h={h} radius={0} vx={0} vy={0} vw={w} vh={h} style={{ left: x + sh, top: y + (full ? 0 : dy) }} grow={0} />
      {!full && <Pin x={x + w / 2 + sh} y={y + 6 + dy} at={4.9} />}
      {!full && <AbsoluteFill style={{ transform: `translate(${sh + cm.ox}px, ${sh0 * 0.4 + dy + cm.oy}px) scale(${cm.z})`, transformOrigin: "0 0" }}>
        {/* «tenê yê Xwedê» لله وحده ← تُكنس الأشياء ويهبط ضوء من أعلى (بلا صورة) */}
        {rays > 0 && <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 55% at 60% 0%, rgba(255,240,200,${0.55 * rays}), transparent 70%)` }} />}
        {rays > 0 && <AbsoluteFill style={{ mixBlendMode: "screen", background: `conic-gradient(from 150deg at 62% -12%, transparent 0deg, rgba(255,214,130,${0.75 * rays}) 6deg, transparent 13deg, rgba(255,214,130,${0.6 * rays}) 20deg, transparent 26deg, rgba(255,214,130,${0.8 * rays}) 34deg, transparent 42deg, rgba(255,214,130,${0.55 * rays}) 50deg, transparent 58deg)`, transform: `rotate(${(t - 12.55) * 3}deg)`, transformOrigin: "62% -12%" }} />}
        {rays > 0 && Array.from({ length: 26 }, (_, j) => { const rr = mulberry32(j * 5 + 9); return <div key={"d" + j} style={{ position: "absolute", left: 300 + rr() * 700, top: 200 + rr() * 1400 + (t - 12.55) * (20 + rr() * 40), width: 5, height: 5, borderRadius: 3, background: "#fff6d8", opacity: rays * (0.4 + 0.6 * rr()), boxShadow: "0 0 8px #ffe9a8" }} />; })}
        <Rain at={27.0} out={31.2} t={t} srcs={["cine/beads.png", "cine/amulet.png", "cine/talisman.png"]} seed={4} />
        <Rain at={67.0} out={71.0} t={t} srcs={["cine/talisman.png", "cine/beads.png", "cine/amulet.png"]} seed={7} />
        {ITEMS.map((it) => <Thing key={it.id} it={it} t={t} />)}
        <Thread t={t} />
        {warn > 0 && <AbsoluteFill style={{ boxShadow: `inset 0 0 ${260 * warn}px rgba(170,30,20,${0.6 * warn})` }} />}
        {t > 72.6 && <div style={{ position: "absolute", width: W, top: 1730, textAlign: "center", fontFamily: ff("ruqaa"), fontWeight: 700, fontSize: 66, color: C.ink, transform: `scale(${0.6 + 0.4 * easeOut((t - 72.6) / 0.4)})`, direction: "rtl" }}>محمد بن شمس الدين</div>}
      </AbsoluteFill>}
      {t < 4.6 && <Opening t={t} />}
      <Wipe t={t} />
      <SfxTrack cues={SFX} />
    </HybridHost>
  );
};
export const DUBKMR_SYNC_FRAMES = DUBKMR_FRAMES;
