import React from "react";
import { AbsoluteFill } from "remotion";
import { MaskedVideo } from "./MaskedVideo";
import { KhBg } from "./KhKit";

/**
 * RECONSTRUCTION (2026-10-23): the original file of this name (written by another session) was overwritten by mistake by the main session; its content could not be recovered.
 * This version re-creates the same idea from what is left (src/MaskedVideo.tsx + public/kh/matte_T.mp4 and its .json: matte of kh_cut_s.mp4 seconds 2.6–22.6, frame k of the matte = frame k of the cut):
 * the WebGL <MaskedVideo> over a decorated background. The owner session may replace this file freely (keep the exports KhMaskTest and KMT_FRAMES, used by src/Root.tsx).
 */
export const KMT_FRAMES = 360;
export const KhMaskTest: React.FC = () => (
  <AbsoluteFill style={{ background: "#2f4a68" }}>
    <KhBg />
    <MaskedVideo video="kh_cut_s.mp4" videoStartFrom={Math.round(2.6 * 30)} matte="kh/matte_T.mp4" matteStartFrom={Math.round(2.6 * 30)} />
  </AbsoluteFill>
);
