import { z } from "zod";
import { galleryPlace } from "./galleryPlace";
import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig , getRemotionEnvironment, getInputProps } from "remotion";
import { PaperTear } from "./PaperTear";
import { Gfx, BrushX, Stamp, NoteCard, HandheldShake, SourceWalk, BlurRise, RewriteWindow, FlashCut, PinnedPhoto, TimelineTravel, PanelToCanvas, Clock, DashArc, useT } from "./MG";
import { KeyChip, ReelVerseFull, VerseWords } from "./MGExtras";
import { TitleBar } from "./TitleBar";
import type { BarTheme } from "./TitleBar";
import { NameCard1, NameCard3 } from "./NameCards";
import { Banner, StatRow, Pic, Subscribe, Sources, Flag } from "./EuKit";
import type { FlagCode } from "./EuKit";
import { FONT_TITLE, FONT_TEXT } from "./localFonts";
import { BAR_WARM, WarmBase, Only, PopCard, Word, PhoneWin, SheikhLayers, PaperScene, PaperMap, FamilyTree, TreeFx, Parchment, miniEase, FullImage, Marker, RV, LANDSCAPE, clamp } from "./PortraitKit";
import type { TreeNode, TreeLink, MapPt, MapLeg } from "./PortraitKit";
import { CoverKit, COVER_PALETTES, PaperCoverKit, PAPER_COVER_END } from "./CoverKit";
import type { CoverProps } from "./CoverKit";
import { ThumbProOpen, THUMBPRO_END, THUMBPRO_TEAR_END } from "./ThumbPro";
import type { ThumbProps } from "./ThumbPro";
import { TornNote, NewsClip, TornPhoto, WordScraps, DateCalendar } from "./PaperKit";
import { PoisonClip } from "./PoisonComps";
import { BRAND, applyBrand } from "./brand";
import type { BrandName } from "./brand";
import { MaskedVideo } from "./MaskedVideo";
import { DEBATE_LAYOUTS } from "./DebateLayouts";
import { HybridHost, HybridBg, VSlot, HY, hyBg, UnderHim } from "./hybrid/Slot";
import type { PortIso } from "./GazaFx";
import type { DebateLayoutName } from "./DebateLayouts";
import { BgClip, HClip, Watermark, FxStage, HorrorVeil, TailFade, TvOff, WeightsOnBack } from "./GazaFx";

/**
 * MontageSpec — a montage as DATA (idea of the user, 2026-10-26: «write each element once, copy it from a database, change one place and everything follows»).
 * A video is a JSON object (`data/specs/<id>.json`); this file is the ONE renderer: it maps every item type to the shared kit components (MG.tsx / PortraitKit.tsx).
 *   - change a kit component → every video made from specs changes;  change a number in the JSON → only that element moves.
 *   - to add a new element type: add one `case` below + one line in the SpecItem type; nothing else.
 * ONE spec serves BOTH orientations: the composition's size decides (1080×1920 = portrait, 1920×1080 = landscape). Same items, same seconds; the renderer places each item by the
 * orientation's layout (PORTRAIT / LANDSCAPE in PortraitKit). Item numbers (x, y, w, h) are the PORTRAIT ones; `land` overrides them for landscape (or `skip`), `only` pins an item to one orientation.
 * All times are seconds on the CUT timeline. Portrait layer order (fixed): warm base → [shake] his video → full-screen sources → <Gfx> (title bar, items, cover).
 * Landscape: his whole frame (+ push-ins) → full-screen sources → <Gfx>.
 * Quick isolation (user 2026-10-29): with a saved `matte` of the cut, inside each `behind` window he is drawn again on top (MaskedVideo), so the full-screen picture or the
 * answered clip sits BETWEEN him and his background. Used in a reel while a clip is shown, and in the full versions only where needed.
 */
type Mark = { x: number; y: number; w: number; h: number; at: number };
/** landscape override of one item (any field of the item that is a position/size, plus skip) */
export type Land = { x?: number; y?: number; w?: number; h?: number; photoH?: number; size?: number; origin?: string; marker?: Mark; skip?: boolean; dx?: number; dy?: number; k?: number };
/** every item, whatever its type, carries the same placement data in each orientation (user 2026-11-09: «لازم كل العناصر يكون لها بيانات كاملة»):
 *  dx / dy = move in px, k = scale about the centre of what the item draws; portrait on the item, landscape in `land` */
