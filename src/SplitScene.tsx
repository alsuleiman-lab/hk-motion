import React from "react";
import { AbsoluteFill, spring, staticFile, useCurrentFrame } from "remotion";
import { TirVid, TOP, UnderV } from "./TirVideo";
import { HyLevel, hyBg } from "./hybrid/Slot";
import { cairo } from "./Scenes";
import { lalezar } from "./RefStyle";

/**
 * Professional re-composition of the SPLIT-SCREEN shots the user recorded (a black bar / white page / browser on the left, the speaker on the right).
 * Standing rule: a split-screen source is never shown as-is; the two videos are rebuilt on a designed, coloured background (never black).
 * Geometry of the source (1920x1080): speaker = x 1044..1920 (clean, no overlay); panel depends on `type`:
 *   clip    : the yellow-framed clip  x 70..1037, y 277..858     (the opponent's video)
 *   book    : a scanned page          x 14..1036, y 0..1080
 *   browser : a browser screenshot    x 40..892,  y 0..1080
 */
import { CROP, PAD, SPK, SWITCH_AT, VARIANTS, SplitType } from "./tirData";
export { CROP, PAD, SPK, SWITCH_AT, VARIANTS };
export type { SplitType };
export const STAR = `<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'><g fill='none' stroke='#f3e3c0' stroke-width='1.6'><path d='M70 8 L84 40 L116 26 L102 58 L134 70 L102 82 L116 114 L84 100 L70 132 L56 100 L24 114 L38 82 L6 70 L38 58 L24 26 L56 40 Z'/><circle cx='70' cy='70' r='14'/></g></svg>`;

const Cropped: React.FC<{ src: string; crop: { x: number; y: number; w: number; h: number }; scale: number; from: number; style?: React.CSSProperties }> = ({ src, crop, scale, from, style }) => (
  <div style={{ position: "relative", width: crop.w * scale, height: crop.h * scale, overflow: "hidden", ...style }}>
    <TirVid src={staticFile(src)} startFrom={from} muted style={{ position: "absolute", left: -crop.x * scale, top: -crop.y * scale, width: 1920 * scale, height: 1080 * scale, maxWidth: "none" }} />
  </div>
);

export type SplitNote = { t: string; at: number };

/** The opponent's words, written above his clip (user: "اكتب بعض أقواله فوق شاشته"). `at` = frame inside the scene, right after he said it. */
export const NoteCard: React.FC<{ notes: SplitNote[]; w: number }> = ({ notes, w }) => {
  const f = useCurrentFrame();
  let i = -1; notes.forEach((n, j) => { if (f >= n.at) i = j; });
  if (i < 0) return null;
  const n = notes[i];
  const end = i + 1 < notes.length ? Math.min(notes[i + 1].at, n.at + 240) : n.at + 240;
  if (f > end) return null;
  const p = spring({ frame: f - n.at, fps: 30, config: { damping: 13, stiffness: 150 } });
  const size = n.t.length > 46 ? 44 : n.t.length > 30 ? 52 : 60;
  return (
    <div style={{ position: "absolute", left: PAD, top: 34, width: w, height: 150, opacity: Math.min(1, p * 1.6), transform: `translateY(${(1 - p) * -40}px) scale(${0.95 + 0.05 * p})`, display: "flex", alignItems: "center", direction: "rtl", background: "#f6ecd3", borderRadius: 24, borderRight: "16px solid #c98a1b", boxShadow: "0 12px 30px rgba(20,12,4,.45)", padding: "0 26px" }}>
      <div style={{ fontFamily: lalezar, fontSize: 110, color: "#c98a1b", lineHeight: 0.8, marginLeft: 16, alignSelf: "flex-start", marginTop: 24 }}>“</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: cairo, fontWeight: 800, fontSize: 26, color: "#7a4b2a" }}>قوله</div>
        <div style={{ fontFamily: lalezar, fontSize: size, color: "#3a2414", lineHeight: 1.15 }}>{n.t}</div>
      </div>
    </div>
  );
};

export const SplitScene: React.FC<{ src: string; type: SplitType; startFrame: number; durFrames: number; notes?: SplitNote[]; bgA?: string; bgB?: string }> = ({ src, type, startFrame, durFrames, notes, bgA = "#24456e", bgB = "#6b4630" }) => {
  const f = useCurrentFrame();
  const a = 1; // hard cut: a cross-fade over the plain base would ghost two speakers
  const H = 1080 - PAD * 2;
  const sk = H / SPK.h;                       // speaker card scale
  const spkW = SPK.w * sk;
  const zoneW = 1920 - spkW - PAD * 3;        // left zone for the panel
  const c = CROP[type];
  const y0 = notes && notes.length ? 204 : PAD, availH = 1080 - y0 - PAD;
  const pk = Math.min(zoneW / c.w, availH / c.h);  // panel scale
  const pW = c.w * pk, pH = c.h * pk;
  const slide = (1 - a) * 60;
  const sw = SWITCH_AT(durFrames);
  let k = 0; while (k + 1 < sw.length && f >= sw[k + 1]) k++;
  const seed = Math.round(startFrame / 30) % VARIANTS.length;
  const cur = VARIANTS[(seed + k) % VARIANTS.length];
  const prev = VARIANTS[(seed + k + VARIANTS.length - 1) % VARIANTS.length];
  const m = k === 0 ? 1 : spring({ frame: f - sw[k], fps: 30, config: { damping: 14, stiffness: 90 } });
  const vs = prev.s + (cur.s - prev.s) * m, vdy0 = prev.dy + (cur.dy - prev.dy) * m, vr = prev.r + (cur.r - prev.r) * m;
  const lim = Math.max(0, (availH - pH * vs) / 2 - 10), vdy = Math.max(-lim, Math.min(lim, vdy0));
  return (
    <HyLevel z={1}>{/* GPU renderer: the scene covers the lesson's full-frame video (level 0): its background and videos are one level above it */}
    <AbsoluteFill style={{ opacity: a }}>
      <UnderV>{/* the designed background lies under the two video windows (GPU renderer: a layer below the videos) */}
        <AbsoluteFill style={{ background: `linear-gradient(135deg, ${bgA}, #2f5f94 48%, ${bgB})` }} />
        <AbsoluteFill style={{ backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(STAR)}")`, backgroundSize: "140px 140px", backgroundPosition: `${f * 0.25}px ${f * 0.15}px`, opacity: 0.2 }} />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(25,15,8,.32) 100%)" }} />
      </UnderV>
      {/* panel (left) */}
      <div style={{ position: "absolute", left: PAD + (zoneW - pW) / 2 - slide, top: y0 + (availH - pH) / 2, transform: `translateY(${vdy}px) rotate(${vr}deg) scale(${vs})`, borderRadius: 26, overflow: "hidden", border: "7px solid #f6ecd3", boxShadow: TOP ? "none" : "0 18px 48px rgba(20,12,4,.6)", background: TOP ? "transparent" : hyBg("#fff") }}>
        <Cropped src={src} crop={c} scale={pk} from={startFrame} />
      </div>
      {notes && notes.length ? <NoteCard notes={notes} w={zoneW} /> : null}
      {/* speaker (right) */}
      <div style={{ position: "absolute", right: PAD + slide, top: PAD, borderRadius: 30, overflow: "hidden", border: "7px solid #f6ecd3", boxShadow: TOP ? "none" : "0 18px 48px rgba(20,12,4,.6)" }}>
        <Cropped src={src} crop={SPK} scale={sk} from={startFrame} />
      </div>
    </AbsoluteFill>
    </HyLevel>
  );
};
