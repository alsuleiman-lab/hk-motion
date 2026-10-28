import React from "react";
import { AbsoluteFill } from "remotion";
import { MaskedVideo } from "./MaskedVideo";

/** Isolated Sheikh via a SAVED mask + WebGL (adopted 2026-10-23 after the 20 s benchmark: render 59–63 s vs 241–288 s alpha WebM / 230 s CSS blend, Studio 59.8 fps with 0 drops,
 *  frame-exact on the 12 fastest frames). Layers inside one window: background (children) → <MaskedVideo> (original + mask). `from` = master frame of the window start;
 *  the mask file starts at the window start (tools/matte_cache.mjs → public/kh/mask_X.mp4). Same placement as IsoView (right shift, bottom edge). */
/** body flush with the bottom edge (R-COMP-SHEIKH.4): the matte ends at the desk line (row ≈1000–1040), so the figure is enlarged 6 % (max 8 %) and lowered 90 px: the torso leaves the frame, no gap, head top ≥ 60 px */
const ISO_T: React.CSSProperties = { transform: "translate(300px, 90px) scale(1.06)", transformOrigin: "100% 100%" };
export const IsoGl: React.FC<{ video: string; from: number; mask: string; children?: React.ReactNode }> = ({ video, from, mask, children }) => (
  <AbsoluteFill>
    {children}
    <MaskedVideo video={video} videoStartFrom={from} matte={mask} matteStartFrom={0} style={ISO_T} />
  </AbsoluteFill>
);