type Common = { only?: "port" | "land"; land?: Land; dx?: number; dy?: number; k?: number };
export type SpecItem = Common & (
  | { t: "word"; text: string; at: number; until: number; x: number; y: number; size?: number; tone?: "gold" | "cream"; flag?: string }
  | { t: "blur"; text: string; at: number; until: number; y: number; size?: number; accentWords?: number[]; x?: number; w?: number }   // x/w (portrait): a narrow left column under the opponent's card, text left-aligned (gallery note on BlurRise)
  | { t: "nameTag"; at: number; x: number; y: number; dur?: number; style?: "card" | "pinned" }
  | { t: "phone"; at: number; to: number; src: string; dur: number; cx?: number; cy?: number; w?: number; h?: number }
  | { t: "crop"; src: string; nat: { w: number; h: number }; crop: { x: number; y: number; w: number; h: number }; name: string; at: number; until: number; x: number; y: number; w: number; walk?: boolean }
  | { t: "pic"; src: string; at: number; until: number; x: number; y: number; w: number; h: number; marker?: Mark }
  | { t: "scene"; at: number; until: number; x: number; y: number; w: number; h: number; pieces: { src: string; x: number; y: number; w: number; at: number; rot?: number; from?: "left" | "right" | "top" | "bottom" }[] }
  | { t: "full"; src: string; from: number; to: number; origin?: string; marker?: Mark; box?: { x: number; y: number; w: number; h: number; rot?: number; plain?: boolean } }
  | { t: "rewrite"; x: number; y: number; w: number; h?: number; oldText: string; newText: string; oldAt: number; strikeAt: number; newAt: number; extra?: string; until?: number }
  | { t: "flash"; src: string; name?: string; at: number; until: number; x: number; y: number; w: number; h: number; crops: { fx: number; fy: number; zoom: number }[]; beats: number[] }
  | { t: "credit"; text: string; from?: number; to?: number }
  /** a verse written word by word at the second he recites it (text copied from data/quran by tools/quran_ayah.mjs, never typed) */
  | { t: "subscribe"; at: number; x: number; y: number; dur?: number }
  | { t: "verse"; words: string[]; times: number[]; title: string; refText: string; x: number; y: number; w: number; size?: number; until?: number; full?: boolean }
  /** a hadith in the full-screen box (user 2026-11-02): matn from sunnah.com / الدرر السنية / الشاملة word by word as he says it; `source` = book + number, e.g. «صحيح البخاري (5115)» */
  | { t: "hadith"; words: string[]; times: number[]; source: string; until?: number }
  /** a hadith on a paper NoteCard (MG NoteCard; user's gallery note 2026-11-05: «مخصصة لكتابة الأحاديث النبوية»): the matn typed as `title`, the book + number as `tag`; he stays on screen */
  | { t: "note"; at: number; until: number; title: string; tag: string; label?: string; x?: number; y?: number; w?: number; h?: number; size?: number; cps?: number }
  /** a column of written cards (EU-Protests style): dark `Banner` title + one `StatRow` card per spoken item; placed by the orientation's layout (no x/y) */
  | { t: "rows"; side?: "right"; from: number; to: number; y0?: number; step?: number; rowH?: number; pin?: { x: number; w: number }; title?:{ at: number; text: string }; rows: { at: number; label: string; sub?: string; subAt?: number; icon?: string; photo?: string }[]; /** condition → consequence: two boxes per row, the condition (icon) right, its consequence (own box) left at subAt (user 2026-11-12 sketch) */ pair?: boolean }
  /** a scholar he quotes: polaroid with the name in the white band (empty side of his frame; portrait: below the beard) */
  | { t: "scholar"; src: string; name: string; sub?: string; at: number; until?: number; x?: number; y?: number; w?: number; h?: number; pos?: string }
  /** the cover drawn over everything at the start (skill thumbnail-design). DEFAULT style "paper" (user 2026-10-27) = PaperCoverKit: newsprint sheet, 3 still frames, then the
   *  elements fly out and the sheet tears off in stop-motion until frame 35 (`tearOrder` overrides the face-first strip order). style "kit" = the old CoverKit for `frames` (default 3). `kitLand` overrides `kit` in landscape */
  | { t: "cover"; style?: "paper" | "kit"; tearOrder?: number[]; frames?: number; palette?: keyof typeof COVER_PALETTES; kit: Omit<CoverProps, "format" | "palette">; kitLand?: Partial<Omit<CoverProps, "format" | "palette">> }
  /** style "pro" (user 2026-10-28) = ThumbPro cover (duel / word / evidence, skill thumbnail-design) for frames 0–2, then the cover itself tears into paper strips (stop-motion) until frame 35; `proLand` overrides `pro` in landscape */
  | { t: "cover"; style: "pro"; tearOrder?: number[]; pro: Omit<ThumbProps, "format">; proLand?: Partial<Omit<ThumbProps, "format">> }
  /** style "image" (user 2026-11-02): a finished cover picture the user supplies (public/ path) for frames 0–2, then it rips in two (PaperTear) and is gone by THUMBPRO_END; portrait = the picture centred over its own blurred copy */
  | { t: "cover"; style: "image"; src: string }
  /** family tree on a paper card (user 2026-10-29): landscape = left half of a split screen (his frame slides right through `shifts`), portrait = card under the beard; node/link positions are relative (0..1) */
  | { t: "tree"; from: number; to: number; x: number; y: number; w: number; h: number; title: string; titleAt?: number; nodes: TreeNode[]; links: TreeLink[]; nodeW?: number; nodeH?: number; font?: number }
  /** paper map (user 2026-10-29): landscape = the whole frame behind his shrunk cut-out (`mini`), portrait = a card under the beard */
  | { t: "pmap"; atlas?: boolean; iso?: boolean; from: number; to: number; x: number; y: number; w: number; h: number; center: [number, number]; spanLat: number; landCenter?: [number, number]; landSpan?: number; highlight?: string[]; highlightAt?: Record<string, number>; geo?: "levant" | "world"; pts: MapPt[]; legs?: MapLeg[]; carSrc?: string; carW?: number }
  /** his isolated cut-out (needs `matte`) over a map, landscape only: full size until `shrinkAt`, then scaled to `scale` with his face moved to (cx, cy) */
  /** historical stations travelling on a timeline under him (skill timeline-and-numbers; user 2026-10-29): landscape = the lower half dims, portrait = the same 1920×1080 piece scaled into the lower third */
  | { t: "timeline"; stages: { at: number; date: string; title: string; sub?: string }[]; hold?: number; travel?: number; bandY?: number; axisK?: number; from?: number; to?: number; portTop?: number }
  /** «من القائمة إلى اللوحة» (skill enumeration-and-flow; user 2026-10-29, «القائمة التي فيها إشارات صح»): a list ticked one by one at the words he says, each ticked row flies into a card on the canvas */
  | { t: "p2c"; from: number; to: number; panel: { x: number; y: number; w: number; h: number; title: string; button?: string }; canvas: { x: number; y: number; w: number; h: number }; rows: { title: string; sub?: string }[]; picks: { row: number; check: number; fly: number }[]; landPanel?: { x: number; y: number; w: number; h: number }; landCanvas?: { x: number; y: number; w: number; h: number }; portPanel?: { x: number; y: number; w: number; h: number }; portCanvas?: { x: number; y: number; w: number; h: number } }
  /** the key phrase on a torn paper note (PaperKit TornNote; user 2026-10-29: «لماذا لا تستخدمه»): `underline` = index of the word the hand-drawn line goes under; `right` puts it on the right in portrait when the left is taken */
  | { t: "torn"; text: string; at: number; until: number; size?: number; underline?: number; right?: boolean; y?: number }
  /** a newspaper clipping of a real news screenshot (PaperKit NewsClip): the headline image, the outlet and date under it */
  | { t: "news"; src: string; source: string; headline?: string; at: number; until: number; x: number; y: number; w: number; h: number }
  /** the stronger family tree, NO frame (user 2026-10-29): drawn on the decorated base; put a `behind` window with his matte on the same span so he stands in front of it (landscape: `dx` moves him right) */
  | { t: "treefx"; skin?: "parchment"; from: number; to: number; x: number; y: number; w: number; h: number; title: string; titleAt?: number; nodes: TreeNode[]; links: TreeLink[]; nodeW?: number; nodeH?: number; font?: number; titleSize?: number; land?: { x: number; y: number; w: number; h: number; titleSize?: number; nodeW?: number; nodeH?: number; font?: number } }
  /** the photo of a person he names, in a torn white border with tape (PaperKit TornPhoto; PREFERENCES «متى يُستعمل كل عنصر»: mandatory for every named person) */
  | { t: "tphoto"; src: string; name?: string; at: number; until?: number; x?: number; y?: number; w?: number; h?: number; pos?: string; also?: { src: string; name?: string; at: number }[] }
  /** an important line of his speech on torn paper scraps, one word per scrap, centred in the writing area (PaperKit WordScraps) */
  | { t: "scraps"; text: string; at: number; until: number; y?: number; size?: number; times?: number[] /* the second each word is spoken: node tools/scraps_times.mjs */ }
  /** a clock whenever he speaks of time or a duration (MG Clock) */
  | { t: "clock"; at: number; until: number; x?: number; y?: number; size?: number }
  /** two related people/things pinned side by side and joined by a dotted arc when he links them (first = the one on the right; MG DashArc) */
  | { t: "arc"; at: number; until: number; arcAt?: number; a: { src: string; name: string; x: number; y: number; w?: number; h?: number }; b: { src: string; name: string; x: number; y: number; w?: number; h?: number }; landA?: { x: number; y: number; w?: number; h?: number }; landB?: { x: number; y: number; w?: number; h?: number }; landLift?: number }
  /** a country's flag springing in (PopCard around EuKit Flag) when he names the country */
  | { t: "flag"; code: FlagCode; at: number; until: number; x?: number; y?: number; w?: number }
  /** a date as a ready-made calendar motion graphic (PaperKit DateCalendar) */
  | { t: "date"; text: string; sub?: string; from?: number /* a spoken starting number: the pages count from it (calendar shows only true data) */; at: number; until?: number; x?: number; y?: number; w?: number; h?: number }
  /** an explainer motion clip (src/Poison*.tsx; user 2026-11-05: «كيف تعمل السموم»), landscape only: `half` = left 960×1080 half (add a `shifts` window so his face stays clear), `sticker` = scaled over the video */
  | { t: "poison"; id: string; at: number; until: number; mode: "half" | "sticker"; x?: number; y?: number; scale?: number; map?: [number, number][]; parts?: string[]; refs?: { n: number; at: number }[]; badges?: boolean }
  | { t: "mini"; from: number; to: number; shrinkAt: number; scale: number; cx: number; cy: number; matte?: { src: string; start?: number } }
  /** user-ordered effects of one video (src/GazaFx.tsx): a clip fills the screen behind him (pair with a `behind` window), a clip on half the screen (pair with `shifts` / `psplits`),
   *  a fading watermark, a zoom+flash transition at `at`, and the horror grade over everything */
  | { t: "bgclip"; src: string; from: number; to: number; fade?: number; start?: number; dim?: number }
  | { t: "hclip"; src: string; from: number; to: number; start?: number; zoom?: number; fx?: number; fy?: number; label?: string }
  | { t: "wm"; text: string; from: number; to: number; opacity?: number; ramp?: number; x?: number; y: number; size?: number; rot?: number }
  | { t: "zoomblend"; at: number; amt?: number }
  | { t: "horror"; from: number; to: number }
  /** CRT screen switching off over everything from `at` (user order inside «فضل شاكر», 2026-11-10) */
  | { t: "tvoff"; at: number; dur?: number }
  /** full-screen «الأوزار على ظهره» scene (src/GazaFx.tsx WeightsOnBack; user order inside «فضل شاكر», 2026-11-10) */
  | { t: "weights"; at: number; until: number; fig: string; crowd: string; n?: number }
  /** the gallery BrushX: a red hand-brushed X over a picture he rejects (user 2026-11-10: «حط عليها اكس»); x/y/w/h are landscape px of the picture */
  | { t: "brushx"; at: number; x: number; y: number; w: number; h: number; until?: number }
  | { t: "stamp"; at: number; until?: number; text: string; x?: number; y?: number; size?: number; land?: { x?: number; y?: number } }
  /** a person's cut-out (background removed) that PEEKS in from the bottom-right corner like someone leaning in at a window, then draws back (user order inside «سانت رامبال», 2026-11-11); `ar` = height / width of the PNG, `dx` shifts it sideways (a second head behind the first) */
  | { t: "peek"; src: string; ar: number; at: number; until: number; w?: number; dx?: number; corner?: "br" | "bl"; say?: string }
);

export type MontageSpec = {
  id: string; title: string; frames: number; fps?: number;
  cut?: string;                       // public/<cut>.mp4 — his video (also the audio)
  bar?: BarTheme;                     // title-bar / key-chip colours (default BAR_WARM)
  showTitleBar?: boolean;             // whether to render TitleBar (in lessons and streams: NO title bar, user 2026-11-05)
  cams?: { from: number; to: number; cx: number }[];
  zooms?: { from: number; to: number; amt?: number }[];
  /** gallery grid mode only (user 2026-11-09): moves / resizes the whole graphics layer for elements whose fields carry no x / y / size; (ox, oy) = the scale origin */
  shake?: { from: number; to: number }[];
  /** windows where the source recording has a baked-in split (clip left | him right): landscape = the reply model `layout` behind a curtain (default "dossier" = الملف, user 2026-10-30;
   *  blocks | dossier, src/DebateLayouts.tsx;); portrait = his slice + the clip as a tilted card at his shoulder (x/w are source px) */
  splits?: { from: number; to: number; clip: { x: number; w: number; y?: number; h?: number }; sheikh: { x: number; w: number }; clipName?: string; clipUrl?: string; faceX?: number; blur?: number; layout?: DebateLayoutName; card?: { left: number; top: number; rot: number; innerH: number } }[];
  /** an audio message added after his video: plays `src` from `from` s (+ voice card with a waveform and cycling photos) */
  tail?: { from: number; to: number; src: string; label: string; photos: string[] };
  /** light sound effects at transitions / element entries (user 2026-11-06: light, varied, not loud, not many): src under public/sfx, at = seconds on the cut timeline, vol relative to speech (≤ 0.06) */
  sfx?: { src: string; at: number; vol: number; only?: "land" | "port"; dur?: number /* seconds the sound plays (default 1.5) */ }[];
  /** the colour palette of the one identity (src/brand.ts PALETTES; default steel) */
  brand?: BrandName;
  /** "full" = the whole video (landscape and/or full portrait, same timeline); "reel" = a chosen excerpt ≤ 3 min, portrait only (hook 10–15 s, full-screen verses) */
  kind?: "full" | "reel";
  /** quick isolation: the gray matte of the cut (white = him) from  node tools/matte_cache.mjs get public/<cut> 0 <end>  → { src, startFrom = its offsetFrames } */
  matte?: { src: string; startFrom?: number; start?: number /* cut second at which the matte file starts (matte_cache window start) */ };
  /** windows where the recording has a baked-in split but the clip beside him must NOT be shown (user 2026-10-29): landscape = only his slice (source x/w px, scaled by `scale`) on the decorated base behind a curtain,
   *  graphics replace the clip; portrait = no entry needed (put his slice centre in `cams`) */
  solos?: { from: number; to: number; sheikh: { x: number; w: number }; scale?: number; align?: "right"; center?: { from: number; to: number }[] }[];
  /** portrait split screen (user 2026-10-29: «عند الشجرة والعناصر الكبيرة استخدم تقسيم الشاشة»): inside each window his video shrinks to the top (scale `s`, pinned at the top centre) and the lower part of the frame is a backdrop panel for the big element (`parchment` for the family tree) */
  psplits?: { from: number; to: number; s?: number; panel?: "warm" | "parchment" }[];
  /** landscape split screen: his frame slides right by `dx` px between from and to (eased 0.4 s) so a left-hand panel (family tree) gets half the screen */
  shifts?: { from: number; to: number; dx: number; feather?: number }[];
  /** windows (cut seconds) where he is drawn over the full-screen pictures and the clip card (needs `matte`) */
  behind?: { only?: "port" | "land"; from: number; to: number; matte?: { src: string; startFrom?: number; start?: number }; dx?: number; fade?: number /* his cut-out dissolves over the last `fade` s */ }[];
  /** set by the gallery only: its item already carries the place being edited, so the saved gallery place is not added again */
  galleryOwn?: boolean;
  items: SpecItem[];
};

type Orient = "port" | "land";
const ROWS = {
  port: { x: 40, w: 1000, bannerY: 1440, rowY: (i: number, t: boolean) => (t ? 1515 : 1445) + i * 122, rowH: 112, bannerSize: 32 },
  land: { x: 40, w: 600, bannerY: 150, rowY: (i: number, t: boolean) => (t ? 285 : 150) + i * 185, rowH: 160, bannerSize: 38 },
};

