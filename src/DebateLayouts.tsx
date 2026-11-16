import React from "react";
import { AbsoluteFill, spring, staticFile, useCurrentFrame } from "remotion";
import { WarmBase, RV, LANDSCAPE } from "./PortraitKit";
import { kufiF, monoF } from "./MG";
import { BRAND, alpha } from "./brand";
import { Tape, tornClip } from "./PaperKit";
import { HYL, HyLayer, VSlot } from "./hybrid/Slot";

/**
 * DebateLayouts — only the reply models the user chose (2026-10-29): dossier.html (default, user 2026-10-30) and «الكتل المنحوتة» (s07 of creative_4x3_gallery.html),
 * on the original's geometry («نوافذ 4:3 كبيرة، لوحة إخراج 16:9»): his window (main) 4:3 at ≈ 65 % of the width on the right, the answered clip (guest) 4:3
 * at ≈ 33 % on the left, each video whole inside its window (contain). Only the original's own decor and words; colours from BRAND, and the decorated base
 * under the original's background shapes (no plain background).
 * A source is either a whole video (`src`) or a source-pixel column of the baked split (`src` + `x`/`w`).
 */
export type DebateSrc = { src: string; x?: number; w?: number; y?: number; h?: number; aspect?: number; blur?: number };
export type DebateLayoutName = "dossier" | "dossierBig" | "dossierPair" | "blocks";
type Props = { main: DebateSrc; guest: DebateSrc; guestName?: string; title?: string; url?: string; at?: number; behind?: React.ReactNode; gaps?: { from: number; to: number }[] };

const W = LANDSCAPE.W, H = LANDSCAPE.H;
const K = W / 1450;   // the original's px are drawn on a 1450-wide stage (its enlarged view)
type Win = { left: number; top: number; width: number; mid?: number };   // `mid` = the vertical centre of the window as a fraction of the height (overrides `top`)   // fractions of the stage, as in the original CSS
const ratio = (s: DebateSrc) => s.aspect ?? (s.w ? s.w / (s.h ?? 1080) : 16 / 9);
/** the window is exactly the shown video's size (user 2026-10-29: «الإطار على أبعاد الفيديو المعروض، لا أكبر ولا أصغر»): the video's ratio fitted in the
 *  original's 4:3 slot (a taller video may grow to 1.4× the slot height), centred on the slot and kept inside the frame */
const box = (w: Win, s: DebateSrc) => {
  const r = ratio(s), sw = w.width * W, sh = (sw * 3) / 4, maxH = Math.min(sh * 1.4, H * 0.76);
  const bw = Math.min(sw, maxH * r), bh = bw / r, m = 64;
  const x = Math.min(Math.max(w.left * W + (sw - bw) / 2, m), W - m - bw), y = Math.min(Math.max(w.mid !== undefined ? w.mid * H - bh / 2 : w.top * H + (sh - bh) / 2, m), H - m - bh);
  return { x: Math.round(x), y: Math.round(y), w: Math.round(bw), h: Math.round(bh) };
};

/** GPU renderer: where the browser draws the picture of `s` inside a w × h window. Chromium snaps a box to whole pixels in its layer's own space
 *  (before the window's rotate/scale), so the clip box (L, T, BW, BH) and the picture (IX, IY, IW, IH) are snapped the same way (`o` = the window
 *  box's offset inside the transformed element; measured 2026-11-12: ½ px off without it). Whole video: objectFit "contain" of ratio `ratio(s)`. */
