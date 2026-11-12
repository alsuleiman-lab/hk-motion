import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import { useT } from "./MG";
import { BRAND, alpha } from "./brand";
import { FONT_QURAN, QURAN_FONT } from "./localFonts";
import { TEXT } from "./EuKit";
import { cleanQuran } from "./MGExtras";

/**
 * VerseKit — the verse way the user kept from the choice page (2026-11-12), try-only until approved in the gallery.
 *  VerseNoor : his frame slides right; the left half becomes a night panel in the video palette (star tiling + turning rosette), the words huge in gold, a light sweep over each word as he says it.
 *              No seam: the panel melts into his frame by transparency (user: «لا أريد هذا الحد… تداخل عن طريق الشفافية»).
 *  BlendPanel, StarField, Rosette, GoldWord, Header are shared with HadithKit.
 * Words come from the Qur'an database (tools/quran_ayah.mjs); `times[i]` = the second he recites word i — nothing is written before it is said.
 * No drawing is downloaded: every ornament is drawn in code.
 */
export const clamp = (x: number) => Math.max(0, Math.min(1, x));
export const ease = (x: number) => Easing.bezier(0.45, 0, 0.15, 1)(clamp(x));
const AR = "٠١٢٣٤٥٦٧٨٩";
export const ar = (n: number) => String(n).replace(/[0-9]/g, (d) => AR[+d]);
const Q = `"${QURAN_FONT}", ${TEXT}`;
export type VerseProps = { words: string[]; times: number[]; surah: string; aya: number; until?: number };

/** a gold word: written in when recited (rises out of a soft blur-free clip), then a light sweep runs across it once */
export const GoldWord: React.FC<{ w: string; at: number; t: number; size: number; carve?: boolean }> = ({ w, at, t, size, carve }) => {
  const u = ease((t - at) / 0.32), p = clamp((t - at - 0.15) / 0.7) * 160 - 30;   // sweep position %
  if (u <= 0) return <span style={{ display: "inline-block", margin: `0 ${size * 0.12}px`, visibility: "hidden" }}>{cleanQuran(w)}</span>;
  return (
    <span style={{ display: "inline-block", margin: `0 ${size * 0.12}px`, transform: `translateY(${(1 - u) * size * 0.35}px) scale(${1.12 - 0.12 * u})`, clipPath: `inset(-40% 0 -40% ${(1 - u) * 100}%)`,
      backgroundImage: `linear-gradient(100deg, transparent ${p - 14}%, rgba(255,252,235,.95) ${p}%, transparent ${p + 14}%), linear-gradient(180deg, #fff3c4 0%, #f3c95a 42%, #c88e22 72%, #8a5a12 100%)`,
      WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
      filter: carve ? "drop-shadow(0 2px 0 rgba(60,35,5,.85)) drop-shadow(0 -1px 0 rgba(255,240,200,.5)) drop-shadow(0 10px 18px rgba(0,0,0,.45))" : "drop-shadow(0 4px 0 rgba(70,40,5,.9)) drop-shadow(0 0 22px rgba(243,201,90,.35))" }}>
      {cleanQuran(w)}
    </span>
  );
};
/** the ayah-end roundel with its number (drawn in code) */
export const AyahEnd: React.FC<{ n: number; size: number; k: number }> = ({ n, size, k }) => k <= 0 ? null : (
  <span style={{ position: "relative", display: "inline-grid", placeItems: "center", width: size, height: size, verticalAlign: "middle", margin: `0 ${size * 0.15}px`, transform: `scale(${1.5 - 0.5 * ease(k)}) rotate(${(1 - ease(k)) * -60}deg)` }}>
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ position: "absolute", inset: 0 }}>
      <circle cx="50" cy="50" r="40" fill={alpha(BRAND.base, 0.6)} stroke="#e7b84a" strokeWidth="5" />
      {Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return <path key={i} d={`M ${50 + Math.cos(a) * 42} ${50 + Math.sin(a) * 42} L ${50 + Math.cos(a + 0.12) * 49} ${50 + Math.sin(a + 0.12) * 49} L ${50 + Math.cos(a - 0.12) * 49} ${50 + Math.sin(a - 0.12) * 49} Z`} fill="#e7b84a" />; })}
    </svg>
    <span style={{ position: "relative", fontFamily: TEXT, fontWeight: 800, fontSize: size * 0.4, color: "#f6d27a" }}>{ar(n)}</span>
  </span>
);
/** an eight-point star tiling (Islamic geometry) as an SVG pattern */
export const StarField: React.FC<{ id: string; cell: number; color: string; op: number; rot?: number }> = ({ id, cell, color, op, rot = 0 }) => (
  <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: op }}>
    <defs>
      <pattern id={id} width={cell} height={cell} patternUnits="userSpaceOnUse" patternTransform={`rotate(${rot})`}>
        <g fill="none" stroke={color} strokeWidth={1.4}>
          <rect x={cell * 0.2} y={cell * 0.2} width={cell * 0.6} height={cell * 0.6} />
          <rect x={cell * 0.2} y={cell * 0.2} width={cell * 0.6} height={cell * 0.6} transform={`rotate(45 ${cell / 2} ${cell / 2})`} />
          <circle cx={cell / 2} cy={cell / 2} r={cell * 0.12} />
          <path d={`M0 0 L${cell * 0.2} ${cell * 0.2} M${cell} 0 L${cell * 0.8} ${cell * 0.2} M0 ${cell} L${cell * 0.2} ${cell * 0.8} M${cell} ${cell} L${cell * 0.8} ${cell * 0.8}`} />
        </g>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill={`url(#${id})`} />
  </svg>
);
/** a large rosette (sixteen petals of lines) that turns slowly */
export const Rosette: React.FC<{ cx: number; cy: number; r: number; t: number; color: string; op: number }> = ({ cx, cy, r, t, color, op }) => (
  <svg width={r * 2} height={r * 2} viewBox="-100 -100 200 200" style={{ position: "absolute", left: cx - r, top: cy - r, opacity: op, transform: `rotate(${t * 6}deg)` }}>
    <g fill="none" stroke={color} strokeWidth={0.6}>
      {Array.from({ length: 16 }, (_, i) => <g key={i} transform={`rotate(${i * 22.5})`}><path d="M0 -96 Q 22 -50 0 0 Q -22 -50 0 -96" /><circle cx="0" cy="-70" r="6" /></g>)}
      <circle r="98" /><circle r="58" /><circle r="30" />
    </g>
  </svg>
);
export const Header: React.FC<{ surah: string; size: number; k: number; font?: string }> = ({ surah, size, k, font = Q }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: size * 0.4, transform: `scaleX(${ease(k)})`, fontFamily: font, fontSize: size, color: "#f3d27e", textShadow: "0 3px 0 rgba(60,35,5,.8)" }}>
    <span style={{ flex: 1, height: 2, background: "linear-gradient(90deg, transparent, #e7b84a)" }} />◆ {surah} ◆<span style={{ flex: 1, height: 2, background: "linear-gradient(270deg, transparent, #e7b84a)" }} />
  </div>
);