/** a cut-out head leaning in from the bottom corner: it slides up with a tilt, holds, and draws back (no fading: position and rotation only) */
// a head-and-shoulders cut-out leans in from the bottom corner, tilted, then drops back (user 2026-11-11); `say` = a paper speech bubble from his head (user: «فقاعة عادي»)
export const PeekIn: React.FC<{ src: string; ar: number; at: number; until: number; w: number; dx: number; corner: "br" | "bl"; z: number; say?: string }> = ({ src, ar, at, until, w, dx, corner, z, say }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps, IN = 0.5, OUT = 0.5;
  const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  const p = Math.min(ease((t - at) / IN), ease((until - t) / OUT));
  if (p <= 0) return null;
  const h = w * ar, sx = corner === "br" ? 1 : -1;
  const sway = Math.sin((t - at) * 3.2) * 1.2 * p;
  const side = corner === "br" ? { right: 20 + dx } : { left: 20 + dx };
  return <div style={{ position: "absolute", ...side, bottom: 0, width: w, height: h, zIndex: z, transformOrigin: corner === "br" ? "100% 100%" : "0% 100%", transform: `translate(${sx * (1 - p) * w * 0.55}px, ${(1 - p) * h * 1.02}px) rotate(${sx * (-(1 - p) * 16 + sway)}deg)`, filter: "drop-shadow(0 8px 14px rgba(0,0,0,.45))" }}>
    <Img src={staticFile(src)} style={{ width: "100%", height: "100%" }} />
    {say ? <PeekSay text={say} t={t - at - 0.45} out={until - t} corner={corner} w={w} h={h} /> : null}
  </div>;
};
// the bubble pops out of the head once it is up (spring scale from the tail, no opacity fade), and shrinks back into it before the head drops
const PeekSay: React.FC<{ text: string; t: number; out: number; corner: "br" | "bl"; w: number; h: number }> = ({ text, t, out, corner, w, h }) => {
  const pop = (x: number) => { x = Math.min(1, Math.max(0, x)); return x <= 0 ? 0 : 1 + 0.18 * Math.sin(x * Math.PI * 1.15) * (1 - x) * 2.2 - (1 - x) * (1 - x); };
  const k = Math.max(0, Math.min(pop(t / 0.32), pop(out / 0.28 - 0.4)));
  if (k <= 0) return null;
  const bw = Math.max(200, w * 0.62), bh = bw * 0.46, R = corner === "bl";
  return <div style={{ position: "absolute", [R ? "left" : "right"]: w * 0.78, top: -bh * 0.55, width: bw, height: bh, transformOrigin: R ? "0% 100%" : "100% 100%", transform: `scale(${k}) rotate(${R ? -4 : 4}deg)` }}>
    <svg width={bw} height={bh * 1.28} viewBox={`0 0 ${bw} ${bh * 1.28}`} style={{ position: "absolute", inset: 0, overflow: "visible", filter: "drop-shadow(0 6px 10px rgba(0,0,0,.4))" }}>
      <path d={`M ${bw * 0.06} ${bh * 0.12} Q ${bw * 0.02} ${bh * 0.02} ${bw * 0.14} ${bh * 0.03} L ${bw * 0.9} 0 Q ${bw} ${bh * 0.02} ${bw * 0.97} ${bh * 0.16} L ${bw * 0.95} ${bh * 0.86} Q ${bw * 0.94} ${bh} ${bw * 0.82} ${bh * 0.97} L ${R ? bw * 0.3 : bw * 0.7} ${bh * 0.96} L ${R ? bw * 0.04 : bw * 0.96} ${bh * 1.26} L ${R ? bw * 0.18 : bw * 0.82} ${bh * 0.95} L ${bw * 0.12} ${bh * 0.94} Q ${bw * 0.03} ${bh * 0.92} ${bw * 0.04} ${bh * 0.8} Z`} fill="#f4ecd8" stroke="#2b2621" strokeWidth={4} strokeLinejoin="round" />
    </svg>
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontFamily: "Noto Kufi Arabic", fontWeight: 800, fontSize: bh * 0.46, color: "#2b2621", direction: "rtl" }}>{text}</div>
  </div>;
};
// the centre the gallery size grows about, from the element's OWN declared box (2026-11-11: measuring the drawn element failed in the phone preview —
// the picture stayed small and stuck to the frame edge while the render was right); types not listed here are still measured on screen
const boxCentre = (it: SpecItem, o: Orient): [number, number] | null => {
  const L = o === "land", ov = ((it as { land?: Land }).land ?? {}) as Land & { w?: number; h?: number; x?: number; y?: number }, G = LANDSCAPE.left;
  const q = it as unknown as { t: string; x?: number; y?: number; w?: number; h?: number; also?: unknown[] };
  if (q.t === "tphoto") { const w = (L ? ov.w : q.w) ?? 300, h = (L ? ov.h : q.h) ?? 370, x = L ? ov.x ?? G.x : q.x ?? 40, y = L ? ov.y ?? G.y : q.y ?? 1360, n = 1 + (q.also?.length ?? 0); return [x + (n * w + (n - 1) * 24) / 2, y + h / 2]; }
  if (q.t === "scholar") { const w = (L ? ov.w : undefined) ?? q.w ?? 300, h = (L ? ov.h : undefined) ?? q.h ?? 370, x = L ? ov.x ?? G.x : q.x ?? 40, y = L ? ov.y ?? G.y : q.y ?? 1360; return [x + w / 2, y + h / 2]; }
  if (q.t === "pic" && q.w && q.h) { const w = L ? ov.w ?? G.w : q.w, h = L ? ov.h ?? Math.round((q.h * w) / q.w) : q.h, x = L ? ov.x ?? G.x : q.x ?? 40, y = L ? ov.y ?? G.y : q.y ?? 1360; return [x + w / 2, y + h / 2]; }
  if (q.t === "news" && q.w && q.h) { const w = L ? ov.w ?? 600 : q.w, h = Math.round((q.h * w) / q.w), x = L ? ov.x ?? G.x : q.x ?? 40, y = L ? ov.y ?? G.y : q.y ?? 1360; return [x + w / 2, y + h / 2]; }
  if (q.t === "date") { const w = (L ? ov.w : undefined) ?? q.w ?? 340, x = L ? ov.x ?? G.x : q.x ?? 300, y = L ? ov.y ?? G.y : q.y ?? 1330; return [x + w / 2, y + w * 0.55]; }
  return null;
};
const placed = (it: SpecItem, i: number, o: Orient, n: React.ReactNode): React.ReactNode => {
  const p = o === "land" ? it.land : it, dx = p?.dx ?? 0, dy = p?.dy ?? 0, k = p?.k ?? 1;
  const c = k !== 1 ? boxCentre(it, o) : null;
  return n && (dx || dy || k !== 1) ? <GxLayer key={"place" + i} gx={{ dx, dy, k, ...(c ? { ox: c[0], oy: c[1] } : {}) }}>{n}</GxLayer> : n;
};
const renderItem = (it: SpecItem, i: number, o: Orient, bar: BarTheme): React.ReactNode => placed(it, i, o, renderItemRaw(it, i, o, bar));
const renderItemRaw = (it: SpecItem, i: number, o: Orient, bar: BarTheme): React.ReactNode => {
  if (it.only && it.only !== o) return null;
  const L = o === "land", ov: Land = it.land ?? {}, G = LANDSCAPE.left;
  if (L && ov.skip) return null;
  switch (it.t) {
    case "word":
      return L
        ? <KeyChip key={i} phrases={[{ text: it.text, at: it.at }]} until={it.until} x={ov.x} y={ov.y ?? LANDSCAPE.keyY} size={ov.size ?? 54} theme={bar} />
        : <Word key={i} text={it.text} at={it.at} until={it.until} x={it.x} y={it.y} size={it.size} tone={it.tone} flag={it.flag} />;
    case "blur":   // the opponent's words (landscape): under the answered clip, centred at (431, 880), tilted −7° (the user's red box, 2026-11-05)
      return L
        ? <KeyChip key={i} phrases={[{ text: it.text, at: it.at }]} until={it.until} x={ov.x ?? 431} y={ov.y ?? 880} size={ov.size ?? 29} rot={-7} theme={bar} />
        : <Only key={i} from={it.at} to={it.until}><BlurRise at={it.at} times={[it.at, it.at + 0.4]} text={it.text} x={it.x ?? Math.round((1080 - (it.w ?? 820)) / 2)} w={it.w ?? 820} y={it.y} size={it.size ?? 58} color="#fff" accentColor={BRAND.accent} accentWords={it.accentWords ?? []} canvasW={1080} align={it.w ? "left" : undefined} /></Only>;
    case "note": {
      const w = L ? ov.w ?? it.w ?? 600 : it.w ?? 820, size = it.size ?? 38;
      const lines = Math.max(1, Math.ceil([...it.title].length / Math.max(1, Math.floor((w - 70) / (size * 0.5))))), h = ov.h ?? it.h ?? Math.round(130 + lines * size * 1.6);
      const x = L ? ov.x ?? 40 : it.x ?? Math.round((1080 - w) / 2);
      return <Only key={i} from={it.at} to={it.until}><NoteCard at={it.at} x={x} y={L ? ov.y ?? 150 : it.y ?? 1440} w={w} h={h} label={it.label ?? "حديث شريف"} tag={it.tag} title={it.title} lines={0} size={size} cps={it.cps ?? Math.max(10, Math.round([...it.title].length / Math.max(2, it.until - it.at - 1.2)))} /></Only>;
    }
    case "peek": return <Only key={i} from={it.at} to={it.until}><PeekIn src={it.src} ar={it.ar} at={it.at} until={it.until} w={it.w ?? (L ? 400 : 460)} dx={it.dx ?? 0} corner={it.corner ?? "bl"} z={i} say={it.say} /></Only>;
    case "stamp": return <Only key={i} from={it.at} to={it.until ?? it.at + 2.5}><Stamp at={it.at} x={L ? ov.x ?? it.land?.x ?? 250 : it.x ?? 330} y={L ? ov.y ?? it.land?.y ?? 760 : it.y ?? 1470} text={it.text} size={it.size ?? 56} /></Only>;   // «هذا هو المرجح» (user 2026-11-12): the gallery red stamp at the word
    case "brushx": return L ?<BrushX key={i} at={it.at} x={ov.x ?? it.x} y={ov.y ?? it.y} w={ov.w ?? it.w} h={ov.h ?? it.h} until={it.until} /> : null;
    case "poison":
      return L ? <PoisonClip key={i} id={it.id} at={it.at} until={it.until} x={it.mode === "half" ? 0 : it.x ?? 16} y={it.mode === "half" ? 0 : it.y ?? 150} scale={it.mode === "half" ? 1 : it.scale ?? 0.7} cfg={{ map: it.map, only: it.parts, nobadges: !it.badges }} refs={it.refs ?? []} /> : null;
    case "nameTag": {   // the old NameTag was dropped in the gallery (2026-10-28): the approved name card 1, or 3 with style "pinned"
      const C = it.style === "pinned" ? NameCard3 : NameCard1;
      return <Only key={i} from={it.at} to={it.at + (it.dur ?? 4)}><C at={it.at} x={L ? ov.x ?? LANDSCAPE.W / 2 : it.x} y={(L ? ov.y ?? LANDSCAPE.nameY : it.y) + 40} /></Only>;
    }
    case "phone": return L ? null : <PhoneWin key={i} at={it.at} to={it.to} src={it.src} dur={it.dur} cx={it.cx} cy={it.cy} w={it.w} h={it.h} />;
    case "crop": {     // the cropped region inside a PinnedPhoto
      const x = L ? ov.x ?? G.x : it.x, y = L ? ov.y ?? G.y : it.y, w = L ? ov.w ?? G.w : it.w;
      const iw = w - 20, k = iw / it.crop.w, ih = Math.round(it.crop.h * k);
      return (
        <Only key={i} from={it.at} to={it.until}>
          <PinnedPhoto at={it.at} x={x} y={y} w={w} h={ih + 78} name={it.name} rot={i % 2 ? 2 : -3}>
            <Pic src={it.src} style={{ position: "absolute", left: -it.crop.x * k, top: -it.crop.y * k, width: it.nat.w * k, height: it.nat.h * k, maxWidth: "none" }} />
          </PinnedPhoto>
        </Only>
      );
    }
    case "pic": {
      const x = L ? ov.x ?? G.x : it.x, y = L ? ov.y ?? G.y : it.y, w = L ? ov.w ?? G.w : it.w, h = L ? ov.h ?? Math.round((it.h * w) / it.w) : it.h;
      const mk = L ? ov.marker ?? it.marker : it.marker;
      return (
        <Only key={i} from={it.at} to={it.until}>
          <SourceWalk at={it.at} w={w} h={h} from={{ x: -w - 40, y }} mid={{ x: x - 30, y: y + 5 }} to={{ x, y }} switchAt={0.2} sprint={0.55} impact={false}>
            <div style={{ position: "relative", width: w, height: h, borderRadius: 14, overflow: "hidden", border: `5px solid ${BRAND.card}`, boxSizing: "border-box" }}>
              <Pic src={it.src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              {mk ? <Marker at={mk.at - it.at} x={mk.x} y={mk.y} w={mk.w} h={mk.h} /> : null}
            </div>
          </SourceWalk>
        </Only>
      );
    }
    case "scene": {
      const w = L ? ov.w ?? G.w : it.w, k = w / it.w, h = L ? ov.h ?? Math.round(it.h * k) : it.h;
      const pieces = L ? it.pieces.map((p) => ({ ...p, x: p.x * k, y: p.y * k, w: p.w * k })) : it.pieces;
      return <PaperScene key={i} at={it.at} until={it.until} x={L ? ov.x ?? G.x : it.x} y={L ? ov.y ?? G.y : it.y} w={w} h={h} pieces={pieces} />;
    }
    case "rewrite": return <Only key={i} from={it.oldAt - 0.4} to={it.until ?? it.newAt + 8}><RewriteWindow x={L ? ov.x ?? G.x : it.x} y={L ? ov.y ?? G.y : it.y} w={L ? ov.w ?? 640 : it.w} h={L ? ov.h ?? it.h : it.h} oldText={it.oldText} newText={it.newText} oldAt={it.oldAt} strikeAt={it.strikeAt} newAt={it.newAt} extra={it.extra} until={it.until} /></Only>;
    case "flash": {
      const w = L ? ov.w ?? G.w : it.w, h = L ? ov.h ?? Math.round((it.h * w) / it.w) : it.h;
      return (
        <Only key={i} from={it.at} to={it.until}>
          <FlashCut at={it.at} x={L ? ov.x ?? G.x : it.x} y={L ? ov.y ?? G.y : it.y} w={w} h={h} beats={it.beats} crops={it.crops}>
            <Pic src={it.src} style={{ width: w, height: h, objectFit: "cover" }} />
          </FlashCut>
          {it.name ? <div style={{ position: "absolute", left: L ? ov.x ?? G.x : it.x, top: (L ? ov.y ?? G.y : it.y) + h, width: w, height: 48, background: BRAND.navyDeep, color: "#fff", fontFamily: "Noto Kufi Arabic", fontSize: 30, textAlign: "center", direction: "rtl", lineHeight: "48px", whiteSpace: "nowrap", borderRadius: "0 0 10px 10px" }}>{it.name}</div> : null}
        </Only>
      );
    }
    case "subscribe": return <Subscribe key={i} at={it.at} x={L ? ov.x ?? 1300 : it.x} y={L ? ov.y ?? 790 : it.y} dur={it.dur} />;
    case "verse": {
      // a verse he recites INSIDE his talk = the known verse card (VerseWords) in the writing area / the empty side, his picture visible (user 2026-11-01); full screen (full:true) only for a lone recitation
      const to = it.until ?? it.times[it.times.length - 1] + 1.2;
      if (it.full) return <ReelVerseFull key={i} to={to} refName={`${it.title} — ${it.refText}`} lines={[{ words: it.words, times: it.times }]} />;
      return <VerseWords key={i} words={it.words} times={it.times} x={L ? ov.x ?? G.x : it.x} y={L ? ov.y ?? G.y : it.y} w={L ? ov.w ?? G.w : it.w} size={L ? ov.size ?? 38 : it.size ?? 44} title={it.title} refText={it.refText} until={to} />;
    }
    case "hadith": return <ReelVerseFull key={i} hadith to={it.until ?? it.times[it.times.length - 1] + 1.2} refName={it.source} lines={[{ words: it.words, times: it.times }]} />;
    case "credit": return <Only key={i} from={it.from ?? 0.5} to={it.to ?? 9999}><Sources links={[{ at: it.from ?? 0.5, url: it.text }]} x={40} bottom={L ? 24 : 178} w={L ? 1100 : 1000} size={L ? 22 : 24} /></Only>;
    case "rows": {
      const g = ROWS[o], titled = !!it.title && (L || it.rows.length < 3), gx = L && it.side === "right" ? 1920 - 40 - g.w : g.x;
      // `y0/step/rowH` (portrait) pack a long list under the beard: first row top, row pitch, row height
      const rowY = (n: number) => (!L && it.y0 !== undefined ? it.y0 + n * (it.step ?? 112) : g.rowY(n, titled)), rowH = !L && it.rowH ? it.rowH : g.rowH;
      return (
        <Only key={i} from={it.from} to={it.to}>
          {titled && it.title ? <Banner at={it.title.at} x={L && it.pair ? 16 : gx} y={g.bannerY} w={L && it.pair ? 1170 : g.w} text={it.title.text} size={g.bannerSize} /> : null}
          {L && it.pair ? it.rows.map((r, n) => [
              <StatRow key={"c" + n} at={r.at} x={16 + 590} y={rowY(n)} w={580} h={rowH} icon={r.icon ?? "Quote"} label={r.label} rot={n % 2 ? 1 : -1} />,
              r.sub ? <StatRow key={"r" + n} at={r.subAt ?? r.at} x={16} y={rowY(n)} w={580} h={rowH} icon="" noIcon label={r.sub} rot={n % 2 ? -1 : 1} /> : null])
            : it.rows.map((r, n) => <StatRow key={n} at={r.at} x={!L && it.pin ? it.pin.x : gx} y={rowY(n)} w={!L && it.pin ? it.pin.w : g.w} h={rowH} icon={r.icon ?? "Quote"} label={r.label} sub={r.sub} subAt={r.subAt} photo={r.photo} rot={n % 2 ? 1 : -1} />)}
        </Only>
      );
    }
    case "tree": {
      const x = L ? ov.x ?? 30 : it.x, y = L ? ov.y ?? 60 : it.y, w = L ? ov.w ?? 820 : it.w, h = L ? ov.h ?? 900 : it.h;
      return <FamilyTree key={i} from={it.from} until={it.to} x={x} y={y} w={w} h={h} title={it.title} titleAt={it.titleAt} nodes={it.nodes} links={it.links} nodeW={it.nodeW} nodeH={it.nodeH} font={it.font} />;
    }
    case "pmap": return L || it.iso ? null : <PaperMap key={i} at={it.from} until={it.to} x={it.x} y={it.y} w={it.w} h={it.h} center={it.center} spanLat={it.spanLat} highlight={it.highlight} highlightAt={it.highlightAt} geo={it.geo} atlas={it.atlas} pts={it.pts} legs={it.legs} carSrc={it.carSrc} carW={it.carW} />;
    case "mini": return null;
    case "treefx": return L ? null : <TreeFx key={i} skin={it.skin} from={it.from} until={it.to} x={it.x} y={it.y} w={it.w} h={it.h} title={it.title} titleAt={it.titleAt} nodes={it.nodes} links={it.links} nodeW={it.nodeW} nodeH={it.nodeH} font={it.font} titleSize={it.titleSize} />;   // landscape: base layer under him, see MontageFromSpec
    case "torn": {
      const size = L ? ov.size ?? 60 : it.size ?? 48, w = Math.min(L ? 1000 : 820, Math.max(360, Math.round(it.text.replace(/[ً-ٰٟۖ-ۭ]/g, "").length * size * 0.44 + 3.2 * size + 50)));   // TornNote: max 820px in portrait -> at least 130px margins on both sides
      const x = L ? (ov.x !== undefined ? ov.x - w / 2 : (1920 - w) / 2) : it.right ? 950 - w : (1080 - w) / 2, y = L ? ov.y ?? 850 : it.y ?? 1470;
      return <TornNote key={i} at={it.at} until={it.until} x={x} y={y} w={w} text={it.text} size={size} underline={it.underline} />;
    }
    case "news": { const w = L ? ov.w ?? 600 : it.w, h = Math.round((it.h * w) / it.w); return <NewsClip key={i} at={it.at} until={it.until} x={L ? ov.x ?? LANDSCAPE.left.x : it.x} y={L ? ov.y ?? LANDSCAPE.left.y : it.y} w={w} h={h} src={it.src} headline={it.headline} source={it.source} />; }
    case "p2c": return <Only key={i} from={it.from} to={it.to}><PanelToCanvas at={it.from} panel={L && it.landPanel ? { ...it.panel, ...it.landPanel } : !L && it.portPanel ? { ...it.panel, ...it.portPanel } : it.panel} canvas={L && it.landCanvas ? it.landCanvas : !L && it.portCanvas ? it.portCanvas : it.canvas} rows={L ? it.rows : it.rows.map(({ title }) => ({ title }))} picks={it.picks} /></Only>;
    case "timeline": return L
      ? <TimelineTravel key={i} stages={it.stages} hold={it.hold} travel={it.travel} bandY={it.bandY} axisK={it.axisK} compact />
      : <div key={i} style={{ position: "absolute", left: 0, top: it.portTop ?? 1313, width: 1920, height: 1080, transform: "scale(0.5625)", transformOrigin: "0 0" }}><TimelineTravel stages={it.stages} hold={it.hold} travel={it.travel} compact /></div>;
    case "scholar": return <Only key={i} from={it.at} to={it.until ?? it.at + 6}><PinnedPhoto at={it.at} x={L ? ov.x ?? LANDSCAPE.left.x : it.x ?? 40} y={L ? ov.y ?? LANDSCAPE.left.y : it.y ?? 1360} w={(L ? ov.w : undefined) ?? it.w ?? 300} h={(L ? ov.h : undefined) ?? it.h ?? 370} name={it.name} sub={it.sub} rot={-3}><Pic src={it.src} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: it.pos ?? "50% 20%" }} /></PinnedPhoto></Only>;
    case "tphoto": {
      // several photos named in one breath (the books of one sentence) stand SIDE BY SIDE, each popping up at its word, all leaving together (user 2026-10-31)
      const w = (L ? ov.w : it.w) ?? 300, h = (L ? ov.h : it.h) ?? 370, x0 = L ? ov.x ?? LANDSCAPE.left.x : it.x ?? 40, y0 = L ? ov.y ?? LANDSCAPE.left.y : it.y ?? 1360;
      const all = [{ src: it.src, name: it.name, at: it.at }, ...(it.also ?? [])], n = all.length;
      return <React.Fragment key={i}>{all.map((p, j) => <TornPhoto key={j} at={p.at} until={it.until ?? it.at + 6} x={x0 + (n - 1 - j) * (w + 24)} y={y0} w={w} h={h} src={p.src} name={p.name} pos={it.pos} />)}</React.Fragment>;
    }
    case "scraps": return <WordScraps key={i} at={it.at} until={it.until} y={L ? ov.y ?? 845 : it.y ?? 1330} text={it.text} times={it.times} size={L ? ov.size ?? 50 : it.size ?? 36} />;   {/* 60 % of the former 84 / 60 (user 2026-10-31) */}
    case "clock": { const size = L ? ov.size ?? 360 : it.size ?? 300; return <Only key={i} from={it.at} to={it.until}><div style={{ position: "absolute", left: L ? ov.x ?? 140 : it.x ?? 60, top: L ? ov.y ?? 300 : it.y ?? 1330 }}><Clock at={it.at} size={size} /></div></Only>; }
    case "arc": {
      // landscape (user 2026-10-31): one picture on each side of him (right-hand one first), the dotted line passes under his beard
      const A = L && it.landA ? { ...it.a, ...it.landA } : it.a, B = L && it.landB ? { ...it.b, ...it.landB } : it.b;
      const photo = (q: typeof it.a, rot: number) => <PinnedPhoto at={it.at} x={q.x} y={q.y} w={q.w ?? 300} h={q.h ?? 380} name={q.name} rot={rot}><Pic src={q.src} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 20%" }} /></PinnedPhoto>;
      const ax = A.x + (A.w ?? 300) / 2, bx = B.x + (B.w ?? 300) / 2;
      return <Only key={i} from={it.at} to={it.until}>{photo(A, -3)}{photo(B, 2)}<DashArc at={it.arcAt ?? it.at + 0.5} x1={ax} y1={A.y + (A.h ?? 380) + 60} x2={bx} y2={B.y + (B.h ?? 380) + 60} under lift={L ? it.landLift ?? 200 : 110} /></Only>;
    }
    case "date": return <DateCalendar key={i} at={it.at} until={it.until ?? it.at + 5} x={L ? ov.x ?? LANDSCAPE.left.x : it.x ?? 300} y={L ? ov.y ?? LANDSCAPE.left.y : it.y ?? 1330} w={(L ? ov.w : undefined) ?? it.w ?? 340} text={it.text} sub={it.sub} from={it.from} />;
    case "flag": { const w = L ? ov.w ?? 220 : it.w ?? 220; /* each orientation reads ITS OWN size (user 2026-11-09: never mix landscape and portrait positions/sizes) */ return <Only key={i} from={it.at} to={it.until}><PopCard at={it.at} x={L ? ov.x ?? LANDSCAPE.left.x : it.x ?? 60} y={L ? ov.y ?? LANDSCAPE.left.y : it.y ?? 1360}><Flag c={it.code} w={w} h={Math.round(w * 0.67)} /></PopCard></Only>; }
    case "wm": return L ? <Watermark key={i} text={it.text} from={it.from} to={it.to} opacity={it.opacity} ramp={it.ramp} x={ov.x ?? it.x} y={ov.y ?? it.y} size={ov.size ?? it.size} rot={it.rot} /> : <Watermark key={i} text={it.text} from={it.from} to={it.to} opacity={it.opacity} ramp={it.ramp} x={it.x} y={it.y} size={it.size} rot={it.rot} />;
    default: return null; // "full" is a base-layer item and "cover" a top-layer item (below); bgclip / hclip / zoomblend / horror are layers of MontageFromSpec
  }
};


