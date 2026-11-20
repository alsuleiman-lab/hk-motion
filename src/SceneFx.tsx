/**
 * SCENE EFFECTS BEHIND HIM (user 2026-11-20: «طبقة الفيديو الأصلية، ثم طبقة الخلفية اللي راح تحط عليها مؤثر، ثم الطبقة اللي فيها صورتي. فهون راح يظهر فقط
 * التأثير ولن يضر بشكل الفيديو العام… هذه مسألة أنت تعملها بتفكير إيش في فكرة إبداعية تناسب هذه العبارة»).
 * A `scenefx` item lives in the UNDER layer (MontageSpec UNDER_TYPES): over his original video, under his isolated cut-out (a `behind` window with its matte on
 * the same span), so the room changes and he stays exactly as filmed. Every effect is a pure function of the frame (renders match the preview).
 *   crack  the wall behind him cracks from a point at `crackAt` (lines grow), then at `fallAt` the cracked pieces of the wall (cut from `still`, a frame of the
 *          room) break off and fall, leaving a dark void — a claim that crumbles. Pieces come only from the wall beside him (x < avoid[0] or x > avoid[1]).
 *   beam   the room sinks into darkness from `at`, and a shaft of light falls on him at `beamAt` (dust in it) — a moment of truth, a text of revelation.
 *   bars   iron bars drop from the top behind him at `at` and stay — prison, captivity.
 */
import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";

const W = 1920, H = 1080, FPS = 30;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const outCubic = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const inCubic = (x: number) => Math.pow(clamp(x), 3);
const rnd = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };   /* deterministic noise: never a state between frames */

export type SceneFxItem = { t: "scenefx"; fx: "crack" | "beam" | "bars"; from: number; to: number; at?: number; crackAt?: number; fallAt?: number; beamAt?: number; still?: string; avoid?: [number, number]; seed?: number; side?: "left" | "right" | "both" };

/* ── crack: the wall beside him is broken into irregular pieces; the CRACKS are the pieces' own edges, opening outward from a point (so the wall later breaks
   exactly where it cracked), and at `fallAt` the pieces drop, leaving a dark hollow. Every edge is a zigzag shared by its two pieces. */
