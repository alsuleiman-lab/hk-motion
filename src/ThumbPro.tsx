import React from "react";
import { AbsoluteFill, Easing, Img, staticFile, useCurrentFrame } from "remotion";
import { lalezar } from "./RefStyle";
import { Gfx } from "./MG";
import { PaperTear } from "./PaperTear";

/**
 * ThumbPro — cover/thumbnail kit built on YouTube thumbnail practice (skill thumbnail-design, 2026-10-28):
 *  ONE idea, max 3 visual elements, faces big (head ≥ 26% of the frame height), 2–4 words in a heavy display face
 *  (Lalezar) with a thick dark stroke — one accent word in yellow, the rest white — readable at 168 px wide,
 *  topic photo behind, graded darker on the text side, white rim light to cut the people out of the background.
 *  Safe zones: nothing important bottom-right (duration badge); signature bottom-left.
 * Layouts: "duel" (the Sheikh vs the person he answers), "word" (one giant idea), "evidence" (a framed proof: book / post / photo, circled).
 */
export type Cutout = { src: string; headX: number; headTop: number; headW: number; srcW: number; clip?: string };
export type ThumbProps = {
  format: "landscape" | "portrait";
  layout: "duel" | "word" | "evidence";
  bg: string;                 // topic photo (public/ path)
  bgPos?: string;
  words: { main: string; accent?: string; sub?: string };   // main (white) + accent (yellow) on one line, sub on a dark box under it
  sheikh: Cutout;             // measured with tools/cutout_head.py
  opp?: Cutout;               // duel only
  evidence?: { src: string; pos?: string; nat?: { w: number; h: number }; circle?: { x: number; y: number; r: number } };   // evidence only; circle in % of the frame box; `nat` = the image's own size → the frame follows the picture (never cropped to a fixed box; user 2026-10-30)
  tone?: string;              // colour grade of the photo (default deep blue)
};

const YELLOW = "#ffd23f";
const STROKE = "#10131c";
const RIM = "drop-shadow(0 0 1.5px #fff) drop-shadow(0 0 1.5px #fff) drop-shadow(0 0 1.5px #fff) drop-shadow(0 18px 26px rgba(0,0,0,.55))";

/** a cut-out (full recording frame or crop) placed so its head has width `w` and its head centre/top land on (cx, top) */
const Person: React.FC<{ c: Cutout; cx: number; top: number; w: number; flip?: boolean; shift?: { x: number; y: number } }> = ({ c, cx, top, w, flip, shift }) => {
  const k = w / c.headW;
  const W = c.srcW * k;
  const left = cx - c.headX * k;
  return (
    <div style={{ position: "absolute", left, top: top - c.headTop * k, width: W, filter: RIM, transform: `${shift ? `translate(${Math.round(shift.x)}px,${Math.round(shift.y)}px) ` : ""}${flip ? "scaleX(-1)" : ""}`.trim() || undefined }}>
      <Img src={staticFile(c.src)} style={{ width: "100%", display: "block", clipPath: c.clip, filter: "contrast(1.06) saturate(1.08) brightness(1.04)" }} />
    </div>
  );
};

