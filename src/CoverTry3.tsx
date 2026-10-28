import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { loadFont as loadKufi } from "@remotion/google-fonts/NotoKufiArabic";
import { loadFont as loadAlmarai } from "@remotion/google-fonts/Almarai";

// Cover-frame trial v3 (first 0.10 s of the video). Rule from the Sheikh: the cover ALWAYS carries (1) his photo, (2) the person he answers (named),
// (3) a prop that represents the issue (here: a real hadith manuscript). Colour harmony matters more than details of the pose.
const kufi = loadKufi("normal", { weights: ["800"], subsets: ["arabic"], ignoreTooManyRequestsWarning: true }).fontFamily;
const almarai = loadAlmarai("normal", { weights: ["700", "800"], subsets: ["arabic"], ignoreTooManyRequestsWarning: true }).fontFamily;

export const COVER3_FRAMES = 30;

type Palette = {
  bg: string; tint?: string; tintAlpha?: number; glow: string; glow2: string; vign: string;
  gold: string; stroke: string; banner: string; bannerBorder: string; tagBg: string; rim: string; oppRim: string; light: boolean;
};

const WARM: Palette = { bg: "cov/ms_calli.jpg", glow: "rgba(255,214,120,.85)", glow2: "rgba(255,176,70,.35)", vign: "rgba(60,30,10,.5)", gold: "linear-gradient(180deg,#fffbe0 0%,#ffe27a 38%,#f2b221 70%,#c47f10 100%)", stroke: "#4a1e08", banner: "linear-gradient(180deg,#e3412f,#a81f14)", bannerBorder: "#ffe9a0", tagBg: "linear-gradient(180deg,#e3412f,#a81f14)", rim: "rgba(255,206,110,.9)", oppRim: "rgba(255,120,80,.9)", light: true };
const EMERALD: Palette = { ...WARM, tint: "#0f7a52", tintAlpha: 0.78, glow: "rgba(190,255,200,.7)", glow2: "rgba(60,190,120,.3)", vign: "rgba(4,40,26,.6)", stroke: "#06301f", banner: "linear-gradient(180deg,#e8b53a,#b9811a)", bannerBorder: "#fff3c4", tagBg: "linear-gradient(180deg,#e8b53a,#b9811a)", rim: "rgba(210,255,215,.85)", oppRim: "rgba(255,225,130,.9)", light: false };
const NAVY: Palette = { ...WARM, bg: "cov/ms_marinid.jpg", tint: "#1f4f96", tintAlpha: 0.6, glow: "rgba(190,220,255,.75)", glow2: "rgba(90,150,230,.35)", vign: "rgba(8,24,60,.6)", stroke: "#0c2247", rim: "rgba(190,225,255,.9)", oppRim: "rgba(255,170,120,.9)" };
const CRIMSON: Palette = { ...WARM, bg: "cov/ms_bukhari.jpg", tint: "#a3241a", tintAlpha: 0.7, glow: "rgba(255,225,150,.85)", glow2: "rgba(255,150,70,.35)", vign: "rgba(70,10,6,.6)", stroke: "#3a0c06", banner: "linear-gradient(180deg,#f3c34a,#c48a14)", bannerBorder: "#fff3c4", tagBg: "linear-gradient(180deg,#f3c34a,#c48a14)", rim: "rgba(255,225,150,.9)", oppRim: "rgba(255,255,255,.85)", light: false };
const PARCH: Palette = { ...WARM, bg: "cov/ms_bukhari.jpg", glow: "rgba(255,244,205,.9)", glow2: "rgba(240,200,120,.3)", vign: "rgba(90,52,22,.55)", gold: "linear-gradient(180deg,#5a3418,#3e2718)", stroke: "#fff1c9", banner: "linear-gradient(180deg,#7c5535,#4a2f1c)", bannerBorder: "#e8c46a", tagBg: "linear-gradient(180deg,#7c5535,#4a2f1c)", rim: "rgba(255,240,190,.9)", oppRim: "rgba(255,190,120,.9)" };