/** push-in easing: smoothstep, no constant-speed ramp (user 2026-10-30: «فيه رجفة») */
/** quintic smootherstep: zero velocity AND acceleration at both ends, so a push-in never jerks (user 2026-11-09: «فيه رجفة») */
const smoother2 = (x: number) => x * x * x * (x * (x * 6 - 15) + 10);
type Split = NonNullable<MontageSpec["splits"]>[number];
const CARD_BORDER = 14, CARD_STRIP = 56, CARD_H = 800;
/** one polaroid card showing the source-pixel column [x, x+w) of the cut at height CARD_H */
const CropPolaroid: React.FC<{ cut: string; x: number; w: number; y?: number; h?: number; name: string; left: number; top: number; rot: number; innerH?: number; blur?: number }> = ({ cut, x, w, name, left, top, rot, innerH = CARD_H, blur, y = 0, h = 1080 }) => {
  const k = innerH / h, iw = Math.round(w * k);
  return (
    <div style={{ position: "absolute", left, top, width: iw + CARD_BORDER * 2, height: innerH + CARD_BORDER * 2 + CARD_STRIP, background: hyBg(BRAND.card), borderRadius: 12, transform: `rotate(${rot}deg)`, boxShadow: "0 14px 34px rgba(0,0,0,.45)" }}>
      {HY ? <>{/* hybrid: the video is composited under the graphics, so the card is drawn as a frame (an opaque card background would hide it) */}
        <div style={{ position: "absolute", left: 0, top: 0, width: iw + CARD_BORDER * 2, height: CARD_BORDER, background: BRAND.card, borderRadius: "12px 12px 0 0" }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: CARD_BORDER, height: innerH + CARD_BORDER * 2 + CARD_STRIP, background: BRAND.card, borderRadius: "12px 0 0 12px" }} />
        <div style={{ position: "absolute", right: 0, top: 0, width: CARD_BORDER, height: innerH + CARD_BORDER * 2 + CARD_STRIP, background: BRAND.card, borderRadius: "0 12px 12px 0" }} />
        <div style={{ position: "absolute", left: 0, bottom: 0, width: iw + CARD_BORDER * 2, height: CARD_STRIP + CARD_BORDER, background: BRAND.card, borderRadius: "0 0 12px 12px" }} /></> : null}
      <div style={{ position: "absolute", left: CARD_BORDER, top: CARD_BORDER, width: iw, height: innerH, overflow: "hidden", background: hyBg("#000") }}>
        {HY ? <VSlot src={cut} w={iw} h={innerH} vx={-x * k} vy={-y * k} vw={1920 * k} vh={1080 * k} /> : <RV src={staticFile(cut)} style={{ position: "absolute", left: -x * k, top: -y * k, width: 1920 * k, height: 1080 * k, ...(blur ? { filter: `blur(${blur}px)` } : {}) }} />}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: CARD_STRIP, display: "flex", alignItems: "center", justifyContent: "center", direction: "rtl", fontFamily: "Noto Kufi Arabic", fontWeight: 800, fontSize: Math.min(28, Math.floor((iw + CARD_BORDER * 2 - 16) / (name.length * 0.62))), whiteSpace: "nowrap", color: BRAND.ink }}>{name}</div>
    </div>
  );
};
/** landscape: only his slice of a baked-split recording, centred on the decorated base (the clip beside him is never shown) */
const SoloLand: React.FC<{ cut: string; sp: NonNullable<MontageSpec["solos"]>[number]; zooms?: MontageSpec["zooms"] }> = ({ cut, sp, zooms = [] }) => {
  const t = useT(0), zz = zooms.find((q) => t >= q.from - 0.01 && t <= q.to + 1.2), zm = zz ? 1 + (zz.amt ?? 0.08) * smoother2(Math.min(clamp((t - zz.from) / 1.0), clamp((zz.to + 1.2 - t) / 1.2))) : 1, s = sp.scale ?? 1, w = sp.sheikh.w * s, h = LANDSCAPE.H * s, centered = (sp.center ?? []).some((c) => t >= c.from && t < c.to);
  return (
    <Only from={sp.from} to={sp.to}>
      <AbsoluteFill>
        <WarmBase />
        <div style={{ position: "absolute", left: sp.align === "right" && !centered ? LANDSCAPE.W - w : (LANDSCAPE.W - w) / 2, top: Math.min(0, LANDSCAPE.H - h) / 2, width: w, height: h, overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, transform: `scale(${zm})`, transformOrigin: "50% 28%" }}><RV src={staticFile(cut)} style={{ position: "absolute", left: -sp.sheikh.x * s, top: 0, width: LANDSCAPE.W * s, height: h }} /></div>
        </div>
      </AbsoluteFill>
    </Only>
  );
};
/** portrait split screen: his video shrinks to the top inside a window (eased 0.4 s) */
const PortSplit: React.FC<{ windows: NonNullable<MontageSpec["psplits"]>; children: React.ReactNode }> = ({ windows, children }) => {
  const t = useT(0);
  const w = windows.find((q) => t >= q.from - 0.01 && t <= q.to + 0.4);
  const k = w ? Math.min(clamp((t - w.from) / 0.4), clamp((w.to + 0.4 - t) / 0.4)) : 0, sc = 1 + ((w?.s ?? 0.66) - 1) * k;
  return <AbsoluteFill style={{ transform: `scale(${sc})`, transformOrigin: "50% 0%" }}>{children}</AbsoluteFill>;
};
/** the backdrop under the big element: from `top` down, the base (or parchment) and a rule line that slides in */
const PortPanel: React.FC<{ windows: NonNullable<MontageSpec["psplits"]>; top?: number }> = ({ windows, top = 936 }) => {
  const t = useT(0);
  const w = windows.find((q) => t >= q.from - 0.01 && t <= q.to + 0.4);
  if (!w) return null;
  const k = Math.min(clamp((t - w.from) / 0.4), clamp((w.to + 0.4 - t) / 0.4));
  return (
    <div style={{ position: "absolute", left: 0, top: top + (1 - k) * (1920 - top), width: 1080, height: 1920 - top, overflow: "hidden", borderTop: `8px solid ${BRAND.accent}`, boxSizing: "border-box" }}>
      <div style={{ position: "absolute", left: 0, top: -top, width: 1080, height: 1920 }}>{HY ? null : w.panel === "parchment" ? <Parchment /> : <WarmBase />}</div>
    </div>
  );
};
/** curtain: a decorated panel passes in front from right to left (≈0.27 s fully covering) centred on the layout switch */
export const Curtain: React.FC<{ at: number }> = ({ at }) => {
  const t = useT(0);
  const p = (t - (at - 0.3)) / 0.6;
  if (p < 0 || p > 1) return null;
  const W = 3000;
  return (
    <div style={{ position: "absolute", top: 0, height: LANDSCAPE.H, width: W, left: LANDSCAPE.W - p * (LANDSCAPE.W + W), overflow: "hidden", borderLeft: `10px solid ${BRAND.accent}`, borderRight: `10px solid ${BRAND.accent}`, boxSizing: "border-box" }}>
      <WarmBase />
    </div>
  );
};
/** portrait: the clip as a tilted card at his right shoulder (frame left), below the beard */
const PortraitClipCard: React.FC<{ cut: string; sp: Split }> = ({ cut, sp }) => {
    return (
    <Only from={sp.from} to={sp.to}>
      <CropPolaroid cut={cut} x={sp.clip.x} w={sp.clip.w} y={sp.clip.y} h={sp.clip.h} name={sp.clipName ?? "المقطع المردود عليه"} left={sp.card?.left ?? 30} top={sp.card?.top ?? 1380} rot={sp.card?.rot ?? -2} innerH={sp.card?.innerH ?? 390} blur={sp.blur} />
    </Only>
  );
};