const feedRect = (s: DebateSrc, w: number, h: number, o: number) => {
  if (s.w === undefined) {
    const r = ratio(s), cw = w / h > r ? h * r : w, chh = w / h > r ? h : w / r;
    return { L: 0, T: 0, BW: w, BH: h, IX: (w - cw) / 2, IY: (h - chh) / 2, IW: cw, IH: chh };
  }
  const ch0 = s.h ?? 1080, k0 = Math.min(h / ch0, w / s.w), bw = s.w * k0, bh = ch0 * k0, l = (w - bw) / 2, t = (h - bh) / 2;
  const sn = (a: number, len: number) => { const p0 = Math.round(o + a); return [p0 - o, Math.round(o + a + len) - p0]; };
  const [L, BW] = sn(l, bw), [T, BH] = sn(t, bh), [IX, IW] = sn(l - (s.x ?? 0) * k0, 1920 * k0), [IY, IH] = sn(t - (s.y ?? 0) * k0, 1080 * k0);
  return { L, T, BW, BH, IX, IY, IW, IH };
};
/** GPU renderer, in the layer BELOW a video drawn over a dark window ground: the colour `c` that lies just outside the window, put under the picture.
 *  In the browser the picture and the ground are drawn in one surface, so the picture's anti-aliased edge blends with what is OUTSIDE the window
 *  (the paper); drawn in separate layers, the ground's own edge showed through as a dark seam (measured 2026-11-12). Sides where the picture stops
 *  inside the window keep the ground (the browser blends with the ground there). */
const UnderPicture: React.FC<{ s: DebateSrc; w: number; h: number; o: number; c: string; left: number; top: number }> = ({ s, w, h, o, c, left, top }) => {
  const r = feedRect(s, w, h, o), x0 = Math.max(r.L, r.IX), y0 = Math.max(r.T, r.IY), x1 = Math.min(r.L + r.BW, r.IX + r.IW), y1 = Math.min(r.T + r.BH, r.IY + r.IH);
  const a = x0 <= 0.5 ? x0 - 2 : x0 + 1, b = x1 >= w - 0.5 ? x1 + 2 : x1 - 1, cT = y0 <= 0.5 ? y0 - 2 : y0 + 1, d = y1 >= h - 0.5 ? y1 + 2 : y1 - 1;
  return b > a && d > cT ? <div style={{ position: "absolute", left: left + a, top: top + cT, width: b - a, height: d - cT, background: c }} /> : null;
};
/** the video whole inside its 4:3 window: a whole video is contained; a column of the baked split is centred at full height */
const Feed: React.FC<{ s: DebateSrc; w: number; h: number; z?: number; o?: number; radii?: [number, number, number, number] }> = ({ s, w, h, z = 0, o = 0, radii }) => {
  const f = s.blur ? { filter: `blur(${s.blur}px)` } : {};
  if (HYL) {   /* GPU renderer: the same picture placed by the compositor (NVDEC), clipped to the same box; blur as a slot effect. `radii`: the window's
                  rounded corners, applied when the picture's clip box IS the window box (it fills it) */
    const fx = s.blur ? { blur: s.blur } : undefined, r = feedRect(s, w, h, o);
    const fills = r.L <= 0.5 && r.T <= 0.5 && r.L + r.BW >= w - 0.5 && r.T + r.BH >= h - 0.5;
    return <VSlot src={s.src} w={r.BW} h={r.BH} style={{ left: r.L, top: r.T }} vx={r.IX - r.L} vy={r.IY - r.T} vw={r.IW} vh={r.IH} fx={fx} z={z} grow={0} radius={radii && fills ? radii : 0} />;
  }
  if (s.w === undefined) return <RV src={staticFile(s.src)} style={{ position: "absolute", inset: 0, width: w, height: h, objectFit: "contain", ...f }} />;
  const ch = s.h ?? 1080, k = Math.min(h / ch, w / s.w), vw = s.w * k, vh = ch * k;
  return (
    <div style={{ position: "absolute", left: (w - vw) / 2, top: (h - vh) / 2, width: vw, height: vh, overflow: "hidden" }}>
      <RV src={staticFile(s.src)} style={{ position: "absolute", left: -(s.x ?? 0) * k, top: -(s.y ?? 0) * k, width: 1920 * k, height: 1080 * k, ...f }} />
    </div>
  );
};
/** 0→1 entrance from `at` (a soft spring) */
const useIn = (at: number, delay = 0) => spring({ frame: useCurrentFrame() - Math.round((at + delay) * 30), fps: 30, config: { damping: 20, mass: 0.7 } });
/** one 4:3 window: the original `.video` shell (radial dark inside) + its own frame style */
const Window: React.FC<{ w: Win; s: DebateSrc; p: number; radii: [number, number, number, number]; style?: React.CSSProperties }> = ({ w, s, p, radii, style }) => {
  const b = box(w, s);
  style = { ...style, borderRadius: radii.map((v) => `${v}px`).join(" ") };
  if (HYL) {   /* GPU renderer: the window's ground, shadow and outline BELOW the video (layer 0); the video by the compositor, clipped by the same
                  rounded corners; the empty shell in the top layer carries the opacity and the scale the video is measured with */
    const shell: React.CSSProperties = { position: "absolute", left: b.x, top: b.y, width: b.w, height: b.h, overflow: "hidden", boxSizing: "border-box", opacity: p, ...style,
      transform: `${style?.transform ?? ""} scale(${0.94 + 0.06 * p})` };
    return (
      <>
        <HyLayer z={0}><div style={{ ...shell, background: `radial-gradient(ellipse at 60% 40%, ${BRAND.base2}, ${BRAND.base} 65%, ${BRAND.base3})` }} /></HyLayer>
        <div style={{ ...shell, boxShadow: undefined, outline: undefined }}>
          <Feed s={s} w={b.w} h={b.h} radii={radii} />
        </div>
      </>
    );
  }
  return (
    <div style={{ position: "absolute", left: b.x, top: b.y, width: b.w, height: b.h, overflow: "hidden", boxSizing: "border-box",
      background: `radial-gradient(ellipse at 60% 40%, ${BRAND.base2}, ${BRAND.base} 65%, ${BRAND.base3})`, opacity: p, ...style,
      transform: `${style?.transform ?? ""} scale(${0.94 + 0.06 * p})` }}>
      <Feed s={s} w={b.w} h={b.h} />
    </div>
  );
};
const Cap: React.FC<{ text: string; style: React.CSSProperties }> = ({ text, style }) => (
  <div style={{ position: "absolute", zIndex: 10, whiteSpace: "nowrap", direction: "rtl", fontFamily: kufiF, fontSize: Math.round(16 * K), ...style }}>{text}</div>
);