const Backdrop: React.FC<{ p: Palette; gx?: number; gy?: number; flip?: boolean; blur?: number }> = ({ p, gx = 1380, gy = 430, flip, blur = 5 }) => (
  <AbsoluteFill style={{ background: "#4a2f1c", overflow: "hidden" }}>
    <Img src={staticFile(p.bg)} style={{ position: "absolute", inset: -40, width: "calc(100% + 80px)", height: "calc(100% + 80px)", objectFit: "cover", filter: `blur(${blur}px) sepia(.45) saturate(1.2) brightness(.95) contrast(1.05)`, transform: flip ? "scaleX(-1)" : undefined }} />
    {p.tint ? <AbsoluteFill style={{ background: p.tint, mixBlendMode: "color", opacity: p.tintAlpha ?? 0.7 }} /> : null}
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 900px 760px at ${gx}px ${gy}px, ${p.glow} 0%, ${p.glow2} 45%, ${p.vign} 100%)` }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(30,14,4,.5) 100%)" }} />
    {Array.from({ length: 40 }).map((_, i) => {
      const x = (i * 397) % 1920, y = (i * 211) % 1080, r = 3 + ((i * 7) % 7);
      return <div key={i} style={{ position: "absolute", left: x, top: y, width: r, height: r, borderRadius: "50%", background: "rgba(255,232,160,.7)", filter: "blur(.6px)", boxShadow: "0 0 10px 3px rgba(255,210,110,.45)" }} />;
    })}
  </AbsoluteFill>
);

const Cut: React.FC<{ src: string; w: number; left: number; bottom: number; rim: string; clip?: string; mask?: boolean }> = ({ src, w, left, bottom, rim, clip, mask }) => (
  <Img src={staticFile(src)} style={{ position: "absolute", left, bottom, width: w, filter: `drop-shadow(0 0 22px ${rim}) drop-shadow(0 16px 28px rgba(20,8,0,.6))`, clipPath: clip, WebkitMaskImage: mask ? "linear-gradient(180deg,#000 80%,transparent 100%)" : undefined }} />
);

const Gold: React.FC<{ p: Palette; children: React.ReactNode; size: number; style?: React.CSSProperties }> = ({ p, children, size, style }) => (
  <div style={{ position: "relative", direction: "rtl", fontFamily: kufi, fontWeight: 800, fontSize: size, lineHeight: 1.12, textAlign: "center", whiteSpace: "nowrap", ...style }}>
    <div style={{ WebkitTextStroke: `${Math.round(size / 5.5)}px ${p.stroke}`, color: p.stroke, textShadow: "0 12px 24px rgba(0,0,0,.55)" }}>{children}</div>
    <div style={{ position: "absolute", inset: 0, background: p.gold, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{children}</div>
  </div>
);

const Banner: React.FC<{ p: Palette; children: React.ReactNode; size: number; dark?: boolean; style?: React.CSSProperties }> = ({ p, children, size, dark, style }) => (
  <div style={{ display: "inline-block", whiteSpace: "nowrap", direction: "rtl", fontFamily: kufi, fontWeight: 800, fontSize: size, color: dark ? "#3a1a06" : "#fff", padding: "6px 52px 14px", background: p.banner, border: `5px solid ${p.bannerBorder}`, borderRadius: 18, boxShadow: "0 14px 30px rgba(0,0,0,.5)", ...style }}>{children}</div>
);

const Tag: React.FC<{ p: Palette; children: React.ReactNode; dark?: boolean; style?: React.CSSProperties }> = ({ p, children, dark, style }) => (
  <div style={{ position: "absolute", direction: "rtl", fontFamily: almarai, fontWeight: 800, fontSize: 60, color: dark ? "#3a1a06" : "#fff", padding: "4px 38px 8px", background: p.tagBg, border: `4px solid ${p.bannerBorder}`, borderRadius: 14, boxShadow: "0 10px 22px rgba(0,0,0,.5)", whiteSpace: "nowrap", ...style }}>{children}</div>
);

/** the hadith manuscript as a tilted framed prop */
const Book: React.FC<{ p: Palette; left: number; top: number; w: number; h: number; rot: number }> = ({ p, left, top, w, h, rot }) => (
  <div style={{ position: "absolute", left, top, width: w, height: h, borderRadius: 14, overflow: "hidden", transform: `rotate(${rot}deg)`, border: `7px solid ${p.bannerBorder}`, boxShadow: `0 26px 50px rgba(0,0,0,.6), 0 0 46px ${p.glow2}` }}>
    <Img src={staticFile("cov/ms_marinid.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 45%" }} />
  </div>
);

// Sheikh cut-outs (from his own lesson): t268 = calm, looks at the camera, hands open; t188 = serious, looks at the camera
const SH = { src: "cov/sheikh_t268.png", w: 2200, left: 300, bottom: -95 };
const SH2 = { src: "cov/sheikh_t188.png", w: 2200, left: 380, bottom: -95 };
const T188_CLIP = "polygon(0 0, 68% 0, 68% 38%, 100% 38%, 100% 100%, 0 100%)";
const OPP = { src: "cov/zayed.png", w: 900, left: -60, bottom: 197 };

/** 1 — warm brown debate, name tag, manuscript under the opponent */
export const Cover1: React.FC = () => (
  <AbsoluteFill>
    <Backdrop p={WARM} />
    <Book p={WARM} left={30} top={600} w={560} h={330} rot={-6} />
    <Cut {...OPP} rim={WARM.oppRim} clip="inset(0 0 0 9%)" mask />
    <Cut {...SH} rim={WARM.rim} />
    <Tag p={WARM} style={{ left: 170, top: 168, transform: "rotate(-3deg)" }}>أحمد زايد</Tag>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 38, textAlign: "center" }}>
      <Gold p={WARM} size={150}>شبهات أحمد زايد</Gold>
      <Banner p={WARM} size={92} style={{ marginTop: 6 }}>على أسانيد السنة</Banner>
    </div>
  </AbsoluteFill>
);

/** 2 — emerald + gold, title on top, banner low */
export const Cover2: React.FC = () => (
  <AbsoluteFill>
    <Backdrop p={EMERALD} />
    <Book p={EMERALD} left={40} top={560} w={560} h={330} rot={5} />
    <Cut {...OPP} bottom={170} rim={EMERALD.oppRim} clip="inset(0 0 0 9%)" mask />
    <Cut {...SH2} rim={EMERALD.rim} clip={T188_CLIP} />
    <Tag p={EMERALD} dark style={{ left: 190, top: 205, transform: "rotate(-3deg)" }}>أحمد زايد</Tag>
    <div style={{ position: "absolute", left: 0, right: 0, top: 26, textAlign: "center" }}>
      <Gold p={EMERALD} size={150}>الرد على أحمد زايد</Gold>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 44, textAlign: "center" }}>
      <Banner p={EMERALD} dark size={100}>في أسانيد السنة</Banner>
    </div>
  </AbsoluteFill>
);

/** 3 — navy + gold (colours of the illuminated manuscript), big book behind */
export const Cover3: React.FC = () => (
  <AbsoluteFill>
    <Backdrop p={NAVY} blur={9} />
    <Book p={NAVY} left={20} top={110} w={1000} h={560} rot={-4} />
    <Cut {...OPP} bottom={90} left={-20} w={860} rim={NAVY.oppRim} clip="inset(0 0 0 9%)" mask />
    <Cut {...SH} rim={NAVY.rim} />
    <Tag p={NAVY} style={{ left: 120, top: 700, transform: "rotate(-3deg)" }}>أحمد زايد</Tag>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 38, textAlign: "center" }}>
      <Gold p={NAVY} size={140}>أسانيد السنة</Gold>
      <Banner p={NAVY} size={88} style={{ marginTop: 4 }}>هل هي حقاً شبهات؟</Banner>
    </div>
  </AbsoluteFill>
);

/** 4 — crimson versus gold: opponent on the red side, Sheikh on the gold side */
export const Cover4: React.FC = () => (
  <AbsoluteFill>
    <Backdrop p={CRIMSON} flip />
    <div style={{ position: "absolute", left: 0, top: 0, width: 960, height: 1080, background: "linear-gradient(90deg, rgba(120,12,8,.8), rgba(120,12,8,.25) 85%, rgba(120,12,8,0))" }} />
    <Cut {...OPP} w={1000} left={-80} bottom={150} rim={CRIMSON.oppRim} clip="inset(0 0 0 9%)" mask />
    <Cut {...SH} left={330} w={2150} bottom={-70} rim={CRIMSON.rim} />
    <Tag p={CRIMSON} dark style={{ left: 200, top: 215, transform: "rotate(-3deg)" }}>أحمد زايد</Tag>
    <div style={{ position: "absolute", left: 0, right: 0, top: 30, textAlign: "center" }}>
      <Gold p={CRIMSON} size={150}>الرد على الشبهات</Gold>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 50, textAlign: "center" }}>
      <Banner p={CRIMSON} dark size={104}>أسانيد السنة</Banner>
    </div>
  </AbsoluteFill>
);

/** 5 — calm aged parchment: the quiet, authoritative look (like the Rifai thumbnail) */
export const Cover5: React.FC = () => (
  <AbsoluteFill>
    <Backdrop p={PARCH} blur={3} />
    <Book p={PARCH} left={40} top={600} w={540} h={320} rot={-5} />
    <Cut {...OPP} rim={PARCH.oppRim} clip="inset(0 0 0 9%)" mask />
    <Cut {...SH2} rim={PARCH.rim} clip={T188_CLIP} />
    <Tag p={PARCH} style={{ left: 170, top: 168, transform: "rotate(-3deg)" }}>أحمد زايد</Tag>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 38, textAlign: "center" }}>
      <Gold p={PARCH} size={150}>شبهات الأسانيد</Gold>
      <Banner p={PARCH} size={90} style={{ marginTop: 6 }}>هل تصمد أمام التحقيق؟</Banner>
    </div>
  </AbsoluteFill>
);
