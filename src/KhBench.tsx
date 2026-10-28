import React from "react";
import { AbsoluteFill, Sequence, staticFile, Video } from "remotion";
import { IsoView, MaskedIso, PhotoBg, VID } from "./KhKit";
import { MaskedVideo } from "./MaskedVideo";

/** BENCHMARK (fork session, 2026-10-23) — the SAME 20 s (cut seconds 2.6–22.6) isolated Sheikh over two photo backgrounds, three ways:
 *  old = alpha WebM (IsoView) · css = saved matte + CSS blend (MaskedIso, the method adopted in KashfHadith) · gl = saved matte + WebGL (MaskedVideo). Private assets: public/kh/bench/. Do not edit while a benchmark runs. */
export const KHBENCH_FRAMES = 600;
const START = 78;
const T: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transform: "translateX(300px) scale(0.96)", transformOrigin: "100% 100%" };
const Bg: React.FC = () => (
  <>
    <Sequence from={0} durationInFrames={300}><PhotoBg src="kh/muslim_cover.jpg" /></Sequence>
    <Sequence from={300} durationInFrames={300}><PhotoBg src="kh/tirmidhi_tomb.jpg" /></Sequence>
  </>
);
export const KhBench: React.FC<{ mode: "old" | "css" | "gl" }> = ({ mode }) => (
  <AbsoluteFill style={{ background: "#2a3f58" }}>
    <Video src={staticFile(VID)} startFrom={START} style={{ width: "100%", height: "100%" }} />
    {mode === "old" ? <IsoView src="kh/bench/alpha.webm"><Bg /></IsoView> : null}
    {mode === "css" ? <MaskedIso from={START} mask="kh/bench/matte.mp4"><Bg /></MaskedIso> : null}
    {mode === "gl" ? <><Bg /><MaskedVideo video={VID} videoStartFrom={START} matte="kh/bench/matte.mp4" matteStartFrom={0} style={T} /></> : null}
  </AbsoluteFill>
);
