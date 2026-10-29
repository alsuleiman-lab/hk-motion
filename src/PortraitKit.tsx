import React from "react";
import { BRAND_BAR, alpha, currentStars } from "./brand";
import { AbsoluteFill, Img, OffthreadVideo, getInputProps, getRemotionEnvironment, spring, staticFile, useCurrentFrame } from "remotion";
import { PhoneChips, useT, useSp, kufiF, zainF, GFX_ONLY } from "./MG";
import { Pic } from "./EuKit";
import { KhBg } from "./KhKit";
import { SafeVideo } from "./SafeMedia";
import type { BarTheme } from "./TitleBar";

/** frame-accurate video for the final render (OffthreadVideo → no judder), the forgiving SafeVideo in Studio (user 2026-10-22: «الفيديو يرتجف وليس انسيابياً») */
/** render from pre-extracted JPEG frames (inputProps {"frames":true}; public/fr/<video name>/f_%06d.jpg, file number = composition frame; PREFERENCES R-RENDER-SPEED.4): no video decoding, exact frame */
const FRAMES = (getInputProps() as { frames?: boolean }).frames === true;
export const RV: React.FC<{ src: string; style: React.CSSProperties }> = ({ src, style }) => {
  const f = useCurrentFrame();
  if (GFX_ONLY) return <div style={style} />;   // fast face check: no video decoding, the box keeps its place
  if (getRemotionEnvironment().isRendering && FRAMES) {
    const base = src.split("?")[0].split("/").pop()!.replace(/.[^.]+$/, "");
    return <Img src={staticFile(`fr/${base}/f_${String(f).padStart(6, "0")}.jpg`)} style={{ ...style, objectFit: "fill" }} />;
  }
  return getRemotionEnvironment().isRendering ? <OffthreadVideo src={src} muted style={style} /> : <SafeVideo src={src} muted style={style} />;
};

/**
 * PortraitKit — building blocks of the portrait reply montage (rules 2026-10-21/22):
 *  • HIS video fills the whole 1080×1920 frame (cover crop of the webcam, face centred); the hook (~5–6 s) isolates him on a background that EXPRESSES THE TOPIC
 *    (flag / place photo / collage objects), then his original room continues;
 *  • nothing over any face/beard: the beard ends near y≈1310, so written elements and clip frames live BELOW it (y ≥ 1340), names in a strip under photos;
 *  • key words are plain bold text with a marker stroke (no boxes); clips he replies to sit in a phone frame bottom-left (blurred 18 px when a woman appears).
 * All times are SECONDS on the CUT timeline.
 */
export const PK_FPS = 30;
export const INK = BRAND.navyDeep;
export const GOLD = BRAND.accent;
export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const K = 1920 / 1080; // webcam (1080 high) → portrait frame (1920 high)

/** kept under its old name for the specs/compositions that import it: the brand bar (src/brand.ts) */
export const BAR_WARM: BarTheme = BRAND_BAR;


// the default montage background = blue stars (user 2026-10-28: the dotted warm base was dropped in the gallery, KhBg kept)
export const WarmBase: React.FC = () => { const [a, b, c] = currentStars(); return <KhBg a={a} b={b} c={c} />; };

export const Only: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const t = useT(0);
  if (t < from - 0.01 || t > to) return null;
  return <AbsoluteFill style={{ opacity: clamp((to - t) / 0.3) }}>{children}</AbsoluteFill>;
};

/**
 * Key word (user 2026-10-22: «هذه الأشكال لا تعجبني» → no boxes): bold white text with a dark outline, rising out of a blur, and a hand-drawn marker stroke that
 * sweeps in behind it. tone "gold" = thick gold marker; tone "cream" = thin cream underline stroke. `flag` = a small round picture next to the text.
 */
