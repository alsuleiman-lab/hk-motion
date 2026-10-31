import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { useT, kufiF } from "./MG";
import { WarmBase, clamp } from "./PortraitKit";
import { BRAND } from "./brand";

/**
 * Scene transitions in the channel identity (user 2026-10-28: «صمّمها» — the transitions kept in the gallery).
 * Every transition takes the outgoing scene `a` and the incoming scene `b` and runs from `at` for `dur` seconds; before it only `a` shows,
 * after it only `b`. Identity colours only (src/brand.ts); no white flash. Played between real scenes in src/TransitionsLab.tsx.
 */
type Tr = { at: number; dur?: number; a: React.ReactNode; b: React.ReactNode };
const inOut = (x: number) => { const u = clamp(x); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
const useP = (at: number, dur: number) => clamp((useT() - at) / dur);
const Fill: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode }> = ({ style, children }) => <AbsoluteFill style={style}>{children}</AbsoluteFill>;

/** section card: for a change of topic — the decorated base rises over the old scene with the new section's title, then lifts away */
export const TrSection: React.FC<Tr & { title: string; sub?: string }> = ({ at, dur = 1.8, a, b, title, sub }) => {
  const { height: H } = useVideoConfig();
  const p = useP(at, dur);
  if (p <= 0) return <Fill>{a}</Fill>;
  if (p >= 1) return <Fill>{b}</Fill>;
  const up = inOut(p / 0.25), away = inOut((p - 0.75) / 0.25), y = (1 - up) * H - away * H;
  const chip = inOut((p - 0.18) / 0.2), out = 1 - inOut((p - 0.7) / 0.1);
  return (
    <>
      <Fill>{p < 0.5 ? a : b}</Fill>
      <div style={{ position: "absolute", left: 0, right: 0, top: y, height: H, overflow: "hidden", boxShadow: "0 -20px 50px rgba(0,0,0,.45)" }}>
        <WarmBase />
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%,-50%) translateY(${(1 - chip) * 40}px)`, opacity: chip * out, direction: "rtl", textAlign: "center" }}>
          <div style={{ width: 90 * chip, height: 8, background: BRAND.accent, borderRadius: 4, margin: "0 auto 22px" }} />
          <div style={{ background: BRAND.card, color: BRAND.ink, fontFamily: kufiF, fontSize: 72, padding: "14px 54px 22px", borderRadius: 18, borderBottom: `8px solid ${BRAND.accent}`, boxShadow: "0 20px 40px rgba(0,0,0,.35)", whiteSpace: "nowrap" }}>{title}</div>
          {sub ? <div style={{ marginTop: 18, fontFamily: kufiF, fontSize: 34, color: BRAND.light }}>{sub}</div> : null}
        </div>
      </div>
    </>
  );
};
