import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { loadFont as loadKufi } from "@remotion/google-fonts/NotoKufiArabic";
import { loadFont as loadAlmarai } from "@remotion/google-fonts/Almarai";

// Cover trial v4 — built on the version the Sheikh liked (calm blue + big visible hadith book). Rules from his feedback:
//  * the headline is ONE block (gold line + banner touching), never split in two far parts, and never over a face;
//  * the book prop is big and clearly visible;
//  * both cut-outs are colour-graded to sit in the background (tinted overlay inside the subject's own mask).
const kufi = loadKufi("normal", { weights: ["800"], subsets: ["arabic"], ignoreTooManyRequestsWarning: true }).fontFamily;
const almarai = loadAlmarai("normal", { weights: ["700", "800"], subsets: ["arabic"], ignoreTooManyRequestsWarning: true }).fontFamily;

export const COVER4_FRAMES = 30;

export type P = {
  bg: string; tint: string; tintA: number; glow: string; glow2: string; vign: string; gold: string; stroke: string;
  banner: string; border: string; bannerText: string; rim: string; oppRim: string;
  grade: string; gradeA: number; gradeBlend: string; sat: number; bri: number;
};

export const BLUE: P = { bg: "cov/ms_marinid.jpg", tint: "#1f4f96", tintA: 0.6, glow: "rgba(190,220,255,.75)", glow2: "rgba(90,150,230,.35)", vign: "rgba(8,24,60,.6)", gold: "linear-gradient(180deg,#fffbe0 0%,#ffe27a 38%,#f2b221 70%,#c47f10 100%)", stroke: "#0c2247", banner: "linear-gradient(180deg,#e3412f,#a81f14)", border: "#ffe9a0", bannerText: "#fff", rim: "rgba(190,225,255,.9)", oppRim: "rgba(255,170,120,.9)", grade: "#3a78c8", gradeA: 0.2, gradeBlend: "soft-light", sat: 0.92, bri: 1.0 };
export const BROWN: P = { bg: "cov/ms_calli.jpg", tint: "#7a4a1c", tintA: 0.5, glow: "rgba(255,214,120,.85)", glow2: "rgba(255,176,70,.35)", vign: "rgba(60,30,10,.5)", gold: BLUE.gold, stroke: "#4a1e08", banner: BLUE.banner, border: "#ffe9a0", bannerText: "#fff", rim: "rgba(255,206,110,.9)", oppRim: "rgba(255,150,90,.9)", grade: "#e0963a", gradeA: 0.28, gradeBlend: "soft-light", sat: 0.9, bri: 0.98 };
export const NAVYGOLD: P = { ...BLUE, bg: "cov/ms_calli.jpg", tint: "#173a74", tintA: 0.78, glow: "rgba(255,230,160,.8)", glow2: "rgba(230,170,70,.3)", vign: "rgba(6,18,48,.65)", stroke: "#08183a", banner: "linear-gradient(180deg,#f3c34a,#c48a14)", bannerText: "#3a1a06", rim: "rgba(255,226,150,.9)", oppRim: "rgba(255,200,130,.9)", grade: "#2a58a6", gradeA: 0.22 };
export const STEEL: P = { ...BLUE, bg: "cov/ms_bukhari.jpg", tint: "#3f6f9e", tintA: 0.62, glow: "rgba(235,245,255,.85)", glow2: "rgba(130,180,225,.35)", vign: "rgba(20,46,80,.5)", stroke: "#12304f", banner: "linear-gradient(180deg,#1f4f96,#143569)", rim: "rgba(220,240,255,.9)", oppRim: "rgba(255,190,150,.9)", grade: "#5a8fc4", gradeA: 0.2 };
export const OLIVE: P = { ...BLUE, bg: "cov/ms_bukhari.jpg", tint: "#556b3e", tintA: 0.62, glow: "rgba(238,244,214,.85)", glow2: "rgba(150,180,110,.35)", vign: "rgba(28,44,24,.5)", stroke: "#26361d", banner: "linear-gradient(180deg,#667a3e,#46592a)", border: "#f1e6b4", rim: "rgba(235,244,210,.9)", oppRim: "rgba(255,200,140,.9)", grade: "#7d9a58", gradeA: 0.2 };
export const PARCH: P = { ...BROWN, bg: "cov/ms_bukhari.jpg", tint: "#9a6a30", tintA: 0.3, glow: "rgba(255,244,205,.9)", glow2: "rgba(240,200,120,.3)", vign: "rgba(90,52,22,.5)", gold: "linear-gradient(180deg,#6a3d18,#3e2718)", stroke: "#fff1c9", banner: "linear-gradient(180deg,#7c5535,#4a2f1c)", border: "#e8c46a", rim: "rgba(255,240,190,.9)", oppRim: "rgba(255,190,120,.9)", grade: "#d49a4a", gradeA: 0.26 };

