/**
 * TWO SPOKEN-ORDER EFFECTS BEHIND HIM (episode «GTA 6», user 2026-11-20), drawn as `scenefx` kinds (src/SceneFx.tsx) in the UNDER layer: over his original
 * video, under his isolated cut-out (a `behind` window with its matte on the same span). Every frame is a pure function of the time; every size comes from
 * useVideoConfig() (landscape 1920×1080 and portrait 1080×1920).
 *
 *   badge  «نعزل الخلفية… دائرة فيها زائد 18… الدائرة راح تكون خلفي… بعدين أنا أختفي شوي شوي… لما أقول زائد ثمنطعش»:
 *          an age-rating disc (white face, thick red ring, «+18») fades in beside his head from `at` (0.6 s), half behind his shoulder. Over `moveAt`
 *          [start, end] — the span in which HE fades out (the `vanish` of his `behind` window, src/MontageSpec.tsx) — the disc slides to the middle and grows,
 *          and the clean `plate` of the room (tools/clean_plate.py: the room without him) is laid under him from `plateAt` (hidden behind his cut-out until
 *          he fades), so only the room and the disc are left. At the item's end (Only's last 0.3 s) the plate and disc dissolve back into his video.
 *   crowd  «عملوه على 172 طالب… فقسمهم قسمين: قسم يلعب جي تي اي… قسم يلعب لعبة بعيدة عن العنف… أكثر ميلاً للعنف»: `n` (172) schematic male student
 *          figures pop in across the room behind him at `at` (a counter «172 طالب» ticks up), part into two groups at `splitAt` — the GTA group warm red
 *          on `hotSide`, the other calm blue — each group's label at its `labelAt` (never before it is spoken), and the GTA group flares red at each of
 *          `pulses`. If `splitAt` ≤ `from` the item opens already split (a second, later item for the results).
 */
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (x: number) => { const u = clamp(x); return u * u * (3 - 2 * u); };
const outCubic = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const outBack = (x: number) => { const u = clamp(x), c = 1.7; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
const rnd = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };   /* deterministic noise: no state between frames */
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const mix = (c1: number[], c2: number[], k: number) => `rgb(${c1.map((v, i) => Math.round(lerp(v, c2[i], k))).join(",")})`;

export type BehindFxFields = {
  /** badge: the disc's text (default "+18") */ text?: string;
  /** badge: clean plate of the room without him (path in public/, tools/clean_plate.py) and when it is laid under him (default moveAt[0] − 0.5) */ plate?: string; plateAt?: number;
  /** badge: [start, end] of his fade-out (same numbers as his window's `vanish`): the disc slides to the middle and grows */ moveAt?: [number, number];
  /** badge: the disc before the move, [x, y, radius] in frame px (defaults: landscape [1450, 360, 280], portrait [860, 380, 190]) */ pos?: [number, number, number]; portPos?: [number, number, number];
  /** portrait: the camera centre of his crop (spec.cams cx, default 990) — where the plate is drawn, like his video */ camX?: number;
  /** crowd: number of students (172), the moment they part, the group labels [GTA group, other group] and when each is spoken, the GTA group's side */
  n?: number; splitAt?: number; labels?: [string, string]; labelAt?: [number, number]; hotSide?: "left" | "right";
  /** crowd: the counter «172 طالب» while they appear (default on) */ count?: boolean;
};
type It = BehindFxFields & { from: number; to: number; at?: number; pulses?: number[] };

const useStage = () => { const { width: W, height: H, fps } = useVideoConfig(); return { W, H, fps, port: H > W, sx: W / (H > W ? 1080 : 1920), sy: H / (H > W ? 1920 : 1080) }; };

