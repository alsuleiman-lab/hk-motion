import { BRAND_BAR, alpha } from "./brand";
import React from "react";
import { AbsoluteFill, Easing, Img, staticFile, useVideoConfig } from "remotion";
import { GLOW, T, useSp, useT } from "./MG";
import { DrawIcon } from "./MotionKit";
import { TEXT, TITLE } from "./EuKit";
import { FONT_QURAN, QURAN_FONT } from "./localFonts";
import { type BarTheme } from "./TitleBar";
import { BRAND } from "./brand";

/**
 * Reusable extras that came out of the «بركة وزير الأوقاف» montage (kept after its approval; the video itself was deleted):
 * KeyChip (phrase-switching gold chip), StampG, IconPop, IconCards (icon cards in a ROW), FlowNodes (icons joined by arrows),
 * StepBars (ascending bars), TimedCompare (before/after whose every line appears at the second it is spoken),
 * VerseWords (Qur'an word by word in the King Fahd font), HadithCard (phrase by phrase), SourceLabel.
 * Wrap a composition in <LandCtx.Provider value={false}> for portrait sizing. Colours assume a dark mid-tone blue background.
 */
export type Rect = { x: number; y: number; w: number; h: number };
export const LandCtx = React.createContext(true);
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = (x: number) => Easing.bezier(0.45, 0, 0.15, 1)(clamp(x));
// the key-phrase card (PREFERENCES §4 «العبارة المفتاحية»): landscape = frame centre, middle of the 4th fifth of the height (y 60–80%); portrait = under the beard.
// Pass x/y only to override. Colours = the TIMER block of the video's TitleBar theme (pass the same `theme` given to TitleBar); bg/fg override.
export const KeyChip: React.FC<{ phrases: { text: string; at: number }[]; x?: number; y?: number; size?: number; until?: number; theme?: BarTheme; bg?: string; fg?: string }> = ({ phrases, x: x0, y: y0, size = 50, until, bg = BRAND_BAR.timerBg, fg = BRAND_BAR.timerText }) => {   // one colour identity: a passed `theme` is ignored
  const { width, height } = useVideoConfig();
  const x = x0 ?? width / 2, y = y0 ?? (height > width ? 1390 : height * 0.7);
  const t = useT();
  const live = phrases.filter((p) => p.at <= t);
  const p = live[live.length - 1];
  const s = useSp(p ? p.at : 0, 11, 220);
  if (!p || (until !== undefined && t > until)) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${0.82 + 0.18 * s})`, opacity: Math.min(1, s * 2), background: bg, color: fg, fontFamily: TITLE, fontWeight: 800, fontSize: size, padding: "6px 30px 14px", borderRadius: 16, direction: "rtl", whiteSpace: "nowrap", boxShadow: "0 8px 0 rgba(0,0,0,.18)" }}>{p.text}</div>
  );
};
export const StampG: React.FC<{ at: number; x: number; y: number; text: string; size?: number }> = ({ at, x, y, text, size = 58 }) => {
  const s = useSp(at, 7, 260), t = useT(at);
  if (t < 0) return null;
  return <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,0) rotate(-7deg) scale(${2.1 - 1.1 * s})`, opacity: Math.min(1, s * 3), border: `6px solid ${BRAND.mark}`, color: BRAND.mark, fontFamily: TITLE, fontWeight: 800, fontSize: size, padding: "2px 24px 10px", borderRadius: 12, background: "rgba(10,26,50,.82)", whiteSpace: "nowrap", direction: "rtl" }}>{text}</div>;
};
export const IconPop: React.FC<{ at: number; x: number; y: number; name: string; size?: number; color?: string }> = ({ at, x, y, name, size = 150, color = BRAND.card }) => {
  const s = useSp(at, 12, 150), t = useT(at);
  if (t < 0) return null;
  return <div style={{ position: "absolute", left: x - size / 2, top: y, opacity: Math.min(1, s * 2) }}><DrawIcon name={name} p={Math.min(1, s)} size={size} color={color} sw={1.5} glow={10} /></div>;
};
/** icon cards in a ROW (not a numbered list): each slides up at the second he says its line */
export const IconCards: React.FC<{ P: Rect; y0: number; items: { icon: string; text: string; at: number }[]; round?: boolean; h?: number }> = ({ P, y0, items, round, h }) => {
  const L = React.useContext(LandCtx);
  const t = useT();
  const gap = 28, n = items.length, cw = (P.w - gap * (n - 1) - 40) / n, ch = h ?? (round ? (L ? 330 : 230) : (L ? 250 : 190));
  return (
    <>
      {items.map((it, i) => {
        const k = ease((t - it.at) / 0.45);
        if (k <= 0) return null;
        const left = P.x + 20 + (n - 1 - i) * (cw + gap);
        return (
          <div key={i} style={{ position: "absolute", left, top: P.y + y0 + (1 - k) * 46, width: cw, height: ch, opacity: k, transform: `rotate(${(i % 2 ? 1 : -1) * 1.5 * (1 - k * 0.4)}deg)`, borderRadius: 28, background: "rgba(10,26,50,.78)", border: "2px solid rgba(255,255,255,.28)", boxShadow: "0 16px 34px rgba(0,0,0,.35)", direction: "rtl", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 18 }}>
            {round ? <div style={{ width: ch * 0.5, height: ch * 0.5, borderRadius: "50%", background: alpha(BRAND.accent, .16), border: `3px solid ${BRAND.accent}`, display: "flex", alignItems: "center", justifyContent: "center" }}><DrawIcon name={it.icon} p={Math.min(1, k * 1.4)} size={ch * 0.3} color={BRAND.card} sw={1.6} glow={8} /></div> : <DrawIcon name={it.icon} p={Math.min(1, k * 1.4)} size={ch * 0.36} color={BRAND.card} sw={1.6} glow={8} />}
            <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: L ? 44 : 34, color: "#fff", textAlign: "center", lineHeight: 1.3 }}>{it.text}</div>
          </div>
        );
      })}
    </>
  );
};

