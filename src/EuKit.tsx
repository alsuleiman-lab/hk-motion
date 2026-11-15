import React, { useEffect, useMemo, useRef } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, Sequence, interpolate, staticFile, useVideoConfig } from "remotion";
import { T, useSp, useT } from "./MG";
import { DrawIcon } from "./MotionKit";
import { FONT_TEXT, FONT_TITLE } from "./localFonts";
import { SFX_LEVELS } from "./sfxConfig";
import { VSlot, hyBg } from "./hybrid/Slot";
import { BRAND, alpha } from "./brand";

/** Shared pieces for the Europe-protests videos (portrait + landscape). Times are SECONDS on the cut timeline. */
export const EU_FPS = 30;
export type EuWord = { s: number; e: number; w: string; seg: number };
export type Ver = "port" | "land";
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));

/** start time of the first word of segment line `line` (1-based line of segs.txt) that contains `m` (string) or the m-th word (number) */
export const mkTW = (words: EuWord[]) => (line: number, m: string | number = 0): number => {
  const ws = words.filter((w) => w.seg === line - 1);
  if (!ws.length) throw new Error("no words for line " + line);
  if (typeof m === "number") return ws[Math.min(m, ws.length - 1)].s;
  const w = ws.find((x) => x.w.includes(m));
  if (!w) throw new Error(`word "${m}" not in line ${line}: ${ws.map((x) => x.w).join(" ")}`);
  return w.s;
};

/** plain <img> that never cancels the render: Remotion's <Img> retries blob URLs and aborts the whole render if the component unmounts mid-load (it killed two full renders) */
export const Pic: React.FC<{ src: string; style?: React.CSSProperties }> = ({ src, style }) => {
  // one delayRender PER src (2026-10-26): the old one-shot handle was released after the first load, so when `src` changed every frame (extracted video frames) the render
  // captured the previous image = stale/skipped frames = judder. Now every new src is awaited again.
  const h = useMemo(() => delayRender("pic " + src, { timeoutInMilliseconds: 90000 }), [src]);
  const done = useRef<number | null>(null);
  const fin = () => { if (done.current !== h) { done.current = h; continueRender(h); } };
  useEffect(() => () => fin(), [h]);
  // eslint-disable-next-line @remotion/warn-native-media-tag -- deliberate, see the doc comment above (<Img> aborted full renders)
  return <img src={staticFile(src)} style={style} onLoad={fin} onError={fin} />;
};
export const useFonts = () => { FONT_TITLE(); FONT_TEXT(); };
export const TITLE = "Noto Kufi Arabic";
export const TEXT = "Almarai";

/** the Sheikh's recording (full 1920x1080 frame) shown through a crop window. Studio uses the light proxy, render uses the full file. */
export const EuVid: React.FC<{ ver: Ver; w: number; h: number; crop: { x: number; y: number; w: number; h: number }; muted?: boolean; style?: React.CSSProperties; zoom?: number; radius?: number }> = ({ ver, w, h, crop, muted = true, style, zoom = 1, radius = 0 }) => {
  const s = (w / crop.w) * zoom;
  return <VSlot src={`eu/${ver}_cut_v2.mp4`} studioSrc={`eu/${ver}_proxy_v2.mp4`} muted={muted} w={w} h={h} radius={radius} vx={-crop.x * s} vy={-crop.y * s} vw={1920 * s} vh={1080 * s} style={{ position: "relative", ...style }} />;
};

/** audio-only layer of the cut (so visual copies can all be muted) */
export const EuAudio: React.FC<{ ver: Ver }> = ({ ver }) => <Audio src={staticFile(`eu/${ver}_cut_v2.mp4`)} />;

/** light whoosh on every other scene change (levels from sfxConfig) */
export const Whooshes: React.FC<{ at: number[] }> = ({ at }) => (
  <>
    {at.filter((_, i) => i % 2 === 1).map((a, i) => (
      <Sequence key={i} from={Math.round(a * EU_FPS)} durationInFrames={30}><Audio src={staticFile("sfx/whoosh.wav")} volume={SFX_LEVELS.whoosh} /></Sequence>
    ))}
  </>
);