/* ── badge ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
const RatingDisc: React.FC<{ r: number; text: string; glow: number }> = ({ r, text, glow }) => {
  const ring = r * 0.17, fs = r * (text.length > 3 ? 0.62 : 0.8);
  return (
    <svg width={r * 2.6} height={r * 2.6} viewBox={`${-r * 1.3} ${-r * 1.3} ${r * 2.6} ${r * 2.6}`} style={{ position: "absolute", left: -r * 1.3, top: -r * 1.3, overflow: "visible" }}>
      <defs>
        <radialGradient id="bdFace" cx="42%" cy="36%" r="75%"><stop offset="0%" stopColor="#ffffff" /><stop offset="70%" stopColor="#f4efe4" /><stop offset="100%" stopColor="#ddd4c2" /></radialGradient>
        <linearGradient id="bdRing" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef3340" /><stop offset="55%" stopColor="#c8102e" /><stop offset="100%" stopColor="#8e0b20" /></linearGradient>
        <filter id="bdShadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={r * 0.07} /></filter>
        <filter id="bdGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={r * 0.12} /></filter>
      </defs>
      {/* the shadow it casts on the wall, and a faint red light around the ring */}
      <circle cx={r * 0.05} cy={r * 0.09} r={r * 1.02} fill="rgba(10,6,4,.55)" filter="url(#bdShadow)" />
      <circle r={r * 1.04} fill="none" stroke="rgba(255,40,50,.9)" strokeWidth={ring * 1.1} opacity={0.25 + 0.35 * glow} filter="url(#bdGlow)" />
      <circle r={r - ring / 2} fill="url(#bdFace)" />
      <circle r={r - ring / 2} fill="none" stroke="url(#bdRing)" strokeWidth={ring} />
      <circle r={r - ring - r * 0.025} fill="none" stroke="rgba(120,10,20,.35)" strokeWidth={r * 0.012} />
      <circle r={r + r * 0.004} fill="none" stroke="rgba(255,255,255,.55)" strokeWidth={r * 0.012} />
      <text x={0} y={fs * 0.35} textAnchor="middle" fontFamily={'"Arial Black", "Noto Kufi Arabic", sans-serif'} fontWeight={900} fontSize={fs} fill="#141414" letterSpacing={-fs * 0.04} style={{ direction: "ltr" }}>{text}</text>
    </svg>
  );
};

/** the room without him, laid exactly where his video is (landscape: the whole frame; portrait: the camera crop of SheikhLayers / MaskedSheikh) */
const Plate: React.FC<{ src: string; camX: number; opacity: number }> = ({ src, camX, opacity }) => {
  const { W, H, port } = useStage();
  const K = H / 1080;
  return port
    ? <Img src={staticFile(src)} style={{ position: "absolute", left: -(camX - 304) * K, top: 0, width: 1920 * K, height: H, maxWidth: "none", opacity }} />
    : <Img src={staticFile(src)} style={{ position: "absolute", left: 0, top: 0, width: W, height: H, opacity }} />;
};

export const Badge: React.FC<{ it: It }> = ({ it }) => {
  const { W, H, fps, port, sx, sy } = useStage();
  const t = useCurrentFrame() / fps, at = it.at ?? it.from;
  const [m0, m1] = it.moveAt ?? [it.to + 1, it.to + 2];
  const p0 = port ? it.portPos ?? [860, 380, 190] : it.pos ?? [1450, 360, 280];
  const p1 = port ? [540, 820, 430] : [960, 540, 410];   /* big and central: it covers the middle of the plate, where the room was never seen (a soft guess) */
  const k = smooth((t - m0) / Math.max(0.1, m1 - m0));
  const x = lerp(p0[0], p1[0], k) * sx, y = lerp(p0[1], p1[1], k) * sy, r = lerp(p0[2], p1[2], k) * Math.min(sx, sy);
  const inK = outCubic((t - at) / 0.6), sc = 0.86 + 0.14 * inK;
  const glow = 0.5 + 0.5 * Math.sin((t - at) * 2.2) + 0.6 * k;   /* the ring breathes slowly; it burns brighter as he goes */
  const plateAt = it.plateAt ?? m0 - 0.5;
  return (
    <AbsoluteFill>
      {it.plate && t >= plateAt ? <Plate src={it.plate} camX={it.camX ?? 990} opacity={clamp((t - plateAt) / 0.3)} /> : null}
      {/* a soft dark veil around the disc once he has gone: the eye stays on it */}
      <AbsoluteFill style={{ background: `radial-gradient(circle at ${x}px ${y}px, rgba(0,0,0,0) ${r * 1.1}px, rgba(0,0,0,.42) ${Math.max(W, H) * 0.7}px)`, opacity: k }} />
      {/* and the lower room sinks into shadow: under his body the plate is only a soft guess (tools/clean_plate.py), not to be looked at */}
      {it.plate ? <AbsoluteFill style={{ background: `linear-gradient(to top, rgba(6,4,3,.82) 0%, rgba(6,4,3,.55) ${port ? 30 : 22}%, rgba(6,4,3,0) ${port ? 62 : 55}%)`, opacity: k }} /> : null}
      <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, opacity: inK, transform: `scale(${sc}) rotate(${(1 - inK) * -8}deg)` }}>
        <RatingDisc r={r} text={it.text ?? "+18"} glow={clamp(glow / 1.6)} />
      </div>
    </AbsoluteFill>
  );
};

