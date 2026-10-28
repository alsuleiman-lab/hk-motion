import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { Gfx } from "./MG";
import { NewsTearOpen, Newsprint, PaperStrip } from "./NewsPaperCover";

/**
 * Cover «علي الجفري ونجاة المشركين» (newsprint template, thumbnail-design): frames 0–2 = the still thumbnail;
 * from frame 3 every element leaves on its own path in stop-motion (3-frame holds, no fades) while NewsTearOpen pulls the sheet off.
 * Phrases from the speech: «بحسب تقرير علي الجفري» (0:11) · «تجد هندوسياً … في الجنة؟» (0:11) · «فلا مانع من ذلك» (0:18).
 */
const KUFI = "Noto Kufi Arabic";
const TEXT = "Almarai";
const SHEIKH = "cov/sheikh_jn.png";        // 1920×1080 cut-out from the recording (t=450 s)
const JIFRI = "cov/jifri_jn.png";          // 1056×1812 cut-out from his clip in the recording
const COW = "jifri_najat/cow_homage.jpg";  // 2736×3648, Wikimedia Commons CC BY-SA 2.0
// removes the chair behind his left shoulder (matte artefact), in % of the 1920×1080 cut-out
const SHEIKH_CLIP = "polygon(0% 61.1%, 29.2% 61.1%, 33.3% 53.7%, 39.6% 46.3%, 41.1% 40.7%, 41.1% 0%, 100% 0%, 100% 100%, 0% 100%)";
// his cut-out ends on the straight edge of the clip panel (right) and a matte scrap at the top: soften both edges into the paper
const EDGE = "linear-gradient(to right, #000 78%, transparent 97%)";
const TONE = "saturate(.82) sepia(.12) contrast(1.04)";

/** stop-motion exit: holds 3 frames, eases away along (dx,dy) with a little tilt */
const useExit = (start: number, dx: number, dy: number, spin = 8) => {
  const fq = Math.floor(useCurrentFrame() / 3) * 3;
  const u = interpolate(fq, [start, start + 21], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  return { transform: `translate(${dx * u}px, ${dy * u}px) rotate(${spin * u + (u > 0 ? (random(`x${fq}${dx}`) - 0.5) * 1.2 : 0)}deg)` };
};

const Brush: React.FC<{ w: number; h: number; color: string; text: string; size: number; ink: string; seed: number }> = ({ w, h, color, text, size, ink, seed }) => {
  const n = 18;
  const top = Array.from({ length: n + 1 }, (_, i) => `${(i / n) * w},${6 + (random(`bt${seed}${i}`) - 0.5) * 14}`);
  const bot = Array.from({ length: n + 1 }, (_, i) => `${w - (i / n) * w},${h - 6 + (random(`bb${seed}${i}`) - 0.5) * 14}`);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible", filter: "drop-shadow(0 6px 8px rgba(40,30,10,.35))" }}>
      <filter id={`br${seed}`}><feTurbulence type="fractalNoise" baseFrequency="0.9 0.05" numOctaves="2" seed={seed} /><feDisplacementMap in="SourceGraphic" scale="10" /></filter>
      <polygon points={[...top, ...bot].join(" ")} fill={color} filter={`url(#br${seed})`} />
      <text x={w / 2} y={h * 0.7} textAnchor="middle" direction="rtl" fontFamily={KUFI} fontWeight={800} fontSize={size} fill={ink}>{text}</text>
    </svg>
  );
};

const Person: React.FC<{ src: string; w: number; h: number; clip?: string; pos?: string; mask?: string }> = ({ src, w, h, clip, pos = "center bottom", mask }) => (
  <div style={{ width: w, height: h, filter: "drop-shadow(0 14px 18px rgba(30,22,10,.45))" }}>
    <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, clipPath: clip, filter: TONE, WebkitMaskImage: mask, maskImage: mask }} />
  </div>
);

const Photo: React.FC<{ w: number; h: number; rot: number }> = ({ w, h, rot }) => (
  <div style={{ width: w, height: h, padding: 14, background: "#f4efe2", transform: `rotate(${rot}deg)`, boxShadow: "0 12px 22px rgba(40,30,10,.4)" }}>
    <Img src={staticFile(COW)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "40% 35%", filter: "saturate(.9) sepia(.1)" }} />
  </div>
);

