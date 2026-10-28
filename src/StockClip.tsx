import React from "react";
import { AbsoluteFill, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";

/**
 * Stock B-roll clip with the workspace's standing rules baked in:
 *  - hard cap of 2 seconds (never longer),
 *  - lighting grade + slow push-in/drift so it never looks like the raw stock clip,
 *  - vignette to hide edges/flaws.
 * Also run `tools/prep_broll.mjs prep` on the file first (re-encode, crop, speed, grain) — that part defeats duplicate-content detection.
 * Use about ONE clip per 3 minutes of video. No women in any clip.
 */
export const BROLL_MAX_SECONDS = 2;

export const StockClip: React.FC<{ src: string; fps: number; from: number; seconds?: number; seed?: number; style?: React.CSSProperties }> = ({ src, fps, from, seconds = BROLL_MAX_SECONDS, seed = 0, style }) => {
  const dur = Math.round(Math.min(seconds, BROLL_MAX_SECONDS) * fps);
  return (
    <Sequence from={from} durationInFrames={dur} layout="none">
      <Inner src={src} dur={dur} seed={seed} style={style} />
    </Sequence>
  );
};

const Inner: React.FC<{ src: string; dur: number; seed: number; style?: React.CSSProperties }> = ({ src, dur, seed, style }) => {
  const f = useCurrentFrame();
  const dir = seed % 2 === 0 ? 1 : -1;
  const scale = interpolate(f, [0, dur], [1.08, 1.2]);
  const x = interpolate(f, [0, dur], [-14 * dir, 14 * dir]);
  const y = interpolate(f, [0, dur], [8, -8]);
  const fade = Math.min(interpolate(f, [0, 5], [0, 1], { extrapolateRight: "clamp" }), interpolate(f, [dur - 5, dur], [1, 0], { extrapolateLeft: "clamp" }));
  const hue = (seed * 7) % 12 - 6;
  return (
    <AbsoluteFill style={{ opacity: fade, overflow: "hidden", ...style }}>
      <OffthreadVideo src={staticFile(src)} muted playbackRate={1.04} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `translate(${x}px, ${y}px) scale(${scale})`, filter: `brightness(${1 + ((seed % 5) - 2) * 0.015}) contrast(1.1) saturate(1.12) hue-rotate(${hue}deg)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(60,40,20,.38) 100%)" }} />
    </AbsoluteFill>
  );
};
