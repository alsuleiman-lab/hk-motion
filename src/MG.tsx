import React, { useId } from "react";
import { AbsoluteFill, Easing, interpolate, interpolateColors, random, spring, useCurrentFrame } from "remotion";
import { loadFont as loadKufi } from "@remotion/google-fonts/NotoKufiArabic";
import { loadFont as loadNaskh } from "@remotion/google-fonts/NotoNaskhArabic";
import { loadFont as loadMono } from "@remotion/google-fonts/SpaceMono";
import { loadFont as loadZain } from "@remotion/google-fonts/Zain";

/**
 * MG — "editor's desk" motion-graphics primitives, learned frame by frame from the reference video (see .claude/skills/motion-graphics/SKILL.md).
 * Design language: cream dot-grid paper, off-white note cards with a red binder-clip, tiny mono labels, ONE orange accent, hand-drawn marks
 * (circle / strike / cross / marker highlight), stamps, polaroid frames, iris-wipe colour change. All times are in SECONDS (`at`), fps = 30.
 */
import { THEMES, MGTheme as MGThemeT, MGThemeName } from "./mgThemes";
import { getInputProps } from "remotion";
import { BRAND, RED, alpha } from "./brand";

/** Active theme: set by <MGTheme theme="steel"> at render time (a parent renders before its children, so every primitive below reads the right colours). */
let CUR: MGThemeT = THEMES.steel;
export const T = new Proxy({} as Record<string, string>, {
  get: (_t, k: string) => (k === "orange" ? CUR.accent : k === "red" ? CUR.mark : (CUR as unknown as Record<string, string>)[k]),
}) as unknown as MGThemeT & { orange: string; red: string };
/** one colour identity (src/brand.ts, user 2026-10-27): whatever `theme` an older composition passes, the brand (steel) is used */
export const MGTheme: React.FC<{ theme: MGThemeName; children: React.ReactNode }> = ({ children }) => { CUR = THEMES.steel; return <>{children}</>; };

/** face-check mode: inputProps {hideGfx:true} renders the composition WITHOUT any <Gfx> overlay so tools/face_check.mjs can diff the two renders */
export const HIDE_GFX: boolean = (getInputProps() as { hideGfx?: boolean }).hideGfx === true;
/** fast face check (tools/face_fast.mjs): inputProps {gfxOnly:true} paints ONLY the <Gfx> overlays on a transparent page (everything else is
 *  visibility:hidden and RV videos are empty boxes, so nothing is decoded); the alpha of each still = where graphics are drawn */
export const GFX_ONLY: boolean = (getInputProps() as { gfxOnly?: boolean }).gfxOnly === true;
const GFX_ONLY_CSS = "html,body{background:transparent!important}body *{visibility:hidden!important}[data-gfx],[data-gfx] *{visibility:visible!important}";
export const Gfx: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  HIDE_GFX ? null : GFX_ONLY ? <div data-gfx="" style={{ position: "absolute", inset: 0 }}><style>{GFX_ONLY_CSS}</style>{children}</div> : <>{children}</>;

const FPS = 30;
export const kufiF = loadKufi("normal", { weights: ["800"], subsets: ["arabic"] }).fontFamily;
/** key-phrase font (user 2026-10-25: «الخط الافتراضي ZAIN 100»): Zain, default size 100 */
export const zainF = loadZain("normal", { weights: ["700"], subsets: ["arabic"] }).fontFamily;
export const naskhF = loadNaskh("normal", { weights: ["700"], subsets: ["arabic"] }).fontFamily;
export const monoF = loadMono("normal", { weights: ["400", "700"], subsets: ["latin"] }).fontFamily;

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
/** seconds since `at` (can be negative) */
export const useT = (at = 0) => useCurrentFrame() / FPS - at;
/** the house spring: quick, slightly bouncy (≈0.35 s to settle) */
export const useSp = (at: number, damping = 13, stiffness = 150) => {
  const f = useCurrentFrame();
  return spring({ frame: f - Math.round(at * FPS), fps: FPS, config: { damping, stiffness } });
};
const ease = (u: number) => 1 - Math.pow(1 - clamp(u), 3);

/** Paper desk background: dot grid, paper noise, red squiggles, corner crop marks, hashtag, barcode + running timecode. `dark` = the navy variant after the iris wipe. */
export const PaperBg: React.FC<{ dark?: boolean; tag?: string }> = ({ dark, tag = "#كلود_المونتير" }) => {
  const f = useCurrentFrame();
  const fg = dark ? "rgba(255,255,255,.55)" : "rgba(10,18,30,.55)";
  const tc = [Math.floor(f / FPS / 60), Math.floor(f / FPS) % 60, f % FPS].map((n) => String(n).padStart(2, "0")).join(":");
  return (
    <AbsoluteFill style={{ background: dark ? T.navy : T.paper, overflow: "hidden" }}>
      <AbsoluteFill style={{ backgroundImage: `radial-gradient(${dark ? "rgba(255,255,255,.09)" : "rgba(0,0,0,.10)"} 1.5px, transparent 1.6px)`, backgroundSize: "22px 22px" }} />
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.18, mixBlendMode: "multiply" }}><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" /><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .5 0" /></filter><rect width="100%" height="100%" filter="url(#n)" /></svg>
      <svg viewBox="0 0 1080 1920" width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
        {[[40, 330], [720, 1500], [60, 1560]].map(([x, y], i) => (<path key={i} d={`M${x},${y} q30,-22 60,0 t60,0 t60,0 M${x + 8},${y + 22} q30,-22 60,0 t60,0`} fill="none" stroke={dark ? "rgba(255,255,255,.25)" : `${T.mark}59`} strokeWidth={4} strokeLinecap="round" />))}
        {[[34, 34, 1, 1], [1046, 34, -1, 1], [34, 1886, 1, -1], [1046, 1886, -1, -1]].map(([x, y, sx, sy], i) => (<path key={i} d={`M${x},${y + 36 * sy} L${x},${y} L${x + 36 * sx},${y}`} fill="none" stroke={fg} strokeWidth={4} />))}
      </svg>
      <div style={{ position: "absolute", left: 56, top: 52, fontFamily: kufiF, fontSize: 30, color: fg, direction: "rtl" }}>{tag}</div>
      <div style={{ position: "absolute", right: 56, bottom: 52, fontFamily: monoF, fontSize: 20, color: fg, display: "flex", gap: 14, alignItems: "center" }}>
        <span>TC {tc}</span>
        <span style={{ display: "inline-block", width: 90, height: 30, background: `repeating-linear-gradient(90deg, ${fg} 0 2px, transparent 2px 5px, ${fg} 5px 6px, transparent 6px 10px)` }} />
      </div>
    </AbsoluteFill>
  );
};

