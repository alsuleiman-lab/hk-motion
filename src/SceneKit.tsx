import React from "react";
import { AbsoluteFill, Easing, OffthreadVideo, useCurrentFrame } from "remotion";
import { Backdrop, STEEL } from "./CoverTry4";

/**
 * SceneKit — reusable scene pieces that came out of the «يهودية تفسّر آية» montage (kept after its approval 2026-10-21; the video itself was deleted).
 *  - SceneBg: calm designed backdrop (+ slowly turning 8-point star pattern) — never a room.
 *  - SheikhCard: the Sheikh in a card, cropped from his recording. Beard tip ≈ y 660 in layout A (full cam, face x≈1000) and ≈ y 760 in layout B
 *    (his half of the split recording, face x≈1440): the card must show source y ≥ 700 (A) / ≥ 820 (B) → use `sc` 0.8 when the card is short.
 *  - SrcPanel: a recorded split-screen panel (book / site / clip) re-framed on a region of interest that changes every ~3 s (light move + brief tilt).
 * Rules (PREFERENCES.md §4–5): a recorded split screen is never shown as-is; the Sheikh card sits BESIDE the source panel; a woman's clip is blurred (`blur`).
 * All videos are `muted` — the soundtrack is a separate <Audio> (echo-reduced, tools/echo_reduce.py).
 */
const FPS = 30;
const ease = (x: number) => Easing.bezier(0.45, 0, 0.15, 1)(Math.max(0, Math.min(1, x)));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export const SceneBg: React.FC<{ ghost?: boolean }> = ({ ghost }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {ghost ? null : <Backdrop p={STEEL} gx={1450} gy={420} blur={10} />}
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, opacity: 0.16 }}>
        {[[300, 260, 520], [1500, 820, 640], [900, 1000, 380]].map(([cx, cy, r], i) => (
          <g key={i} transform={`translate(${cx} ${cy}) rotate(${(f * (i % 2 ? -0.07 : 0.06)) % 360})`} fill="none" stroke="#e8f2ff" strokeWidth="3">
            <rect x={-r / 2} y={-r / 2} width={r} height={r} />
            <rect x={-r / 2} y={-r / 2} width={r} height={r} transform="rotate(45)" />
            <circle r={r * 0.36} />
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  );
};

export const SheikhCard: React.FC<{ video: string; x: number; y: number; w: number; h: number; layout: "A" | "B"; sc?: number; zoom?: number }> = ({ video, x, y, w, h, layout, sc = 1, zoom = 1 }) => {
  const z = Math.min(zoom, sc < 1 ? 1.07 : 1.14);
  const x0 = layout === "B" ? Math.max(1000, 1440 - w / sc / 2) : 1000 - w / sc / 2;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 32, overflow: "hidden", border: "7px solid rgba(248,242,228,.95)", boxShadow: "0 24px 54px rgba(5,18,40,.55)", background: "#2a4f73" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${z})`, transformOrigin: sc < 1 ? "50% 100%" : "50% 22%" }}>
        <OffthreadVideo src={video} muted style={{ position: "absolute", left: -x0 * sc, top: -10 * sc, width: 1920 * sc, height: 1080 * sc, maxWidth: "none" }} />
      </div>
    </div>
  );
};

export type ROI = { x: number; y: number; w: number; h: number };
/** `rois`: regions of the 1920×1080 recording to visit in turn (e.g. whole page → upper half → lower half); `box`: where the panel sits on screen. */
export const SrcPanel: React.FC<{ video: string; rois: ROI[]; box: ROI; start: number; blur?: number }> = ({ video, rois, box, start, blur }) => {
  const f = useCurrentFrame();
  const t = Math.max(0, f / FPS - start);
  const period = 3.2, trans = 0.7;
  const n = rois.length, k = Math.floor(t / period), local = t - k * period;
  const cur = rois[k % n], nxt = rois[(k + 1) % n];
  const e = n > 1 ? ease((local - (period - trans)) / trans) : 0;
  const roi = { x: lerp(cur.x, nxt.x, e), y: lerp(cur.y, nxt.y, e), w: lerp(cur.w, nxt.w, e), h: lerp(cur.h, nxt.h, e) };
  const s = Math.min(box.w / roi.w, box.h / roi.h);
  const left = box.w / 2 - (roi.x + roi.w / 2) * s;
  const top = box.h / 2 - (roi.y + roi.h / 2) * s;
  const tilt = Math.sin(Math.PI * e) * 1.1 * (k % 2 ? -1 : 1);
  return (
    <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: 26, overflow: "hidden", border: "6px solid rgba(248,242,228,.95)", boxShadow: "0 22px 50px rgba(5,18,40,.5)", background: "#16314f", transform: `rotate(${tilt}deg)` }}>
      <OffthreadVideo src={video} muted style={{ position: "absolute", left, top, width: 1920 * s, height: 1080 * s, maxWidth: "none", filter: blur ? `blur(${blur}px)` : undefined }} />
    </div>
  );
};