/** the half-screen panel in the video's palette: base colours + star tiling + turning rosette (ornament in the palette's light tone);
 *  its right side melts into his video by transparency — no seam. `k` = 0..1 slide-in; opaque up to `solid` of `w`, then fades to nothing. */
export const BlendPanel: React.FC<{ k: number; t: number; w?: number; solid?: number; id: string; children?: React.ReactNode }> = ({ k, t, w = 1380, solid = 0.72, id, children }) => {
  if (k <= 0) return null;
  const fade = `linear-gradient(90deg, #000 0%, #000 ${solid * 100}%, rgba(0,0,0,.55) ${(solid + (1 - solid) * 0.45) * 100}%, transparent 100%)`;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: 1080, transform: `translateX(${-(1 - k) * w}px)`, overflow: "hidden", WebkitMaskImage: fade, maskImage: fade,
      background: `radial-gradient(ellipse at 400px 46%, ${BRAND.base2} 0%, ${BRAND.base} 45%, ${BRAND.base3} 100%)` }}>
      <StarField id={id + "-stars"} cell={120} color={BRAND.light} op={0.09} rot={t * 2} />
      <Rosette cx={400} cy={520} r={430} t={t} color={BRAND.light} op={0.14} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 400px 50%, transparent 40%, ${alpha(BRAND.base3, 0.6)} 100%)` }} />
      {children}
    </div>
  );
};

/** HALF-SCREEN WAYS (user 2026-11-12: «اجعله هو الأصلي والأساسي»): his video slides right by HALF_DX while the panel is on. The engine slides him through
 *  spec shifts (halfShift gives the window, see MontageSpec), the gallery through HalfScene. The panel starts `lead` s before the first spoken word. */
export const HALF_DX = 470;
export const HALF_LEAD = 0.55;
export const halfK = (t: number, start: number, until?: number) => Math.min(ease((t - start) / 0.5), until === undefined ? 1 : ease((until - t) / 0.45));
/** the matching shift window for LandFootage (its ramp is 0.4 s at both ends, ending 0.4 s after `to`) */
export const halfShift = (start: number, until: number) => ({ from: start, to: Math.max(start + 0.5, until - 0.4), dx: HALF_DX });
/** gallery only: his clip slid right + the panel (the engine does the slide itself) */
export const HalfScene: React.FC<{ him: React.ReactNode; start: number; until?: number; children: React.ReactNode }> = ({ him, start, until, children }) => {
  const t = useT(), k = halfK(t, start, until);
  return (
    <AbsoluteFill style={{ background: BRAND.base, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translateX(${HALF_DX * k}px)` }}>{him}</AbsoluteFill>
      {children}
    </AbsoluteFill>
  );
};
const chars = (ws: string[]) => ws.reduce((s, w) => s + [...cleanQuran(w)].length + 1, 0);
/** a font size that fits `n` characters into a w×h box (Uthmani ≈ 0.45 em per character) */
const fitSize = (n: number, w: number, h: number, lh: number, max: number, min: number) => Math.round(Math.max(min, Math.min(max, Math.sqrt((w * h) / (0.45 * lh * Math.max(1, n))))));

