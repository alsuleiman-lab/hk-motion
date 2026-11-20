import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { HybridHost, HybridBg, VSlot } from "../hybrid/Slot";
import { FontKey, useFonts } from "./fonts";
import { clamp01 } from "./motion";
import { Leak, Line, Page, Rosette, StretchWord, Word } from "./CineWords";
import { Cue, SfxTrack } from "./sfx";

/**
 * قالب «اللقطة السينمائية» (من المرجع الرابع، جهة «بعد»؛ 2026-11-20) لاستعماله في فيديوهاتنا القادمة:
 * يُعطى قائمة لقطات بالثواني، وكل لقطة إما المتحدث (من فيديوه، بتقريب مختلف لكل لقطة يصنع إحساس الكاميرات المتعددة)
 * أو لقطة معنى (صفحة مصحف يمرّ عليها التظليل، نجمة زخرفية)، وفوق كل لقطة سطور كلمات تظهر كلمةً كلمة بضبابية ووهج.
 * القطع حاد بين اللقطات (كل ١–١٫٥ ث في المرجع)، والضوء الذهبي يتنفّس فوق كل شيء، والكتابة تحت الوجه دائماً.
 */
export type CineWordSpec = { at: number; text?: string; stretch?: [string, string]; size: number; font?: FontKey; gold?: boolean };
export type CineLine = { y: number; until: number; words: CineWordSpec[] };
export type CineShot = { a: number; b: number; kind: "speaker" | "page" | "rosette" | "cover"; zoom?: number; shift?: number; lines: CineLine[] };

const W = 1080, H = 1920;
const GOLD = "#d9b24a";

/** المتحدث: تقريب ثابت للقطة مع اقتراب بطيء ٣٪، والوجه في الثلث الأعلى؛ والتلوين طبقة دافئة داكنة فوقه */
const speakerBox = (shot: CineShot, t: number) => {
  const p = clamp01((t - shot.a) / Math.max(0.1, shot.b - shot.a));
  const s = Math.min(1.35, shot.zoom ?? 1) * (1 + 0.03 * p);
  const vw = W * s, vh = H * s;
  const shift = (shot.shift ?? 0) * (vw - W) / 2;
  return { vw, vh, vx: -(vw - W) / 2 + shift, vy: -(vh - H) * 0.06 };
};

const Cover: React.FC<{ a: number }> = ({ a }) => {
  const t = useCurrentFrame() / 30 - a;
  const ry = -18 + 10 * Math.min(1, t / 1.4), rx = 8 - 4 * Math.min(1, t / 1.4), z = 0.92 + 0.06 * Math.min(1, t / 1.4);
  const star = (r1: number, r2: number, n = 8) => Array.from({ length: n * 2 }, (_, i) => { const r = i % 2 ? r2 : r1, q = (Math.PI * i) / n; return `${(Math.cos(q) * r).toFixed(1)},${(Math.sin(q) * r).toFixed(1)}`; }).join(" ");
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 38%, #2a1d0c, #070604 72%)", perspective: 1800 }}>
      <div style={{ position: "absolute", left: W / 2 - 330, top: 260, width: 660, height: 900, transform: `rotateY(${ry}deg) rotateX(${rx}deg) scale(${z})`, transformStyle: "preserve-3d" }}>
        <div style={{ position: "absolute", right: -26, top: 14, width: 30, height: 872, background: "linear-gradient(90deg,#efe6cf,#cbb98f)", transform: "rotateY(90deg)", transformOrigin: "left" }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: 18, background: "linear-gradient(135deg,#3a2414,#20140a 60%,#2e1c0f)", boxShadow: "0 40px 80px rgba(0,0,0,.7), inset 0 0 0 10px rgba(217,178,74,.55), inset 0 0 0 22px rgba(0,0,0,.35), inset 0 0 0 26px rgba(217,178,74,.35)" }}>
          <svg width={660} height={900} viewBox="-330 -450 660 900" style={{ position: "absolute", inset: 0 }}>
            <defs><linearGradient id="gld" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f6dc8a" /><stop offset=".5" stopColor="#c89a35" /><stop offset="1" stopColor="#8a6418" /></linearGradient></defs>
            {[230, 180, 130].map((r, i) => <polygon key={r} points={star(r, r * 0.74)} fill="none" stroke="url(#gld)" strokeWidth={i === 0 ? 7 : 4} transform={`rotate(${i * 11.25})`} />)}
            <circle r={70} fill="none" stroke="url(#gld)" strokeWidth={5} />
            <circle r={44} fill="url(#gld)" opacity={0.9} />
            {[-1, 1].map((sy) => <rect key={sy} x={-240} y={sy * 380 - 6} width={480} height={12} rx={6} fill="url(#gld)" opacity={0.8} />)}
          </svg>
          <div style={{ position: "absolute", inset: 0, borderRadius: 18, background: `linear-gradient(${110 + t * 30}deg, rgba(255,240,200,0) 30%, rgba(255,240,200,.16) 45%, rgba(255,240,200,0) 60%)` }} />
        </div>
      </div>
      {Array.from({ length: 26 }, (_, i) => { const px = (i * 397) % W, py = 1500 - ((t * 60 + i * 173) % 1500), sz = 3 + (i % 4); return <div key={i} style={{ position: "absolute", left: px, top: py, width: sz, height: sz, borderRadius: "50%", background: "#f2d27a", opacity: 0.25 + (i % 3) * 0.15, filter: "blur(1px)" }} />; })}
    </AbsoluteFill>
  );
};

