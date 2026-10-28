import React from "react";
import { AbsoluteFill } from "remotion";
import { STAR } from "../SplitScene";

/** Static assets of the GPU hybrid renderer, rendered ONCE with `remotion still` so they match the CSS of the scenes exactly:
 *  gradient background, the 140px star tile (opacity .2 as in the scenes) and the dark vignette. The compositor drifts the stars and stacks the three. */
export const HybridGrad: React.FC = () => <AbsoluteFill style={{ background: "linear-gradient(135deg, #24456e, #2f5f94 48%, #6b4630)" }} />;
export const HybridVig: React.FC = () => <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(25,15,8,.32) 100%)" }} />;
export const HybridStar: React.FC = () => <AbsoluteFill style={{ backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(STAR)}")`, backgroundSize: "140px 140px", opacity: 0.2 }} />;

/** portrait (1080x1920) backgrounds: explainer = same 135deg gradient + vignette; split = 160deg gradient, no vignette */
export const HybridGradP135: React.FC = () => <AbsoluteFill style={{ background: "linear-gradient(135deg, #24456e, #2f5f94 48%, #6b4630)" }} />;
export const HybridGradP160: React.FC = () => <AbsoluteFill style={{ background: "linear-gradient(160deg, #24456e, #2f5f94 48%, #6b4630)" }} />;
