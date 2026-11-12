import React from "react";
import { AbsoluteFill } from "remotion";
import { useT } from "./MG";
import { BRAND, alpha } from "./brand";
import { FONT_NASKH, FONT_TEXT } from "./localFonts";
import { TEXT } from "./EuKit";
import { BlendPanel, ease, clamp } from "./VerseKit";

/**
 * HadithKit — the hadith ways the user kept from the choice page (2026-11-12), try-only until approved in the gallery.
 *  HadithQuote : his frame slides right; the left half is the same night panel as VerseNoor (video palette), melting into his video by transparency (no seam line);
 *                big gold quote marks, the matn in large naskh written phrase by phrase as he says it, the key word underlined in gold, the source as a footnote.
 *  HadithIsnad : ONLY when he recites the isnad (user: «نعتمده فقط إذا ذكرت الإسناد»): each narrator is a node that appears when named, joined to the previous one
 *                by a thick, clear gold line, down to the Prophet ﷺ; then the matn card opens under the chain with its source.
 * Every text appears at the second he says it (`at`), never before.
 */
const N = `"Amiri", ${TEXT}`;
export type HadithPhrase = { text: string; at: number; key?: string };

/** a phrase written in from right to left at `at`; `key` (a word inside it) gets a gold bar under it a moment later */
const Phrase: React.FC<{ p: HadithPhrase; t: number; size: number; color: string; dur?: number }> = ({ p, t, size, color, dur = 0.7 }) => {
  const u = ease((t - p.at) / dur);
  const parts = p.key && p.text.includes(p.key) ? p.text.split(p.key) : [p.text];
  const bar = ease((t - p.at - dur - 0.1) / 0.4);
  return (
    <span style={{ display: "inline-block", margin: `0 ${size * 0.14}px`, fontFamily: N, fontWeight: 700, fontSize: size, color, visibility: u > 0 ? "visible" : "hidden", clipPath: `inset(-40% 0 -40% ${(1 - u) * 100}%)` }}>
      {parts.length === 2 ? (
        <>{parts[0]}<span style={{ position: "relative", display: "inline-block", color: bar > 0.5 ? "#fff3c4" : color }}>
          <span style={{ position: "absolute", left: 0, right: 0, bottom: size * 0.1, height: size * 0.19, background: "#e7b84a", borderRadius: 4, transform: `scaleX(${bar})`, transformOrigin: "100% 50%", zIndex: -1 }} />{p.key}</span>{parts[1]}</>
      ) : p.text}
    </span>
  );
};

