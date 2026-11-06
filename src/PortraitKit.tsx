import React from "react";
import { BRAND_BAR, RED, alpha, currentStars } from "./brand";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, getInputProps, getRemotionEnvironment, spring, staticFile, useCurrentFrame } from "remotion";
import { PhoneChips, useT, useSp, kufiF, zainF, naskhF, GFX_ONLY } from "./MG";
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
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) translateY(${(1 - p) * size * 0.35}px)`, opacity: p * out, filter: p < 1 ? `blur(${((1 - p) * size * 0.1).toFixed(1)}px)` : undefined, direction: "rtl", maxWidth: 820, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
      {flag ? <Pic src={flag} style={{ height: size * 0.95, width: size * 0.95, borderRadius: "50%", objectFit: "cover", border: `3px solid ${BRAND.card}`, boxShadow: "0 3px 10px rgba(10,18,30,.6)" }} /> : null}
      <span style={{ position: "relative", display: "inline-block", maxWidth: "100%", padding: "0 18px", textAlign: "center" }}>
        <span style={{ position: "absolute", right: 0, bottom: gold ? "4%" : "-2%", height: gold ? "58%" : "8%", width: `${sweep * 100}%`, background: gold ? alpha(BRAND.accent, .92) : "rgba(246,239,224,.95)", borderRadius: 8, transform: "skewX(-6deg)" }} />
        <span style={{ position: "relative", fontFamily: font ?? zainF, fontSize: size, lineHeight: 1.3, color: "#fff", WebkitTextStroke: `${Math.max(5, size * 0.12)}px ${BRAND.ink}`, paintOrder: "stroke fill", textShadow: "0 5px 16px rgba(10,18,30,.75)", whiteSpace: "normal", textAlign: "center" }}>{text}</span>
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
import { WORLD } from "./worldMap";
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
  highlight?: string[]; highlightAt?: Record<string, number>; geo?: "levant" | "world"; pts?: MapPt[]; legs?: MapLeg[]; carSrc?: string; carW?: number;
}> = ({ at, until, x, y, w, h, center, spanLat, highlight = ["SYR"], highlightAt, geo, pts = [], legs = [], carSrc = "collage/car.png", carW = 140 }) => {
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
          {Object.entries(geo === "world" ? WORLD : LEVANT).map(([code, polys]) => polys.map((poly, i) => <path key={code + i} d={path(poly)} fill={highlight.includes(code) && (!highlightAt || t >= (highlightAt[code] ?? 0)) ? "#f4ead2" : "#dcc296"} stroke={highlight.includes(code) ? "#fffaf0" : "#efe0bf"} strokeWidth={highlight.includes(code) ? 5 : 3} />))}
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
        <Pic key={i} src={carSrc} style={{ position: "absolute", left: c.px - carW / 2, top: c.py - carW * 0.3 + (k % 2 ? -3 : 3), width: carW, opacity: Math.max(0, Math.min(1, 1 - (t - c.l.at - (c.l.dur ?? 1.2) - 0.4) / 0.5)), transform: `rotate(${k % 2 ? 4 : -4}deg) scaleX(${c.dx >= 0 ? -1 : 1})`, filter: "drop-shadow(3px 6px 4px rgba(40,24,10,.55))" }} />
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
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: out * Math.min(1, pop * 2.5) }}>   {/* no paper card behind the pieces (user 2026-10-30: «لا يلزم وجود بطاقة خلفية») */}
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
  return <div style={{ position: "absolute", left: `${x * 100}%`, top: `${y * 100}%`, width: `${w * 100}%`, height: `${h * 100}%`, border: `6px solid ${RED}`, borderRadius: 28, clipPath: `inset(0 ${100 - p * 100}% 0 0)`, boxShadow: `0 0 18px ${alpha(RED, .55)}` }} />;
};

/* ───────── FamilyTree (user 2026-10-29, «ارسم مخطط نسب… كل ما أذكر واحد ضيفه على الشجرة»): paper card with name tags that pop at the second each person is named,
   couple lines and child branches that draw themselves; dashed = a mother who is not the wife of the first line / a disputed claim ───────── */
export type TreeNode = { id: string; label: string; sub?: string; at: number; px: number; py: number; tone?: "gold" | "red" | "ink" };
export type TreeLink = { a: string; b?: string; to?: string; at: number; dashed?: boolean };
export const FamilyTree: React.FC<{
  from: number; until: number; x: number; y: number; w: number; h: number; title: string; titleAt?: number;
  nodes: TreeNode[]; links: TreeLink[]; nodeW?: number; nodeH?: number; font?: number;
}> = ({ from, until, x, y, w, h, title, titleAt, nodes, links, nodeW = 230, nodeH = 70, font = 32 }) => {
  const t = useT(0);
  if (t < from || t > until) return null;
  const pop = clamp((t - from) / 0.4), out = clamp((until - t) / 0.35);
  const top = Math.round(h * 0.12), ah = h - top - 16;
  const C = (id: string): [number, number] => { const n = nodes.find((q) => q.id === id)!; return [n.px * w, top + n.py * ah]; };
  const toneC = (tn?: string) => (tn === "red" ? BRAND.mark : tn === "gold" ? BRAND.accent : BRAND.navy);
  return (
    <div style={{ ...paperCard(x, y, w, h, pop, -1.5), opacity: out * Math.min(1, pop * 2.5), background: BRAND.card }}>
      <Grain />
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: top, background: BRAND.navyDeep, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", direction: "rtl", fontFamily: kufiF, fontWeight: 800, fontSize: Math.round(top * 0.5), opacity: clamp((t - (titleAt ?? from)) / 0.3) }}>{title}</div>
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
        {links.map((l, i) => {
          const g = clamp((t - l.at) / 0.7);
          if (g <= 0) return null;
          const [ax, ay] = C(l.a);
          let d: string;
          if (l.to) {
            const [sx, sy] = l.b ? (() => { const [bx, by] = C(l.b!); return [(ax + bx) / 2, (ay + by) / 2]; })() : [ax, ay + nodeH / 2];
            const [tx, ty] = C(l.to), my = (sy + ty - nodeH / 2) / 2;
            d = `M${sx},${sy} V${my} H${tx} V${ty - nodeH / 2}`;
          } else { const [bx, by] = C(l.b!); d = `M${ax},${ay} L${bx},${by}`; }
          return <path key={i} d={d} fill="none" stroke={l.dashed ? BRAND.gray : BRAND.navy} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={l.dashed ? "0.02 0.02" : `${g} 1`} strokeDashoffset={0} opacity={l.dashed ? g : 1} />;
        })}
      </svg>
      {nodes.map((n) => {
        const s = clamp((t - n.at) / 0.4);
        if (s <= 0) return null;
        const [cx, cy] = C(n.id), e = 1 - Math.pow(1 - s, 3), c = toneC(n.tone), fresh = t - n.at < 1.6;
        return (
          <div key={n.id} style={{ position: "absolute", left: cx - nodeW / 2, top: cy - nodeH / 2, width: nodeW, height: nodeH, boxSizing: "border-box", borderRadius: 14, background: "#fff", border: `5px solid ${c}`, boxShadow: fresh ? `0 0 0 6px ${alpha(c, 0.25)}, 0 8px 16px rgba(10,18,30,.35)` : "0 8px 16px rgba(10,18,30,.35)", transform: `scale(${0.6 + 0.4 * e}) rotate(${(1 - e) * (n.px > 0.5 ? 6 : -6)}deg)`, opacity: e, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", direction: "rtl", fontFamily: kufiF, fontWeight: 800, color: BRAND.ink, fontSize: font, lineHeight: 1.1, textAlign: "center" }}>
            <div>{n.label}</div>
            {n.sub ? <div style={{ fontSize: Math.round(font * 0.6), fontWeight: 600, color: BRAND.gray }}>{n.sub}</div> : null}
          </div>
        );
      })}
    </div>
  );
};

/* ───────── TreeFx — the stronger family tree (user 2026-10-29: «شيء أقوى من حيث الموشن جرافيك، ولا تضعها داخل إطار»): no card; it is drawn straight on the decorated base
   (MontageSpec puts the base under it and him isolated over it). Branches draw with a glowing head, every person arrives with an overshoot, a pulse ring and sparks, the newest
   node glows, dashed branches (a disputed mother / a claim) keep flowing. Absolute frame coordinates: x,y,w,h = the region of the tree. ───────── */
export const TreeFx: React.FC<{
  from: number; until: number; x: number; y: number; w: number; h: number; title: string; titleAt?: number;
  nodes: TreeNode[]; links: TreeLink[]; nodeW?: number; nodeH?: number; font?: number; titleSize?: number; skin?: "parchment";
}> = ({ from, until, x, y, w, h, title, titleAt, nodes, links, nodeW = 232, nodeH = 70, font = 28, titleSize = 52, skin }) => {
  const PCH = skin === "parchment";
  const t = useT(0);
  if (t < from || t > until) return null;
  const out = clamp((until - t) / 0.4), top = Math.round(h * 0.12), ah = h - top - 8;
  const P = (id: string): [number, number] => { const n = nodes.find((q) => q.id === id)!; return [x + n.px * w, y + top + n.py * ah]; };
  const back = (u: number) => { const c1 = 1.9; const v = clamp(u) - 1; return clamp(u) >= 1 ? 1 : 1 + (c1 + 1) * v * v * v + c1 * v * v; };
  const toneC = (tn?: string) => (tn === "red" ? BRAND.mark : tn === "gold" ? BRAND.accent : BRAND.navy);
  const tAt = titleAt ?? from + 0.2, tp = clamp((t - tAt) / 0.5);
  const polyLen = (ps: [number, number][]) => ps.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - ps[i][0], p[1] - ps[i][1]), 0);
  const ptAt = (ps: [number, number][], d: number): [number, number] => { let r = d; for (let i = 1; i < ps.length; i++) { const l = Math.hypot(ps[i][0] - ps[i - 1][0], ps[i][1] - ps[i - 1][1]); if (r <= l) { const k = l ? r / l : 0; return [ps[i - 1][0] + (ps[i][0] - ps[i - 1][0]) * k, ps[i - 1][1] + (ps[i][1] - ps[i - 1][1]) * k]; } r -= l; } return ps[ps.length - 1]; };
  return (
    <AbsoluteFill style={{ opacity: out, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: x, top: y, width: w, textAlign: "center", direction: "rtl", fontFamily: kufiF, fontWeight: 800, fontSize: titleSize, color: PCH ? BRAND.navyDeep : BRAND.card, textShadow: PCH ? `0 2px 0 ${alpha(BRAND.card, 0.7)}` : "0 4px 14px rgba(0,0,0,.55)", opacity: tp, transform: `translateY(${(1 - tp) * -24}px)` }}>
        {title}
        <div style={{ margin: "6px auto 0", height: 6, width: `${tp * 70}%`, borderRadius: 3, background: PCH ? BRAND.navy : BRAND.mark, boxShadow: PCH ? "none" : `0 0 14px ${BRAND.mark}` }} />
      </div>
      <svg style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", overflow: "visible" }}>
        {links.map((l, i) => {
          const g = clamp((t - l.at) / 0.9);
          if (g <= 0) return null;
          const [ax, ay] = P(l.a);
          let ps: [number, number][];
          if (l.to) {
            const [sx, sy] = l.b ? (() => { const [bx, by] = P(l.b!); return [(ax + bx) / 2, (ay + by) / 2] as [number, number]; })() : ([ax, ay + nodeH / 2] as [number, number]);
            const [tx, ty] = P(l.to), my = (sy + ty - nodeH / 2) / 2;
            ps = [[sx, sy], [sx, my], [tx, my], [tx, ty - nodeH / 2]];
          } else { const [bx, by] = P(l.b!); ps = [[ax, ay], [bx, by]]; }
          const L = polyLen(ps), e = 1 - Math.pow(1 - g, 3), d = ps.map((p, k) => `${k ? "L" : "M"}${p[0]},${p[1]}`).join("");
          const [hx, hy] = ptAt(ps, L * e);
          const col = PCH ? BRAND.navy : l.dashed ? BRAND.light : BRAND.card;
          return (
            <g key={i}>
              <path d={d} fill="none" stroke={col} strokeOpacity={PCH ? 0 : 0.28} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={l.dashed ? "2 22" : `${e * L} ${L}`} opacity={l.dashed ? g : 1} />
              <path d={d} fill="none" stroke={col} strokeWidth={l.dashed ? 5 : 7} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={l.dashed ? "16 14" : `${e * L} ${L}`} strokeDashoffset={l.dashed ? -t * 46 : 0} opacity={l.dashed ? g : 1} />
              {g < 1 ? <circle cx={hx} cy={hy} r={PCH ? 8 : 12} fill={BRAND.mark} stroke={PCH ? BRAND.card : BRAND.card} strokeWidth={3} /> : null}
              {PCH && g >= 0.98 ? (() => { const [ex, ey] = ps[ps.length - 1], [px2, py2] = ps[ps.length - 2], ang = (Math.atan2(ey - py2, ex - px2) * 180) / Math.PI; return <polygon points="0,0 -16,-8 -16,8" fill={BRAND.navy} transform={`translate(${ex},${ey}) rotate(${ang})`} />; })() : null}
            </g>
          );
        })}
      </svg>
      {nodes.map((n) => {
        const age = t - n.at;
        if (age < 0) return null;
        const u = clamp(age / 0.55), s = back(u), c = toneC(n.tone), fresh = age < 1.7 ? 1 - age / 1.7 : 0;
        const [cx, cy] = P(n.id);
        const ring = clamp(age / 0.7);
        return (
          <React.Fragment key={n.id}>
            {ring < 1 ? <div style={{ position: "absolute", left: cx - nodeW / 2, top: cy - nodeH / 2, width: nodeW, height: nodeH, borderRadius: 20, border: `5px solid ${BRAND.mark}`, opacity: 1 - ring, transform: `scale(${1 + ring * 0.9})`, boxSizing: "border-box" }} /> : null}
            {Array.from({ length: 8 }, (_, k) => { const a = (k / 8) * Math.PI * 2, r = 40 + ring * 90, o = 1 - ring; return o > 0 ? <div key={k} style={{ position: "absolute", left: cx + Math.cos(a) * (nodeW / 2 + r * 0.6) - 6, top: cy + Math.sin(a) * (nodeH / 2 + r * 0.6) - 6, width: 12, height: 12, borderRadius: 6, background: k % 2 ? BRAND.card : BRAND.mark, opacity: o }} /> : null; })}
            {PCH ? <div style={{ position: "absolute", left: cx - nodeW / 2, top: cy - nodeH / 2, width: nodeW, height: nodeH, transform: `scale(${Math.max(0, s)}) rotate(${(1 - u) * (n.px > 0.5 ? 9 : -9)}deg)`, filter: `drop-shadow(0 6px 8px ${alpha(BRAND.navyDeep, 0.5)})${fresh > 0 ? ` drop-shadow(0 0 ${8 + fresh * 22}px ${alpha(BRAND.accent, 0.4 + fresh * 0.5)})` : ""}` }}>
              <div style={{ position: "absolute", inset: 0, background: n.tone === "red" ? BRAND.mark : BRAND.navy, clipPath: "polygon(0 50%, 5% 0, 95% 0, 100% 50%, 95% 100%, 5% 100%)" }} />
              <div style={{ position: "absolute", inset: 5, background: BRAND.card, clipPath: "polygon(0 50%, 5% 0, 95% 0, 100% 50%, 95% 100%, 5% 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", direction: "rtl", fontFamily: naskhF, fontWeight: 700, color: BRAND.ink, fontSize: font, lineHeight: 1.15, textAlign: "center", padding: "0 18px", boxSizing: "border-box" }}>
                <div>{n.label}</div>
                {n.sub ? <div style={{ fontSize: Math.round(font * 0.66), fontWeight: 500, color: BRAND.accentDeep }}>{n.sub}</div> : null}
              </div>
            </div> : null}
            {!PCH ? <div style={{ position: "absolute", left: cx - nodeW / 2, top: cy - nodeH / 2, width: nodeW, height: nodeH, boxSizing: "border-box", borderRadius: 18, background: BRAND.card, border: `6px solid ${c}`, boxShadow: `0 10px 22px rgba(0,0,0,.45), 0 0 ${10 + fresh * 34}px ${alpha(c, 0.35 + fresh * 0.5)}`, transform: `scale(${Math.max(0, s)}) rotate(${(1 - u) * (n.px > 0.5 ? 9 : -9)}deg)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", direction: "rtl", fontFamily: kufiF, fontWeight: 800, color: BRAND.ink, fontSize: font, lineHeight: 1.1, textAlign: "center" }}>
              <div>{n.label}</div>
              {n.sub ? <div style={{ fontSize: Math.round(font * 0.66), fontWeight: 700, color: c }}>{n.sub}</div> : null}
            </div> : null}
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