/** the closing audio message: decorated base, one big polaroid with a live waveform, photos of the place cycling every 4 s */
export const TailVoice: React.FC<{ tl: NonNullable<MontageSpec["tail"]> }> = ({ tl }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = useT(0);
  if (t < tl.from) return null;
  const land = width > height, cw = land ? 900 : 880, ch = land ? 640 : 700, top = land ? 120 : 330, left = (width - cw) / 2;
  const idx = Math.floor((t - tl.from) / 4) % tl.photos.length;
  const bars = Array.from({ length: 41 }, (_, i) => 0.25 + 0.75 * Math.abs(Math.sin(f * 0.23 + i * 0.9) * Math.cos(f * 0.11 + i * 0.37)));
  return (
    <AbsoluteFill>
      <WarmBase />
      <div style={{ position: "absolute", left, top, width: cw, background: BRAND.card, borderRadius: 12, padding: 14, boxSizing: "border-box", transform: "rotate(-1.2deg)", boxShadow: "0 14px 34px rgba(0,0,0,.45)" }}>
        <div style={{ width: cw - 28, height: ch, overflow: "hidden", background: BRAND.ink }}><Pic src={tl.photos[idx]} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
        <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {bars.map((b, i) => <div key={i} style={{ width: 10, height: 12 + b * 90, borderRadius: 6, background: i % 2 ? BRAND.base : BRAND.base3 }} />)}
        </div>
        <div style={{ textAlign: "center", direction: "rtl", fontFamily: "Noto Kufi Arabic", fontWeight: 800, fontSize: 34, color: BRAND.ink, paddingBottom: 6 }}>{tl.label}</div>
      </div>
    </AbsoluteFill>
  );
};

