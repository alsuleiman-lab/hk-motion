import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { HybridHost, HybridBg, VSlot } from "../hybrid/Slot";
import { frameBox } from "./ActiveSpeaker";
import { back, CrumplePaper, poly, tornLine } from "./PaperSteps";
import { ff, useFonts } from "./fonts";
import { clamp01, easeInOut, easeOut, lerp } from "./motion";
import { mulberry32 } from "./rand";
import { Cue, SfxTrack } from "./sfx";

/**
 * قالب «لوحة التحقيق» (المرجع الثاني، دراسة §٣٢؛ المرحلة ٦، 2026-11-20):
 * لوحات ورقية، في كل لوحة بطل مقصوص بحدّ أزرق فاتح (صورة الشيخ الحيّة أو صورة مولّدة) وتسمية على شريط ممزق ودبابيس وخيوط،
 * وحركة معنى واحدة (ختم يضغط، خيوط تُرسم، ملاحظة تهبط من الكاميرا). الانتقال من عائلة الورق وحدها ولا يتكرر نوع مرتين متتاليتين:
 * تمزيق من الوسط، كرمشة، بطاقة ممزقة الحافة تصعد. الأرضية في طبقة الخلفية، وكل ما يغطي يكون ورقاً معتماً عمداً.
 */
const W = 1080, H = 1920;
export const C = { board: "#e3d5b8", note: "#efe1c2", ink: "#2c2418", red: "#a8322a", edge: "#9fd3e0", tape: "rgba(231,206,140,.85)" };
const S = (s: number) => Math.round(s * 30);
export const BOARD_FRAMES = S(18);

