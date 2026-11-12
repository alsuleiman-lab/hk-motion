import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, OffthreadVideo, continueRender, delayRender, Video, getInputProps, getRemotionEnvironment, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * GENERIC GPU HYBRID RENDER (tools/hybrid_any.mjs) — the composition author only does three things:
 *   1. wrap the composition's output in <HybridHost> (outermost element);
 *   2. draw every video with <VSlot> instead of <OffthreadVideo>/<Video>;
 *   3. put the static desk/background (anything that is drawn BELOW the videos and never changes) inside <HybridBg>.
 * In the normal render/Studio everything behaves exactly as before. In the hybrid render ({hybrid:"top"} input prop) the VSlot draws NOTHING:
 * it only reports, every frame, where the video is on screen (affine matrix measured from the real DOM, so rotations/scales/slides/fades
 * of any ancestor are captured automatically) and the GPU compositor puts the decoded video there; Remotion's PNG contains only the graphics.
 * Rule: no opaque background may sit under a VSlot in the "top" layer (use hyBg(color) for such backgrounds).
 */
type HyProps = { hybrid?: "top" | "bg" | "under" | "below"; hybridPort?: number; noshadow?: boolean; hybridLayers?: boolean; hybridLevel?: number };
const P = getInputProps() as HyProps;
export const HY: "top" | "bg" | "under" | "below" | undefined = P.hybrid;
/** (2026-11-12) GPU renderer (tools/gpu_render.mjs) only: graphics drawn BELOW a video are supported (<HyLayer z>, rendered as extra per-frame layers).
 *  hybrid_any does not pass `hybridLayers`, so for it (and for Studio / the normal render) every component keeps its previous behaviour. */
export const HYL = HY !== undefined && !!P.hybridLayers;

/** background colour that disappears in the hybrid "top" layer (so the video below it is visible) */
export const hyBg = <T,>(c: T): T | undefined => (HY === "top" ? undefined : c);

type Rec = { id: string; src: string; t: number; f: number; rate: number; m: number[]; w: number; h: number; r: number | number[]; o: number; vx: number; vy: number; vw: number; vh: number; fx: Record<string, number>; mt?: string; mtT?: number; fl?: number; z?: number; g?: number; fit?: string };
const G: { frame: number; slots: Map<string, Rec>; flushedFrame: number; host: HTMLDivElement | null; under: boolean } = { frame: -1, slots: new Map(), flushedFrame: -2, host: null, under: false };

const MEAS = new Map<string, () => void>(); // latest measuring function of every mounted slot
const flush = (frame: number) => {
  try {
    const x = new XMLHttpRequest();
    x.open("POST", `http://127.0.0.1:${P.hybridPort}/g`, false); // synchronous: guaranteed to arrive before the screenshot is taken
    x.setRequestHeader("Content-Type", "text/plain");
    /* the extra layers this frame needs = the <HyLayer> mounted in the committed DOM (read here, not during render: a memoised subtree that did not
       re-render must still count) */
    const levels = HYL && G.host ? [...new Set(Array.from(G.host.querySelectorAll<HTMLElement>("[data-hylayer]")).map((e) => Number(e.dataset.hylayer)))].sort((a, b) => a - b) : [];
    x.send(JSON.stringify({ frame, slots: Array.from(G.slots.values()), under: G.under, ...(levels.length ? { levels } : {}) }));
    G.flushedFrame = frame;
  } catch (e) {
    console.error("hybrid flush failed", e);
  }
};

/** outermost element of a hybrid-capable composition */
export const HybridHost: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  if (HY === "top" && G.frame !== frame) { G.frame = frame; G.slots = new Map(); G.under = false; }
  useLayoutEffect(() => {
    if (HY !== "top") return;
    flush(frame);
    // layout can still settle after the commit (first frame of a tab, images/fonts): measure once more one animation frame later, before the screenshot is taken
    // On the first frame of every new tab Remotion still holds the composition in its hidden container (top -999999px); measured there,
    // the video went off-screen = black frames at the start of every render range (found 2026-11-11). Wait until the host is on screen.
    const h = delayRender("hybrid-remeasure", { timeoutInMilliseconds: 60000 });
    let tries = 0;
    const settle = () => {
      const y = G.host?.getBoundingClientRect().y ?? 0;
      if (y < -10000 && tries++ < 120) { requestAnimationFrame(settle); return; }
      try { MEAS.forEach((m) => m()); flush(frame); } finally { continueRender(h); }
    };
    requestAnimationFrame(settle);
  });
  return (
    <AbsoluteFill data-hyhost="" ref={(el) => { G.host = el; }} style={{ visibility: HY === "bg" || HY === "under" || HY === "below" ? "hidden" : undefined }}>
      {P.noshadow ? <style>{"*{box-shadow:none !important;text-shadow:none !important}"}</style> : null}
      {children}
    </AbsoluteFill>
  );
};