/** Orange kinetic caption chip (the reference changes its words every ~1 s with a small pop). */
export const Chip: React.FC<{ phrases: { text: string; at: number; color?: string }[]; x: number; y: number; size?: number; at?: number; dur?: number }> = ({ phrases, x, y, size = 54, at, dur }) => {
  const t = useT();
  const idx = Math.max(0, phrases.filter((p) => p.at <= t).length - 1);
  const p = phrases[idx];
  const s = useSp(p.at, 11, 220);
  if (at !== undefined && (t < at || (dur !== undefined && t > at + dur))) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${0.82 + 0.18 * s}) rotate(${(1 - s) * -2}deg)`, opacity: clamp(s * 2), background: T.orange, color: p.color ?? T.onAccent, fontFamily: kufiF, fontSize: size, padding: "6px 30px 14px", borderRadius: 14, direction: "rtl", whiteSpace: "nowrap", boxShadow: "0 8px 0 rgba(0,0,0,.12)" }}>{p.text}</div>
  );
};

export const Typewriter: React.FC<{ text: string; at: number; cps?: number; style?: React.CSSProperties }> = ({ text, at, cps = 16, style }) => {
  const t = useT(at);
  const n = Math.max(0, Math.floor(t * cps));
  return <div style={{ direction: "rtl", ...style }}>{text.slice(0, n)}<span style={{ opacity: n < text.length && Math.floor(t * 4) % 2 ? 1 : 0 }}>|</span></div>;
};

/** Red binder clip on top of a card */
const Clip: React.FC<{ left?: number }> = ({ left = 60 }) => (
  <div style={{ position: "absolute", left, top: -22, width: 54, height: 34, background: T.red, borderRadius: "6px 6px 2px 2px", boxShadow: "0 3px 0 rgba(0,0,0,.2)" }}><div style={{ margin: "7px auto 0", width: 34, height: 12, background: BRAND.mark, borderRadius: 3 }} /></div>
);

/** Paper note card: slides in from the right (0.33 s, ease-out, fade) and settles with a tiny tilt; header mono label + black tag + typewritten title + grey lines. */
export const NoteCard: React.FC<{ at: number; x: number; y: number; w: number; h: number; rot?: number; label?: string; tag?: string; title?: string; lines?: number; children?: React.ReactNode; fromX?: number; cps?: number; size?: number }> = ({ at, x, y, w, h, rot = -1.5, label, tag, title, lines = 2, children, fromX = 120, cps = 16, size = 44 }) => {
  const u = ease((useT(at)) / 0.33);
  return (
    <div style={{ position: "absolute", left: x + (1 - u) * fromX, top: y, width: w, height: h, opacity: u, transform: `rotate(${rot + (1 - u) * 3}deg)`, background: T.card, borderRadius: 10, boxShadow: "0 18px 34px rgba(0,0,0,.28), 0 2px 0 rgba(0,0,0,.08)", padding: "20px 26px", direction: "rtl" }}>
      <Clip left={w - 120} />
      {label ? <div style={{ fontFamily: monoF, fontSize: 18, color: T.gray, display: "flex", justifyContent: "space-between", direction: "ltr" }}><span>{label}</span><span>0</span></div> : null}
      {tag ? <div style={{ display: "inline-block", background: T.ink, color: T.card, fontFamily: monoF, fontWeight: 700, fontSize: 18, padding: "2px 10px", margin: "6px 0 0 0", direction: "ltr" }}>{tag}</div> : null}
      {title ? <Typewriter text={title} at={at + 0.25} cps={cps} style={{ fontFamily: naskhF, fontSize: size, color: T.ink, margin: "8px 0", lineHeight: 1.55 }} /> : null}
      {Array.from({ length: lines }).map((_, i) => <div key={i} style={{ height: 8, background: BRAND.paper2, borderRadius: 4, margin: "12px 0", width: `${90 - i * 28}%` }} />)}
      {children}
    </div>
  );
};

/** Strike-through line / red X drawn stroke by stroke. */
export const Strike: React.FC<{ at: number; x: number; y: number; w: number; color?: string; sw?: number }> = ({ at, x, y, w, color = T.red, sw = 6 }) => {
  const p = ease(useT(at) / 0.25);
  return <div style={{ position: "absolute", left: x, top: y, width: w * p, height: sw, background: color, borderRadius: sw, transform: "rotate(-2deg)" }} />;
};
export const Cross: React.FC<{ at: number; x: number; y: number; size: number; color?: string; sw?: number }> = ({ at, x, y, size, color = T.red, sw = 8 }) => {
  const a = ease(useT(at) / 0.18), b = ease((useT(at) - 0.12) / 0.18);
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", left: x, top: y }}><line x1={4} y1={4} x2={4 + (size - 8) * a} y2={4 + (size - 8) * a} stroke={color} strokeWidth={sw} strokeLinecap="round" /><line x1={size - 4} y1={4} x2={size - 4 - (size - 8) * b} y2={4 + (size - 8) * b} stroke={color} strokeWidth={sw} strokeLinecap="round" /></svg>;
};

/** Marker highlight sweeping right→left (Arabic reading direction) behind a word. */
export const Highlight: React.FC<{ at: number; color?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ at, color = BRAND.mark, children, style }) => {
  const p = ease(useT(at) / 0.35);
  return <span style={{ position: "relative", display: "inline-block", padding: "0 8px", ...style }}><span style={{ position: "absolute", right: 0, top: "10%", bottom: "6%", width: `${p * 100}%`, background: color, borderRadius: 4, zIndex: 0 }} /><span style={{ position: "relative", zIndex: 1, color: BRAND.ink }}>{children}</span></span>;
};

/** Rubber stamp that slams in (scale 2.2 → 1 with a bounce and tiny tilt). */
export const Stamp: React.FC<{ at: number; x: number; y: number; text: string; size?: number; color?: string }> = ({ at, x, y, text, size = 56, color = RED }) => {   // the stamp is always the fixed red, whatever the palette
  const s = useSp(at, 7, 260);
  const sc = 2.2 - 1.2 * s;
  return <div style={{ position: "absolute", left: x, top: y, transform: `rotate(-9deg) scale(${sc})`, opacity: clamp(s * 3), border: `6px solid ${color}`, color, fontFamily: kufiF, fontSize: size, padding: "2px 22px 10px", borderRadius: 10, background: alpha(BRAND.card, .97) }}>{text}</div>;
};

/** Bars that grow one after the other (black / red / green in the reference). */
export const Bars: React.FC<{ at: number; x: number; y: number; w: number; h: number; vals?: number[]; colors?: string[] }> = ({ at, x, y, w, h, vals = [1, 0.62, 0.38], colors = [BRAND.card, BRAND.blue, T.mark] }) => {
  const t = useT(at);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, boxSizing: "border-box", padding: `${h * 0.12}px ${w * 0.1}px ${h * 0.1}px`, background: `linear-gradient(160deg, ${BRAND.navy}, ${BRAND.navyDeep})`, border: `4px solid ${BRAND.light}`, borderRadius: 18, boxShadow: "0 14px 34px rgba(0,0,0,.4)", opacity: ease(t / 0.3), display: "flex", gap: w * 0.1, alignItems: "flex-end", justifyContent: "center" }}>   {/* framed panel with its own background (user 2026-11-02: «ضع له إطار وخلفية») */}
      {vals.map((v, i) => <div key={i} style={{ width: w * 0.2, height: (h * 0.78) * v * ease((t - i * 0.12) / 0.4), background: colors[i], borderRadius: 4 }} />)}
    </div>
  );
};

/** A clock whose hands spin fast then ease (reference: the "24 hours" polaroid). */
export const Clock: React.FC<{ at: number; size: number }> = ({ at, size }) => {
  const t = useT(at);
  const m = 360 * 5 * ease(t / 1.6), h = m / 12;
  const c = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ filter: "drop-shadow(0 18px 30px rgba(0,0,0,.35))" }}>
      <circle cx={c} cy={c} r={c * 0.96} fill={T.card} />
      <circle cx={c} cy={c} r={c * 0.86} fill="none" stroke={T.navy} strokeWidth={size * 0.022} />
      {Array.from({ length: 12 }).map((_, i) => <line key={i} x1={c} y1={c - c * 0.78} x2={c} y2={c - c * (i % 3 ? 0.7 : 0.64)} stroke={T.navy} strokeWidth={i % 3 ? 3 : 6} strokeLinecap="round" transform={`rotate(${i * 30} ${c} ${c})`} />)}
      <line x1={c} y1={c} x2={c} y2={c - c * 0.42} stroke={T.navy} strokeWidth={size * 0.03} strokeLinecap="round" transform={`rotate(${h} ${c} ${c})`} />
      <line x1={c} y1={c} x2={c} y2={c - c * 0.66} stroke={T.accent} strokeWidth={size * 0.016} strokeLinecap="round" transform={`rotate(${m} ${c} ${c})`} />
      <circle cx={c} cy={c} r={size * 0.035} fill={T.accent} stroke={T.card} strokeWidth={3} />
    </svg>
  );
};

/* ====================================================================================================================
 * «السبت الممتاز» moves (studied 2026-10-19, see STYLE_REFERENCES.md §2): 13 reusable pieces. Times in seconds (`at`).
 * Positions are absolute in the composition (works in 1920x1080 and 1080x1920). Colours come from the active theme (T);
 * GLOW/GOLD are the reference's neon cyan and gold used for captions that sit OVER video (never over a face: keep them on the edges).
 * ==================================================================================================================== */
export const GLOW = BRAND.light;
const glowShadow = (c = GLOW) => `0 0 8px ${c}, 0 0 22px ${c}aa, 0 2px 4px rgba(0,0,0,.45)`;

/** 3) Neon caption, word by word; a word with `gold` gets the gold gradient + stronger glow. Sits over video (bottom band or flanks). */
export const GlowCaption: React.FC<{ words: { t: string; at: number; gold?: boolean }[]; x: number; y: number; w: number; size?: number }> = ({ words, x, y, w, size = 56 }) => {
  const t = useT();
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: `0 ${size * 0.28}px`, direction: "rtl", fontFamily: kufiF, fontSize: size, lineHeight: 1.25 }}>
      {words.map((wd, i) => {
        const u = clamp((t - wd.at) / 0.22);
        if (u <= 0) return null;
        return <span key={i} style={wd.gold ? { background: T.card, color: T.accent, borderRadius: size * 0.2, padding: `0 ${size * 0.22}px`, boxShadow: "0 8px 20px rgba(0,0,0,.3)", opacity: u, transform: `translateY(${(1 - u) * 14}px)` } : { color: BRAND.card, textShadow: glowShadow(), opacity: u, transform: `translateY(${(1 - u) * 14}px)` }}>{wd.t}</span>;
      })}
    </div>
  );
};

/** 4a) Dashed arc that draws itself between two points (links two pinned photos). */
/** `under`: the arc sags below the lower end instead of rising over the top (user 2026-10-31: «اجعل الخط من تحت لحيتي») */
export const DashArc: React.FC<{ at: number; x1: number; y1: number; x2: number; y2: number; under?: boolean; lift?: number; dur?: number; color?: string; sw?: number }> = ({ at, x1, y1, x2, y2, under, lift = 140, dur = 0.7, color = "#fff", sw = 4 }) => {
  const id = useId().replace(/:/g, "");
  const p = ease(useT(at) / dur);
  const d = `M${x1},${y1} Q${(x1 + x2) / 2},${under ? Math.max(y1, y2) + lift : Math.min(y1, y2) - lift} ${x2},${y2}`;
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
      <mask id={id}><path d={d} stroke="#fff" strokeWidth={sw + 6} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} /></mask>
      <path d={d} stroke={color} strokeWidth={sw} fill="none" strokeDasharray="10 14" strokeLinecap="round" mask={`url(#${id})`} />
    </svg>
  );
};

/** 5) Photo card pinned with a yellow tape strip, name underneath. */
export const PinnedPhoto: React.FC<{ at: number; x: number; y: number; w: number; h: number; name: string; sub?: string; rot?: number; children?: React.ReactNode }> = ({ at, x, y, w, h, name, sub, rot = -3, children }) => {
  const s = useSp(at, 12, 170);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: `rotate(${rot}deg) scale(${0.7 + 0.3 * s})`, opacity: clamp(s * 2), background: BRAND.card, padding: 10, boxSizing: "border-box", borderRadius: 26, boxShadow: "0 16px 30px rgba(0,0,0,.35)" }}>
      <div style={{ position: "absolute", left: w * 0.5 - 34, top: -16, width: 68, height: 30, background: alpha(BRAND.accent, .92), transform: "rotate(-6deg)", boxShadow: "0 2px 4px rgba(0,0,0,.25)" }} />
      <div style={{ width: "100%", height: h - (sub ? 100 : 78), background: T.gray, overflow: "hidden", position: "relative", borderRadius: 18 }}>{children}</div>
      <div style={{ position: "absolute", left: 12, right: 12, bottom: 14, textAlign: "center", fontFamily: naskhF, fontSize: 30, color: T.ink, direction: "rtl", lineHeight: 1.25 }}>{name}{sub ? <div style={{ fontSize: 20, color: T.gray }}>{sub}</div> : null}</div>
    </div>
  );
};

/** 10a) Glowing gold counter that passes through intermediate values (e.g. 4 → 23 → 36). */
export const GlowCounter: React.FC<{ at: number; x: number; y: number; steps: number[]; stepDur?: number; hold?: number; suffix?: string; size?: number }> = ({ at, x, y, steps, stepDur = 0.55, hold = 0.2, suffix = "", size = 150 }) => {
  const t = useT(at);
  if (t < 0) return null;
  const per = stepDur + hold, i = Math.min(steps.length - 1, Math.floor(t / per)), k = clamp((t - i * per) / stepDur), from = i === 0 ? 0 : steps[i - 1];
  const v = Math.round(from + (steps[i] - from) * ease(k));
  return <div style={{ position: "absolute", left: x, top: y, fontFamily: kufiF, fontSize: size, lineHeight: 1, color: T.accent, background: T.card, padding: `${size * 0.08}px ${size * 0.3}px ${size * 0.14}px`, borderRadius: 18, boxShadow: "0 18px 34px rgba(0,0,0,.26)", fontVariantNumeric: "tabular-nums", direction: "rtl", whiteSpace: "nowrap" }}>{v}{suffix}</div>;
};

/** 11) Gold hand-drawn ellipse around a phrase (draws itself) */
export const EllipseMark: React.FC<{ at: number; x: number; y: number; w: number; h: number; color?: string; sw?: number }> = ({ at, x, y, w, h, color = RED, sw = 6 }) => {
  const p = ease(useT(at) / 0.5);
  const d = `M${w * 0.5},${h * 0.04} C${w * 0.92},${h * 0.02} ${w * 1.0},${h * 0.7} ${w * 0.55},${h * 0.96} C${w * 0.12},${h * 1.02} ${-w * 0.02},${h * 0.35} ${w * 0.38},${h * 0.08} C${w * 0.5},${h * 0.03} ${w * 0.6},${h * 0.06} ${w * 0.66},${h * 0.12}`;
  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: x, top: y, overflow: "visible" }}><path d={d} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} /></svg>;
};

/**
 * 13) TimelineCounter — «عدّاد يقود الحركة» (reference: motion-lab video + gap-dial study, see SKILL.md §8–9).
 * ONE number is the single source: the counter, the needle, the filled line and the marker pop-ups are all derived from the same valueAt(t) in the same frame.
 * stops = [{ t (seconds after `at`), value, label?, sub? }]: the needle travels start→stop1→stop2… (soft-landing ease), a marker card pops when the needle ARRIVES
 * (set each stop's t = the moment the speaker says it; nothing shows before it is spoken). Hold the last stop ≈0.7 s so the peak can be read.
 * The counter turns accent colour while moving (+0.2 s afterglow), steps by `step`, and the needle gets horizontal motion blur only while moving.
 */
