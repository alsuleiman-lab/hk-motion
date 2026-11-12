import React from "react";
import { kufiF, useSp, useT } from "./MG";
import { BRAND } from "./brand";

/**
 * KhaamKit — two elements taken from the «موشن خام» package (analysed 2026-11-09, user: «استفد منها»), redrawn in the channel identity (src/brand.ts):
 *  Keycaps  : the spoken words land one by one on keyboard-key pills (the latest spoken word lights up) — a word-timed caption style.
 *  Burst    : short lines radiate from a point for 0.3 s — emphasis on a number or a stamp.
 * All times are in SECONDS (`at`); nothing appears before its `at` (PREFERENCES: no element before it is spoken).
 */
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const outCubic = (u: number) => 1 - Math.pow(1 - clamp(u), 3);

/** key-pill captions: words = [{ w, at }] with `at` = the second each word is spoken; the group sits centred at (x, y) and reads right→left */
export const Keycaps: React.FC<{ words: { w: string; at: number }[]; x: number; y: number; size?: number }> = ({ words, x, y, size = 64 }) => {
  const t = useT(0);
  const shown = words.filter((k) => t >= k.at);
  if (!shown.length) return null;
  const last = shown[shown.length - 1];
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)", display: "flex", direction: "rtl", gap: size * 0.28, whiteSpace: "nowrap" }}>
      {shown.map((k, i) => <Key key={i} word={k.w} at={k.at} size={size} active={k === last} />)}
    </div>
  );
};
const Key: React.FC<{ word: string; at: number; size: number; active: boolean }> = ({ word, at, size, active }) => {
  const s = useSp(at, 12, 220);
  return (
    <div style={{ transform: `translateY(${(1 - s) * 14}px) scale(${0.85 + 0.15 * s})`, opacity: clamp(s * 3), padding: `${size * 0.1}px ${size * 0.42}px ${size * 0.2}px`, borderRadius: size * 0.22, fontFamily: kufiF, fontSize: size, lineHeight: 1.25,
      background: active ? BRAND.accent : BRAND.card, color: active ? BRAND.onAccent : BRAND.ink, border: "3px solid rgba(0,0,0,.25)", boxShadow: `0 ${size * 0.16}px 0 ${BRAND.base3}, 0 ${size * 0.3}px ${size * 0.4}px rgba(0,0,0,.35)` }}>{word}</div>
  );
};

/** radiating emphasis lines (0.3 s) around (x, y): r = start radius, n = line count */
export const Burst: React.FC<{ at: number; x: number; y: number; r?: number; n?: number; len?: number; color?: string; lw?: number }> = ({ at, x, y, r = 120, n = 10, len = 46, color = BRAND.accent, lw = 8 }) => {
  const p = clamp(useT(at) / 0.3);
  if (p <= 0 || p >= 1) return null;
  const d0 = r + 26 * outCubic(p);
  return (
    <svg width={2 * (r + 120)} height={2 * (r + 120)} style={{ position: "absolute", left: x - (r + 120), top: y - (r + 120), overflow: "visible", opacity: 1 - p }}>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2, c = r + 120;
        return <line key={i} x1={c + Math.cos(a) * d0} y1={c + Math.sin(a) * d0} x2={c + Math.cos(a) * (d0 + len)} y2={c + Math.sin(a) * (d0 + len)} stroke={color} strokeWidth={lw} strokeLinecap="round" />;
      })}
    </svg>
  );
};

