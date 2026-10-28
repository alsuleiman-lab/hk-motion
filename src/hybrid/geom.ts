import { Easing, interpolate, spring } from "remotion";
import { cut } from "../tirTime";
import { shortToV3 } from "../tirShort";
import { BEHIND, BROLL, CROP, PAD, QUOTES, SCENES, SPK, SPLITS, SWITCH_AT, VARIANTS, ZOOMS } from "../tirData";

/**
 * GEOMETRY of every video layer of the lesson edit, frame by frame, for the GPU hybrid renderer (tools/hybrid_render.mjs + tools/hybrid_compose.py).
 * It mirrors the CSS maths of the React components (SplitScene, ExplainerScene, Board, ZoomGroup) — keep them in sync; tools/hybrid_check.mjs compares
 * the hybrid output with a normal Remotion still to catch any drift.
 * Coordinates are OUTPUT pixels (1920x1080 landscape). A "layer" is a rounded rectangle with a border; the video fills its inner box.
 */
const fps = 30;
const sec = (t: number) => Math.round(t * fps);
const W = 1920, H = 1080;

export type Shadow = { dx: number; dy: number; blur: number; rgba: [number, number, number, number] };
export type Layer = {
  id: string;
  src: string; // "main" = tir_cut_v3 at frame f; "brollN" = the N-th B-roll clip
  sf: number; // frame index inside that source
  cx: number; cy: number; // centre of the OUTER box after the transform
  rot: number; scl: number; // radians, uniform scale
  wo: number; ho: number; bw: number; ro: number; // outer size, border width, outer radius
  mode: "fill" | "cover";
  mapScale: number; srcX: number; srcY: number; // fill: content px -> source px
  opacity: number;
  shadow: Shadow | null;
};
export type FrameSpec = {
  f: number;
  srcF: number; // frame of tir_cut_v3 shown (= f in the full lesson, different in the 3-minute essence)
  // base: source pos = ((p' + off) / scale) with p' = zoomed output position; 'win' windows are already output-sized (scale 1, off 0)
  base: { src: "main" | "win"; winFrame: number; z: number; ox: number; oy: number; scale: number; offX: number; offY: number };
  scene: null | { kind: "split" | "expl"; bg: "L" | "Pexp" | "Psplit"; starsX: number; starsY: number };
  layers: Layer[];
};

const rot2 = (x: number, y: number, a: number) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];

/** 10% punch-in (ZoomGroup) */
const zoomAt = (t: number) => {
  let z = 1;
  for (const [a, b] of ZOOMS) z = Math.max(z, interpolate(t, [a, a + 0.4, b - 0.4, b], [1, 1.1, 1.1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) }));
  return z;
};

const cardShadow: Shadow = { dx: 0, dy: 18, blur: 48, rgba: [20, 12, 4, 0.6] };

