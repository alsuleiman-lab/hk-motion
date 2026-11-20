import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { HybridHost, HybridBg, VSlot } from "./hybrid/Slot";
import { frameBox } from "./ext/ActiveSpeaker";
import { C, Clutter, Hero, Pin, Str } from "./ext/BoardKit";
import { CrumplePaper, poly, tornLine } from "./ext/PaperSteps";
import { ff, useFonts } from "./ext/fonts";
import { clamp01, easeInOut, easeOut } from "./ext/motion";
import { mulberry32 } from "./ext/rand";
import { Cue, SfxTrack } from "./ext/sfx";
import { DUBKMR_FRAMES } from "./DubKmr";

/**
 * الدبلجة الكرمنجية بقالب «لوحة التحقيق» (المرحلة ٩ من خطة التدرّب، 2026-11-20؛ المرجع الثاني §٣٢ والقالب §٣٥):
 * لكل فكرة لوحة ورقية فيها بطل مقصوص (صورة مولّدة بلا وجوه، أو صورة الشيخ الحيّة) ودبابيس وخيوط، وعلامة ✗ حمراء تُرسم على ما يُنكَر.
 * بلا كتابة كلام (اختيار المستخدم لهذا الفيديو)، والانتقال من عائلة الورق (تمزيق، كرمشة، بطاقة تصعد) لا يتكرر نوع مرتين متتاليتين.
 * الصوت: الدبلجة المضبوطة (public/dubkmr/dub_kmr.wav) ومؤثرات الورق الهادئة. المقطع المحروق في الأصل (٥٠٫٣–٥٣٫٨٥ ث) يُعرض كاملاً.
 */
const W = 1080, H = 1920;
type El = { k: "hero"; src: string; x: number; y: number; w: number; at: number; rot?: number } | { k: "pin"; x: number; y: number; at: number } | { k: "str"; a: [number, number]; b: [number, number]; at: number } | { k: "x"; x: number; y: number; s: number; at: number };
type Board = { a: number; b: number; trans: "tear" | "crumple" | "rise" | "none"; els: El[] };

const XMark: React.FC<{ x: number; y: number; s: number; at: number }> = ({ x, y, s, at }) => {
  const u = useCurrentFrame() / 30 - at;
  if (u < 0) return null;
  const k1 = easeOut(u / 0.18), k2 = easeOut((u - 0.15) / 0.18);
  return <svg width={s} height={s} viewBox="0 0 100 100" style={{ position: "absolute", left: x - s / 2, top: y - s / 2, overflow: "visible", filter: "drop-shadow(0 4px 4px rgba(0,0,0,.3))" }}>
    <path d="M12 12 L88 88" stroke={C.red} strokeWidth={11} strokeLinecap="round" pathLength={1} strokeDasharray={`${k1} 1`} fill="none" />
    <path d="M88 12 L12 88" stroke={C.red} strokeWidth={11} strokeLinecap="round" pathLength={1} strokeDasharray={`${Math.max(0, k2)} 1`} fill="none" /></svg>;
};
const Els: React.FC<{ els: El[] }> = ({ els }) => <>{els.map((e, i) => e.k === "hero" ? <Hero key={i} src={e.src} x={e.x} y={e.y} w={e.w} at={e.at} rot={e.rot} /> : e.k === "pin" ? <Pin key={i} x={e.x} y={e.y} at={e.at} /> : e.k === "str" ? <Str key={i} a={e.a} b={e.b} at={e.at} /> : <XMark key={i} x={e.x} y={e.y} s={e.s} at={e.at} />)}</>;

