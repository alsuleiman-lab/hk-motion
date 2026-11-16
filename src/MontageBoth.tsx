import React from "react";
import { AbsoluteFill, Sequence, getRemotionEnvironment } from "remotion";
import { MontageFromSpec } from "./MontageSpec";
import type { MontageSpec } from "./MontageSpec";

/**
 * PREVIEW ONLY: the SAME spec drawn twice on one canvas, landscape (1920×1080) and portrait (1080×1920) side by side, on ONE clock
 * (user 2026-11-16: «يطلع العرضي والطولي جنب بعض، يشتغلان بنفس اللحظة»). One composition = one frame counter, so play / pause / seek /
 * scrub move both together; one spec file = one edit shows in both.
 *
 * How: <Sequence width height layout="none"> overrides what useVideoConfig() returns for everything inside it, and MontageFromSpec already
 * picks its orientation from that size (width > height = landscape). So each side runs the real montage code at its real size: nothing in the
 * gallery elements changes, no scaled copy, no second layout. Only the landscape side plays the sound (the portrait side is `muted`).
 * Final renders never use this composition (the two files are rendered one after the other as before): it refuses to run while rendering.
 */
export const BOTH = {
  /** canvas: margin, portrait, gap, landscape, margin (landscape on the right, the reading order of «العرضي والطولي») */
  M: 40, GAP: 80, LABEL: 110,
  W: 40 + 1080 + 80 + 1920 + 40,
  H: 110 + 1920 + 40,
};

const frame = (left: number, top: number, w: number, h: number): React.CSSProperties => ({
  position: "absolute", left, top, width: w, height: h, overflow: "hidden", background: "#000", boxShadow: "0 0 0 3px rgba(255,255,255,.22), 0 18px 60px rgba(0,0,0,.6)",
});
const label = (left: number, w: number, text: string): React.ReactNode => (
  <div style={{ position: "absolute", left, top: 28, width: w, textAlign: "center", color: "#fff", opacity: 0.85, fontFamily: "Noto Kufi Arabic, sans-serif", fontSize: 46, direction: "rtl" }}>{text}</div>
);

export const MontageBoth: React.FC<{ spec: MontageSpec }> = ({ spec }) => {
  if (getRemotionEnvironment().isRendering) throw new Error("تركيبة «الاثنان معاً» للمعاينة فقط: لا تُرندر. ارندر العرضي ثم الطولي كلاً على حدة بتركيبتيهما.");
  const { M, GAP, LABEL } = BOTH, pLeft = M, lLeft = M + 1080 + GAP, pTop = LABEL, lTop = LABEL + (1920 - 1080) / 2;
  return (
    <AbsoluteFill style={{ background: "#0b0d12" }}>
      {label(pLeft, 1080, "طولي")}
      {label(lLeft, 1920, "عرضي")}
      <div style={frame(pLeft, pTop, 1080, 1920)}>
        <Sequence layout="none" width={1080} height={1920} showInTimeline={false}><MontageFromSpec spec={spec} muted /></Sequence>
      </div>
      <div style={frame(lLeft, lTop, 1920, 1080)}>
        <Sequence layout="none" width={1920} height={1080} showInTimeline={false}><MontageFromSpec spec={spec} /></Sequence>
      </div>
    </AbsoluteFill>
  );
};
