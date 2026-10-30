import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * PaperTear — the cover's paper tear (user 2026-10-28: «استعمل هذا لتمزيق الورق», motionstash.io/c/paper-tear-wipe).
 * Adapted from Motionstash «Paper Tear Wipe» (MIT licence, Speakwise GmbH; source: https://www.motionstash.io/registry.json, item paper-tear-wipe):
 * the demo stage (scrapbook page, craft table) and the library's contract/timing/token modules are dropped; what is torn is `sheet`
 * (the whole cover), and what lies under it is whatever is drawn below this layer (his recording).
 * Frames before `from` = the whole sheet (thumbnail, no seam); a ragged fibrous rip runs across it, one half lifts towards the camera over a growing
 * shadow and swings away, the other slides away flat; from `to` on nothing is drawn.
 */
type V = { x: number; y: number };
type Dir = "horizontal" | "vertical" | "diagonal";
const INK = "#2c2418", INK_MUTED = "#6b5d48";
const travel = Easing.bezier(0.45, 0, 0.2, 1);

const alpha = (c: string, a: number) => { const n = Number.parseInt(c.replace("#", ""), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
const fx = (v: number) => v.toFixed(1);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const polyline = (pts: V[]) => pts.map((p, i) => `${i ? "L" : "M"}${fx(p.x)} ${fx(p.y)}`).join(" ");

/** the torn edge as a seeded polyline: a slow wander (three sines), a medium wobble along the grain and fine fibre teeth; `n` points into the half that lifts */
const buildTear = (w: number, h: number, direction: Dir, roughness: number) => {
  const m = Math.min(w, h);
  const theta = direction === "horizontal" ? (-3 * Math.PI) / 180 : direction === "vertical" ? (-86 * Math.PI) / 180 : -Math.atan2(h, w) * 0.8;
  const u = { x: Math.cos(theta), y: Math.sin(theta) };
  const n = { x: u.y, y: -u.x };
  const C = { x: w * 0.5, y: h * 0.5 };
  const Lvis = Math.min(Math.abs(u.x) > 1e-6 ? w / 2 / Math.abs(u.x) : Infinity, Math.abs(u.y) > 1e-6 ? h / 2 / Math.abs(u.y) : Infinity);
  const L = Lvis + m * 0.3; // past the frame on both ends, so a rotating half never shows the end of its own edge
  const N = Math.ceil((2 * L) / (m * 0.012));
  const seg = (2 * L) / N;
  const R = roughness, Rj = 0.15 + 0.85 * R;
  const phase = [0, 1, 2].map((k) => random(`ptw-phase-${k}`) * Math.PI * 2);
  const raw = Array.from({ length: N + 3 }, (_, i) => random(`ptw-jag-${i}`) * 2 - 1);
  const t: number[] = [], base: V[] = [], rimRaw: number[] = [], rimS: number[] = [];
  for (let i = 0; i <= N; i += 1) {
    const ti = -L + seg * i, s = i / N;
    const wander = m * (0.5 + 0.5 * R) * (0.022 * Math.sin(Math.PI * 2 * 1.3 * s + phase[0]) + 0.011 * Math.sin(Math.PI * 2 * 3.1 * s + phase[1]) + 0.006 * Math.sin(Math.PI * 2 * 6.7 * s + phase[2]));
    const off = wander + m * Rj * (0.016 * ((raw[i] + raw[i + 1] + raw[i + 2]) / 3) + 0.005 * raw[i + 1]);
    t.push(ti);
    base.push({ x: C.x + u.x * ti + n.x * off, y: C.y + u.y * ti + n.y * off });
    rimRaw.push((0.55 + 0.9 * random(`ptw-rim-${i}`)) * (random(`ptw-flap-${i}`) > 0.9 ? 1.7 : 1)); // the white paper core shows unevenly
    rimS.push(m * 0.0045 * (0.6 + 0.8 * random(`ptw-rims-${i}`)));
  }
  const rimL = rimRaw.map((v, i) => ((rimRaw[Math.max(0, i - 1)] + 2 * v + rimRaw[Math.min(rimRaw.length - 1, i + 1)]) / 4) * m * 0.013 * (0.7 + 0.6 * R));
  const chordN = Math.min(Math.abs(n.x) > 1e-6 ? w / Math.abs(n.x) : Infinity, Math.abs(n.y) > 1e-6 ? h / Math.abs(n.y) : Infinity);
  const halfExtentN = (w * Math.abs(n.x) + h * Math.abs(n.y)) / 2;
  return { C, u, n, Lvis, t, base, rimL, rimS, seg, chordN, halfExtentN };
};

/** how far a half has travelled (0 at the end of the rip, 1 off screen): a near-linear pull to the peak gap `a`, then a cubic out */
const pull = (x: number, a: number, xP: number) => {
  if (x <= 0) return 0;
  if (x <= xP) return a * Math.pow(x / xP, 1.25);
  const c = Math.min(1.4, Math.max(0, (1.25 * a * (1 - xP)) / (xP * (1 - a))));
  const y = (x - xP) / (1 - xP);
  return a + (1 - a) * (c * y + (1 - c) * y * y * y);
};

type Rigid = { tx: number; ty: number; a: number; s: number; Q: V };
const applyRigid = (p: V, r: Rigid): V => {
  const dx = (p.x - r.Q.x) * r.s, dy = (p.y - r.Q.y) * r.s, a = (r.a * Math.PI) / 180;
  return { x: r.Q.x + dx * Math.cos(a) - dy * Math.sin(a) + r.tx, y: r.Q.y + dx * Math.sin(a) + dy * Math.cos(a) + r.ty };
};
const rigidStyle = (r: Rigid, ex = 0, ey = 0): React.CSSProperties => ({
  transform: `translate(${fx(r.tx + ex)}px, ${fx(r.ty + ey)}px) rotate(${r.a.toFixed(3)}deg) scale(${r.s.toFixed(4)})`,
  transformOrigin: `${fx(r.Q.x)}px ${fx(r.Q.y)}px`,
});

export const PaperTear: React.FC<{ sheet: React.ReactNode; from?: number; to?: number; peak?: number; direction?: Dir; roughness?: number }> = ({ sheet, from = 3, to = 35, peak = 0.4, direction = "diagonal", roughness = 0.6 }) => {
  const { width: w, height: h } = useVideoConfig();
  const uid = `ptw${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const f = useCurrentFrame() - from, T = to - from;
  if (f >= T) return null;
  if (f < 0) return <AbsoluteFill style={{ pointerEvents: "none" }}>{sheet}</AbsoluteFill>;

  const m = Math.min(w, h), diag = Math.hypot(w, h);
  const P = Math.round(peak * T);
  const ripStart = Math.max(0, P - 16), ripEnd = Math.max(ripStart + 4, P - 7), flyEnd = T - 4;
  const tear = buildTear(w, h, direction, roughness);
  const { u, n, Lvis, t: tt, base, rimL, rimS, seg } = tear;
  const N = base.length - 1;

  // the rip front runs the visible length of the line
  const rip = interpolate(f, [ripStart, ripEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: travel });
  const front = (-1.02 + 2.04 * rip) * Lvis;
  const torn = f >= ripStart;
  const gMax = m * 0.03, overlap = Math.max(1, m * 0.0015);
  const gap = tt.map((ti) => (torn ? gMax * Math.pow(clamp01((front - ti) / Lvis), 0.7) : 0));
  const rev = tt.map((ti) => (torn ? clamp01((front - ti) / (m * 0.05)) : 0));
  let k = -1;
  for (let i = 0; i <= N; i += 1) if (rev[i] > 0) k = i;
  // the lifting half draws back further; the lying half keeps a hairline under it so the untorn stretch shows no seam
  const EL = base.map((p, i) => ({ x: p.x + n.x * gap[i] * 0.62, y: p.y + n.y * gap[i] * 0.62 }));
  const ES = base.map((p, i) => { const d = overlap - gap[i] * 0.38; return { x: p.x + n.x * d, y: p.y + n.y * d }; });

  // rigid pull-apart after the rip reached the far edge
  const x = clamp01((f - ripEnd) / Math.max(1, flyEnd - ripEnd));
  const xP = Math.max(0.05, Math.min(0.6, (P - ripEnd) / Math.max(1, flyEnd - ripEnd)));
  const D = tear.halfExtentN + m * 0.16 + diag * 0.07;
  const gL = pull(x, Math.min(0.9, (0.21 * tear.chordN) / D), xP);
  const gS = pull(x, Math.min(0.9, (0.13 * tear.chordN) / D), xP);
  const Q = { x: tear.C.x + u.x * Lvis, y: tear.C.y + u.y * Lvis };
  const trL: Rigid = { tx: n.x * D * gL, ty: n.y * D * gL, a: 10 * Math.pow(gL, 0.9), s: 1 + 0.07 * Math.pow(gL, 0.6), Q };
  const trS: Rigid = { tx: -n.x * D * gS, ty: -n.y * D * gS, a: -4 * gS, s: 1, Q };

  // shadow: tight and dark at the surface, wide, soft and faint as it lifts
  const lift = clamp01(0.14 * rip + 0.86 * Math.pow(gL, 0.55));
  const sigma = m * (0.003 + 0.028 * lift), sOff = m * (0.003 + 0.05 * lift), sOpacity = 0.5 - 0.22 * lift;
  const light = { x: 0.482, y: 0.876 };

  const BIG = diag * 1.5;
  const far = (p: V, sgn: number) => ({ x: p.x + n.x * BIG * sgn, y: p.y + n.y * BIG * sgn });
  const clipL = `${polyline(EL)} L${fx(far(EL[N], 1).x)} ${fx(far(EL[N], 1).y)} L${fx(far(EL[0], 1).x)} ${fx(far(EL[0], 1).y)} Z`;
  const clipS = `${polyline(ES)} L${fx(far(ES[N], -1).x)} ${fx(far(ES[N], -1).y)} L${fx(far(ES[0], -1).x)} ${fx(far(ES[0], -1).y)} Z`;
  const innerL = EL.map((p, i) => ({ x: p.x + n.x * rimL[i] * rev[i], y: p.y + n.y * rimL[i] * rev[i] }));
  const innerS = ES.map((p, i) => ({ x: p.x - n.x * rimS[i] * rev[i], y: p.y - n.y * rimS[i] * rev[i] }));
  const rimPathL = `${polyline(EL)} ${polyline([...innerL].reverse()).replace(/^M/, "L")} Z`;
  const rimPathS = `${polyline(ES)} ${polyline([...innerS].reverse()).replace(/^M/, "L")} Z`;
  const tornL = EL.slice(0, k + 1);
  const innerLine = k >= 1 ? polyline(innerL.slice(0, k + 1)) : "";
  const aoLine = k >= 1 ? polyline(ES.slice(0, k + 1).map((p) => ({ x: p.x + n.x * m * 0.0025, y: p.y + n.y * m * 0.0025 }))) : "";
  const band = m * 0.35;
  const shadowBand = k >= 1 ? `${polyline(tornL)} ${polyline([...tornL].reverse().map((p) => ({ x: p.x + n.x * band, y: p.y + n.y * band }))).replace(/^M/, "L")} Z` : "";

  // loose fibres standing off each torn edge
  const fringe = (edge: V[], dirSign: number, prob: number, scale: number, key: string) => {
    const out: string[] = [];
    for (let i = 0; i <= k; i += 1) {
      if (rev[i] <= 0 || random(`ptw-${key}-p-${i}`) > prob) continue;
      const len = m * (0.004 + 0.011 * random(`ptw-${key}-l-${i}`)) * (0.6 + 0.8 * roughness) * scale * rev[i];
      const ang = (random(`ptw-${key}-a-${i}`) - 0.5) * 1.2, bx = n.x * dirSign, by = n.y * dirSign;
      const dx = bx * Math.cos(ang) - by * Math.sin(ang), dy = bx * Math.sin(ang) + by * Math.cos(ang);
      const slide = (random(`ptw-${key}-s-${i}`) - 0.5) * seg, sx = edge[i].x + u.x * slide, sy = edge[i].y + u.y * slide;
      const curl = (random(`ptw-${key}-c-${i}`) - 0.5) * len * 0.6;
      out.push(`M${fx(sx)} ${fx(sy)} Q${fx(sx + dx * len * 0.5 - dy * curl)} ${fx(sy + dy * len * 0.5 + dx * curl)} ${fx(sx + dx * len)} ${fx(sy + dy * len)}`);
    }
    return out.join(" ");
  };
  const fringeL = fringe(EL, -1, 0.35 + 0.4 * roughness, 1, "fl");
  const fringeS = fringe(ES, 1, 0.15 + 0.25 * roughness, 0.6, "fs");

  // fibres still holding the two halves together, until they snap
  const bridges: { d: string; o: number }[] = [];
  for (let i = 0; i <= k; i += 3) {
    if (rev[i] < 0.5 || random(`ptw-br-${i}`) > 0.6) continue;
    const j = Math.max(0, Math.min(N, i + Math.round(random(`ptw-brj-${i}`) * 2 - 1)));
    const A = applyRigid(ES[i], trS), B = applyRigid(EL[j], trL);
    const len = Math.hypot(B.x - A.x, B.y - A.y), snap = m * (0.012 + 0.05 * random(`ptw-brs-${i}`));
    if (len >= snap || len < 0.5) continue;
    const sag = (random(`ptw-brc-${i}`) - 0.5) * len * 0.5;
    bridges.push({ d: `M${fx(A.x)} ${fx(A.y)} Q${fx((A.x + B.x) / 2 + u.x * sag)} ${fx((A.y + B.y) / 2 + u.y * sag)} ${fx(B.x)} ${fx(B.y)}`, o: 1 - Math.pow(len / snap, 4) });
  }

  const fibre = Math.max(1, m * 0.0012);
  const svgStyle: React.CSSProperties = { position: "absolute", inset: 0, overflow: "visible" };
  if (!torn) return <AbsoluteFill style={{ pointerEvents: "none" }}>{sheet}</AbsoluteFill>;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      {/* the lying half slides away flat */}
      <AbsoluteFill style={rigidStyle(trS)}>
        <AbsoluteFill style={{ clipPath: `path("${clipS}")` }}>{sheet}</AbsoluteFill>
        <svg width={w} height={h} style={svgStyle}>
          {aoLine ? <path d={aoLine} fill="none" stroke={alpha(INK, 0.16)} strokeWidth={m * 0.003} strokeLinejoin="round" /> : null}
          <path d={rimPathS} fill="#ffffff" opacity={0.92} />
          {fringeS ? <path d={fringeS} fill="none" stroke="#ffffff" strokeWidth={fibre} strokeLinecap="round" opacity={0.85} /> : null}
        </svg>
      </AbsoluteFill>
      {bridges.length ? (
        <svg width={w} height={h} style={svgStyle}>
          {bridges.map((b, i) => <path key={i} d={b.d} fill="none" stroke="#ffffff" strokeWidth={fibre} strokeLinecap="round" opacity={b.o} />)}
        </svg>
      ) : null}
      {/* the shadow under the lifting half, falling into the gap */}
      {shadowBand ? (
        <AbsoluteFill style={rigidStyle(trL, light.x * sOff, light.y * sOff)}>
          <svg width={w} height={h} style={svgStyle}>
            <defs><filter id={`${uid}-shadow`} filterUnits="userSpaceOnUse" x={-w} y={-h} width={w * 3} height={h * 3}><feGaussianBlur stdDeviation={sigma.toFixed(2)} /></filter></defs>
            <path d={shadowBand} fill={INK} opacity={sOpacity} filter={`url(#${uid}-shadow)`} />
          </svg>
        </AbsoluteFill>
      ) : null}
      {/* the lifting half rises towards the lens and swings open */}
      <AbsoluteFill style={rigidStyle(trL)}>
        <AbsoluteFill style={{ clipPath: `path("${clipL}")` }}>{sheet}</AbsoluteFill>
        <svg width={w} height={h} style={svgStyle}>
          <path d={rimPathL} fill="#ffffff" opacity={0.97} />
          {innerLine ? <path d={innerLine} fill="none" stroke={alpha(INK_MUTED, 0.32)} strokeWidth={Math.max(1, m * 0.0013)} strokeLinejoin="round" /> : null}
          {fringeL ? <path d={fringeL} fill="none" stroke="#ffffff" strokeWidth={fibre} strokeLinecap="round" opacity={0.92} /> : null}
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
