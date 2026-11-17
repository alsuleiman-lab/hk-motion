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
 * 340 canvas px high, part of the canvas (nothing is scaled down for it), the two screens fill the whole width under it.
 * Final renders never use this composition: it refuses to run while rendering (render the landscape and the portrait compositions one after the other).
 */
/* THE TWO SCREENS FILL THE WHOLE WIDTH (user 2026-11-17, from his phone, twice: «لا يزال هناك مساحة يمينا ويسارا، كبّر الفيديو العرضي»): the strip for the «تحديد» tools used to be carved out of
   the canvas by scaling everything down, which left empty margins left and right. Now the strip is part of the canvas (SH canvas px, full width) and nothing is scaled: the portrait screen at 85 %
   (918×1632) and the landscape one beside it taking ALL the rest of the width (2082×1171, 1.08 of its real size), centred in height. 3070×1942 canvas. */
const PW = 1080, PH = 1920, LW = 1920, LH = 1080, M = 20, GAP = 30;
const SH = 340;   // the top strip (the button and the saved frames), canvas px, with a 12 px gap under it
const PS = 0.85, PWB = Math.round(PW * PS), PHB = Math.round(PH * PS), BW = M + PW + GAP + LW + M;
const LWB = BW - M - PWB - GAP - M, LHB = Math.round((LWB * LH) / LW);
export const BOTH = { W: BW, H: SH + M + PHB + M };
/* the PHONE form (user 2026-11-17: «حتى الآن في مساحات غير مستغلة»): a phone's viewer is about SQUARE, so the canvas is too (2010×1816) and nothing is left empty: the portrait screen on the
   left at 92 %; the landscape screen in a column on its right, scaled to that column (about 0.49); under the landscape one the «تحديد» button and its list (the Studio's own tools sit on that
   black panel). */
const PSV = 0.92, PWS = Math.round(PW * PSV), PHS = Math.round(PH * PSV);
const RW = 2010 - M - PWS - GAP - M, RH = Math.round((RW * LH) / LW);
export const BOTHV = { W: M + PWS + GAP + RW + M, H: M + PHS + M };

const screen = (left: number, w: number, h: number, top: number): React.CSSProperties => ({ position: "absolute", left, top, width: w, height: h, overflow: "hidden", background: "#000", boxShadow: "0 0 0 3px rgba(255,255,255,.35)" });
const scaled = (w: number, h: number, k: number): React.CSSProperties => ({ position: "absolute", left: 0, top: 0, width: w, height: h, transform: k === 1 ? undefined : `scale(${k})`, transformOrigin: "0 0" });

export const MontageBoth: React.FC<{ spec: MontageSpec; phone?: boolean }> = ({ spec, phone }) => {
  if (getRemotionEnvironment().isRendering) throw new Error("تركيبة «الاثنان معاً» للمعاينة فقط: لا تُرندر. ارندر العرضي ثم الطولي كلاً على حدة بتركيبتيهما.");
  const panel: React.CSSProperties = { position: "absolute", background: "#000", boxShadow: "0 0 0 3px rgba(255,255,255,.35)" };
  const pl = phone ? { port: screen(M, PWS, PHS, M), land: screen(M + PWS + GAP, RW, RH, M), kp: PSV, kl: RW / LW }
    : { port: screen(M, PWB, PHB, SH + M), land: screen(M + PWB + GAP, LWB, LHB, SH + M + (PHB - LHB) / 2), kp: PS, kl: LWB / LW };
  return (
    <AbsoluteFill>
      {phone
        ? <div id="__both_col" style={{ ...panel, left: M + PWS + GAP, top: M + RH + GAP, width: RW, height: PHS - RH - GAP }} />
        : <div id="__both_col" style={{ ...panel, left: M, top: 0, width: BW - 2 * M, height: SH - 12 }} />}
      <div id="__both_port" style={pl.port}>
        <div style={scaled(PW, PH, pl.kp)}>
          <Sequence layout="none" width={PW} height={PH} showInTimeline={false}><MontageFromSpec spec={spec} muted /></Sequence>
        </div>
      </div>
      <div id="__both_land" style={pl.land}>
        <div style={scaled(LW, LH, pl.kl)}>
          <Sequence layout="none" width={LW} height={LH} showInTimeline={false}><MontageFromSpec spec={spec} /></Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};