/** scene window: global-time children, slide + fade (one fixed transition style) */
export const Sc: React.FC<{ a: number; b: number; children: React.ReactNode; slide?: number; dy?: number }> = ({ a, b, children, slide = 36, dy = 0 }) => {
  const t = useT();
  if (t < a - 0.02 || t > b + 0.36) return null;
  const fin = clamp((t - a) / 0.3), fout = clamp((b + 0.34 - t) / 0.3);
  const o = Math.min(fin, fout);
  return <AbsoluteFill style={{ opacity: o, transform: `translateY(${(1 - fin) * slide + dy}px)` }}>{children}</AbsoluteFill>;
};

/** slow sway of a card that holds the Sheikh: size + tilt change every ~8 s (user rule: never static more than 7-9 s) */
export const useCardMotion = (period = 8, phase = 0) => {
  const t = useT() + phase;
  const k = Math.sin((t / period) * Math.PI * 2);
  return { rot: k * 1.1, scale: 1 + 0.018 * (1 + Math.sin((t / period) * Math.PI * 2 + 1.2)) / 1, dy: Math.cos((t / period) * Math.PI * 2) * 8 };
};

/** B-roll panel: cover-fit clip, light grade + slow push (clips are the user's own news footage; each is graded/cropped slightly so it is not a raw repost) */
const NAT: Record<number, [number, number]> = { 1: [1280, 720], 2: [716, 1276], 3: [720, 1280], 4: [720, 1280], 5: [720, 1280], 6: [720, 1280] };
export const BClip: React.FC<{ n: number; at: number; dur: number; x: number; y: number; w: number; h: number; from?: number; fx?: number; fy?: number; rot?: number; speed?: number; contain?: boolean; patch?: boolean }> = ({ n, at, dur, x, y, w, h, from = 0, fx = 0.5, fy = 0.5, rot = 0, speed = 1.04, contain = true, patch = false }) => {
  const [nw, nh] = NAT[n];
  const base = Math.max(w / nw, h / nh);
  const t = useT(at);
  const push = 1.06 + 0.06 * clamp(t / Math.max(dur, 1));
  const vw = nw * base * push, vh = nh * base * push;
  const src = `eu/broll/c${n}.mp4`;
  const sf = Math.round(from * EU_FPS);
  if (contain) {
    // whole frame visible (nobody is cropped): sharp copy centred over a blurred copy of the same shot
    const cs = Math.min(w / nw, h / nh), fw = nw * cs, fh = nh * cs;
    const bgS = Math.max(w / nw, h / nh) * 1.15;
    return (
      <Sequence from={Math.round(at * EU_FPS)} durationInFrames={Math.ceil((dur + 0.5) * EU_FPS)}>
        <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 30, overflow: "hidden", border: `7px solid ${T.card}`, boxShadow: "0 22px 44px rgba(0,0,0,.35)", transform: `rotate(${rot}deg)`, background: hyBg(T.paper2) }}>
          <VSlot src={src} startFrom={sf} playbackRate={speed} w={w} h={h} radius={23} vx={(w - nw * bgS) / 2} vy={(h - nh * bgS) / 2} vw={nw * bgS} vh={nh * bgS} fx={{ blur: 26, brightness: 0.85, saturate: 1.1 }} />
          <VSlot src={src} startFrom={sf} playbackRate={speed} w={w} h={h} radius={23} vx={(w - fw) / 2 - 7} vy={(h - fh) / 2 - 7} vw={fw} vh={fh} fx={{ contrast: 1.05, saturate: 1.06 }} />
          {patch ? (
            <div style={{ position: "absolute", left: (w - fw) / 2 - 7 + 0.058 * fw, top: (h - fh) / 2 - 7 + 0.095 * fh, width: 0.135 * fw, height: 0.105 * fh, borderRadius: 14, background: T.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Flag c="fr" w={Math.round(0.1 * fw)} h={Math.round(0.067 * fw)} />
            </div>
          ) : null}
        </div>
      </Sequence>
    );
  }
  return (
    <Sequence from={Math.round(at * EU_FPS)} durationInFrames={Math.ceil((dur + 0.5) * EU_FPS)}>
      <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 30, overflow: "hidden", border: `7px solid ${T.card}`, boxShadow: "0 22px 44px rgba(0,0,0,.35)", transform: `rotate(${rot}deg)` }}>
        <VSlot src={src} startFrom={sf} playbackRate={speed} w={w} h={h} radius={23} vx={-(vw - w) * fx} vy={-(vh - h) * fy} vw={vw} vh={vh} fx={{ contrast: 1.06, saturate: 1.08, brightness: 1.02 }} />
        <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 120px rgba(8,30,34,.35)", pointerEvents: "none" }} />
      </div>
    </Sequence>
  );
};