const TL_EASE = Easing.bezier(0.4, 0, 0.1, 1);
/** spring-like pop (0→1, tiny overshoot) from seconds since an event; pure function so it is safe inside loops */
const popAt = (sec: number) => (sec <= 0 ? 0 : spring({ frame: Math.round(sec * FPS), fps: FPS, config: { damping: 13, stiffness: 150 } }));
export const TimelineCounter: React.FC<{
  at: number; x: number; y: number; w: number;
  stops: { t: number; value: number; label?: string; sub?: string }[];
  unit?: string; step?: number; size?: number; rtl?: boolean; ink?: string; accent?: string; digits?: "ar" | "en"; labelLift?: number;
}> = ({ at, x, y, w, stops, unit = "سنة", step = 1, size = 150, rtl = true, ink, accent, digits = "en", labelLift }) => {
  const t = useT(at);
  const id = useId().replace(/:/g, "");
  const sp = useSp(at, 16, 110);
  const acc = accent ?? T.accent, inkC = ink ?? T.ink;
  if (t < -0.01 || stops.length < 2) return null;
  const v0 = stops[0].value, v1 = stops[stops.length - 1].value, span = v1 - v0 || 1;
  const valueAt = (tt: number) => {
    if (tt <= stops[0].t) return v0;
    for (let i = 1; i < stops.length; i++) {
      if (tt <= stops[i].t) { const a = stops[i - 1], b = stops[i]; return a.value + (b.value - a.value) * TL_EASE(clamp((tt - a.t) / (b.t - a.t))); }
    }
    return v1;
  };
  const v = valueAt(t);
  const frac = (v - v0) / span;
  const px = (fr: number) => (rtl ? x + w - fr * w : x + fr * w);
  const vel = ((valueAt(t + 1 / FPS) - valueAt(t - 1 / FPS)) * FPS) / 2; // value units per second
  const blur = Math.min(9, (Math.abs(vel) / Math.abs(span)) * w * 0.006);
  const glow = clamp(Math.abs(v - valueAt(t - 0.2)) / (Math.abs(span) * 0.01));
  const numColor = interpolateColors(glow, [0, 1], [inkC, acc]);
  // user 2026-10-27 (gallery): English digits like the item-card counter, and a nicer overall look — the StatRow family: paper band, the number in
  // bold Kufi accent with its unit under it, on a card that rides the needle with a pointer; stops are ringed dots, labels are paper cards
  const cardH = size * 1.42, lineY = y + cardH + 46, intro = ease(t / 0.5);
  const shown = Math.round(v / step) * step;
  const nx = px(frac), cardX = clamp((nx - x) / w, 0.08, 0.92) * w + x;
  void numColor;
  return (
    <>
      <div style={{ position: "absolute", left: x - 40, top: lineY - 30, width: w + 80, height: 60, borderRadius: 30, background: T.card, boxShadow: "0 14px 28px rgba(0,0,0,.26)", opacity: intro }} />
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
        <defs>
          <filter id={"mb" + id} x="-50%" y="-300%" width="200%" height="700%"><feGaussianBlur stdDeviation={blur + ",0"} /></filter>
          <linearGradient id={"tg" + id} x1={px(0)} x2={px(1)} y1="0" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor={T.navy} /><stop offset="1" stopColor={acc} /></linearGradient>
        </defs>
        <line x1={px(0)} x2={px(intro)} y1={lineY} y2={lineY} stroke="rgba(29,43,59,.14)" strokeWidth={14} strokeLinecap="round" />
        <line x1={px(0)} x2={px(frac)} y1={lineY} y2={lineY} stroke={"url(#tg" + id + ")"} strokeWidth={14} strokeLinecap="round" opacity={intro} />
        {stops.map((s, i) => {
          const f = (s.value - v0) / span, k = ease((t - s.t) / 0.4), on = i === 0 || k > 0;
          return <circle key={i} cx={px(f)} cy={lineY} r={on ? 10 + 3 * k : 8} fill={on ? (i === 0 ? T.navy : acc) : "rgba(29,43,59,.25)"} stroke={T.card} strokeWidth={4} opacity={intro} />;
        })}
        <circle cx={nx} cy={lineY} r={21} fill={acc} stroke={T.card} strokeWidth={6} filter={"url(#mb" + id + ")"} opacity={intro} />
      </svg>
      <div style={{ position: "absolute", left: cardX, top: y + (1 - sp) * 40, transform: "translateX(-50%)", opacity: clamp(sp * 1.5), direction: "rtl" }}>
        <div style={{ background: T.card, borderRadius: 18, borderBottom: "6px solid " + acc, padding: `${size * 0.08}px ${size * 0.3}px ${size * 0.1}px`, boxShadow: "0 18px 34px rgba(0,0,0,.28)", textAlign: "center", lineHeight: 1 }}>
          <div style={{ fontFamily: "Noto Kufi Arabic", fontWeight: 800, fontSize: size * 0.82, color: acc, direction: "ltr", fontVariantNumeric: "tabular-nums" }}>{shown.toLocaleString(digits === "ar" ? "ar-EG" : "en", { useGrouping: false })}</div>
          {unit ? <div style={{ fontFamily: "Almarai, sans-serif", fontWeight: 800, fontSize: size * 0.22, color: T.ink, marginTop: size * 0.04 }}>{unit}</div> : null}
        </div>
        <div style={{ width: 22, height: 22, background: T.card, transform: "rotate(45deg)", margin: "-14px auto 0", boxShadow: "6px 6px 10px rgba(0,0,0,.12)" }} />
      </div>
      {stops.map((s, i) => {
        if (!s.label || t < s.t) return null;
        const k = popAt(t - s.t), f = (s.value - v0) / span, cw = Math.min(330, w / stops.length - 16), lift = labelLift ?? 52 + i * Math.round(98 / Math.max(1, stops.length - 2));
        return (
          <div key={i} style={{ position: "absolute", left: clamp(px(f) - cw / 2, x, x + w - cw), top: lineY + lift + (1 - k) * 36, width: cw, textAlign: "center", opacity: clamp(k * 1.6), direction: "rtl", fontFamily: kufiF, color: inkC }}>
            <div style={{ position: "absolute", left: px(f) - clamp(px(f) - cw / 2, x, x + w - cw) - 1.5, top: -lift + 30, width: 3, height: lift - 32, background: alpha(BRAND.card, .85), boxShadow: "0 0 6px rgba(0,0,0,.35)" }} />
            <div style={{ fontSize: 40, lineHeight: 1.15, background: T.card, color: T.ink, borderBottom: "5px solid " + acc, borderRadius: 14, padding: "10px 14px 12px", boxShadow: "0 14px 26px rgba(0,0,0,.26)" }}>
              {s.label}{s.sub ? <div style={{ fontSize: 26, opacity: 0.75, marginTop: 4 }}>{s.sub}</div> : null}
            </div>
          </div>
        );
      })}
    </>
  );
};

/**
 * 14) MorphBox — «التحويل المشترك» (reference: motion-lab video, SKILL.md §8-ب). ONE container survives across scenes and morphs its rectangle
 * (word box → big card → hairline baseline → word box…), so scene changes are a single continuous motion instead of cuts.
 * states = [{ t, x, y, w, h, r? }]: at each state's `t` (seconds, absolute) the box glides from the previous rectangle to this one over `dur` (≈1 s, soft landing).
 * Inside it, <MorphContent from to> shows one scene's content: it fades OUT (0.3 s) just before `to` (= the next state's t) so the frame never shows old content
 * on a moving box, and fades IN (0.35 s) at `from` (= when the speaker reaches it). children may be a function (rect) => node to draw things anchored to the
 * live rectangle (e.g. bars standing on the box when it has collapsed into a baseline). Keep h ≥ 6; use h = 6 with no border for a pure line.
 */
