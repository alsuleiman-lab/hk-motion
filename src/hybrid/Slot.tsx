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

type Rec = { id: string; src: string; t: number; f: number; rate: number; m: number[]; w: number; h: number; r: number | number[]; o: number; vx: number; vy: number; vw: number; vh: number; fx: Record<string, number>; mt?: string; mtT?: number; fl?: number; z?: number; g?: number; fit?: string; fp?: number[]; fz?: number[]; fr?: number[] };
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
/** (2026-11-13) the default level of everything inside: a scene that covers the full-frame video beneath it (a lesson's split scene, an explainer)
 *  is wrapped in <HyLevel z={1}> — its <HyLayer> backgrounds then lie ABOVE the level-0 videos and below its own videos (VSlot / HyVideo, level 1) */
const HyLevelCtx = React.createContext(0);
export const HyLevel: React.FC<{ z: number; children: React.ReactNode }> = ({ z, children }) => <HyLevelCtx.Provider value={z}>{children}</HyLevelCtx.Provider>;

export const HyLayer: React.FC<{ z?: number; children: React.ReactNode }> = ({ z: zProp, children }) => {
  const z = zProp ?? React.useContext(HyLevelCtx);
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

export type SlotFx = { blur?: number; brightness?: number; contrast?: number; saturate?: number; /** dark radial veil of a background clip (BgClip dim), drawn by the compositor */ veil?: number; /** soft transparent left edge, px of the box (his video slid aside, 2026-11-12) */ featherL?: number;
  /** (2026-11-12) the same linear fade on the right / top / bottom edge (CSS mask-image linear-gradient of the box), px of the box */
  featherR?: number; featherT?: number; featherB?: number;
  /** (2026-11-12) CSS drop-shadow(0 shadowY shadowBlur rgba(shR, shG, shB, shadowA)) of what the slot shows (a cut-out: of his outline), drawn by the compositor */
  shadowY?: number; shadowBlur?: number; shadowA?: number; shR?: number; shG?: number; shB?: number };
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
  /** with `fit`: objectPosition as fractions [x, y] (default centred) */
  fitPos?: [number, number];
  /** with `fit`: then a zoom [z, ox, oy] about the box point (ox, oy) — CSS scale(z) with transform-origin there; the picture stays clipped to the box */
  fitZoom?: [number, number, number];
};

let SEQ = 0;
export const VSlot: React.FC<VSlotProps> = ({ src, studioSrc, startFrom = 0, playbackRate = 1, muted = true, w, h, radius = 0, vx = 0, vy = 0, vw, vh, fx, style, matte, z: zProp, grow, fit, fitPos, fitZoom }) => {
  const z = zProp ?? React.useContext(HyLevelCtx);
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
      w, h, r: radius, o, vx, vy, vw: VW, vh: VH, fx: { blur: 0, brightness: 1, contrast: 1, saturate: 1, ...(fx ?? {}) }, ...(z ? { z } : {}), ...(grow !== undefined ? { g: grow } : {}), ...(fit ? { fit, ...(fitPos ? { fp: fitPos } : {}), ...(fitZoom ? { fz: fitZoom } : {}) } : {}),
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
  const common = { src: staticFile(env.isStudio && studioSrc ? studioSrc : src), muted, startFrom: Math.round(startFrom), playbackRate, style: { position: "absolute" as const, ...(fit ? { left: 0, top: 0, width: w, height: h, objectFit: fit, ...(fitPos ? { objectPosition: `${fitPos[0] * 100}% ${fitPos[1] * 100}%` } : {}), ...(fitZoom ? { transform: `scale(${fitZoom[0]})`, transformOrigin: `${fitZoom[1]}px ${fitZoom[2]}px` } : {}) } : { left: vx, top: vy, width: VW, height: VH }), maxWidth: "none" as const, filter: cssFilter(fx) } };
  return <div style={box}>{env.isStudio ? <Video {...common} /> : <OffthreadVideo {...common} />}</div>;
};

/** (2026-11-13, user: «أصلح كل شيء حتى الكرتون وغيره») drop-in replacement of <OffthreadVideo> for OLDER code (archived kits, labs): the SAME props.
 *  In the hybrid / GPU render's graphics layer it draws nothing and reports the video from the page itself, so no position has to be rewritten by hand:
 *  - the picture = this element's own box (its style: left/top/width/height, % sizes, transforms of its ancestors) with its objectFit/objectPosition;
 *  - the clip = the nearest ancestor that clips (overflow other than visible; its padding box and its corner radius), or the picture's own box;
 *  - opacity = the product of its ancestors'.  Limit: no rotation BETWEEN the clipping ancestor and the video (the common case).
 *  Anywhere else (Studio, a normal render): <OffthreadVideo {...props} />, exactly as before. The composition must be wrapped in <HybridHost>. */