/** 1) the panel of light: the words huge in gold, a light sweep over each word as he says it */
export const VerseNoorPanel: React.FC<VerseProps & { size?: number }> = ({ words, times, surah, aya, until, size }) => {
  FONT_QURAN();
  const t = useT(), k = halfK(t, times[0] - HALF_LEAD, until);
  const s = size ?? fitSize(chars(words), 720, 700, 1.75, 112, 52);
  return (
    <BlendPanel k={k} t={t} id="vn">
      <div style={{ position: "absolute", left: 60, width: 680, top: 130, direction: "rtl" }}><Header surah={surah} size={44} k={(t - times[0] + 0.3) / 0.5} /></div>
      <div style={{ position: "absolute", left: 40, width: 720, top: 240, bottom: 140, display: "flex", alignItems: "center", justifyContent: "center", direction: "rtl", textAlign: "center", fontFamily: Q, fontSize: s, lineHeight: 1.75 }}>
        <div>{words.map((w, i) => <GoldWord key={i} w={w} at={times[i]} t={t} size={s} />)}<AyahEnd n={aya} size={s * 0.62} k={(t - times[times.length - 1] - 0.35) / 0.3} /></div>
      </div>
    </BlendPanel>
  );
};
/** 2) the big word then the verse: each word he says appears alone, huge, then shrinks down into its place in the verse line; the line completes with its roundel */
export const VerseBigWordPanel: React.FC<VerseProps & { size?: number }> = ({ words, times, surah, aya, until, size }) => {
  FONT_QURAN();
  const t = useT(), k = halfK(t, times[0] - HALF_LEAD, until);
  const s = size ?? fitSize(chars(words), 740, 330, 1.6, 78, 42);
  let cur = -1; times.forEach((x, i) => { if (t >= x) cur = i; });
  const land = 0.8;   // the word reaches the line this long after it is said
  const a = cur >= 0 ? t - times[cur] : 0, u = ease(a / 0.25), d = ease((a - 0.55) / 0.4);
  const bigOn = cur >= 0 && a < land + 0.2 && (until === undefined || t < until - 0.3);
  const w0 = cur >= 0 ? [...cleanQuran(words[cur])].length : 1, big = Math.min(230, Math.round(1300 / Math.max(3, w0)));
  return (
    <BlendPanel k={k} t={t} id="vb">
      <div style={{ position: "absolute", left: 60, width: 680, top: 110, direction: "rtl" }}><Header surah={surah} size={42} k={(t - times[0] + 0.3) / 0.5} /></div>
      {bigOn ? (
        <div style={{ position: "absolute", left: 40, width: 740, top: 220, height: 380, display: "flex", alignItems: "center", justifyContent: "center", direction: "rtl", fontFamily: Q, fontSize: big, opacity: 1 - d,
          transform: `translateY(${d * 330}px) scale(${(0.7 + 0.3 * u) * (1 - 0.65 * d)})`,
          backgroundImage: "linear-gradient(180deg, #fff3c4 0%, #f3c95a 42%, #c88e22 72%, #8a5a12 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
          filter: "drop-shadow(0 6px 0 rgba(70,40,5,.9)) drop-shadow(0 0 30px rgba(243,201,90,.4))" }}>{cleanQuran(words[cur])}</div>
      ) : null}
      <div style={{ position: "absolute", left: 30, width: 760, top: 640, bottom: 50, display: "flex", alignItems: "flex-start", justifyContent: "center", direction: "rtl", textAlign: "center", fontFamily: Q, fontSize: s, lineHeight: 1.6 }}>
        <div>{words.map((w, i) => <GoldWord key={i} w={w} at={times[i] + land} t={t} size={s} />)}<AyahEnd n={aya} size={s * 0.66} k={(t - times[times.length - 1] - land - 0.3) / 0.3} /></div>
      </div>
    </BlendPanel>
  );
};

/** gallery scenes (his clip slid right + the panel) */
export const VerseNoor: React.FC<VerseProps & { him: React.ReactNode; size?: number }> = (p) => <HalfScene him={p.him} start={p.times[0] - HALF_LEAD} until={p.until}><VerseNoorPanel {...p} /></HalfScene>;
export const VerseBigWord: React.FC<VerseProps & { him: React.ReactNode; size?: number }> = (p) => <HalfScene him={p.him} start={p.times[0] - HALF_LEAD} until={p.until}><VerseBigWordPanel {...p} /></HalfScene>;