/** old-manuscript parchment with a double ornamental border and corner knots — the backdrop of the user's reference family tree (2026-10-29, «مثال») */
export const Parchment: React.FC = () => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, ${BRAND.card} 0%, ${BRAND.paper} 55%, ${BRAND.paper2} 100%)` }}>
    <Grain />
    <AbsoluteFill style={{ boxShadow: `inset 0 0 160px ${alpha(BRAND.navy, 0.4)}` }} />
    <div style={{ position: "absolute", inset: 18, border: `10px solid ${BRAND.navy}`, borderRadius: 6 }} />
    <div style={{ position: "absolute", inset: 38, border: `3px solid ${BRAND.accent}`, borderRadius: 4 }} />
    {[[18, 18], [18, -1], [-1, 18], [-1, -1]].map(([l, tp], i) => <div key={i} style={{ position: "absolute", [l < 0 ? "right" : "left"]: 6, [tp < 0 ? "bottom" : "top"]: 6, width: 64, height: 64, border: `6px solid ${BRAND.navy}`, transform: "rotate(45deg) scale(.72)", background: BRAND.accent, boxShadow: `inset 0 0 0 6px ${BRAND.accentDeep}` }} />)}
  </AbsoluteFill>
);

/** his isolated cut-out shrunk into a corner (user 2026-10-29, the paper map): the face point `face` of the 1920×1080 frame moves to (cx, cy) and the frame scales to `scale` between `shrinkAt` and +0.6 s */
export const miniEase = (t: number, a: number) => { const p = clamp((t - a) / 0.6); return p * p * (3 - 2 * p); };

/** a plain spring pop-in for a card that is not one of the kit's source moves (left-bottom anchored) */
export const PopCard: React.FC<{ at: number; x: number; y: number; children: React.ReactNode }> = ({ at, x, y, children }) => {
  const t = useT(at);
  if (t < 0) return null;
  const sp = spring({ frame: Math.round(t * PK_FPS), fps: PK_FPS, config: { damping: 12, stiffness: 170 } });
  return <div style={{ position: "absolute", left: x, top: y, transform: `scale(${0.82 + 0.18 * sp})`, transformOrigin: "left bottom", opacity: Math.min(1, t * 6), filter: "drop-shadow(0 14px 22px rgba(10,18,30,.45))" }}>{children}</div>;
};

/** a source picture FILLS the 1080×1920 frame for a frame range (user 2026-10-23: manuscript full-screen) with a slow push and an optional self-drawing marker; sits in the BASE layers (outside <Gfx>) because it deliberately replaces him for those seconds. Put it right after SheikhLayers, before <Gfx>. */
export const FullImage: React.FC<{ src: string; from: number; to: number; origin?: string; marker?: { x: number; y: number; w: number; h: number; at: number }; box?: { x: number; y: number; w: number; h: number; rot?: number; plain?: boolean } }> = ({ src, from, to, origin = "50% 40%", marker, box }) => {
  const t = useT(0);
  if (t < from || t > to) return null;
  const o = Math.min(1, (t - from) / 0.1 + 0.34, (to - t) / 0.1 + 0.34);
  const k = 1 + 0.12 * clamp((t - from) / (to - from));
  const mp = marker ? clamp((t - marker.at) / 0.5) : 0;
  // `box` (user 2026-11-01: «خلف رأسي لكن صغيرة بحيث تملأ المساحة» above his shoulders): the B-roll shrunk into that region, still behind him (a `behind` window); `plain` = no paper frame
  if (box) return (
    <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, opacity: o, ...(box.plain ? {} : { background: BRAND.card, padding: 10, boxShadow: "0 14px 30px rgba(0,0,0,.45)" }), boxSizing: "border-box", transform: box.rot ? `rotate(${box.rot}deg)` : undefined }}>
      <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
        <div style={{ width: "100%", height: "100%", transform: `scale(${k})`, transformOrigin: origin }}>
          {/\.mp4$/i.test(src)
            ? <Sequence from={Math.round(from * PK_FPS)}>{getRemotionEnvironment().isRendering ? <OffthreadVideo src={staticFile(src)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <SafeVideo src={staticFile(src)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />}</Sequence>
            : <Pic src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        </div>
      </div>
    </div>
  );
  return (
    <AbsoluteFill style={{ opacity: o, background: BRAND.card, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${k})`, transformOrigin: origin }}>
        {/\.mp4$/i.test(src)
          ? <Sequence from={Math.round(from * PK_FPS)}>{getRemotionEnvironment().isRendering ? <OffthreadVideo src={staticFile(src)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <SafeVideo src={staticFile(src)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />}</Sequence>
          : <Pic src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        {marker && mp > 0 ? <div style={{ position: "absolute", left: marker.x, top: marker.y, width: marker.w, height: marker.h, border: `7px solid ${RED}`, borderRadius: 30, clipPath: `inset(0 ${100 - mp * 100}% 0 0)`, boxShadow: `0 0 20px ${alpha(RED, .6)}` }} /> : null}
      </div>
    </AbsoluteFill>
  );
};