/** SplitScene (landscape). `fl` = frame inside the scene. */
const splitLayers = (fl: number, startFrame: number, durFrames: number, type: "clip" | "book" | "browser", hasNotes: boolean): Layer[] => {
  const Hh = H - PAD * 2;
  const sk = Hh / SPK.h;
  const spkW = SPK.w * sk;
  const zoneW = W - spkW - PAD * 3;
  const c = CROP[type];
  const y0 = hasNotes ? 204 : PAD;
  const availH = H - y0 - PAD;
  const pk = Math.min(zoneW / c.w, availH / c.h);
  const pW = c.w * pk, pH = c.h * pk;
  const sw = SWITCH_AT(durFrames);
  let k = 0;
  while (k + 1 < sw.length && fl >= sw[k + 1]) k++;
  const seed = Math.round(startFrame / 30) % VARIANTS.length;
  const cur = VARIANTS[(seed + k) % VARIANTS.length];
  const prev = VARIANTS[(seed + k + VARIANTS.length - 1) % VARIANTS.length];
  const m = k === 0 ? 1 : spring({ frame: fl - sw[k], fps: 30, config: { damping: 14, stiffness: 90 } });
  const vs = prev.s + (cur.s - prev.s) * m, vdy0 = prev.dy + (cur.dy - prev.dy) * m, vr = prev.r + (cur.r - prev.r) * m;
  const lim = Math.max(0, (availH - pH * vs) / 2 - 10), vdy = Math.max(-lim, Math.min(lim, vdy0));
  const bw = 7;
  const left = PAD + (zoneW - pW) / 2, top = y0 + (availH - pH) / 2;
  const wo = pW + bw * 2, ho = pH + bw * 2;
  const rad = (vr * Math.PI) / 180;
  const panel: Layer = {
    id: "panel", src: "main", sf: startFrame + fl, cx: left + wo / 2, cy: top + ho / 2 + vdy, rot: rad, scl: vs, wo, ho, bw, ro: 26,
    mode: "fill", mapScale: pk, srcX: c.x, srcY: c.y, opacity: 1, shadow: cardShadow,
  };
  const cwo = spkW + bw * 2, cho = Hh + bw * 2; // card: content spkW x Hh
  const card: Layer = {
    id: "card", src: "main", sf: startFrame + fl, cx: W - PAD - cwo / 2, cy: PAD + cho / 2, rot: 0, scl: 1, wo: cwo, ho: cho, bw, ro: 30,
    mode: "fill", mapScale: sk, srcX: SPK.x, srcY: SPK.y, opacity: 1, shadow: cardShadow,
  };
  return [panel, card];
};

/** ExplainerScene (landscape): only the speaker card is video (the written side is graphics). */
const SPKX = { x: 550, y: 0, w: 760, h: 1080 };
const explainerLayers = (fl: number, startFrame: number): Layer[] => {
  const Hh = H - PAD * 2;
  const sk = Hh / SPKX.h;
  const spkW = SPKX.w * sk;
  const bw = 7;
  const wo = spkW, ho = Hh; // explicit width/height + border-box (Remotion's global CSS)
  return [{
    id: "xcard", src: "main", sf: startFrame + fl, cx: W - PAD - wo / 2, cy: PAD + ho / 2, rot: 0, scl: 1, wo, ho, bw, ro: 30,
    mode: "fill", mapScale: sk, srcX: SPKX.x, srcY: SPKX.y, opacity: 1, shadow: cardShadow,
  }];
};

