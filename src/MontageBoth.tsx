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
 * Three separate black panels on the Studio's own background (no black sheet behind them; user 2026-11-16: «لكل واحدة شاشة سوداء، وأريد عمود للتحديد»): a STRIP across the
 * TOP for the Studio's «تحديد» button and its list of saved frames (src/studioTools.ts moves them onto it; user 2026-11-17, from the phone: «التحديد يكون فوق، عرضي، لتكون
 * مساحة المشاهدة تحته» — it was a column on the left, which ate the width of a narrow viewer), then the portrait screen and the landscape one below it. The strip is about
 * 44 screen px high whatever the viewer's size (measured live), the two screens take the rest.
 * Final renders never use this composition: it refuses to run while rendering (render the landscape and the portrait compositions one after the other).
 */
const PW = 1080, PH = 1920, LW = Math.round((1920 * PH) / 1080), M = 20, GAP = 70;   // portrait 1080×1920; landscape 1920×1080 scaled ×1.78 → 3413×1920
export const BOTH = { W: M + PW + GAP + LW + M, H: M + PH + M };

const screen = (left: number): React.CSSProperties => ({ position: "absolute", left, top: M, width: left === M ? PW : LW, height: PH, overflow: "hidden", background: "#000", boxShadow: "0 0 0 3px rgba(255,255,255,.35)" });

export const MontageBoth: React.FC<{ spec: MontageSpec }> = ({ spec }) => {
  if (getRemotionEnvironment().isRendering) throw new Error("تركيبة «الاثنان معاً» للمعاينة فقط: لا تُرندر. ارندر العرضي ثم الطولي كلاً على حدة بتركيبتيهما.");
  const hostRef = React.useRef<HTMLDivElement>(null);
  const [share, setStripShare] = React.useState(44 / 54);   // the strip's part of the top band (the rest is the gap)
  const [res, setRes] = React.useState(0);   // canvas px of the strip on top (≈ 44 screen px + a 10 px gap) for the «تحديد» button and list
  React.useEffect(() => {
    const t = window.setInterval(() => {
      const host = hostRef.current?.getBoundingClientRect();
      if (!host || !host.width) return;
      const k = host.width / BOTH.W, strip = Math.max(26, Math.min(44, host.height * 0.2));   // screen px: a fifth of the viewer's height, 26…44 (a phone's viewer is small)
      const r = Math.min(BOTH.H * 0.3, Math.round((strip + 10) / k / 4) * 4);   // strip + a 10 px gap → canvas px
      setStripShare(strip / (strip + 10));
      setRes((o) => (Math.abs(o - r) < 8 ? o : r));
    }, 400);
    return () => window.clearInterval(t);
  }, []);
  const c = (BOTH.H - res) / BOTH.H;   // the two screens as one block, scaled into what is left under the strip
  return (
    <AbsoluteFill ref={hostRef}>
      <div id="__both_col" style={{ position: "absolute", left: 0, top: 0, width: BOTH.W, height: Math.max(0, res * share), background: "#000", boxShadow: "0 0 0 3px rgba(255,255,255,.35)" }} />
      <div style={{ position: "absolute", left: (BOTH.W - BOTH.W * c) / 2, top: res, width: BOTH.W, height: BOTH.H, transform: `scale(${c})`, transformOrigin: "0 0" }}>
      <div id="__both_port" style={screen(M)}>
        <Sequence layout="none" width={PW} height={PH} showInTimeline={false}><MontageFromSpec spec={spec} muted /></Sequence>
      </div>
      <div id="__both_land" style={screen(M + PW + GAP)}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${PH / 1080})`, transformOrigin: "0 0" }}>
          <Sequence layout="none" width={1920} height={1080} showInTimeline={false}><MontageFromSpec spec={spec} /></Sequence>
        </div>
      </div>
      </div>
    </AbsoluteFill>
  );
};