type P2 = [number, number];
const zig = (p: P2, q: P2, seed: number): P2[] => {   /* the same jagged line for both pieces that share the edge (seed from its two ends, order-free) */
  const h = Math.round(p[0] + q[0]) * 7 + Math.round(p[1] + q[1]) * 13 + seed, dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  const pts: P2[] = [];
  for (let k = 1; k < 4; k++) { const f = k / 4, o = (rnd(h + k) - 0.5) * Math.min(38, L * 0.18) * (p[0] + p[1] < q[0] + q[1] ? 1 : -1); pts.push([p[0] + dx * f + nx * o, p[1] + dy * f + ny * o]); }
  return pts;
};
const pieces = (x0: number, x1: number, seed: number) => {
  const out: { pts: P2[]; cx: number; cy: number; d: number }[] = [], cols = 4, rows = 6, cw = (x1 - x0) / cols, rh = H / rows;
  const J = (i: number, j: number): P2 => [x0 + i * cw + (i > 0 && i < cols ? (rnd(seed + i * 31 + j) - 0.5) * cw * 0.7 : 0), j * rh + (j > 0 && j < rows ? (rnd(seed + j * 17 + i) - 0.5) * rh * 0.7 : 0)];
  const edge = (a: P2, b: P2): P2[] => { const fwd = a[0] + a[1] <= b[0] + b[1], z = fwd ? zig(a, b, seed) : zig(b, a, seed).reverse(); return [a, ...z]; };
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const c = [J(i, j), J(i + 1, j), J(i + 1, j + 1), J(i, j + 1)], pts = [...edge(c[0], c[1]), ...edge(c[1], c[2]), ...edge(c[2], c[3]), ...edge(c[3], c[0])];
    const cx = c.reduce((s, p) => s + p[0], 0) / 4, cy = c.reduce((s, p) => s + p[1], 0) / 4;
    out.push({ pts, cx, cy, d: rnd(seed + i * 7 + j * 13) * 0.5 + (1 - j / rows) * 0.3 });
  }
  return out;
};
const Crack: React.FC<{ it: SceneFxItem }> = ({ it }) => {
  const t = useCurrentFrame() / FPS, seed = it.seed ?? 7, [a0, a1] = it.avoid ?? [560, 1420];
  const crackAt = it.crackAt ?? it.from, fallAt = it.fallAt ?? crackAt + 2.5, side = it.side ?? "both";
  const sides = (side === "both" ? ["left", "right"] : [side]) as ("left" | "right")[];
  /* no piece from where his body is in the still (his shoulders and arms spread below y ≈ 560): a frozen sleeve must never fall */
  const chunks = React.useMemo(() => sides.flatMap((s) => pieces(s === "left" ? 0 : a1, s === "left" ? a0 : W, seed + (s === "left" ? 0 : 50))).filter((c) => !(c.cy > 520 && c.cx > a0 - 220 && c.cx < a1 + 220)), [a0, a1, seed, side]);
  /* the crack lines = the edges of the pieces, each opening at its distance from the impact point of its side (about 0.9 s to spread) */
  const origins: Record<string, P2> = { left: [a0 * 0.5, 380], right: [a1 + (W - a1) * 0.5, 340] };
  const cracks = React.useMemo(() => chunks.flatMap((c) => c.pts.map((p, k) => { const q = c.pts[(k + 1) % c.pts.length], o = c.cx < W / 2 ? origins.left : origins.right, m: P2 = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    const onFrame = (p[0] <= 1 && q[0] <= 1) || (p[0] >= W - 1 && q[0] >= W - 1) || (p[1] <= 1 && q[1] <= 1) || (p[1] >= H - 1 && q[1] >= H - 1);
    return onFrame ? null : { p, q, t0: Math.hypot(m[0] - o[0], m[1] - o[1]) / 620 }; }).filter(Boolean) as { p: P2; q: P2; t0: number }[]), [chunks]);
  const fall = (d: number) => { const u = t - fallAt - d; return u <= 0 ? 0 : u; };
  const fadeOut = 1 - clamp((t - (it.to - 0.6)) / 0.6);
  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      {/* the void the pieces leave: a dark, slightly textured hollow */}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="cvoid" cx="50%" cy="45%" r="70%"><stop offset="0%" stopColor="#1a1714" /><stop offset="100%" stopColor="#050505" /></radialGradient>
          {it.still ? <pattern id="cstill" patternUnits="userSpaceOnUse" width={W} height={H}><image href={staticFile(it.still)} width={W} height={H} /></pattern> : null}
        </defs>
        {t >= fallAt ? chunks.map((c, i) => fall(c.d) > 0 ? <polygon key={"v" + i} points={c.pts.map((p) => p.join(",")).join(" ")} fill="url(#cvoid)" /> : null) : null}
        {/* falling pieces of the wall (the room's own picture), each spinning a little as it drops */}
        {it.still && t >= fallAt ? chunks.map((c, i) => {
          const u = fall(c.d); if (u <= 0) return null;
          const dy = 0.5 * 2600 * u * u, rot = (rnd(i + 3) - 0.5) * 70 * u, dx = (rnd(i + 9) - 0.5) * 140 * u, op = 1 - clamp((dy - 700) / 500);
          return <g key={"p" + i} transform={`translate(${dx} ${dy}) rotate(${rot} ${c.cx} ${c.cy})`} opacity={op}><polygon points={c.pts.map((p) => p.join(",")).join(" ")} fill="url(#cstill)" stroke="#2a221b" strokeWidth={2} /></g>;
        }) : null}
        {/* the cracks: each segment drawn at its time, dark core with a light lip (depth) */}
        {cracks.map((s, i) => {
          /* the cracked zone around the impact grows to ≈420 px and holds (a web around a blow, not a net over the wall); in the last 1.2 s before the
             fall it races across the whole wall — the tension before the collapse */
          const R = t < fallAt - 1.2 ? Math.min(420, 120 + 160 * (t - crackAt)) : 420 + ((t - (fallAt - 1.2)) / 1.2) * 1400;
          if (s.t0 * 620 > R) return null;
          const g = clamp((t - crackAt - s.t0) / 0.12); if (g <= 0 || t >= fallAt + 0.15) return null;
          const x2 = s.p[0] + (s.q[0] - s.p[0]) * g, y2 = s.p[1] + (s.q[1] - s.p[1]) * g, w = 4.5 - Math.min(2.5, s.t0 * 2.2);
          return <g key={"c" + i}><line x1={s.p[0] + 2} y1={s.p[1] + 2} x2={x2 + 2} y2={y2 + 2} stroke="rgba(255,244,228,.42)" strokeWidth={w * 0.7} strokeLinecap="round" /><line x1={s.p[0]} y1={s.p[1]} x2={x2} y2={y2} stroke="#0d0906" strokeWidth={w} strokeLinecap="round" /></g>;
        })}
      </svg>
      {/* dust as the pieces break off */}
      {t >= fallAt && t < fallAt + 2.2 ? Array.from({ length: 60 }, (_, i) => { const u = t - fallAt, x = (rnd(i) < 0.5 ? rnd(i + 1) * a0 : a1 + rnd(i + 2) * (W - a1)), y = rnd(i + 4) * H + u * 160 * (0.5 + rnd(i + 5)); return <div key={"d" + i} style={{ position: "absolute", left: x, top: y, width: 4 + rnd(i + 6) * 6, height: 4 + rnd(i + 6) * 6, borderRadius: 9, background: "rgba(200,180,150,.5)", opacity: (1 - u / 2.2) * 0.8, filter: "blur(1px)" }} />; }) : null}
    </AbsoluteFill>
  );
};