/* اللوحات بأزمنة الجمل (مشاهد DubKmr SC) */
const B: Board[] = [
  { a: 4.45, b: 9.95, trans: "none", els: [
    { k: "hero", src: "cine/amulet.png", x: 560, y: 260, w: 460, at: 4.9, rot: 3 }, { k: "pin", x: 790, y: 270, at: 5.2 },
    { k: "hero", src: "cine/door_light.png", x: 520, y: 1080, w: 480, at: 7.2, rot: -3 }, { k: "pin", x: 760, y: 1090, at: 7.5 }, { k: "str", a: [790, 270], b: [760, 1090], at: 7.7 } ] },
  { a: 9.95, b: 14.26, trans: "tear", els: [
    { k: "hero", src: "cine/medicine.png", x: 80, y: 1120, w: 520, at: 10.2, rot: -4 }, { k: "pin", x: 340, y: 1130, at: 10.5 },
    { k: "pin", x: 760, y: 1110, at: 12.5 }, { k: "str", a: [340, 1130], b: [760, 1110], at: 12.6 } ] },
  { a: 14.26, b: 20.16, trans: "crumple", els: [
    { k: "hero", src: "cine/talisman.png", x: 80, y: 260, w: 430, at: 14.5, rot: -5 }, { k: "pin", x: 295, y: 270, at: 14.8 },
    { k: "hero", src: "cine/book_stack.png", x: 120, y: 1200, w: 360, at: 17.0, rot: 4 }, { k: "pin", x: 300, y: 1210, at: 17.3 }, { k: "str", a: [295, 270], b: [300, 1210], at: 17.5 } ] },
  { a: 20.16, b: 28.48, trans: "rise", els: [
    { k: "hero", src: "cine/ring_hand.png", x: 150, y: 250, w: 780, at: 20.4, rot: 2 }, { k: "pin", x: 540, y: 260, at: 20.7 },
    { k: "hero", src: "cine/beads.png", x: 300, y: 1330, w: 480, at: 24.4, rot: -3 }, { k: "pin", x: 540, y: 1340, at: 24.7 }, { k: "str", a: [540, 260], b: [540, 1340], at: 24.9 } ] },
  { a: 28.48, b: 35.51, trans: "tear", els: [
    { k: "hero", src: "cine/ring_hand.png", x: 60, y: 1230, w: 380, at: 28.7, rot: -6 }, { k: "pin", x: 250, y: 1240, at: 29.0 },
    { k: "x", x: 250, y: 1450, s: 300, at: 33.2 } ] },
  { a: 35.51, b: 44.67, trans: "crumple", els: [
    { k: "hero", src: "cine/amulet.png", x: 150, y: 260, w: 780, at: 35.7, rot: -2 }, { k: "pin", x: 540, y: 270, at: 36.0 },
    { k: "hero", src: "cine/medicine.png", x: 640, y: 1290, w: 360, at: 36.8, rot: 6 }, { k: "pin", x: 820, y: 1300, at: 37.1 }, { k: "str", a: [540, 270], b: [820, 1300], at: 37.3 },
    { k: "x", x: 540, y: 820, s: 520, at: 40.2 },
    { k: "hero", src: "cine/ring_hand.png", x: 70, y: 1300, w: 360, at: 42.0, rot: -6 }, { k: "pin", x: 250, y: 1310, at: 42.3 }, { k: "x", x: 250, y: 1500, s: 240, at: 43.4 }, { k: "str", a: [820, 1300], b: [250, 1310], at: 44.0 } ] },
  { a: 44.67, b: 49.95, trans: "rise", els: [
    { k: "hero", src: "cine/talisman.png", x: 640, y: 1240, w: 360, at: 45.0, rot: 5 }, { k: "pin", x: 820, y: 1250, at: 45.3 }, { k: "str", a: [540, 1180], b: [820, 1250], at: 45.6 },
    { k: "hero", src: "cine/amulet.png", x: 70, y: 1280, w: 340, at: 46.8, rot: -5 }, { k: "pin", x: 240, y: 1290, at: 47.1 }, { k: "str", a: [540, 1180], b: [240, 1290], at: 47.3 } ] },
  { a: 54.3, b: 60.37, trans: "none", els: [
    { k: "hero", src: "cine/talisman.png", x: 150, y: 260, w: 780, at: 54.5, rot: 2 }, { k: "pin", x: 540, y: 270, at: 54.8 },
    { k: "x", x: 540, y: 760, s: 520, at: 56.9 },
    { k: "hero", src: "cine/pen_notebook.png", x: 60, y: 1280, w: 400, at: 55.9, rot: -5 }, { k: "pin", x: 260, y: 1290, at: 56.2 },
    { k: "hero", src: "cine/beads.png", x: 600, y: 1300, w: 400, at: 58.4, rot: 5 }, { k: "pin", x: 800, y: 1310, at: 58.7 }, { k: "x", x: 800, y: 1500, s: 260, at: 59.4 } ] },
  { a: 60.37, b: 66.42, trans: "crumple", els: [
    { k: "hero", src: "cine/beads.png", x: 80, y: 1200, w: 420, at: 60.6, rot: -4 }, { k: "hero", src: "cine/amulet.png", x: 580, y: 1260, w: 400, at: 61.0, rot: 5 },
    { k: "x", x: 290, y: 1420, s: 260, at: 63.0 }, { k: "x", x: 780, y: 1480, s: 260, at: 63.3 } ] },
  { a: 66.42, b: 74.4, trans: "tear", els: [
    { k: "hero", src: "cine/reader_back_soft.png", x: 80, y: 1180, w: 420, at: 66.7, rot: -4 }, { k: "pin", x: 290, y: 1190, at: 67.0 },
    { k: "hero", src: "cine/library.png", x: 600, y: 1240, w: 400, at: 67.6, rot: 5 }, { k: "pin", x: 800, y: 1250, at: 67.9 }, { k: "str", a: [290, 1190], b: [800, 1250], at: 68.1 } ] },
];
/* مسار صورة الشيخ: كاملة في المقدمة، ثم صورة مثبتة يتبدّل مكانها مع اللوحات، ثم كاملة في المقطع المحروق، ثم يعود */
const VKF: number[][] = [
  [0, 0, 0, 1080, 1920], [4.45, 0, 0, 1080, 1920], [4.95, 80, 300, 430, 764], [9.9, 70, 290, 450, 800],
  [10.0, 560, 230, 450, 800], [14.2, 540, 210, 480, 853], [14.3, 560, 330, 440, 782], [20.1, 540, 310, 470, 836],
  [20.2, 1200, 300, 440, 782], [28.4, 1200, 300, 440, 782], [28.5, 330, 230, 640, 1138], [35.4, 310, 210, 680, 1209],
  [35.5, 1200, 300, 440, 782], [44.6, 1200, 300, 440, 782], [44.7, 270, 220, 540, 960], [49.95, 260, 210, 560, 996],
  [50.3, 0, 0, 1080, 1920], [53.85, 0, 0, 1080, 1920], [54.3, 1200, 300, 440, 782], [60.3, 1200, 300, 440, 782],
  [60.4, 270, 180, 540, 960], [66.35, 260, 170, 560, 996], [66.45, 290, 200, 500, 889], [74.4, 270, 180, 540, 960],
];
const S = (s: number) => Math.round(s * 30);
const SFX: Cue[] = [[S(4.45), "swish"], [S(9.95), "tear"], [S(14.26), "swipe"], [S(20.16), "whoosh_big"], [S(28.48), "tear"], [S(33.2), "thud"], [S(35.51), "swipe"], [S(40.2), "thud"], [S(44.67), "whoosh_big"], [S(56.9), "thud"], [S(60.37), "swipe"], [S(66.42), "tear"], [S(73.6), "sting"]];

