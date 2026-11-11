import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadAref } from "@remotion/google-fonts/ArefRuqaa";
import { kufiF, zainF } from "./MG";
import { tornClip } from "./PaperKit";

/** عُدّة «الفاصل الورقي»: ورق حقيقي الملمس (صور نسيج مولّدة محلياً)، حواف ممزقة بحافة ألياف بيضاء، أشرطة لاصقة ودبابيس، ظلال طبقية، دخول بإيقاف الحركة وتجاوز بسيط واهتزاز ثابت البذرة. */
export const FPS = 30, W = 1920, H = 1080;
export const INK = "#2a2118", CREAM = "#f1e7d0", WHITE = "#fbf7ee", MAROON = "#7a1f2b", BLUE = "#2f6aa3";
export const arefF = loadAref("normal", { weights: ["700"], subsets: ["arabic"] }).fontFamily;
export { kufiF, zainF };
export const fa = (p: string) => staticFile(`fasel/${p}`);
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const backOut = (u: number) => { const c1 = 1.9, c3 = c1 + 1, x = clamp(u) - 1; return 1 + c3 * x * x * x + c1 * x * x; };

/** إطار «على اثنتين» (أو ثلاث): الوضعية تتغير كل n إطار */
export const usePose = (n = 2) => Math.floor(useCurrentFrame() / n) * n;

/** اهتزاز الاستقرار: معتدل جداً (بطلب المستخدم 2026-11-11: «الاهتزاز شديد») */
export const JIT_PX = 0.45, JIT_DEG = 0.08;
type From = "left" | "right" | "top" | "bottom" | "none";
/** دخول قطعة: يطير من الحافة بتجاوز ≈8% ثم يستقر ويبقى اهتزازه الصغير ثابت البذرة؛ null قبل at */
export const useEnter = (at: number, seed: string, from: From = "right", rot = 0, dur = 0.42, step = 2) => {
  const fr = useCurrentFrame(), pose = Math.floor(fr / step) * step, t = pose / FPS;
  if (t < at) return null;
  const u = clamp((t - at) / dur), e = backOut(u), flight = 1 - e;
  const d = 950 * flight, sx = from === "left" ? -1 : from === "right" ? 1 : 0, sy = from === "top" ? -1 : from === "bottom" ? 1 : 0;
  const scale = from === "none" ? 0.55 + 0.45 * e : 1;
  const landed = u >= 1, k = Math.floor(pose / step);
  const kk = Math.floor(k / 2), jx = landed ? (random(seed + "x" + kk) - 0.5) * 2 * JIT_PX : 0, jy = landed ? (random(seed + "y" + kk) - 0.5) * 2 * JIT_PX : 0, jr = landed ? (random(seed + "r" + kk) - 0.5) * 2 * JIT_DEG : 0;
  const spin = from === "none" ? 0 : (1 - e) * 7 * (random(seed + "s") > 0.5 ? 1 : -1);
  return { transform: `translate(${sx * d + jx}px, ${sy * d + jy}px) rotate(${rot + spin + jr}deg) scale(${scale})`, lift: clamp(flight * 1.6) };
};

export const Tape: React.FC<{ x: number; y: number; w?: number; rot?: number; tone?: string }> = ({ x, y, w = 120, rot = -8, tone = "rgba(222,208,168,.72)" }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: 38, transform: `rotate(${rot}deg)`, background: `linear-gradient(180deg, rgba(255,255,255,.35), ${tone} 40%, ${tone})`, boxShadow: "0 2px 4px rgba(40,28,12,.25)", clipPath: "polygon(0 12%,4% 0,8% 14%,12% 0,88% 0,92% 14%,96% 0,100% 12%,100% 88%,96% 100%,92% 86%,88% 100%,12% 100%,8% 86%,4% 100%,0 88%)" }} />
);