export const Backdrop: React.FC<{ p: P; gx?: number; gy?: number; blur?: number; filter?: string; sparkles?: boolean }> = ({ p, gx = 1400, gy = 440, blur = 8, filter, sparkles = true }) => (
  <AbsoluteFill style={{ background: "#2a1c10", overflow: "hidden" }}>
    <Img src={staticFile(p.bg)} style={{ position: "absolute", inset: -40, width: "calc(100% + 80px)", height: "calc(100% + 80px)", objectFit: "cover", filter: `blur(${blur}px) ${filter ?? "sepia(.4) saturate(1.2) brightness(.95) contrast(1.05)"}` }} />
    <AbsoluteFill style={{ background: p.tint, mixBlendMode: "color", opacity: p.tintA }} />
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 900px 760px at ${gx}px ${gy}px, ${p.glow} 0%, ${p.glow2} 45%, ${p.vign} 100%)` }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(20,10,4,.5) 100%)" }} />
    {sparkles ? Array.from({ length: 36 }).map((_, i) => {
      const x = (i * 397) % 1920, y = (i * 211) % 1080, r = 3 + ((i * 7) % 6);
      return <div key={i} style={{ position: "absolute", left: x, top: y, width: r, height: r, borderRadius: "50%", background: "rgba(255,236,170,.65)", filter: "blur(.6px)", boxShadow: "0 0 10px 3px rgba(255,210,110,.4)" }} />;
    }) : null}
  </AbsoluteFill>
);

/** cut-out + colour grade: the tint is painted only inside the subject's own mask so it matches the background palette */
export const Cut: React.FC<{ p: P; src: string; w: number; left: number; bottom: number; rim: string; clip?: string; mask?: boolean }> = ({ p, src, w, left, bottom, rim, clip, mask }) => {
  const url = staticFile(src);
  const fade = mask ? "linear-gradient(180deg,#000 80%,transparent 100%)" : undefined;
  return (
    <div style={{ position: "absolute", left, bottom, width: w, clipPath: clip, WebkitMaskImage: fade, filter: `drop-shadow(0 0 22px ${rim}) drop-shadow(0 16px 28px rgba(8,6,20,.6))` }}>
      <Img
        src={url}
        style={{
          width: "100%",
          display: "block",
          filter: `saturate(${p.sat}) brightness(${p.bri}) contrast(1.03)`,
          translate: "1080.2px 225.3px"
        }}
      />
      <div style={{ position: "absolute", inset: 0, background: p.grade, opacity: p.gradeA * 3, mixBlendMode: p.gradeBlend as React.CSSProperties["mixBlendMode"], WebkitMaskImage: `url(${url})`, WebkitMaskSize: "100% 100%", maskImage: `url(${url})`, maskSize: "100% 100%" }} />
    </div>
  );
};

/** ONE headline block: gold line with the banner glued under it (gap 0) */
export const Headline: React.FC<{ p: P; line1: string; line2: string; s1?: number; s2?: number; style?: React.CSSProperties }> = ({ p, line1, line2, s1 = 140, s2 = 84, style }) => (
  <div style={{ position: "absolute", left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", ...style }}>
    <div style={{ position: "relative", direction: "rtl", fontFamily: kufi, fontWeight: 800, fontSize: s1, lineHeight: 1.1, whiteSpace: "nowrap" }}>
      <div style={{ WebkitTextStroke: `${Math.round(s1 / 5.5)}px ${p.stroke}`, color: p.stroke, textShadow: "0 12px 24px rgba(0,0,0,.55)" }}>{line1}</div>
      <div style={{ position: "absolute", inset: 0, background: p.gold, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{line1}</div>
    </div>
    <div style={{ marginTop: -6, direction: "rtl", whiteSpace: "nowrap", fontFamily: kufi, fontWeight: 800, fontSize: s2, color: p.bannerText, padding: "4px 54px 12px", background: p.banner, border: `5px solid ${p.border}`, borderRadius: 16, boxShadow: "0 14px 30px rgba(0,0,0,.5)" }}>{line2}</div>
  </div>
);

export const Tag: React.FC<{ p: P; children: React.ReactNode; style?: React.CSSProperties }> = ({ p, children, style }) => (
  <div style={{ position: "absolute", direction: "rtl", fontFamily: almarai, fontWeight: 800, fontSize: 58, color: p.bannerText, padding: "4px 36px 8px", background: p.banner, border: `4px solid ${p.border}`, borderRadius: 14, boxShadow: "0 10px 22px rgba(0,0,0,.5)", whiteSpace: "nowrap", ...style }}>{children}</div>
);

/** the hadith manuscript as a big, clearly visible, tilted framed prop */
export const Book: React.FC<{ p: P; left: number; top: number; w: number; h: number; rot: number; src?: string; pos?: string }> = ({ p, left, top, w, h, rot, src = "cov/ms_marinid.jpg", pos = "50% 45%" }) => (
  <div style={{ position: "absolute", left, top, width: w, height: h, borderRadius: 14, overflow: "hidden", transform: `rotate(${rot}deg)`, border: `8px solid ${p.border}`, boxShadow: `0 28px 54px rgba(0,0,0,.6), 0 0 50px ${p.glow2}` }}>
    <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos }} />
  </div>
);

const SH = { src: "cov/sheikh_t268.png", w: 2200, left: 300, bottom: -95 };
const SH2 = { src: "cov/sheikh_t188.png", w: 2200, left: 380, bottom: -95 };
const T188_CLIP = "polygon(0 0, 68% 0, 68% 38%, 100% 38%, 100% 100%, 0 100%)";
const OPP = { src: "cov/zayed.png", w: 860, left: -20, bottom: 120 };

/** 1 — the liked one, refined: calm blue, big book, one headline block at the bottom */
export const Cover1: React.FC = () => (
  <AbsoluteFill>
    <Backdrop p={BLUE} />
    <Book p={BLUE} left={30} top={90} w={1000} h={540} rot={-4} />
    <Cut p={BLUE} {...OPP} rim={BLUE.oppRim} clip="inset(0 0 0 9%)" mask />
    <Cut p={BLUE} {...SH} rim={BLUE.rim} />
    <Tag p={BLUE} style={{ left: 110, top: 640, transform: "rotate(-3deg)" }}>أحمد زايد</Tag>
    <Headline p={BLUE} line1="أسانيد السنة" line2="هل هي حقاً شبهات؟" style={{ bottom: 34 }} />
  </AbsoluteFill>
);

/** 2 — warm brown manuscript background, subjects graded warm, book big and visible */
export const Cover2: React.FC = () => (
  <AbsoluteFill>
    <Backdrop p={BROWN} blur={7} />
    <Book p={BROWN} left={30} top={90} w={1000} h={540} rot={-4} />
    <Cut p={BROWN} {...OPP} rim={BROWN.oppRim} clip="inset(0 0 0 9%)" mask />
    <Cut p={BROWN} {...SH} rim={BROWN.rim} />
    <Tag p={BROWN} style={{ left: 110, top: 640, transform: "rotate(-3deg)" }}>أحمد زايد</Tag>
    <Headline p={BROWN} line1="شبهات أحمد زايد" line2="على أسانيد السنة" style={{ bottom: 34 }} />
  </AbsoluteFill>
);

/** 3 — deep navy with a warm gold spotlight behind the Sheikh */
export const Cover3: React.FC = () => (
  <AbsoluteFill>
    <Backdrop p={NAVYGOLD} blur={7} />
    <Book p={NAVYGOLD} left={30} top={90} w={1000} h={540} rot={-4} />
    <Cut p={NAVYGOLD} {...OPP} rim={NAVYGOLD.oppRim} clip="inset(0 0 0 9%)" mask />
    <Cut p={NAVYGOLD} {...SH2} rim={NAVYGOLD.rim} clip={T188_CLIP} />
    <Tag p={NAVYGOLD} style={{ left: 110, top: 640, transform: "rotate(-3deg)" }}>أحمد زايد</Tag>
    <Headline p={NAVYGOLD} line1="الرد على أحمد زايد" line2="في أسانيد السنة" style={{ bottom: 34 }} />
  </AbsoluteFill>
);

/** 4 — bright steel blue, hadith page behind, navy banner (quiet and clear) */
export const Cover4: React.FC = () => (
  <AbsoluteFill>
    <Backdrop p={STEEL} blur={6} />
    <Book p={STEEL} left={30} top={90} w={1000} h={540} rot={-4} />
    <Cut p={STEEL} {...OPP} rim={STEEL.oppRim} clip="inset(0 0 0 9%)" mask />
    <Cut p={STEEL} {...SH} rim={STEEL.rim} />
    <Tag p={STEEL} style={{ left: 110, top: 640, transform: "rotate(-3deg)" }}>أحمد زايد</Tag>
    <Headline p={STEEL} line1="شبهات الأسانيد" line2="هل تصمد أمام التحقيق؟" style={{ bottom: 34 }} />
  </AbsoluteFill>
);

/** 5 — aged parchment, warm graded subjects, dark-brown headline */
export const Cover5: React.FC = () => (
  <AbsoluteFill>
    <Backdrop p={PARCH} blur={4} />
    <Book p={PARCH} left={30} top={90} w={1000} h={540} rot={-4} />
    <Cut p={PARCH} {...OPP} rim={PARCH.oppRim} clip="inset(0 0 0 9%)" mask />
    <Cut p={PARCH} {...SH2} rim={PARCH.rim} clip={T188_CLIP} />
    <Tag p={PARCH} style={{ left: 110, top: 640, transform: "rotate(-3deg)" }}>أحمد زايد</Tag>
    <Headline p={PARCH} line1="شبهات الأسانيد" line2="الرد على أحمد زايد" style={{ bottom: 34 }} />
  </AbsoluteFill>
);
export const PALETTES = { steel: STEEL, olive: OLIVE, walnut: BROWN } as const;