/* ── «الكتل المنحوتة» (s07): diagonal split background, leaf-shaped windows with thick outlines, a faint giant ring, the caption bottom-right */
export const DebateBlocks: React.FC<Props> = ({ main, guest, title = "الشيخ محمد بن شمس الدين — مع المتحدث", at = 0 }) => {
  const mi = useIn(at), gi = useIn(at, 0.12);
  return (
    <AbsoluteFill>
      <HyLayer z={0}>{/* GPU renderer: the whole background lies below the videos (inert elsewhere) */}
      <WarmBase />
      <AbsoluteFill style={{ background: `linear-gradient(115deg, ${alpha(BRAND.accentDeep, 0.78)} 0 41%, ${alpha(BRAND.base3, 0.82)} 41%)` }} />
      <div style={{ position: "absolute", width: W * 0.5, height: H * 0.7, top: 0, left: -W * 0.18, border: `${Math.round(50 * K)}px solid ${alpha(BRAND.card, 0.05)}`, borderRadius: "50%", boxSizing: "border-box" }} />
      </HyLayer>
      <Window w={{ left: 0.38, top: 0.08, width: 0.6, mid: 0.5 }} s={main} p={mi} radii={[0, 80 * K, 0, 80 * K]}
        style={{ boxShadow: `0 ${24 * K}px ${30 * K}px rgba(0,0,0,.53)`, outline: `${8 * K}px solid ${BRAND.light}` }} />
      <Window w={{ left: 0.02, top: 0.24, width: 0.33, mid: 0.5 }} s={guest} p={gi} radii={[90 * K, 0, 90 * K, 0]}
        style={{ outline: `${8 * K}px solid ${BRAND.accent}` }} />
      <Cap text={title} style={{ bottom: H * 0.05, left: W * 0.04, color: BRAND.light, opacity: mi }} />
    </AbsoluteFill>
  );
};

/* ── dossier: a torn paper sheet behind, both videos on hand-torn paper mounts. His screen comes from full screen down into its mount while the clip's mount
   slides in from the left; the source link replaces the old stamp, «مصدر» the old file title (user 2026-10-29) */
