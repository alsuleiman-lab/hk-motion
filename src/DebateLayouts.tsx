import React from "react";
import { AbsoluteFill, spring, staticFile, useCurrentFrame } from "remotion";
import { WarmBase, RV, LANDSCAPE } from "./PortraitKit";
import { kufiF, monoF } from "./MG";
import { BRAND, alpha } from "./brand";
import { Tape, tornClip } from "./PaperKit";

/**
 * DebateLayouts — only the reply models the user chose (2026-10-29): dossier.html (default, user 2026-10-30) and «الكتل المنحوتة» (s07 of creative_4x3_gallery.html),
 * on the original's geometry («نوافذ 4:3 كبيرة، لوحة إخراج 16:9»): his window (main) 4:3 at ≈ 65 % of the width on the right, the answered clip (guest) 4:3
 * at ≈ 33 % on the left, each video whole inside its window (contain). Only the original's own decor and words; colours from BRAND, and the decorated base
 * under the original's background shapes (no plain background).
 * A source is either a whole video (`src`) or a source-pixel column of the baked split (`src` + `x`/`w`).
 */
export type DebateSrc = { src: string; x?: number; w?: number; aspect?: number; blur?: number };
export type DebateLayoutName = "dossier" | "blocks";
type Props = { main: DebateSrc; guest: DebateSrc; guestName?: string; title?: string; url?: string; at?: number };

const W = LANDSCAPE.W, H = LANDSCAPE.H;
const K = W / 1450;   // the original's px are drawn on a 1450-wide stage (its enlarged view)
type Win = { left: number; top: number; width: number; mid?: number };   // `mid` = the vertical centre of the window as a fraction of the height (overrides `top`)   // fractions of the stage, as in the original CSS
const ratio = (s: DebateSrc) => s.aspect ?? (s.w ? s.w / 1080 : 16 / 9);
/** the window is exactly the shown video's size (user 2026-10-29: «الإطار على أبعاد الفيديو المعروض، لا أكبر ولا أصغر»): the video's ratio fitted in the
 *  original's 4:3 slot (a taller video may grow to 1.4× the slot height), centred on the slot and kept inside the frame */
const box = (w: Win, s: DebateSrc) => {
  const r = ratio(s), sw = w.width * W, sh = (sw * 3) / 4, maxH = Math.min(sh * 1.4, H * 0.9);
  const bw = Math.min(sw, maxH * r), bh = bw / r, m = H * 0.03;
  const x = Math.min(Math.max(w.left * W + (sw - bw) / 2, m), W - m - bw), y = Math.min(Math.max(w.mid !== undefined ? w.mid * H - bh / 2 : w.top * H + (sh - bh) / 2, m), H - m - bh);
  return { x: Math.round(x), y: Math.round(y), w: Math.round(bw), h: Math.round(bh) };
};

/** the video whole inside its 4:3 window: a whole video is contained; a column of the baked split is centred at full height */
const Feed: React.FC<{ s: DebateSrc; w: number; h: number }> = ({ s, w, h }) => {
  const f = s.blur ? { filter: `blur(${s.blur}px)` } : {};
  if (s.w === undefined) return <RV src={staticFile(s.src)} style={{ position: "absolute", inset: 0, width: w, height: h, objectFit: "contain", ...f }} />;
  const k = Math.min(h / 1080, w / s.w), vw = s.w * k, vh = 1080 * k;
  return (
    <div style={{ position: "absolute", left: (w - vw) / 2, top: (h - vh) / 2, width: vw, height: vh, overflow: "hidden" }}>
      <RV src={staticFile(s.src)} style={{ position: "absolute", left: -(s.x ?? 0) * k, top: 0, width: 1920 * k, height: vh, ...f }} />
    </div>
  );
};
/** 0→1 entrance from `at` (a soft spring) */
const useIn = (at: number, delay = 0) => spring({ frame: useCurrentFrame() - Math.round((at + delay) * 30), fps: 30, config: { damping: 20, mass: 0.7 } });
/** one 4:3 window: the original `.video` shell (radial dark inside) + its own frame style */
const Window: React.FC<{ w: Win; s: DebateSrc; p: number; style?: React.CSSProperties }> = ({ w, s, p, style }) => {
  const b = box(w, s);
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
      <WarmBase />
      <AbsoluteFill style={{ background: `linear-gradient(115deg, ${alpha(BRAND.accentDeep, 0.78)} 0 41%, ${alpha(BRAND.base3, 0.82)} 41%)` }} />
      <div style={{ position: "absolute", width: W * 0.5, height: H * 0.7, top: 0, left: -W * 0.18, border: `${Math.round(50 * K)}px solid ${alpha(BRAND.card, 0.05)}`, borderRadius: "50%", boxSizing: "border-box" }} />
      <Window w={{ left: 0.38, top: 0.08, width: 0.6, mid: 0.5 }} s={main} p={mi}
        style={{ borderRadius: `0 ${80 * K}px 0 ${80 * K}px`, boxShadow: `0 ${24 * K}px ${30 * K}px rgba(0,0,0,.53)`, outline: `${8 * K}px solid ${BRAND.light}` }} />
      <Window w={{ left: 0.02, top: 0.24, width: 0.33, mid: 0.5 }} s={guest} p={gi}
        style={{ borderRadius: `${90 * K}px 0 ${90 * K}px 0`, outline: `${8 * K}px solid ${BRAND.accent}` }} />
      <Cap text={title} style={{ bottom: H * 0.05, left: W * 0.04, color: BRAND.light, opacity: mi }} />
    </AbsoluteFill>
  );
};