export const Pin: React.FC<{ x: number; y: number; at: number }> = ({ x, y, at }) => {
  const u = useCurrentFrame() / 30 - at;
  if (u < 0) return null;
  const k = easeOut(u / 0.22);
  return <div style={{ position: "absolute", left: x - 17, top: y - 17 - (1 - k) * 240, width: 34, height: 34, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #d0806a, #7a2a22)", boxShadow: `${(1 - k) * 26 + 3}px ${(1 - k) * 36 + 5}px ${(1 - k) * 12 + 4}px rgba(0,0,0,.35)`, transform: `scale(${1 + (1 - k) * 0.5})` }} />;
};
export const Str: React.FC<{ a: [number, number]; b: [number, number]; at: number }> = ({ a, b, at }) => {
  const k = easeInOut((useCurrentFrame() / 30 - at) / 0.45);
  if (k <= 0) return null;
  return <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}><path d={`M${a[0]} ${a[1]} Q${(a[0] + b[0]) / 2} ${(a[1] + b[1]) / 2 + 40} ${b[0]} ${b[1]}`} stroke={C.red} strokeWidth={5} fill="none" pathLength={1} strokeDasharray={`${k} 1`} /></svg>;
};
export const Label: React.FC<{ x: number; y: number; text: string; at: number; size?: number; rot?: number }> = ({ x, y, text, at, size = 70, rot = -3 }) => {
  const u = useCurrentFrame() / 30 - at;
  if (u < 0) return null;
  const k = back(u / 0.3, 1.8), w = text.length * size * 0.55 + 90;
  return <div style={{ position: "absolute", left: x - w / 2, top: y, width: w, height: size * 1.7, transform: `rotate(${rot}deg) scale(${Math.max(0, k)})`, filter: "drop-shadow(0 6px 6px rgba(0,0,0,.3))" }}>
    <div style={{ position: "absolute", inset: 0, background: "#f5efe2", clipPath: `polygon(${poly(tornLine(0, 4, w, 0, 41, 16, 6))},${poly(tornLine(w, size * 1.7, 0, size * 1.7 - 4, 42, 16, 6))})` }} />
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: ff("ruqaa"), fontWeight: 700, fontSize: size, color: C.ink, direction: "rtl" }}>{text}</div></div>;
};
/** بطل مقصوص: صورة بحدّ أزرق فاتح وظل، يدخل بهبوط من الكاميرا */
export const Hero: React.FC<{ src: string; x: number; y: number; w: number; at: number; rot?: number }> = ({ src, x, y, w, at, rot = -2 }) => {
  const u = useCurrentFrame() / 30 - at;
  if (u < 0) return null;
  const k = easeOut(u / 0.4);
  return <div style={{ position: "absolute", left: x, top: y, width: w, transform: `rotate(${rot}deg) scale(${lerp(1.35, 1, k) * (1 + 0.12 * clamp01(u / 4))})`, filter: `drop-shadow(${lerp(40, 8, k)}px ${lerp(60, 14, k)}px ${lerp(30, 8, k)}px rgba(0,0,0,.4))` }}>
    <div style={{ border: `12px solid ${C.edge}`, background: "#fff" }}><Img src={staticFile(src)} style={{ width: "100%", display: "block" }} /></div></div>;
};
/** ملاحظة تهبط من الكاميرا (تبدأ كبيرة بظل بعيد وتصغر حتى تلامس اللوحة) */
const Note: React.FC<{ at: number; lines: string[]; x: number; y: number; w: number; h: number }> = ({ at, lines, x, y, w, h }) => {
  const u = useCurrentFrame() / 30 - at;
  if (u < 0) return null;
  const k = easeOut(u / 0.5);
  return <div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: `scale(${lerp(1.7, 1, k) * (1 + 0.1 * clamp01(u / 4))}) rotate(${lerp(-8, -2, k)}deg)`, filter: `drop-shadow(${lerp(50, 6, k)}px ${lerp(80, 10, k)}px ${lerp(40, 8, k)}px rgba(0,0,0,.35))` }}>
    <div style={{ position: "absolute", inset: 0, background: C.note, clipPath: `polygon(${poly(tornLine(0, 0, w, 6, 51, 24, 10))},${poly(tornLine(w, h, 0, h - 4, 52, 24, 12))})` }} />
    <div style={{ position: "absolute", left: w * 0.1, top: h * 0.22, width: w * 0.8, height: h * 0.56, border: `7px solid ${C.red}`, borderRadius: 14, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: ff("rakkas"), color: C.ink, direction: "rtl" }}>
      {lines.map((l, i) => <div key={i} style={{ fontSize: i ? 110 : 84, lineHeight: 1.2, whiteSpace: "nowrap" }}>{l}</div>)}</div></div>;
};
/** ختم يهبط ويضغط فتهتز اللوحة ويبقى الحبر */
export const Stamp: React.FC<{ at: number; text: string; x: number; y: number }> = ({ at, text, x, y }) => {
  const u = useCurrentFrame() / 30 - at;
  if (u < -0.35) return null;
  const sy = u < 0 ? lerp(-500, 0, easeInOut((u + 0.35) / 0.35)) : u < 0.12 ? 0 : -easeOut((u - 0.12) / 0.3) * 700;
  return <>
    {u >= 0 && <div style={{ position: "absolute", left: x - 240, top: y, width: 480, height: 160, border: `12px solid ${C.red}`, borderRadius: 18, transform: "rotate(-8deg)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: ff("rakkas"), fontSize: 100, color: C.red, opacity: 0.88, direction: "rtl" }}>{text}</div>}
    {u < 0.45 && <div style={{ position: "absolute", left: x - 250, top: y - 120 + sy, width: 500, height: 280, transform: "rotate(-8deg)" }}>
      <div style={{ position: "absolute", left: 210, top: 0, width: 80, height: 120, borderRadius: "40px 40px 10px 10px", background: "#2a2320" }} />
      <div style={{ position: "absolute", left: 20, top: 110, width: 460, height: 150, borderRadius: 14, background: "linear-gradient(#a8573c,#7a3424)", boxShadow: "0 20px 30px rgba(0,0,0,.4)" }} /></div>}
  </>;
};
/** فوضى الأرشيف حول الأطراف: خطوط خريطة، قصاصات ورق ممزقة، صور قديمة بأشرطة، عمود صحيفة */
export const Clutter: React.FC<{ seed: number }> = ({ seed }) => {
  const r = mulberry32(seed * 97 + 3);
  const lf = useCurrentFrame() % 135; /* انجراف الكاميرا داخل كل لوحة (٤٫٥ ث) ويبدأ من جديد مع اللوحة التالية */
  const photos = ["cine/library.png", "cine/reader_back_soft.png", "cine/book_stack.png", "cine/pen_notebook.png", "cine/library.png"];
  const spots: [number, number][] = [[-60, 40], [820, 20], [-80, 1500], [860, 1560], [-40, 820], [900, 860], [380, 1780], [430, -60]];
  return (
    <AbsoluteFill style={{ transform: `translate(${-lf * 0.35}px, ${-lf * 0.25}px) scale(${1.03 + lf * 0.0007})` }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: 0.35 }}>
        {Array.from({ length: 9 }, (_, i) => { const y0 = r() * H, y1 = r() * H; return <path key={i} d={`M-20 ${y0} C 300 ${y0 + 200 * (r() - 0.5)}, 700 ${y1 + 200 * (r() - 0.5)}, 1100 ${y1}`} stroke={i % 3 ? "#8a6b4a" : "#a8322a"} strokeWidth={i % 3 ? 3 : 5} fill="none" />; })}
      </svg>
      {spots.map(([x, y], i) => { const w = 220 + r() * 140, h = w * (0.6 + r() * 0.5), rot = (r() - 0.5) * 24, tone = ["#f1e6cf", "#e2d2b0", "#d8c39b", "#efe9dc"][i % 4];
        const photo = i % 2 === 0 ? photos[(i / 2 + seed) % photos.length] : null;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: `rotate(${rot}deg)`, filter: "drop-shadow(4px 8px 8px rgba(0,0,0,.25))" }}>
          <div style={{ position: "absolute", inset: 0, background: tone, clipPath: `polygon(${poly(tornLine(0, 3, w, 0, seed * 10 + i, 12, 9))},${poly(tornLine(w, h, 0, h - 3, seed * 10 + i + 50, 12, 9))})` }}>
            {photo ? <Img src={staticFile(photo)} style={{ position: "absolute", left: 14, top: 14, width: w - 28, height: h - 40, objectFit: "cover", filter: "grayscale(1) sepia(.35) contrast(1.1)" }} />
              : Array.from({ length: Math.floor(h / 22) }, (_, k) => <div key={k} style={{ position: "absolute", left: 16, top: 14 + k * 22, width: w - 40 - (k % 3) * 30, height: 7, background: "#9c8f7a" }} />)}
          </div>
          <div style={{ position: "absolute", left: w / 2 - 60, top: -16, width: 120, height: 34, background: "rgba(231,206,140,.85)", transform: `rotate(${-rot / 2}deg)` }} />
        </div>; })}
    </AbsoluteFill>
  );
};

