import React from "react";
import { AbsoluteFill, Sequence, getRemotionEnvironment } from "remotion";
import { MontageFromSpec } from "./MontageSpec";
import type { MontageSpec } from "./MontageSpec";

/**
 * PREVIEW ONLY: the SAME spec as TWO SCREENS side by side in the Studio's own viewer, a portrait screen (left) and a landscape screen (right) of the SAME HEIGHT
 * (user 2026-11-16, with his screenshot: «شاشة طولي وشاشة عرضي متجاورتان»), played by the Studio's own transport and timeline, no control of ours. One composition =
 * one clock, so play / pause / seek move both. Each screen runs the real montage code at its real size: <Sequence width height layout="none"> overrides what
 * useVideoConfig() returns inside it and MontageFromSpec picks its orientation from that size (width > height = landscape); the landscape one is then scaled up
 * (CSS transform, like a player does) to the portrait's height. Nothing in the gallery elements changes. Only the landscape screen has the sound.
 * The Studio's «تحديد» button and its list of saved frames (src/studioTools.ts) stand in the empty strip LEFT of the viewer: when the viewer is so narrow that this
 * composition reaches under them, the two screens shrink together and move right just enough to leave that strip free (measured live; nothing changes when there is room).
 * Final renders never use this composition: it refuses to run while rendering (render the landscape and the portrait compositions one after the other).
 */
const PW = 1080, PH = 1920, LW = Math.round((1920 * PH) / 1080), M = 20, GAP = 30;   // portrait 1080×1920; landscape 1920×1080 scaled ×1.78 → 3413×1920
export const BOTH = { W: M + PW + GAP + LW + M, H: M + PH + M };

const screen = (left: number): React.CSSProperties => ({ position: "absolute", left, top: M, width: left === M ? PW : LW, height: PH, overflow: "hidden", background: "#000", boxShadow: "0 0 0 3px rgba(255,255,255,.35)" });

export const MontageBoth: React.FC<{ spec: MontageSpec }> = ({ spec }) => {
  if (getRemotionEnvironment().isRendering) throw new Error("تركيبة «الاثنان معاً» للمعاينة فقط: لا تُرندر. ارندر العرضي ثم الطولي كلاً على حدة بتركيبتيهما.");
  const hostRef = React.useRef<HTMLDivElement>(null);
  const [res, setRes] = React.useState(0);   // canvas px kept free on the left for the «تحديد» strip
  React.useEffect(() => {
    const t = window.setInterval(() => {
      const host = hostRef.current?.getBoundingClientRect(), box = document.getElementById("__frame_marks_box")?.getBoundingClientRect();
      if (!host || !box || !host.width || box.width === 0) { setRes((o) => (o === 0 ? o : 0)); return; }
      const need = Math.max(0, box.right + 10 - host.left) / (host.width / BOTH.W);   // screen px → canvas px
      const r = Math.min(BOTH.W * 0.6, Math.round(need / 4) * 4);
      setRes((o) => (Math.abs(o - r) < 8 ? o : r));
    }, 400);
    return () => window.clearInterval(t);
  }, []);
  const c = (BOTH.W - res) / BOTH.W;   // the two screens as one block, scaled into what is left
  return (
    <AbsoluteFill ref={hostRef} style={{ background: "#0b0d12" }}>
      <div style={{ position: "absolute", left: res, top: (BOTH.H - BOTH.H * c) / 2, width: BOTH.W, height: BOTH.H, transform: `scale(${c})`, transformOrigin: "0 0" }}>
      <div style={screen(M)}>
        <Sequence layout="none" width={PW} height={PH} showInTimeline={false}><MontageFromSpec spec={spec} muted /></Sequence>
      </div>
      <div style={screen(M + PW + GAP)}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${PH / 1080})`, transformOrigin: "0 0" }}>
          <Sequence layout="none" width={1920} height={1080} showInTimeline={false}><MontageFromSpec spec={spec} /></Sequence>
        </div>
      </div>
      </div>
    </AbsoluteFill>
  );
};