/** landscape footage: his whole 1920×1080 frame with the occasional push-in on his face (same easing as SheikhLayers) */
export const LandFootage: React.FC<{ cut: string; zooms?: { from: number; to: number; amt?: number }[]; splits?: Split[]; shifts?: { from: number; to: number; dx: number; feather?: number }[] }> = ({ cut, zooms = [], splits = [], shifts = [] }) => {
  const t = useT(0);
  const sh = shifts.find((s) => t >= s.from && t <= s.to + 0.4);
  const dx = sh ? sh.dx * Math.min(clamp((t - sh.from) / 0.4), clamp((sh.to + 0.4 - t) / 0.4)) : 0;
  const fth = sh?.feather ? sh.feather * Math.min(clamp((t - sh.from) / 0.4), clamp((sh.to + 0.4 - t) / 0.4)) : 0;
  const sp = splits.find((x) => t >= x.from && t < x.to);
  if (sp) { const L = DEBATE_LAYOUTS[sp.layout ?? "dossier"]; return <L at={sp.from} main={{ src: cut, x: sp.sheikh.x, w: sp.sheikh.w }} guest={{ src: cut, x: sp.clip.x, w: sp.clip.w, y: sp.clip.y, h: sp.clip.h, blur: sp.blur }} guestName={sp.clipName} url={sp.clipUrl} />; }
  const zz = zooms.find((z) => t >= z.from - 0.01 && t <= z.to + 1.2);
  const z = zz ? 1 + (zz.amt ?? 0.08) * smoother2(Math.min(clamp((t - zz.from) / 1.0), clamp((zz.to + 1.2 - t) / 1.2))) : 1;
  return (
    <AbsoluteFill style={{ background: hyBg(BRAND.base), transform: `translate3d(${dx}px, 0, 0) scale(${z})`, willChange: "transform", transformOrigin: LANDSCAPE.faceOrigin }}>
      {/* (user 2026-11-12, frame 6758) slid aside, his video's left part turns transparent and melts into the background (\`feather\` px): CSS mask here, the same ramp in the GPU compositor (fx.featherL) */}
      {HY ? <VSlot src={cut} w={LANDSCAPE.W} h={LANDSCAPE.H} fx={fth > 0 ? { featherL: fth } : undefined} /> : <div style={{ position: "absolute", inset: 0, ...(fth > 0 ? { WebkitMaskImage: `linear-gradient(to right, transparent 0px, black ${fth}px)`, maskImage: `linear-gradient(to right, transparent 0px, black ${fth}px)` } : {}) }}><RV src={staticFile(cut)} style={{ position: "absolute", left: 0, top: 0, width: LANDSCAPE.W, height: LANDSCAPE.H }} /></div>}
    </AbsoluteFill>
  );
};

/** quick isolation: his cut-out (cut + saved matte) with exactly the geometry of his video layer (LandFootage / SheikhLayers), drawn over what sits behind him */
export const PORT_ISO_DEFAULT: PortIso = { boxX: 30, boxY: 90, boxW: 760, boxH: 520, rot: -3, focusX: 0.5, backdrop: "soft", scale: 0.66, dx: 260 };
/* (2026-11-12) an isolation window is cut out on the GPU compositor in the hybrid render when nothing Chrome draws lies UNDER him in it: the hybrid's
   graphics layer is always on top of the videos, so a map / full picture / tree / half clip under him keeps the Chrome cut-out (JPEG frames) */
/* (2026-11-12, user: «لا اريد التفادي») every isolation window is cut out on the GPU; a map / full picture / tree that overlaps one of this orientation's
   windows is drawn in the "under" layer (UnderHim), which the compositor puts between the videos and his cut-out. `mini` (a second Chrome cut-out) is not
   an under item: it is drawn above him as before. tools/window_frames.mjs `under` lists the same frames for hybrid_any --under. */
export const UNDER_TYPES = new Set(["pmap", "full", "treefx"]);
const underHim = (spec: MontageSpec, o: Orient, x: { t?: string; from?: number; to?: number }) => UNDER_TYPES.has(x.t ?? "full") && (spec.behind ?? []).some((w) => (w.matte ?? spec.matte) && (!w.only || w.only === o) && (o === "land" || w.dx === undefined) && (x.from ?? 0) < w.to && (x.to ?? 0) > w.from);
const MaskedSheikh: React.FC<{ cut: string; matte: NonNullable<MontageSpec["matte"]>; o: Orient; cams?: MontageSpec["cams"]; zooms?: MontageSpec["zooms"]; dx?: number; from?: number; gpu?: boolean; pscale?: number; pdx?: number; pdy?: number }> = ({ cut, matte, o, cams, zooms = [], dx = 0, from = 0, gpu, pscale, pdx = 0, pdy = 0 }) => {
  const t = from + useCurrentFrame() / 30;     // inside a Sequence that starts at `from`
  const vStart = Math.round(from * 30), mStart = (matte.startFrom ?? 0) + Math.round((from - (matte.start ?? 0)) * 30);
  const zz = zooms.find((z) => t >= z.from - 0.01 && t <= z.to + 1.2);
  const z = zz ? 1 + (zz.amt ?? 0.08) * smoother2(Math.min(clamp((t - zz.from) / 1.0), clamp((zz.to + 1.2 - t) / 1.2))) : 1;
  if (o === "land") return (
    <AbsoluteFill style={{ transform: `translate3d(${dx}px, 0, 0) scale(${z})`, willChange: "transform", transformOrigin: LANDSCAPE.faceOrigin }}>
      <MaskedVideo gpu={gpu} video={cut} matte={matte.src} videoStartFrom={vStart} matteStartFrom={mStart} width={LANDSCAPE.W} height={LANDSCAPE.H} floor={0.925} />
    </AbsoluteFill>
  );
  const cs = cams ?? [{ from: 0, to: 9999, cx: 990 }], cam = cs.find((c) => t >= c.from && t < c.to) ?? cs[cs.length - 1], K = 1920 / 1080;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `translate(${pdx}px, ${pdy}px) scale(${z * (pscale ?? 1)})`, transformOrigin: pscale && pscale < 1 ? "540px 1920px" : "540px 600px", overflow: pscale && pscale < 1 ? "visible" : "hidden" }}>   {/* pscale: shrunk from the bottom so the clip above his shoulders shows (2026-11-12) */}
      <div style={{ position: "absolute", left: -(cam.cx - 304) * K, top: 0, width: 1920 * K, height: 1920 }}>
        <MaskedVideo gpu={gpu} video={cut} matte={matte.src} videoStartFrom={vStart} matteStartFrom={mStart} width={Math.round(1920 * K)} height={1920} floor={0.925} />
      </div>
    </div>
  );
};

