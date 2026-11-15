import React from "react";
import { useT } from "./MG";
import { BRAND, alpha } from "./brand";
import { FONT_NASKH, FONT_TEXT } from "./localFonts";
import { TEXT } from "./EuKit";
import { BlendPanel, HalfScene, HALF_LEAD, halfK, ease, clamp } from "./VerseKit";

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
export type HadithHalf = { lead?: string; phrases: HadithPhrase[]; src: string; until?: number; size?: number };
const pchars = (ps: HadithPhrase[]) => ps.reduce((s, p) => s + [...p.text].length + 1, 0);
const fitN = (n: number, w: number, h: number, lh: number, max: number, min: number) => Math.round(Math.max(min, Math.min(max, Math.sqrt((w * h) / (0.42 * lh * Math.max(1, n))))));

/** the big quote panel (the engine slides him right with halfShift; the gallery with HalfScene) */
export const HadithQuotePanel: React.FC<HadithHalf> = ({ lead, phrases, src, until, size }) => {
  FONT_NASKH(); FONT_TEXT();
  const t = useT();
  const t0 = phrases[0].at, last = phrases[phrases.length - 1], k = halfK(t, t0 - HALF_LEAD, until);
  const s = size ?? fitN(pchars(phrases), 590, 500, 1.7, 84, 44);
  return (
    <BlendPanel k={k} t={t} id="hq">
      <div style={{ position: "absolute", left: 470, top: 100, fontFamily: N, fontSize: 260, lineHeight: 1, color: "rgba(231,184,74,.35)" }}>«</div>
      <div style={{ position: "absolute", left: 40, bottom: 110, fontFamily: N, fontSize: 260, lineHeight: 1, color: "rgba(231,184,74,.35)" }}>»</div>
      {lead ? <div style={{ position: "absolute", left: 40, width: 560, top: 250, textAlign: "center", direction: "rtl", fontFamily: N, fontWeight: 700, fontSize: 42, color: "#e7b84a", opacity: clamp((t - t0 + 0.4) / 0.3) }}>{lead}</div> : null}
      <div style={{ position: "absolute", left: 30, width: 590, top: 330, textAlign: "center", direction: "rtl", lineHeight: 1.7 }}>
        {phrases.map((p, i) => <div key={i}><Phrase p={p} t={t} size={s} color={BRAND.card} /></div>)}
      </div>
      <div style={{ position: "absolute", left: 40, width: 560, bottom: 90, borderTop: `2px solid ${alpha("#e7b84a", 0.5)}`, paddingTop: 14, textAlign: "center", direction: "rtl", fontFamily: TEXT, fontWeight: 700, fontSize: 28, color: BRAND.light, opacity: clamp((t - last.at - 0.5) / 0.3) }}>{src}</div>
    </BlendPanel>
  );
};
/** the matn over its source books (user 2026-11-12: «خذني إلى الجنب، ولا تكثر ألوان، اعتمد لون المونتاج»): the narrator on a small ribbon, the matn large,
 *  then the source books slide in stacked under it, each with its hadith number — every colour from the video's palette (no gold, no extra colours) */
export const HadithBooksPanel: React.FC<HadithHalf & { narrator?: string; books?: { book: string; n: number | string }[] }> = ({ lead, narrator, phrases, src, books, until, size }) => {
  FONT_NASKH(); FONT_TEXT();
  const t = useT();
  const t0 = phrases[0].at, last = phrases[phrases.length - 1], k = halfK(t, t0 - HALF_LEAD, until);
  const bs = books?.length ? books.slice(0, 3) : [{ book: src, n: "" }];
  const s = size ?? fitN(pchars(phrases), 590, 400 - (bs.length - 1) * 60, 1.6, 80, 42);
  const bookAt = last.at + 0.6, top0 = 1000 - bs.length * 84;
  const AR = "٠١٢٣٤٥٦٧٨٩", ar = (n: number | string) => String(n).replace(/[0-9]/g, (d) => AR[+d]);
  return (
    <BlendPanel k={k} t={t} id="hb">
      {narrator ? <div style={{ position: "absolute", left: 50, width: 520, top: 150, padding: "10px 0", textAlign: "center", direction: "rtl", background: BRAND.navy, border: `2px solid ${alpha(BRAND.light, 0.5)}`, borderRadius: 40,
        fontFamily: N, fontSize: 32, color: BRAND.light, opacity: clamp((t - t0 + 0.4) / 0.3), transform: `scaleX(${ease((t - t0 + 0.4) / 0.4)})` }}>{narrator}</div> : null}
      {lead ? <div style={{ position: "absolute", left: 30, width: 590, top: 245, textAlign: "center", direction: "rtl", fontFamily: N, fontWeight: 700, fontSize: 40, color: BRAND.light, opacity: clamp((t - t0 + 0.3) / 0.3) }}>{lead}:</div> : null}
      <div style={{ position: "absolute", left: 30, width: 590, top: 315, textAlign: "center", direction: "rtl", lineHeight: 1.6 }}>
        {phrases.map((p, i) => <div key={i}><Phrase p={p} t={t} size={s} color={BRAND.card} dur={0.9} /></div>)}
      </div>
      {bs.map((b, i) => {
        const u = ease((t - bookAt - i * 0.35) / 0.4), w = 520 + i * 30;
        return u <= 0 ? null : (
          <div key={i} style={{ position: "absolute", left: 320 - w / 2 + (i % 2 ? 12 : -10), top: top0 + i * 84, width: w, height: 74, borderRadius: "6px 14px 14px 6px", direction: "rtl",
            background: `linear-gradient(180deg, ${i % 2 ? BRAND.navyDeep : BRAND.navy}, ${BRAND.base3})`, borderTop: `4px solid ${BRAND.light}`, borderBottom: `4px solid ${BRAND.light}`, boxShadow: "0 10px 18px rgba(0,0,0,.45)",
            display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 26px", boxSizing: "border-box", fontFamily: N, fontWeight: 700, fontSize: 36, color: BRAND.card,
            transform: `translateX(${-(1 - u) * 900}px) rotate(${(i % 2 ? 1 : -1) * 1.2}deg)` }}>
            <span>{b.book}</span>{b.n !== "" ? <span style={{ fontFamily: TEXT, fontWeight: 800, fontSize: 30, background: BRAND.accent, color: BRAND.onAccent, borderRadius: 20, padding: "2px 16px" }}>{ar(b.n)}</span> : null}
          </div>
        );
      })}
    </BlendPanel>
  );
};
/** gallery scenes */
export const HadithQuote: React.FC<HadithHalf & { him: React.ReactNode }> = (p) => <HalfScene him={p.him} start={p.phrases[0].at - HALF_LEAD} until={p.until}><HadithQuotePanel {...p} /></HalfScene>;
export const HadithBooks: React.FC<HadithHalf & { him: React.ReactNode; narrator?: string; books?: { book: string; n: number | string }[] }> = (p) => <HalfScene him={p.him} start={p.phrases[0].at - HALF_LEAD} until={p.until}><HadithBooksPanel {...p} /></HalfScene>;

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
