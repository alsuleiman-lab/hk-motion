import React from "react";
import { AbsoluteFill, staticFile, Video } from "remotion";
import { KhBg, PhotoBg } from "./KhKit";

/** TRIAL (2026-10-23): the SAME sample and background as KhCssMaskTrial, but the Sheikh comes from an alpha WebM (old pipeline) — for the render-speed / memory comparison. */
export const ALPHATRIAL_FRAMES = 300;
export const KhAlphaTrial: React.FC = () => (
  <AbsoluteFill style={{ background: "#2f4a68" }}>
    <KhBg />
    <PhotoBg src="kh/bukhari_lacma.jpg" pos="50% 30%" />
    <Video src={staticFile("kh/alpha_trial.webm")} muted style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }} />
  </AbsoluteFill>
);
