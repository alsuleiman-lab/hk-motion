import React from "react";
import { AbsoluteFill, random, useCurrentFrame, useVideoConfig } from "remotion";
import { noise2D } from "@remotion/noise";
import { kufiF, zainF } from "./MG";
import { Pic } from "./EuKit";
import { BRAND } from "./brand";

/**
 * Paper shapes for the talk montages (user 2026-10-29: «زيادة في عمل الأشكال الورقية واستخدامها في الفيديوهات»).
 * One paper language: stop-motion (the picture holds 3 frames), hand-torn edges (seeded, never two alike), tape in the identity's light tone, a soft drop shadow,
 * and a small organic wobble from @remotion/noise while a piece rests. Paper stock is the palette's card/paper tones, ink is BRAND.ink, marks BRAND.mark,
 * so every piece follows the video's palette (spec field `brand`). Times are seconds on the composition.
 */
const FPS = 30;
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const easeOut = (u: number) => 1 - Math.pow(1 - clamp(u), 3);
/** stop-motion clock: seconds, quantised to 3-frame holds */
const useStep = () => Math.floor(useCurrentFrame() / 3) * 3 / FPS;
const shadow = "drop-shadow(0 10px 14px rgba(20,14,6,.38))";

/** a hand-torn outline as a clip-path polygon (px): every edge jagged by `amp`, seeded so the same piece keeps its shape */
export const tornClip = (w: number, h: number, seed: string, amp = 7, step = 22) => {
  const pts: string[] = [];
  const j = (k: string) => (random(seed + k) - 0.5) * 2 * amp;
  for (let x = 0; x <= w; x += step) pts.push(`${x}px ${Math.max(0, amp + j("t" + x))}px`);
  for (let y = 0; y <= h; y += step) pts.push(`${w - Math.max(0, amp + j("r" + y))}px ${y}px`);
  for (let x = w; x >= 0; x -= step) pts.push(`${x}px ${h - Math.max(0, amp + j("b" + x))}px`);
  for (let y = h; y >= 0; y -= step) pts.push(`${Math.max(0, amp + j("l" + y))}px ${y}px`);
  return `polygon(${pts.join(",")})`;
};
/** stop-motion arrival from a side + organic rest wobble; null before `at` and after `until` (+0.3 s) */
const useArrive = (at: number, until: number | undefined, seed: string, from: "left" | "right" | "top" | "bottom" = "right", rot = 0) => {
  const t = useStep(), f = useCurrentFrame();
  if (t < at || (until !== undefined && t > until + 0.3)) return null;
  const inn = easeOut((t - at) / 0.4), out = until === undefined ? 0 : easeOut((t - until) / 0.3);
  const d = 900 * (1 - inn) + 900 * out, sx = from === "left" ? -1 : from === "right" ? 1 : 0, sy = from === "top" ? -1 : from === "bottom" ? 1 : 0;
  const wob = noise2D(seed, f / 90, 0) * 0.6;
  return { transform: `translate(${sx * d}px, ${sy * d}px) rotate(${rot + wob + (1 - inn) * 6 * (sx || sy)}deg)` } as React.CSSProperties;
};
/** a strip of tape */
export const Tape: React.FC<{ x: number; y: number; w?: number; rot?: number }> = ({ x, y, w = 120, rot = -8 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: 34, background: BRAND.paper, opacity: 0.82, transform: `rotate(${rot}deg)`, boxShadow: "0 2px 4px rgba(0,0,0,.18)", clipPath: "polygon(3% 0,97% 4%,100% 50%,97% 100%,2% 96%,0 50%)" }} />
);