export const Word: React.FC<{ text: string; at: number; until: number; x: number; y: number; size?: number; flag?: string; tone?: "gold" | "cream"; font?: string }> = ({ text, at, until, x, y, size = 50, flag, tone = "gold", font }) => {
  const t = useT(0);
  if (t < at || t > until) return null;
  const p = 1 - Math.pow(1 - clamp((t - at) / 0.45), 4);
  const sweep = 1 - Math.pow(1 - clamp((t - at - 0.08) / 0.4), 3);
  const out = clamp((until - t) / 0.25);
  const gold = tone === "gold";
  size = size * 1.15;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) translateY(${(1 - p) * size * 0.35}px)`, opacity: p * out, filter: p < 1 ? `blur(${((1 - p) * size * 0.1).toFixed(1)}px)` : undefined, direction: "rtl", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 14 }}>
      {flag ? <Pic src={flag} style={{ height: size * 0.95, width: size * 0.95, borderRadius: "50%", objectFit: "cover", border: `3px solid ${BRAND.card}`, boxShadow: "0 3px 10px rgba(10,18,30,.6)" }} /> : null}
      <span style={{ position: "relative", display: "inline-block", padding: "0 10px" }}>
        <span style={{ position: "absolute", right: 0, bottom: gold ? "4%" : "-2%", height: gold ? "58%" : "8%", width: `${sweep * 100}%`, background: gold ? alpha(BRAND.accent, .92) : "rgba(246,239,224,.95)", borderRadius: 8, transform: "skewX(-6deg)" }} />
        <span style={{ position: "relative", fontFamily: font ?? zainF, fontSize: size, lineHeight: 1.3, color: "#fff", WebkitTextStroke: `${Math.max(5, size * 0.12)}px ${BRAND.ink}`, paintOrder: "stroke fill", textShadow: "0 5px 16px rgba(10,18,30,.75)" }}>{text}</span>
      </span>
    </div>
  );
};

/** phone with a playing clip (the clip file shares the cut's time base). Default: bottom-left, below the beard */
export const PhoneWin: React.FC<{ at: number; to: number; src: string; dur: number; cx?: number; cy?: number; w?: number; h?: number; blur?: number }> = ({ at, to, src, dur, cx = 230, cy = 1634, w = 380, h = 540, blur }) => {
  const t = useT(0);
  if (t < at - 0.01 || t > to + 0.5) return null;
  const out = clamp((to + 0.5 - t) / 0.4);
  return (
    <AbsoluteFill style={{ opacity: out, transform: `translateY(${(1 - out) * 120}px)` }}>
      <PhoneChips at={at} cx={cx} cy={cy} w={w} h={h} dur={dur} scroll={0} notch={false} chips={[]} screen={<div style={{ width: w, height: h, background: "#000", overflow: "hidden" }}><RV src={staticFile(src)} style={{ width: w, height: h, objectFit: "contain", filter: blur ? `blur(${blur}px)` : undefined }} /></div>} />
    </AbsoluteFill>
  );
};

/* ───────── the Sheikh FILLS the frame: isolated (alpha) during the hook, then his original room (same crop → seamless) ───────── */
export type Cam = { from: number; to: number; cx: number };   // cx = x of his face in the 1920×1080 cut; the frame shows the 608×1080 slice around it
export const SheikhLayers: React.FC<{ cut: string; cams: Cam[]; zooms?: { from: number; to: number; amt?: number }[]; originY?: number }> = ({ cut, cams, zooms = [], originY = 600 }) => {
  const t = useT(0);
  const cam = cams.find((c) => t >= c.from && t < c.to) ?? cams[cams.length - 1];
  const zz = zooms.find((z) => t >= z.from - 0.01 && t <= z.to + 0.5);
  const z = zz ? 1 + (zz.amt ?? 0.08) * Math.min(clamp((t - zz.from) / 0.35), clamp((zz.to + 0.5 - t) / 0.45)) : 1;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${z})`, transformOrigin: `540px ${originY}px` }}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: BRAND.ink }}>
        <RV src={staticFile(cut)} style={{ position: "absolute", left: -(cam.cx - 304) * K, top: 0, width: 1920 * K, height: 1920 }} />
      </div>
    </div>
  );
};