/* ───────── اللوحات ───────── */
const Board1: React.FC = () => <>
  <Note at={0.5} lines={["ملف القضية", "التمائم"]} x={300} y={980} w={620} h={600} />
  <Pin x={610} y={1010} at={1.0} />
  <Pin x={300} y={285} at={0.3} />
  <Str a={[300, 285]} b={[610, 1010]} at={1.2} />
  <Label x={300} y={1100 - 220} text="المتحدّث" at={1.5} size={58} rot={4} />
  <Label x={610} y={1640} text="هل تنفع الخرزة؟" at={2.2} />
</>;
const Board2: React.FC = () => <>
  <Hero src="cine/amulet.png" x={150} y={330} w={780} at={4.65} rot={2} />
  <Label x={540} y={1420} text="يقولون: تحفظك" at={5.4} />
  <Stamp at={6.5} text="خرافة" x={540} y={760} />
  <Pin x={870} y={1350} at={7.4} />
  <Str a={[540, 400]} b={[870, 1350]} at={7.5} />
  <Label x={820} y={1560} text="لا تنفع ولا تضر" at={7.9} size={60} rot={5} />
</>;
const Board3: React.FC = () => {
  const P: [number, number, string][] = [[180, 1380, "cine/reader_back_soft.png"], [880, 1360, "cine/library.png"], [540, 1660, "cine/book_stack.png"]];
  return <>
    {P.map(([x, y, src], i) => <div key={i} style={{ position: "absolute", left: x - 120, top: y - 90, width: 240 }}><Hero src={src} x={0} y={0} w={240} at={9.6 + i * 0.25} rot={i % 2 ? 6 : -6} /></div>)}
    <Pin x={540} y={1175} at={9.4} />
    {P.map(([x, y], i) => <React.Fragment key={i}><Pin x={x} y={y - 70} at={9.8 + i * 0.25} /><Str a={[540, 1175]} b={[x, y - 70]} at={10.4 + i * 0.3} /></React.Fragment>)}
    <Label x={540} y={1215} text="الحكم: شرك" at={11.6} size={84} rot={-2} />
  </>;
};
const Board4: React.FC = () => <>
  <Label x={540} y={1240} text="توكّل على الله وحده" at={14.4} size={100} rot={-2} />
  <Label x={540} y={1460} text="محمد بن شمس الدين" at={15.4} size={66} rot={3} />
</>;