/** static content that lives below every video (desk paper, gradient...). Rendered once as the background image; hidden in the graphics layer. */
export const HybridBg: React.FC<{ children: React.ReactNode }> = ({ children }) => (HY === "top" || HY === "under" || HY === "below" ? null : <AbsoluteFill style={{ visibility: "visible" }}>{children}</AbsoluteFill>);

/** (2026-11-12, user: «يجب نقل كل شيء إلى طريقتنا الجديدة») graphics that are painted BELOW a <VSlot z={z}> (a paper mount, the window behind a video…).
 *  GPU renderer only (HYL): hidden in the top layer (visibility: layout unchanged) and drawn in the extra layer `z`, which the compositor puts between
 *  the videos of level z-1 and those of level z: background → layer 0 → videos z=0 → layer 1 → videos z=1 → … → under-him → cut-outs → top layer.
 *  Everywhere else (Studio, normal render, hybrid_any): the children, untouched. `display: contents` = no box of its own. */
export const HyLayer: React.FC<{ z?: number; children: React.ReactNode }> = ({ z = 0, children }) => {
  if (!HYL) return <>{children}</>;
  const show = HY === "below" && (P.hybridLevel ?? 0) === z;
  return <div data-hylayer={z} style={{ display: "contents", visibility: show ? "visible" : "hidden" }}>{children}</div>;
};

/** (2026-11-12, user: «نقل العزل كله إلى كرت الشاشة») graphics that lie UNDER his GPU cut-out (a map, a full picture… in an isolation window).
 *  The "top" graphics layer is composited above every video, so these are drawn in a second transparent layer ("under", rendered by hybrid_any --under
 *  only for the frames that need it); the compositor stacks: videos → under layer → masked cut-out → top layer. Outside the hybrid render: drawn normally. */
export const UnderHim: React.FC<{ active: boolean; from?: number; to?: number; children: React.ReactNode }> = ({ active, from = -1e9, to = 1e9, children }) => {
  const { fps } = useVideoConfig(), t = useCurrentFrame() / fps;   // top-level item: absolute time; the layer is asked for only while the item is on (±1 frame)
  if (!active || !HY) return <>{children}</>;
  if (t < from - 1 / fps || t > to + 1 / fps) return HY === "under" ? null : <>{children}</>;
  if (HY === "top") { G.under = true; return null; }
  if (HY === "under") return <AbsoluteFill style={{ visibility: "visible" }}>{children}</AbsoluteFill>;
  return null;
};

export type SlotFx = { blur?: number; brightness?: number; contrast?: number; saturate?: number; /** dark radial veil of a background clip (BgClip dim), drawn by the compositor */ veil?: number; /** soft transparent left edge, px of the box (his video slid aside, 2026-11-12) */ featherL?: number };
const cssFilter = (fx?: SlotFx) => (fx ? [fx.blur ? `blur(${fx.blur}px)` : "", fx.contrast != null ? `contrast(${fx.contrast})` : "", fx.saturate != null ? `saturate(${fx.saturate})` : "", fx.brightness != null ? `brightness(${fx.brightness})` : ""].filter(Boolean).join(" ") || undefined : undefined);
// NOTE: the compositor applies the CSS filter functions in the order  contrast -> saturate -> brightness  (the order used by this project); blur always first.