/* ── dossier: a torn paper sheet behind, both videos on hand-torn paper mounts. His screen comes from full screen down into its mount while the clip's mount
   slides in from the left; the source link replaces the old stamp, «مصدر» the old file title (user 2026-10-29) */
const PAD = Math.round(16 * K);
/** a video on a hand-torn paper mount: the paper pad around the whole video, the video straight inside it */
const TornWindow: React.FC<{ w: Win; s: DebateSrc; seed: string; transform: (b: { x: number; y: number; w: number; h: number }) => string; tape?: boolean }> = ({ w, s, seed, transform, tape }) => {
  const b = box(w, s), pw = b.w + 2 * PAD, ph = b.h + 2 * PAD;
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
export const DebateDossier: React.FC<Props> = ({ main, guest, title = "مصدر", url, at = 0 }) => {
  const t = useCurrentFrame() / 30 - at, mi = useIn(at), gi = useIn(at, 0.3);
  const sp = Math.min(1, Math.max(0, (t - 0.9) / 0.15)), st = 2.2 - 1.2 * sp;
  return (
    <AbsoluteFill>
      <WarmBase />
      <div style={{ position: "absolute", left: W * 0.04, top: H * 0.04, width: W * 0.92, height: H * 0.92, transform: "rotate(-0.8deg)", filter: "drop-shadow(0 30px 40px rgba(0,0,0,.45))" }}>
        <div style={{ position: "absolute", inset: 0, background: BRAND.paper, clipPath: tornClip(W * 0.92, H * 0.92, "dossier-sheet", 11, 34),
          backgroundImage: `repeating-linear-gradient(0deg, transparent 0 ${22 * K}px, ${alpha(BRAND.ink, 0.08)} ${22 * K}px ${22 * K + 1}px)` }} />
      </div>
      <TornWindow w={{ left: 0.36, top: 0.07, width: 0.62 }} s={main} seed="dossier-main"
        transform={(b) => {
          const s0 = Math.min(W / b.w, H / b.h);
          return `translate(${(1 - mi) * (W / 2 - (b.x + b.w / 2))}px, ${(1 - mi) * (H / 2 - (b.y + b.h / 2))}px) rotate(${1.5 * mi}deg) scale(${1 + (s0 - 1) * (1 - mi)})`;
        }} />
      <TornWindow w={{ left: 0.02, top: 0.27, width: 0.31 }} s={guest} seed="dossier-guest" tape
        transform={(b) => `translateX(${-(1 - gi) * (b.x + b.w + 120)}px) rotate(${-5 * gi}deg)`} />
      {url ? (
        <div style={{ position: "absolute", left: W * 0.06, bottom: H * 0.06, transform: `rotate(-4deg) scale(${st})`, opacity: sp * 0.95, border: `${4 * K}px solid ${BRAND.mark}`, color: BRAND.mark,
          borderRadius: 8, padding: `${2 * K}px ${14 * K}px`, fontFamily: monoF, fontWeight: 700, fontSize: Math.round(20 * K), direction: "ltr", whiteSpace: "nowrap", background: alpha(BRAND.card, 0.9) }}>{url}</div>
      ) : null}
      <Cap text={title} style={{ top: H * 0.1, left: W * 0.07, color: BRAND.ink, fontSize: Math.round(26 * K), opacity: mi }} />
    </AbsoluteFill>
  );
};

export const DEBATE_LAYOUTS: Record<DebateLayoutName, React.FC<Props>> = { dossier: DebateDossier, blocks: DebateBlocks };
/** the pasted call shape: <SculptedBlocks07 mainSrc guestSrc title /> (paths relative to public/, or staticFile URLs) */
export const SculptedBlocks07: React.FC<{ mainSrc: string; guestSrc: string; title?: string }> = ({ mainSrc, guestSrc, title }) => {
  const rel = (s: string) => s.replace(/^.*\/public\//, "").replace(/^\//, "");
  return <DebateBlocks main={{ src: rel(mainSrc) }} guest={{ src: rel(guestSrc) }} title={title} />;
};