/* ───────── MapRoute — «عند ذكر الانتقال بين البلاد/المدن تُرسم خريطة» (user rule 2026-10-22; own component, Natural Earth outlines in src/levantMap.ts) ───────── */
import { LEVANT } from "./levantMap";
import { BRAND } from "./brand";
export type MapPt = { name: string; lon: number; lat: number; at: number; down?: boolean };
export type MapLeg = { from: [number, number]; to: [number, number]; at: number; dur?: number; car?: boolean };
export const MapRoute: React.FC<{
  at: number; until: number; x: number; y: number; w: number; h: number;
  center: [number, number]; spanLat: number; highlight?: string[]; pts?: MapPt[]; legs?: MapLeg[];
}> = ({ at, until, x, y, w, h, center, spanLat, highlight = ["SYR"], pts = [], legs = [] }) => {
  const t = useT(0);
  const sp = useSp(at, 15, 120);
  if (t < at || t > until) return null;
  const out = clamp((until - t) / 0.3);
  const [clon, clat] = center;
  const cosl = Math.cos((clat * Math.PI) / 180);
  const pxPerLat = h / spanLat;
  const P = (lon: number, lat: number): [number, number] => [w / 2 + (lon - clon) * cosl * pxPerLat, h / 2 - (lat - clat) * pxPerLat];
  const path = (poly: number[][][]) => poly.map((ring) => "M" + ring.map(([lo, la]) => P(lo, la).map((v) => v.toFixed(1)).join(",")).join("L") + "Z").join("");
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: out * clamp(sp * 1.5), transform: `scale(${0.9 + 0.1 * sp})`, borderRadius: 22, overflow: "hidden", border: "5px solid #f6efe0", background: "#9eb4bd", boxShadow: "0 14px 30px rgba(40,24,10,.55)" }}>
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs><marker id="mh" markerWidth="8" markerHeight="8" refX="5" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#9b2f1a" /></marker></defs>
        {Object.entries(LEVANT).map(([code, polys]) => polys.map((poly, i) => <path key={code + i} d={path(poly)} fill={highlight.includes(code) ? "#e2c88f" : "#efe5cf"} stroke="#6b4a2c" strokeWidth={highlight.includes(code) ? 2.4 : 1.2} />))}
        {legs.map((l, i) => {
          const g = clamp((t - l.at) / (l.dur ?? 1.0));
          if (g <= 0) return null;
          const [x1, y1] = P(...l.from), [x2, y2] = P(...l.to);
          const mx = (x1 + x2) / 2 + (y2 - y1) * 0.22, my = (y1 + y2) / 2 - (x2 - x1) * 0.22;
          const e = 1 - Math.pow(1 - g, 3);
          const px = (1 - e) * (1 - e) * x1 + 2 * (1 - e) * e * mx + e * e * x2, py = (1 - e) * (1 - e) * y1 + 2 * (1 - e) * e * my + e * e * y2;
          return (
            <g key={i}>
              <path d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`} fill="none" stroke="#9b2f1a" strokeWidth={7} strokeLinecap="round" strokeDasharray="1 14" pathLength={1} style={{ strokeDasharray: `${e * 1000} 1000` }} markerEnd={g >= 0.98 ? "url(#mh)" : undefined} opacity={0.95} />
              <circle cx={px} cy={py} r={l.car ? 13 : 9} fill="#fff4dc" stroke="#9b2f1a" strokeWidth={4} />
            </g>
          );
        })}
        {pts.map((p, i) => {
          if (t < p.at) return null;
          const [px, py] = P(p.lon, p.lat);
          const s = clamp((t - p.at) / 0.35);
          return (
            <g key={i} transform={`translate(${px},${py}) scale(${0.6 + 0.4 * s})`} opacity={s}>
              <circle r={11} fill="#9b2f1a" stroke="#fff4dc" strokeWidth={4} />
              <text x={0} y={-22} textAnchor="middle" fontFamily={kufiF} fontSize={34} fill="#fff" stroke="#35200f" strokeWidth={7} paintOrder="stroke" direction="rtl">{p.name}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/* ───────── Paper motion (user 2026-10-22: «موشن ورقي»): stop-motion paper cut-outs on kraft paper ───────── */
const SM = 3;                       // stop-motion: the picture updates every 3rd frame
const gTex = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/></filter><rect width='160' height='160' filter='url(%23n)' opacity='.5'/></svg>\")";
const paperCard = (x: number, y: number, w: number, h: number, pop: number, rot: number): React.CSSProperties => ({ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 18, overflow: "hidden", border: `6px solid ${BRAND.card}`, background: BRAND.paper2, boxShadow: "0 14px 30px rgba(10,18,30,.55)", transform: `rotate(${rot * (1 - pop)}deg) scale(${0.9 + 0.1 * pop})`, opacity: Math.min(1, pop * 2.5) });
const Grain: React.FC = () => <div style={{ position: "absolute", inset: 0, backgroundImage: gTex, opacity: 0.22, mixBlendMode: "multiply", pointerEvents: "none" }} />;
const useStop = () => { const f = useCurrentFrame(); const q = Math.floor(f / SM) * SM; return { q, t: q / PK_FPS, k: Math.round(q / SM) }; };

/** Paper map: torn paper country on kraft paper, paper name tags, a dashed paper road and a paper car that drives between the two cities in stop-motion */
export const PaperMap: React.FC<{
  at: number; until: number; x: number; y: number; w: number; h: number; center: [number, number]; spanLat: number;
  highlight?: string[]; pts?: MapPt[]; legs?: MapLeg[]; carSrc?: string;
}> = ({ at, until, x, y, w, h, center, spanLat, highlight = ["SYR"], pts = [], legs = [], carSrc = "collage/car.png" }) => {
  const { t, k } = useStop();
  if (t < at || t > until) return null;
  const pop = clamp((t - at) / 0.35), out = clamp((until - t) / 0.3);
  const [clon, clat] = center, cosl = Math.cos((clat * Math.PI) / 180), pxPerLat = h / spanLat;
  const P = (lon: number, lat: number): [number, number] => [w / 2 + (lon - clon) * cosl * pxPerLat, h / 2 - (lat - clat) * pxPerLat];
  const path = (poly: number[][][]) => poly.map((ring) => "M" + ring.map(([lo, la]) => P(lo, la).map((v) => v.toFixed(1)).join(",")).join("L") + "Z").join("");
  const car = legs.map((l) => {
    const g = clamp((t - l.at) / (l.dur ?? 1.2));
    if (g <= 0) return null;
    const [x1, y1] = P(...l.from), [x2, y2] = P(...l.to), mx = (x1 + x2) / 2 + (y2 - y1) * 0.25, my = (y1 + y2) / 2 - (x2 - x1) * 0.25;
    const e = g * g * (3 - 2 * g), u = 1 - e;
    return { l, e, px: u * u * x1 + 2 * u * e * mx + e * e * x2, py: u * u * y1 + 2 * u * e * my + e * e * y2, dx: x2 - x1, x1, y1, x2, y2, mx, my };
  });
  return (
    <div style={{ ...paperCard(x, y, w, h, pop, -2.5), opacity: out * Math.min(1, pop * 2.5) }}>
      <Grain />
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <filter id="rough" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="4" result="n" /><feDisplacementMap in="SourceGraphic" in2="n" scale="8" /></filter>
          <filter id="shd" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="3" dy="6" stdDeviation="3.5" floodColor="#3b2410" floodOpacity="0.55" /></filter>
        </defs>
        <g filter="url(#shd)"><g filter="url(#rough)">
          {Object.entries(LEVANT).map(([code, polys]) => polys.map((poly, i) => <path key={code + i} d={path(poly)} fill={highlight.includes(code) ? "#f4ead2" : "#dcc296"} stroke={highlight.includes(code) ? "#fffaf0" : "#efe0bf"} strokeWidth={highlight.includes(code) ? 5 : 3} />))}
        </g></g>
        {car.map((c, i) => c ? Array.from({ length: 16 }, (_, j) => {
          const s = (j + 0.5) / 16; if (s > c.e) return null;
          const m = 1 - s, bx = m * m * c.x1 + 2 * m * s * c.mx + s * s * c.x2, by = m * m * c.y1 + 2 * m * s * c.my + s * s * c.y2;
          const ang = Math.atan2(2 * m * (c.my - c.y1) + 2 * s * (c.y2 - c.my), 2 * m * (c.mx - c.x1) + 2 * s * (c.x2 - c.mx)) * 180 / Math.PI;
          return <rect key={i + "-" + j} x={bx - 9} y={by - 3.5} width={18} height={7} rx={2} fill={BRAND.mark} stroke="#f6efe0" strokeWidth={1.5} transform={`rotate(${ang} ${bx} ${by})`} />;
        }) : null)}
        {pts.map((p, i) => {
          if (t < p.at) return null;
          const [px, py] = P(p.lon, p.lat), s = clamp((t - p.at) / 0.35), tilt = i % 2 ? 3 : -4;
          return (
            <g key={i} transform={`translate(${px},${py}) scale(${0.6 + 0.4 * s})`} opacity={s} filter="url(#shd)">
              <circle r={11} fill={BRAND.mark} stroke="#fff4dc" strokeWidth={4} />
              <g transform={`translate(0,${p.down ? 50 : -34}) rotate(${tilt})`}><rect x={-62} y={-24} width={124} height={44} rx={7} fill="#f6efe0" stroke="#7a5233" strokeWidth={2} /><text x={0} y={9} textAnchor="middle" fontFamily={kufiF} fontSize={32} fill="#35200f" direction="rtl">{p.name}</text></g>
            </g>
          );
        })}
      </svg>
      {car.map((c, i) => c ? (
        <Pic key={i} src={carSrc} style={{ position: "absolute", left: c.px - 70, top: c.py - 40 + (k % 2 ? -3 : 3), width: 140, transform: `rotate(${k % 2 ? 4 : -4}deg) scaleX(${c.dx >= 0 ? -1 : 1})`, filter: "drop-shadow(3px 6px 4px rgba(40,24,10,.55))" }} />
      ) : null)}
    </div>
  );
};

/** Paper scene: a kraft card where described people/objects (faceless silhouettes) slide in one after another, stop-motion, e.g. a sheikh seated beside a made-up woman */
export const PaperScene: React.FC<{
  at: number; until: number; x: number; y: number; w: number; h: number;
  pieces: { src: string; x: number; y: number; w: number; at: number; rot?: number; from?: "left" | "right" | "top" | "bottom" }[];
}> = ({ at, until, x, y, w, h, pieces }) => {
  const { t, k } = useStop();
  if (t < at || t > until) return null;
  const pop = clamp((t - at) / 0.3), out = clamp((until - t) / 0.3);
  return (
    <div style={{ ...paperCard(x, y, w, h, pop, 2), opacity: out * Math.min(1, pop * 2.5) }}>
      <Grain />
      {pieces.map((p, i) => {
        const g = clamp((t - p.at) / 0.55);
        if (g <= 0) return null;
        const e = 1 - Math.pow(1 - g, 3), d = (1 - e) * 520, from = p.from ?? "right";
        const dx = from === "left" ? -d : from === "right" ? d : 0, dy = from === "top" ? -d : from === "bottom" ? d : 0;
        const wob = (p.rot ?? 0) + (g < 1 ? ((k + i) % 2 ? 3 : -3) * (1 - e) : 0);
        return <Pic key={i} src={p.src} style={{ position: "absolute", left: p.x + dx, top: p.y + dy, width: p.w, transform: `rotate(${wob}deg)`, filter: "drop-shadow(4px 7px 5px rgba(10,18,30,.55))" }} />;
      })}
    </div>
  );
};


/* ───────── shared layout + source-picture helpers (promoted from the one-off video files, 2026-10-26: write once here, every video follows) ───────── */

/** the landscape counterpart of PORTRAIT (PREFERENCES §4: writing sits in the empty side of his frame, never over face/beard; key phrase y 60–80 % of the height) */
export const LANDSCAPE = {
  W: 1920, H: 1080,
  left: { x: 40, y: 150, w: 600 },   // left-hand column for source cards / writing
  keyY: 840,                         // key-phrase chip: 78% of the height, below the beard tip even during a push-in (face_fast 2026-10-27)
  nameY: 880,                        // name tag under the chin line
  creditY: 1040,                     // small «source/credit» line at the very bottom
  right: { x: 1500, y: 200 },        // scholar polaroid in the empty right side
  faceOrigin: "51.6% 30.5%",         // push-in origin on his face
};

/** a hand-drawn red marker box that draws itself over a region of a card (relative 0..1 coordinates, placed inside the card) */
export const Marker: React.FC<{ at: number; x: number; y: number; w: number; h: number }> = ({ at, x, y, w, h }) => {
  const f = useCurrentFrame();
  const p = clamp((f / PK_FPS - at) / 0.5);
  if (p <= 0) return null;
  return <div style={{ position: "absolute", left: `${x * 100}%`, top: `${y * 100}%`, width: `${w * 100}%`, height: `${h * 100}%`, border: `6px solid ${BRAND.mark}`, borderRadius: 28, clipPath: `inset(0 ${100 - p * 100}% 0 0)`, boxShadow: `0 0 18px ${alpha(BRAND.mark, .55)}` }} />;
};

/** a plain spring pop-in for a card that is not one of the kit's source moves (left-bottom anchored) */
export const PopCard: React.FC<{ at: number; x: number; y: number; children: React.ReactNode }> = ({ at, x, y, children }) => {
  const t = useT(at);
  if (t < 0) return null;
  const sp = spring({ frame: Math.round(t * PK_FPS), fps: PK_FPS, config: { damping: 12, stiffness: 170 } });
  return <div style={{ position: "absolute", left: x, top: y, transform: `scale(${0.82 + 0.18 * sp})`, transformOrigin: "left bottom", opacity: Math.min(1, t * 6), filter: "drop-shadow(0 14px 22px rgba(10,18,30,.45))" }}>{children}</div>;
};

/** a source picture FILLS the 1080×1920 frame for a frame range (user 2026-10-23: manuscript full-screen) with a slow push and an optional self-drawing marker; sits in the BASE layers (outside <Gfx>) because it deliberately replaces him for those seconds. Put it right after SheikhLayers, before <Gfx>. */
export const FullImage: React.FC<{ src: string; from: number; to: number; origin?: string; marker?: { x: number; y: number; w: number; h: number; at: number } }> = ({ src, from, to, origin = "50% 40%", marker }) => {
  const t = useT(0);
  if (t < from || t > to) return null;
  const o = Math.min(1, (t - from) / 0.1 + 0.34, (to - t) / 0.1 + 0.34);
  const k = 1 + 0.12 * clamp((t - from) / (to - from));
  const mp = marker ? clamp((t - marker.at) / 0.5) : 0;
  return (
    <AbsoluteFill style={{ opacity: o, background: BRAND.card, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${k})`, transformOrigin: origin }}>
        <Pic src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        {marker && mp > 0 ? <div style={{ position: "absolute", left: marker.x, top: marker.y, width: marker.w, height: marker.h, border: `7px solid ${BRAND.mark}`, borderRadius: 30, clipPath: `inset(0 ${100 - mp * 100}% 0 0)`, boxShadow: `0 0 20px ${alpha(BRAND.mark, .6)}` }} /> : null}
      </div>
    </AbsoluteFill>
  );
};
