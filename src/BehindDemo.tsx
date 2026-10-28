import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { lalezar } from "./RefStyle";

/**
 * "Behind the body" graphics: layer order = original video (bottom) -> big word / image -> the speaker cut out with an alpha matte (top).
 * The cut-out comes from tools/matte_rvm.py -> public/<name>/fg.webm (VP9 with alpha).
 * Test on 10 s of the street-lesson video (source 100-110 s).
 */
const fps = 30;

/** A huge word that slides/zooms in behind the speaker and leaves. */
const BehindWord: React.FC<{ text: string; from: number; to: number; color?: string; y?: number; size?: number; dir?: 1 | -1 }> = ({ text, from, to, color = "#f3d9a4", y = 70, size = 400, dir = 1 }) => {
  const f = useCurrentFrame();
  const t = f / fps;
  if (t < from - 0.1 || t > to + 0.6) return null;
  const inP = spring({ frame: f - Math.round(from * fps), fps, config: { damping: 18, stiffness: 90, mass: 0.9 } });
  const outP = interpolate(t, [to, to + 0.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  const drift = interpolate(t, [from, to], [0, -90 * dir], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const x = (1 - inP) * 700 * dir + outP * -900 * dir + drift;
  const opacity = Math.min(1, inP * 1.4) * (1 - outP);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center", transform: `translateX(${x}px) scale(${0.9 + 0.1 * inP})`, opacity }}>
      <div style={{ fontFamily: lalezar, fontSize: size, lineHeight: 1, color, whiteSpace: "nowrap", WebkitTextStroke: "6px rgba(120,80,40,.55)", textShadow: "0 18px 40px rgba(60,35,15,.55)", letterSpacing: 6, direction: "rtl" }}>{text}</div>
    </div>
  );
};

/** An illustrative photo that fades/zooms in behind the speaker and out again. */
const BehindPhoto: React.FC<{ src: string; from: number; to: number; x: number; y: number; w: number; h: number; rot?: number }> = ({ src, from, to, x, y, w, h, rot = -4 }) => {
  const f = useCurrentFrame();
  const t = f / fps;
  if (t < from - 0.1 || t > to + 0.6) return null;
  const inP = spring({ frame: f - Math.round(from * fps), fps, config: { damping: 16, stiffness: 110 } });
  const outP = interpolate(t, [to, to + 0.45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  const zoom = interpolate(t, [from, to], [1.0, 1.12], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: Math.min(1, inP * 1.5) * (1 - outP), transform: `translateY(${(1 - inP) * 90 + outP * -60}px) rotate(${rot}deg) scale(${(0.85 + 0.15 * inP) * (1 - 0.1 * outP)})`, borderRadius: 26, overflow: "hidden", border: "8px solid #f7ecd6", boxShadow: "0 24px 60px rgba(40,25,10,.55)" }}>
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})` }} />
    </div>
  );
};

/** Graphics ONLY (transparent background) — rendered to an alpha video, then composited behind the speaker with ffmpeg (tools/behind_compose.mjs). */
export const BehindLayer: React.FC = () => (
  <AbsoluteFill>
    <BehindWord text="منظمة واحدة؟" from={0.95} to={3.4} />
    <BehindPhoto src="live/photo_blur.jpg" from={4.6} to={8.7} x={1090} y={110} w={640} h={700} />
  </AbsoluteFill>
);