/** a flow diagram: icon nodes joined by arrows, each node + its arrow appears at its word (first node on the right) */
export const FlowNodes: React.FC<{ P: Rect; y0: number; nodes: { icon: string; label: string; at: number }[] }> = ({ P, y0, nodes }) => {
  const L = React.useContext(LandCtx);
  const t = useT();
  const n = nodes.length, step = (P.w - 40) / n, d = L ? 150 : 108;
  return (
    <>
      {nodes.map((nd, i) => {
        const k = ease((t - nd.at) / 0.4), cx = P.x + P.w - 20 - step * (i + 0.5);
        const ak = ease((t - nd.at) / 0.5);
        return (
          <React.Fragment key={i}>
            {i > 0 && ak > 0 ? <div style={{ position: "absolute", left: cx + step / 2 - 26, top: P.y + y0 + d / 2 - 26, opacity: ak }}><DrawIcon name="ArrowLeft" p={ak} size={52} color={BRAND.accent} sw={2.2} /></div> : null}
            {k > 0 ? (
              <div style={{ position: "absolute", left: cx - step / 2, top: P.y + y0 + (1 - k) * 30, width: step, textAlign: "center", opacity: k, direction: "rtl" }}>
                <div style={{ width: d, height: d, margin: "0 auto", borderRadius: "50%", background: "rgba(10,26,50,.8)", border: `3px solid ${BRAND.accent}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 26px rgba(0,0,0,.35)" }}><DrawIcon name={nd.icon} p={Math.min(1, k * 1.4)} size={d * 0.52} color={BRAND.card} sw={1.6} glow={8} /></div>
                <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: L ? 40 : 30, color: "#fff", marginTop: 12 }}>{nd.label}</div>
              </div>
            ) : null}
          </React.Fragment>
        );
      })}
    </>
  );
};

/** rising steps (ascending bars) for «أعلى / أشرف / أكرم» — each bar grows when he says its word (first on the right) */
export const StepBars: React.FC<{ P: Rect; y0: number; h: number; items: { label: string; at: number }[] }> = ({ P, y0, h, items }) => {
  const t = useT();
  const n = items.length, gap = 36, bw = (P.w - 120 - gap * (n - 1)) / n;
  return (
    <>
      {items.map((it, i) => {
        const k = ease((t - it.at) / 0.6);
        if (k <= 0) return null;
        const hh = h * (0.45 + 0.275 * i) * k, left = P.x + P.w - 60 - (i + 1) * bw - i * gap;
        return (
          <div key={i} style={{ position: "absolute", left, top: P.y + y0 + h - hh, width: bw, height: hh, borderRadius: "18px 18px 0 0", background: `linear-gradient(180deg,${BRAND.card},${BRAND.accent})`, boxShadow: `0 0 26px ${alpha(BRAND.accent, .35)}`, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 12, direction: "rtl" }}>
            <span style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 46, color: BRAND.navyDeep, opacity: k }}>{it.label}</span>
          </div>
        );
      })}
    </>
  );
};

/** before/after comparison whose every line appears at the second he says it (nothing is shown before it is spoken) */
export type TItem = { text: string; at: number };
export const TimedCompare: React.FC<{ at: number; until: number; x: number; y: number; w: number; h: number; before: { label: string; items: TItem[] }; after: { label: string; items: TItem[] } }> = ({ at, until, x, y, w, h, before, after }) => {
  const t = useT(at), now = useT(), open = ease(t / 0.7), out = ease((until - now) / 0.3);
  if (t < -0.01 || out <= 0) return null;
  const gap = 30, pw = (w - gap) / 2, cx = x + w / 2;
  const panel = (left: number, hi: boolean, items: TItem[]) => (
    <div style={{ position: "absolute", left: cx + (left - cx) * open, top: y, width: pw * open, height: h, overflow: "hidden", opacity: out }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: pw, height: h, boxSizing: "border-box", borderRadius: 30, border: hi ? `3px solid ${GLOW}` : "2px solid rgba(255,255,255,.18)", background: hi ? "rgba(10,25,55,.8)" : "rgba(255,255,255,.07)", boxShadow: hi ? `0 0 34px ${GLOW}44` : "none", direction: "rtl", fontFamily: TITLE, fontWeight: 800, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, padding: 30 }}>
        {items.map((it, i) => { const k = ease((now - it.at) / 0.4); return <div key={i} style={{ opacity: k * (hi ? 1 : 0.8), transform: `translateY(${(1 - k) * 22}px)`, fontSize: hi ? (i === 0 ? 66 : 50) : 48, color: hi && i > 0 ? GLOW : "#fff", textAlign: "center", lineHeight: 1.25 }}>{it.text}</div>; })}
      </div>
    </div>
  );
  const chip = (cxp: number, label: string, hi: boolean, first: number) => (
    <div style={{ position: "absolute", left: cxp - 85, top: y - 66, width: 170, textAlign: "center", fontFamily: TITLE, fontWeight: 800, fontSize: 34, padding: "6px 0", borderRadius: 30, background: hi ? GLOW : "rgba(255,255,255,.22)", color: hi ? BRAND.base3 : "#fff", opacity: ease((now - first) / 0.3) * out }}>{label}</div>
  );
  return (
    <>
      {panel(x + pw + gap, false, before.items)}
      {panel(x, true, after.items)}
      <div style={{ position: "absolute", left: cx - 2, top: y + (h * (1 - open)) / 2, width: 4, height: h * open, background: GLOW, boxShadow: `0 0 18px ${GLOW}`, opacity: out }} />
      {chip(x + pw + gap + pw / 2, before.label, false, before.items[0].at)}
      {chip(x + pw / 2, after.label, true, after.items[0].at)}
    </>
  );
};

// ---------- verse / hadith cards ----------
const cardBox: React.CSSProperties = { background: "rgba(10,26,50,.72)", border: "2px solid rgba(255,255,255,.3)", borderRadius: 26, boxShadow: "0 18px 40px rgba(0,0,0,.35)", direction: "rtl" };

/** a verse written WORD BY WORD, each word at the second he recites it (`times[i]`) — Qur'an text comes from data/quran (tools/quran_ayah.mjs) */
export const VerseWords: React.FC<{ words: string[]; times: number[]; x: number; y: number; w: number; size?: number; title: string; refText: string; until?: number }> = ({ words, times, x, y, w, size = 58, title, refText, until }) => {
  FONT_QURAN();
  const t = useT();
  const k = Math.min(ease((t - times[0] + 0.25) / 0.35), until === undefined ? 1 : ease((until - t) / 0.3));
  if (k <= 0) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y + (1 - k) * 24, width: w, opacity: k, ...cardBox, background: alpha(BRAND.base, 0.86), border: `2px solid ${alpha(BRAND.light, 0.4)}`, padding: "22px 36px 30px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, fontFamily: `"${QURAN_FONT}", ${TITLE}`, fontWeight: 400, fontSize: 34, color: BRAND.light }}>
        <span>{title}</span>
        <span style={{ color: alpha(BRAND.light, 0.75), fontFamily: TEXT, fontWeight: 700, fontSize: 24 }}>{refText}</span>
      </div>
      <div style={{ fontFamily: `"${QURAN_FONT}", ${TEXT}`, fontWeight: 400, fontSize: size * 1.12, lineHeight: 1.9, color: BRAND.card, textAlign: "center", textShadow: "0 2px 8px rgba(0,0,0,.4)" }}>
        {words.map((wd, i) => {
          const u = clamp((t - times[i]) / 0.28);
          return <span key={i} style={{ display: "inline-block", margin: "0 7px", opacity: u, transform: `translateY(${(1 - u) * 14}px)`, color: i < words.length && u > 0 && u < 1 ? BRAND.light : BRAND.card }}>{wd}</span>;
        })}
      </div>
    </div>
  );
};

/** a hadith (matn from Shamela) revealed phrase by phrase at the moment he says the matching phrase; the reference line stays small underneath */
export const HadithCard: React.FC<{ phrases: { text: string; at: number }[]; x: number; y: number; w: number; size?: number; title?: string; refText: string; until?: number }> = ({ phrases, x, y, w, size = 46, title = "حديث شريف", refText, until }) => {
  const t = useT();
  const k = Math.min(ease((t - phrases[0].at + 0.25) / 0.35), until === undefined ? 1 : ease((until - t) / 0.3));
  if (k <= 0) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y + (1 - k) * 24, width: w, opacity: k, ...cardBox, padding: "22px 36px 26px" }}>
      <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 28, color: GLOW, marginBottom: 12 }}>{title}</div>
      <div style={{ fontFamily: TEXT, fontWeight: 800, fontSize: size, lineHeight: 1.6, color: "#fff", textAlign: "center" }}>
        {phrases.map((p, i) => {
          const u = clamp((t - p.at) / 0.4);
          return <span key={i} style={{ opacity: u, transform: `translateY(${(1 - u) * 14}px)`, display: "inline-block", margin: "0 8px" }}>{p.text}</span>;
        })}
      </div>
      <div style={{ fontFamily: TEXT, fontWeight: 700, fontSize: Math.max(20, size * 0.46), color: "rgba(255,255,255,.62)", marginTop: 14, textAlign: "center", lineHeight: 1.4, opacity: clamp((t - phrases[0].at - 0.3) / 0.4) }}>{refText}</div>
    </div>
  );
};

/** small label that shows what is being referred to (e.g. «المصدر: ...») */
export const SourceLabel: React.FC<{ at: number; x: number; y: number; w: number; text: string; dur?: number; size?: number }> = ({ at, x, y, w, text, dur = 99, size = 22 }) => {
  const s = useSp(at, 13, 160), t = useT(at);
  if (t < 0 || t > dur) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, opacity: clamp(s * 2), transform: `translateY(${(1 - s) * 10}px)`, background: alpha(BRAND.card, .94), borderRight: `7px solid ${T.accent}`, borderRadius: 10, padding: "6px 14px", direction: "rtl", fontFamily: TEXT, fontWeight: 800, fontSize: size, color: T.ink, boxShadow: "0 6px 14px rgba(0,0,0,.25)" }}>{text}</div>
  );
};

/* ═════════ ReelKit — portrait reel pieces (from «وزير الأوقاف الأردني والترحم على النصارى», approved 2026-10-25) ═════════
 * ReelCard: the user's white writing card (navy icon square + phrase + optional big number), width = its text, tilted ≈ −2°, placed in the writing band y≈1346.
 * ReelBehindCard: a source card beside the Sheikh's head, turned toward him — put it UNDER his isolated video (original → card → MaskedVideo).
 * ReelVerseFull: reels only — the verse he recites fills the screen, his picture hidden, words at his word times (text from data/quran).
 * ReelPersonInBand: «هذا الشخص» → the person's photo in the writing band, caption under the photo. JordanFlag: SVG flag. */
const REEL_Q3 = 1346;
const REEL_NAVY = BRAND.accent;
const REEL_INK = BRAND.base;
const QURAN_FAM = FONT_QURAN();
/** Jordan flag drawn in SVG (black / white / green stripes, red triangle with the seven-pointed white star) */
export const JordanFlag: React.FC = () => {
  const star = Array.from({ length: 14 }, (_, i) => { const r = i % 2 ? 1.15 : 2.6, a = -Math.PI / 2 + (i * Math.PI) / 7; return `${7 + r * Math.cos(a)},${10 + r * Math.sin(a)}`; }).join(" ");
  return (
    <g>
      <rect width="30" height="6.67" fill="#000" /><rect y="6.67" width="30" height="6.67" fill="#fff" /><rect y="13.33" width="30" height="6.67" fill="#007a3d" />
      <path d="M0 0L15 10L0 20z" fill="#ce1126" /><polygon points={star} fill="#fff" />
    </g>
  );
};


/* ───────── icons for the white cards ───────── */
export const ReelIcon: React.FC<{ name: string; size?: number }> = ({ name, size = 46 }) => {
  const s = { width: size, height: size, fill: "none", stroke: "#fff", strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "ban": return <svg viewBox="0 0 24 24" style={s}><circle cx="12" cy="12" r="9" /><path d="M5.6 5.6l12.8 12.8" /></svg>;
    case "quote": return <svg viewBox="0 0 24 24" style={s}><path d="M7 17c-2 0-3-1.5-3-3.5C4 10 6 7.5 9 7M17 17c-2 0-3-1.5-3-3.5 0-3.5 2-6 5-6.5" /></svg>;
    case "book": return <svg viewBox="0 0 24 24" style={s}><path d="M4 5.5C6.5 4 9.5 4 12 5.8 14.5 4 17.5 4 20 5.5V19c-2.5-1.5-5.5-1.5-8 .3-2.5-1.8-5.5-1.8-8-.3z" /><path d="M12 5.8v13.5" /></svg>;
    case "scale": return <svg viewBox="0 0 24 24" style={s}><path d="M12 4v16M7 20h10M5 8h14M5 8l-3 6h6zM19 8l-3 6h6z" /></svg>;
    case "alert": return <svg viewBox="0 0 24 24" style={s}><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18v.5" /></svg>;
    case "user": return <svg viewBox="0 0 24 24" style={s}><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4.5 4.5-6.5 8-6.5s7 2 8 6.5" /></svg>;
    case "heart": return <svg viewBox="0 0 24 24" style={s}><path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" /></svg>;
    case "shield": return <svg viewBox="0 0 24 24" style={s}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /></svg>;
    case "flag": return <svg viewBox="0 0 30 20" style={{ width: size, height: size * 0.67, borderRadius: 3 }}><JordanFlag /></svg>;
    default: return <svg viewBox="0 0 24 24" style={s}><circle cx="12" cy="12" r="8" /></svg>;
  }
};

/** the user's writing card (reference screenshot 2026-10-25): white rounded card, navy icon square on the right, heavy phrase, optional big navy number + unit on the left */
export const ReelCard: React.FC<{ at: number; until: number; text: string; icon?: string; num?: string; unit?: string; x?: number; y?: number; w?: number; size?: number; rot?: number }> = ({ at, until, text, icon = "quote", num, unit, x, y = REEL_Q3, w, size = 44, rot = -2 }) => {
  const t = useT(at);
  if (t < 0 || t > until - at) return null;
  const p = Easing.out(Easing.back(1.6))(clamp(t / 0.32));
  const out = clamp((until - at - t) / 0.2);
  return (
    <div style={{ position: "absolute", left: x ?? 540, top: y, width: w ?? "max-content", maxWidth: 1000, height: 92, transform: `${x === undefined ? "translateX(-50%) " : ""}translateY(${(1 - p) * 26}px) scale(${0.94 + 0.06 * p}) rotate(${rot}deg)`, opacity: Math.min(clamp(t / 0.12), out), direction: "rtl", background: "#fff", borderRadius: 22, boxShadow: "0 10px 26px rgba(10,20,40,.35)", display: "flex", alignItems: "center", gap: 18, padding: "0 16px", boxSizing: "border-box" }}>
      <div style={{ width: 70, height: 70, borderRadius: 18, background: REEL_NAVY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><ReelIcon name={icon} /></div>
      <div style={{ flex: w ? 1 : "0 0 auto", fontFamily: TEXT, fontWeight: 800, fontSize: size, color: REEL_INK, whiteSpace: "nowrap", overflow: "hidden", paddingLeft: num ? 0 : 10 }}>{text}</div>
      {num ? (
        <div style={{ textAlign: "center", flexShrink: 0, paddingLeft: 8, lineHeight: 1 }}>
          <div style={{ fontFamily: "Georgia, serif", fontWeight: 900, fontSize: 58, color: REEL_NAVY }}>{num}</div>
          {unit ? <div style={{ fontFamily: TEXT, fontWeight: 800, fontSize: 20, color: REEL_NAVY, marginTop: 2 }}>{unit}</div> : null}
        </div>
      ) : null}
    </div>
  );
};


/** a source card standing beside his head, turned toward him (rotateY), with a thin glowing frame; it sits UNDER the isolated Sheikh */
export const ReelBehindCard: React.FC<{ from: number; to: number; side: "left" | "right"; x: number; y: number; w: number; h: number; children: React.ReactNode }> = ({ from, to, side, x, y, w, h, children }) => {
  const t = useT(from);
  const d = to - from;
  if (t < 0 || t > d) return null;
  const pin = Easing.out(Easing.cubic)(clamp(t / 0.45));
  const pout = Easing.in(Easing.cubic)(clamp((t - (d - 0.35)) / 0.35));
  const dir = side === "left" ? -1 : 1;
  const slide = dir * (1 - pin) * 520 + dir * pout * 560;
  const bob = Math.sin(t * 1.4) * 6;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, perspective: 1400 }}>
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${slide}px) translateY(${bob}px) rotateY(${dir * -17}deg) rotateZ(${dir * 1.2}deg)`, transformOrigin: side === "left" ? "left center" : "right center", borderRadius: 24, overflow: "hidden", border: "3px solid rgba(170,225,255,.9)", boxShadow: "0 0 26px rgba(120,200,255,.55), 0 24px 50px rgba(0,0,0,.45)", background: BRAND.base3 }}>
        {children}
      </div>
    </div>
  );
};

/** REELS ONLY (user 2026-10-25: «عرض الآيات بملء الشاشة دون صورتي — هذا استثناء فقط في الريلز»): while he recites, the verse fills the screen and his picture is hidden.
 *  Text from data/quran (tools/quran_ayah.mjs), KFGQPC font, decorated dark background; every word appears when he says it; hard cut in and out. */
export const ReelVerseFull: React.FC<{ to: number; refName: string; lines: { words: string[]; times: number[] }[]; size?: number }> = ({ to, refName, lines, size = 84 }) => {
  const t = useT(0);
  const from = lines[0].times[0] - 0.1;
  if (t < from || t >= to) return null;
  const words = lines.flatMap((l) => l.words.map((w, i) => ({ w, at: l.times[i] })));
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, ${BRAND.base2} 0%, ${BRAND.base} 60%, ${BRAND.base3} 100%)` }}>
      <svg width="1080" height="1920" style={{ position: "absolute", inset: 0, opacity: 0.13 }}>
        <defs><pattern id="aw-star" width="120" height="120" patternUnits="userSpaceOnUse"><path d="M60 8l14 38 38 14-38 14-14 38-14-38-38-14 38-14z" fill="none" stroke={BRAND.light} strokeWidth="2" /><circle cx="60" cy="60" r="9" fill="none" stroke={BRAND.light} strokeWidth="2" /></pattern></defs>
        <rect width="1080" height="1920" fill="url(#aw-star)" />
      </svg>
      <div style={{ position: "absolute", left: 60, right: 60, top: 300, bottom: 300, border: `3px solid ${alpha(BRAND.light, 0.55)}`, borderRadius: 34 }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 370, textAlign: "center", fontFamily: `"${QURAN_FONT}", ${TITLE}`, fontWeight: 400, fontSize: 52, color: BRAND.light, direction: "rtl" }}>{refName}</div>
      <div style={{ position: "absolute", left: 100, right: 100, top: 480, bottom: 380, display: "flex", alignItems: "center", justifyContent: "center", direction: "rtl" }}>
        <div style={{ fontFamily: QURAN_FAM, fontSize: size, lineHeight: 1.9, color: BRAND.card, textAlign: "center" }}>
          {words.map((x, i) => {
            const p = clamp((t - x.at) / 0.25);
            const w = <span style={{ opacity: 0.12 + 0.88 * p, display: "inline-block", transform: `translateY(${(1 - p) * 14}px)` }}>{x.w}</span>;
            return (
              <span key={i} style={{ whiteSpace: "nowrap", margin: "0 6px" }}>
                {i === 0 ? <span style={{ color: BRAND.light }}>﴿ </span> : null}{w}{i === words.length - 1 ? <span style={{ color: BRAND.light }}> ﴾</span> : null}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** «هذا الإنسان» (the minister): his photo in the writing band (user 2026-10-25: «حين أقول هذا الشخص اعرض صورته في مكان الكتابة»); the caption sits in a strip UNDER the photo, never over the face */
export const ReelPersonInBand: React.FC<{ at: number; until: number; src: string; caption: string }> = ({ at, until, src, caption }) => {
  const t = useT(at);
  if (t < 0 || t > until - at) return null;
  const p = Easing.out(Easing.back(1.5))(clamp(t / 0.35));
  return (
    <div style={{ position: "absolute", left: 540 - 86, top: REEL_Q3 - 6, width: 172, transform: `translateY(${(1 - p) * 30}px) rotate(${-2 + (1 - p) * 4}deg)`, opacity: Math.min(clamp(t / 0.12), clamp((until - at - t) / 0.2)), background: "#fff", borderRadius: 16, padding: 10, boxSizing: "border-box", boxShadow: "0 14px 30px rgba(0,0,0,.45)" }}>
      <Img src={staticFile(src)} style={{ width: 152, height: 258, objectFit: "cover", objectPosition: "50% 50%", borderRadius: 10, display: "block" }} />
      <div style={{ marginTop: 8, textAlign: "center", fontFamily: TITLE, fontWeight: 800, fontSize: 20, lineHeight: 1.3, color: REEL_INK, direction: "rtl" }}>{caption}</div>
    </div>
  );
};