/** Board (hanging wooden B-roll board): parent box 640x360 at (60,70), transform-origin top centre. */
const boardLayer = (fl: number, dur: number, idx: number, clipW: number, clipH: number): Layer => {
  const inP = spring({ frame: fl, fps, config: { damping: 15, stiffness: 120 } });
  const out = interpolate(fl, [dur - 10, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  const swing = Math.sin(fl / 9) * 1.6 * (1 - out);
  const opacity = Math.min(1, inP * 1.6) * (1 - out);
  const ty = (1 - inP) * -90, rotDeg = -2 + swing, s = 0.9 + 0.1 * inP;
  const ox = 60 + 320, oy = 70; // origin in screen coords
  const bw = 14;
  const ccx = 60 + 320, ccy = 70 + 180; // inner div is 100% x 100% of the 640x360 parent with border-box sizing: outer 640x360, video box 612x332
  const [dx, dy] = rot2((ccx - ox) * s, (ccy - oy) * s, (rotDeg * Math.PI) / 180);
  const cw = 640 - 2 * bw, ch = 360 - 2 * bw;
  const cover = Math.max(cw / clipW, ch / clipH);
  return {
    id: "board" + idx, src: "broll" + idx, sf: fl, cx: ox + dx, cy: oy + ty + dy, rot: (rotDeg * Math.PI) / 180, scl: s, wo: 640, ho: 360, bw, ro: 14,
    mode: "cover", mapScale: cover, srcX: (clipW - cw / cover) / 2, srcY: (clipH - ch / cover) / 2, opacity,
    shadow: { dx: 0, dy: 22, blur: 50, rgba: [40, 25, 10, 0.55] },
  };
};

export type ClipDims = { w: number; h: number }[];
export const frameSpec = (f: number, clips: ClipDims): FrameSpec => {
  const t = f / fps;
  // base: speaker alone, or a "behind the body" window (pre-composed), both under the 10% zoom
  let base: FrameSpec["base"] = { src: "main", winFrame: 0, z: zoomAt(t), ox: 0.48 * W, oy: 0.34 * H, scale: 1, offX: 0, offY: 0 };
  for (const k of BEHIND) {
    const a = sec(k.t), d = sec(k.len);
    if (f >= a && f < a + d) base = { ...base, src: "win", winFrame: sec(k.offset) + (f - a), scale: 1, offX: 0, offY: 0 };
  }
  let scene: FrameSpec["scene"] = null;
  const layers: Layer[] = [];
  for (const sp of SPLITS) {
    const a = sec(sp.from), d = sec(sp.to - sp.from);
    if (f >= a && f < a + d) {
      const fl = f - a;
      const notes = sp.type === "clip" ? QUOTES.map(([qa]) => sec(cut(qa) - sp.from)).filter((n) => n >= 0 && n < d) : [];
      scene = { kind: "split", bg: "L", starsX: fl * 0.25, starsY: fl * 0.15 };
      layers.push(...splitLayers(fl, a, d, sp.type, notes.length > 0));
    }
  }
  for (const sc of SCENES) {
    const a = sec(cut(sc.a)), d = sec(cut(sc.b)) - a;
    if (f >= a && f < a + d) {
      const fl = f - a;
      scene = { kind: "expl", bg: "L", starsX: fl * 0.25, starsY: fl * 0.15 };
      layers.push(...explainerLayers(fl, a));
    }
  }
  BROLL.forEach((b, i) => {
    const a = sec(b.t), d = sec(2.0);
    if (f >= a && f < a + d) layers.push(boardLayer(f - a, d, i, clips[i].w, clips[i].h));
  });
  return { f, srcF: f, base, scene, layers };
};

// ======================= PORTRAIT (1080x1920) =======================
const PW = 1080, PH = 1920;
const K = 1920 / 1080; // full-bleed scale
const HEADX = 925;
const zoomAtP = zoomAt;

const splitLayersP = (fl: number, startFrame: number, durFrames: number, type: "clip" | "book" | "browser", hasNotes: boolean): Layer[] => {
  const c = CROP[type];
  const y0 = hasNotes ? 204 : 60;
  const areaH = type === "clip" ? 640 : 900;
  const pk = Math.min(1032 / c.w, areaH / c.h);
  const pW = c.w * pk, pH = c.h * pk;
  const sw = SWITCH_AT(durFrames);
  let k = 0;
  while (k + 1 < sw.length && fl >= sw[k + 1]) k++;
  const seed = Math.round(startFrame / 30) % VARIANTS.length;
  const cur = VARIANTS[(seed + k) % VARIANTS.length];
  const prev = VARIANTS[(seed + k + VARIANTS.length - 1) % VARIANTS.length];
  const m = k === 0 ? 1 : spring({ frame: fl - sw[k], fps: 30, config: { damping: 14, stiffness: 90 } });
  const vs = Math.min(1, prev.s + (cur.s - prev.s) * m);
  const vr = (prev.r + (cur.r - prev.r) * m) * 0.8;
  const cardTop = y0 + areaH + 24;
  const cardH = 1880 - cardTop;
  const sk = 1032 / SPK.w;
  const bw = 7;
  const left = 24 + (1032 - pW) / 2, top = y0 + (areaH - pH) / 2;
  const wo = pW + bw * 2, ho = pH + bw * 2;
  const panel: Layer = {
    id: "panel", src: "main", sf: startFrame + fl, cx: left + wo / 2, cy: top + ho / 2, rot: (vr * Math.PI) / 180, scl: vs, wo, ho, bw, ro: 26,
    mode: "fill", mapScale: pk, srcX: c.x, srcY: c.y, opacity: 1, shadow: cardShadow,
  };
  const card: Layer = {
    id: "card", src: "main", sf: startFrame + fl, cx: 24 + 1032 / 2, cy: cardTop + cardH / 2, rot: 0, scl: 1, wo: 1032, ho: cardH, bw, ro: 30,
    mode: "fill", mapScale: sk, srcX: SPK.x, srcY: SPK.y, opacity: 1, shadow: cardShadow, // explicit width/height + border-box
  };
  return [panel, card];
};

const explainerLayersP = (fl: number, startFrame: number): Layer[] => {
  const k = 1032 / SPKX.w;
  return [{
    id: "xcard", src: "main", sf: startFrame + fl, cx: 24 + 1032 / 2, cy: 1040 + 830 / 2, rot: 0, scl: 1, wo: 1032, ho: 830, bw: 7, ro: 30,
    mode: "fill", mapScale: k, srcX: SPKX.x, srcY: 6 / k, opacity: 1, shadow: cardShadow,
  }];
};

/** landscape board layer re-placed by the portrait wrapper: out = (L - 60 s, T - 70 s) + s * p (transform-origin top left of a 1920x1080 box) */
const boardLayerP = (fl: number, dur: number, idx: number, clipW: number, clipH: number, L: number, T: number, s: number): Layer => {
  const b = boardLayer(fl, dur, idx, clipW, clipH);
  const x0 = L - 60 * s, y0 = T - 70 * s;
  return { ...b, cx: x0 + s * b.cx, cy: y0 + s * b.cy, scl: b.scl * s };
};

export const frameSpecP = (f: number, clips: ClipDims): FrameSpec => {
  const t = f / fps;
  let base: FrameSpec["base"] = { src: "main", winFrame: 0, z: zoomAtP(t), ox: 0.5 * PW, oy: 0.28 * PH, scale: K, offX: HEADX * K - 540, offY: 0 };
  for (const k of BEHIND) {
    const a = sec(k.t), d = sec(k.len);
    if (f >= a && f < a + d) base = { ...base, src: "win", winFrame: sec(k.offset) + (f - a), scale: 1, offX: 0, offY: 0 };
  }
  let scene: FrameSpec["scene"] = null;
  const layers: Layer[] = [];
  for (const sp of SPLITS) {
    const a = sec(sp.from), d = sec(sp.to - sp.from);
    if (f >= a && f < a + d) {
      const fl = f - a;
      const notes = sp.type === "clip" ? QUOTES.map(([qa]) => sec(cut(qa) - sp.from)).filter((n) => n >= 0 && n < d) : [];
      scene = { kind: "split", bg: "Psplit", starsX: fl * 0.25, starsY: fl * 0.15 };
      layers.push(...splitLayersP(fl, a, d, sp.type, notes.length > 0));
    }
  }
  for (const sc of SCENES) {
    const a = sec(cut(sc.a)), d = sec(cut(sc.b)) - a;
    if (f >= a && f < a + d) {
      const fl = f - a;
      scene = { kind: "expl", bg: "Pexp", starsX: fl * 0.25, starsY: fl * 0.15 };
      layers.push(...explainerLayersP(fl, a));
    }
  }
  BROLL.forEach((b, i) => {
    const a = sec(b.t), d = sec(2.0);
    if (f >= a && f < a + d) layers.push(boardLayerP(f - a, d, i, clips[i].w, clips[i].h, 90, 1290, 1.3));
  });
  return { f, srcF: f, base, scene, layers };
};

/** the 3-minute essence: output frame f shows the lesson's frame v3 (pieces back to back) */
export const frameSpecShort = (f: number, clips: ClipDims, portrait: boolean): FrameSpec => {
  const m = shortToV3(f);
  if (!m) throw new Error("short frame out of range " + f);
  const spec = portrait ? frameSpecP(m.v3, clips) : frameSpec(m.v3, clips);
  return { ...spec, f, srcF: m.v3 };
};