/** `mini`: his isolated cut-out (landscape) drawn over the paper map, full size then shrunk to a corner (face point of the 1920×1080 frame → (cx, cy)) */
const MiniMe: React.FC<{ cut: string; matte: NonNullable<MontageSpec["matte"]>; it: Extract<SpecItem, { t: "mini" }> }> = ({ cut, matte, it }) => {
  const t = it.from + useCurrentFrame() / 30;     // inside a Sequence that starts at it.from
  const e = miniEase(t, it.shrinkAt), [fx, fy] = [990, 330];
  return (
    <AbsoluteFill style={{ transformOrigin: `${fx}px ${fy}px`, transform: `translate(${(it.cx - fx) * e}px, ${(it.cy - fy) * e}px) scale(${1 + (it.scale - 1) * e})`, filter: e > 0.05 ? "drop-shadow(0 10px 18px rgba(20,12,4,.55))" : undefined }}>
      <MaskedVideo video={cut} matte={matte.src} videoStartFrom={Math.round(it.from * 30)} matteStartFrom={(matte.startFrom ?? 0) + Math.round((it.from - (matte.start ?? 0)) * 30)} width={LANDSCAPE.W} height={LANDSCAPE.H} />
    </AbsoluteFill>
  );
};

/** every item type the renderer knows (= the elements approved in the gallery); anything else is an error, never silently skipped (user 2026-10-28) */
const APPROVED_TYPES = new Set(["word", "blur", "nameTag", "phone", "crop", "pic", "scene", "full", "rewrite", "flash", "credit", "subscribe", "verse", "hadith", "rows", "scholar", "cover", "tree", "pmap", "mini", "timeline", "p2c", "torn", "news", "treefx", "tphoto", "scraps", "clock", "arc", "flag", "date", "poison", "note", "bgclip", "hclip", "wm", "zoomblend", "horror", "tvoff", "brushx", "peek", "weights", "stamp"]);

/** one item's placement data (dx, dy, k): moved by (dx, dy) and scaled by k about the CENTRE OF WHAT IT DRAWS, measured once on screen
 *  (user 2026-11-09: «التكبير لم يعمل» — a fixed origin pushed left-column / top elements out of the frame); ox / oy, when given, win */
const GxLayer: React.FC<{ gx: { dx: number; dy: number; k: number; ox?: number; oy?: number }; children: React.ReactNode }> = ({ gx, children }) => {
  const { width } = useVideoConfig();
  const ref = React.useRef<HTMLDivElement>(null);
  const [c, setC] = React.useState<[number, number] | null>(gx.ox !== undefined && gx.oy !== undefined ? [gx.ox, gx.oy] : null);
  // the frame is laid out a moment after mount (its box is 0 × 0 at first), so the measure retries until it sees the element (≤ 2 s; renders wait for it)
  React.useEffect(() => {
    if (c) return;
    const h = delayRender("gallery gx measure");
    let n = 0, done = false;
    const finish = () => { if (!done) { done = true; continueRender(h); } };
    const id = setInterval(() => {
      const root = ref.current; n++;
      if (root) {
        const b = root.getBoundingClientRect();
        if (b.width > 10) {
          const k = b.width / width;
          let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
          const visit = (el: Element, d: number) => { for (const ch of Array.from(el.children)) {
            const r = ch.getBoundingClientRect(), whole = r.width >= b.width * 0.95 && r.height >= b.height * 0.95;
            if (r.width < 3 || r.height < 3 || whole) { if (d < 12) visit(ch, d + 1); continue; }
            x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom);
          } };
          visit(root, 0);
          if (x1 > x0) { setC([((x0 + x1) / 2 - b.left) / k, ((y0 + y1) / 2 - b.top) / k]); clearInterval(id); setTimeout(finish, 50); return; }
        }
      }
      // (2026-11-11) the old fallback scaled about the top centre, which threw a left-side picture off the frame in the phone preview (the element was not drawn yet):
      // in the Studio/preview keep measuring until the element is there (drawn unscaled meanwhile); only a real render falls back after 2 s, about the element's last seen box or not at all
      if (n > 40) { finish(); if (getRemotionEnvironment().isRendering) { clearInterval(id); setC(null); } }
    }, 50);
    return () => { clearInterval(id); finish(); };
  }, [c, width]);
  // until measured the layer is drawn unscaled (only moved), so the measure is in the element's own coordinates
  return <div ref={ref} style={{ position: "absolute", inset: 0, transform: `translate(${gx.dx}px, ${gx.dy}px)${c ? ` scale(${gx.k})` : ""}`, transformOrigin: c ? `${c[0]}px ${c[1]}px` : "0 0" }}>{children}</div>;
};

/** the gallery's place of each item type (src/galleryPlace.ts, user 2026-11-10: the gallery is the only reference) is added to every item, both orientations;
 *  the gallery itself (spec.galleryOwn) shows the value being edited, so it is not added twice there */
