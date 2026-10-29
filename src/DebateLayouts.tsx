import React from "react";
import { AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { WarmBase, RV, LANDSCAPE } from "./PortraitKit";
import { kufiF, monoF, useT } from "./MG";
import { BRAND, alpha } from "./brand";

/**
 * DebateLayouts — landscape models for a reply video: the answered clip (guest) and his video (main) on the decorated base, in the identity's colours
 * (user 2026-10-29: «نموذج للفيديوهات المردود عليها … راعِ ألواننا والأريحية في مقاس الفيديو المعروض»; shapes after orbital.html, dossier.html, SculptedBlocks07).
 * The guest screen is the larger one (≈ 58 % of the width), both keep their own ratio in full, margins ≥ 60 px and ≥ 40 px between, and the bottom-right
 * corner stays free for the title bar. A source is either a whole video (`src`) or a source-pixel column of the baked split (`src` + `x`/`w`, like SplitCards).
 */
export type DebateSrc = { src: string; x?: number; w?: number; aspect?: number; blur?: number };
export type DebateLayoutName = "orbital" | "dossier" | "blocks";
type Props = { main: DebateSrc; guest: DebateSrc; mainName?: string; guestName?: string; title?: string; at?: number };

const W = LANDSCAPE.W, H = LANDSCAPE.H;
const ratio = (s: DebateSrc) => s.aspect ?? (s.w ? s.w / 1080 : 16 / 9);
/** the largest w×h of ratio r inside maxW×maxH */
const fit = (r: number, maxW: number, maxH: number) => (maxW / r <= maxH ? { w: Math.round(maxW), h: Math.round(maxW / r) } : { w: Math.round(maxH * r), h: Math.round(maxH) });
/** guest and main boxes side by side (guest on the left, as in his split), centred in the free band */
const twoUp = (g: DebateSrc, m: DebateSrc, top: number, bottom: number, side = 90, gap = 70) => {
  const avail = W - side * 2 - gap, maxH = bottom - top;
  // the answered clip is the one to read: his screen gets at most 70 % of its area
  const G = fit(ratio(g), avail * 0.58, maxH), rm = ratio(m), M = fit(rm, avail - G.w, Math.min(maxH * 0.8, Math.sqrt((0.7 * G.w * G.h) / rm)));
  const x0 = Math.round((W - (G.w + gap + M.w)) / 2), mid = (top + bottom) / 2;
  return { g: { ...G, x: x0, y: Math.round(mid - G.h / 2) }, m: { ...M, x: x0 + G.w + gap, y: Math.round(mid - M.h / 2) } };
};
type Box = { x: number; y: number; w: number; h: number };

/** the video inside a box: a whole video fills it (same ratio); a column of the baked split is shifted into view */
const Feed: React.FC<{ s: DebateSrc; w: number; h: number }> = ({ s, w, h }) => {
  const f = s.blur ? { filter: `blur(${s.blur}px)` } : {};
  if (s.w === undefined) return <RV src={staticFile(s.src)} style={{ position: "absolute", inset: 0, width: w, height: h, objectFit: "cover", ...f }} />;
  const k = h / 1080;
  return <RV src={staticFile(s.src)} style={{ position: "absolute", left: -(s.x ?? 0) * k, top: 0, width: 1920 * k, height: h, ...f }} />;
};
/** 0→1 entrance from `at` (a soft spring) */
const useIn = (at: number, delay = 0) => {
  const f = useCurrentFrame();
  return spring({ frame: f - Math.round((at + delay) * 30), fps: 30, config: { damping: 18, mass: 0.7 } });
};
const Label: React.FC<{ text: string; bg: string; fg: string; size?: number; style?: React.CSSProperties }> = ({ text, bg, fg, size = 26, style }) => (
  <div style={{ position: "absolute", direction: "rtl", whiteSpace: "nowrap", fontFamily: kufiF, fontSize: size, color: fg, background: bg, padding: "6px 20px 10px", borderRadius: 10, boxShadow: "0 6px 16px rgba(0,0,0,.28)", ...style }}>{text}</div>
);

/* ── 1) orbital: two screens on slow concentric rings, a small header tag and his name under his screen */
export const DebateOrbital: React.FC<Props> = ({ main, guest, mainName = "محمد بن شمس الدين", guestName = "المقطع المردود عليه", title = "مناقشة", at = 0 }) => {
  const f = useCurrentFrame(), t = useT(at);
  const L = twoUp(guest, main, 150, 880);
  const gi = useIn(at), mi = useIn(at, 0.15);
  const cx = L.g.x + L.g.w + 35, cy = 515;
  const Screen: React.FC<{ b: Box; s: DebateSrc; p: number; glow: string }> = ({ b, s, p, glow }) => (
    <div style={{ position: "absolute", left: b.x, top: b.y, width: b.w, height: b.h, borderRadius: 26, overflow: "hidden", background: BRAND.ink,
      border: `3px solid ${alpha(BRAND.light, 0.85)}`, boxShadow: `0 0 0 10px ${alpha(BRAND.accent, 0.18)}, 0 24px 60px rgba(0,0,0,.45), 0 0 80px ${glow}`,
      opacity: p, transform: `scale(${0.9 + 0.1 * p})` }}><Feed s={s} w={b.w - 6} h={b.h - 6} /></div>
  );
  return (
    <AbsoluteFill>
      <WarmBase />
      {[560, 760].map((r, i) => (
        <svg key={r} width={r * 2} height={r * 2} style={{ position: "absolute", left: cx - r, top: cy - r, transform: `rotate(${(i ? -1 : 1) * f * 0.12}deg)`, opacity: 0.8 * gi }}>
          <circle cx={r} cy={r} r={r - 3} fill="none" stroke={alpha(BRAND.light, i ? 0.22 : 0.35)} strokeWidth={i ? 2 : 3} strokeDasharray={i ? "4 22" : "120 40 8 40"} />
          <circle cx={r + (r - 3) * Math.cos(f / 60 + i * 2)} cy={r + (r - 3) * Math.sin(f / 60 + i * 2)} r={i ? 6 : 9} fill={BRAND.accent} />
        </svg>
      ))}
      <Screen b={L.g} s={guest} p={gi} glow={alpha(BRAND.blue, 0.25)} />
      <Screen b={L.m} s={main} p={mi} glow={alpha(BRAND.accent, 0.2)} />
      <Label text={guestName} bg={BRAND.navy} fg={BRAND.card} style={{ left: L.g.x + 24, top: L.g.y - 22, opacity: gi }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 58, textAlign: "center", fontFamily: monoF, fontSize: 22, letterSpacing: 6, color: alpha(BRAND.light, 0.9), opacity: interpolate(t, [0.2, 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        <span style={{ fontFamily: kufiF, letterSpacing: 0, fontSize: 28 }}>{title}</span>{"  /  02"}
      </div>
      <Label text={mainName} bg={BRAND.card} fg={BRAND.ink} size={28} style={{ left: L.m.x + L.m.w / 2, top: L.m.y + L.m.h + 26, transform: "translateX(-50%)", opacity: mi }} />
    </AbsoluteFill>
  );
};

/* ── 2) dossier: a case-file sheet, the two screens clipped on it as photos, a tape strip, the «مُسجَّل» stamp and the file label */
export const DebateDossier: React.FC<Props> = ({ main, guest, mainName = "محمد بن شمس الدين", guestName = "المقطع المردود عليه", title = "ملف النقاش", at = 0 }) => {
  const t = useT(at);
  const L = twoUp(guest, main, 175, 845, 150, 80);
  const sheet = useIn(at), gi = useIn(at, 0.12), mi = useIn(at, 0.24);
  const st = interpolate(t, [0.7, 0.85], [2.2, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), so = interpolate(t, [0.7, 0.76], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const Photo: React.FC<{ b: Box; s: DebateSrc; p: number; rot: number; name: string }> = ({ b, s, p, rot, name }) => (
    <div style={{ position: "absolute", left: b.x - 14, top: b.y - 14, width: b.w + 28, height: b.h + 70, background: BRAND.card, borderRadius: 6, boxShadow: "0 16px 30px rgba(0,0,0,.32)",
      transform: `rotate(${rot}deg) translateY(${(1 - p) * 40}px)`, opacity: p }}>
      <div style={{ position: "absolute", left: 14, top: 14, width: b.w, height: b.h, overflow: "hidden", background: BRAND.ink }}><Feed s={s} w={b.w} h={b.h} /></div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 10, textAlign: "center", direction: "rtl", fontFamily: kufiF, fontSize: 26, color: BRAND.ink }}>{name}</div>
    </div>
  );
  return (
    <AbsoluteFill>
      <WarmBase />
      <div style={{ position: "absolute", left: 70, top: 60, width: W - 140, height: H - 150, background: BRAND.paper, borderRadius: 8, transform: `rotate(-0.6deg) scale(${0.96 + 0.04 * sheet})`, opacity: sheet,
        boxShadow: "0 30px 70px rgba(0,0,0,.45)", backgroundImage: `repeating-linear-gradient(0deg, transparent 0 46px, ${alpha(BRAND.accent, 0.12)} 46px 48px)` }}>
        <div style={{ position: "absolute", right: 60, top: 26, direction: "rtl", fontFamily: kufiF, fontSize: 40, color: BRAND.ink }}>{title}</div>
        <div style={{ position: "absolute", left: 60, top: 38, fontFamily: monoF, fontSize: 20, letterSpacing: 4, color: BRAND.gray }}>FILE No. 02</div>
        <div style={{ position: "absolute", left: 60, right: 60, top: 92, height: 3, background: alpha(BRAND.ink, 0.5) }} />
      </div>
      <Photo b={L.g} s={guest} p={gi} rot={-1.4} name={guestName} />
      <Photo b={L.m} s={main} p={mi} rot={1.2} name={mainName} />
      <div style={{ position: "absolute", left: L.g.x + L.g.w / 2 - 110, top: L.g.y - 40, width: 220, height: 50, background: alpha(BRAND.light, 0.78), transform: "rotate(-4deg)", opacity: gi, boxShadow: "0 3px 6px rgba(0,0,0,.15)" }} />
      <div style={{ position: "absolute", left: L.m.x + L.m.w - 200, top: L.m.y + L.m.h + 72, transform: `rotate(-12deg) scale(${st})`, opacity: so * 0.92,
        border: `6px solid ${BRAND.mark}`, color: BRAND.mark, borderRadius: 12, padding: "4px 26px 12px", fontFamily: kufiF, fontSize: 46, direction: "rtl" }}>مُسجَّل</div>
    </AbsoluteFill>
  );
};

/* ── 3) sculpted blocks: each screen sits in an extruded block, a stepped title block on top (SculptedBlocks07 shape) */
export const DebateBlocks: React.FC<Props> = ({ main, guest, mainName = "محمد بن شمس الدين", guestName = "المقطع المردود عليه", title = "الشيخ محمد بن شمس الدين — مع المتحدث", at = 0 }) => {
  const L = twoUp(guest, main, 200, 870);
  const ti = useIn(at), gi = useIn(at, 0.1), mi = useIn(at, 0.2);
  const depth = (n: number, c: string) => Array.from({ length: n }, (_, i) => `${i + 1}px ${i + 1}px 0 ${c}`).join(",");
  const Block: React.FC<{ b: Box; s: DebateSrc; p: number; name: string; face: string }> = ({ b, s, p, name, face }) => (
    <div style={{ position: "absolute", left: b.x - 18, top: b.y - 18, width: b.w + 36, height: b.h + 36, background: face, borderRadius: 18,
      boxShadow: `${depth(16, BRAND.navyDeep)}, 30px 34px 50px rgba(0,0,0,.4)`, transform: `translateY(${(1 - p) * 60}px)`, opacity: p }}>
      <div style={{ position: "absolute", left: 18, top: 18, width: b.w, height: b.h, borderRadius: 8, overflow: "hidden", background: BRAND.ink, boxShadow: `inset 0 0 0 2px ${alpha(BRAND.ink, 0.4)}` }}><Feed s={s} w={b.w} h={b.h} /></div>
      <Label text={name} bg={BRAND.navy} fg={BRAND.card} style={{ right: 30, top: b.h + 50 }} />
    </div>
  );
  return (
    <AbsoluteFill>
      <WarmBase />
      <div style={{ position: "absolute", left: "50%", top: 58, transform: `translateX(-50%) translateY(${(1 - ti) * -40}px)`, opacity: ti, direction: "rtl", whiteSpace: "nowrap",
        background: BRAND.accent, color: BRAND.card, fontFamily: kufiF, fontSize: 40, padding: "10px 40px 18px", borderRadius: 14, boxShadow: `${depth(10, BRAND.accentDeep)}, 16px 20px 30px rgba(0,0,0,.35)` }}>{title}</div>
      <Block b={L.g} s={guest} p={gi} name={guestName} face={BRAND.light} />
      <Block b={L.m} s={main} p={mi} name={mainName} face={BRAND.card} />
    </AbsoluteFill>
  );
};

export const DEBATE_LAYOUTS: Record<DebateLayoutName, React.FC<Props>> = { orbital: DebateOrbital, dossier: DebateDossier, blocks: DebateBlocks };
/** the pasted call shape: <SculptedBlocks07 mainSrc guestSrc title /> (paths relative to public/, or staticFile URLs) */
export const SculptedBlocks07: React.FC<{ mainSrc: string; guestSrc: string; title?: string }> = ({ mainSrc, guestSrc, title }) => {
  const rel = (s: string) => s.replace(/^.*\/public\//, "").replace(/^\//, "");
  return <DebateBlocks main={{ src: rel(mainSrc) }} guest={{ src: rel(guestSrc) }} title={title} />;
};