/* ── crowd ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
type Box = [number, number, number, number];   /* x, y, w, h in frame px */
/** n cells filling a box, rows from the top, the last row centred; cell aspect ≈ 0.8 (a bust is taller than wide) */
const grid = (n: number, [bx, by, bw, bh]: Box) => {
  let cols = Math.max(1, Math.round(Math.sqrt((n * bw * 1.25) / bh)));
  let rows = Math.ceil(n / cols);
  while (rows * (bw / cols) * 1.25 > bh * 1.08 && cols < n) { cols++; rows = Math.ceil(n / cols); }
  const cw = bw / cols, ch = Math.min(bh / rows, cw * 1.35);
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols), c = i % cols, inRow = r === rows - 1 ? n - r * cols : cols;
    pts.push([bx + (c + 0.5 + (cols - inRow) / 2) * cw, by + (r + 0.5) * ch]);
  }
  return { pts, size: Math.min(cw / 0.82, ch) * 0.9 };
};
/* a schematic male student: head, neck line, broad shoulders (a bust, like a pictogram); unit height 1, origin at the centre */
const BUST = "M0,-0.5 m-0.17,0 a0.17,0.17 0 1,0 0.34,0 a0.17,0.17 0 1,0 -0.34,0 Z M-0.36,0.5 L-0.36,0.12 C-0.36,-0.08 -0.22,-0.2 -0.1,-0.22 L0,-0.14 L0.1,-0.22 C0.22,-0.2 0.36,-0.08 0.36,0.12 L0.36,0.5 Z";
const NEUTRAL = [236, 226, 206], HOT = [222, 66, 52], HOT2 = [255, 52, 40], CALM = [86, 168, 196];