const withGallery = (s: MontageSpec): MontageSpec => s.galleryOwn ? s : { ...s, items: s.items.map((it) => {
  const P = galleryPlace(it as { t: string; style?: string }, "port"), L = galleryPlace(it as { t: string; style?: string }, "land");
  if (!P.dx && !P.dy && P.k === 1 && !L.dx && !L.dy && L.k === 1) return it;
  const ld = it.land ?? {};
  /* (2026-11-12) a picture placed in the GAP between the two cards of a split window (land.panel) keeps that exact place: no gallery offset on top of it */
  const inPanel = (ld as { panel?: boolean }).panel === true;
  return { ...it, dx: (it.dx ?? 0) + P.dx, dy: (it.dy ?? 0) + P.dy, k: (it.k ?? 1) * P.k, land: inPanel ? ld : { ...ld, dx: (ld.dx ?? 0) + L.dx, dy: (ld.dy ?? 0) + L.dy, k: (ld.k ?? 1) * L.k } } as SpecItem;
}) };
export const MontageFromSpec: React.FC<{ spec: MontageSpec }> = ({ spec: raw }) => {
  const spec = withGallery(raw);
  for (const it of spec.items) if (!APPROVED_TYPES.has(it.t)) throw new Error(`عنصر غير معتمد في المعرض: «${it.t}» في ${spec.id} — المعتمد: ${[...APPROVED_TYPES].join("، ")}`);
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const o: Orient = width > height ? "land" : "port";
  if (HY && ((o === "port" && spec.items.some((x) => x.t === "phone")) || (o === "land" && spec.psplits?.length) || spec.solos?.length || spec.items.some((x) => x.t === "mini" || x.t === "treefx"))) throw new Error(`المسار الهجين لا يدعم هذا المونتاج (${spec.id}): طولي أو solos/psplits/mini/treefx — استعمل الرندر العادي`);
  applyBrand(spec.brand);
  FONT_TITLE(); FONT_TEXT();
  const bar = spec.bar ?? BAR_WARM;
  const fulls = spec.items.filter((i): i is Extract<SpecItem, { t: "full" }> => i.t === "full" && (!i.only || i.only === o));
  const cover = spec.items.find((i): i is Extract<SpecItem, { t: "cover" }> => i.t === "cover" && (!i.only || i.only === o));
  const mine = <T extends SpecItem["t"]>(k: T) => spec.items.filter((i): i is Extract<SpecItem, { t: T }> => i.t === k && (!i.only || i.only === o));
  /* portrait isolation layout (user 2026-11-12): the experiment's inputProps win over the spec */
  /* the user's choice (2026-11-12, «B»): the clip fills the frame lightly blurred behind him, a tilted paper card of the same clip on its subject top-left,
     he slid right at 66 % — the default for every portrait background-clip isolation; the experiment's inputProps or the spec may override it */
  const portIso = ((getInputProps() as { portIso?: PortIso }).portIso ?? (spec as { portIso?: PortIso }).portIso ?? PORT_ISO_DEFAULT) as PortIso | undefined;
  const bgUnder = (w: { from: number; to: number }) => spec.items.some((x) => x.t === "bgclip" && (x as { from: number }).from < w.to && (x as { to: number }).to > w.from);   /* the B layout only where a background clip is behind him */
  const bgclips = mine("bgclip"), hclips = mine("hclip"), pulses = mine("zoomblend"), horrors = mine("horror");
  const hasFx = pulses.length > 0 || horrors.length > 0;
  const wrapStage = (kids: React.ReactNode) => hasFx ? <FxStage pulses={pulses} horrors={horrors}>{kids}</FxStage> : <>{kids}</>;   // an element, not a component type: the videos inside never remount
  const body = o === "land"
    ? (spec.cut ? <LandFootage cut={spec.cut} zooms={spec.zooms} splits={spec.splits} shifts={spec.shifts} /> : null)
    : (spec.cut ? <SheikhLayers cut={spec.cut} cams={spec.cams ?? [{ from: 0, to: 9999, cx: 990 }]} zooms={spec.zooms} /> : null);
  return (
    <HybridHost>
    <AbsoluteFill
      style={{
        background: hyBg(BRAND.base),
        scale: 0.994
      }}
    >
      {spec.cut ? <Audio src={staticFile(spec.cut)} volume={0.8} /> : null}
      {(spec.sfx ?? []).filter((x) => !x.only || x.only === o).map((x, i) => <Sequence key={"sfx" + i} from={Math.max(0, Math.round(x.at * 30))} durationInFrames={x.dur ? Math.round(x.dur * 30) : 45}><Audio src={staticFile(x.src)} volume={x.vol} /></Sequence>)}
      {o === "port" || !spec.cut ? (HY ? <HybridBg><WarmBase /></HybridBg> : <WarmBase />) : null}
      {wrapStage(<>
      <Sequence from={0} durationInFrames={spec.tail ? Math.round(spec.tail.from * 30) : spec.frames}>{(() => { const b2 = o === "port" && spec.psplits?.length ? <PortSplit windows={spec.psplits}>{body}</PortSplit> : body; return spec.shake?.length ? <HandheldShake windows={spec.shake} amp={6} rot={0.4}>{b2}</HandheldShake> : b2; })()}</Sequence>
      {o === "port" && spec.psplits?.length ? <PortPanel windows={spec.psplits} /> : null}
      {o === "port" ? (spec.splits ?? []).map((sp, i) => spec.cut ? <PortraitClipCard key={i} cut={spec.cut} sp={cover && cover.style !== "kit" ? { ...sp, from: Math.max(sp.from, (cover.style === "pro" ? THUMBPRO_END : PAPER_COVER_END) / 30) } : sp} /> : null) : null}
      {/* a curtain at BOTH the entry and the exit of every baked split (rule 41; user 2026-10-30: «خطأ فادح أن تظهر الشاشة المقسومة بدون المؤثر الخاص»); none at the very start (the cover covers it) and one per shared edge */}
      {o === "land" ? [...new Set((spec.splits ?? []).flatMap((sp) => [sp.from, sp.to]).filter((t) => t > 0.5))].map((t) => <Curtain key={"cs" + t} at={t} />) : null}
      {o === "land" && spec.cut ? (spec.solos ?? []).map((sp, i) => <SoloLand key={"so" + i} cut={spec.cut!} sp={sp} zooms={spec.zooms} />) : null}
      {o === "land" ? (spec.solos ?? []).flatMap((sp, i) => [<Curtain key={"ca" + i} at={sp.from} />, <Curtain key={"cb" + i} at={sp.to} />, ...(sp.center ?? []).flatMap((c, j) => [<Curtain key={"cc" + i + j} at={c.from} />, <Curtain key={"cd" + i + j} at={c.to} />])]) : null}
      {spec.tail ? <Sequence from={Math.round(spec.tail.from * 30)}><Audio src={staticFile(spec.tail.src)} volume={0.95} /></Sequence> : null}
      {spec.tail ? <TailVoice tl={spec.tail} /> : null}
      {fulls.map((x, i) => <UnderHim key={i} active={underHim(spec, o, x)} from={x.from} to={x.to}><FullImage src={x.src} from={x.from} to={x.to} origin={o === "land" ? x.land?.origin ?? x.origin : x.origin} marker={o === "land" ? x.land?.marker : x.marker} box={o === "land" ? undefined : x.box} /></UnderHim>)}
      {bgclips.map((x, i) => <BgClip key={"bg" + i} src={x.src} from={x.from} to={x.to} fade={x.fade} start={x.start} dim={x.dim} iso={o === "port" && portIso ? { ...portIso, focusX: (x as { focusX?: number }).focusX ?? portIso.focusX } : undefined} />)}   {/* focusX per clip: where its subject is */}
      {hclips.map((x, i) => { const pv = hclips.find((y) => y !== x && x.from - y.to > -0.01 && x.from - y.to < 1), nx = hclips.find((y) => y !== x && y.from - x.to > -0.01 && y.from - x.to < 1);
        return <HClip key={"hc" + i} src={x.src} from={pv ? (pv.to + x.from) / 2 : x.from} to={nx ? (x.to + nx.from) / 2 : x.to} start={Math.max(0, (x.start ?? 0) - (pv ? (x.from - (pv.to + x.from) / 2) : 0))} zoom={x.zoom} fx={x.fx} fy={x.fy} label={x.label} enter={!pv} leave={!nx} />; })}
      {/* the map is a base layer (under his isolated cut-out when the spec has `behind`); in portrait only for an isolated map (`iso`, user 2026-10-31: the map is an isolated-background element) */}
      {spec.items.map((it, i) => it.t === "pmap" && !it.only && (o === "land" || it.iso) ? <UnderHim key={"pm" + i} active={underHim(spec, o, it)} from={it.from} to={it.to}>{placed(it, 1000 + i, o, <PaperMap key={"pm" + i} at={it.from} until={it.to} x={o === "land" ? it.land?.x ?? 0 : it.x} y={o === "land" ? it.land?.y ?? 0 : it.y} w={o === "land" ? it.land?.w ?? 1920 : it.w} h={o === "land" ? it.land?.h ?? 1080 : it.h} center={o === "land" ? it.landCenter ?? it.center : it.center} spanLat={o === "land" ? it.landSpan ?? it.spanLat : it.spanLat} highlight={it.highlight} highlightAt={it.highlightAt} geo={it.geo} atlas={it.atlas} pts={it.pts} legs={it.legs} carSrc={it.carSrc} carW={it.carW} />)}</UnderHim> : null)}
      {o === "land" && spec.cut ? spec.items.map((it, i) => it.t === "mini" && (it.matte ?? spec.matte) ? <Sequence key={"mi" + i} from={Math.round(it.from * 30)} durationInFrames={Math.round((it.to - it.from) * 30)}><MiniMe cut={spec.cut!} matte={(it.matte ?? spec.matte)!} it={it} /></Sequence> : null) : null}
      {o === "land" ? spec.items.map((it, i) => it.t === "treefx" && !it.only ? <UnderHim key={"tf" + i} active={underHim(spec, o, it)} from={it.from} to={it.to}><Only from={it.from} to={it.to}>{it.skin === "parchment" ? <Parchment /> : <AbsoluteFill><WarmBase /></AbsoluteFill>}{placed(it, 2000 + i, o, <TreeFx skin={it.skin} from={it.from} until={it.to} x={o === "land" ? it.land?.x ?? 20 : it.x} y={o === "land" ? it.land?.y ?? 50 : it.y} w={o === "land" ? it.land?.w ?? 880 : it.w} h={o === "land" ? it.land?.h ?? 980 : it.h} title={it.title} titleAt={it.titleAt} nodes={it.nodes} links={it.links} nodeW={o === "land" ? it.land?.nodeW ?? it.nodeW : it.nodeW} nodeH={o === "land" ? it.land?.nodeH ?? it.nodeH : it.nodeH} font={o === "land" ? it.land?.font ?? it.font : it.font} titleSize={o === "land" ? it.land?.titleSize ?? it.titleSize : it.titleSize} />)}</Only></UnderHim> : null) : null}
      {spec.cut ? (spec.behind ?? []).map((w, i) => { const mt = w.matte ?? spec.matte; return mt && (!w.only || w.only === o) && (o === "land" || w.dx === undefined) ? <Sequence key={i} from={Math.round(w.from * 30)} durationInFrames={Math.round((w.to - w.from) * 30)}><TailFade dur={w.to - w.from} fade={w.fade}><MaskedSheikh cut={spec.cut!} matte={mt} o={o} cams={spec.cams} zooms={spec.zooms} dx={o === "land" ? w.dx : 0} from={w.from} gpu pscale={o === "port" && bgUnder(w) ? portIso?.scale : undefined} pdx={o === "port" && bgUnder(w) ? portIso?.dx : undefined} pdy={o === "port" && bgUnder(w) ? portIso?.dy : undefined} /></TailFade></Sequence> : null; }) : null}
      </>)}
      <Gfx>
        {spec.items.map((it, i) => renderItem(it, i, o, bar))}
        {spec.showTitleBar ? <TitleBar title={spec.title} theme={bar} bottomHalf={o === "port"} /> : null}
      </Gfx>
      {/* the ONLY transition of the user-ordered layers is the gallery Curtain (user 2026-11-09: no opacity transitions, nothing outside the gallery): where a clip hands over to the next clip of its group, and where a background clip / isolation ends */}
      {o === "land" ? [...new Set([...hclips.flatMap((x) => hclips.filter((y) => y !== x && y.from - x.to > -0.01 && y.from - x.to < 1).map((y) => (x.to + y.from) / 2)), /* no curtain when a background clip ends or an isolation window (moved or not) starts/ends: the isolation just goes away (user 2026-11-11) */].map((v) => +v.toFixed(2)))].map((t) => <Curtain key={"gc" + t} at={t} />) : null}
      {horrors.length ? <HorrorVeil windows={horrors} /> : null}
      {mine("weights").map((x, i) => <WeightsOnBack key={"wt" + i} at={x.at} until={x.until} fig={x.fig} crowd={x.crowd} n={x.n} />)}
      {mine("tvoff").map((x, i) => <TvOff key={"tv" + i} at={x.at} dur={x.dur} />)}
      {cover && cover.style === "image" && f < THUMBPRO_END ? <PaperTear from={3} to={THUMBPRO_TEAR_END} sheet={<AbsoluteFill style={{ background: "#0d0f14" }}>{o === "land" ? null : <Img src={staticFile(cover.src)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(40px) brightness(.55)", transform: "scale(1.2)" }} />}<Img src={staticFile(cover.src)} style={o === "land" ? { width: "100%", height: "100%", objectFit: "cover" } : { position: "absolute", left: 0, top: "50%", width: "100%", transform: "translateY(-50%)" }} /></AbsoluteFill>} /> : null}
      {cover && cover.style === "pro" && f < THUMBPRO_END ? <ThumbProOpen format={o === "land" ? "landscape" : "portrait"} tearOrder={cover.tearOrder} {...cover.pro} {...(o === "land" ? cover.proLand : {})} /> : null}
      {cover && cover.style !== "pro" && cover.style !== "image" && (cover.style ?? "paper") === "paper" && f < PAPER_COVER_END ? <PaperCoverKit format={o === "land" ? "landscape" : "portrait"} palette={COVER_PALETTES[cover.palette ?? "steel"]} tearOrder={cover.tearOrder} {...cover.kit} {...(o === "land" ? cover.kitLand : {})} /> : null}
      {cover && cover.style !== "image" && cover.style === "kit" && f < (cover.frames ?? 3) ? <CoverKit format={o === "land" ? "landscape" : "portrait"} palette={COVER_PALETTES[cover.palette ?? "steel"]} {...cover.kit} {...(o === "land" ? cover.kitLand : {})} /> : null}
    </AbsoluteFill>
    </HybridHost>
  );
};

/** manual placement of the replied-to clip card in a reel (user 2026-11-11: «أريد أغيّر يدوياً مكان الفيديو المعروض في الريلز»): Studio's props panel edits these numbers and its Save writes them into `defaultProps` of the composition (src/ReelsComps.tsx); they replace `card` of every split window */
export const reelCardSchema = z.object({
  cardLeft: z.number().min(-600).max(700).step(1),
  cardTop: z.number().min(0).max(1500).step(1),
  cardRot: z.number().min(-20).max(20).step(0.5),
  cardH: z.number().min(150).max(1000).step(5),
});
export type ReelCardProps = z.infer<typeof reelCardSchema>;
export const withCard = (spec: MontageSpec, p: Partial<ReelCardProps>): MontageSpec => ({
  ...spec,
  splits: spec.splits?.map((s) => ({ ...s, card: { left: p.cardLeft ?? s.card?.left ?? 30, top: p.cardTop ?? s.card?.top ?? 600, rot: p.cardRot ?? s.card?.rot ?? -4, innerH: p.cardH ?? s.card?.innerH ?? 480 } })),
});
export const ReelFromSpec: React.FC<{ spec: MontageSpec } & Partial<ReelCardProps>> = ({ spec, ...card }) => <MontageFromSpec spec={withCard(spec, card)} />;
