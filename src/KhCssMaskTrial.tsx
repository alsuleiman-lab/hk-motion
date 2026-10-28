import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, Video } from "remotion";
import { KhBg, PhotoBg, VID, FPS } from "./KhKit";

/**
 * TRIAL (2026-10-23): isolate the Sheikh WITHOUT an alpha WebM. A grey mask video (tools/matte_gpu.py) is applied with pure CSS blend modes:
 *   result = background × (1 − mask) + person × mask
 *   group 1 = background, then the INVERTED mask multiplied onto it;  group 2 = the original video, then the mask multiplied onto it;  group 2 is added on top of group 1.
 * Works in the Studio and in headless Chromium (Remotion render) because it needs only <video> elements; changing the background never re-runs the matte.
 */
export const CSSMASK_FRAMES = 300;
const START = 120 * FPS;   // sample = cut seconds 120–130
export const MaskedPerson: React.FC<{ from: number; mask: string; children: React.ReactNode; offthread?: boolean }> = ({ from, mask, children, offthread }) => {
  const V = (offthread ? OffthreadVideo : Video) as React.ComponentType<{ src: string; muted?: boolean; startFrom?: number; style?: React.CSSProperties }>;
  return (
  <AbsoluteFill>
    <AbsoluteFill style={{ isolation: "isolate" }}>
      {children}
      <V src={staticFile(mask)} muted startFrom={0} style={{ position: "absolute", inset: 0, width: 1920, height: 1080, filter: "invert(1)", mixBlendMode: "multiply" }} />
    </AbsoluteFill>
    <AbsoluteFill style={{ isolation: "isolate", mixBlendMode: "plus-lighter" }}>
      <V src={staticFile(VID)} muted startFrom={from} style={{ position: "absolute", inset: 0, width: 1920, height: 1080 }} />
      <V src={staticFile(mask)} muted startFrom={0} style={{ position: "absolute", inset: 0, width: 1920, height: 1080, mixBlendMode: "multiply" }} />
    </AbsoluteFill>
  </AbsoluteFill>
  );
};

export const KhCssMaskTrial: React.FC = () => (
  <AbsoluteFill style={{ background: "#2f4a68" }}>
    <MaskedPerson from={START} mask="kh/mask_trial.mp4">
      <KhBg />
      <PhotoBg src="kh/bukhari_lacma.jpg" pos="50% 30%" />
    </MaskedPerson>
  </AbsoluteFill>
);

/** same trial with OffthreadVideo (frame-accurate extraction while rendering) */
export const KhCssMaskTrialOT: React.FC = () => (
  <AbsoluteFill style={{ background: "#2f4a68" }}>
    <MaskedPerson from={START} mask="kh/mask_trial.mp4" offthread>
      <KhBg />
      <PhotoBg src="kh/bukhari_lacma.jpg" pos="50% 30%" />
    </MaskedPerson>
  </AbsoluteFill>
);