export type MorphState = { t: number; x: number; y: number; w: number; h: number; r?: number };
type MorphRect = { x: number; y: number; w: number; h: number; r: number };
const MORPH_EASE = Easing.bezier(0.45, 0, 0.15, 1);
const MorphCtx = React.createContext<MorphRect>({ x: 0, y: 0, w: 0, h: 0, r: 0 });
const morphRectAt = (states: MorphState[], tt: number, dur: number): MorphRect => {
  let i = 0;
  states.forEach((s, j) => { if (tt >= s.t) i = j; });
  const s = states[i], p = i > 0 ? states[i - 1] : s, k = i > 0 ? MORPH_EASE(clamp((tt - s.t) / dur)) : 1;
  const m = (a: number, b: number) => a + (b - a) * k;
  return { x: m(p.x, s.x), y: m(p.y, s.y), w: m(p.w, s.w), h: m(p.h, s.h), r: m(p.r ?? 24, s.r ?? 24) };
};
export const MorphBox: React.FC<{ states: MorphState[]; dur?: number; accent?: string; fill?: string; children?: React.ReactNode | ((r: MorphRect) => React.ReactNode) }> = ({ states, dur = 1.0, accent, fill = "rgba(10,20,40,.55)", children }) => {
  const t = useT(0), acc = accent ?? GLOW;
  if (t < states[0].t) return null;
  const rect = morphRectAt(states, t, dur);
  const moving = states.some((s, i) => i > 0 && t >= s.t && t < s.t + dur);
  const k0 = ease((t - states[0].t) / 0.4);
  const thin = rect.h < 14;
  return (
    <MorphCtx.Provider value={rect}>
      <div style={{ position: "absolute", left: rect.x, top: rect.y, width: rect.w, height: rect.h, borderRadius: Math.min(rect.r, rect.h / 2), background: thin ? acc : fill, border: thin ? "none" : `2px solid ${acc}`, opacity: k0, boxShadow: moving ? `0 0 28px ${acc}88` : `0 0 10px ${acc}33`, transform: `scale(${0.94 + 0.06 * k0})` }} />
      {typeof children === "function" ? children(rect) : children}
    </MorphCtx.Provider>
  );
};
export const MorphContent: React.FC<{ from: number; to?: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const t = useT(0), r = React.useContext(MorphCtx);
  const inK = ease((t - from) / 0.35), outK = to === undefined ? 1 : ease((to - t) / 0.3);
  const o = clamp(Math.min(inK, outK));
  if (o <= 0) return null;
  return <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, opacity: o, transform: `translateY(${(1 - inK) * 18}px)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", direction: "rtl", fontFamily: kufiF, color: "#fff" }}>{children}</div>;
};

/**
 * 15) TypeBox — «صندوق الكتابة» (reference: motion-lab video §8-أ-2). A card with three dots and a small corner title; a blinking cursor shows first, then the sentence is
 * typed character by character (`cps` chars/s). An optional chip above names the idea. Use for a quoted sentence / verse / a question being "asked".
 * Set `at` = the moment the speaker starts the sentence and `cps` so the typing ends with his last word. `until` fades it out (0.3 s).
 */
export const TypeBox: React.FC<{ at: number; x: number; y: number; w: number; text: string; title?: string; chip?: string; cps?: number; size?: number; until?: number }> = ({ at, x, y, w, text, title = "", chip, cps = 14, size = 64, until }) => {
  const t = useT(at), sp = useSp(at, 15, 120);
  const out = until === undefined ? 1 : ease((until - (t + at)) / 0.3);
  if (t < -0.01 || out <= 0) return null;
  const startType = 0.5, n = Math.max(0, Math.min(text.length, Math.floor((t - startType) * cps)));
  const typed = text.slice(0, n), done = n >= text.length, blinkOn = n > 0 && !done ? true : Math.floor(t * (done ? 2 : 3)) % 2 === 0;
  return (
    <div style={{ position: "absolute", left: x, top: y + (1 - sp) * 30, width: w, opacity: clamp(sp * 1.4) * out }}>
      {false ? <div style={{ position: "absolute", top: -64, left: "50%", transform: "translateX(-50%)", padding: "8px 30px 12px", fontFamily: kufiF, fontSize: 36, color: BRAND.card, borderRadius: 18, background: T.navy, boxShadow: "0 10px 20px rgba(0,0,0,.28)", whiteSpace: "nowrap", direction: "rtl" }}>{chip}</div> : null}
      <div style={{ background: "rgba(10,20,40,.6)", border: "2px solid rgba(255,255,255,.28)", borderRadius: 26, padding: "26px 40px 34px", direction: "rtl", boxShadow: "0 18px 40px rgba(0,0,0,.35)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, fontFamily: kufiF, fontSize: 24, color: "rgba(255,255,255,.55)" }}>
          <span style={{ color: BRAND.card, fontSize: 30, fontWeight: 800 }}>{chip ?? title}</span>
          <span style={{ display: "flex", gap: 8, direction: "ltr" }}>{[0, 1, 2].map((i) => <i key={i} style={{ width: 12, height: 12, borderRadius: 6, background: i === 2 ? GLOW : "rgba(255,255,255,.35)" }} />)}</span>
        </div>
        <div style={{ fontFamily: kufiF, fontSize: size, lineHeight: 1.4, color: "#fff", minHeight: size * 1.4, wordBreak: "keep-all" }}>
          {typed}<span style={{ display: "inline-block", width: 4, height: size * 0.9, marginRight: 6, verticalAlign: "middle", background: GLOW, opacity: blinkOn ? 1 : 0 }} />
        </div>
      </div>
    </div>
  );
};

export const FlashCut: React.FC<{
  at: number; x: number; y: number; w: number; h: number;
  crops: { fx: number; fy: number; zoom: number }[]; beats?: number[]; hud?: string; accent?: string; children: React.ReactNode;
}> = ({ at, x, y, w, h, crops, beats = [1.0, 1.73, 2.33], hud, accent, children }) => {
  const f = useCurrentFrame(), t = f / FPS - at, acc = accent ?? BRAND.card;
  if (t < -0.01) return null;
  const idx = beats.filter((b) => t >= b).length, c = crops[Math.min(idx, crops.length - 1)];
  const cl = (v: number, z: number) => clamp(v, 0.5 / z, 1 - 0.5 / z);
  const fcx = cl(c.fx, c.zoom) * w, fcy = cl(c.fy, c.zoom) * h;
  const tf = idx > 0 ? beats[idx - 1] : null, dt = tf === null ? 99 : t - tf;
  const lastBeat = beats[beats.length - 1];
  const live = idx === 0 ? 1 + 0.03 * clamp(t / beats[0]) : 1;
  const settle = idx > 0 ? 1 + 0.03 * (1 - ease(dt / 0.2)) : 1, sink = idx > 0 ? 16 * (1 - ease(dt / 0.2)) : 0;
  const hold = idx === beats.length ? 1 + 0.015 * clamp((t - lastBeat) / 2.3) : 1;
  const flash = idx > 0 ? 0.95 * (1 - ease(dt / (4 / FPS))) : 0;
  const jit = flash > 0 ? [(random(`jx${f}`) - 0.5) * 4, (random(`jy${f}`) - 0.5) * 4] : [0, 0];
  const zoomNow = c.zoom * live * settle * hold;
  // focus bracket onto the next crop
  const nb = beats[idx], nc = crops[idx + 1];
  let bracket: React.ReactNode = null;
  if (nb !== undefined && nc && t >= nb - 8 / FPS && t < nb) {
    const p = ease((t - (nb - 8 / FPS)) / (8 / FPS)), sc = 1.3 - 0.3 * p;
    const ncx = cl(nc.fx, nc.zoom) * w, ncy = cl(nc.fy, nc.zoom) * h;
    const cx = w / 2 + (ncx - fcx) * zoomNow, cy = h / 2 + (ncy - fcy) * zoomNow, bw = (w / nc.zoom) * zoomNow * sc, bh = (h / nc.zoom) * zoomNow * sc;
    const col = t >= nb - 3 / FPS ? acc : "rgba(255,255,255,.85)";
    const corner = (cxp: number, cyp: number, sx: number, sy: number) => <div style={{ position: "absolute", left: cxp - (sx < 0 ? 36 : 0), top: cyp - (sy < 0 ? 36 : 0), width: 36, height: 36, borderTop: sy > 0 ? `4px solid ${col}` : undefined, borderBottom: sy < 0 ? `4px solid ${col}` : undefined, borderLeft: sx > 0 ? `4px solid ${col}` : undefined, borderRight: sx < 0 ? `4px solid ${col}` : undefined }} />;
    bracket = <>{corner(cx - bw / 2, cy - bh / 2, 1, 1)}{corner(cx + bw / 2, cy - bh / 2, -1, 1)}{corner(cx - bw / 2, cy + bh / 2, 1, -1)}{corner(cx + bw / 2, cy + bh / 2, -1, -1)}</>;
  }
  return (
    <>
      <div style={{ position: "absolute", left: x + jit[0], top: y + jit[1] + sink, width: w, height: h, overflow: "hidden", borderRadius: 12, boxShadow: "0 24px 60px rgba(0,0,0,.45)" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, transformOrigin: `${fcx}px ${fcy}px`, transform: `translate(${w / 2 - fcx}px, ${h / 2 - fcy}px) scale(${zoomNow})` }}>{children}</div>
        {bracket}
      </div>
      {hud && idx === beats.length && t > lastBeat + 0.3 ? <div style={{ position: "absolute", left: x + w - 190, top: y + h + 16, width: 190, textAlign: "left", fontFamily: kufiF, fontSize: 28, color: acc, opacity: ease((t - lastBeat - 0.3) / 0.4), direction: "rtl" }}>{hud}</div> : null}
      {flash > 0 ? <AbsoluteFill style={{ background: `rgba(255,255,255,${flash})` }} /> : null}
    </>
  );
};

/**
 * 20) ConvergeMerge — «التقاء المصادر في نتيجة واحدة» (reference: bezier-source-converge-merge; SKILL.md §12). N source pills sit on one side; curved lines DRAW from them one after
 * another (0.3 s apart) to ONE result badge; light packets run along the lines; at `mergeAt` (= when the speaker says the shared conclusion / common origin) every pill slides along
 * its own curve into the badge, shrinking (3/4 slow, last quarter fast = "pulled in"), the badge pulses +12 %, the lines retract from the start and the caption fades in.
 * Use for: several things that share ONE root/ruling/source («الأشعرية والماتريدية والمعتزلة ← أصلهم التعطيل / كلهم يأخذون من أرسطو»). 2–5 sources (6+ overlap). RTL: pills on the right.
 */
const cubicPt = (p: number[][], u: number) => { const m = 1 - u; return [m * m * m * p[0][0] + 3 * m * m * u * p[1][0] + 3 * m * u * u * p[2][0] + u * u * u * p[3][0], m * m * m * p[0][1] + 3 * m * m * u * p[1][1] + 3 * m * u * u * p[2][1] + u * u * u * p[3][1]]; };
const cubicLen = (p: number[][]) => { let L = 0, a = cubicPt(p, 0); for (let i = 1; i <= 24; i++) { const b = cubicPt(p, i / 24); L += Math.hypot(b[0] - a[0], b[1] - a[1]); a = b; } return L; };
export const ConvergeMerge: React.FC<{
  at: number; mergeAt: number; x: number; y: number; w: number; h: number;
  sources: string[]; sourceAt?: number[]; result?: string; caption?: string; rtl?: boolean; accent?: string; conv?: number;
}> = ({ at, mergeAt, x, y, w, h, sources, sourceAt, result = "", caption, rtl = true, accent, conv = 1.4 }) => {
  const t = useT(0), acc = accent ?? T.accent;
  const st = (i: number) => sourceAt?.[i] ?? at + i * 0.3; // each source appears when the speaker names it
  if (t < at - 0.01) return null;
  const n = sources.length, X = (v: number) => (rtl ? w - v : v);
  const srcX = w * 0.2, mx = w * 0.8, my = h / 2, gap = Math.min(150, h / (n + 0.6));
  const ys = sources.map((_, i) => my + (i - (n - 1) / 2) * gap);
  const paths = ys.map((yi) => [[srcX + 55, yi], [srcX + (mx - srcX) * 0.45, yi], [mx - (mx - srcX) * 0.35, my], [mx, my]]);
  const cl = paths.map(cubicLen), straight = 0;
  const tc = ease(0), cEnd = mergeAt + conv;
  void tc;
  const k = clamp((t - mergeAt) / conv), conv0 = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  const erase = clamp((t - (cEnd + 0.1)) / 0.5), pulse = Math.sin(Math.PI * clamp((t - (cEnd - 0.1)) / 0.5));
  const badgeK = ease((t - at - 0.6) / 0.4), capK = ease((t - (cEnd + 0.4)) / 0.5);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, direction: "rtl", fontFamily: kufiF, color: "#fff" }}>
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {paths.map((p, i) => {
          const draw = ease((t - st(i)) / 0.5) * (1 - erase), tot = straight + cl[i];
          const d = `M ${X(p[0][0])},${p[0][1]} C ${X(p[1][0])},${p[1][1]} ${X(p[2][0])},${p[2][1]} ${X(p[3][0])},${p[3][1]}`;
          const cyc = ((((t - at - 0.4) / 1.6) + i * 0.13) % 1 + 1) % 1, dist = cyc * tot;
          let px: number, py: number;
          if (dist < straight) { px = p[0][0] - 20 + dist; py = p[0][1]; } else { const [a, b] = cubicPt(p, clamp((dist - straight) / cl[i])); px = a; py = b; }
          const pkO = t > at + 0.4 && k < 0.6 ? (1 - Math.abs(cyc - 0.5) * 0.6) * draw : 0;
          return (
            <g key={i}>
              <path d={d} fill="none" stroke={BRAND.card} strokeWidth={22} strokeLinecap="butt" pathLength={1} strokeDasharray={`0.0001 ${Math.min(conv0, draw)} ${Math.max(0.0001, draw - conv0)} 2`} />
              <path d={d} fill="none" stroke={T.navy} strokeWidth={13} strokeLinecap="butt" pathLength={1} strokeDasharray={`0.0001 ${Math.min(conv0, draw)} ${Math.max(0.0001, draw - conv0)} 2`} />
              {pkO > 0 ? <circle cx={X(px)} cy={py} r={7} fill={acc} opacity={pkO} /> : null}
            </g>
          );
        })}
      </svg>
      {sources.map((s, i) => {
        const draw = ease((t - st(i)) / 0.5);
        if (draw <= 0.02) return null;
        const [bx, by] = k > 0 ? cubicPt(paths[i], conv0) : [srcX, ys[i]];
        const sc = conv0 < 0.75 ? 1 - (conv0 / 0.75) * 0.66 : 0.34 * (1 - (conv0 - 0.75) / 0.25);
        const o = clamp(draw * 3) * (conv0 > 0.92 ? 1 - (conv0 - 0.92) / 0.08 : 1);
        // paper-card style (same family as EuKit StatRow/Banner): light card, ink Kufi text, accent square, soft shadow, alternating tiny tilt
        return <div key={i} style={{ position: "absolute", left: X(bx), top: by, transform: `translate(-50%,-50%) scale(${Math.max(0, sc)}) rotate(${(i % 2 ? 1 : -1) + (k <= 0 ? Math.sin(t * 12 + i * 2.1) * 0.6 : 0)}deg)`, opacity: o, display: "flex", alignItems: "center", gap: 16, padding: "12px 28px 16px", fontSize: 40, fontWeight: 800, color: T.ink, borderRadius: 14, background: T.card, boxShadow: "0 14px 26px rgba(0,0,0,.26), 0 2px 0 rgba(0,0,0,.08)", whiteSpace: "nowrap" }}><span style={{ width: 18, height: 18, borderRadius: 5, background: acc, flexShrink: 0 }} />{s}</div>;
      })}
      <div style={{ position: "absolute", left: X(mx), top: my, transform: `translate(-50%,-50%) scale(${(0.7 + 0.3 * badgeK) * (1 + 0.08 * pulse)})`, opacity: badgeK, padding: "18px 34px 24px", borderRadius: 18, background: T.navy, color: BRAND.card, fontWeight: 800, border: `5px solid ${BRAND.card}`, boxShadow: "0 14px 26px rgba(0,0,0,.28)", fontSize: 50, whiteSpace: "nowrap" }}>{result}</div>
      {caption ? <div style={{ position: "absolute", left: X(mx), top: my + 110, transform: `translateX(-50%) translateY(${(1 - capK) * 16}px) rotate(-1deg)`, opacity: capK, padding: "10px 30px 14px", borderRadius: 14, background: T.card, color: T.ink, fontWeight: 800, fontSize: 44, whiteSpace: "nowrap", boxShadow: "0 14px 26px rgba(0,0,0,.26)" }}>{caption}</div> : null}
    </div>
  );
};

/**
 * 21) BlurRise — «ظهور من الضبابية» (reference: blur-slide; SKILL.md §10). Each word rises, sharpens and fades in from ONE shared progress p (quint-out): opacity = p,
 * offset = (1-p)·0.38em, blur = (1-p)·0.12em — never separate curves. 3–4 frames between words (stagger 0.12 s), 0.7 s window per word; pass `times` to land each word
 * exactly when spoken. Place this overlay in a clear area of the current recording; give `bodyBox` = {x, w} of the visible body in the frame and the text
 * block is placed in the wider FREE side so it never covers the face or beard; no background cut-out is implied. Check with a still before showing. accentWords = indices coloured with accentColor.
 */
/** light text drawn straight over video always carries a black outline (user 2026-10-25: «الخط الأبيض يحتاج إطار أسود ليكون واضحاً») */
const LIGHT = /^(#f{3}|#f{6}|#fff|white|rgba?\(255)/i;
export const BlurRise: React.FC<{
  at: number; text: string; x?: number; y: number; w?: number; size?: number; stagger?: number; win?: number; color?: string; accentColor?: string; accentWords?: number[];
  times?: number[]; align?: "right" | "left" | "center"; bodyBox?: { x: number; w: number }; canvasW?: number;
}> = ({ at, text, x = 160, y, w = 1600, size = 100, stagger = 0.12, win = 0.7, color = "#fff", accentColor = GLOW, accentWords = [], times, align = "center", bodyBox, canvasW = 1920 }) => {
  const t = useT(0);
  const words = text.split(/\s+/).filter(Boolean);
  let zx = x, zw = w;
  if (bodyBox) {
    const L = bodyBox.x, R = canvasW - (bodyBox.x + bodyBox.w), m = 80;
    if (R >= L) { zx = bodyBox.x + bodyBox.w + m; zw = R - 2 * m; } else { zx = m; zw = L - 2 * m; }
  }
  return (
    <div style={{ position: "absolute", left: zx, top: y, width: zw, textAlign: align, direction: "rtl", fontFamily: zainF, fontSize: size, lineHeight: 1.3, color, WebkitTextStroke: LIGHT.test(color) ? `${Math.max(2, size * 0.07)}px rgba(8,8,8,.9)` : undefined, paintOrder: "stroke fill" }}>
      {words.map((wd, i) => {
        const start = times ? times[i] : at + i * stagger, p = 1 - Math.pow(1 - clamp((t - start) / win), 5);
        return <span key={i} style={{ display: "inline-block", margin: `0 ${size * 0.14}px`, opacity: p, transform: `translateY(${(1 - p) * size * 0.38}px)`, filter: p < 1 ? `blur(${((1 - p) * size * 0.12).toFixed(1)}px)` : undefined, color: accentWords.includes(i) ? accentColor : color }}>{wd}</span>;
      })}
    </div>
  );
};

/**
 * 22) PanelToCanvas — «من القائمة إلى اللوحة» (reference: canvas-materialize-moves, pattern A; SKILL.md §14). A list panel (put it on the RIGHT) with rows; when the speaker names
 * the chosen items the cursor ticks them one by one (picks[i].check), then each chosen row LIFTS (0.13 s), flies along an arc (220 px up) and MORPHS into a card that lands in
 * `canvas` (put it on the LEFT, speaker in the middle). Cards stack in ONE vertical column with small alternating tilts (−2.5°, 1.8°, −1.2°); the source row leaves a dashed empty
 * slot (so it reads as moved, not copied). picks[i].fly = absolute second the card should start flying (stagger ≈ 0.2–0.4 s, speech-driven). Row text = card title; rows[i].sub = card sub-line.
 * Use when he picks a few of a longer list («من بين الأسباب الأربعة اثنان…»): the panel shows all, the cards show the ones he stresses.
 */
export const PanelToCanvas: React.FC<{
  at: number; panel: { x: number; y: number; w: number; h: number; title: string; button?: string }; canvas: { x: number; y: number; w: number; h: number };
  rows: { title: string; sub?: string }[]; picks: { row: number; check: number; fly: number }[]; accent?: string;
}> = ({ at, panel, canvas, rows, picks, accent }) => {
  const t = useT(0), acc = accent ?? T.accent;
  if (t < at - 0.01) return null;
  const pk = ease((t - at) / 0.5), n = rows.length, rh = Math.min(104, (panel.h - 210) / n), rowW = panel.w - 48;
  const rowY = (i: number) => panel.y + 100 + i * (rh + 10), rowCx = panel.x + panel.w / 2;
  const gap = 22, ch = rh, tilts = [-2.5, 1.8, -1.2];
  const firstFly = Math.min(...picks.map((p) => p.fly)), btnPress = Math.sin(Math.PI * clamp((t - (firstFly - 0.25)) / 0.25));
  // cursor: ticks then the button
  const cps = [...picks.map((p) => ({ t: p.check, x: panel.x + 60, y: rowY(p.row) + rh / 2 })), { t: firstFly - 0.2, x: rowCx, y: panel.y + panel.h - 50 }];
  let cx = cps[0].x - 60, cy = cps[0].y + 80;
  cps.forEach((c, i) => { const prev = i ? cps[i - 1] : { t: c.t - 0.45, x: cx, y: cy }; const u = ease((t - (c.t - 0.4)) / 0.4); if (t >= c.t - 0.4) { cx = prev.x + (c.x - prev.x) * u; cy = prev.y + (c.y - prev.y) * u; } });
  const showCursor = t > cps[0].t - 0.5 && t < firstFly + 0.4;
  return (
    <>
      <div style={{ position: "absolute", left: panel.x, top: panel.y, width: panel.w, height: panel.h, opacity: pk, transform: `translateY(${(1 - pk) * 30}px)`, borderRadius: 28, background: T.navy, boxShadow: "0 24px 60px rgba(0,0,0,.45)", direction: "rtl", fontFamily: kufiF, color: "#fff" }}>
        <div style={{ position: "absolute", right: 28, top: 26, fontSize: 40 }}>{panel.title}</div>
        <div style={{ position: "absolute", left: 24, width: panel.w - 48, bottom: 24, height: 64, borderRadius: 18, background: acc, color: T.onAccent, fontSize: 32, display: "grid", placeItems: "center", transform: `scale(${1 - 0.04 * btnPress})`, fontWeight: 800 }}>{panel.button ?? "نقل"}</div>
      </div>
      {rows.map((r, i) => {
        const pick = picks.find((p) => p.row === i), j = pick ? picks.indexOf(pick) : -1;
        const checked = pick ? ease((t - pick.check) / 0.2) : 0, moved = pick && t >= pick.fly;
        if (moved) return <div key={i} style={{ position: "absolute", left: panel.x + 24, top: rowY(i), width: rowW, height: rh, borderRadius: 18, border: "2px dashed rgba(255,255,255,.28)", opacity: pk }} />;
        const lift = pick ? clamp((t - (pick.fly - 0.13)) / 0.13) : 0;
        return (
          <div key={i} style={{ position: "absolute", left: panel.x + 24, top: rowY(i), width: rowW, height: rh, opacity: pk, borderRadius: 18, border: `3px solid ${checked > 0 ? acc : "transparent"}`, background: T.card, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 26px", direction: "rtl", fontFamily: kufiF, fontSize: 36, color: T.ink, transform: `scale(${1 + 0.02 * lift})`, boxShadow: lift ? `0 ${14 * lift}px 30px rgba(0,0,0,.4)` : undefined }}>
            <span>{r.title}</span>
            <span style={{ width: 34, height: 34, borderRadius: 9, border: `2px solid ${checked > 0 ? acc : T.gray}`, background: checked > 0 ? acc : "transparent", color: T.onAccent, display: "grid", placeItems: "center", fontSize: 26, transform: `scale(${checked > 0 ? 1 + 0.25 * Math.sin(Math.PI * checked) : 1})` }}>{checked > 0.5 ? "✓" : ""}</span>
            {j < 0 ? null : null}
          </div>
        );
      })}
      {picks.map((p, j) => {
        if (t < p.fly - 0.13) return null;
        const u = ease((t - p.fly) / 0.8), u2 = ease((t - p.fly - 0.1) / 0.8), r = rows[p.row];
        const sx = rowCx, sy = rowY(p.row) + rh / 2, ex = canvas.x + canvas.w / 2, ey = canvas.y + j * (ch + gap) + ch / 2, mxp = (sx + ex) / 2, myp = (sy + ey) / 2 - 220;
        const px = (1 - u) * (1 - u) * sx + 2 * (1 - u) * u * mxp + u * u * ex, py = (1 - u) * (1 - u) * sy + 2 * (1 - u) * u * myp + u * u * ey;
        const wNow = rowW, hNow = rh, speed = Math.sin(Math.PI * clamp((t - p.fly) / 0.8));
        const cardO = clamp((u - 0.5) / 0.3);
        const tilt = 0 * tilts[j % 3] * u, land = clamp((t - p.fly - 0.8) / 0.2), sy2 = 1 - 0.03 * Math.sin(Math.PI * land);
        const lift = clamp((t - (p.fly - 0.13)) / 0.13);
        return (
          <div key={j} style={{ position: "absolute", left: px - wNow / 2, top: py - hNow / 2, width: wNow, height: hNow, transform: `rotate(${tilt}deg) scale(${(1 + 0.02 * lift) * 1}, ${sy2})`, filter: speed > 0.05 ? `blur(${(speed * 6).toFixed(1)}px)` : undefined, borderRadius: 18 + 6 * u2, direction: "rtl", fontFamily: kufiF, color: "#fff", overflow: "hidden", background: T.card, border: `3px solid ${acc}`, boxSizing: "border-box", boxShadow: "0 20px 44px rgba(0,0,0,.45)" }}>
            <div style={{ position: "absolute", inset: 0, color: T.ink, padding: "0 26px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}><div style={{ fontSize: 36, lineHeight: 1.2 }}>{r.title}</div>{r.sub ? <div style={{ fontSize: 28, color: T.gray, opacity: cardO }}>{r.sub}</div> : null}</div>
              <span style={{ flex: "none", width: 34, height: 34, borderRadius: 9, background: acc, color: T.onAccent, display: "grid", placeItems: "center", fontSize: 26 }}>✓</span>
            </div>
          </div>
        );
      })}
      {showCursor ? <svg width={34} height={34} viewBox="0 0 24 24" style={{ position: "absolute", left: cx, top: cy, filter: "drop-shadow(0 3px 4px rgba(0,0,0,.5))" }}><path d="M3 2 L3 19 L8 14.5 L11.5 22 L14 21 L10.5 13.5 L17 13.5 Z" fill="#fff" stroke={BRAND.base3} strokeWidth={1.4} /></svg> : null}
    </>
  );
};

/**
 * 23) PhoneChips — «الجوال والفقاعات» (reference: radial-ripple-phone-chips; SKILL.md §15). A calm product hero for anything shown on a phone (an app, a notification, a chat, a
 * website on mobile): (rings are OPTIONAL and OFF by default — the effect has NO background of its own, the video's background shows; pass rings=[4 colours] only if asked) concentric rings "breathe" behind a centred phone (±6 % scale, 1.5 cycles, neighbours offset 1.7 rad = ripples, not a pulse), the phone rises from below in 0.9 s
 * with its shadow tightening, the screen content scrolls UP at constant speed (no easing = autoplay look), and white chips pop in on either side one after another
 * (spring damping 13 / stiffness 190, slide 28 px outward, then float ±8 px). `screen` = the phone content, taller than the screen by `scroll` px (use a tall screenshot).
 * chips[i].at = the second the speaker names that feature (left first, right ≥ 1 s later — never both together). Phone 390×800 by default; keep chip text short (≤ 18 chars).
 */
export const PhoneChips: React.FC<{
  at: number; cx?: number; cy?: number; w?: number; h?: number; dur?: number; scroll?: number; screen?: React.ReactNode; notch?: boolean;
  chips?: { text: string; side: "left" | "right"; at: number; dy?: number }[]; rings?: string[]; accent?: string;
}> = ({ at, cx = 960, cy = 540, w = 390, h = 800, dur = 5.6, scroll = 560, screen, chips = [], rings = [], accent, notch = true }) => {
  const t = useT(at), acc = accent ?? GLOW;
  if (t < -0.01) return null;
  const rise = 1 - Math.pow(1 - clamp(t / 0.87), 3), phoneY = (1 - rise) * 700;
  const sizes = [2240, 1760, 1280, 840];
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {rings.length ? sizes.map((d, i) => {
        const sc = 1 + 0.06 * Math.sin((t / dur) * 1.5 * Math.PI * 2 + i * 1.7);
        return <div key={i} style={{ position: "absolute", left: cx - d / 2, top: cy - d / 2, width: d, height: d, borderRadius: "50%", background: rings[i], transform: `scale(${sc})`, boxShadow: "inset 0 3px 0 rgba(255,255,255,.12), 0 0 0 1px rgba(255,255,255,.08)" }} />;
      }) : null}
      {rings.length ? <div style={{ position: "absolute", left: cx - 380, top: cy - 380, width: 760, height: 760, borderRadius: "50%", background: `radial-gradient(circle, ${acc}22, transparent 65%)` }} /> : null}
      <div style={{ position: "absolute", left: cx - w / 2 - 14, top: cy - h / 2 - 14 + phoneY, width: w + 28, height: h + 28, borderRadius: 78, background: `linear-gradient(145deg,${BRAND.paper2},${BRAND.gray})`, boxShadow: `0 ${10 + 30 * rise}px ${20 + 40 * rise}px rgba(0,0,0,.45), 0 4px 8px rgba(0,0,0,.5)` }}>
        <div style={{ position: "absolute", left: 7, top: 7, right: 7, bottom: 7, borderRadius: 71, background: BRAND.base3 }}>
          <div style={{ position: "absolute", left: 7, top: 7, right: 7, bottom: 7, borderRadius: 64, overflow: "hidden", background: BRAND.card }}>
            <div style={{ position: "absolute", left: 0, top: 0, width: "100%", transform: `translateY(${-scroll * clamp(t / dur)}px)` }}>{screen}</div>
            {notch ? <div style={{ position: "absolute", left: "50%", top: 12, width: 104, height: 30, marginLeft: -52, borderRadius: 16, background: "#000" }} /> : null}
            <div style={{ position: "absolute", inset: 0, borderRadius: 64, background: "linear-gradient(115deg,rgba(255,255,255,.18),transparent 35%)", pointerEvents: "none" }} />
          </div>
        </div>
      </div>
      {chips.map((c, i) => {
        const tt = t - (c.at - at);
        if (tt < 0) return null;
        const sp = spring({ frame: Math.round(tt * FPS), fps: FPS, config: { damping: 13, stiffness: 190 } });
        const fl = ease((tt - 0.6) / 0.8) * 8 * Math.sin((tt / dur) * 2 * Math.PI * 2 + i);
        const dir = true ? -1 : 1, base = cx + dir * (w / 2 + 70), edge = base - dir * 28 * (1 - Math.min(1, sp));
        return (
          <div key={i} style={{ position: "absolute", top: cy + (c.dy ?? (i % 2 ? 110 : -130)) + fl, [true ? "right" : "left"]: true ? 1920 - edge : edge, opacity: clamp(tt / (5 / FPS)), transform: `scale(${0.8 + 0.2 * sp})`, transformOrigin: true ? "right center" : "left center", display: "flex", alignItems: "center", gap: 16, padding: "14px 34px 14px 20px", borderRadius: 60, background: "#fff", color: BRAND.ink, fontFamily: kufiF, fontSize: 40, direction: "rtl", whiteSpace: "nowrap", boxShadow: "0 14px 34px rgba(0,0,0,.35)" }}>
            <span style={{ width: 46, height: 46, borderRadius: "50%", background: acc, display: "inline-block" }} />
            {c.text}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/**
 * 24) SakugaMove — «حركة البطاقة بنبضات ثم اندفاع» (reference: sakuga-timing-shift; SKILL.md §16). One of the ways a SOURCE CARD (a clip/screenshot/page) can move on screen —
 * best when a source stays > 10 s, but fine for shorter ones too. Phase 1 «على 3»: the card updates only every 3rd frame (≈10 fps flip-book stutter), each step ≥ 30 px, with a
 * ±5° swing, alternating squash/stretch (0.97 / 1.035) and a small hop (−18 / −2 px); phase 2 at `switchAt` changes to every frame: a hard 2-frame impact (optional), a violent
 * quartic-out sprint to `to`, overshoot ≈ 40 px, 6-frame rebound, landing squash (0.92 × 1.07), motion-stretch + speed lines while fast; then it HOLDS almost still (2 % push).
 * children = the card content drawn at w×h. labels = [before, after] chip text that bounces 1.25× at the switch (a switch cue is required: chip, sound or both).
 * Use at most ONE time-manipulation per shot; the impact frames once per shot; no tween across the switch.
 */
export const SakugaMove: React.FC<{
  at: number; w: number; h: number; from: { x: number; y: number }; mid: { x: number; y: number }; to: { x: number; y: number };
  switchAt?: number; sprint?: number; impact?: boolean; name?: string; labels?: [string, string]; labelPos?: { left: number; top: number }; accent?: string; children: React.ReactNode;
}> = ({ at, w, h, from, mid, to, switchAt = 1.6, sprint = 0.85, impact = true, name, labels, labelPos = { left: 60, top: 50 }, accent, children }) => {
  void labels; void labelPos;   // the label box above the card was removed (gallery 2026-10-28)
  const f0 = useCurrentFrame() - Math.round(at * FPS), acc = accent ?? GLOW;
  if (f0 < 0) return null;
  const sw = Math.round(switchAt * FPS), sp = Math.round(sprint * FPS), rb = 6;
  let x: number, y: number, rot = 0, sx = 1, sy = 1, hop = 0, speed = 0, dirX = 0;
  if (f0 < sw) {
    const q = Math.floor(f0 / 3) * 3, s = q / sw, k = Math.round(q / 3);
    x = from.x + (mid.x - from.x) * s; y = from.y + (mid.y - from.y) * s;
    rot = (k % 2 ? 1 : -1) * 5; sx = k % 2 ? 0.97 : 1.035; sy = k % 2 ? 1.035 : 0.97; hop = k % 2 ? -18 : -2;
  } else {
    const g = f0 - sw, dx = to.x - mid.x, dy = to.y - mid.y, len = Math.hypot(dx, dy) || 1, ox = to.x + (dx / len) * 40, oy = to.y + (dy / len) * 40;
    dirX = Math.sign(dx) || 1;
    if (g < sp) {
      const u = clamp(g / sp), e = 1 - Math.pow(1 - u, 4);
      x = mid.x + (ox - mid.x) * e; y = mid.y + (oy - mid.y) * e;
      speed = Math.pow(1 - u, 3);
      sx = 1 + 0.3 * speed; sy = 1 - 0.1 * speed;
    } else {
      const u = clamp((g - sp) / rb), e = u * u * (3 - 2 * u);
      x = ox + (to.x - ox) * e; y = oy + (to.y - oy) * e;
      sx = 0.92 + 0.08 * e; sy = 1.07 - 0.07 * e;
    }
  }
  const t = f0 / FPS, after = f0 >= sw, push = 1 + 0.02 * clamp((f0 - sw - sp - rb) / (2 * FPS));
  const bounce = after ? 1 + 0.25 * Math.max(0, 1 - (f0 - sw) / 8) : 1;
  void acc; void bounce;
  void t;
  const showImpact = impact && f0 >= sw && f0 < sw + 2;
  return (
    <>
      {showImpact ? (
        <AbsoluteFill style={{ background: BRAND.base3 }}>
          {Array.from({ length: 36 }, (_, i) => <div key={i} style={{ position: "absolute", left: x + w / 2, top: y + h / 2, width: 2200, height: 5 + (i % 3) * 3, background: BRAND.card, transformOrigin: "0 50%", transform: `rotate(${i * 10}deg)` }} />)}
        </AbsoluteFill>
      ) : null}
      {speed > 0.15 ? Array.from({ length: 9 }, (_, i) => <div key={i} style={{ position: "absolute", left: x + (dirX > 0 ? -speed * 300 : w), top: y + 10 + (i / 8) * (h - 20), width: speed * 300, height: 3, background: "rgba(255,255,255,.55)" }} />) : null}
      <div style={{ position: "absolute", left: x, top: y + hop, width: w, height: h, transform: `rotate(${rot}deg) scale(${sx * push}, ${sy * push})`, filter: "drop-shadow(0 18px 30px rgba(0,0,0,.45))" }}>
        <div style={{ position: "absolute", inset: 0, background: BRAND.card, padding: 10, boxSizing: "border-box", borderRadius: 26 }}>
          <div style={{ position: "absolute", left: w * 0.5 - 34, top: -16, width: 68, height: 30, background: alpha(BRAND.accent, .92), transform: "rotate(-6deg)", boxShadow: "0 2px 4px rgba(0,0,0,.25)", zIndex: 2 }} />
          <div style={{ width: "100%", height: name ? h - 76 : h - 20, overflow: "hidden", position: "relative", borderRadius: 18 }}>{children}</div>
          {name ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 14, textAlign: "center", fontFamily: naskhF, fontSize: 30, color: T.ink, direction: "rtl", lineHeight: 1.15 }}>{name}</div> : null}
        </div>
      </div>
    </>
  );
};

/** «مشي المصدر» — the user's name (2026-10-20) for SakugaMove; use it for photos of people he mentions or replies to, and for any source card. */
export const SourceWalk = SakugaMove;

/**
 * 25) SpotlightCard — «الكشّاف على بطاقة المصدر» (reference: spotlight-hero-card; SKILL.md §17). Display of a WRITTEN source: the page dims like a dark theatre (multiply ≈ .9),
 * a warm round spotlight visits 3 stops and LOCKS on the card (pool pulses 6 %), then the round light morphs into a CARD-SHAPED soft light, the card RISES with overshoot,
 * hovers (sine ±4 px), a contour beam traces its edge twice (first lap fast and bright, second slower and weaker), and it RESEATS with a slight press and a warm landing glow;
 * then a still hold. `background` = the page the card lives on (dimmed); children = the card/source image at `card` rect (never dimmed: it stays fully lit, text contrast intact).
 * Use as ONE of several source-display moves (alternate with others for variety); one hero card only — no glints on neighbours. Times: lockAt, reseatAt (seconds after `at`).
 */
export const SpotlightCard: React.FC<{
  at: number; card: { x: number; y: number; w: number; h: number }; lockAt?: number; reseatAt?: number; stops?: [number, number][]; tilt?: number; dark?: number;
  background?: React.ReactNode; children: React.ReactNode;
}> = ({ at, card, lockAt = 1.1, reseatAt = 4.2, stops, tilt = 0, dark = 0.9, background, children }) => {
  const t = useT(at), id = useId().replace(/:/g, "");
  if (t < -0.01) return null;
  const cx = card.x + card.w / 2, cy = card.y + card.h / 2;
  const st: [number, number][] = [...(stops ?? [[480, 300], [1300, 420], [820, 720]]), [cx, cy]];
  // spotlight position through the stops (2-3 frame pauses implied by easing)
  const seg = Math.min(st.length - 1, Math.floor(clamp(t / lockAt) * (st.length - 1) * 0.9999)), u = ease(clamp(t / lockAt) * (st.length - 1) - seg);
  const a = st[seg], b = st[Math.min(st.length - 1, seg + 1)];
  const sx = t >= lockAt ? cx : a[0] + (b[0] - a[0]) * u, sy = t >= lockAt ? cy : a[1] + (b[1] - a[1]) * u;
  const pulse = t >= lockAt && t < lockAt + 0.3 ? 1 + 0.06 * Math.sin(Math.PI * (t - lockAt) / 0.3) : 1;
  const r = (t < lockAt ? 400 - 100 * ease(t / lockAt) : 300) * pulse;
  const morph = ease((t - (lockAt + 0.13)) / 0.6);              // round -> card-shaped
  const lights = t < 0.2 ? 0.62 + 0.3 * Math.sin(Math.PI * t / 0.2) : 0.62;
  void lights;
  const rise = ease((t - (lockAt + 0.75)) / 0.33), over = rise > 0 ? 1 + 0.06 * Math.sin(Math.PI * Math.min(1, rise)) : 1;
  const reseat = ease((t - reseatAt) / 0.6), lift = (rise - reseat) * 22, hover = rise > 0 && t < reseatAt ? 4 * Math.sin((t - lockAt) * Math.PI * 2 / 1.33) : 0;
  const glow = t >= reseatAt ? Math.max(0, 1 - (t - reseatAt) / 0.8) : 0;
  const lap1 = clamp((t - (lockAt + 1.15)) / 0.5), lap2 = clamp((t - (lockAt + 1.8)) / 0.65);
  const hold = t > reseatAt + 0.6 ? 1 + 0.012 * Math.sin((t - reseatAt) * 2) : 1;
  const press = t >= reseatAt + 0.4 && t < reseatAt + 0.7 ? 0.997 : 1;
  return (
    <AbsoluteFill style={{ perspective: 1200 }}>
      <AbsoluteFill>{background}</AbsoluteFill>
      <div style={{ position: "absolute", left: card.x, top: card.y, width: card.w, height: card.h, borderRadius: 24, overflow: "hidden" }}>{children}</div>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, opacity: ease(t / 0.15) }}>
        <defs>
          <filter id={"bl" + id} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="40" /></filter>
          <filter id={"bc" + id} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="18" /></filter>
          <mask id={"m" + id}>
            <rect width={1920} height={1080} fill="#fff" />
            <circle cx={sx} cy={sy} r={r} fill="#000" opacity={1 - morph} filter={`url(#bl${id})`} />
            <rect x={card.x - 10} y={card.y - 10} width={card.w + 20} height={card.h + 20} rx={34} fill="#000" opacity={morph} filter={`url(#bc${id})`} />
          </mask>
        </defs>
        <rect width={1920} height={1080} fill={`rgba(10,18,30,${dark * (t >= reseatAt + 0.6 ? 0.55 + 0.45 * (1 - ease((t - reseatAt - 0.6) / 0.8)) : 1)})`} mask={`url(#m${id})`} />
        {t < lockAt + 0.8 ? <polygon points={`${sx + 420},-60 ${sx + 560},-60 ${sx + 60},${sy} ${sx - 60},${sy}`} fill={alpha(BRAND.card, .10)} filter={`url(#bc${id})`} /> : null}
      </svg>
      <div style={{ position: "absolute", left: card.x, top: card.y - lift + hover, width: card.w, height: card.h, opacity: ease((t - (lockAt + 0.1)) / 0.4), transform: `rotateY(${tilt * rise}deg) scale(${over * hold * press * (1 + 0.02 * rise)})`, boxShadow: `${-14 * rise}px ${(18 + 20 * rise)}px ${30 + 30 * rise}px rgba(0,0,0,.5)${glow ? `, 0 0 ${50 * glow}px rgba(243,217,160,${0.7 * glow})` : ""}`, borderRadius: 24, overflow: "hidden" }}>{children}</div>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}>
        {[[lap1, 1, 5], [lap2, 0.55, 3.5]].map(([lp, op, sw], i) => lp > 0 && lp < 1 ? <rect key={i} x={card.x} y={card.y - lift + hover} width={card.w} height={card.h} rx={24} fill="none" stroke={`rgba(246,248,250,${op})`} strokeWidth={sw} pathLength={1} strokeDasharray="0.22 0.78" strokeDashoffset={-lp} /> : null)}
      </svg>
    </AbsoluteFill>
  );
};

