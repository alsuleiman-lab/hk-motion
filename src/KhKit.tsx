import React from "react";
import { AbsoluteFill, Img, getInputProps, getRemotionEnvironment, continueRender, delayRender, Easing, interpolate, OffthreadVideo, spring, staticFile, useCurrentFrame, Video } from "remotion";
import { SafeVideo } from "./SafeMedia";
import { Pic, TITLE, TEXT } from "./EuKit";
import { DrawIcon } from "./MotionKit";
import { FLOOR, Mosque, PaperDefs, Skyline, Tomb } from "./KhPaper";
import { Gfx } from "./MG";
import { BRAND, currentStars } from "./brand";

/** Pieces of the «تصحيح الحديث بالكشف الصوفي» montage. Everything that is VIDEO or BACKGROUND lives here (outside <Gfx>); overlays are in KashfHadith.tsx. */
export const FPS = 30;
/** frame-exact video for the final render (OffthreadVideo: no stale frames → no judder; user rule 2026-10-22 «الفيديو يرتجف»), forgiving SafeVideo in the Studio */
const FRAMES = (getInputProps() as { frames?: boolean }).frames === true;   // render from pre-extracted JPEG frames (public/kh/fr, tools/kh_frames.sh): no video decoding, exact frame, scales with concurrency
const FrameImg: React.FC<{ startFrom: number; style?: React.CSSProperties }> = ({ startFrom, style }) => {
  const n = Math.min(24949, startFrom + useCurrentFrame());   // the composition has 24951 frames, the video 24950
  return <Img src={staticFile(`kh/fr/f_${String(n).padStart(6, "0")}.jpg`)} style={style} />;
};
const NOVIDEO = (getInputProps() as { noVideo?: boolean }).noVideo === true;   // benchmark switch: no video decoding at all
export const KhVideo: React.FC<{ src: string; startFrom?: number; muted?: boolean; style?: React.CSSProperties }> = ({ src, startFrom, muted = true, style }) =>
  NOVIDEO ? null : FRAMES && getRemotionEnvironment().isRendering ? <FrameImg startFrom={startFrom ?? 0} style={style} /> : getRemotionEnvironment().isRendering ? <OffthreadVideo src={src} startFrom={startFrom} muted={muted} style={style} /> : <SafeVideo src={src} startFrom={startFrom} muted={muted} style={style} />;
export const sec = (t: number) => Math.round(t * FPS);
export const VID = "kh_cut_s.mp4";
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = (x: number) => Easing.bezier(0.45, 0, 0.15, 1)(clamp(x));

export type Crop = { x: number; y: number; w: number; h: number };
/** geometry of the recorded split-screen (1920x1080): panel left, the Sheikh right */
export const GEO = {
  clip: { panel: { x: 97, y: 0, w: 718, h: 954 } as Crop, spk: { x: 815, y: 0, w: 1105, h: 1080 } as Crop },
  book: { panel: { x: 82, y: 92, w: 753, h: 870 } as Crop, spk: { x: 935, y: 0, w: 985, h: 1080 } as Crop },
  full: { spk: { x: 540, y: 0, w: 840, h: 1080 } as Crop },
};

/** a window of the base video (frame `from` = cut-timeline start of the Sequence) shown cropped and scaled */
export const CropView: React.FC<{ crop: Crop; scale: number; from: number; style?: React.CSSProperties }> = ({ crop, scale, from, style }) => (
  <div style={{ position: "relative", width: crop.w * scale, height: crop.h * scale, overflow: "hidden", ...style }}>
    <KhVideo src={staticFile(VID)} startFrom={from} muted style={{ position: "absolute", left: -crop.x * scale, top: -crop.y * scale, width: 1920 * scale, height: 1080 * scale, maxWidth: "none" }} />
  </div>
);

const STAR = `<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'><g fill='none' stroke='#f3e3c0' stroke-width='1.6'><path d='M70 8 L84 40 L116 26 L102 58 L134 70 L102 82 L116 114 L84 100 L70 132 L56 100 L24 114 L38 82 L6 70 L38 58 L24 26 L56 40 Z'/><circle cx='70' cy='70' r='14'/></g></svg>`;

/** decorated calm-blue background (never black / plain): gradient + slowly drifting star lattice + vignette */
export const KhBg: React.FC<{ a?: string; b?: string; c?: string; star?: number }> = ({ a: a0, b: b0, c: c0, star = 0.16 }) => {
  const f = useCurrentFrame(), [da, db, dc] = currentStars(), a = a0 ?? da, b = b0 ?? db, c = c0 ?? dc;   // default colours follow the video's palette
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(135deg, ${a}, ${b} 52%, ${c})` }} />
      <AbsoluteFill style={{ backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(STAR)}")`, backgroundSize: "140px 140px", backgroundPosition: `${f * 0.25}px ${f * 0.15}px`, opacity: star }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(20,14,8,.30) 100%)" }} />
    </AbsoluteFill>
  );
};

const FRAME: React.CSSProperties = { borderRadius: 26, overflow: "hidden", border: "7px solid #f6ecd3", boxShadow: "0 18px 48px rgba(20,12,4,.6)" };