export const Crowd: React.FC<{ it: It }> = ({ it }) => {
  const { W, H, fps, port, sx, sy } = useStage();
  const t = useCurrentFrame() / fps, at = Math.max(it.at ?? it.from, it.from - 5), n = it.n ?? 172, splitAt = it.splitAt ?? it.to + 99;
  const hotRight = (it.hotSide ?? "right") === "right";
  /* design boxes (landscape 1920×1080 / portrait 1080×1920): the whole crowd in a band behind him, then one block each side of him */
  const L = React.useMemo(() => {
    const S = (b: Box): Box => [b[0] * sx, b[1] * sy, b[2] * sx, b[3] * sy];
    const all = S(port ? [20, 120, 1040, 380] : [40, 150, 1840, 300]);
    const left = S(port ? [16, 110, 300, 660] : [40, 150, 480, 500]), right = S(port ? [764, 110, 300, 660] : [1420, 150, 460, 500]);
    const g0 = grid(n, all), half = Math.floor(n / 2);
    /* who goes where: the figures of the left half of the band go left (order kept: row, then x → no crossing paths) */
    const order = g0.pts.map((p, i) => ({ i, p })).sort((a, b) => a.p[0] - b.p[0]);
    const leftIds = new Set(order.slice(0, n - half).map((o) => o.i));
    const gl = grid(n - half, left), gr = grid(half, right);
    const byRow = (ids: number[]) => ids.sort((a, b) => (Math.round(g0.pts[a][1]) - Math.round(g0.pts[b][1])) || (g0.pts[a][0] - g0.pts[b][0]));
    const lIds = byRow([...leftIds]), rIds = byRow(g0.pts.map((_, i) => i).filter((i) => !leftIds.has(i)));
    const target: { p: [number, number]; side: "left" | "right" }[] = [];
    lIds.forEach((id, k) => { target[id] = { p: gl.pts[k], side: "left" }; });
    rIds.forEach((id, k) => { target[id] = { p: gr.pts[k], side: "right" }; });
    return { g0, gl, gr, target, left, right };
  }, [n, port, sx, sy]);
  const cx = W / 2;
  const sizeEnd = Math.min(L.gl.size, L.gr.size), size0 = L.g0.size;
  const veil = clamp((t - it.from) / 0.5);
  const pulses = it.pulses ?? [];
  const pulseK = pulses.reduce((m, p0) => { const u = (t - p0) / 1.3; return u <= 0 || u >= 1 ? m : Math.max(m, Math.pow(1 - u, 1.6) * clamp(u / 0.08)); }, 0);
  const agitated = pulses.some((p0) => t >= p0) ? 1 : 0;
  const hotBox = hotRight ? L.right : L.left, calmBox = hotRight ? L.left : L.right;
  const [la, lb] = it.labelAt ?? [splitAt + 2, splitAt + 4], [ta, tb] = it.labels ?? ["GTA", "لعبة غير عنيفة"];
  const lblIn = (s: number) => clamp((t - Math.max(s, it.from)) / 0.35);
  const label = (box: Box, text: string, k: number, hot: boolean, key: string) => k <= 0 ? null : (
    /* landscape: centred over its group; portrait (narrow blocks at the frame's edges): held to the group's outer edge so a long label never leaves the frame */
    <div key={key} style={{ position: "absolute", left: !port ? box[0] + box[2] / 2 : box[0] + box[2] / 2 < W / 2 ? box[0] : box[0] + box[2], top: box[1] - (port ? 18 : 22) * sy,
      transform: `translate(${!port ? "-50%" : box[0] + box[2] / 2 < W / 2 ? "0%" : "-100%"}, -100%) translateY(${(1 - k) * 14}px) scale(${hot ? 1 + 0.08 * pulseK : 1})`, transformOrigin: "50% 100%", opacity: k,
      padding: `${(port ? 8 : 9) * sy}px ${22 * sx}px`, borderRadius: 999, background: hot ? `linear-gradient(180deg,#e2463a,#a51d18)` : `linear-gradient(180deg,#4a9fbb,#2a6c82)`, color: "#fff",
      fontFamily: hot && /^[\x20-\x7e]+$/.test(text) ? '"Arial Black", "Noto Kufi Arabic", sans-serif' : '"Noto Kufi Arabic", sans-serif', fontWeight: 800, fontSize: 42 * Math.min(sx, sy), whiteSpace: "nowrap",
      boxShadow: hot ? `0 0 ${18 + 40 * pulseK}px rgba(255,60,40,${0.35 + 0.5 * pulseK}), 0 6px 18px rgba(0,0,0,.45)` : "0 6px 18px rgba(0,0,0,.45)", direction: "rtl" }}>{text}</div>
  );
  const shown = Math.round(n * clamp((t - at) / 0.9));
  const countK = it.count === false ? 0 : Math.min(clamp((t - at) / 0.3), 1 - clamp((t - splitAt) / 0.4));
  return (
    <AbsoluteFill>
      {/* the room dims so the figures read; he stays as filmed (his cut-out is above this layer) */}
      {/* it thins out toward the bottom: the desk strip (matte floor, y ≥ 990 of 1080) is always his own video, so a dark veil there would leave a seam */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(8,6,5,.38) 0%, rgba(8,6,5,.66) 75%)", opacity: veil, WebkitMaskImage: "linear-gradient(to bottom, #000 62%, transparent 90%)", maskImage: "linear-gradient(to bottom, #000 62%, transparent 90%)" }} />
      {/* the GTA group flares: a red heat behind it at each pulse */}
      {pulseK > 0 ? <div style={{ position: "absolute", left: hotBox[0] - hotBox[2] * 0.25, top: hotBox[1] - hotBox[3] * 0.25, width: hotBox[2] * 1.5, height: hotBox[3] * 1.5, background: "radial-gradient(closest-side, rgba(255,50,30,.75), rgba(255,40,20,0))", opacity: pulseK }} /> : null}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs><path id="bust" d={BUST} /></defs>
        {L.g0.pts.map((p0, i) => {
          const tg = L.target[i], hot = (tg.side === "right") === hotRight;
          /* a fresh crowd sweeps in from behind him outward; one that opens already split (a later item) is simply back within 0.3 s */
          const appearAt = splitAt <= at ? at + rnd(i) * 0.12 : at + 0.75 * Math.abs(p0[0] - cx) / (W / 2) + rnd(i) * 0.12;
          const a = outBack((t - appearAt) / 0.35); if (a <= 0.001) return null;
          const k = smooth((t - splitAt - rnd(i + 7) * 0.35) / 0.95);
          const x = lerp(p0[0], tg.p[0], k), y = lerp(p0[1], tg.p[1], k) - Math.sin(Math.PI * k) * 26 * sy;
          const s = lerp(size0, sizeEnd, k) * a;
          const jit = hot ? (agitated * 1.6 + 5 * pulseK) * Math.sin(t * 31 + i * 1.7) : 0;
          const col = !hot ? mix(NEUTRAL, CALM, k) : pulseK > 0 ? mix(HOT, HOT2, pulseK) : mix(NEUTRAL, HOT, k);
          const bump = hot ? 1 + 0.14 * pulseK * (0.6 + 0.4 * rnd(i + 3)) : 1;
          return <use key={i} href="#bust" fill={col} opacity={clamp(a)} transform={`translate(${x + jit} ${y}) scale(${s * bump})`} />;
        })}
      </svg>
      {label(hotBox, ta, lblIn(la), true, "lh")}
      {label(calmBox, tb, lblIn(lb), false, "lc")}
      {countK > 0 ? <div style={{ position: "absolute", left: W / 2, top: (port ? 40 : 18) * sy, transform: "translateX(-50%)", opacity: countK, color: "#f4ecdc", fontFamily: '"Noto Kufi Arabic", sans-serif', fontWeight: 800,
        fontSize: (port ? 58 : 50) * Math.min(sx, sy), textShadow: "0 3px 14px rgba(0,0,0,.8)", direction: "rtl", whiteSpace: "nowrap" }}><span style={{ fontFamily: '"Arial Black", sans-serif' }}>{shown}</span> طالب</div> : null}
    </AbsoluteFill>
  );
};

/** his cut-out (a `behind` window) fades out over `vanish` [start, end] and stays out until the window ends (src/MontageSpec.tsx). The opacity of this
 *  wrapper reaches the GPU compositor through VSlot (the product of its ancestors' opacity), so the hybrid render and the Studio agree. No `vanish`: the
 *  children untouched. Inside the window's <Sequence>: `from` = the window's start (absolute time). */
export const VanishFade: React.FC<{ from: number; vanish?: [number, number]; children: React.ReactNode }> = ({ from, vanish, children }) => {
  const { fps } = useVideoConfig(), t = from + useCurrentFrame() / fps;
  if (!vanish) return <>{children}</>;
  const o = 1 - smooth((t - vanish[0]) / Math.max(0.05, vanish[1] - vanish[0]));
  return <AbsoluteFill style={{ opacity: o }}>{o <= 0.001 ? null : children}</AbsoluteFill>;
};