export const Pin: React.FC<{ x: number; y: number; color?: string }> = ({ x, y, color = MAROON }) => (
  <div style={{ position: "absolute", left: x - 17, top: y - 17, width: 34, height: 34 }}>
    <div style={{ position: "absolute", left: 6, top: 14, width: 30, height: 30, borderRadius: 15, background: "rgba(20,12,4,.35)", filter: "blur(4px)" }} />
    <div style={{ position: "absolute", inset: 0, borderRadius: 17, background: `radial-gradient(circle at 35% 30%, #fff9 0 12%, ${color} 40%, #3a0a12 100%)` }} />
  </div>
);

/** ورقة بحافة ممزقة وحافة ألياف بيضاء وظل طبقي؛ الأبناء داخل الورقة */
export const Torn: React.FC<{
  x: number; y: number; w: number; h: number; at: number; rot?: number; from?: From; seed: string; paper?: string; rim?: number; amp?: number; pad?: number;
  tapes?: { x: number; y: number; w?: number; rot?: number; tone?: string }[]; pins?: { x: number; y: number }[]; z?: number; style?: React.CSSProperties; children?: React.ReactNode;
}> = ({ x, y, w, h, at, rot = 0, from = "right", seed, paper = WHITE, rim = 9, amp = 7, tapes, pins, z, style, children }) => {
  const e = useEnter(at, seed, from, rot);
  if (!e) return null;
  const sh = 6 + 18 * e.lift;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, zIndex: z, transform: e.transform, filter: `drop-shadow(0 ${sh}px ${sh + 6}px rgba(34,22,8,.34)) drop-shadow(0 1px 2px rgba(34,22,8,.4))`, ...style }}>
      <div style={{ position: "absolute", left: -rim, top: -rim, width: w + 2 * rim, height: h + 2 * rim, background: "#fffdf6", clipPath: tornClip(w + 2 * rim, h + 2 * rim, seed + "rim", amp * 1.5, 11) }} />
      <div style={{ position: "absolute", inset: 0, background: paper, clipPath: tornClip(w, h, seed, amp, 15), overflow: "hidden" }}>
        {children}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,255,255,.18), rgba(120,90,40,.10))", pointerEvents: "none" }} />
      </div>
      {tapes?.map((t, i) => <Tape key={i} {...t} />)}
      {pins?.map((p, i) => <Pin key={i} {...p} />)}
    </div>
  );
};

/** رقعة نقاط نصفية ملوّنة خلف قطعة (كظلّ طباعة) */
export const DotPatch: React.FC<{ x: number; y: number; w: number; h: number; at: number; color?: string; seed: string; rot?: number; dot?: number }> = ({ x, y, w, h, at, color = BLUE, seed, rot = 0, dot = 9 }) => {
  const e = useEnter(at, seed, "none", rot, 0.3);
  if (!e) return null;
  return <div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: e.transform, background: `radial-gradient(circle, ${color} 34%, transparent 38%)`, backgroundSize: `${dot}px ${dot}px`, clipPath: tornClip(w, h, seed, 14, 20), opacity: 0.85 }} />;
};