const PAD = Math.round(16 * K);
/** a video on a hand-torn paper mount: the paper pad around the whole video, the video straight inside it */
const TornWindow: React.FC<{ w: Win; s: DebateSrc; seed: string; transform: (b: { x: number; y: number; w: number; h: number }) => string; tape?: boolean; z?: number }> = ({ w, s, seed, transform, tape, z = 0 }) => {
  const b = box(w, s), pw = b.w + 2 * PAD, ph = b.h + 2 * PAD;
  if (HYL) {   /* GPU renderer: paper mount + window ground + tape BELOW this video (layer z), with the mount's drop shadow over all of them (the shadow
                  of the whole mount = of paper ∪ tape: the video lies inside the paper); the video at level z; above it (layer z+1) the tape again, but
                  only inside the video's box, where the video covered the lower one — so the tape is drawn once everywhere, shadow included */
    const tp = tape ? <Tape x={pw * 0.34} y={-16} w={W * 0.1} rot={-12} /> : null;
    return (
      <div style={{ position: "absolute", left: b.x - PAD, top: b.y - PAD, width: pw, height: ph, transform: transform(b) }}>
        <HyLayer z={z}>
          <div style={{ position: "absolute", inset: 0, filter: `drop-shadow(0 ${14 * K}px ${18 * K}px ${alpha(BRAND.ink, 0.5)})` }}>
            <div style={{ position: "absolute", inset: 0, background: BRAND.card, clipPath: tornClip(pw, ph, seed, 7, 22) }} />
            <div style={{ position: "absolute", left: PAD, top: PAD, width: b.w, height: b.h, background: `radial-gradient(ellipse at 60% 40%, ${BRAND.base2}, ${BRAND.base} 65%, ${BRAND.base3})` }} />
            <UnderPicture s={s} w={b.w} h={b.h} o={PAD} c={BRAND.card} left={PAD} top={PAD} />
            {tp}
          </div>
        </HyLayer>
        <div style={{ position: "absolute", left: PAD, top: PAD, width: b.w, height: b.h, overflow: "hidden" }}>
          <Feed s={s} w={b.w} h={b.h} z={z} o={PAD} />
        </div>
        {tp ? <HyLayer z={z + 1}><div style={{ position: "absolute", left: PAD, top: PAD, width: b.w, height: b.h, overflow: "hidden" }}><div style={{ position: "absolute", left: -PAD, top: -PAD }}>{tp}</div></div></HyLayer> : null}
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", left: b.x - PAD, top: b.y - PAD, width: pw, height: ph, transform: transform(b), filter: `drop-shadow(0 ${14 * K}px ${18 * K}px ${alpha(BRAND.ink, 0.5)})` }}>
      <div style={{ position: "absolute", inset: 0, background: BRAND.card, clipPath: tornClip(pw, ph, seed, 7, 22) }} />
      <div style={{ position: "absolute", left: PAD, top: PAD, width: b.w, height: b.h, overflow: "hidden", background: `radial-gradient(ellipse at 60% 40%, ${BRAND.base2}, ${BRAND.base} 65%, ${BRAND.base3})` }}>
        <Feed s={s} w={b.w} h={b.h} />
      </div>
      {tape ? <Tape x={pw * 0.34} y={-16} w={W * 0.1} rot={-12} /> : null}
    </div>
  );
};
/** (user order 2026-11-15, «انقسام الشاشة دائماً») the area for added elements is the MIDDLE between the two screens: while an element is up his mount slides aside
 *  (right) and shrinks a little, so the middle widens; the element sits in it BEHIND both frames; when it goes he returns to his place. */
const GAP_DX = 130, GAP_S = 0.9;
export const DebateDossier: React.FC<Props & { big?: boolean | "pair" }> = ({ main, guest, title = "مصدر", url, at = 0, behind, gaps = [], big: bigP = false }) => {
  const pair = bigP === "pair", big = bigP === true;
  const t = useCurrentFrame() / 30 - at, mi = useIn(at), gi = useIn(at, 0.3);
  const tt = t + at, cl = (v: number) => Math.max(0, Math.min(1, v)), sm = (v: number) => v * v * (3 - 2 * v);
  const gk = gaps.reduce((m, g) => Math.max(m, sm(Math.min(cl((tt - g.from) / 0.4), cl((g.to + 0.4 - tt) / 0.4)))), 0);
  const sp = Math.min(1, Math.max(0, (t - 0.9) / 0.15)), st = 2.2 - 1.2 * sp;
  return (
    <AbsoluteFill>
      <HyLayer z={0}>
      <WarmBase />
      <div style={{ position: "absolute", left: W * 0.04, top: H * 0.04, width: W * 0.92, height: H * 0.92, transform: "rotate(-0.8deg)", filter: "drop-shadow(0 30px 40px rgba(0,0,0,.45))" }}>
        <div style={{ position: "absolute", inset: 0, background: BRAND.paper, clipPath: tornClip(W * 0.92, H * 0.92, "dossier-sheet", 11, 34),
          backgroundImage: `repeating-linear-gradient(0deg, transparent 0 ${22 * K}px, ${alpha(BRAND.ink, 0.08)} ${22 * K}px ${22 * K + 1}px)` }} />
      </div>
      </HyLayer>
      {behind ? <HyLayer z={0}><AbsoluteFill>{behind}</AbsoluteFill></HyLayer> : null}
      <TornWindow w={pair ? { left: 0.52, top: 0.2, mid: 0.5, width: 0.45 } : big ? { left: 0.68, top: 0.3, width: 0.3 } : { left: 0.35, top: 0.05, width: 0.64 }} s={main} seed="dossier-main" z={0}
        transform={(b) => {
          const s0 = Math.min(W / b.w, H / b.h);
          const pw = b.w + 2 * PAD, sg = 1 - (1 - GAP_S) * gk, gx = gk * GAP_DX + (pw * (1 - sg)) / 2;
          return `translate(${(1 - mi) * (W / 2 - (b.x + b.w / 2))}px, ${(1 - mi) * (H / 2 - (b.y + b.h / 2))}px) rotate(${1.5 * mi}deg) scale(${1 + (s0 - 1) * (1 - mi)}) translateX(${gx}px) scale(${sg})`;
        }} />
      <TornWindow w={pair ? { left: 0.03, top: 0.2, mid: 0.5, width: 0.45 } : big ? { left: 0.03, top: 0.1, width: 0.62 } : { left: 0.02, top: 0.27, width: 0.31 }} s={guest} seed="dossier-guest" tape z={1}
        transform={(b) => `translateX(${-(1 - gi) * (b.x + b.w + 120)}px) rotate(${-5 * gi}deg)`} />
      {url ? (
        <div style={{ position: "absolute", left: W * 0.06, bottom: H * 0.06, transform: `rotate(-4deg) scale(${st})`, opacity: sp * 0.95, border: `${4 * K}px solid ${BRAND.mark}`, color: BRAND.mark,
          borderRadius: 8, padding: `${2 * K}px ${14 * K}px`, fontFamily: monoF, fontWeight: 700, fontSize: Math.round(20 * K), direction: "ltr", whiteSpace: "nowrap", background: alpha(BRAND.card, 0.9) }}>{url}</div>
      ) : null}
      <Cap text={title} style={{ top: H * 0.1, left: W * 0.07, color: BRAND.ink, fontSize: Math.round(26 * K), opacity: mi }} />
    </AbsoluteFill>
  );
};

/** (user order 2026-11-16, «كبّر فيديو المردود عليه وصغّر بطاقة الشيخ»: a deliberate rule break) the shown clip large on the left, his mount small on the right */
const DebateDossierBig: React.FC<Props> = (p) => <DebateDossier {...p} big />;
const DebateDossierPair: React.FC<Props> = (p) => <DebateDossier {...p} big="pair" />;   /* two equal windows side by side: the recorded clip left, an added clip right */
export const DEBATE_LAYOUTS: Record<DebateLayoutName, React.FC<Props>> = { dossier: DebateDossier, dossierBig: DebateDossierBig, dossierPair: DebateDossierPair, blocks: DebateBlocks };
/** the pasted call shape: <SculptedBlocks07 mainSrc guestSrc title /> (paths relative to public/, or staticFile URLs) */
export const SculptedBlocks07: React.FC<{ mainSrc: string; guestSrc: string; title?: string }> = ({ mainSrc, guestSrc, title }) => {
  const rel = (s: string) => s.replace(/^.*\/public\//, "").replace(/^\//, "");
  return <DebateBlocks main={{ src: rel(mainSrc) }} guest={{ src: rel(guestSrc) }} title={title} />;
};