/** recomposition of a recorded split-screen window: designed background + the panel (clip / page) on the left + the Sheikh on the right; panel breathes slowly */
export const SplitView: React.FC<{ type: "clip" | "book"; from: number; dur: number; bg?: [string, string, string]; overlay?: React.ReactNode }> = ({ type, from, dur, bg, overlay }) => {
  const f = useCurrentFrame();
  const g = GEO[type], PAD = 48, STRIP = 112, H = 1080 - PAD * 2;
  const sk = H / g.spk.h, spkW = g.spk.w * sk;
  const zoneW = 1920 - spkW - PAD * 3, pk = Math.min(zoneW / g.panel.w, (H - STRIP) / g.panel.h) * 0.97;
  const pW = g.panel.w * pk, pH = g.panel.h * pk;
  const per = 3.4 * FPS, k = Math.floor(f / per), m = ease((f - k * per) / 28);
  const V = [{ s: 1.0, dy: 0, r: 0 }, { s: 1.03, dy: -10, r: -0.7 }, { s: 1.015, dy: 12, r: 0.6 }, { s: 1.035, dy: 0, r: 0.4 }];
  const cur = V[k % V.length], prev = V[(k + V.length - 1) % V.length];
  const mm = k === 0 ? 1 : m;
  const vs = prev.s + (cur.s - prev.s) * mm, vdy = prev.dy + (cur.dy - prev.dy) * mm, vr = prev.r + (cur.r - prev.r) * mm;
  void dur;
  return (
    <AbsoluteFill>
      <KhBg a={bg?.[0]} b={bg?.[1]} c={bg?.[2]} />
      <div style={{ position: "absolute", left: PAD + (zoneW - pW) / 2, top: PAD + STRIP + (H - STRIP - pH) / 2, transform: `translateY(${vdy}px) rotate(${vr}deg) scale(${vs})`, ...FRAME, background: "#fff" }}>
        <CropView crop={g.panel} scale={pk} from={from} />
        {overlay ? <Gfx><div style={{ position: "absolute", left: -g.panel.x * pk, top: -g.panel.y * pk, width: 1920, height: 1080, transform: `scale(${pk})`, transformOrigin: "0 0" }}>{overlay}</div></Gfx> : null}
      </div>
      <div style={{ position: "absolute", right: PAD, top: PAD, ...FRAME, borderRadius: 30 }}>
        <CropView crop={g.spk} scale={sk} from={from} />
      </div>
    </AbsoluteFill>
  );
};

/** the Sheikh as a card (recording cropped around him) on a decorated background. R-COMP-SHEIKH.1: his card covers >= 40 % of the screen area, so the scale is derived from the crop;
 *  R-COMP-SHEIKH.3: the free zone beside him is FILLED (`fill`: a photo / paper illustration), the graphics go on top of it. */
