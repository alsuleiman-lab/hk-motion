import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { NewsTearOpen, Newsprint, PaperStrip } from "./NewsPaperCover";
import { Backdrop, Book, BLUE, BROWN, Cut, Headline, STEEL, Tag } from "./CoverTry4";
import type { P } from "./CoverTry4";
import { Gfx } from "./MG";

/**
 * CoverKit — the approved cover recipe (calm blue/steel, big visible hadith book, graded cut-outs, ONE headline block, named opponent).
 * Used for the first 3 frames (0.10 s) of a video and as the thumbnail. Two layouts: landscape 1920x1080 and portrait 1080x1920.
 * Skill: .claude/skills/thumbnail-design/SKILL.md
 */
export type CoverProps = {
  format: "landscape" | "portrait";
  palette?: P;
  line1: string;            // gold headline line (2-3 words)
  line2: string;            // banner line glued under it
  oppName?: string;         // name tag of the person he answers
  sheikh?: string;          // cut-out of the Sheikh (public/ path), eyes to camera, calm
  opp?: string;             // cut-out of the opponent
  book?: string;            // prop that represents the issue (default: illuminated hadith manuscript)
  sheikhClip?: string;      // optional clip-path to remove a matte artefact
  bookPos?: string;         // object-position inside the book frame (e.g. "50% 12%" for a portrait photo used as the prop)
  sheikhPos?: { w: number; left: number; bottom: number };   // placement override for a cut-out that is a crop (not the full 1920 frame)
  oppPos?: { w: number; left: number; bottom: number };
  oppClip?: string;
  bgImage?: string;         // TOPIC background (public/ path): a place / crowd / building / flag / landscape that belongs to THIS video's subject — NEVER reuse the previous video's (cover_variety.mjs checks)
  bgFilter?: string;        // CSS filter for the backdrop (default: warm sepia look; pass e.g. "saturate(.9) brightness(.9)" for photos)
  sparkles?: boolean;       // gold dust (default true; turn off for non-manuscript topics)
  bgBlur?: number; headSize?: { s1: number; s2: number };   // override the headline sizes
  tagSize?: number;         // name tag font size
  tagLeft?: number;         // name tag left (px)
  headBottom?: number;      // lower/raise the headline block (default 110 portrait)
  headlinePos?: React.CSSProperties; // precise placement for covers with a protected face/beard zone
  tagTop?: number;          // override the name tag top (keep it below the chin line)
  bookBox?: { left: number; top: number; w: number; h: number; rot: number };   // override the prop frame (e.g. taller frame for a portrait photo)
};

const L = {
  sheikh: { w: 2200, left: 300, bottom: -95 },
  opp: { w: 860, left: -20, bottom: 120 },
  book: { left: 30, top: 90, w: 1000, h: 540, rot: -4 },
  tag: { left: 110, top: 640 },
  head: { bottom: 34, s1: 140, s2: 84 },
  glow: [1400, 440] as const,
};
// portrait: sheikh scaled 1.4x so the head sits at y~640..1030 (headroom kept), headline block over the chest at the bottom (never over a face)
const Pt = {
  sheikh: { w: 2688, left: -688, bottom: -57 },
  opp: { w: 640, left: -230, bottom: 300 },
  book: { left: 50, top: 80, w: 980, h: 520, rot: -3 },
  tag: { left: 70, top: 1290 },
  head: { bottom: 110, s1: 150, s2: 84 },
  glow: [620, 830] as const,
};