export const CineSequence: React.FC<{ shots: CineShot[]; src: string; sfx?: Cue[] }> = ({ shots, src, sfx = [] }) => {
  useFonts(["mirza", "ruqaa", "amiri", "kafRuqaa"]);
  const f = useCurrentFrame(), t = f / 30;
  const shot = shots.find((s) => t >= s.a && t < s.b) ?? shots[shots.length - 1];
  const sp = shots.filter((s) => s.kind === "speaker");
  const live = shot.kind === "speaker" ? shot : sp.find((s) => s.a > t) ?? sp[sp.length - 1];
  const box = speakerBox(live, t);
  return (
    <HybridHost>
      <HybridBg><AbsoluteFill style={{ background: "#0b0a08" }} /></HybridBg>
      <VSlot src={src} w={W} h={H} radius={0} vx={box.vx} vy={box.vy} vw={box.vw} vh={box.vh} style={{ left: 0, top: 0 }} grow={0} />
      {shot.kind === "speaker" && (
        <>
          <AbsoluteFill style={{ background: "rgba(14,9,4,.42)" }} />
          <AbsoluteFill style={{ background: "rgba(70,42,12,.18)" }} />
          <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 55% at 50% 30%, rgba(0,0,0,0) 40%, rgba(0,0,0,.82) 100%)" }} />
          <AbsoluteFill style={{ background: "linear-gradient(rgba(4,3,1,0) 64%, rgba(4,3,1,.85) 76%, rgba(4,3,1,.97) 88%)" }} />
        </>
      )}
      {shot.kind === "page" && <Page at={Math.round(shot.a * 30)} />}
      {shot.kind === "rosette" && <Rosette />}
      {shot.kind === "cover" && <Cover a={shot.a} />}
      {shot.lines.map((ln, i) => (
        <Line key={i} y={ln.y}>
          {ln.words.map((w, j) => w.stretch
            ? <StretchWord key={j} at={Math.round(w.at * 30)} until={Math.round(ln.until * 30)} a={w.stretch[0]} b={w.stretch[1]} size={w.size} font={w.font ?? "mirza"} />
            : <Word key={j} at={Math.round(w.at * 30)} until={Math.round(ln.until * 30)} text={w.text ?? ""} size={w.size} font={w.font ?? "mirza"} color={w.gold ? GOLD : undefined} />)}
        </Line>
      ))}
      <Leak />
      <SfxTrack cues={sfx} />
    </HybridHost>
  );
};

