import React from "react";
import { T, kufiF, naskhF, useSp, useT } from "./MG";
import { clamp } from "./PortraitKit";

/**
 * NameCards — the Sheikh's name tag. Of the ten designs offered (user 2026-10-27) the gallery kept 1 (paper card) and 3 (pinned label) on 2026-10-28; the montage engine draws 1 by default.
 * Each card is centred on (x, y), enters at `at` (seconds), and takes its colours from the active MG theme (T), like the rest of the kit.
 */
const TITLE = "الشيخ";
const NAME = "محمد بن شمس الدين";
type P = { at: number; x: number; y: number };
const Box: React.FC<{ x: number; y: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ x, y, style, children }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)", direction: "rtl", whiteSpace: "nowrap", ...style }}>{children}</div>
);

/** 1) paper card with the accent edge on the right — the item-card family */
export const NameCard1: React.FC<P> = ({ at, x, y }) => {
  const t = useT(at), u = clamp(t / 0.6), w = 1 - Math.pow(1 - u, 3);   // 0 → 1 as the card unrolls from its right edge
  if (t < 0) return null;
  return (
    <Box x={x} y={y}>
      <div style={{ position: "relative" }}>
        <div style={{ background: T.card, borderRight: `12px solid ${T.accent}`, borderRadius: 16, padding: "14px 34px 16px", boxShadow: "0 16px 32px rgba(0,0,0,.3)", textAlign: "right", clipPath: `inset(-40px -40px -40px ${(1 - w) * 100}%)` }}>
          <div style={{ fontFamily: kufiF, fontSize: 26, color: T.accent }}>{TITLE}</div>
          <div style={{ fontFamily: kufiF, fontSize: 50, color: T.ink, lineHeight: 1.15 }}>{NAME}</div>
        </div>
        {w < 1 ? <div style={{ position: "absolute", top: -6, bottom: -6, width: 26, left: `${(1 - w) * 100}%`, transform: "translateX(-50%)", borderRadius: 13, background: `linear-gradient(90deg, ${T.navy}, ${T.accent} 45%, ${T.card} 60%, ${T.accent} 75%, ${T.navy})`, boxShadow: "0 8px 18px rgba(0,0,0,.35)", opacity: Math.min(1, (1 - w) * 6) }} /> : null}
      </div>
    </Box>
  );
};


/** 3) pinned label: cream paper, yellow tape, slight tilt (the pinned-photo family) */
export const NameCard3: React.FC<P> = ({ at, x, y }) => {
  const s = useSp(at, 12, 170);
  return (
    <Box x={x} y={y} style={{ opacity: clamp(s * 2), transform: `translate(-50%,-50%) rotate(-2deg) scale(${0.7 + 0.3 * s})` }}>
      <div style={{ position: "relative", background: "#f6f8fa", borderRadius: 20, padding: "22px 44px 20px", boxShadow: "0 16px 30px rgba(0,0,0,.35)", textAlign: "center" }}>
        <div style={{ position: "absolute", left: "50%", top: -16, width: 80, height: 30, marginLeft: -40, background: "rgba(47,95,148,.92)", transform: "rotate(-5deg)", boxShadow: "0 2px 4px rgba(0,0,0,.25)" }} />
        <div style={{ fontFamily: naskhF, fontSize: 30, color: T.gray }}>{TITLE}</div>
        <div style={{ fontFamily: naskhF, fontSize: 56, color: T.ink, lineHeight: 1.1 }}>{NAME}</div>
      </div>
    </Box>
  );
};








export const NAME_CARDS = { NameCard1, NameCard3 };