/** نسيج الورق الخلفي من صورة مولّدة + إضاءة خفيفة */
export const PaperBg: React.FC<{ tex: string; tint?: string; vignette?: number }> = ({ tex, tint, vignette = 0.14 }) => {
  const { width, height } = useVideoConfig();
  return (
  <AbsoluteFill>
    <Img src={fa(`tex/${tex}`)} style={{ width, height, objectFit: "cover" }} />
    {tint ? <AbsoluteFill style={{ background: tint, mixBlendMode: "multiply" }} /> : null}
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, rgba(255,255,255,.12), rgba(40,26,10,${vignette}) 100%)` }} />
  </AbsoluteFill>
  );
};

/** مؤثرات صوتية: [الثانية، الاسم، الشدة] — أسماء من public/fasel/sfx */
export const Sfx: React.FC<{ cues: [number, string, number?][] }> = ({ cues }) => (
  <>
    {cues.map(([t, n, v], i) => (
      <Sequence key={i} from={Math.round(t * FPS)} durationInFrames={Math.round(FPS * 0.9)}><Audio src={fa(`sfx/${n}.wav`)} volume={v ?? 0.5} /></Sequence>
    ))}
  </>
);

/** نص على ورقة مع كلمة مظلَّلة بشريط عنابي اختيارية */
export const InkText: React.FC<{ text: string; size: number; color?: string; hl?: number; hlColor?: string; font?: string }> = ({ text, size, color = INK, hl, hlColor = MAROON, font = kufiF }) => (
  /* فجوة ثابتة بين الكلمات بـflex (لا هوامش متداخلة): كل كلمة كتلة مستقلة فلا تلتصق ببعضها */
  <span style={{ display: "inline-flex", flexDirection: "row", alignItems: "center", gap: Math.round(size * 0.5), fontFamily: font, fontWeight: 800, fontSize: size, color, direction: "rtl", lineHeight: 1.25, whiteSpace: "nowrap" }}>
    {text.split(" ").map((wd, i) => (
      <span key={i} style={i === hl ? { background: hlColor, color: "#fff", padding: `0 ${size * 0.24}px`, display: "inline-block", transform: `rotate(${(random("hr" + text + i) - 0.5) * 3}deg)`, boxShadow: "0 3px 5px rgba(30,16,8,.35)" } : { display: "inline-block" }}>{wd}</span>
    ))}
  </span>
);

/** ملصق نص ممزق جاهز */
export const Strip: React.FC<{ x: number; y: number; w: number; h: number; at: number; text: string; size: number; rot?: number; from?: From; paper?: string; color?: string; hl?: number; seed?: string; tape?: boolean; font?: string; z?: number }> = ({ x, y, w, h, at, text, size, rot = 0, from = "bottom", paper = WHITE, color = INK, hl, seed, tape = true, font, z }) => (
  <Torn x={x} y={y} w={w} h={h} at={at} rot={rot} from={from} seed={seed ?? "st" + text} paper={paper} z={z} tapes={tape ? [{ x: w / 2 - 55, y: -20, w: 110, rot: (random("t" + text) - 0.5) * 16 }] : undefined}>
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", direction: "rtl" }}><InkText text={text} size={size} color={color} hl={hl} font={font} /></div>
  </Torn>
);

export const Pic: React.FC<{ src: string; fit?: "cover" | "contain"; pos?: string; style?: React.CSSProperties }> = ({ src, fit = "cover", pos = "50% 50%", style }) => (
  <Img src={src} style={{ width: "100%", height: "100%", objectFit: fit, objectPosition: pos, ...style }} />
);

/** المحتوى المشترك */
export const BOOKS = ["8YkgwY", "9vPJQG", "FaA2ko", "HujFtC", "IGSbax", "KmVXab", "Q5jl8C", "TXfcjF", "UiPYz4", "hrF5KH", "VPISYL", "opL5NX", "xCHfGE", "Ve9jtJ", "6wyshs", "YkqnDW", "ZvfBVW", "ci0etS"];
export const book = (id: string) => fa(`books/${id}.jpg`);
export const CHANNELS = [
  { img: "ch_replies.jpg", label: "الردود العلمية" },
  { img: "ch_main.jpg", label: "محمد بن شمس الدين" },
  { img: "ch_lessons.jpg", label: "الدروس" },
  { img: "ch_school.jpg", label: "مدرسة شمس الدين" },
];
export const pose = (n: string) => staticFile(`cov/sheikh_poses/${n}.png`);
export const POSES = { smile: "08_sheikh_brown_hands_clasped_smile", explain: "06_sheikh_brown_hands_open_explain", exclaim: "10_sheikh_brown_hands_raised_exclaim", point: "03_sheikh_brown_gesture_point", calm: "07_sheikh_brown_hands_clasped", desk: "02_sheikh_brown_desk_neutral" };