/* ───────── التمرين: المرجع الرابع بفيديو الشيخ ───────── */
const SHOTS: CineShot[] = [
  { a: 0.0, b: 1.2, kind: "cover", lines: [
    { y: 1250, until: 1.2, words: [{ at: 0.1, text: "نحن", size: 96, font: "ruqaa" }, { at: 0.3, text: "لسنا", size: 96, font: "ruqaa" }] },
    { y: 1400, until: 1.2, words: [{ at: 0.5, stretch: ["أمّ", "ة"], size: 190 }, { at: 0.75, text: "اقرأ", size: 190 }] }] },
  { a: 1.2, b: 2.8, kind: "speaker", zoom: 1.3, shift: 0.8, lines: [
    { y: 1500, until: 2.8, words: [{ at: 1.3, text: "الأمم", size: 104, font: "ruqaa" }, { at: 1.5, text: "الأخرى", size: 104, font: "ruqaa" }] },
    { y: 1630, until: 2.8, words: [{ at: 1.9, text: "أيضاً", size: 150 }, { at: 2.1, stretch: ["تقـ", "ـرأ"], size: 180 }] }] },
  { a: 2.8, b: 4.6, kind: "page", lines: [
    { y: 300, until: 4.6, words: [{ at: 3.0, text: "قد", size: 124 }, { at: 3.2, text: "تقرأ", size: 124 }, { at: 3.45, text: "أكثر", size: 124, gold: true }, { at: 3.7, text: "منا", size: 124 }] }] },
  { a: 4.6, b: 5.8, kind: "speaker", zoom: 1.12, lines: [
    { y: 1500, until: 5.8, words: [{ at: 4.7, text: "لكننا", size: 104, font: "ruqaa" }, { at: 4.9, text: "نحن", size: 104, font: "ruqaa" }] },
    { y: 1630, until: 5.8, words: [{ at: 5.1, stretch: ["أمّ", "ة"], size: 200 }] }] },
  { a: 5.8, b: 7.0, kind: "speaker", zoom: 1.35, shift: -0.8, lines: [
    { y: 1600, until: 7.0, words: [{ at: 5.9, text: "تقرأ", size: 200, gold: true }] }] },
  { a: 7.0, b: 9.8, kind: "speaker", zoom: 1.22, lines: [
    { y: 1600, until: 8.3, words: [{ at: 7.1, text: "ولا", size: 130 }, { at: 7.3, text: "تنظر", size: 130 }, { at: 7.55, text: "للأمور", size: 130 }] },
    { y: 1600, until: 9.1, words: [{ at: 8.35, text: "بمعزل", size: 130 }, { at: 8.55, text: "عن", size: 130 }, { at: 8.75, text: "الخالق", size: 130, gold: true }] },
    { y: 1600, until: 9.8, words: [{ at: 9.15, text: "الذي", size: 130 }, { at: 9.35, text: "أنشأ", size: 130 }, { at: 9.55, text: "الخلق", size: 130 }] }] },
  { a: 9.8, b: 13.0, kind: "rosette", lines: [
    { y: 1250, until: 11.3, words: [{ at: 9.9, text: "نحن", size: 130 }, { at: 10.1, text: "أمة", size: 130 }, { at: 10.35, text: "القراءة", size: 130, gold: true }] },
    { y: 1250, until: 12.2, words: [{ at: 11.35, text: "التي", size: 110, font: "ruqaa" }, { at: 11.55, text: "تربط", size: 110, font: "ruqaa" }, { at: 11.8, text: "المخلوق", size: 110, font: "ruqaa" }] },
    { y: 1420, until: 13.0, words: [{ at: 12.2, stretch: ["بالخ", "الق"], size: 210, font: "kafRuqaa" }] }] },
];
const SFX: Cue[] = [[2, "shimmer"], [84, "subdrop", 0.8], [138, "hit", 0.7], [174, "subdrop", 0.7], [294, "subdrop", 0.8], [366, "sting"]];
export const CINE_SPEAKER_FRAMES = 390;
export const CineSpeaker: React.FC = () => <CineSequence shots={SHOTS} src="dubkmr/src.mp4" sfx={SFX} />;