export const HyVideo: React.FC<React.ComponentProps<typeof OffthreadVideo>> = (p) => {
  const lvl = React.useContext(HyLevelCtx);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ref = useRef<HTMLDivElement>(null);
  const idRef = useRef<string>("");
  if (!idRef.current) idRef.current = "h" + ++SEQ;
  const startFrom = Number(p.startFrom ?? 0), rate = Number(p.playbackRate ?? 1);
  const rel = (() => { try { return decodeURIComponent(String(p.src)).replace(/^.*?\/public\//, "").replace(/[?#].*$/, ""); } catch { return String(p.src); } })();
  const st = (p.style ?? {}) as React.CSSProperties;
  useLayoutEffect(() => {
    if (HY !== "top") return;
    const measure = () => {
      const el = ref.current;
      if (!el) return;
      const w0 = el.offsetWidth, h0 = el.offsetHeight;
      if (!w0 || !h0) { G.slots.delete(idRef.current); return; }
      const [p0, p1, p2] = Array.from(el.querySelectorAll<HTMLElement>(":scope > [data-probe]")).map((q) => q.getBoundingClientRect());
      const M = [(p1.x - p0.x) / w0, (p1.y - p0.y) / w0, (p2.x - p0.x) / h0, (p2.y - p0.y) / h0];
      const det = M[0] * M[3] - M[1] * M[2];
      if (Math.abs(det) < 1e-9) return;
      const toLocal = (X: number, Y: number) => { const dx = X - p0.x, dy = Y - p0.y; return [(M[3] * dx - M[2] * dy) / det, (-M[1] * dx + M[0] * dy) / det]; };
      /* EVERY clipping ancestor up to the composition host (2026-11-13: a crop box inside a narrower bordered card — the nearest one alone let the
         video spill over the card's border): the clip = the intersection of their padding boxes; corner radius and border ring from the box that
         makes most of the final edges (inner radius = outer radius − border) */
      const boxes: { b: number[]; r: number; ring: boolean }[] = [];
      const s = Math.sqrt(Math.abs(det));
      for (let e = el.parentElement; e && !e.hasAttribute("data-hyhost"); e = e.parentElement) {
        const cs = getComputedStyle(e);
        if (cs.overflowX === "visible" && cs.overflowY === "visible") continue;
        const bb = e.getBoundingClientRect();
        const bl = parseFloat(cs.borderLeftWidth) * s, bt = parseFloat(cs.borderTopWidth) * s, br = parseFloat(cs.borderRightWidth) * s, bo = parseFloat(cs.borderBottomWidth) * s;
        const a = toLocal(bb.left + bl, bb.top + bt), c = toLocal(bb.right - br, bb.bottom - bo);
        boxes.push({ b: [Math.min(a[0], c[0]), Math.min(a[1], c[1]), Math.max(a[0], c[0]), Math.max(a[1], c[1])],
          r: Math.max(0, (parseFloat(cs.borderTopLeftRadius) || 0) - (parseFloat(cs.borderTopWidth) || 0)), ring: bl + bt + br + bo > 0 });
      }
      const clip = boxes.length > 0;
      let cx0 = 0, cy0 = 0, cx1 = w0, cy1 = h0, r = 0, ring = false;
      if (clip) {
        cx0 = Math.max(...boxes.map((q) => q.b[0])); cy0 = Math.max(...boxes.map((q) => q.b[1]));
        cx1 = Math.min(...boxes.map((q) => q.b[2])); cy1 = Math.min(...boxes.map((q) => q.b[3]));
        let best = boxes[0], score = -1;
        for (const q of boxes) { const k = [Math.abs(q.b[0] - cx0), Math.abs(q.b[1] - cy0), Math.abs(q.b[2] - cx1), Math.abs(q.b[3] - cy1)].filter((d) => d < 1).length; if (k > score) { score = k; best = q; } }
        r = best.r; ring = best.ring;   /* a border drawn over the clip edge: the 1 px growth hides under it; else the exact edge */
      }
      /* the browser paints the <img> snapped to whole pixels relative to its clipping box (2026-11-13: ½ px edges before): the clip box stays where it
         is (m below, from the true cx0/cy0), the picture's offset inside it is rounded */
      const offX = clip ? Math.round(-cx0) : -cx0, offY = clip ? Math.round(-cy0) : -cy0;
      const w = cx1 - cx0, h = cy1 - cy0;
      if (w <= 0 || h <= 0) { G.slots.delete(idRef.current); return; }
      let o = 1;
      for (let e: HTMLElement | null = el; e; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity || "1");
      const fitMode = String(st.objectFit ?? "fill");
      const pos = String(st.objectPosition ?? "50% 50%").split(/\s+/).map((v) => (v.endsWith("%") ? parseFloat(v) / 100 : 0.5));
      G.slots.set(idRef.current, {
        id: idRef.current, src: rel, t: startFrom / fps + (frame * rate) / fps, f: G.frame, rate,
        m: [M[0], M[1], M[2], M[3], p0.x + M[0] * cx0 + M[2] * cy0, p0.y + M[1] * cx0 + M[3] * cy0],
        w, h, r, o, vx: offX, vy: offY, vw: w0, vh: h0, fx: { blur: 0, brightness: 1, contrast: 1, saturate: 1 }, ...(lvl ? { z: lvl } : {}), g: ring ? 1 : 0,
        ...(fitMode === "cover" || fitMode === "contain" ? { fit: fitMode, fp: [pos[0] ?? 0.5, pos[1] ?? pos[0] ?? 0.5], fr: [offX, offY, w0, h0] } : {}),
      });
    };
    measure();
    MEAS.set(idRef.current, measure);
    if (G.flushedFrame === G.frame) flush(G.frame);
    return () => { G.slots.delete(idRef.current); MEAS.delete(idRef.current); };
  });
  if (HY === "bg" || HY === "under" || HY === "below") return null;
  if (HY === "top") {
    /* the element as the browser would lay out the <img> (same style), invisible, with three probes at its corners for the affine of its box */
    const { objectFit: _f, objectPosition: _p, filter: _x, ...layout } = st;
    const dot = (x: string, y: string) => <div data-probe style={{ position: "absolute", left: x, top: y, width: 0, height: 0 }} />;
    return <div ref={ref} style={{ position: "relative", ...layout, visibility: "hidden" }}>{dot("0", "0")}{dot("100%", "0")}{dot("0", "100%")}</div>;
  }
  return <OffthreadVideo {...p} />;
};