export const JnCover: React.FC<{ format: "landscape" | "portrait"; paper?: boolean }> = ({ format, paper = true }) => {
  const L = format === "landscape";
  const W = L ? 1920 : 1080, H = L ? 1080 : 1920;
  const photo = useExit(3, L ? -700 : -900, L ? -500 : -300, -14);
  const jifri = useExit(6, L ? -900 : -1100, 200, -10);
  const sheikh = useExit(9, L ? 1000 : 1100, 120, 9);
  const t1 = useExit(3, 0, L ? 700 : 900, 6);
  const t2 = useExit(6, L ? -1500 : -1300, 0, -5);
  const t3 = useExit(9, L ? 1500 : 1300, 300, 7);
  const sig = useExit(3, -600, 300, -6);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {paper ? <NewsTearOpen w={W} h={H} order={L ? [3, 4, 2, 0, 1] : [3, 2, 4, 1, 0]} /> : null}
      {/* the sheikh is the base layer (outside Gfx) so face_check measures the intruding pieces against his face */}
      <div style={{ position: "absolute", ...(L ? { left: 820, top: 40 } : { left: -460, top: 620 }), ...sheikh }}>{L ? <Person src={SHEIKH} w={1850} h={1040} clip={SHEIKH_CLIP} /> : <Person src={SHEIKH} w={2200} h={1238} clip={SHEIKH_CLIP} />}</div>
      <Gfx>
        {L ? (
          <>
            <div style={{ position: "absolute", left: 60, top: 50, ...photo }}><Photo w={470} h={560} rot={-4} /></div>
            <div style={{ position: "absolute", left: 470, top: 130, ...jifri }}><Person src={JIFRI} w={560} h={960} pos="center top" mask={EDGE} /></div>
            <div style={{ position: "absolute", left: 70, top: 618, ...t1 }}><Brush w={560} h={92} color="#e6b84a" ink="#2b2214" text="بحسب تقرير الجفري" size={50} seed={3} /></div>
            <div style={{ position: "absolute", left: 40, top: 722, transform: `rotate(-2deg) ${t2.transform}` }}><PaperStrip w={900} h={168} text="هندوسي في الجنة؟!" size={112} /></div>
            <div style={{ position: "absolute", left: 300, top: 892, ...t3 }}><Brush w={560} h={100} color="#2a2724" ink="#fbf6ea" text="ولا مانع من ذلك!" size={58} seed={9} /></div>
            <div style={{ position: "absolute", left: 40, bottom: 26, fontFamily: TEXT, fontWeight: 800, fontSize: 30, color: "#3a3226", ...sig }}>محمد بن شمس الدين</div>
          </>
        ) : (
          <>
            <div style={{ position: "absolute", left: 270, top: 40, ...photo }}><Photo w={540} h={600} rot={-3} /></div>
            <div style={{ position: "absolute", left: -120, top: 1130, ...jifri }}><Person src={JIFRI} w={440} h={755} pos="center top" mask={EDGE} /></div>
            <div style={{ position: "absolute", left: 250, top: 1490, ...t1 }}><Brush w={560} h={90} color="#e6b84a" ink="#2b2214" text="بحسب تقرير الجفري" size={48} seed={3} /></div>
            <div style={{ position: "absolute", left: 60, top: 1572, transform: `rotate(-2deg) ${t2.transform}` }}><PaperStrip w={960} h={170} text="هندوسي في الجنة؟!" size={112} /></div>
            <div style={{ position: "absolute", left: 270, top: 1744, ...t3 }}><Brush w={540} h={96} color="#2a2724" ink="#fbf6ea" text="ولا مانع من ذلك!" size={56} seed={9} /></div>
            <div style={{ position: "absolute", left: 36, bottom: 30, fontFamily: TEXT, fontWeight: 800, fontSize: 30, color: "#3a3226", ...sig }}>محمد بن شمس الدين</div>
          </>
        )}
      </Gfx>
    </AbsoluteFill>
  );
};

export const JnCoverL: React.FC = () => <AbsoluteFill><Newsprint w={1920} h={1080} /><JnCover format="landscape" paper={false} /></AbsoluteFill>;
export const JnCoverP: React.FC = () => <AbsoluteFill><Newsprint w={1080} h={1920} /><JnCover format="portrait" paper={false} /></AbsoluteFill>;