/** a newspaper clipping of a real news screenshot: torn edges, the headline above in ink, the source under it, taped on two corners */
export const NewsClip: React.FC<{ at: number; until?: number; x: number; y: number; w: number; h: number; src: string; headline?: string; source: string; rot?: number }> = ({ at, until, x, y, w, h, src, headline, source, rot = -2 }) => {
  const s = useArrive(at, until, "nc" + src, "left", rot);
  if (!s) return null;
  const head = headline ? 108 : 0, foot = 64, H = h + head + foot;   // wider paper margins around the headline, picture and credit (user 2026-10-30: «كبر الهوامش»)
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: H, filter: shadow, ...s }}>
      <div style={{ position: "absolute", inset: 0, background: BRAND.card, clipPath: tornClip(w, H, "nc" + src, 8), direction: "rtl" }}>
        {headline ? <div style={{ position: "absolute", left: 44, right: 44, top: 32, fontFamily: kufiF, fontSize: 34, color: BRAND.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", borderBottom: `3px double ${BRAND.ink}`, paddingBottom: 8 }}>{headline}</div> : null}
        <div style={{ position: "absolute", left: 40, right: 40, top: head + 14, height: h - 14, overflow: "hidden" }}><Pic src={src} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(.25) contrast(1.05)" }} /></div>
        <div style={{ position: "absolute", left: 44, right: 44, bottom: 22, fontFamily: "Almarai", fontWeight: 800, fontSize: 20, color: BRAND.gray }}>المصدر: {source}</div>
      </div>
      <Tape x={-30} y={-6} rot={-28} /><Tape x={w - 90} y={H - 30} rot={-24} />
    </div>
  );
};

/** a torn note for the key phrase: cream paper strip with ragged ends, the phrase in Zain, one word underlined by hand in BRAND.mark */
export const TornNote: React.FC<{ at: number; until?: number; x: number; y: number; w: number; text: string; size?: number; underline?: number; rot?: number }> = ({ at, until, x, y, w, text, size = 72, underline, rot = 1.5 }) => {
  const s = useArrive(at, until, "tn" + text, "bottom", rot), t = useStep();
  if (!s) return null;
  // the note grows with its text: a phrase longer than one line gets one more line of height per wrap (user 2026-10-30: «العبارة غير ظاهرة لأن صندوقها أصغر منها»)
  // + a bigger white base again (side ×1.8, height ×3.2: user 2026-10-31 «كبّر القاعدة البيضاء قليلاً لإضافة هوامش للخط»)
  // + a white side margin of one text height on each side PLUS the ragged ends' depth (tornClip amp 12 → up to 24 px), so the letters never reach the tear
  //   (user 2026-10-30: «لا يوجد هامش للخط»، «لابد من هامش ابيض قبل التعرج»)
  const pad = Math.round(size * 1.8), lines = Math.max(1, Math.ceil(text.replace(/[ً-ٰٟۖ-ۭ]/g, "").length / Math.max(1, Math.floor((w - 2 * pad) / (size * 0.52))))), h = Math.round(size * 3.2 + (lines - 1) * size * 1.2), u = easeOut((t - at - 0.5) / 0.4);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, filter: shadow, ...s }}>
      <div style={{ position: "absolute", inset: 0, background: BRAND.card, clipPath: tornClip(w, h, "tn" + text, 12, 18), display: "flex", alignItems: "center", justifyContent: "center", direction: "rtl", padding: `0 ${pad}px`, boxSizing: "border-box" }}>
        <span style={{ fontFamily: zainF, fontSize: size, color: BRAND.ink, lineHeight: 1, textAlign: "center" }}>
          {text.split(" ").map((wd, i) => <span key={i} style={i === underline ? { backgroundImage: `linear-gradient(${BRAND.mark},${BRAND.mark})`, backgroundSize: `${u * 100}% 7px`, backgroundPosition: "right bottom", backgroundRepeat: "no-repeat", paddingBottom: 6 } : undefined}>{wd} </span>)}
        </span>
      </div>
      <Tape x={w / 2 - 60} y={-16} rot={3} />
    </div>
  );
};