/* ── beam: darkness falls on the room, then a shaft of light on him */
const Beam: React.FC<{ it: SceneFxItem }> = ({ it }) => {
  const t = useCurrentFrame() / FPS, at = it.at ?? it.from, beamAt = it.beamAt ?? at + 1.2;
  const dark = outCubic((t - at) / 1.2) * (1 - clamp((t - (it.to - 0.8)) / 0.8)), beam = outCubic((t - beamAt) / 0.9) * (1 - clamp((t - (it.to - 0.8)) / 0.8));
  const sway = Math.sin(t * 0.7) * 8;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "#040405", opacity: 0.78 * dark }} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: beam, mixBlendMode: "screen" }}>
        <defs>
          <linearGradient id="bm" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(255,236,190,.85)" /><stop offset="70%" stopColor="rgba(255,226,170,.28)" /><stop offset="100%" stopColor="rgba(255,220,160,0)" /></linearGradient>
          <filter id="bmb"><feGaussianBlur stdDeviation="22" /></filter>
        </defs>
        <polygon points={`${1180 + sway},-40 ${1420 + sway},-40 ${1300},${H} ${640},${H}`} fill="url(#bm)" filter="url(#bmb)" />
        <ellipse cx={980} cy={H - 40} rx={520} ry={70} fill="rgba(255,230,180,.25)" filter="url(#bmb)" />
      </svg>
      {Array.from({ length: 70 }, (_, i) => { const p = rnd(i), y = ((rnd(i + 1) * H + (t - beamAt) * (14 + rnd(i + 2) * 22)) % H), x = 1300 + (640 - 1300) * (y / H) + (p - 0.5) * (240 + 380 * (y / H)) + Math.sin(t + i) * 10; return <div key={i} style={{ position: "absolute", left: x, top: y, width: 3 + rnd(i + 3) * 3, height: 3 + rnd(i + 3) * 3, borderRadius: 6, background: "rgba(255,240,205,.9)", opacity: beam * (0.25 + 0.5 * rnd(i + 4)) * (0.6 + 0.4 * Math.sin(t * 2 + i)), filter: "blur(.6px)" }} />; })}
    </AbsoluteFill>
  );
};

/* ── bars: iron bars drop from the top and lock */
const Bars: React.FC<{ it: SceneFxItem }> = ({ it }) => {
  const t = useCurrentFrame() / FPS, at = it.at ?? it.from;
  const drop = outCubic((t - at) / 0.45), lift = inCubic((t - (it.to - 0.5)) / 0.5), y = -H * (1 - drop) - H * lift;
  const jolt = t > at + 0.45 && t < at + 0.62 ? Math.sin((t - at - 0.45) * 60) * 6 * (1 - (t - at - 0.45) / 0.17) : 0;
  const n = 11, gap = W / n;
  return (
    <AbsoluteFill style={{ transform: `translateY(${y + jolt}px)` }}>
      <AbsoluteFill style={{ background: "rgba(0,0,0,.28)" }} />
      {Array.from({ length: n }, (_, i) => <div key={i} style={{ position: "absolute", left: gap * (i + 0.5) - 13, top: 0, width: 26, height: H, background: "linear-gradient(90deg,#1b1b1d 0%,#5d5f63 30%,#b7b9bd 45%,#4a4b4f 62%,#151517 100%)", boxShadow: "14px 0 26px rgba(0,0,0,.55)" }} />)}
      {[0.12, 0.86].map((r, i) => <div key={"h" + i} style={{ position: "absolute", left: 0, right: 0, top: H * r - 16, height: 32, background: "linear-gradient(180deg,#1b1b1d 0%,#6a6c70 35%,#c4c6ca 50%,#4a4b4f 70%,#151517 100%)", boxShadow: "0 14px 26px rgba(0,0,0,.55)" }} />)}
    </AbsoluteFill>
  );
};

export const SceneFx: React.FC<{ it: SceneFxItem }> = ({ it }) => it.fx === "crack" ? <Crack it={it} /> : it.fx === "beam" ? <Beam it={it} /> : <Bars it={it} />;
