import React from "react";
import { Video as MediaVideo } from "@remotion/media";
import { getInputProps, getRemotionEnvironment, OffthreadVideo, Video } from "remotion";

/** Studio preview used to stutter (OffthreadVideo extracts frames on a server; many layers + a 1 GB source = replayed seconds).
 *  In the Studio we play a light 540p all-keyframe-every-15 proxy through the plain HTML5 <Video>; the final render uses the full file through OffthreadVideo. */
/** profiling switch: inputProps {debug:"novideo"|"noshadow"|"novideo,noshadow"} (benchmarks only) */
export const DEBUG: string = String((getInputProps() as { debug?: string }).debug ?? "");
/** hybrid GPU pipeline: inputProps {layer:"top"} renders ONLY the graphics (no video, no backgrounds, no video shadows) with a transparent background */
export const TOP: boolean = (getInputProps() as { layer?: string }).layer === "top";
/** true while previewing in Remotion Studio (not rendering): heavy effects are lightened so playback does not stutter */
export const STUDIO: boolean = !getRemotionEnvironment().isRendering;
export const TIR_SRC = getRemotionEnvironment().isRendering && !DEBUG.includes("proxy") ? "tir_cut_v3.mp4" : "tir_cut_v3_proxy.mp4";
export const TirVid: React.FC<React.ComponentProps<typeof OffthreadVideo>> = (p) =>
  TOP ? null : DEBUG.includes("novideo") ? <div style={{ ...(p.style as React.CSSProperties), background: "#6f7f8f" }} /> : DEBUG.includes("media") ? <MediaVideo src={p.src as string} trimBefore={p.startFrom} muted={p.muted} style={p.style as React.CSSProperties} objectFit="fill" /> : getRemotionEnvironment().isRendering ? <OffthreadVideo {...p} /> : <Video {...(p as React.ComponentProps<typeof Video>)} />;
