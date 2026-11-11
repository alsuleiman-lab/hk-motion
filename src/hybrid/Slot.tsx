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
type HyProps = { hybrid?: "top" | "bg"; hybridPort?: number; noshadow?: boolean };
const P = getInputProps() as HyProps;
export const HY: "top" | "bg" | undefined = P.hybrid;

/** background colour that disappears in the hybrid "top" layer (so the video below it is visible) */
export const hyBg = <T,>(c: T): T | undefined => (HY === "top" ? undefined : c);

type Rec = { id: string; src: string; t: number; f: number; rate: number; m: number[]; w: number; h: number; r: number; o: number; vx: number; vy: number; vw: number; vh: number; fx: Record<string, number> };
const G: { frame: number; slots: Map<string, Rec>; flushedFrame: number; host: HTMLDivElement | null } = { frame: -1, slots: new Map(), flushedFrame: -2, host: null };

const MEAS = new Map<string, () => void>(); // latest measuring function of every mounted slot
const flush = (frame: number) => {
  try {
    const x = new XMLHttpRequest();
    x.open("POST", `http://127.0.0.1:${P.hybridPort}/g`, false); // synchronous: guaranteed to arrive before the screenshot is taken
    x.setRequestHeader("Content-Type", "text/plain");
    x.send(JSON.stringify({ frame, slots: Array.from(G.slots.values()) }));
    G.flushedFrame = frame;
  } catch (e) {
    console.error("hybrid flush failed", e);
  }
};

/** outermost element of a hybrid-capable composition */
export const HybridHost: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  if (HY === "top" && G.frame !== frame) { G.frame = frame; G.slots = new Map(); }
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
    <AbsoluteFill ref={(el) => { G.host = el; }} style={{ visibility: HY === "bg" ? "hidden" : undefined }}>
      {P.noshadow ? <style>{"*{box-shadow:none !important;text-shadow:none !important}"}</style> : null}
      {children}
    </AbsoluteFill>
  );
};

/** static content that lives below every video (desk paper, gradient...). Rendered once as the background image; hidden in the graphics layer. */
export const HybridBg: React.FC<{ children: React.ReactNode }> = ({ children }) => (HY === "top" ? null : <AbsoluteFill style={{ visibility: "visible" }}>{children}</AbsoluteFill>);

export type SlotFx = { blur?: number; brightness?: number; contrast?: number; saturate?: number };
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
  radius?: number;
  /** where the whole video frame sits inside the box (defaults: fills the box) */
  vx?: number; vy?: number; vw?: number; vh?: number;
  fx?: SlotFx;
  style?: React.CSSProperties;
};

let SEQ = 0;
export const VSlot: React.FC<VSlotProps> = ({ src, studioSrc, startFrom = 0, playbackRate = 1, muted = true, w, h, radius = 0, vx = 0, vy = 0, vw, vh, fx, style }) => {
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
      id: idRef.current, src, t, f, rate: playbackRate,
      m: [(p1.x - p0.x) / w, (p1.y - p0.y) / w, (p2.x - p0.x) / h, (p2.y - p0.y) / h, p0.x, p0.y],
      w, h, r: radius, o, vx, vy, vw: VW, vh: VH, fx: { blur: 0, brightness: 1, contrast: 1, saturate: 1, ...(fx ?? {}) },
    });
    };
    measure();
    MEAS.set(idRef.current, measure);
    if (G.flushedFrame === G.frame) flush(G.frame); // a late commit (after the host flushed): send the corrected set again
    return () => { G.slots.delete(idRef.current); MEAS.delete(idRef.current); };
  });

  const box: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: w, height: h, overflow: "hidden", borderRadius: radius, ...style };
  if (HY === "bg") return null; // the static background image contains no video
  if (HY === "top") {
    const dot = (x: number, y: number) => <div data-probe style={{ position: "absolute", left: x, top: y, width: 0, height: 0 }} />;
    return <div ref={ref} style={{ ...box, overflow: "visible" }}>{dot(0, 0)}{dot(w, 0)}{dot(0, h)}</div>;
  }
  const common = { src: staticFile(env.isStudio && studioSrc ? studioSrc : src), muted, startFrom: Math.round(startFrom), playbackRate, style: { position: "absolute" as const, left: vx, top: vy, width: VW, height: VH, maxWidth: "none" as const, filter: cssFilter(fx) } };
  return <div style={box}>{env.isStudio ? <Video {...common} /> : <OffthreadVideo {...common} />}</div>;
};