const Headline: React.FC<{ words: ThumbProps["words"]; size: number; maxW: number; style?: React.CSSProperties; align?: "flex-start" | "center" | "flex-end" }> = ({ words, size, maxW, style, align = "center" }) => {
  // long headline → accent word drops to its own line (bigger type beats one long thin line at phone size)
  const stack = !!words.accent && (words.main + words.accent).length > 11;
  const len = stack ? Math.max(words.main.length, words.accent!.length) : (words.main + (words.accent ?? "")).length + 1;
  const s = Math.min(size, Math.floor(maxW / (len * 0.47)));
  const txt: React.CSSProperties = { fontFamily: lalezar, fontSize: s, lineHeight: stack ? 0.98 : 1.05, textAlign: "center", WebkitTextStroke: `${Math.round(s / 9)}px ${STROKE}`, paintOrder: "stroke fill", textShadow: `0 ${Math.round(s / 18)}px 0 ${STROKE}, 0 ${Math.round(s / 10)}px ${Math.round(s / 6)}px rgba(0,0,0,.55)`, whiteSpace: "nowrap" };
  return (
    <div style={{ position: "absolute", direction: "rtl", display: "flex", flexDirection: "column", alignItems: align, ...style }}>
      <div style={txt}>
        <span style={{ color: "#fff" }}>{words.main}</span>{words.accent ? (stack ? <><br /><span style={{ color: YELLOW }}>{words.accent}</span></> : <span style={{ color: YELLOW }}> {words.accent}</span>) : null}
      </div>
      {words.sub ? (
        <div style={{ marginTop: -s * 0.08, fontFamily: lalezar, fontSize: s * 0.42, color: "#fff", background: STROKE, padding: `${s * 0.02}px ${s * 0.16}px ${s * 0.07}px`, borderRadius: 10, transform: "rotate(-1.5deg)", boxShadow: "0 10px 20px rgba(0,0,0,.45)", whiteSpace: "nowrap" }}>{words.sub}</div>
      ) : null}
    </div>
  );
};

const Backdrop: React.FC<{ src: string; pos?: string; tone: string; side: "left" | "right" | "bottom" }> = ({ src, pos, tone, side }) => (
  <AbsoluteFill>
    <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos ?? "50% 50%", filter: "saturate(.8) brightness(.78) contrast(1.05) blur(1.5px)", transform: "scale(1.03)" }} />
    <AbsoluteFill style={{ background: tone, mixBlendMode: "multiply", opacity: 0.55 }} />
    {/* darken where the text sits so white/yellow keeps ≥ 4.5:1 */}
    <AbsoluteFill style={{ background: side === "bottom" ? "linear-gradient(to top, rgba(8,10,18,.82) 0%, rgba(8,10,18,.3) 38%, transparent 60%)" : `linear-gradient(to ${side === "left" ? "right" : "left"}, rgba(8,10,18,.78) 0%, rgba(8,10,18,.35) 45%, transparent 70%)` }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,.45) 100%)" }} />
  </AbsoluteFill>
);

const Signature: React.FC<{ portrait: boolean }> = ({ portrait }) => (
  <div style={{ position: "absolute", left: portrait ? 36 : 34, bottom: portrait ? 30 : 22, fontFamily: lalezar, fontSize: portrait ? 40 : 34, color: "#fff", WebkitTextStroke: `5px ${STROKE}`, paintOrder: "stroke fill", direction: "rtl" }}>محمد بن شمس الدين</div>
);

