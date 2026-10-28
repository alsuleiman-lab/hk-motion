import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { useT, kufiF } from "./MG";
import { WarmBase, clamp } from "./PortraitKit";
import { BRAND } from "./brand";

/**
 * Scene transitions in the channel identity (user 2026-10-28: «صمّمها» — six new transitions to choose from in the gallery).
 * Every transition takes the outgoing scene `a` and the incoming scene `b` and runs from `at` for `dur` seconds; before it only `a` shows,
 * after it only `b`. Identity colours only (src/brand.ts); no white flash. Played between real scenes in src/TransitionsLab.tsx.
 */
type Tr = { at: number; dur?: number; a: React.ReactNode; b: React.ReactNode };
const inOut = (x: number) => { const u = clamp(x); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
const useP = (at: number, dur: number) => clamp((useT() - at) / dur);
const Fill: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode }> = ({ style, children }) => <AbsoluteFill style={style}>{children}</AbsoluteFill>;

/** 1) push: the new scene pushes the old one out to the left, with a light fade and motion blur (the house «slide + fade») */
export const TrPush: React.FC<Tr> = ({ at, dur = 0.8, a, b }) => {
  const { width: W } = useVideoConfig();
  const p = useP(at, dur), e = inOut(p), blur = Math.sin(Math.PI * p) * 8;
  if (p <= 0) return <Fill>{a}</Fill>;
  if (p >= 1) return <Fill>{b}</Fill>;
  return (
    <>
      <Fill style={{ transform: `translateX(${-e * W}px)`, opacity: 1 - 0.5 * e, filter: `blur(${blur}px)` }}>{a}</Fill>
      <Fill style={{ transform: `translateX(${(1 - e) * W}px)`, opacity: 0.5 + 0.5 * e, filter: `blur(${blur}px)` }}>{b}</Fill>
      <div style={{ position: "absolute", top: 0, bottom: 0, left: (1 - e) * W - 6, width: 12, background: BRAND.accent, opacity: Math.sin(Math.PI * p) }} />
    </>
  );
};

/** 2) accent wipe: a slanted band in the accent colour sweeps from right to left and uncovers the new scene behind it */
export const TrAccentWipe: React.FC<Tr> = ({ at, dur = 0.75, a, b }) => {
  const { width: W, height: H } = useVideoConfig();
  const p = useP(at, dur), e = inOut(p), k = H * 0.2, band = 54;
  if (p <= 0) return <Fill>{a}</Fill>;
  if (p >= 1) return <Fill>{b}</Fill>;
  const x = W + k + band - e * (W + 2 * k + 2 * band);   // the band's left edge at the top
  return (
    <>
      <Fill>{a}</Fill>
      <Fill style={{ clipPath: `polygon(${x + band}px 0, ${W + 2 * k}px 0, ${W + 2 * k}px ${H}px, ${x + band - k}px ${H}px)` }}>{b}</Fill>
      <div style={{ position: "absolute", inset: 0, background: BRAND.accent, clipPath: `polygon(${x}px 0, ${x + band}px 0, ${x + band - k}px ${H}px, ${x - k}px ${H}px)` }} />
      <div style={{ position: "absolute", inset: 0, background: BRAND.card, clipPath: `polygon(${x + band}px 0, ${x + band + 6}px 0, ${x + band + 6 - k}px ${H}px, ${x + band - k}px ${H}px)` }} />
    </>
  );
};

/** 3) zoom through: the old scene pushes in and fades, the new one settles from a slight zoom — calm, for a continuing thought */
export const TrZoomFade: React.FC<Tr> = ({ at, dur = 0.7, a, b }) => {
  const p = useP(at, dur), e = inOut(p);
  if (p <= 0) return <Fill>{a}</Fill>;
  if (p >= 1) return <Fill>{b}</Fill>;
  return (
    <>
      <Fill style={{ transform: `scale(${1 + 0.14 * e})`, opacity: 1 - e, filter: `blur(${6 * e}px)` }}>{a}</Fill>
      <Fill style={{ transform: `scale(${1.08 - 0.08 * e})`, opacity: e, filter: `blur(${6 * (1 - e)}px)` }}>{b}</Fill>
    </>
  );
};

/** 4) page turn: the old scene turns like a book page on its right-hand spine (Arabic books open that way) and shows the new one under it */
export const TrPageTurn: React.FC<Tr> = ({ at, dur = 0.9, a, b }) => {
  const p = useP(at, dur), e = inOut(p);
  if (p <= 0) return <Fill>{a}</Fill>;
  if (p >= 1) return <Fill>{b}</Fill>;
  return (
    <AbsoluteFill style={{ perspective: 2400, background: BRAND.base }}>
      <Fill>{b}</Fill>
      <Fill style={{ background: `rgba(6,12,24,${0.45 * (1 - e)})` }} />
      <Fill style={{ transformOrigin: "100% 50%", transform: `rotateY(${-105 * e}deg)`, backfaceVisibility: "hidden", boxShadow: `0 0 ${60 * e}px rgba(0,0,0,.5)` }}>
        {a}
        <Fill style={{ background: `linear-gradient(90deg, rgba(6,12,24,${0.55 * e}), rgba(6,12,24,0) 70%)` }} />
      </Fill>
    </AbsoluteFill>
  );
};

/** 5) the decorated doors: two halves of the decorated base close from the sides, meet at an accent seam, and open on the new scene */
export const TrDoors: React.FC<Tr> = ({ at, dur = 1.0, a, b }) => {
  const { width: W } = useVideoConfig();
  const p = useP(at, dur);
  if (p <= 0) return <Fill>{a}</Fill>;
  if (p >= 1) return <Fill>{b}</Fill>;
  const close = p < 0.5 ? inOut(p / 0.42) : inOut((1 - p) / 0.42), half = W / 2;
  const door = (side: "left" | "right") => (
    <div style={{ position: "absolute", top: 0, bottom: 0, width: half, [side]: (close - 1) * half, overflow: "hidden", boxShadow: "0 0 40px rgba(0,0,0,.45)" }}>
      <div style={{ position: "absolute", top: 0, bottom: 0, width: W, [side]: 0 }}><WarmBase /></div>
      <div style={{ position: "absolute", top: 0, bottom: 0, width: 8, [side === "left" ? "right" : "left"]: 0, background: BRAND.accent }} />
    </div>
  );
  return (
    <>
      <Fill>{p < 0.5 ? a : b}</Fill>
      {door("left")}{door("right")}
    </>
  );
};

/** 6) section card: for a change of topic — the decorated base rises over the old scene with the new section's title, then lifts away */
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