export const DubKmrBoard2: React.FC = () => {
  useFonts(["ruqaa"]);
  const f = useCurrentFrame(), t = f / 30;
  const full = t < 4.45 || (t >= 50.3 && t < 53.85);
  const [x, y, w, h] = frameBox(t, VKF);
  const bi = B.findIndex((b) => t >= b.a && t < b.b), cur = bi >= 0 ? B[bi] : null, prev = bi > 0 && B[bi - 1].b === cur?.a ? B[bi - 1] : null;
  const u = cur ? t - cur.a : 0;
  const rnd = mulberry32(9);
  const holePts = Array.from({ length: 28 }, (_, i) => { const a = (i / 28) * Math.PI * 2; return [Math.cos(a), Math.sin(a), 0.75 + rnd() * 0.5] as const; });
  const inBoard = !!cur && !full;
  return (
    <HybridHost>
      <HybridBg>
        <CrumplePaper color={C.board} id="dkb-bg" seed={8} />
        <Clutter seed={1} />
        <AbsoluteFill style={{ boxShadow: "inset 0 0 240px rgba(80,55,25,.45)" }} />
      </HybridBg>
      <Audio src={staticFile("dubkmr/dub_kmr.wav")} />
      {!full && x > -300 && x < 1080 && <div style={{ position: "absolute", left: x - 14, top: y - 14, width: w + 28, height: h + 28, boxSizing: "border-box", border: `14px solid ${C.edge}`, boxShadow: "8px 14px 24px rgba(0,0,0,.3)" }} />}
      <VSlot src="dubkmr/src.mp4" w={w} h={h} radius={0} vx={0} vy={0} vw={w} vh={h} style={{ left: x, top: y }} grow={0} />
      {!full && x > -300 && x < 1080 && <Pin x={x + w / 2} y={y + 6} at={Math.max(4.6, cur ? cur.a + 0.15 : 4.6)} />}
      {inBoard && <AbsoluteFill style={{ transform: `scale(${1 + 0.035 * Math.min(u, 6)}) translate(${Math.sin(u * 0.9) * 22}px, ${Math.cos(u * 0.7) * 14}px)` }}><Els els={cur!.els} /></AbsoluteFill>}
      {/* انتقالات الورق */}
      {inBoard && prev && cur!.trans === "tear" && u < 0.35 && (() => { const r = easeInOut(u / 0.35) * 1500; const hole = holePts.map(([cx, cy, j]) => `${(W / 2 + cx * r * j).toFixed(0)} ${(H / 2 + cy * r * j * 1.4).toFixed(0)}`).join(" L");
        return <AbsoluteFill style={{ clipPath: `path(evenodd, "M0 0 H${W} V${H} H0 Z M${hole} Z")` }}><CrumplePaper color={C.board} id="dkb-tear" seed={8} /><Els els={prev.els} /></AbsoluteFill>; })()}
      {inBoard && prev && cur!.trans === "crumple" && u < 0.4 && (() => { const k = easeInOut(u / 0.4);
        return <AbsoluteFill style={{ transform: `scale(${1 - 0.85 * k}) rotate(${k * 40}deg)`, borderRadius: k * 300, overflow: "hidden", boxShadow: "0 30px 60px rgba(0,0,0,.4)" }}><CrumplePaper color={C.board} id="dkb-cr" seed={Math.floor(f / 2)} /><Els els={prev.els} /></AbsoluteFill>; })()}
      {inBoard && cur!.trans === "rise" && u < 0.45 && (() => { const k = easeOut(u / 0.45); return <div style={{ position: "absolute", left: 0, top: (1 - k) * H, width: W, height: H * (1 - k) + 40, background: C.note, clipPath: `polygon(${poly(tornLine(0, 20, W, 0, 77, 30, 26))},${W}px ${H}px,0px ${H}px)`, boxShadow: "0 -20px 40px rgba(0,0,0,.3)" }} />; })()}
      {!full && t > 72.4 && (() => { const k = clamp01((t - 72.4) / 0.4); return <div style={{ position: "absolute", width: W, top: 1720, textAlign: "center", fontFamily: ff("ruqaa"), fontWeight: 700, fontSize: 64, color: C.ink, transform: `scale(${0.6 + 0.4 * k})`, opacity: k, direction: "rtl" }}>محمد بن شمس الدين</div>; })()}
      <SfxTrack cues={SFX} />
    </HybridHost>
  );
};
export const DUBKMR_BOARD2_FRAMES = DUBKMR_FRAMES;