/** `part` = which layers are drawn ("bg" = the torn paper backdrop, "fg" = people + words that fly out); `open` 0..1 = how far the elements have flown (sheikh → right, opponent → left, words → up, signature → down) */
export const ThumbPro: React.FC<ThumbProps & { part?: "all" | "bg" | "fg"; open?: number }> = ({ format, layout, bg, bgPos, words, sheikh, opp, evidence, tone = "#2a4a7a", part = "all", open = 0 }) => {
  const P = format === "portrait";
  // the evidence frame follows the picture's aspect when `nat` is given (portrait box up to 520×900, landscape up to 760×560)
  const evBox = (mw: number, mh: number, dw: number, dh: number) => (evidence?.nat ? { w: Math.round(Math.min(mw, mh * evidence.nat.w / evidence.nat.h)), h: Math.round(Math.min(mh, mw * evidence.nat.h / evidence.nat.w)) } : { w: dw, h: dh });
  const bgOn = part !== "fg", fgOn = part !== "bg", W = P ? 1080 : 1920, H = P ? 1920 : 1080;
  const gone = (dx: number, dy: number) => ({ position: "absolute" as const, inset: 0, transform: `translate(${Math.round(dx * open * W)}px,${Math.round(dy * open * H)}px)` });
  if (P) {
    // portrait (Shorts / first frames): text block on top, faces in the middle, nothing in the bottom 18% (UI overlays)
    return (
      <AbsoluteFill>
        {bgOn ? <Backdrop src={bg} pos={bgPos} tone={tone} side="bottom" /> : null}
        {bgOn ? <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(8,10,18,.8) 0%, transparent 34%)" }} /> : null}
        {fgOn && layout === "evidence" && evidence ? (
          <Gfx><div style={{ position: "absolute", left: 60, top: 520, width: evBox(520, 900, 520, 640).w, height: evBox(520, 900, 520, 640).h, transform: "rotate(-4deg)", border: "10px solid #fff", boxShadow: "0 24px 40px rgba(0,0,0,.6)", overflow: "hidden" }}><Img src={staticFile(evidence.src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: evidence.pos }} /></div></Gfx>
        ) : null}
        {fgOn ? <Person c={sheikh} cx={layout === "word" ? 540 : 760} top={layout === "word" ? 600 : 560} w={layout === "word" ? 420 : 360} shift={{ x: 1.3 * open * W, y: 0 }} /> : null}
        {/* the opponent is drawn in front of the Sheikh's arm (never behind his hands), low-left, away from the beard */}
        {fgOn && layout === "duel" && opp ? <Gfx><Person c={opp} cx={260} top={1000} w={280} shift={{ x: -1.1 * open * W, y: 0 }} /></Gfx> : null}
        {fgOn ? <Gfx><div style={gone(0, -0.6)}><Headline words={words} size={190} maxW={1000} style={{ left: 0, right: 0, top: 120 }} /></div></Gfx> : null}
        {fgOn ? <Gfx><div style={gone(0, 0.3)}><Signature portrait /></div></Gfx> : null}
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill>
      {bgOn ? <Backdrop src={bg} pos={bgPos} tone={tone} side={layout === "duel" ? "bottom" : "left"} /> : null}
      {layout === "duel" && opp ? (
        <>
          {fgOn ? <Gfx><Person c={opp} cx={470} top={60} w={290} shift={{ x: -1.1 * open * W, y: 0 }} /></Gfx> : null}
          {fgOn ? <Person c={sheikh} cx={1450} top={60} w={330} shift={{ x: 1.3 * open * W, y: 0 }} /> : null}
          {/* centre seam: a slanted light bar separates the two sides */}
          {bgOn ? <Gfx><div style={{ position: "absolute", left: 930, top: -60, width: 14, height: 1200, background: YELLOW, transform: "rotate(10deg)", boxShadow: "0 0 30px rgba(255,210,63,.7)" }} /></Gfx> : null}
          {fgOn ? <Gfx><div style={gone(0, 0.6)}><Headline words={words} size={260} maxW={1000} style={{ left: 30, width: 1000, bottom: 50 }} /></div></Gfx> : null}
        </>
      ) : null}
      {layout === "word" ? (
        <>
          {fgOn ? <Person c={sheikh} cx={1430} top={70} w={380} shift={{ x: 1.3 * open * W, y: 0 }} /> : null}
          {fgOn ? <Gfx><div style={gone(0, -0.6)}><Headline words={words} size={300} maxW={1000} style={{ left: 50, width: 1000, top: 250 }} /></div></Gfx> : null}
        </>
      ) : null}
      {layout === "evidence" && evidence ? (
        <>
          <Gfx>
            <div style={{ position: "absolute", left: 80, top: 70, width: evBox(760, 560, 760, 560).w, height: evBox(760, 560, 760, 560).h, transform: "rotate(-3deg)", border: "12px solid #fff", boxShadow: "0 30px 50px rgba(0,0,0,.6)", overflow: "hidden", background: "#fff" }}>
              <Img src={staticFile(evidence.src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: evidence.pos }} />
              {evidence.circle ? <div style={{ position: "absolute", left: `${evidence.circle.x - evidence.circle.r}%`, top: `${evidence.circle.y - evidence.circle.r}%`, width: `${evidence.circle.r * 2}%`, aspectRatio: "1.36", border: `12px solid ${YELLOW}`, borderRadius: "50%", boxShadow: "0 0 0 4px #10131c" }} /> : null}
            </div>
          </Gfx>
          <Person c={sheikh} cx={1450} top={70} w={340} />
          <Gfx><Headline words={words} size={190} maxW={1050} style={{ left: 40, width: 1050, top: 680 }} /></Gfx>
        </>
      ) : null}
      {fgOn ? <Gfx><div style={gone(0, 0.3)}><Signature portrait={false} /></div></Gfx> : null}
    </AbsoluteFill>
  );
};

// ── samples (Studio: ThumbPro-*) — head positions measured with tools/cutout_head.py
const SH: Cutout = { src: "cov/sheikh_t268.png", headX: 907, headTop: 131, headW: 218, srcW: 1920 };
const SH_BLACK: Cutout = { src: "sheikh_gallery/black/sheikh_cov.png", headX: 975, headTop: 56, headW: 216, srcW: 1920 };
const ZAYED: Cutout = { src: "cov/zayed.png", headX: 811, headTop: 88, headW: 207, srcW: 1100 };

export const ThumbDuelL: React.FC = () => <ThumbPro format="landscape" layout="duel" bg="cov/ms_marinid.jpg" words={{ main: "أسانيد السنة", accent: "شبهة؟" }} sheikh={SH} opp={ZAYED} />;
export const ThumbWordL: React.FC = () => <ThumbPro format="landscape" layout="word" bg="broll/falaq_dawn.jpg" tone="#5a3a2a" words={{ main: "وقت", accent: "الفجر", sub: "متى يبدأ حقاً؟" }} sheikh={SH_BLACK} />;
export const ThumbEvidenceL: React.FC = () => <ThumbPro format="landscape" layout="evidence" bg="people/azharMosque.jpg" words={{ main: "صحيح", accent: "مسلم", sub: "ماذا في هذه الصفحة؟" }} sheikh={SH} evidence={{ src: "kh/muslim_cover.jpg", circle: { x: 50, y: 45, r: 22 } }} />;
export const ThumbDuelP: React.FC = () => <ThumbPro format="portrait" layout="duel" bg="cov/ms_marinid.jpg" words={{ main: "أسانيد السنة", accent: "شبهة؟" }} sheikh={SH} opp={ZAYED} />;
export const ThumbWordP: React.FC = () => <ThumbPro format="portrait" layout="word" bg="broll/falaq_dawn.jpg" tone="#5a3a2a" words={{ main: "وقت", accent: "الفجر", sub: "متى يبدأ حقاً؟" }} sheikh={SH_BLACK} />;

/**
 * ThumbPro opening (user 2026-10-30): frames 0–2 = the cover (the thumbnail); then (1) the backdrop rips in two and is gone within 10 frames (THUMBPRO_TEAR_END),
 * (2) the elements fly out in their own directions — the Sheikh to the right, the opponent to the left, the words up, the signature down — nothing from THUMBPRO_END on.
 */
export const THUMBPRO_TEAR_END = 13;
export const THUMBPRO_END = 14;
export const ThumbProOpen: React.FC<ThumbProps & { tearOrder?: number[] }> = ({ tearOrder: _t, ...p }) => {
  const f = useCurrentFrame();
  const open = Easing.in(Easing.cubic)(Math.max(0, Math.min(1, (f - 3) / (THUMBPRO_TEAR_END - 3))));
  return (
    <>
      <PaperTear from={3} to={THUMBPRO_TEAR_END} sheet={<ThumbPro {...p} part="bg" />} />
      <ThumbPro {...p} part="fg" open={open} />
    </>
  );
};