/** flags drawn as simple SVG (France / Italy / Belgium / Germany / Russia / Iran / Israel / Iraq / Lebanon) */
export type FlagCode = "fr" | "it" | "be" | "de" | "ru" | "ir" | "il" | "iq" | "lb" | "ps";
export const Flag: React.FC<{ c: FlagCode; w?: number; h?: number }> = ({ c, w = 120, h = 80 }) => {
  const V = (cols: string[]) => cols.map((k, i) => <rect key={i} x={i * (90 / cols.length)} y={0} width={90 / cols.length + 0.5} height={60} fill={k} />);
  const H = (cols: string[]) => cols.map((k, i) => <rect key={i} x={0} y={i * (60 / cols.length)} width={90} height={60 / cols.length + 0.5} fill={k} />);
  const body = {
    fr: V(["#1f4aa8", "#f4f4f0", "#d8322b"]), it: V(["#1f8a4c", "#f4f4f0", "#d02f2f"]), be: V(["#1b1b1b", "#f1c40f", "#d8322b"]),
    de: H(["#1b1b1b", "#d8322b", "#f1c40f"]), ru: H(["#f4f4f0", "#1f4aa8", "#d8322b"]), ir: H(["#2c9a52", "#f4f4f0", "#d8322b"]), iq: H(["#d8322b", "#f4f4f0", "#1b1b1b"]),
    il: <><rect width={90} height={60} fill="#f6f6f2" /><rect y={6} width={90} height={7} fill="#1f4aa8" /><rect y={47} width={90} height={7} fill="#1f4aa8" /><polygon points="45,19 54,35 36,35" fill="none" stroke="#1f4aa8" strokeWidth={2.2} /><polygon points="45,41 54,25 36,25" fill="none" stroke="#1f4aa8" strokeWidth={2.2} /></>,
    ps: <>{H(["#1b1b1b", "#f4f4f0", "#2c9a52"])}<polygon points="0,0 33,30 0,60" fill="#d8322b" /></>,
    lb: <><rect width={90} height={60} fill="#f6f6f2" /><rect width={90} height={15} fill="#d8322b" /><rect y={45} width={90} height={15} fill="#d8322b" /><polygon points="45,16 55,36 35,36" fill="#2c9a52" /><rect x={43.5} y={36} width={3} height={7} fill="#6b4630" /></>,
  }[c];
  if (c === "ir" || c === "iq" || c === "lb" || c === "il") {
    return <Pic src={`eu/flags/${c}.png`} style={{ width: w, height: h, objectFit: "cover", borderRadius: 10, border: "3px solid rgba(255,255,255,.85)", boxShadow: "0 6px 14px rgba(0,0,0,.3)", flexShrink: 0, boxSizing: "border-box" }} />;
  }
  return (
    <svg viewBox="0 0 90 60" width={w} height={h} style={{ borderRadius: 10, border: "3px solid rgba(255,255,255,.85)", boxShadow: "0 6px 14px rgba(0,0,0,.3)", flexShrink: 0, overflow: "hidden", boxSizing: "border-box" }} preserveAspectRatio="none">{body}</svg>
  );
};

/** number that ticks up (starts at `at`); invisible before `at` so a "0" never shows before the figure is spoken (EU video flaw, fixed 2026-10-24) — it keeps its space so the card does not jump */
export const Count: React.FC<{ at: number; to: number; dec?: number; size: number; color?: string; comma?: boolean }> = ({ at, to, dec = 0, size, color = T.ink, comma = false }) => {
  const t = useT(at);
  const u = 1 - Math.pow(1 - clamp(t / 0.9), 3);
  const v = to * u;
  return <span style={{ fontFamily: TITLE, fontWeight: 800, fontSize: size, color, fontVariantNumeric: "tabular-nums", direction: "ltr", display: "inline-block", opacity: t < 0 ? 0 : clamp(t / 0.15) }}>{comma ? Math.round(v).toLocaleString("en-US") : dec ? v.toFixed(dec) : Math.round(v)}</span>;
};