/**
 * 26) TimelineTravel — «السفر على خط زمني» (reference: timeline-travel; SKILL.md §18). For a biography / history / stages told through the WHOLE video: every time the speaker reaches
 * the next stage this overlay appears over the BOTTOM HALF (dimmed) — the axis slides from the previous station to the new one (slow start → rush → 12 % hard brake), minor ticks give
 * the speed reference, motion blur only while fast, the stage card springs up from the axis (damping ≈ 11, overshoot) ~6 frames before the camera arrives, then a 10-frame push-in
 * 1 → 1.28 and a hold ≥ 1 s; then the overlay fades and the video returns. stages[i].at = the moment the speaker names stage i (the camera ARRIVES then; travel starts `travel` s earlier,
 * stage 0 has no travel). rtl: earlier stations on the RIGHT (Arabic reading). bandY = top of the dimmed band (never over the Sheikh's face: use a bottom band only).
 */
export const TimelineTravel: React.FC<{
  stages: { at: number; date: string; title: string; sub?: string }[]; travel?: number; hold?: number; bandY?: number; spacing?: number; rtl?: boolean; accent?: string; dim?: number; axisK?: number; compact?: boolean;
}> = ({ stages, travel = 1.1, hold = 2.6, bandY = 540, spacing = 760, rtl = true, accent, dim = 0.62, axisK = 0.58, compact = false }) => {
  const t = useT(0), acc = accent ?? GLOW, dir = rtl ? -1 : 1, W = 1920, H = 1080;
  // active window for stage i: [start-0.5, at+hold+0.4]
  let i = -1;
  stages.forEach((s, k) => { const start = (k === 0 ? s.at : s.at - travel) - 0.5; if (t >= start && t <= s.at + hold + 0.4) i = k; });
  if (i < 0) return null;
  const s = stages[i], start = (i === 0 ? s.at : s.at - travel);
  const vis = Math.min(ease((t - (start - 0.5)) / 0.4), ease((s.at + hold + 0.4 - t) / 0.4));
  const camX = (k: number) => dir * k * spacing;
  const u = i === 0 ? 1 : clamp((t - start) / travel);
  const eased = interpolate(u, [0, 0.15, 0.88, 1], [0, 0.055, 0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cam = i === 0 ? camX(0) : camX(i - 1) + (camX(i) - camX(i - 1)) * eased, speed = i === 0 ? 0 : Math.abs(eased - interpolate(clamp(u - 0.03), [0, 0.15, 0.88, 1], [0, 0.055, 0.9, 1])) * 30;
  const PUSH = compact ? 1.15 : 1.28, brake = i === 0 ? 0 : clamp((t - s.at) / (10 / FPS)), push = 1 + (PUSH - 1) * (1 - Math.pow(1 - brake, 3));
  // no-clip guard (user 2026-10-25): the band and the axis are placed so the pushed card (above) and its date (below) always fit inside the frame
  const cardH = compact ? 92 : 136, needAbove = (18 + cardH) * PUSH + 24, needBelow = (22 + 46) * PUSH + 24;
  const axisY = Math.min(bandY + (H - bandY) * axisK, H - needBelow), px = (wx: number) => W / 2 + (wx - cam);
  bandY = Math.min(bandY, axisY - needAbove);
  // a stage is visible only while its whole card is inside the frame (fades out before it touches an edge, never shown cut)
  const inFrame = (wx: number) => { const cx = W / 2 + wx * push, half = 250 * push; return clamp(Math.min(cx - half - 24, W - 24 - (cx + half)) / 90); };
  const ticks: number[] = []; for (let k = Math.floor((cam - 1100) / 70); k <= Math.ceil((cam + 1100) / 70); k++) ticks.push(k * 70);
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: bandY, width: W, height: H - bandY, background: `linear-gradient(to bottom, rgba(6,12,24,0), rgba(6,12,24,${dim * vis}) 45%)` }} />   {/* shade fades in from the top of the band (user 2026-10-31) */}
      <div style={{ position: "absolute", left: 0, top: bandY, width: W, height: H - bandY, opacity: vis, overflow: "hidden", direction: "rtl", fontFamily: kufiF, color: "#fff", filter: speed > 0.4 ? `blur(${Math.min(5, speed * 1.6).toFixed(1)}px)` : undefined }}>
        <div style={{ position: "absolute", left: 0, top: axisY - bandY - 2, width: W, height: 7, borderRadius: 4, background: "rgba(255,255,255,.55)" }} />
        {ticks.map((wx) => <div key={wx} style={{ position: "absolute", left: px(wx), top: axisY - bandY - 8, width: 2, height: 16, background: "rgba(255,255,255,.28)" }} />)}
        <div style={{ position: "absolute", left: W / 2, top: 0, width: 0, height: 0, transform: `scale(${push})`, transformOrigin: `0 ${axisY - bandY}px` }}>
          {stages.map((st, k) => {
            const wx = camX(k) - cam;
            if (Math.abs(wx) > 1400) return null;
            const reach = k === i ? t - (st.at - 6 / FPS) : -1, pop = k === i && reach >= 0 ? spring({ frame: Math.round(reach * FPS), fps: FPS, config: { damping: 11, stiffness: 160 } }) : k < i ? 1 : 0;
            return (
              <div key={k} style={{ position: "absolute", left: wx, top: 0, opacity: inFrame(wx) }}>
                <div style={{ position: "absolute", left: -9, top: axisY - bandY - 9, width: 18, height: 18, borderRadius: "50%", background: k === i ? acc : "#fff", boxShadow: k === i ? `0 0 18px ${acc}` : "none" }} />
                <div style={{ position: "absolute", left: -150, top: axisY - bandY + 22, width: 300, textAlign: "center", fontSize: 34, color: acc, opacity: k === i ? 1 : 0 }}>{st.date}</div>
                <div style={{ position: "absolute", left: -250, top: axisY - bandY - 18, width: 500, transformOrigin: "50% 100%", transform: `translateY(-100%) scaleY(${Math.max(0.001, pop)})`, opacity: clamp(pop * 3), padding: compact ? "8px 20px" : "18px 26px", borderRadius: 22, background: alpha(BRAND.card, .97), color: BRAND.ink, textAlign: "center", boxShadow: "0 18px 40px rgba(0,0,0,.4)" }}>
                  <div style={{ fontSize: compact ? 32 : 42, lineHeight: 1.2 }}>{st.title}</div>
                  {st.sub ? <div style={{ fontSize: compact ? 22 : 26, opacity: 0.7, marginTop: 4 }}>{st.sub}</div> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

/**
 * 27) CollageAssemble — «تركيب القصاصات من فراغ» (adapted from the gbro-collage-broll workflow, MIT; SKILL: collage-broll). A flat bold colour field with paper grain; paper PIECES
 * (cut-out photos, coloured card, shapes) slide in from outside one after another with STOP-MOTION timing (positions update every `step` frames, 2–3), snap into place with a
 * 1–2° wobble that settles, each with a cream keyline and a soft low-opacity shadow. Order = structure first → subject/cards → connectors → action → result. 3–6 pieces only.
 * piece.node = the picture/shape (a black-and-white photo cut-out, a card…); halftone = grayscale + printed-dot overlay. No text inside (the speaker's words are not on screen).
 * Default 1080×1920 portrait B-roll, ≈4–5 s: empty field for the first 0.3 s, last piece lands ≥ 1 s before the end, then still.
 */
export const CollageAssemble: React.FC<{
  at?: number; bg?: string; w?: number; h?: number; step?: number; keyline?: string;
  pieces: { at: number; x: number; y: number; w: number; h: number; rot?: number; from?: "left" | "right" | "top" | "bottom"; node?: React.ReactNode; color?: string; radius?: number; halftone?: boolean; cutout?: boolean }[];
}> = ({ at = 0, bg = "#c8553d", w = 1080, h = 1920, step = 2, keyline = "#f3ead3", pieces }) => {
  const f = useCurrentFrame() - Math.round(at * FPS);
  const grain = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/></filter><rect width='160' height='160' filter='url(%23n)' opacity='.5'/></svg>\")";
  return (
    <AbsoluteFill
      style={{
        background: bg,
        overflow: "hidden",
        translate: "0px 331.2px"
      }}
    >
      {pieces.map((p, i) => {
        const g = f - Math.round(p.at * FPS);
        if (g < 0) return null;
        const q = Math.floor(g / step) * step, u = clamp(q / 14), e = 1 - Math.pow(1 - u, 3);
        const d = (1 - e) * (p.from === "left" || p.from === "right" ? 900 : 1100), sign = p.from === "left" || p.from === "top" ? -1 : 1;
        const dx = p.from === "left" || p.from === "right" ? sign * d : 0, dy = p.from === "top" || p.from === "bottom" ? sign * d : 0;
        const wob = (p.rot ?? 0) + (1 - e) * 6 * (i % 2 ? 1 : -1) + (u >= 1 ? 0 : 1.2 * Math.sin(q));
        return (
          <div key={i} style={{ position: "absolute", left: p.x + dx, top: p.y + dy, width: p.w, height: p.h, transform: `rotate(${wob}deg)`, borderRadius: p.cutout ? 0 : p.radius ?? 10, background: p.color, boxShadow: p.cutout ? undefined : `0 0 0 7px ${keyline}, 0 14px 26px rgba(0,0,0,.28)`, overflow: p.cutout ? "visible" : "hidden", filter: p.cutout ? `drop-shadow(5px 0 0 ${keyline}) drop-shadow(-5px 0 0 ${keyline}) drop-shadow(0 5px 0 ${keyline}) drop-shadow(0 -5px 0 ${keyline}) drop-shadow(0 16px 20px rgba(0,0,0,.35))` : p.halftone ? "grayscale(1) contrast(1.35)" : undefined }}>
            {p.node}
            {p.halftone ? <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle, #000 30%, transparent 33%)", backgroundSize: "9px 9px", mixBlendMode: "multiply", opacity: 0.4 }} /> : null}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, backgroundImage: grain, opacity: 0.16, mixBlendMode: "multiply", pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

/**
 * 28) HandheldShake — «اهتزاز كاميرا اليد» (user rule 2026-10-20). Wraps the SHEIKH'S camera footage and shakes it like a hand-held camera, ONLY during an interjected (جملة اعتراضية) or
 * sarcastic (جملة تهكمية) sentence — decided from the meaning of the sentence, never for emphasis, never continuous. windows = [{ from, to }] in seconds (the sentence's first/last word
 * times after the cut). Smooth pseudo-random sway (sum of sines, deterministic) ±amp px and ±rot°, eased in/out over 0.12 s so it starts and stops like a person bracing.
 * Keep each window ≤ the sentence itself (≈1–4 s); the frame edges are scaled 1.04 to hide the borders. Face/beard stay inside the frame (face_check after use).
 */
export const HandheldShake: React.FC<{ windows: { from: number; to: number }[]; amp?: number; rot?: number; children: React.ReactNode }> = ({ windows, amp = 7, rot = 0.45, children }) => {
  const t = useT(0), w = windows.find((x) => t >= x.from - 0.01 && t <= x.to + 0.12);
  if (!w) return <>{children}</>;
  const k = Math.min(ease((t - w.from) / 0.12), ease((w.to + 0.12 - t) / 0.12));
  const n = (s: number) => Math.sin(t * 9.1 * s + s * 1.7) * 0.5 + Math.sin(t * 15.3 * s + s * 4.1) * 0.3 + Math.sin(t * 23.7 * s + s * 2.3) * 0.2;
  return <AbsoluteFill style={{ transform: `translate(${n(1) * amp * k}px, ${n(1.37) * amp * k}px) rotate(${n(0.83) * rot * k}deg) scale(${1 + 0.04 * k})` }}>{children}</AbsoluteFill>;
};

/**
 * 31) BrushX — «شطب بفرشاة حمراء» (reference §20). A red hand-brushed X draws itself diagonally over `box` (two strokes, 0.25 s each, slightly translucent, rough edge), holds, then dissolves.
 * Mark a rejected idea/word. NEVER over the speaker's face: give it a `box` on a graphic (a keyword, a photo), not on the face; face_check verifies.
 */
export const BrushX: React.FC<{ at: number; x: number; y: number; w: number; h: number; until?: number; color?: string }> = ({ at, x, y, w, h, until, color = RED }) => {
  const t = useT(at), id = useId().replace(/:/g, ""), out = until === undefined ? 1 : ease((until - (t + at)) / 0.35);
  if (t < 0 || out <= 0) return null;
  const a = ease(t / 0.25), b = ease((t - 0.25) / 0.25);
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: x, top: y, overflow: "visible", opacity: 0.82 * out }}>
      <defs><filter id={"br" + id}><feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="2" result="n" /><feDisplacementMap in="SourceGraphic" in2="n" scale="9" /></filter></defs>
      <g filter={`url(#br${id})`} stroke={color} strokeLinecap="round" strokeWidth={Math.max(18, w * 0.09)} fill="none">
        <line x1={w * 0.08} y1={h * 0.1} x2={w * 0.08 + w * 0.84 * a} y2={h * 0.1 + h * 0.8 * a} />
        <line x1={w * 0.92} y1={h * 0.1} x2={w * 0.92 - w * 0.84 * b} y2={h * 0.1 + h * 0.8 * b} />
      </g>
    </svg>
  );
};

/** 32) CornerTags — «وسما الزاويتين» (reference §20): two tiny bold white labels in the TOP corners for the whole video (right: the topic/ruling, left: the speaker's name/title). Cheap permanent identity; keep y ≥ 130 in portrait, never over the face. */
export const CornerTags: React.FC<{ right: string[]; left: string[]; y?: number; size?: number }> = ({ right, left, y = 60, size = 26 }) => (
  <>
    {([[right, { right: 36 }], [left, { left: 36 }]] as const).map(([lines, pos], i) => (
      <div key={i} style={{ position: "absolute", top: y, ...pos, fontFamily: kufiF, fontSize: size, lineHeight: 1.25, color: "#fff", textAlign: i === 0 ? "right" : "left", direction: "rtl", textShadow: "0 2px 8px rgba(0,0,0,.7)" }}>{lines.map((l, j) => <div key={j}>{l}</div>)}</div>
    ))}
  </>
);

/**
 * 33) RewriteWindow — «نافذة التحسين» (reference: the editor video, 27–36 s; SKILL.md §21). A white browser-like window (tiny top bar with a red tab) holding ONE rewrite story:
 * the OLD phrase is written, then STRUCK THROUGH (rough line draws right→left, text fades to 55 %), an ARROW draws from it toward the NEW phrase which is written
 * with a pale-orange marker HIGHLIGHT; optional `extra` line (e.g. «Skills + ✻») sits under it all the time. Times are absolute seconds: oldAt, strikeAt, newAt.
 * Use for «من كذا إلى كذا»: old claim → corrected one, old term → right term. Put it in a side column (never over the face).
 */
export const RewriteWindow: React.FC<{ x: number; y: number; w: number; h?: number; oldText: string; newText: string; oldAt: number; strikeAt: number; newAt: number; extra?: string; rot?: number; until?: number; accent?: string }> = ({ x, y, w, h = 300, oldText, newText, oldAt, strikeAt, newAt, extra, rot = -1.2, until, accent }) => {
  const t = useT(0), acc = accent ?? BRAND.mark;
  const k = ease((t - (oldAt - 0.35)) / 0.35), out = until === undefined ? 1 : ease((until - t) / 0.3);
  if (t < oldAt - 0.4 || out <= 0) return null;
  const ink = BRAND.ink, fs = Math.min(54, w * 0.07);
  // reveal by clipping (never slice the string: mixed Arabic/Latin text re-orders while it is typed)
  const rv = (a: number, dur: number, fromRight: boolean): React.CSSProperties => { const p = clamp((t - a) / dur); return { clipPath: fromRight ? `inset(0 0 0 ${(1 - p) * 100}%)` : `inset(0 ${(1 - p) * 100}% 0 0)` }; };
  const strike = ease((t - strikeAt) / 0.28), arrow = ease((t - (strikeAt + 0.15)) / 0.4), nu = t - newAt, hl = ease((nu - 0.3) / 0.35);
  const ay = 52 + fs * 0.65;
  return (
    <div style={{ position: "absolute", left: x, top: y + (1 - k) * 30, width: w, height: h, opacity: k * out, transform: `rotate(${rot}deg)`, background: BRAND.card, borderRadius: 18, boxShadow: "0 22px 50px rgba(0,0,0,.4)", overflow: "hidden", direction: "rtl", fontFamily: kufiF }}>
      <div style={{ height: 30, background: BRAND.card, display: "flex", alignItems: "center", gap: 8, padding: "0 14px" }}>
        {[BRAND.mark, BRAND.accent, BRAND.green].map((c) => <i key={c} style={{ width: 10, height: 10, borderRadius: 5, background: c }} />)}
        <i style={{ marginRight: 10, width: 70, height: 16, borderRadius: 4, background: BRAND.mark }} />
      </div>
      <div style={{ position: "absolute", right: 28, top: 52, fontSize: fs, color: ink, opacity: 1 - 0.45 * strike, whiteSpace: "nowrap" }}>
        <span style={{ display: "inline-block", ...rv(oldAt, 0.5, true) }}>{oldText}</span>
        <div style={{ position: "absolute", right: 0, top: "52%", width: `${strike * 100}%`, height: 6, background: BRAND.mark, borderRadius: 3, transform: "rotate(-2deg)" }} />
      </div>
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
        <path d={`M ${w * 0.5} ${ay} L ${w * 0.5 - w * 0.1 * arrow} ${ay}`} stroke={acc} strokeWidth={5} strokeLinecap="round" fill="none" />
        {arrow > 0.9 ? <path d={`M ${w * 0.4 + 12} ${ay - 10} L ${w * 0.4} ${ay} L ${w * 0.4 + 12} ${ay + 10}`} stroke={acc} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" /> : null}
      </svg>
      <div style={{ position: "absolute", left: 24, top: 52, fontSize: fs, color: ink, whiteSpace: "nowrap", opacity: clamp(nu * 6) }}>
        <span style={{ position: "absolute", left: -6, right: -6, top: "12%", bottom: "6%", background: BRAND.card, borderRadius: 5, transform: `scaleX(${hl})`, transformOrigin: "left", zIndex: 0 }} />
        <span style={{ position: "relative", zIndex: 1, display: "inline-block", ...rv(newAt, 0.55, true) }}>{newText}</span>
      </div>
      {extra ? <div style={{ position: "absolute", right: 28, bottom: 26, fontSize: fs * 0.62, color: ink, opacity: k }}>{extra}</div> : null}
    </div>
  );
};

void interpolate;