export const CoverKit: React.FC<CoverProps> = ({ bgImage, bgFilter, sparkles, format, palette = BLUE, line1, line2, oppName, sheikh = "cov/sheikh_t268.png", opp, sheikhClip, book, bookPos, sheikhPos, oppPos, oppClip, bookBox, tagTop, tagLeft, tagSize, headBottom, headSize, headlinePos, bgBlur }) => {
  const portrait = format === "portrait";
  const g = portrait ? Pt : L;
  const s1 = Math.min(g.head.s1, Math.floor((portrait ? 980 : 1500) / (line1.length * 0.58)));
  return (
    <AbsoluteFill>
      <Backdrop p={bgImage ? { ...palette, bg: bgImage } : palette} gx={g.glow[0]} gy={g.glow[1]} blur={bgBlur} filter={bgFilter} sparkles={sparkles} />
      {book ? <Gfx><Book p={palette} {...(bookBox ?? g.book)} src={book} pos={bookPos} /></Gfx> : null}
      {opp && !portrait ? <Gfx><Cut p={palette} src={opp} {...(oppPos ?? g.opp)} rim={palette.oppRim} clip={oppClip ?? "inset(0 0 0 9%)"} mask /></Gfx> : null}
      <Cut p={palette} src={sheikh} {...(sheikhPos ?? g.sheikh)} rim={palette.rim} clip={sheikhClip} />
      {/* portrait: the Sheikh's body is wide, so the opponent is drawn in FRONT, low-left, away from the beard */}
      {opp && portrait ? <Gfx><Cut p={palette} src={opp} {...(oppPos ?? g.opp)} rim={palette.oppRim} clip={oppClip ?? "inset(0 0 0 9%)"} mask /></Gfx> : null}
      {oppName ? <Gfx><Tag p={palette} style={{ left: tagLeft ?? g.tag.left, top: tagTop ?? g.tag.top, transform: "rotate(-3deg)", ...(tagSize ? { fontSize: tagSize, padding: "2px 22px 6px" } : {}) }}>{oppName}</Tag></Gfx> : null}
      <Gfx><Headline p={palette} line1={line1} line2={line2} s1={headSize ? Math.min(headSize.s1, s1) : s1} s2={headSize?.s2 ?? g.head.s2} style={{ bottom: headBottom ?? g.head.bottom, ...headlinePos }} /></Gfx>
    </AbsoluteFill>
  );
};

// extra calm palettes so covers do not all look blue (the tint is painted over the TOPIC image; no bright green/red, nothing light or black)
export const SAND: P = { ...BROWN, tint: "#8a6a3a", tintA: 0.45, glow: "rgba(255,226,170,.85)", glow2: "rgba(214,160,90,.35)", vign: "rgba(58,36,14,.55)" };
export const SLATE: P = { ...STEEL, tint: "#34495e", tintA: 0.6, glow: "rgba(226,236,246,.8)", glow2: "rgba(120,150,180,.35)", vign: "rgba(14,26,42,.6)" };
export const PLUM: P = { ...BLUE, tint: "#5a3a6a", tintA: 0.55, glow: "rgba(240,214,246,.8)", glow2: "rgba(160,110,190,.35)", vign: "rgba(30,16,42,.6)" };

/** palettes by name, for data-driven montages (MontageSpec "cover" item). One colour identity (src/brand.ts, user 2026-10-27):
 *  every name resolves to STEEL, so older specs that still name blue/brown/sand/slate/plum get the brand cover */
export const COVER_PALETTES = { blue: STEEL, brown: STEEL, steel: STEEL, sand: STEEL, slate: STEEL, plum: STEEL } as const;

export const COVERKIT_FRAMES = 30;
// examples (lesson: Ahmed Zayed's doubts about the isnads of the Sunnah)
export const KitL1: React.FC = () => <CoverKit format="landscape" line1="أسانيد السنة" line2="هل هي حقاً شبهات؟" oppName="أحمد زايد" />;
export const KitL4: React.FC = () => <CoverKit format="landscape" palette={STEEL} line1="شبهات الأسانيد" line2="هل تصمد أمام التحقيق؟" oppName="أحمد زايد" />;
export const KitP1: React.FC = () => <CoverKit format="portrait" line1="أسانيد السنة" line2="هل هي حقاً شبهات؟" oppName="أحمد زايد" />;
export const KitP4: React.FC = () => <CoverKit format="portrait" palette={STEEL} line1="شبهات الأسانيد" line2="هل تصمد أمام التحقيق؟" oppName="أحمد زايد" />;