const ClipPin: React.FC<{ left: number }> = ({ left }) => (
  <div style={{ position: "absolute", left, top: -20, width: 50, height: 32, background: T.red, borderRadius: "6px 6px 2px 2px", boxShadow: "0 3px 0 rgba(0,0,0,.2)" }}><div style={{ margin: "7px auto 0", width: 30, height: 11, background: BRAND.mark, borderRadius: 3 }} /></div>
);

/** a paper card that slides in when its word is spoken: icon + label + big number */
export const StatRow: React.FC<{ at: number; x: number; y: number; w: number; h?: number; icon: string; label: string; sub?: string; /** the second line appears when it is said (user 2026-11-12: «إذا قلت كذا ← فهذا كذا») */ subAt?: number; /** a plain box: no icon square (the consequence box of a condition pair) */ noIcon?: boolean; to?: number; dec?: number; unit?: string; flag?: FlagCode; photo?: string; rot?: number; big?: number; countAt?: number; comma?: boolean }> = ({ at, x, y, w, h = 190, icon, label, sub, subAt, noIcon, to, dec = 0, unit, flag, photo, rot = -1, big = 96, countAt, comma }) => {
  const s = useSp(at, 14, 170);
  const t = useT(at);
  const u = clamp(t / 0.33);
  const tc = useT(countAt ?? at + 0.1); // the unit waits for its number, like Count
  /* the text shrinks to fit its card (user 2026-11-13, portrait two-column rows): 40px when it fits, else the largest size whose wrapped lines stay inside the card; the icon shrinks in a narrow card */
  const icoBox = w < 600 ? 64 : 96, avail = w - 56 - (noIcon ? 0 : (photo ? 110 : icoBox) + 22) - (flag ? 118 : 0) - (to !== undefined ? 220 : 0);
  let fs = 40; while (fs > 20 && (Math.ceil((label.length * 1.08) / Math.max(4, avail / (fs * 0.6))) * fs * 1.25 + (sub ? 4 + Math.ceil((sub.length * 1.08) / Math.max(4, avail / (fs * 0.38))) * fs * 0.8 : 0)) > h - 22) fs -= 2;
  return (
    <div style={{ position: "absolute", left: x + (1 - u) * 120, top: y, width: w, height: h, opacity: u, transform: `rotate(${rot + (1 - u) * 3}deg) scale(${0.94 + 0.06 * s})`, background: T.card, borderRadius: 14, boxShadow: "0 18px 34px rgba(0,0,0,.26), 0 2px 0 rgba(0,0,0,.08)", direction: "rtl", display: "flex", alignItems: "center", gap: 22, padding: "0 28px" }}>
      <ClipPin left={w - 110} />
      {noIcon ? null : photo ? (
        <Pic src={photo} style={{ width: 110, height: 110, borderRadius: 24, objectFit: "cover", objectPosition: "50% 15%", flexShrink: 0, border: `4px solid ${T.accent}` }} />
      ) : (
        <div style={{ width: icoBox, height: icoBox, borderRadius: 22, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <DrawIcon name={icon} p={clamp(t / 0.7)} size={Math.round(icoBox * 0.62)} color={T.onAccent} sw={1.8} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: fs, color: T.ink, lineHeight: 1.25 }}>{label}</div>
        {sub ? <div style={{ fontFamily: TEXT, fontWeight: 700, fontSize: Math.round(fs * 0.675), color: T.gray, marginTop: 4, lineHeight: 1.3, visibility: subAt !== undefined && t < subAt - at ? "hidden" : "visible" }}>{sub}</div> : null}
      </div>
      {to !== undefined ? (
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <Count at={countAt ?? at + 0.1} to={to} dec={dec} comma={comma} size={big} color={T.accent} />
          {unit ? <div style={{ fontFamily: TEXT, fontWeight: 800, fontSize: 28, color: T.ink, marginTop: -6, opacity: tc < 0 ? 0 : clamp(tc / 0.15) }}>{unit}</div> : null}
        </div>
      ) : null}
      {flag ? <Flag c={flag} w={96} h={64} /> : null}
    </div>
  );
};

/** title banner for a written scene (typewriter feel via reveal). Without x/y/w it is a band across the whole width filling the fourth fifth of the height (user 2026-10-29);
 *  with them it is the compact title card above a column of StatRow cards */
export const Banner: React.FC<{ at: number; x?: number; y?: number; w?: number; text: string; flag?: FlagCode; size?: number }> = ({ at, x, y, w, text, flag, size }) => {
  const s = useSp(at, 15, 170), { width, height } = useVideoConfig();
  const band = x === undefined || y === undefined || w === undefined, bh = height * 0.2, fs = size ?? (band ? Math.round(Math.min(bh * 0.4, width * 0.075)) : 60);
  const box: React.CSSProperties = band
    ? { left: 0, top: height * 0.6, width, height: bh, justifyContent: "center", borderRadius: 0, padding: "0 60px", boxSizing: "border-box" }
    : { left: x, top: y, width: w, borderRadius: 18, padding: "14px 26px" };
  return (
    <div style={{ position: "absolute", ...box, transform: `translateY(${(1 - s) * -30}px) scale(${0.96 + 0.04 * s})`, opacity: clamp(s * 2), direction: "rtl", display: "flex", alignItems: "center", gap: 20, background: T.navy, boxShadow: "0 14px 26px rgba(0,0,0,.28)" }}>
      {flag ? <Flag c={flag} w={104} h={70} /> : null}
      <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: fs, color: BRAND.card, lineHeight: 1.2 }}>{text}</div>
    </div>
  );
};