export type VSlotProps = {
  /** path inside public/ (e.g. "eu/land_cut_v2.mp4") */
  src: string;
  /** Studio plays this lighter file instead (path inside public/) */
  studioSrc?: string;
  /** Remotion's startFrom (frames) and playbackRate, exactly as for <OffthreadVideo> */
  startFrom?: number;
  playbackRate?: number;
  muted?: boolean;
  /** the clipped box (what the viewer sees of the video), in CSS px, positioned by `style` (default: absolute at 0,0) */
  w: number;
  h: number;
  /** corner radius of the clip box; or one per corner [top-left, top-right, bottom-right, bottom-left] (CSS order, 2026-11-12) */
  radius?: number | [number, number, number, number];
  /** where the whole video frame sits inside the box (defaults: fills the box) */
  vx?: number; vy?: number; vw?: number; vh?: number;
  fx?: SlotFx;
  style?: React.CSSProperties;
  /** isolated cut-out on the GPU (2026-11-12): alpha = red channel of this matte video (same frame size as the video), `floor` = fraction of the height from which the original picture is kept whole */
  matte?: { src: string; startFrom: number; floor?: number };
  /** GPU renderer: stacking level (default 0) — the video goes above <HyLayer z={z}> and below <HyLayer z={z + 1}> */
  z?: number;
  /** output px the compositor grows the clip box by (default 1: no seam under a border ring Remotion draws over the edge); 0 = the exact box,
   *  for a window with nothing over its edge (the browser clips exactly there) */
  grow?: number;
  /** (2026-11-12) objectFit of the video's REAL size in the box, centred (vx/vy/vw/vh ignored): the compositor knows the source's dimensions */
  fit?: "cover" | "contain";
};

let SEQ = 0;
export const VSlot: React.FC<VSlotProps> = ({ src, studioSrc, startFrom = 0, playbackRate = 1, muted = true, w, h, radius = 0, vx = 0, vy = 0, vw, vh, fx, style, matte, z = 0, grow, fit }) => {
  const env = getRemotionEnvironment();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ref = useRef<HTMLDivElement>(null);
  const idRef = useRef<string>("");
  if (!idRef.current) idRef.current = "s" + ++SEQ;
  const VW = vw ?? w, VH = vh ?? h;
  const t = startFrom / fps + (frame * playbackRate) / fps;

  useLayoutEffect(() => {
    if (HY !== "top") return;
    const measure = () => {
    const el = ref.current;
    if (!el) return;
    const q = Array.from(el.querySelectorAll<HTMLElement>("[data-probe]")).map((p) => p.getBoundingClientRect());
    const [p0, p1, p2] = q;
    let o = 1;
    for (let e: HTMLElement | null = el; e; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity || "1");
    const f = G.frame;
    G.slots.set(idRef.current, {
      id: idRef.current, src, t, f, rate: playbackRate, ...(matte ? { mt: matte.src, mtT: matte.startFrom / fps + frame / fps, fl: matte.floor ?? 0 } : {}),
      m: [(p1.x - p0.x) / w, (p1.y - p0.y) / w, (p2.x - p0.x) / h, (p2.y - p0.y) / h, p0.x, p0.y],
      w, h, r: radius, o, vx, vy, vw: VW, vh: VH, fx: { blur: 0, brightness: 1, contrast: 1, saturate: 1, ...(fx ?? {}) }, ...(z ? { z } : {}), ...(grow !== undefined ? { g: grow } : {}), ...(fit ? { fit } : {}),
    });
    };
    measure();
    MEAS.set(idRef.current, measure);
    if (G.flushedFrame === G.frame) flush(G.frame); // a late commit (after the host flushed): send the corrected set again
    return () => { G.slots.delete(idRef.current); MEAS.delete(idRef.current); };
  });

  const box: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: w, height: h, overflow: "hidden", borderRadius: Array.isArray(radius) ? radius.map((v) => `${v}px`).join(" ") : radius, ...style };
  if (HY === "bg" || HY === "under" || HY === "below") return null; // the static background image and the extra layers contain no video
  if (HY === "top") {
    const dot = (x: number, y: number) => <div data-probe style={{ position: "absolute", left: x, top: y, width: 0, height: 0 }} />;
    return <div ref={ref} style={{ ...box, overflow: "visible" }}>{dot(0, 0)}{dot(w, 0)}{dot(0, h)}</div>;
  }
  const common = { src: staticFile(env.isStudio && studioSrc ? studioSrc : src), muted, startFrom: Math.round(startFrom), playbackRate, style: { position: "absolute" as const, ...(fit ? { left: 0, top: 0, width: w, height: h, objectFit: fit } : { left: vx, top: vy, width: VW, height: VH }), maxWidth: "none" as const, filter: cssFilter(fx) } };
  return <div style={box}>{env.isStudio ? <Video {...common} /> : <OffthreadVideo {...common} />}</div>;
};
