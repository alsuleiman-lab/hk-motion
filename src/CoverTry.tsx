import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { loadFont as loadKufi } from "@remotion/google-fonts/NotoKufiArabic";
import { loadFont as loadAlmarai } from "@remotion/google-fonts/Almarai";

// Cover-frame trial v2 (first 0.10 s of the video). Study of the channel's own thumbnails: cinematic warm backgrounds with a topic prop,
// the Sheikh cut out on the right with a dignified (mouth closed) expression, the opponent cut out on the left, gold headline + red banner.
const kufi = loadKufi("normal", { weights: ["800"], subsets: ["arabic"], ignoreTooManyRequestsWarning: true }).fontFamily;
const almarai = loadAlmarai("normal", { weights: ["700", "800"], subsets: ["arabic"], ignoreTooManyRequestsWarning: true }).fontFamily;

export const COVER_FRAMES = 30;

const GOLD = "linear-gradient(180deg,#fffbe0 0%,#ffe27a 38%,#f2b221 70%,#c47f10 100%)";

/** warm cinematic backdrop built from a real manuscript photo (graded, blurred, vignetted, gold dust) */
const Backdrop: React.FC<{ src: string; fit?: "cover" | "contain"; blur?: number; glowX?: number; glowY?: number; dark?: number; flip?: boolean }> = ({ src, blur = 5, glowX = 1380, glowY = 420, dark = 0.5, flip }) => (
  <AbsoluteFill style={{ background: "#4a2f1c", overflow: "hidden" }}>
    <Img src={staticFile(src)} style={{ position: "absolute", inset: -40, width: "calc(100% + 80px)", height: "calc(100% + 80px)", objectFit: "cover", filter: `blur(${blur}px) sepia(.55) saturate(1.25) brightness(.95) contrast(1.05)`, transform: flip ? "scaleX(-1)" : undefined }} />
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 900px 760px at ${glowX}px ${glowY}px, rgba(255,214,120,.85) 0%, rgba(255,176,70,.35) 45%, rgba(60,30,10,${dark}) 100%)` }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(50,24,8,.55) 100%)" }} />
    {Array.from({ length: 46 }).map((_, i) => {
      const x = (i * 397) % 1920, y = (i * 211) % 1080, r = 3 + ((i * 7) % 7);
      return <div key={i} style={{ position: "absolute", left: x, top: y, width: r, height: r, borderRadius: "50%", background: "rgba(255,226,140,.75)", filter: "blur(.6px)", boxShadow: "0 0 10px 3px rgba(255,200,90,.5)" }} />;
    })}
  </AbsoluteFill>
);

const Cut: React.FC<{ src: string; w: number; left: number; bottom: number; rim?: string; clip?: string; mask?: boolean }> = ({ src, w, left, bottom, rim = "rgba(255,206,110,.9)", clip, mask }) => (
  <Img src={staticFile(src)} style={{ position: "absolute", left, bottom, width: w, filter: `drop-shadow(0 0 22px ${rim}) drop-shadow(0 16px 28px rgba(20,8,0,.6))`, clipPath: clip, WebkitMaskImage: mask ? "linear-gradient(180deg,#000 80%,transparent 100%)" : undefined }} />
);

const GoldText: React.FC<{ children: React.ReactNode; size: number; stroke?: string; style?: React.CSSProperties }> = ({ children, size, stroke = "#4a1e08", style }) => (
  <div style={{ position: "relative", direction: "rtl", fontFamily: kufi, fontWeight: 800, fontSize: size, lineHeight: 1.12, textAlign: "center", ...style }}>
    <div style={{ WebkitTextStroke: `${Math.round(size / 5.5)}px ${stroke}`, color: stroke, textShadow: "0 12px 24px rgba(0,0,0,.55)" }}>{children}</div>
    <div style={{ position: "absolute", inset: 0, background: GOLD, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{children}</div>
  </div>
);

const Banner: React.FC<{ children: React.ReactNode; size: number; bg?: string; style?: React.CSSProperties }> = ({ children, size, bg = "linear-gradient(180deg,#e3412f,#a81f14)", style }) => (
  <div style={{ display: "inline-block", whiteSpace: "nowrap", direction: "rtl", fontFamily: kufi, fontWeight: 800, fontSize: size, color: "#fff", padding: "6px 52px 14px", background: bg, border: "5px solid #ffe9a0", borderRadius: 18, boxShadow: "0 14px 30px rgba(0,0,0,.5)", textShadow: "0 4px 10px rgba(0,0,0,.5)", ...style }}>{children}</div>
);

const Tag: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ position: "absolute", direction: "rtl", fontFamily: almarai, fontWeight: 800, fontSize: 56, color: "#fff", padding: "4px 36px 8px", background: "linear-gradient(180deg,#e3412f,#a81f14)", border: "4px solid #ffe9a0", borderRadius: 14, boxShadow: "0 10px 22px rgba(0,0,0,.5)", ...style }}>{children}</div>
);

/** A — debate: opponent on the left, the Sheikh on the right, manuscript behind, headline across the bottom */
export const CoverA: React.FC = () => (
  <AbsoluteFill>
    <Backdrop src="cov/ms_calli.jpg" glowX={1360} glowY={430} />
    <Cut src="cov/zayed.png" w={900} left={-60} bottom={197} rim="rgba(255,120,80,.9)" clip="inset(0 0 0 9%)" mask />
    <Cut src="cov/sheikh_n13.png" w={2200} left={300} bottom={-95} />
    <Tag style={{ left: 170, top: 168, transform: "rotate(-3deg)" }}>أحمد زايد</Tag>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 40, textAlign: "center" }}>
      <GoldText size={150}>شبهات أحمد زايد</GoldText>
      <Banner size={96} style={{ marginTop: 6 }}>على أسانيد السنة</Banner>
    </div>
  </AbsoluteFill>
);

/** B — one idea: a real illuminated hadith manuscript as the prop, the Sheikh pointing, one question */
export const CoverB: React.FC = () => (
  <AbsoluteFill>
    <Backdrop src="cov/ms_calli.jpg" glowX={1400} glowY={460} blur={8} />
    <div style={{ position: "absolute", left: 40, top: 150, width: 980, height: 560, borderRadius: 18, overflow: "hidden", transform: "rotate(-4deg)", border: "8px solid #f2d27a", boxShadow: "0 30px 60px rgba(0,0,0,.6), 0 0 50px rgba(255,200,90,.55)" }}>
      <Img src={staticFile("cov/ms_marinid.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 45%" }} />
    </div>
    <Cut src="cov/sheikh_n37.png" w={2200} left={300} bottom={-95} />
    <div style={{ position: "absolute", left: 40, top: 40, width: 1000, textAlign: "center" }}>
      <GoldText size={170}>أسانيد السنة</GoldText>
    </div>
    <div style={{ position: "absolute", left: 60, bottom: 70, width: 980, textAlign: "center" }}>
      <Banner size={92}>هل هي حقاً شبهات؟</Banner>
    </div>
  </AbsoluteFill>
);

/** C — split screen: red side for the opponent, gold side for the Sheikh, bold headline on top */
export const CoverC: React.FC = () => (
  <AbsoluteFill>
    <Backdrop src="cov/ms_bukhari.jpg" glowX={1400} glowY={500} blur={6} flip />
    <div style={{ position: "absolute", left: 0, top: 0, width: 880, height: 1080, background: "linear-gradient(90deg, rgba(168,31,20,.78), rgba(168,31,20,.25) 85%, rgba(168,31,20,0))" }} />
    <Cut src="cov/zayed.png" w={1000} left={-80} bottom={150} rim="rgba(255,130,90,.95)" clip="inset(0 0 0 9%)" mask />
    <Cut src="cov/sheikh_n13.png" w={2150} left={330} bottom={-70} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 36, textAlign: "center" }}>
      <GoldText size={160}>الرد على الشبهات</GoldText>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 56, textAlign: "center" }}>
      <Banner size={110}>أسانيد السنة</Banner>
    </div>
  </AbsoluteFill>
);