/** comparison in the paper-card style of StatRow/Banner: two cards side by side (good on the right), each with the red clip, a navy label tab,
 *  an icon square (accent ✓ / red ✗) and its lines appearing when spoken (first line big ink, the rest in the side colour). Same props as the old JnCompare. */
export type CmpItem = { text: string; at: number };
export const CompareCards: React.FC<{ at: number; until: number; x: number; y: number; w: number; h: number; good: { label: string; items: CmpItem[] }; bad: { label: string; items: CmpItem[] } }> = ({ at, until, x, y, w, h, good, bad }) => {
  const t = useT(0);
  const s = useSp(at, 14, 170);
  if (t < at || t >= until) return null;
  const u = clamp((t - at) / 0.33), out = clamp((until - t) / 0.3), gap = 30, pw = (w - gap) / 2;
  const card = (left: number, c: { label: string; items: CmpItem[] }, col: string, icon: string, rot: number, from: number) => (
    <div style={{ position: "absolute", left: left + (1 - u) * from, top: y, width: pw, height: h, opacity: u * out, transform: `rotate(${rot + (1 - u) * 3 * Math.sign(rot)}deg) scale(${0.94 + 0.06 * s})`, background: T.card, borderRadius: 14, boxShadow: "0 18px 34px rgba(0,0,0,.26), 0 2px 0 rgba(0,0,0,.08)", direction: "rtl", boxSizing: "border-box", padding: "70px 26px 24px" }}>
      <ClipPin left={pw - 110} />
      <div style={{ position: "absolute", right: 24, top: 18, background: T.navy, color: BRAND.card, fontFamily: TITLE, fontWeight: 800, fontSize: 30, padding: "4px 20px 8px", borderRadius: 12 }}>{c.label}</div>
      <div style={{ position: "absolute", left: 22, top: 16, width: 52, height: 52, borderRadius: 14, background: col, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <DrawIcon name={icon} p={clamp((t - at) / 0.7)} size={34} color={T.onAccent} sw={2.4} />
      </div>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
        {c.items.map((it, i) => { const k = clamp((t - it.at) / 0.35); return <div key={i} style={{ opacity: k, transform: `translateY(${(1 - k) * 18}px)`, fontFamily: TITLE, fontWeight: 800, fontSize: i === 0 ? 58 : 46, color: i === 0 ? T.ink : col, textAlign: "center", lineHeight: 1.25 }}>{it.text}</div>; })}
      </div>
    </div>
  );
  return <>{card(x + pw + gap, good, T.accent, "check", -1, 120)}{card(x, bad, T.red, "x", 1, -120)}</>;
};

/** Sheikh card frame (video is drawn separately, outside <Gfx>, so the face check can see it) */
export const CardFrame: React.FC<{ x: number; y: number; w: number; h: number; rot: number; scale: number; dy: number }> = ({ x, y, w, h, rot, scale, dy }) => (
  <div style={{ position: "absolute", left: x, top: y + dy, width: w, height: h, borderRadius: 34, border: `8px solid ${T.card}`, boxShadow: "0 24px 48px rgba(0,0,0,.38)", transform: `rotate(${rot}deg) scale(${scale})`, pointerEvents: "none" }} />
);

export const NameTag: React.FC<{ at: number; x: number; y: number; dur?: number }> = ({ at, x, y, dur = 4 }) => {
  const t = useT(at);
  if (t < 0 || t > dur) return null;
  const u = Math.min(clamp(t / 0.3), clamp((dur - t) / 0.3));
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,0) translateY(${(1 - u) * 20}px)`, opacity: u, direction: "rtl", background: T.accent, color: T.onAccent, fontFamily: TITLE, fontWeight: 800, fontSize: 38, padding: "6px 30px 12px", borderRadius: 14, whiteSpace: "nowrap", boxShadow: "0 8px 0 rgba(0,0,0,.14)" }}>الشيخ محمد بن شمس الدين</div>
  );
};

export const Subscribe: React.FC<{ at: number; x: number; y: number; dur?: number }> = ({ at, x, y, dur = 99 }) => {
  const s = useSp(at, 13, 160);
  const t = useT(at);
  if (t > dur) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,0) scale(${0.8 + 0.2 * s})`, opacity: clamp(s * 2), direction: "rtl", display: "flex", alignItems: "center", gap: 20, background: T.card, borderRadius: 22, padding: "16px 34px", boxShadow: "0 18px 34px rgba(0,0,0,.32)", border: `4px solid ${T.accent}` }}>
      <div style={{ transform: `rotate(${Math.sin(t * 9) * 12 * clamp(1 - t / 2)}deg)` }}><DrawIcon name="Bell" p={clamp(t / 0.6)} size={74} color={T.mark} sw={1.8} /></div>
      <div>
        <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 44, color: T.ink }}>اشترك في القناة</div>
        <div style={{ fontFamily: TEXT, fontWeight: 800, fontSize: 28, color: T.accent }}>قناة محمد بن شمس الدين</div>
      </div>
    </div>
  );
};