/** a title made of torn paper scraps, one word per scrap (Arabic letters keep their joins), each arriving in stop-motion with its own tilt and stock */
/** without x it is centred across the width (user 2026-10-29); without y too it sits in the writing area: the third quarter of the height */
export const WordScraps: React.FC<{ at: number; until?: number; x?: number; y?: number; text: string; size?: number; gap?: number }> = ({ at, until, x, y, text, size = 50, gap = 0.18 }) => {
  const t = useStep(), f = useCurrentFrame(), { width, height } = useVideoConfig();
  const place: React.CSSProperties = x === undefined ? { left: 0, top: y ?? height * 0.5, width, ...(y === undefined ? { height: height * 0.25 } : {}), justifyContent: "center", boxSizing: "border-box", padding: `0 ${Math.round(width * 0.05)}px` } : { left: x, top: y ?? height * 0.5 };
  if (t < at || (until !== undefined && t > until + 0.3)) return null;
  const stocks = [BRAND.card, BRAND.paper, BRAND.navy, BRAND.accent];
  return (
    <div style={{ position: "absolute", display: "flex", flexDirection: "row-reverse", flexWrap: "wrap", gap: size * 0.3, alignItems: "center", ...place }}>
      {text.split(" ").map((wd, i) => {
        const a = at + i * gap, inn = easeOut((t - a) / 0.25), out = until === undefined ? 0 : easeOut((t - until) / 0.3);
        if (t < a) return <span key={i} style={{ visibility: "hidden", fontFamily: zainF, fontSize: size, padding: "0 22px" }}>{wd}</span>;
        const bg = stocks[Math.floor(random("ws" + wd + i) * stocks.length)], dark = bg === BRAND.navy || bg === BRAND.accent;
        const rot = (random("wr" + wd + i) - 0.5) * 10 + noise2D("ws" + i, f / 80, 0) * 0.8;
        const w = Math.round(size * 0.8 * wd.length + 70), h = Math.round(size * 1.45);
        return (
          <span key={i} style={{ position: "relative", width: w, height: h, transform: `scale(${0.6 + 0.4 * inn}) rotate(${rot}deg) translateY(${out * 600}px)`, opacity: Math.min(1, inn * 2), filter: shadow, display: "inline-block" }}>
            <span style={{ position: "absolute", inset: 0, background: bg, clipPath: tornClip(w, h, "ws" + wd + i, 6, 16), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: zainF, fontSize: size, color: dark ? BRAND.card : BRAND.ink, direction: "rtl" }}>{wd}</span>
          </span>
        );
      })}
    </div>
  );
};

/** a photo of the person or place in a torn white border with tape and a hand-written-style name strip */
export const TornPhoto: React.FC<{ at: number; until?: number; x: number; y: number; w: number; h: number; src: string; name?: string; pos?: string; rot?: number }> = ({ at, until, x, y, w, h, src, name, pos = "50% 25%", rot = 2.5 }) => {
  const s = useArrive(at, until, "tp" + src, "right", rot);
  if (!s) return null;
  const H = h + (name ? 70 : 28);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: H, filter: shadow, ...s }}>
      <div style={{ position: "absolute", inset: 0, background: BRAND.card, clipPath: tornClip(w, H, "tp" + src, 9, 18) }}>
        <div style={{ position: "absolute", left: 20, right: 20, top: 20, height: h - 20, overflow: "hidden" }}><Pic src={src} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos }} /></div>
        {name ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 12, textAlign: "center", fontFamily: kufiF, fontSize: 28, color: BRAND.ink, direction: "rtl" }}>{name}</div> : null}
      </div>
      <Tape x={w / 2 - 60} y={-14} rot={-4} />
    </div>
  );
};

/** paper grain over a paper scene (multiply, faint), so cut-outs and cards read as one sheet of material */
export const PaperGrain: React.FC<{ opacity?: number }> = ({ opacity = 0.09 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "multiply", opacity }}>
      <svg width="100%" height="100%"><filter id="pk-grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={Math.floor(f / 3) % 40} stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter><rect width="100%" height="100%" filter="url(#pk-grain)" /></svg>
    </AbsoluteFill>
  );
};