export const cardGeom = (crop: Crop = GEO.full.spk) => {
  const need = Math.sqrt((0.405 * 1920 * 1080) / (crop.w * crop.h));
  const s = Math.min(Math.max(need, 984 / crop.h), 1030 / crop.h);
  const w = crop.w * s, h = crop.h * s;
  return { s, w, h, top: (1080 - h) / 2 };
};
export const cardZone = (side: "right" | "left" = "right", crop?: Crop) => {
  const g = cardGeom(crop);
  return side === "right" ? { x: 40, y: 40, w: 1920 - 40 - g.w - 40 - 40, h: 1000 } : { x: 40 + g.w + 40, y: 40, w: 1920 - 40 - g.w - 40 - 40, h: 1000 };
};
export const CardView: React.FC<{ from: number; side?: "right" | "left"; bg?: [string, string, string]; crop?: Crop; fill?: (z: { w: number; h: number }) => React.ReactNode; hideSpeaker?: boolean }> = ({ from, side = "right", bg, crop, fill, hideSpeaker }) => {
  const c = crop ?? GEO.full.spk, g = cardGeom(c);
  const left = side === "right" ? 1920 - 40 - g.w : 40, z = cardZone(side, crop);
  return (
    <AbsoluteFill>
      <KhBg a={bg?.[0]} b={bg?.[1]} c={bg?.[2]} />
      {fill ? <div style={{ position: "absolute", left: z.x, top: z.y, width: z.w, height: z.h, ...FRAME, background: "#2a3f58" }}>{fill({ w: z.w - 14, h: z.h - 14 })}</div> : null}
      {hideSpeaker ? null : <div style={{ position: "absolute", left, top: g.top, ...FRAME, borderRadius: 30 }}>
        <CropView crop={c} scale={g.s} from={from} />
      </div>}
    </AbsoluteFill>
  );
};
/** a 1920x1080 illustration scaled to COVER a zone (the illustrations are drawn in the left ~1100 px, so the zone shows that part) */
export const ZoneStage: React.FC<{ w: number; h: number; children: React.ReactNode }> = ({ w, h, children }) => {
  const k = Math.max(w / 1920, h / 1080);
  return <div style={{ position: "relative", width: w, height: h, overflow: "hidden" }}><div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${k})`, transformOrigin: "0 0" }}>{children}</div></div>;
};
/** a photo that covers a zone, dimmed so the chips on top stay readable */
export const ZoneImg: React.FC<{ w: number; h: number; src: string; pos?: string; dim?: number; zoom?: number }> = ({ w, h, src, pos = "50% 40%", dim = 0.28, zoom = 1 }) => (
  <div style={{ position: "relative", width: w, height: h, overflow: "hidden" }}>
    <Pic src={src} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, transform: zoom !== 1 ? `scale(${zoom})` : undefined, transformOrigin: pos }} />
    <AbsoluteFill style={{ background: `linear-gradient(135deg, rgba(34,58,88,${dim}), rgba(60,44,30,${dim}))` }} />
  </div>
);
/** a scholar from the user's library (R-IMG-SCHOLAR): picture + the NAME in a strip UNDER it (never over the face) */
export const ScholarCard: React.FC<{ file: string; name: string; w: number; rot?: number; style?: React.CSSProperties }> = ({ file, name, w, rot = 0, style }) => {
  const h = (w * 1402) / 1122, strip = Math.max(54, w * 0.15);
  return (
    <div style={{ boxSizing: "content-box", width: w, height: h + strip, transform: `rotate(${rot}deg)`, borderRadius: 20, overflow: "hidden", border: "8px solid #f6ecd3", boxShadow: "0 20px 46px rgba(15,10,6,.55)", background: "#efe3c8", ...style }}>
      <Pic src={`scholar_images/${file}`} style={{ display: "block", width: w, height: h, objectFit: "cover" }} />
      <div style={{ height: strip, display: "flex", alignItems: "center", justifyContent: "center", background: "#3a2a1f", color: "#fff4d6", fontFamily: TITLE, fontWeight: 800, fontSize: Math.round(strip * 0.55), direction: "rtl" }}>{name}</div>
    </div>
  );
};
/** the picks made once for this video (random; the same scholar keeps the same picture, R-IMG-SCHOLAR.3) — .tmp/kh/scholar_picks.json */
export const SCHOLAR = {
  "الترمذي": "general/scholar_07.png", "أبو حنيفة": "general/scholar_03.png", "مسلم": "general/scholar_02.png",
  "الشعراني": "sufi_ashari/sa_03.png", "السيوطي": "sufi_ashari/sa_05.png",
} as const;

/** isolated Sheikh (alpha webm built by tools/kh_iso.sh) over a topic background, full frame */
export const IsoView: React.FC<{ src: string; children?: React.ReactNode }> = ({ src, children }) => (
  <AbsoluteFill>
    {children}
    <Video src={staticFile(src)} muted style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transform: "translate(300px, 90px) scale(1.06)", transformOrigin: "100% 100%" }} />
  </AbsoluteFill>
);

/** picture frame with a thin cream border, used for photos / manuscripts / covers */
export const Photo: React.FC<{ src: string; w: number; h: number; pos?: string; rot?: number; fit?: "cover" | "contain"; cap?: string; zoom?: number; style?: React.CSSProperties }> = ({ src, w, h, pos = "50% 30%", rot = 0, fit = "cover", cap, zoom = 1, style }) => (
  <div style={{ width: w, height: h, transform: `rotate(${rot}deg)`, borderRadius: 20, overflow: "hidden", border: "8px solid #f6ecd3", boxShadow: "0 20px 46px rgba(15,10,6,.55)", background: "#efe3c8", position: "relative", ...style }}>
    <Pic src={src} style={{ width: "100%", height: "100%", objectFit: fit, objectPosition: pos, transform: zoom !== 1 ? `scale(${zoom})` : undefined, transformOrigin: pos }} />
    {cap ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "6px 14px 10px", background: "rgba(24,16,8,.72)", color: "#fff4d6", fontFamily: TITLE, fontWeight: 800, fontSize: 30, textAlign: "center", direction: "rtl" }}>{cap}</div> : null}
  </div>
);

/** a big hand-weight word on a background (for hook backgrounds that explain the sentence) */
export const BigIcon: React.FC<{ name: string; label: string; at?: number; size?: number; color?: string }> = ({ name, label, at = 0, size = 300, color = "#ffe9a0" }) => {
  const f = useCurrentFrame();
  const p = spring({ frame: f - sec(at), fps: FPS, config: { damping: 14, stiffness: 120 } });
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, opacity: clamp(p * 1.6), transform: `scale(${0.85 + 0.15 * p})` }}>
      <DrawIcon name={name} p={clamp(p)} size={size} color={color} sw={1.3} glow={14} />
      <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 66, color: "#fff", direction: "rtl", textAlign: "center", textShadow: "0 6px 18px rgba(0,0,0,.4)" }}>{label}</div>
    </div>
  );
};

/* ───────────────────── paper cut-out teleport scene (Cairo → Medina → Cairo), user's note to the editor ───────────────────── */
const PAPER = "#f3ead3";
const Grain: React.FC = () => (
  <AbsoluteFill style={{ opacity: 0.22, mixBlendMode: "multiply" }}>
    <svg width="100%" height="100%"><filter id="khg"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" /><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0" /></filter><rect width="100%" height="100%" filter="url(#khg)" /></svg>
  </AbsoluteFill>
);
/** halftone dot fill for paper pieces */
const dots = (c: string) => `radial-gradient(${c} 22%, transparent 24%)`;

export const Cairo: React.FC<{ x: number; w: number }> = ({ x, w }) => (
  <svg style={{ position: "absolute", left: x, bottom: 0 }} width={w} height={w * 0.62} viewBox="0 0 1000 620">
    <g stroke={PAPER} strokeWidth="9" strokeLinejoin="round">
      <rect x="40" y="330" width="170" height="290" fill="#a9552f" /><rect x="40" y="330" width="170" height="30" fill="#8f4424" stroke="none" />
      <rect x="250" y="420" width="260" height="200" fill="#c9824a" />
      <path d="M270 420 Q380 300 490 420Z" fill="#b87038" />
      <rect x="320" y="150" width="40" height="190" fill="#c9824a" /><path d="M312 150 L340 70 L368 150Z" fill="#8f4424" /><rect x="326" y="170" width="28" height="9" fill={PAPER} stroke="none" /><rect x="326" y="200" width="28" height="9" fill={PAPER} stroke="none" />
      <rect x="560" y="390" width="190" height="230" fill="#a9552f" />
      <rect x="600" y="200" width="36" height="200" fill="#c9824a" /><path d="M594 200 L618 130 L642 200Z" fill="#8f4424" />
      <rect x="780" y="350" width="180" height="270" fill="#c9824a" />
      <rect x="810" y="390" width="30" height="46" fill={PAPER} stroke="none" /><rect x="880" y="390" width="30" height="46" fill={PAPER} stroke="none" />
    </g>
    <circle cx="120" cy="120" r="54" fill="#f3c34a" stroke={PAPER} strokeWidth="8" />
  </svg>
);
const Medina: React.FC<{ x: number; w: number }> = ({ x, w }) => (
  <svg style={{ position: "absolute", left: x, bottom: 0 }} width={w} height={w * 0.62} viewBox="0 0 1000 620">
    <g stroke={PAPER} strokeWidth="9" strokeLinejoin="round">
      <rect x="120" y="360" width="760" height="260" fill="#e1c88f" />
      <rect x="120" y="360" width="760" height="40" fill="#cfae68" stroke="none" />
      <path d="M380 360 Q380 200 500 200 Q620 200 620 360Z" fill="#5f9a6a" />
      <rect x="494" y="120" width="12" height="90" fill="#e1c88f" /><circle cx="500" cy="112" r="16" fill="#f3c34a" />
      <rect x="150" y="150" width="46" height="230" fill="#e1c88f" /><path d="M140 150 L173 70 L206 150Z" fill="#5f9a6a" />
      <rect x="804" y="150" width="46" height="230" fill="#e1c88f" /><path d="M794 150 L827 70 L860 150Z" fill="#5f9a6a" />
      <rect x="260" y="430" width="44" height="190" fill={PAPER} stroke="none" /><rect x="470" y="430" width="60" height="190" fill={PAPER} stroke="none" /><rect x="696" y="430" width="44" height="190" fill={PAPER} stroke="none" />
    </g>
  </svg>
);

/** funny paper cartoon (turban + beard, eyes shut / open) — a cartoon, not a real face */
const Cartoon: React.FC<{ eyes: "open" | "shut"; mood: "puzzled" | "happy"; scale?: number }> = ({ eyes, mood, scale = 1 }) => (
  <svg width={300 * scale} height={420 * scale} viewBox="0 0 300 420" style={{ overflow: "visible" }}>
    <g stroke={PAPER} strokeWidth="8" strokeLinejoin="round" strokeLinecap="round">
      <path d="M70 250 Q150 220 230 250 L250 410 L50 410Z" fill="#8a5a2e" />
      <path d="M110 250 L190 250 L170 300 L130 300Z" fill="#f3e6c4" stroke="none" />
      <ellipse cx="150" cy="170" rx="88" ry="96" fill="#e9b88a" />
      <path d="M72 190 Q150 400 228 190 Q190 280 150 280 Q110 280 72 190Z" fill="#3a2a1f" />
      <path d="M58 140 Q150 20 242 140 Q150 100 58 140Z" fill="#fff8e6" />
      <ellipse cx="150" cy="104" rx="96" ry="40" fill="#fff8e6" />
      <path d="M62 126 Q150 156 238 126" fill="none" stroke="#d9c9a0" strokeWidth="6" />
    </g>
    {eyes === "open" ? null : (
      <g fill="none" stroke="#3a2a1f" strokeWidth="8" strokeLinecap="round"><path d="M92 170 Q116 190 140 170" /><path d="M160 170 Q184 190 208 170" /></g>
    )}
    {mood === "happy" ? <path d="M118 232 Q150 262 182 232" fill="#fff" stroke="#3a2a1f" strokeWidth="6" strokeLinecap="round" /> : <path d="M122 240 Q150 226 178 240" fill="none" stroke="#3a2a1f" strokeWidth="6" strokeLinecap="round" />}
    {eyes === "open" ? null : <g fill="none" stroke="#3a2a1f" strokeWidth="6" strokeLinecap="round"><path d="M96 136 Q116 124 136 136" /><path d="M164 136 Q184 124 204 136" /></g>}
  </svg>
);

/**
 * «أغمض عيني فلا أجد نفسي إلا عند الروضة الشريفة ثم أرجع في نفس اللحظة إلى القاهرة» — a stop-motion paper-cut cartoon (flat coloured floors, halftone dots,
 * hold–sprint–impact moves like Sakuga). Times (seconds) are relative to the scene start; `T` = {shut, medina, ask, back}.
 */
export const PaperTeleport: React.FC<{ T: { shut: number; medina: number; ask: number; back: number; end: number } }> = ({ T }) => {
  const fr = useCurrentFrame();
  const q = Math.floor(fr / 3) * 3, t = q / FPS;                         // stop-motion: 10 poses per second
  const sprint = 0.42;
  const ph = t < T.shut ? 0 : t < T.medina ? 1 : t < T.back ? 2 : 3;
  const inMedina = t >= T.medina && t < T.back + 0.0;
  const to = ph === 1 ? clamp((t - T.shut) / (T.medina - T.shut)) : 0;
  const back = clamp((t - T.back) / sprint);
  // figure position on the paper (x of its centre); Cairo left (x=560), Medina right (x=1360)
  const CX = 520, MX = 1400;
  let px = CX, py = 640, rot = 0, sx = 1, sy = 1, smear = 0;
  const hop = (u: number) => -Math.abs(Math.sin(u * Math.PI * 4)) * 36;
  if (t < T.shut) { py += hop(t * 0.4) * 0.4 + (Math.floor(t * 3) % 2 ? -6 : 6); rot = Math.floor(t * 4) % 2 ? 3 : -3; }
  else if (t < T.medina) {
    // closed-eyes beat: squash, then a fast sprint along an arc (3 frames hold / smear)
    const u = clamp((t - T.shut) / Math.max(0.2, T.medina - T.shut));
    if (u < 0.35) { sx = 1 + 0.12 * (u / 0.35); sy = 1 - 0.12 * (u / 0.35); px = CX - 30 * (u / 0.35); }
    else { const s = ease((u - 0.35) / 0.65); px = CX - 30 + (MX - CX + 30) * s; py = 640 - Math.sin(s * Math.PI) * 360; rot = (1 - s) * -24 + s * 0; smear = Math.sin(s * Math.PI); }
  } else if (t < T.back) { px = MX; py = 640 + (Math.floor(t * 3) % 2 ? -5 : 5); rot = Math.floor(t * 4) % 2 ? -2 : 2; }
  else { const s = ease(back); px = MX + (CX - MX) * s; py = 640 - Math.sin(s * Math.PI) * 300; rot = s * 18; smear = Math.sin(s * Math.PI); }
  const eyesShut = t >= T.shut && t < T.back + 0.05 && !(t >= T.medina + 0.9 && t < T.ask);
  const medinaFade = clamp((t - (T.shut + 0.25)) / 0.3) * (t < T.back + sprint * 0.5 ? 1 : 1 - clamp((t - (T.back + sprint * 0.5)) / 0.3));
  const seesLight = t >= T.ask && t < T.back;
  void to; void inMedina;
  return (
    <AbsoluteFill style={{ background: "#d9b27a" }}>
      {/* floors: Cairo sand, Medina dusty blue sky (flat paper colours) */}
      <PaperDefs /><AbsoluteFill style={{ background: FLOOR.orange }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: dots("rgba(120,70,30,.22)"), backgroundSize: "26px 26px" }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, background: FLOOR.mustard, opacity: medinaFade, clipPath: `polygon(${1920 - 1920 * medinaFade}px 0, 1920px 0, 1920px 1080px, ${1920 - 1920 * medinaFade}px 1080px)` }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: medinaFade, backgroundImage: dots("rgba(255,255,255,.28)"), backgroundSize: "26px 26px", clipPath: `polygon(${1920 - 1920 * medinaFade}px 0, 1920px 0, 1920px 1080px, ${1920 - 1920 * medinaFade}px 1080px)` }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 150, background: "#2a1d14" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, height: 14, background: PAPER }} />
      <div style={{ position: "absolute", left: 30, bottom: 150, width: 820, height: 530, filter: "drop-shadow(0 10px 0 rgba(40,20,8,.3))" }}><div style={{ width: "100%", height: "100%", filter: "url(#khRough)" }}><Skyline /></div></div>
      <div style={{ opacity: medinaFade }}><div style={{ position: "absolute", left: 1010, bottom: 150, width: 800, height: 615, filter: "drop-shadow(0 10px 0 rgba(40,20,8,.3))" }}><div style={{ width: "100%", height: "100%", filter: "url(#khRough)" }}><Mosque dome={FLOOR.rust} /></div></div></div>
      {t >= T.ask && t < T.back + 0.2 ? <div style={{ position: "absolute", left: 1560, bottom: 150, width: 300, height: 215, zIndex: 3, filter: "drop-shadow(0 8px 0 rgba(40,20,8,.3))" }}><div style={{ width: "100%", height: "100%", filter: "url(#khRough)" }}><Tomb accent={FLOOR.rust} /></div></div> : null}
      {/* captions as paper strips */}
      <PaperStrip at={0.2} until={T.shut} x={90} y={50} text="مسألة مشكلة؟ ← القاهرة" />
      <PaperStrip at={T.shut} until={T.medina + 0.2} x={90} y={50} text="يغمض عينيه…" rot={2} />
      <PaperStrip at={T.medina + 0.2} until={T.back} x={1010} y={50} text="المدينة المنورة · الروضة الشريفة" rot={-2} />
      <PaperStrip at={T.back} until={T.end} x={90} y={50} text="ويرجع في نفس اللحظة إلى القاهرة" rot={2} />
      {/* speed lines while sprinting */}
      {smear > 0.15 ? (
        <svg width="1920" height="1080" style={{ position: "absolute", inset: 0, opacity: smear }}>
          {[0, 1, 2, 3, 4, 5].map((i) => <line key={i} x1={px - 120 - i * 36} x2={px - 320 - i * 70} y1={py + 80 + i * 26} y2={py + 80 + i * 26} stroke={PAPER} strokeWidth={9} strokeLinecap="round" transform={ph === 3 ? `scale(-1,1) translate(${-1920 + 0},0)` : undefined} />)}
        </svg>
      ) : null}
      {seesLight ? (
        <div style={{ position: "absolute", left: MX - 180, top: 250, width: 360, textAlign: "center", fontFamily: TITLE, fontWeight: 800, fontSize: 110, color: "#f3c34a", textShadow: "0 0 40px rgba(243,195,74,.9)", opacity: clamp((t - T.ask) / 0.4) }}>ﷺ ؟</div>
      ) : null}
      <div style={{ position: "absolute", left: px - 150 * sx, top: py - 380 * sy, transform: `rotate(${rot}deg) scale(${sx * (1 + smear * 0.12)}, ${sy})`, transformOrigin: "50% 100%", filter: "drop-shadow(0 14px 0 rgba(60,35,12,.35))" }}>
        <Cartoon eyes={eyesShut ? "shut" : "open"} mood={ph >= 2 ? "happy" : "puzzled"} />
      </div>
      <Grain />
    </AbsoluteFill>
  );
};
const PaperStrip: React.FC<{ at: number; until: number; x: number; y: number; text: string; rot?: number }> = ({ at, until, x, y, text, rot = -2 }) => {
  const t = useCurrentFrame() / FPS;
  if (t < at || t > until) return null;
  const u = ease((t - at) / 0.25), o = ease((until - t) / 0.2);
  return (
    <div style={{ position: "absolute", left: x, top: y + (1 - u) * -40, opacity: Math.min(u, o), transform: `rotate(${rot}deg)`, background: PAPER, color: "#3a2a1f", borderRadius: 8, padding: "6px 30px 14px", boxShadow: "0 10px 0 rgba(60,35,12,.28)", fontFamily: TITLE, fontWeight: 800, fontSize: 46, direction: "rtl", border: "4px dashed #b87038" }}>{text}</div>
  );
};

export { TEXT, interpolate };



/**
 * Isolated Sheikh from a saved GREY MASK (tools/matte_gpu.py) — no alpha WebM (trial approved 2026-10-23 for windows B–E; the alpha WebM stays as the fallback in IsoView).
 * Pure CSS blend modes: group 1 = background × inverted mask; group 2 = the original video × mask, added on top (plus-lighter) → bg·(1−m) + person·m.
 * Person and mask get the SAME transform (the Sheikh sits to the right, leaving the left free for the background graphics). OffthreadVideo = frame-accurate while rendering
 * (measured: 0-frame offset on fast-motion frames, vs −3…+10 for the alpha WebM through <Video>). `from` = first frame of the window on the cut timeline; the mask file starts at that frame.
 */
const ISO_T: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transform: "translateX(300px) scale(0.96)", transformOrigin: "100% 100%" };
export const MaskedIso: React.FC<{ from: number; mask: string; children?: React.ReactNode }> = ({ from, mask, children }) => (
  <AbsoluteFill>
    <AbsoluteFill style={{ isolation: "isolate" }}>
      {children}
      <OffthreadVideo src={staticFile(mask)} muted style={{ ...ISO_T, filter: "invert(1)", mixBlendMode: "multiply" }} />
    </AbsoluteFill>
    <AbsoluteFill style={{ isolation: "isolate", mixBlendMode: "plus-lighter", clipPath: "inset(46px 0px 0px 380px)" }}>   {/* the transformed video rect starts at x=376.8, y=43.2: clipping 3 px inside removes the hairline where an anti-aliased edge keeps (1−coverage) of the room */}
      <OffthreadVideo src={staticFile(VID)} muted startFrom={from} style={ISO_T} />
      <OffthreadVideo src={staticFile(mask)} muted style={{ ...ISO_T, mixBlendMode: "multiply" }} />
    </AbsoluteFill>
  </AbsoluteFill>
);

/* ───────────── backgrounds behind the isolated Sheikh: ALWAYS a photo / illustration / video (user 2026-10-22: «يمنع العزل بدون خلفية…») ───────────── */
/** full-bleed real photo/manuscript, dimmed and slowly zooming, with a thin blue tint so the Sheikh and the chips stay readable */
export const PhotoBg: React.FC<{ src: string; pos?: string; dim?: number; zoom?: number }> = ({ src, pos = "50% 40%", dim = 0.5, zoom = 1 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#2a3f58" }}>
      <Pic src={src} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, transform: `scale(${(1.04 + f * 0.00012) * zoom})`, transformOrigin: pos, filter: "blur(2px) saturate(.9)" }} />
      <AbsoluteFill style={{ background: `linear-gradient(135deg, rgba(34,58,88,${dim + 0.1}), rgba(60,44,30,${dim}))` }} />
    </AbsoluteFill>
  );
};

/** paper-cut illustration floor (flat colour + halftone dots + grain) used under the vector illustrations */
const IllFloor: React.FC<{ color: string; dot?: string; children?: React.ReactNode }> = ({ color, dot = "rgba(255,255,255,.18)", children }) => (
  <AbsoluteFill style={{ background: color, overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: 0, backgroundImage: dots(dot), backgroundSize: "26px 26px" }} />
    {children}
    <Grain />
  </AbsoluteFill>
);
const PaperPerson: React.FC<{ x: number; y: number; s?: number; color?: string; rot?: number }> = ({ x, y, s = 1, color = "#8a5a2e", rot = 0 }) => (
  <svg style={{ position: "absolute", left: x, top: y, transform: `rotate(${rot}deg) scale(${s})`, transformOrigin: "50% 100%", filter: "drop-shadow(0 12px 0 rgba(40,25,10,.28))", overflow: "visible" }} width="180" height="300" viewBox="0 0 180 300">
    <g stroke={PAPER} strokeWidth="7" strokeLinejoin="round">
      <path d="M20 300 Q20 150 90 140 Q160 150 160 300Z" fill={color} />
      <circle cx="90" cy="82" r="52" fill="#e9b88a" />
      <path d="M38 74 Q90 4 142 74 Q90 52 38 74Z" fill="#fff8e6" />
    </g>
  </svg>
);
/** سلسلة الإسناد: a chain of paper people joined by a ribbon */
export const IllChain: React.FC<{ at?: number }> = ({ at = 0 }) => {
  const f = useCurrentFrame(), t = f / FPS - at;
  const n = 5;
  return (
    <IllFloor color="#c98a4b" dot="rgba(120,60,20,.22)">
      <div style={{ position: "absolute", left: 60, top: 640, width: 1060, height: 24, background: PAPER, borderRadius: 12, boxShadow: "0 8px 0 rgba(60,35,12,.25)" }} />
      {Array.from({ length: n }).map((_, i) => {
        const k = ease((t - i * 0.18) / 0.35);
        return <div key={i} style={{ opacity: k, transform: `translateY(${(1 - k) * 60}px)` }}><PaperPerson x={70 + i * 210} y={330} color={["#8a5a2e", "#a9552f", "#5d7ea0", "#8a5a2e", "#a9552f"][i]} rot={(i % 2 ? 1 : -1) * 2} /></div>;
      })}
      <div style={{ position: "absolute", left: 70, top: 120, background: PAPER, color: "#3a2a1f", borderRadius: 8, padding: "6px 30px 14px", fontFamily: TITLE, fontWeight: 800, fontSize: 70, direction: "rtl", border: "4px dashed #b87038", transform: "rotate(-2deg)", boxShadow: "0 10px 0 rgba(60,35,12,.28)" }}>سلسلة الأسانيد</div>
    </IllFloor>
  );
};
/** صحيح / ضعيف: a paper balance */
export const IllScales: React.FC<{ at?: number }> = ({ at = 0 }) => {
  const f = useCurrentFrame(), t = f / FPS - at;
  const tilt = Math.sin(t * 2.2) * 6 * ease(t / 0.6);
  return (
    <IllFloor color="#6d8fb5" dot="rgba(255,255,255,.2)">
      <svg width="1100" height="900" viewBox="0 0 1100 900" style={{ position: "absolute", left: 20, top: 90, filter: "drop-shadow(0 14px 0 rgba(20,40,70,.3))" }}>
        <g stroke={PAPER} strokeWidth="9" strokeLinejoin="round" strokeLinecap="round">
          <rect x="520" y="230" width="60" height="520" fill="#8a5a2e" />
          <rect x="360" y="740" width="380" height="60" fill="#a9552f" />
          <g transform={`rotate(${tilt} 550 230)`}>
            <rect x="130" y="212" width="840" height="36" rx="18" fill="#f3c34a" />
            <path d="M110 470 Q240 600 370 470Z" fill="#5f9a6a" /><path d="M810 470 Q940 600 1070 470Z" fill={BRAND.mark} />
            <path d="M170 400 l30 40 l70 -80" fill="none" stroke="#fff8e6" strokeWidth="14" />
            <path d="M880 380 l80 80 M960 380 l-80 80" fill="none" stroke="#fff8e6" strokeWidth="14" />
          </g>
        </g>
      </svg>
      <div style={{ position: "absolute", left: 20, top: 800, width: 1100, height: 100, fontFamily: TITLE, fontWeight: 800, fontSize: 64, color: "#fff4d6", textShadow: "0 6px 0 rgba(20,40,70,.35)" }}><span style={{ position: "absolute", left: 110, width: 300, textAlign: "center" }}>صحيح</span><span style={{ position: "absolute", left: 790, width: 300, textAlign: "center" }}>ضعيف</span></div>
    </IllFloor>
  );
};
/** a paper cartoon with closed eyes and a big question bubble */
export const IllQuestion: React.FC<{ text?: string }> = ({ text = "؟" }) => (
  <IllFloor color="#d9b27a" dot="rgba(120,70,30,.22)">
    <div style={{ position: "absolute", left: 120, top: 330, transform: "scale(1.15)", transformOrigin: "0 0" }}><Cartoon eyes="shut" mood="puzzled" /></div>
    <div style={{ position: "absolute", left: 470, top: 90, width: 520, height: 330, background: PAPER, borderRadius: 160, border: "5px dashed #b87038", boxShadow: "0 12px 0 rgba(60,35,12,.28)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: TITLE, fontWeight: 800, fontSize: text.length > 3 ? 78 : 220, color: "#3a2a1f", direction: "rtl", textAlign: "center", lineHeight: 1.1, padding: 30 }}>{text}</div>
  </IllFloor>
);
/** speech-bubble quotes: «نسمع كلامهم» */
export const IllQuotes: React.FC = () => (
  <IllFloor color="#8f7a9a" dot="rgba(255,255,255,.16)">
    {[{ x: 70, y: 150, r: -3, c: PAPER }, { x: 360, y: 470, r: 2, c: "#f3c34a" }].map((b, i) => (
      <div key={i} style={{ position: "absolute", left: b.x, top: b.y, width: 560, height: 280, background: b.c, borderRadius: 60, transform: `rotate(${b.r}deg)`, boxShadow: "0 12px 0 rgba(40,25,50,.3)", border: "5px dashed rgba(60,35,12,.4)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: TITLE, fontWeight: 800, fontSize: 220, color: "#3a2a1f", lineHeight: 0.9 }}>“</div>
    ))}
  </IllFloor>
);
/** a paper book with a closed eye above it: «تصحيح الحديث بالكشف» */
export const IllBookEye: React.FC = () => (
  <IllFloor color="#7da2c8" dot="rgba(255,255,255,.22)">
    <svg width="1000" height="800" viewBox="0 0 1000 800" style={{ position: "absolute", left: 40, top: 150, filter: "drop-shadow(0 14px 0 rgba(20,40,70,.3))" }}>
      <g stroke={PAPER} strokeWidth="9" strokeLinejoin="round" strokeLinecap="round">
        <path d="M80 560 L480 640 L480 330 L80 250Z" fill="#a9552f" /><path d="M920 560 L520 640 L520 330 L920 250Z" fill="#c9824a" />
        <path d="M130 300 L440 360 M130 360 L440 420 M130 420 L440 480" stroke="#f3e6c4" fill="none" strokeWidth="9" /><path d="M870 300 L560 360 M870 360 L560 420 M870 420 L560 480" stroke="#f3e6c4" fill="none" strokeWidth="9" />
        <path d="M300 150 Q500 250 700 150" fill="none" stroke="#3a2a1f" strokeWidth="16" /><path d="M360 110 l-26 -40 M500 130 l0 -50 M640 110 l26 -40" fill="none" stroke="#3a2a1f" strokeWidth="12" />
      </g>
    </svg>
  </IllFloor>
);
/** the cartoon with closed eyes in Medina (paper illustration) */
export const IllMedinaEyes: React.FC<{ eyes?: "open" | "shut" }> = ({ eyes = "shut" }) => (
  <AbsoluteFill style={{ background: "#7da2c8", overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: 0, backgroundImage: dots("rgba(255,255,255,.28)"), backgroundSize: "26px 26px" }} />
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 150, background: "#8f6a3c" }} />
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, height: 14, background: PAPER }} />
    <Medina x={-40} w={1000} />
    <div style={{ position: "absolute", left: 300, top: 250 }}><Cartoon eyes={eyes} mood={eyes === "open" ? "puzzled" : "happy"} scale={1.1} /></div>
    <Grain />
  </AbsoluteFill>
);

/* ───────────── MaskedVideo: the original video + a SAVED gray matte video combined in WebGL (no transparent WebM) ─────────────
 * Both videos are the master's own frames (the matte has the master's frame index, see tools/matte_gpu.py), so they are frame-exact by construction.
 * Inside <Sequence>: `startFrom` = master frame that plays at this Sequence's first frame (same value for both videos).
 * During Studio playback the canvas is redrawn every animation frame; during a render every frame holds a delayRender until BOTH videos have really seeked to the frame. */
export const MaskedVideo: React.FC<{ src: string; mask: string; startFrom: number; style?: React.CSSProperties }> = ({ src, mask, startFrom, style }) => {
  const frame = useCurrentFrame();
  const cRef = React.useRef<HTMLCanvasElement>(null);
  const vRef = React.useRef<HTMLVideoElement>(null);
  const mRef = React.useRef<HTMLVideoElement>(null);
  const gl = React.useRef<{ ctx: WebGLRenderingContext; tex: WebGLTexture[] } | null>(null);
  const want = (startFrom + frame) / FPS;

  const draw = React.useCallback(() => {
    const c = cRef.current, v = vRef.current, m = mRef.current;
    if (!c || !v || !m || v.readyState < 2 || m.readyState < 2) return false;
    let g = gl.current;
    if (!g) {
      const ctx = c.getContext("webgl", { premultipliedAlpha: true, alpha: true, preserveDrawingBuffer: true }) as WebGLRenderingContext | null;
      if (!ctx) return false;
      const sh = (t: number, s: string) => { const o = ctx.createShader(t)!; ctx.shaderSource(o, s); ctx.compileShader(o); return o; };
      const p = ctx.createProgram()!;
      ctx.attachShader(p, sh(ctx.VERTEX_SHADER, "attribute vec2 a;varying vec2 u;void main(){u=vec2((a.x+1.)/2.,(1.-a.y)/2.);gl_Position=vec4(a,0.,1.);}"));
      ctx.attachShader(p, sh(ctx.FRAGMENT_SHADER, "precision mediump float;varying vec2 u;uniform sampler2D c;uniform sampler2D m;void main(){vec3 k=texture2D(c,u).rgb;float a=texture2D(m,u).r;gl_FragColor=vec4(k*a,a);}"));
      ctx.linkProgram(p); ctx.useProgram(p);
      const b = ctx.createBuffer(); ctx.bindBuffer(ctx.ARRAY_BUFFER, b); ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), ctx.STATIC_DRAW);
      const loc = ctx.getAttribLocation(p, "a"); ctx.enableVertexAttribArray(loc); ctx.vertexAttribPointer(loc, 2, ctx.FLOAT, false, 0, 0);
      const tex = [0, 1].map((i) => { const t = ctx.createTexture()!; ctx.activeTexture(ctx.TEXTURE0 + i); ctx.bindTexture(ctx.TEXTURE_2D, t);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR); ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE); ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE); return t; });
      ctx.uniform1i(ctx.getUniformLocation(p, "c"), 0); ctx.uniform1i(ctx.getUniformLocation(p, "m"), 1);
      g = gl.current = { ctx, tex };
    }
    const { ctx, tex } = g;
    ctx.viewport(0, 0, c.width, c.height); ctx.clearColor(0, 0, 0, 0); ctx.clear(ctx.COLOR_BUFFER_BIT);
    ctx.activeTexture(ctx.TEXTURE0); ctx.bindTexture(ctx.TEXTURE_2D, tex[0]); ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, v);
    ctx.activeTexture(ctx.TEXTURE1); ctx.bindTexture(ctx.TEXTURE_2D, tex[1]); ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, m);
    ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);
    (window as unknown as { __khDraws?: number }).__khDraws = ((window as unknown as { __khDraws?: number }).__khDraws ?? 0) + 1;
    return true;
  }, []);

  // render / seek path: hold the frame until both videos sit on the wanted time, then draw once
  React.useLayoutEffect(() => {
    const h = delayRender(`masked video frame ${frame}`, { timeoutInMilliseconds: 60000 });
    let alive = true, tries = 0;
    const tol = 0.51 / FPS;
    const tick = () => {
      if (!alive) return;
      const v = vRef.current, m = mRef.current;
      const ok = v && m && !v.seeking && !m.seeking && v.readyState >= 2 && m.readyState >= 2 && Math.abs(v.currentTime - want) <= tol && Math.abs(m.currentTime - want) <= tol;
      if (ok || tries > 600) { draw(); continueRender(h); return; }
      tries++; setTimeout(tick, 16);
    };
    tick();
    return () => { alive = false; continueRender(h); };
  }, [frame, want, draw]);
  // playback path (Studio): keep redrawing while the videos play
  React.useEffect(() => {
    let id = 0;
    const loop = () => { draw(); id = requestAnimationFrame(loop); };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [draw]);

  const hidden: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: 2, height: 2, opacity: 0, pointerEvents: "none" };
  return (
    <>
      <Video ref={vRef} src={staticFile(src)} startFrom={startFrom} muted style={hidden} />
      <Video ref={mRef} src={staticFile(mask)} startFrom={startFrom} muted style={hidden} />
      <canvas ref={cRef} width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, ...style }} />
    </>
  );
};

/** passport + plane + stamps: «فيزا وسفارة وجواز وطيران» */
export const IllPassport: React.FC = () => (
  <IllFloor color="#7da2c8" dot="rgba(255,255,255,.22)">
    <svg width="1100" height="900" viewBox="0 0 1100 900" style={{ position: "absolute", left: 40, top: 100, filter: "drop-shadow(0 14px 0 rgba(20,40,70,.3))" }}>
      <g stroke={PAPER} strokeWidth="9" strokeLinejoin="round" strokeLinecap="round">
        <rect x="120" y="260" width="420" height="560" rx="30" fill="#a9552f" transform="rotate(-6 330 540)" />
        <circle cx="320" cy="470" r="90" fill="none" /><path d="M250 470 H390 M320 380 V560" fill="none" />
        <rect x="430" y="380" width="360" height="460" rx="24" fill="#f3e6c4" transform="rotate(5 610 610)" />
        <circle cx="620" cy="640" r="95" fill="none" stroke={BRAND.mark} strokeWidth="12" transform="rotate(5 610 610)" /><path d="M560 640 l40 40 l80 -90" fill="none" stroke={BRAND.mark} strokeWidth="14" transform="rotate(5 610 610)" />
        <path d="M640 150 L930 230 L650 260 L560 340 L540 250 L380 230Z" fill="#f3c34a" />
      </g>
    </svg>
  </IllFloor>
);
/** a paper shelf full of books: «كتب الرجال والجرح والتعديل» */
export const IllShelf: React.FC = () => (
  <IllFloor color="#8f7a5a" dot="rgba(255,255,255,.14)">
    <svg width="1100" height="900" viewBox="0 0 1100 900" style={{ position: "absolute", left: 40, top: 90, filter: "drop-shadow(0 14px 0 rgba(40,25,10,.3))" }}>
      <g stroke={PAPER} strokeWidth="7" strokeLinejoin="round">
        {[0, 1, 2].map((r) => (
          <g key={r} transform={`translate(0 ${r * 270})`}>
            <rect x="20" y="230" width="1060" height="26" fill="#6b4630" />
            {Array.from({ length: 13 }).map((_, i) => <rect key={i} x={50 + i * 78} y={40 + ((i * 37 + r * 11) % 50)} width={62} height={190 - ((i * 37 + r * 11) % 50)} fill={["#a9552f", "#5d7ea0", "#c9824a", "#8a5a2e", "#3d6a8f", BRAND.mark][(i + r) % 6]} />)}
          </g>
        ))}
      </g>
    </svg>
  </IllFloor>
);