/* مسار صورة الشيخ: صورة مثبتة في اللوحة ١، غائبة في ٢، بطل اللوحة ٣ في الوسط، صغيرة في ٤ */
const VKF: number[][] = [
  [0, 120, 300, 360, 640], [4.4, 105, 285, 390, 693], [4.5, -500, 350, 320, 569],
  [9.05, -600, 240, 520, 925], [9.1, 280, 240, 520, 925], [13.4, 260, 220, 560, 996], [13.5, 260, -1150, 560, 996],
  [13.9, 380, 300, 320, 569], [18, 360, 280, 360, 640],
];
const SFX: Cue[] = [[S(0.5), "hit", 0.8], [S(1.0), "tap"], [S(4.5), "tear"], [S(6.5), "thud"], [S(9.0), "swipe"], [S(10.4), "swish", 0.7], [S(13.5), "whoosh_big"], [S(15.4), "sting"]];
const BOARDS: { a: number; b: number; El: React.FC }[] = [{ a: 0, b: 4.5, El: Board1 }, { a: 4.5, b: 9.0, El: Board2 }, { a: 9.0, b: 13.5, El: Board3 }, { a: 13.5, b: 18, El: Board4 }];

export const BoardTemplate: React.FC<{ src?: string }> = ({ src = "dubkmr/src.mp4" }) => {
  useFonts(["rakkas", "ruqaa"]);
  const f = useCurrentFrame(), t = f / 30;
  const [x, y, w, h] = frameBox(t, VKF);
  const bi = BOARDS.findIndex((b) => t >= b.a && t < b.b);
  const cur = BOARDS[bi], prev = bi > 0 ? BOARDS[bi - 1] : null, u = t - cur.a;
  /* هزّة الختم */
  const sh = t > 6.5 && t < 6.75 ? Math.sin(t * 140) * (6.75 - t) * 120 : 0;
  const rnd = mulberry32(9);
  const holePts = Array.from({ length: 28 }, (_, i) => { const a = (i / 28) * Math.PI * 2; return [Math.cos(a), Math.sin(a), 0.75 + rnd() * 0.5] as const; });
  return (
    <HybridHost>
      <HybridBg>
        <CrumplePaper color={C.board} id="bd-bg" seed={8} />
        <Clutter seed={1} />
        <AbsoluteFill style={{ boxShadow: "inset 0 0 240px rgba(80,55,25,.45)" }} />
      </HybridBg>
      {w > 0 && x > -400 && x < 1100 && <div style={{ position: "absolute", left: x - 14, top: y - 14, width: w + 28, height: h + 28, boxSizing: "border-box", border: `14px solid ${bi === 2 ? C.edge : "#fff"}`, transform: `translate(${sh}px,0)` }} />}
      <VSlot src={src} w={w} h={h} radius={0} vx={0} vy={0} vw={w} vh={h} style={{ left: x + sh, top: y }} grow={0} />
      <AbsoluteFill style={{ transform: `translate(${sh}px, ${sh * 0.4}px) scale(${1 + 0.035 * u})` }}><cur.El /></AbsoluteFill>
      {/* الانتقالات بمادة الورق */}
      {prev && bi === 1 && u < 0.35 && (() => { const r = easeInOut(u / 0.35) * 1500; const hole = holePts.map(([cx, cy, j]) => `${(W / 2 + cx * r * j).toFixed(0)} ${(H / 2 + cy * r * j * 1.4).toFixed(0)}`).join(" L");
        return <AbsoluteFill style={{ clipPath: `path(evenodd, "M0 0 H${W} V${H} H0 Z M${hole} Z")` }}><CrumplePaper color={C.board} id="bd-tear" seed={8} /><prev.El /></AbsoluteFill>; })()}
      {prev && bi === 2 && u < 0.4 && (() => { const k = easeInOut(u / 0.4);
        return <AbsoluteFill style={{ transform: `scale(${1 - 0.85 * k}) rotate(${k * 40}deg)`, borderRadius: k * 300, overflow: "hidden", boxShadow: "0 30px 60px rgba(0,0,0,.4)", filter: `contrast(${1 + k * 0.4})` }}><CrumplePaper color={C.board} id="bd-crumple" seed={Math.floor(f / 2)} /><prev.El /></AbsoluteFill>; })()}
      {bi === 3 && u < 0.45 && (() => { const k = easeOut(u / 0.45); return <div style={{ position: "absolute", left: 0, top: (1 - k) * H, width: W, height: H, background: C.note, clipPath: `polygon(${poly(tornLine(0, 20, W, 0, 77, 30, 26))},${W}px ${H}px,0px ${H}px)`, boxShadow: "0 -20px 40px rgba(0,0,0,.3)" }} />; })()}
      {bi === 3 && u >= 0.45 && <AbsoluteFill style={{ background: "transparent" }} />}
      <SfxTrack cues={SFX} />
    </HybridHost>
  );
};