export { interpolate };

/** landscape paper desk (MG.PaperBg is portrait-only): dot grid, crop marks, hashtag */
export const PaperBgL: React.FC<{ tag?: string }> = ({ tag = "#أوروبا_تحترق" }) => (
  <AbsoluteFill style={{ background: T.paper, overflow: "hidden" }}>
    <AbsoluteFill style={{ backgroundImage: "radial-gradient(rgba(0,0,0,.10) 1.5px, transparent 1.6px)", backgroundSize: "22px 22px" }} />
    <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      {[[34, 34, 1, 1], [1886, 34, -1, 1], [34, 1046, 1, -1], [1886, 1046, -1, -1]].map(([x, y, sx, sy], i) => (<path key={i} d={`M${x},${y + 36 * sy} L${x},${y} L${x + 36 * sx},${y}`} fill="none" stroke="rgba(10,18,30,.5)" strokeWidth={4} />))}
      <path d="M1180,990 q30,-22 60,0 t60,0 t60,0" fill="none" stroke={`${T.mark}59`} strokeWidth={4} strokeLinecap="round" />
    </svg>
    <div style={{ position: "absolute", right: 70, top: 56, fontFamily: TITLE, fontWeight: 800, fontSize: 30, color: "rgba(10,18,30,.5)", direction: "rtl" }}>{tag}</div>
  </AbsoluteFill>
);