/**
 * PaperCoverKit — the DEFAULT cover of data-spec montages (user 2026-10-27; approved proposal 2026-10-25_badawi_newspaper-cover-curl):
 * the same CoverProps layout on plain NEWSPRINT paper (texture only, no printed text), line1 on a torn PaperStrip in dark ink, line2 on a dark ink strip.
 * Frames 0–2 = the still cover; from frame 3 the whole cover — paper, cut-outs and headline together — rips in two along a ragged edge and the halves
 * pull away over his recording (NewsTearOpen → PaperTear, user 2026-10-28). Renders nothing from frame PAPER_COVER_END on.
 * `tearOrder` belonged to the old strip tear and is ignored.
 */
export const PAPER_COVER_END = 35;   // ×1.5 faster tear (user 2026-10-30): was 51
export const PaperCoverKit: React.FC<CoverProps & { tearOrder?: number[] }> = ({ format, palette = STEEL, line1 = "", line2 = "", sheikh = "cov/sheikh_t268.png", opp, sheikhClip, book, bookPos, sheikhPos, oppPos, oppClip, bookBox, headBottom, headSize, headlinePos }) => {
  const frame = useCurrentFrame();
  const portrait = format === "portrait";
  const g = portrait ? Pt : L;
  const W = portrait ? 1080 : 1920, H = portrait ? 1920 : 1080;
  if (frame >= PAPER_COVER_END) return null;
  const sp = sheikhPos ?? g.sheikh;
  const bb = bookBox ?? g.book;
  const l1 = line1 || "";
  const s1 = Math.min(headSize?.s1 ?? 130, Math.floor((portrait ? 900 : 1300) / (Math.max(1, l1.length) * 0.5)));
  const s2 = headSize?.s2 ?? (portrait ? 70 : 64);
  const stripW = Math.min(portrait ? 1040 : 1400, Math.round(Math.max(1, l1.length) * s1 * 0.62 + 160));
  const ink: P = { ...palette, rim: "rgba(60,45,20,.35)", oppRim: "rgba(60,45,20,.35)", border: "#f4efe2", glow2: "rgba(60,45,20,.25)" };
  const sheet = (
    <AbsoluteFill>
      <Newsprint w={W} h={H} />
      {book ? <Gfx><Book p={ink} {...bb} src={book} pos={bookPos} /></Gfx> : null}
      {opp && !portrait ? <Gfx><Cut p={ink} src={opp} {...(oppPos ?? g.opp)} rim={ink.oppRim} clip={oppClip ?? "inset(0 0 0 9%)"} mask /></Gfx> : null}
      <Cut p={ink} src={sheikh} {...sp} rim={ink.rim} clip={sheikhClip} />
      {opp && portrait ? <Gfx><Cut p={ink} src={opp} {...(oppPos ?? g.opp)} rim={ink.oppRim} clip={oppClip ?? "inset(0 0 0 9%)"} mask /></Gfx> : null}
      {/* no name tags under pictures (rule «عبارات الغلاف وتوقيعه»): `oppName` is ignored here; the signature sits bottom-left */}
      <Gfx><div style={{ position: "absolute", left: portrait ? 36 : 40, bottom: portrait ? 22 : 18, direction: "rtl", fontFamily: "Almarai", fontWeight: 800, fontSize: 30, color: "#3a3226" }}>محمد بن شمس الدين</div></Gfx>
      <Gfx><div style={{ position: "absolute", left: 0, right: 0, bottom: headBottom ?? (portrait ? 78 : 66), display: "flex", flexDirection: "column", alignItems: "center", ...headlinePos }}>
        <div style={{ position: "relative", width: stripW, height: Math.round(s1 * 1.45) }}><PaperStrip w={stripW} h={Math.round(s1 * 1.45)} text={l1} size={s1} style={{ left: 0, top: 0, transform: "rotate(-1.2deg)" }} /></div>
        <div style={{ marginTop: -14, direction: "rtl", whiteSpace: "nowrap", fontFamily: "Almarai", fontWeight: 800, fontSize: s2, color: "#f4efe2", background: "#2c2418", padding: "4px 44px 12px", transform: "rotate(.8deg)", boxShadow: "0 12px 22px rgba(40,30,10,.45)" }}>{line2}</div>
      </div></Gfx>
    </AbsoluteFill>
  );
  return <NewsTearOpen w={W} h={H} to={PAPER_COVER_END} sheet={sheet} />;
};