/** the big quote in half screen: `him` = his landscape video layer; `lead` = «قال رسول الله ﷺ»; `src` = the source line (book + number) */
export const HadithQuote: React.FC<{ him: React.ReactNode; lead?: string; phrases: HadithPhrase[]; src: string; until?: number; size?: number; dx?: number }> = ({ him, lead, phrases, src, until, size = 84, dx = 470 }) => {
  FONT_NASKH(); FONT_TEXT();
  const t = useT();
  const t0 = phrases[0].at, last = phrases[phrases.length - 1];
  const k = Math.min(ease((t - t0 + 0.8) / 0.5), until === undefined ? 1 : ease((until - t) / 0.45));
  return (
    <AbsoluteFill style={{ background: BRAND.base, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translateX(${dx * k}px)` }}>{him}</AbsoluteFill>
      <BlendPanel k={k} t={t} id="hq">
        <div style={{ position: "absolute", left: 640, top: 100, fontFamily: N, fontSize: 260, lineHeight: 1, color: "rgba(231,184,74,.35)" }}>«</div>
        <div style={{ position: "absolute", left: 40, bottom: 110, fontFamily: N, fontSize: 260, lineHeight: 1, color: "rgba(231,184,74,.35)" }}>»</div>
        {lead ? <div style={{ position: "absolute", left: 60, width: 680, top: 250, textAlign: "center", direction: "rtl", fontFamily: N, fontWeight: 700, fontSize: 42, color: "#e7b84a", opacity: clamp((t - t0 + 0.4) / 0.3) }}>{lead}</div> : null}
        <div style={{ position: "absolute", left: 40, width: 720, top: 330, textAlign: "center", direction: "rtl", lineHeight: 1.7 }}>
          {phrases.map((p, i) => <div key={i}><Phrase p={p} t={t} size={size} color={BRAND.card} /></div>)}
        </div>
        <div style={{ position: "absolute", left: 80, width: 640, bottom: 90, borderTop: `2px solid ${alpha("#e7b84a", 0.5)}`, paddingTop: 14, textAlign: "center", direction: "rtl", fontFamily: TEXT, fontWeight: 700, fontSize: 28, color: BRAND.light, opacity: clamp((t - last.at - 0.5) / 0.3) }}>{src}</div>
      </BlendPanel>
    </AbsoluteFill>
  );
};

/** the isnad chain then the matn: drawn over his video in the free space left of him (box x 30..790).
 *  `chain[i].at` = the second he names narrator i; the matn card opens at `cardAt`. The last node (the Prophet ﷺ) is gold. */
export const HadithIsnad: React.FC<{ chain: { name: string; at: number }[]; lead?: string; phrases: HadithPhrase[]; src: string; cardAt: number; until?: number; x?: number; y?: number }> = ({ chain, lead, phrases, src, cardAt, until, x = 30, y = 50 }) => {
  FONT_NASKH(); FONT_TEXT();
  const t = useT();
  if (t < chain[0].at - 0.1 || (until !== undefined && t > until)) return null;
  const W = 760, n = chain.length, step = Math.min(84, 540 / Math.max(1, n - 1));
  const pos = chain.map((_, i) => ({ cx: i % 2 ? 560 : 190, cy: 34 + i * step }));
  const out = until === undefined ? 1 : ease((until - t) / 0.35);
  const c = ease((t - cardAt) / 0.4), lastPh = phrases[phrases.length - 1];
  return (
    <div style={{ position: "absolute", left: x, top: y, width: W, height: 980, opacity: out, direction: "rtl" }}>
      <svg width={W} height={980} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {pos.slice(1).map((b, j) => {
          const a = pos[j], u = ease((t - chain[j + 1].at) / 0.3);
          if (u <= 0) return null;
          const ex = a.cx + (b.cx - a.cx) * u, ey = a.cy + (b.cy - a.cy) * u;
          return (
            <g key={j}>
              <line x1={a.cx} y1={a.cy} x2={ex} y2={ey} stroke={alpha(BRAND.base3, 0.9)} strokeWidth={22} strokeLinecap="round" />
              <line x1={a.cx} y1={a.cy} x2={ex} y2={ey} stroke="#f0c75e" strokeWidth={13} strokeLinecap="round" style={{ filter: "drop-shadow(0 0 8px rgba(243,201,90,.7))" }} />
            </g>
          );
        })}
      </svg>
      {chain.map((nd, i) => {
        const u = ease((t - nd.at) / 0.3), last = i === n - 1;
        return u <= 0 ? null : (
          <div key={i} style={{ position: "absolute", left: pos[i].cx, top: pos[i].cy, transform: `translate(-50%, -50%) scale(${0.6 + 0.4 * u})`, padding: "8px 24px", borderRadius: 32, whiteSpace: "nowrap",
            fontFamily: TEXT, fontWeight: 800, fontSize: 30, background: last ? "#e7b84a" : BRAND.card, color: last ? "#1b1305" : BRAND.ink, border: `3px solid ${last ? "#fff3c4" : BRAND.navy}`, boxShadow: "0 6px 14px rgba(0,0,0,.35)" }}>{nd.name}</div>
        );
      })}
      {c > 0 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: pos[n - 1].cy + 66, padding: "22px 30px", borderRadius: 20, background: alpha(BRAND.base3, 0.94), border: `2px solid ${alpha("#e7b84a", 0.6)}`, textAlign: "center", transform: `scaleY(${c})`, transformOrigin: "50% 0" }}>
          {lead ? <div style={{ fontFamily: N, fontWeight: 700, fontSize: 32, color: "#e7b84a" }}>{lead}:</div> : null}
          <div style={{ lineHeight: 1.6 }}>{phrases.map((p, i) => <Phrase key={i} p={p} t={t} size={56} color={BRAND.card} dur={0.8} />)}</div>
          <div style={{ fontFamily: TEXT, fontWeight: 700, fontSize: 24, color: BRAND.light, marginTop: 8, opacity: clamp((t - lastPh.at - 0.5) / 0.3) }}>{src}</div>
        </div>
      ) : null}
    </div>
  );
};