/** written source link at the bottom while a news item / figure is discussed (user rule 2026-10-18: no news item without its picture or link) */
export const SRC = {
  chammal: "https://www.senat.fr/rap/r25-513/r25-513_mono.html",
  barkhane: "https://www.senat.fr/rap/r22-708/r22-7088.html",
  cultFr: "https://www.senat.fr/rap/l23-128-31/l23-128-3112.html",
  lgbtFr: "https://www.diplomatie.gouv.fr/en/the-ministry-in-action/action-for-peace-and-respect-for-human-rights/promoting-human-rights/french-action-for-lgbt-rights",
  itOps: "https://www.parlamento.it/show-doc?id=1507590&leg=19&part=doc_dc-sedetit_aa&tipodoc=SommComm",
  beOps: "https://www.mil.be/en/our-missions/mission-inherent-resolve/",
  beLgbt: "https://diplomatie.belgium.be/en/news/idahobit-2024-belgium-rallies-human-rights-lgbtqi-people-brussels-and-around-world",
  barkhaneHearing: "https://www.senat.fr/cra/s20210209/s20210209_2.html",
  be24: "https://brusselstimes.com/113800/belgian-defence-minister-expects-decision-on-f-16-deployment",
  be17: "https://airrecognition.com/index.php/news/defense-aviation-news/global-news-2017/june/3543-belgium-approves-6-month-extension-of-operation-desert-falcon.html",
  itCult: "https://documenti.camera.it/leg19/resoconti/commissioni/bollettini/html/2025/04/09/0307/allegato.htm",
  flanders: "https://www.vlaanderen.be/cjm/sites/default/files/2024-06/Field_Drawing_ICP_Flanders_DEF_ENG.pdf",
  itLgbt: "https://unar.it/portale/web/guest/w/avviso-pubblico-proroga-termini-selezione-progetti-2024",
  beCavaria: "https://etaamb.openjustice.be/nl/koninklijk-besluit-van-15-april-2024_n2024004418",
  euIsrael: "https://enlargement.ec.europa.eu/commission-implementing-decision-27112024-financing-special-measure-favour-israel-2024_en",
};
export const Sources: React.FC<{ links: { at: number; url: string }[]; x: number; bottom: number; w: number; size?: number }> = ({ links, x, bottom, w, size = 19 }) => {
  const t = useT();
  const cur = [...links].filter((l) => l.at <= t).pop();
  if (!cur) return null;
  const u = clamp((t - cur.at) / 0.3);
  return (
    <div style={{ position: "absolute", left: x, bottom, width: "fit-content", maxWidth: w, opacity: u, transform: `translateY(${(1 - u) * 14}px)`, background: alpha(BRAND.card, .94), borderRight: `7px solid ${T.accent}`, borderRadius: 10, padding: "6px 14px", boxShadow: "0 6px 14px rgba(0,0,0,.2)", direction: "rtl" }}>
      <span style={{ fontFamily: TEXT, fontWeight: 800, fontSize: size, color: T.ink }}>المصدر: </span>
      {/^(https?:\/\/|www\.)|^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(cur.url)
        ? <span style={{ fontFamily: "Space Mono, monospace", fontSize: size - 3, color: T.navy, direction: "ltr", unicodeBidi: "isolate", wordBreak: "break-all", lineHeight: 1.25 }}>{cur.url}</span>
        : <span style={{ fontFamily: TEXT, fontWeight: 700, fontSize: size, color: T.navy, lineHeight: 1.35 }}>{cur.url}</span>}
    </div>
  );
};

/** big clear correction when the Sheikh misspoke (e.g. "airport of Hormuz" -> "Strait of Hormuz"); user rule 2026-10-18 */
export const Correction: React.FC<{ at: number; dur: number; x: number; y: number; w: number; text: string; size?: number }> = ({ at, dur, x, y, w, text, size = 68 }) => {
  const s = useSp(at, 11, 190);
  const t = useT(at);
  if (t < 0 || t > dur) return null;
  const o = Math.min(clamp(s * 2), clamp((dur - t) / 0.3));
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, opacity: o, transform: `scale(${0.85 + 0.15 * s}) rotate(${(1 - s) * -3}deg)`, background: T.mark, border: "6px solid #fff", borderRadius: 20, boxShadow: "0 18px 36px rgba(0,0,0,.4)", padding: "10px 24px 16px", textAlign: "center", direction: "rtl" }}>
      <span style={{ fontFamily: TITLE, fontWeight: 800, fontSize: size, color: "#fff", lineHeight: 1.2 }}>{text}</span>
    </div>
  );
};
