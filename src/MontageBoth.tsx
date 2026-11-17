import React from "react";
import { AbsoluteFill, Sequence, getRemotionEnvironment } from "remotion";
import { MontageFromSpec } from "./MontageSpec";
import type { MontageSpec } from "./MontageSpec";

/**
 * PREVIEW ONLY: the SAME spec as TWO SCREENS side by side in the Studio's own viewer, a portrait screen (left) and a landscape screen (right), each at its REAL size
 * (user 2026-11-16, with his screenshot: «شاشة طولي وشاشة عرضي متجاورتان»), played by the Studio's own transport and timeline, no control of ours. One composition =
 * one clock, so play / pause / seek move both. Each screen runs the real montage code at its real size: <Sequence width height layout="none"> overrides what
 * useVideoConfig() returns inside it and MontageFromSpec picks its orientation from that size (width > height = landscape); (no scaling of either: see BOTH below). Nothing in the gallery elements changes. Only the landscape screen has the sound.
 * Three separate black panels on the Studio's own background (no black sheet behind them; user 2026-11-16: «لكل واحدة شاشة سوداء، وأريد عمود للتحديد»): a STRIP across the
 * TOP for the Studio's «تحديد» button and its list of saved frames (src/studioTools.ts moves them onto it; user 2026-11-17, from the phone: «التحديد يكون فوق، عرضي، لتكون
 * مساحة المشاهدة تحته» — it was a column on the left, which ate the width of a narrow viewer), then the portrait screen and the landscape one below it. The strip is about
 * 44 screen px high whatever the viewer's size (measured live), the two screens take the rest.
 * Final renders never use this composition: it refuses to run while rendering (render the landscape and the portrait compositions one after the other).
 */
/* BOTH SCREENS AT THEIR REAL SIZE, packed tight (user 2026-11-17, from his phone: «شو استفدنا، لسه مساحات فارغة يمين ويسار وفوق وتحت»): the landscape screen used to be scaled up to the
   portrait's height (a 5000×1960 canvas, 2.55:1), so a phone's viewer fitted it by width and left most of its height empty. Real sizes: 1080×1920 + 1920×1080 side by side, the landscape
   one centred in height = a 3070×1960 canvas (1.57:1); on a phone the screens come out about 2.7 times bigger, on a desktop the portrait is bigger and the landscape a bit smaller. */
const PW = 1080, PH = 1920, LW = 1920, LH = 1080, M = 20, GAP = 30;
export const BOTH = { W: M + PW + GAP + LW + M, H: M + PH + M };
/* the PHONE form (user 2026-11-17: «حتى الآن في مساحات غير مستغلة»): a phone's viewer is about SQUARE, so the canvas is too (2010×1960) and nothing is left empty: the portrait screen on the
   left at 92 %; the landscape screen in a column on its right, scaled to that column (about 0.49); under the landscape one the «تحديد» button and its list (the Studio's own tools sit on that
   black panel). */
const PS = 0.92, PWS = Math.round(PW * PS), PHS = Math.round(PH * PS);   // the portrait screen at 92 % so the landscape one beside it can be bigger (balanced)
const RW = 2010 - M - PWS - GAP - M, RH = Math.round((RW * LH) / LW);
export const BOTHV = { W: M + PWS + GAP + RW + M, H: M + PHS + M };

const screen = (left: number, w: number, h: number, top: number): React.CSSProperties => ({ position: "absolute", left, top, width: w, height: h, overflow: "hidden", background: "#000", boxShadow: "0 0 0 3px rgba(255,255,255,.35)" });

export const MontageBoth: React.FC<{ spec: MontageSpec; phone?: boolean }> = ({ spec, phone }) => {
  const B = phone ? BOTHV : BOTH;
  if (getRemotionEnvironment().isRendering) throw new Error("تركيبة «الاثنان معاً» للمعاينة فقط: لا تُرندر. ارندر العرضي ثم الطولي كلاً على حدة بتركيبتيهما.");
  const hostRef = React.useRef<HTMLDivElement>(null);
  const [share, setStripShare] = React.useState(44 / 54);   // the strip's part of the top band (the rest is the gap)
  const [res, setRes] = React.useState(0);   // canvas px of the strip on top (≈ 44 screen px + a 10 px gap) for the «تحديد» button and list
  React.useEffect(() => {
    const t = window.setInterval(() => {
      const host = hostRef.current?.getBoundingClientRect();
      if (!host || !host.width) return;
      const k = host.width / B.W, strip = Math.max(26, Math.min(44, host.height * 0.2));   // screen px: a fifth of the viewer's height, 26…44 (a phone's viewer is small)
      const r = Math.min(B.H * 0.3, Math.round((strip + 10) / k / 4) * 4);   // strip + a 10 px gap → canvas px
      setStripShare(strip / (strip + 10));
      setRes((o) => (Math.abs(o - r) < 8 ? o : r));
    }, 400);
    return () => window.clearInterval(t);
  }, []);
  const top = phone ? 0 : res, c = (B.H - top) / B.H;   // phone form: no strip on top, the whole canvas is used   // the two screens as one block, scaled into what is left under the strip
  return (
    <AbsoluteFill ref={hostRef}>
      {phone
        ? <div id="__both_col" style={{ position: "absolute", left: (B.W - B.W * c) / 2 + (M + PW + GAP) * c, top: (M + RH + GAP) * c, width: RW * c, height: (PHS - RH - GAP) * c, background: "#000", boxShadow: "0 0 0 3px rgba(255,255,255,.35)" }} />
        : <div id="__both_col" style={{ position: "absolute", left: 0, top: 0, width: B.W, height: Math.max(0, res * share), background: "#000", boxShadow: "0 0 0 3px rgba(255,255,255,.35)" }} />}
      <div style={{ position: "absolute", left: (B.W - B.W * c) / 2, top, width: B.W, height: B.H, transform: `scale(${c})`, transformOrigin: "0 0" }}>
      <div id="__both_port" style={phone ? screen(M, PWS, PHS, M) : screen(M, PW, PH, M)}>
        <div style={{ position: "absolute", left: 0, top: 0, width: PW, height: PH, transform: phone ? `scale(${PS})` : undefined, transformOrigin: "0 0" }}>
          <Sequence layout="none" width={PW} height={PH} showInTimeline={false}><MontageFromSpec spec={spec} muted /></Sequence>
        </div>
      </div>
      <div id="__both_land" style={phone ? screen(M + PW + GAP, RW, RH, M) : screen(M + PW + GAP, LW, LH, M + (PH - LH) / 2)}>
        <div style={{ position: "absolute", left: 0, top: 0, width: LW, height: LH, transform: phone ? `scale(${RW / LW})` : undefined, transformOrigin: "0 0" }}>
          <Sequence layout="none" width={LW} height={LH} showInTimeline={false}><MontageFromSpec spec={spec} /></Sequence>
        </div>
      </div>
      </div>
    </AbsoluteFill>
  );
};
