import React from "react";
import { AbsoluteFill, spring, staticFile, useCurrentFrame } from "remotion";
import { WarmBase, RV, LANDSCAPE } from "./PortraitKit";
import { kufiF, monoF } from "./MG";
import { BRAND, alpha } from "./brand";

/**
 * DebateLayouts — only the reply models the user chose (2026-10-29): «الكتل المنحوتة» (default) (s07 of creative_4x3_gallery.html) and dossier.html,
 * on the original's geometry («نوافذ 4:3 كبيرة، لوحة إخراج 16:9»): his window (main) 4:3 at ≈ 65 % of the width on the right, the answered clip (guest) 4:3
 * at ≈ 33 % on the left, each video whole inside its window (contain). Only the original's own decor and words; colours from BRAND, and the decorated base
 * under the original's background shapes (no plain background).
 * A source is either a whole video (`src`) or a source-pixel column of the baked split (`src` + `x`/`w`, like SplitCards).
 */
export type DebateSrc = { src: string; x?: number; w?: number; aspect?: number; blur?: number };
export type DebateLayoutName = "dossier" | "blocks";
type Props = { main: DebateSrc; guest: DebateSrc; guestName?: string; title?: string; at?: number };

const W = LANDSCAPE.W, H = LANDSCAPE.H;
const K = W / 1450;   // the original's px are drawn on a 1450-wide stage (its enlarged view)
type Win = { left: number; top: number; width: number };   // fractions of the stage, as in the original CSS
const ratio = (s: DebateSrc) => s.aspect ?? (s.w ? s.w / 1080 : 16 / 9);
/** the window is exactly the shown video's size (user 2026-10-29: «الإطار على أبعاد الفيديو المعروض، لا أكبر ولا أصغر»): the video's ratio fitted in the
 *  original's 4:3 slot (a taller video may grow to 1.4× the slot height), centred on the slot and kept inside the frame */
const box = (w: Win, s: DebateSrc) => {
  const r = ratio(s), sw = w.width * W, sh = (sw * 3) / 4, maxH = Math.min(sh * 1.4, H * 0.9);
  const bw = Math.min(sw, maxH * r), bh = bw / r, m = H * 0.03;
  const x = Math.min(Math.max(w.left * W + (sw - bw) / 2, m), W - m - bw), y = Math.min(Math.max(w.top * H + (sh - bh) / 2, m), H - m - bh);
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
      <Window w={{ left: 0.31, top: 0.08, width: 0.67 }} s={main} p={mi}
        style={{ borderRadius: `0 ${80 * K}px 0 ${80 * K}px`, boxShadow: `0 ${24 * K}px ${30 * K}px rgba(0,0,0,.53)`, outline: `${8 * K}px solid ${BRAND.light}` }} />
      <Window w={{ left: 0.01, top: 0.24, width: 0.35 }} s={guest} p={gi}
        style={{ borderRadius: `${90 * K}px 0 ${90 * K}px 0`, outline: `${8 * K}px solid ${BRAND.accent}` }} />
      <Cap text={title} style={{ bottom: H * 0.05, right: W * 0.06, color: BRAND.light, opacity: mi }} />
    </AbsoluteFill>
  );
};

/* ── dossier.html: a case sheet behind, the two windows as clipped photos, tape on the guest, the «ON RECORD» stamp and the file detail */
export const DebateDossier: React.FC<Props> = ({ main, guest, title = "ملف النقاش", at = 0 }) => {
  const t = useCurrentFrame() / 30 - at, mi = useIn(at), gi = useIn(at, 0.12);
  const sp = Math.min(1, Math.max(0, (t - 0.6) / 0.15)), st = 2.2 - 1.2 * sp;
  const g = box({ left: 0.02, top: 0.27, width: 0.34 }, guest);
  return (
    <AbsoluteFill>
      <WarmBase />
      <div style={{ position: "absolute", left: W * 0.04, top: H * 0.04, width: W * 0.92, height: H * 0.92, background: BRAND.paper, borderRadius: 6, transform: "rotate(-0.8deg)",
        boxShadow: "0 30px 60px rgba(0,0,0,.45)", backgroundImage: `repeating-linear-gradient(0deg, transparent 0 ${22 * K}px, ${alpha(BRAND.ink, 0.08)} ${22 * K}px ${22 * K + 1}px)` }} />
      <Window w={{ left: 0.32, top: 0.07, width: 0.64 }} s={main} p={mi}
        style={{ transform: "rotate(1.5deg)", outline: `${9 * K}px solid ${BRAND.card}`, boxShadow: `0 ${16 * K}px ${26 * K}px ${alpha(BRAND.ink, 0.5)}` }} />
      <Window w={{ left: 0.02, top: 0.27, width: 0.34 }} s={guest} p={gi}
        style={{ transform: "rotate(-5deg)", outline: `${9 * K}px solid ${BRAND.card}`, boxShadow: `0 ${12 * K}px ${25 * K}px ${alpha(BRAND.ink, 0.5)}` }} />
      <div style={{ position: "absolute", left: g.x + g.w * 0.3, top: g.y - 30, width: W * 0.12, height: H * 0.07, background: alpha(BRAND.light, 0.75), transform: "rotate(-12deg)", opacity: gi, zIndex: 5 }} />
      <div style={{ position: "absolute", left: W * 0.06, bottom: H * 0.06, transform: `rotate(-10deg) scale(${st})`, opacity: sp * 0.9, border: `${4 * K}px solid ${BRAND.mark}`, color: BRAND.mark,
        borderRadius: 8, padding: `${2 * K}px ${14 * K}px`, fontFamily: monoF, fontWeight: 700, fontSize: Math.round(26 * K), letterSpacing: 3 }}>ON RECORD</div>
      <Cap text={title} style={{ top: H * 0.1, left: W * 0.07, color: BRAND.ink, fontSize: Math.round(22 * K), opacity: mi }} />
    </AbsoluteFill>
  );
};

export const DEBATE_LAYOUTS: Record<DebateLayoutName, React.FC<Props>> = { dossier: DebateDossier, blocks: DebateBlocks };
/** the pasted call shape: <SculptedBlocks07 mainSrc guestSrc title /> (paths relative to public/, or staticFile URLs) */
export const SculptedBlocks07: React.FC<{ mainSrc: string; guestSrc: string; title?: string }> = ({ mainSrc, guestSrc, title }) => {
  const rel = (s: string) => s.replace(/^.*\/public\//, "").replace(/^\//, "");
  return <DebateBlocks main={{ src: rel(mainSrc) }} guest={{ src: rel(guestSrc) }} title={title} />;
};
