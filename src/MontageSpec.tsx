import { z } from "zod";
import { galleryPlace } from "./galleryPlace";
import { resolveGalleryRef } from "./galleryRef";
import { usePublishOnScreen } from "./elementNames";
import type { GalleryGeo, Grids } from "./galleryRef";
import galleryGeo from "../data/gallery_geo.json";
import layoutGrids from "../data/layout_grids.json";
import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, Video, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig , getRemotionEnvironment, getInputProps } from "remotion";
import { PaperTear } from "./PaperTear";
import { Gfx, BrushX, Stamp, NoteCard, HandheldShake, SourceWalk, BlurRise, RewriteWindow, FlashCut, PinnedPhoto, TimelineTravel, PanelToCanvas, Clock, DashArc, useT } from "./MG";
import { KeyChip, ReelVerseFull, VerseWords } from "./MGExtras";
import { VerseNoorPanel, VerseBigWordPanel, halfShift, HALF_LEAD, BlendPanel, halfK } from "./VerseKit";
import { HadithQuotePanel, HadithBooksPanel, HadithIsnad, HadithPortPanel } from "./HadithKit";
import { TitleBar } from "./TitleBar";
import type { BarTheme } from "./TitleBar";
import { NameCard1, NameCard3 } from "./NameCards";
import { Banner, StatRow, Pic, Subscribe, Sources, Flag } from "./EuKit";
import type { FlagCode } from "./EuKit";
import { FONT_TITLE, FONT_TEXT } from "./localFonts";
import { BAR_WARM, WarmBase, Only, PopCard, Word, PhoneWin, SheikhLayers, PaperScene, PaperMap, FamilyTree, TreeFx, Parchment, miniEase, FullImage, Marker, RV, LANDSCAPE, clamp } from "./PortraitKit";
import { KhBg } from "./KhKit";
import type { TreeNode, TreeLink, MapPt, MapLeg } from "./PortraitKit";
import { CoverKit, COVER_PALETTES, PaperCoverKit, PAPER_COVER_END } from "./CoverKit";
import type { CoverProps } from "./CoverKit";
import { ThumbProOpen, THUMBPRO_END, THUMBPRO_TEAR_END } from "./ThumbPro";
import type { ThumbProps } from "./ThumbPro";
import { TornNote, NewsClip, TornPhoto, WordScraps, DateCalendar, Tape, tornClip } from "./PaperKit";
import { BRAND, applyBrand } from "./brand";
import { PIP, pipK } from "./PickKit";
import { ShoePrint } from "./ShoePrint";
import { PICK_ALL as PICK_KIT, railPortDrop, PICK_ALL_FULL_FRAME as PICK_FULL_FRAME, LeftShade, PICK_XY, PICK_NOSPLIT, pickPortBoard } from "./PickKit2";
import type { PickAllName as PickName } from "./PickKit2";
import type { BrandName } from "./brand";
import { MaskedVideo } from "./MaskedVideo";
import { DEBATE_LAYOUTS } from "./DebateLayouts";
import { HybridHost, HybridBg, VSlot, HY, HYL, HyLayer, HyLevel, hyBg, UnderHim } from "./hybrid/Slot";
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
/** portrait layout bands (user 2026-11-16, two marked screenshots: «اجعل الكابشن عند إشارتي الزرقاء، والعناصر عند المستطيل الأحمر دائماً»):
 *  every element is drawn inside PORT_ZONE under it */
export const PORT_ZONE = { top: 1400, bottom: 1880, left: 30, right: 1050 };
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
  /** landscape (user 2026-11-12: the approved ways are the main ones, one picked AT RANDOM for every verse): `way` noor | bigword (half screen, he slides right) — left out = random;
   *  "card" = the old VerseWords card. `aya` = the verse number (else read from refText). Portrait is unchanged. */
  | { t: "verse"; words: string[]; times: number[]; title: string; refText: string; x: number; y: number; w: number; size?: number; until?: number; full?: boolean; way?: "noor" | "bigword" | "card"; aya?: number }
  /** a hadith in the full-screen box (user 2026-11-02): matn from sunnah.com / الدرر السنية / الشاملة word by word as he says it; `source` = book + number, e.g. «صحيح البخاري (5115)» */
  | { t: "hadith"; words: string[]; times: number[]; source: string; until?: number }
  /** a hadith on a paper NoteCard (MG NoteCard; user's gallery note 2026-11-05: «مخصصة لكتابة الأحاديث النبوية»): the matn typed as `title`, the book + number as `tag`; he stays on screen */
  /** landscape with `phrases` (each = the words he says + the second he starts them; `key` = a word underlined): one approved hadith way picked AT RANDOM per hadith (user 2026-11-12):
   *  quote | books (half screen, he slides right); `chain` (the narrators he names, with their seconds) = he recited the isnad → isnad (the chain then the matn).
   *  `books` = the sources with their numbers (else `tag`), `narrator` = «عن …», `lead` = «قال رسول الله ﷺ». Without `phrases`, or in portrait: the NoteCard as before. */
  | { t: "note"; at: number; until: number; title: string; tag: string; label?: string; x?: number; y?: number; w?: number; h?: number; size?: number; cps?: number;
      phrases?: { text: string; at: number; key?: string }[]; lead?: string; narrator?: string; books?: { book: string; n: number | string }[]; chain?: { name: string; at: number }[]; cardAt?: number; way?: "quote" | "books" | "isnad" | "card" }
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
  | { t: "cover"; style: "image"; src: string; srcPort?: string }
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
  | { t: "tphoto"; shoe?: boolean; src: string; name?: string; at: number; until?: number; x?: number; y?: number; w?: number; h?: number; pos?: string; also?: { src: string; name?: string; at: number }[] }
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
  | { t: "mini"; from: number; to: number; shrinkAt: number; scale: number; cx: number; cy: number; matte?: { src: string; start?: number } }
  /** user-ordered effects of one video (src/GazaFx.tsx): a clip fills the screen behind him (pair with a `behind` window), a clip on half the screen (pair with `shifts` / `psplits`),
   *  a fading watermark, a zoom+flash transition at `at`, and the horror grade over everything */
  | { t: "bgclip"; src: string; from: number; to: number; fade?: number; start?: number; dim?: number }
  | { t: "hclip"; src: string; from: number; to: number; start?: number; zoom?: number; fx?: number; fy?: number; label?: string }
  | { t: "wm"; text: string; from: number; to: number; opacity?: number; ramp?: number; x?: number; y: number; size?: number; rot?: number }
  | { t: "zoomblend"; at: number; amt?: number }
  /** the 12 elements picked from the temporary gallery (2026-11-14, src/PickKit.tsx); when each is due: PREFERENCES «عناصر المعرض المؤقت المعتمدة». land = landscape overrides of any prop */
  | { t: "pick"; el: PickName; at: number; until: number; x?: number; y?: number; noShift?: boolean; land?: Record<string, unknown>; [prop: string]: unknown }
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
  date?: string;                     // yyyy-mm-dd of the RECORDING, shown in the counter bar (tools/episode_date.mjs; user 2026-11-16)
  showTitleBar?: boolean;             // whether to render TitleBar (in lessons and streams: NO title bar, user 2026-11-05)
  cams?: { from: number; to: number; cx: number }[];
  zooms?: { from: number; to: number; amt?: number }[];
  /** gallery grid mode only (user 2026-11-09): moves / resizes the whole graphics layer for elements whose fields carry no x / y / size; (ox, oy) = the scale origin */
  shake?: { from: number; to: number }[];
  /** windows where the source recording has a baked-in split (clip left | him right): landscape = the reply model `layout` behind a curtain (default "dossier" = الملف, user 2026-10-30;
   *  blocks | dossier, src/DebateLayouts.tsx;); portrait = his slice + the clip as a tilted card at his shoulder (x/w are source px) */
  splits?: { from: number; to: number; clip: { x: number; w: number; y?: number; h?: number }; sheikh: { x: number; w: number }; clipName?: string; mainSrc?: string /* a whole added clip in HIS window (the pair: the recorded clip beside an added clip) */; mainAspect?: number; clipAspect?: number; clipSrc?: string /* a whole added clip (public/ path, 16:9, silent) shown in the answered-clip window instead of the recording column */; clipUrl?: string; faceX?: number; blur?: number; layout?: DebateLayoutName; card?: { left: number; top: number; rot: number; innerH: number }; page?: boolean /* a shown PAGE (book/document): in a reel the page is drawn very large in the lower zone and his video shrinks to the top (user 2026-11-17) */; marks?: { at: number; x: number; y: number; w: number; h: number; z?: number; dur?: number }[] /* the text of the page he is talking about, in crop pixels: a marker sweeps over it at `at` (his word) and the page zooms onto it (user 2026-11-17, frame 1109) */ }[];
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
  psplits?: { from: number; to: number; s?: number; top?: number; panel?: "warm" | "parchment"; dy?: number }[];   /* dy (2026-11-17): room of dy px above his head (sections rail): SheikhLayers zooms the crop out, bottom pinned, sides from the recording; no panel */
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
  if (q.t === "tphoto") { const w = (L ? ov.w : q.w) ?? 300, h = (L ? ov.h : q.h) ?? 370, x = L ? ov.x ?? G.x : q.x ?? 40, y = L ? ov.y ?? G.y : q.y ?? 1360, n = 1 + (q.also?.length ?? 0); if (tphotoApart(q)) return [(L ? LANDSCAPE.W : 1080) / 2, y + h / 2]; return [x + (n * w + (n - 1) * 24) / 2, y + h / 2]; }
  if (q.t === "scholar") { const w = (L ? ov.w : undefined) ?? q.w ?? 300, h = (L ? ov.h : undefined) ?? q.h ?? 370, x = L ? ov.x ?? G.x : q.x ?? 40, y = L ? ov.y ?? G.y : q.y ?? 1360; return [x + w / 2, y + h / 2]; }
  if (q.t === "pic" && q.w && q.h) { const w = L ? ov.w ?? G.w : q.w, h = L ? ov.h ?? Math.round((q.h * w) / q.w) : q.h, x = L ? ov.x ?? G.x : q.x ?? 40, y = L ? ov.y ?? G.y : q.y ?? 1360; return [x + w / 2, y + h / 2]; }
  if (q.t === "news" && q.w && q.h) { const w = L ? ov.w ?? 600 : q.w, h = Math.round((q.h * w) / q.w), x = L ? ov.x ?? G.x : q.x ?? 40, y = L ? ov.y ?? G.y : q.y ?? 1360; return [x + w / 2, y + h / 2]; }
  if (q.t === "date") { const w = (L ? ov.w : undefined) ?? q.w ?? 340, x = L ? ov.x ?? G.x : q.x ?? 300, y = L ? ov.y ?? G.y : q.y ?? 1330; return [x + w / 2, y + w * 0.55]; }
  return null;
};
/** (user 2026-11-16: «عند ذكر شخصيتين إحداهما تتعلق بالأخرى فواحدة على اليمين وواحدة على اليسار») two named PEOPLE stand apart, the first named on the right edge and the second on the left; books named in one breath still stand side by side */
const tphotoApart = (it: { name?: string; also?: unknown[] }) => (it.also?.length ?? 0) === 1 && ![it.name, (it.also![0] as { name?: string }).name].some((n) => /(كتاب|صحيح|سنن|مسند|تفسير|موطأ|مجموع|فتاوى)/.test(n ?? ""));
const placed = (it: SpecItem, i: number, o: Orient, n: React.ReactNode): React.ReactNode => {
  const p = o === "land" ? it.land : it, dx = p?.dx ?? 0, dy = p?.dy ?? 0, k = p?.k ?? 1;
  const c = k !== 1 ? boxCentre(it, o) : null;
  return n && (dx || dy || k !== 1) ? <GxLayer key={"place" + i} gx={{ dx, dy, k, ...(c ? { ox: c[0], oy: c[1] } : {}) }}>{n}</GxLayer> : n;
};
/** the box an item draws in portrait, ESTIMATED from its own numbers (no measuring, user 2026-11-16: «قدّر المقاس والمكان»): [x0, y0, x1, y1] before its dx/dy/k;
 *  null = not a lower-band element (full screen, base layer, its own fixed place) */
const portBox = (it: SpecItem): [number, number, number, number] | null => {
  const q = it as unknown as { t: string; x?: number; y?: number; w?: number; h?: number; size?: number; text?: string; also?: unknown[]; full?: boolean };
  const lines = (txt: string, size: number, w: number) => Math.max(1, Math.ceil((txt.length * size * 0.55) / w));
  switch (q.t) {
    case "tphoto": { const w = q.w ?? 300, h = q.h ?? 370, x = q.x ?? 40, y = q.y ?? 1360, n = 1 + (q.also?.length ?? 0); if (tphotoApart(q)) return [x - 20, y - 30, 1080 - x + 20, y + h + 200]; return [x - 20, y - 30, x + n * w + (n - 1) * 24 + 20, y + h + 200]; }
    case "scholar": { const w = q.w ?? 300, h = q.h ?? 370, x = q.x ?? 40, y = q.y ?? 1360; return [x - 20, y - 30, x + w + 20, y + h + 90]; }
    case "pic": case "news": case "flash": { if (!q.w || !q.h) return null; const x = q.x ?? 40, y = q.y ?? 1360; return [x - 20, y - 60, x + q.w + 20, y + q.h + 30]; }
    case "date": { const w = q.w ?? 340, x = q.x ?? 300, y = q.y ?? 1330; return [x, y - 15, x + w, y + w * 1.38]; }
    case "nameTag": { const y = q.y ?? 1360; return [60, y - 28, 1020, y + 112]; }
    case "subscribe": { const y = q.y ?? 1384; return [60, y - 42, 1020, y + 120]; }
    case "scraps": { const size = q.size ?? 36, y = q.y ?? 1330; return [40, y - 30, 1040, y + 60 + 125 * lines(q.text ?? "", size * 1.6, 980)]; }
    case "blur": { const y = q.y ?? 1400; return [40, y, 1040, y + 230]; }
    case "flag": { const w = q.w ?? 220, x = q.x ?? 60, y = q.y ?? 1360; return [x, y, x + w, y + w * 0.67]; }
    case "clock": { const z = q.size ?? 300, x = q.x ?? 60, y = q.y ?? 1330; return [x, y, x + z, y + z]; }
    case "word": { const y = q.y ?? 1400; return [40, y - 20, 1040, y + (q.size ?? 60) * 1.6]; }
    default: return null;   // pick (its own portrait board, PickKit2 pickPortBoard), torn/stamp/rows (already placed in the band), verse/hadith/cover/full (full screen or base)
  }
};
/** every lower-band element is moved (and shrunk only if it is taller than the band) into PORT_ZONE: a static transform, nothing jumps while it animates */
const zoned = (it: SpecItem, i: number, o: Orient, n: React.ReactNode): React.ReactNode => {
  if (o !== "port" || !n) return n;
  const b = portBox(it); if (!b) return n;
  const k0 = it.k ?? 1, cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
  const x0 = cx + (b[0] - cx) * k0 + (it.dx ?? 0), x1 = cx + (b[2] - cx) * k0 + (it.dx ?? 0), y0 = cy + (b[1] - cy) * k0 + (it.dy ?? 0), y1 = cy + (b[3] - cy) * k0 + (it.dy ?? 0);
  const Z = PORT_ZONE, w = x1 - x0, h = y1 - y0, k = Math.min(1, (Z.bottom - Z.top) / h, (Z.right - Z.left) / w);
  const top = y0 < Z.top ? Z.top : y0 + h * k > Z.bottom ? Z.bottom - h * k : y0, ox = (x0 + x1) / 2;
  const dx = ox - (w * k) / 2 < Z.left ? Z.left - (ox - (w * k) / 2) : ox + (w * k) / 2 > Z.right ? Z.right - (ox + (w * k) / 2) : 0, dy = top - y0;
  if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && k > 0.999) return n;
  return <div key={"pz" + i} style={{ position: "absolute", inset: 0, transform: `translate(${dx}px, ${dy}px) scale(${k})`, transformOrigin: `${ox}px ${y0}px` }}>{n}</div>;
};
const renderItem = (it: SpecItem, i: number, o: Orient, bar: BarTheme): React.ReactNode => zoned(it, i, o, placed(it, i, o, renderItemRaw(it, i, o, bar)));
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
      if (L && it.phrases?.length && it.way && it.way !== "card") {
        if (it.way === "isnad" && it.chain?.length) return <HadithIsnad key={i} chain={it.chain} lead={it.lead} phrases={it.phrases} src={it.tag} cardAt={it.cardAt ?? it.phrases[0].at - 0.4} until={it.until} />;
        if (it.way === "books") return <HadithBooksPanel key={i} lead={it.lead} narrator={it.narrator} phrases={it.phrases} src={it.tag} books={it.books} until={it.until} size={it.size} />;
        return <HadithQuotePanel key={i} lead={it.lead} phrases={it.phrases} src={it.tag} until={it.until} size={it.size} />;
      }
      if (!L && it.phrases?.length) return <Only key={i} from={it.phrases[0].at - 0.35} to={it.until}><HadithPortPanel lead={it.lead} narrator={it.narrator} phrases={it.phrases} src={it.tag} books={it.books} until={it.until} size={it.size} /></Only>;   // (user 2026-11-16) portrait: the hadith written in the elements zone
      const w = L ? ov.w ?? it.w ?? 600 : it.w ?? 820, size = it.size ?? 38;
      const lines = Math.max(1, Math.ceil([...it.title].length / Math.max(1, Math.floor((w - 70) / (size * 0.5))))), h = ov.h ?? it.h ?? Math.round(130 + lines * size * 1.6);
      const x = L ? ov.x ?? 40 : it.x ?? Math.round((1080 - w) / 2);
      return <Only key={i} from={it.at} to={it.until}><NoteCard at={it.at} x={x} y={L ? ov.y ?? 150 : it.y ?? 1440} w={w} h={h} label={it.label ?? "حديث شريف"} tag={it.tag} title={it.title} lines={0} size={size} cps={it.cps ?? Math.max(10, Math.round([...it.title].length / Math.max(2, it.until - it.at - 1.2)))} /></Only>;
    }
    case "peek": return <Only key={i} from={it.at} to={it.until}><PeekIn src={it.src} ar={it.ar} at={it.at} until={it.until} w={it.w ?? (L ? 400 : 460)} dx={it.dx ?? 0} corner={it.corner ?? "bl"} z={i} say={it.say} /></Only>;
    case "stamp": return <Only key={i} from={it.at} to={it.until ?? it.at + 2.5}><Stamp at={it.at} x={L ? ov.x ?? it.land?.x ?? 250 : it.x ?? 330} y={L ? ov.y ?? it.land?.y ?? 760 : it.y ?? 1470} text={it.text} size={it.size ?? 56} /></Only>;   // «هذا هو المرجح» (user 2026-11-12): the gallery red stamp at the word
    case "brushx": return L ?<BrushX key={i} at={it.at} x={ov.x ?? it.x} y={ov.y ?? it.y} w={ov.w ?? it.w} h={ov.h ?? it.h} until={it.until} /> : null;
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
    case "pick": { const ip = { ...it, until: pickUntil(it) }; const C = PICK_KIT[ip.el] as React.FC<Record<string, unknown>>; const { t: _t, el: _e, land, noShift: _ns, ...rest0 } = ip as { t: string; el: string; land?: Record<string, unknown>; noShift?: boolean } & Record<string, unknown>; const ns = ip.noShift ?? !!PICK_NOSPLIT[ip.el], xy = PICK_XY[ip.el], rest = { ...(rest0.x == null && xy ? { x: xy[0], y: xy[1] } : {}), ...rest0 }, lp = { ...(ns ? PICK_NOSPLIT[ip.el] ?? {} : {}), ...(land ?? {}) }; return C ? <Only key={i} from={ip.at - HALF_LEAD} to={ip.until}>{L && !ns && !PICK_FULL_FRAME.has(ip.el) ? <PickPanel at={ip.at} until={ip.until} /> : null}{L && ns && !PICK_FULL_FRAME.has(ip.el) ? <LeftShade at={ip.at} until={ip.until} /> : null}{L || PICK_FULL_FRAME.has(ip.el) ? <C {...rest} {...(L ? lp : ip.el === "AlertFrame" ? { W: 1080, H: 1920 } : {})} /> : <div style={pickPortBoard(ip.el)}><C {...rest} /></div>}</Only> : null; }   // the gallery decides place and look: its own x,y (PICK_XY), no split screen for PICK_NOSPLIT, portrait = the gallery's lower-half board
    case "subscribe": return <Subscribe key={i} at={it.at} x={L ? ov.x ?? 1300 : it.x} y={L ? ov.y ?? 790 : it.y} dur={it.dur} />;
    case "verse": {
      // a verse he recites INSIDE his talk = the known verse card (VerseWords) in the writing area / the empty side, his picture visible (user 2026-11-01); full screen (full:true) only for a lone recitation
      const to = it.until ?? it.times[it.times.length - 1] + 1.2;
      if (it.full) return <ReelVerseFull key={i} to={to} refName={`${it.title} — ${it.refText}`} lines={[{ words: it.words, times: it.times }]} />;
      if (L && (it.way === "noor" || it.way === "bigword")) { const P = it.way === "noor" ? VerseNoorPanel : VerseBigWordPanel; return <P key={i} words={it.words} times={it.times} surah={it.title} aya={ayaOf(it)} until={to} />; }
      /* (user 2026-11-17, frame 19625: «القرآن في المقاطع الطولية لازم تقسم الشاشة وتحط نفس الستايل تبع العرضي») portrait: the SAME landscape panel, scaled into the zone under his shrunk video (the split window comes from withPortZones) */
      if (!L && (it.way === "noor" || it.way === "bigword")) { const P = it.way === "noor" ? VerseNoorPanel : VerseBigWordPanel; return <div key={i} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, clipPath: "inset(1135px 0 0 0)" }}><div style={{ position: "absolute", left: 249, top: 1135, width: 1920, height: 1080, transform: "scale(0.727)", transformOrigin: "0 0" }}>   {/* (user 2026-11-17, «يجب أن يملأ الجزء الأيسر إلى أسفل الصفحة») the golden panel COVERS the whole lower zone (1080 × 785): scale 0.727, centred sideways, down to the bottom edge */}<P words={it.words} times={it.times} surah={it.title} aya={ayaOf(it)} until={to} bleed={344} /></div></div>; }
      return <VerseWords key={i} words={it.words} times={it.times} x={L ? ov.x ?? G.x : it.x} y={L ? ov.y ?? G.y : it.y} w={L ? ov.w ?? G.w : it.w} size={L ? ov.size ?? 38 : it.size ?? 44} title={it.title} refText={it.refText} until={to} />;
    }
    case "hadith": return <ReelVerseFull key={i} hadith to={it.until ?? it.times[it.times.length - 1] + 1.2} refName={it.source} lines={[{ words: it.words, times: it.times }]} />;
    case "credit": return <Only key={i} from={it.from ?? 0.5} to={it.to ?? 9999}><Sources links={[{ at: it.from ?? 0.5, url: it.text }]} x={40} bottom={L ? 24 : 178} w={L ? 1100 : 1000} size={L ? 22 : 24} /></Only>;
    case "rows": {
      const g = ROWS[o], gx = L && it.side === "right" ? 1920 - 40 - g.w : g.x;
      /* (user 2026-11-12, frame 2886: «لا يلزم شريط العنوان، المهم ألا يخرج شيء أسفل الشاشة») the list never runs off the screen: the title goes first,
         then the rows tighten until the last one ends above the limit (landscape 1050, portrait 1780 — above the portrait title bar) */
      const nR = it.rows.length, LIM = L ? 1050 : 1780, pitch0 = g.rowY(1, true) - g.rowY(0, true);
      const titled = !!it.title && (L || nR < 3) && g.rowY(0, true) + (nR - 1) * pitch0 + g.rowH <= LIM;
      const start = g.rowY(0, titled);
      /* portrait: a list too long for the band under the beard splits into TWO columns side by side (first column on the right, RTL) */
      const twoCol = !L && it.y0 === undefined && start + (nR - 1) * pitch0 + g.rowH > LIM, perCol = twoCol ? Math.ceil(nR / 2) : nR, colW = twoCol ? Math.floor((g.w - 20) / 2) : g.w;
      let pitch = pitch0, rhFit = g.rowH;
      if (start + (perCol - 1) * pitch + rhFit > LIM) { pitch = Math.floor((LIM - rhFit - start) / Math.max(1, perCol - 1)); if (pitch < rhFit + 8) rhFit = Math.max(90, pitch - 8); }
      // `y0/step/rowH` (portrait) pack a long list under the beard: first row top, row pitch, row height
      const rowY = (n: number) => (!L && it.y0 !== undefined ? it.y0 + n * (it.step ?? 112) : start + (n % perCol) * pitch), rowH = !L && it.rowH ? it.rowH : rhFit;
      const rowX = (n: number) => (twoCol ? gx + (n < perCol ? colW + 20 : 0) : gx), rowW = colW;
      return (
        <Only key={i} from={it.from} to={it.to}>
          {titled && it.title ? <Banner at={it.title.at} x={L && it.pair ? 16 : gx} y={g.bannerY} w={L && it.pair ? 1170 : g.w} text={it.title.text} size={g.bannerSize} /> : null}
          {L && it.pair ? it.rows.map((r, n) => [
              <StatRow key={"c" + n} at={r.at} x={16 + 590} y={rowY(n)} w={580} h={rowH} icon={r.icon ?? "Quote"} label={r.label} rot={n % 2 ? 1 : -1} />,
              r.sub ? <StatRow key={"r" + n} at={r.subAt ?? r.at} x={16} y={rowY(n)} w={580} h={rowH} icon="" noIcon label={r.sub} rot={n % 2 ? -1 : 1} /> : null])
            : it.rows.map((r, n) => <StatRow key={n} at={r.at} x={!L && it.pin ? it.pin.x : rowX(n)} y={rowY(n)} w={!L && it.pin ? it.pin.w : rowW} h={rowH} icon={r.icon ?? "Quote"} label={r.label} sub={r.sub} subAt={r.subAt} photo={r.photo} rot={n % 2 ? 1 : -1} />)}
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
      const apart = tphotoApart(it), W0 = L ? LANDSCAPE.W : 1080, dxg = (L ? it.land?.dx : it.dx) ?? 0, kg = (L ? it.land?.k : it.k) ?? 1, cx0 = W0 / 2, EDGE = 40;   /* the gallery's offset moves the whole item: the right-hand photo is mirrored against it */
      return <React.Fragment key={i}>{all.map((p, j) => <TornPhoto key={j} at={p.at} until={it.until ?? it.at + 6} x={apart ? (j === 0 ? cx0 + (W0 - EDGE - kg * w - dxg - cx0) / kg : cx0 + (EDGE - dxg - cx0) / kg) : x0 + (n - 1 - j) * (w + 24)} y={y0} w={w} h={h} src={p.src} name={p.name} pos={it.pos} />)}{it.shoe ? <ShoePrint at={it.at + 0.9} until={it.until ?? it.at + 6} x={x0} y={y0} w={w} h={h} /> : null}</React.Fragment>;
    }
    case "scraps": return <WordScraps key={i} at={it.at} until={it.until} y={L ? ov.y ?? 845 : it.y ?? 1330} x={L ? (ov.x as number | undefined) : undefined} w={L ? (ov.w as number | undefined) : undefined} text={it.text} times={it.times} size={L ? ov.size ?? 50 : it.size ?? 36} />;   {/* 60 % of the former 84 / 60 (user 2026-10-31) */}
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
const CARD_H = 800;
/** the answered clip in portrait (user 2026-11-16: «بلا اسم المقطع، إطار ورقة مقصوصة الأطراف بلزقة كالعرضي، وكبّره قليلاً»): the source-pixel column [x, x+w) of the cut inside a hand-torn paper mount with a piece of tape, like the landscape mount (DebateLayouts TornWindow); no caption under it */
const CARD_PAD = 18;
/** (user 2026-11-17: «لما أعرض صفحة تكبرها جداً وتصغر صورتي، يعني تعكس») a shown page in a REEL: his video shrinks to the top (PAGE_S) and the page fills the lower zone */
export const PAGE_S = 0.42, PAGE_TOP = 812, PAGE_CARD = { left: 96, top: 836, rot: -1.2, innerH: 1000 };
type PageMark = NonNullable<Split["marks"]>[number];
/** the page camera: chained zoom-ins onto each marked text (smoother2 ramps, each starting 0.25 s before the marker sweeps) */
const pageCam = (t: number, marks: PageMark[], w: number, h: number) => {
  let z = 1, cx = w / 2, cy = h / 2;
  for (const m of marks) {
    const p = smoother2(clamp((t - (m.at - 0.25)) / 0.5));
    if (p <= 0) break;
    z += ((m.z ?? 1.9) - z) * p; cx += (m.x + m.w / 2 - cx) * p; cy += (m.y + m.h / 2 - cy) * p;
  }
  return { z, cx, cy };
};
const CropPolaroid: React.FC<{ cut: string; x: number; w: number; y?: number; h?: number; name?: string; left: number; top: number; rot: number; innerH?: number; blur?: number; aspect?: number; t0?: number; marks?: PageMark[] }> = ({ cut, x, w, left, top, rot, innerH = CARD_H, blur, y = 0, h = 1080, aspect, t0, marks }) => {
  const k = innerH / h, iw = aspect ? Math.round(innerH * aspect) : Math.round(w * k), pw = iw + CARD_PAD * 2, ph = innerH + CARD_PAD * 2;
  const tt = useT(0), mk = !aspect && marks && marks.length ? [...marks].sort((a, b) => a.at - b.at) : null, cam = mk ? pageCam(tt, mk, w, h) : null, zz = cam ? cam.z : 1;
  const pl = aspect ? 0 : cam ? clamp(iw / 2 - (x + cam.cx) * k * zz, iw - (x + w) * k * zz, -x * k * zz) : -x * k, pt = aspect ? 0 : cam ? clamp(innerH / 2 - (y + cam.cy) * k * zz, innerH - (y + h) * k * zz, -y * k * zz) : -y * k, PW = aspect ? iw : 1920 * k * zz, PH = aspect ? innerH : 1080 * k * zz;
  const hole = `linear-gradient(#000 0 0) 0 0/100% 100% no-repeat, linear-gradient(#000 0 0) ${CARD_PAD}px ${CARD_PAD}px/${iw}px ${innerH}px no-repeat`;
  return (
    <div style={{ position: "absolute", left, top, width: pw, height: ph, transform: `rotate(${rot}deg)`, filter: "drop-shadow(0 14px 18px rgba(0,0,0,.5))" }}>
      {/* hybrid: the video is composited under the graphics, so the paper is a ring with a window cut out of it; otherwise the video is drawn on the paper */}
      <div style={{ position: "absolute", inset: 0, background: BRAND.card, clipPath: tornClip(pw, ph, "port-clip", 7, 22), ...(HY ? { WebkitMask: hole, WebkitMaskComposite: "xor", mask: hole, maskComposite: "exclude" } : {}) }} />
      <div style={{ position: "absolute", left: CARD_PAD, top: CARD_PAD, width: iw, height: innerH, overflow: "hidden", background: hyBg("#000") }}>
        {HY ? <VSlot src={cut} startFrom={t0 != null ? -Math.round(t0 * 30) : 0} w={iw} h={innerH} vx={pl} vy={pt} vw={PW} vh={PH} /> : (t0 != null ? <Sequence from={Math.round(t0 * 30)} layout="none"><RV src={staticFile(cut)} style={{ position: "absolute", left: pl, top: pt, width: PW, height: PH, ...(blur ? { filter: `blur(${blur}px)` } : {}) }} /></Sequence> : <RV src={staticFile(cut)} style={{ position: "absolute", left: pl, top: pt, width: PW, height: PH, ...(blur ? { filter: `blur(${blur}px)` } : {}) }} />)}
        {mk ? mk.map((m, i) => {   /* the marker over the text he is talking about: sweeps right to left (Arabic reading) from his word */
          const p = smoother2(clamp((tt - m.at) / (m.dur ?? 0.45)));
          if (p <= 0) return null;
          return <div key={i} style={{ position: "absolute", left: pl + (x + m.x) * k * zz, top: pt + (y + m.y) * k * zz, width: m.w * k * zz, height: m.h * k * zz, borderRadius: 8, background: "rgba(255,206,0,.42)", boxShadow: "0 0 0 2px rgba(255,160,0,.85), 0 0 24px rgba(255,200,0,.55)", clipPath: `inset(-30px 0 -30px ${(1 - p) * 100}%)` }} />;
        }) : null}
      </div>
      <Tape x={pw * 0.34} y={-16} w={Math.max(110, pw * 0.34)} rot={-12} />
    </div>
  );
};
/** landscape: only his slice of a baked-split recording, centred on the decorated base (the clip beside him is never shown) */
const SoloLand: React.FC<{ cut: string; sp: NonNullable<MontageSpec["solos"]>[number]; zooms?: MontageSpec["zooms"] }> = ({ cut, sp, zooms = [] }) => {
  const t = useT(0), zz = zooms.find((q) => t >= q.from - 0.01 && t <= q.to + 1.2), zm = zz ? 1 + (zz.amt ?? 0.08) * smoother2(Math.min(clamp((t - zz.from) / 1.0), clamp((zz.to + 1.2 - t) / 1.2))) : 1, s = sp.scale ?? 1, w = sp.sheikh.w * s, h = LANDSCAPE.H * s, centered = (sp.center ?? []).some((c) => t >= c.from && t < c.to);
  if (HYL) {   /* GPU renderer (2026-11-12): the decorated base in layer 1, ABOVE his full-frame footage (level 0) and BELOW his slice (level 1), which the
                  compositor draws in the same box, the zoom (scale zm about 50% 28% of the box) applied to the picture. Box and picture snapped to whole
                  pixels as the browser draws them (unzoomed). */
    const l = sp.align === "right" && !centered ? LANDSCAPE.W - w : (LANDSCAPE.W - w) / 2, tp = Math.min(0, LANDSCAPE.H - h) / 2;
    const L = Math.round(l), BW = Math.round(l + w) - L, T = Math.round(tp), BH = Math.round(tp + h) - T;
    const ix = Math.round(l - sp.sheikh.x * s) - L, iw = Math.round(l - sp.sheikh.x * s + LANDSCAPE.W * s) - L - ix, ox = 0.5 * BW, oy = 0.28 * BH;
    return (
      <Only from={sp.from} to={sp.to}>
        <AbsoluteFill>
          <HyLayer z={1}><WarmBase /></HyLayer>
          <VSlot src={cut} w={BW} h={BH} style={{ left: L, top: T }} vx={ox + zm * (ix - ox)} vy={oy + zm * (0 - oy)} vw={zm * iw} vh={zm * BH} z={1} grow={0} />
        </AbsoluteFill>
      </Only>
    );
  }
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
  const k = w && !w.dy ? Math.min(clamp((t - w.from) / 0.4), clamp((w.to + 0.4 - t) / 0.4)) : 0, sc = 1 + ((w?.s ?? 0.66) - 1) * k;   /* a dy window is drawn by SheikhLayers (zoom-out, bottom pinned), not here */
  return <AbsoluteFill style={{ transform: `scale(${sc})`, transformOrigin: "50% 0%" }}>{children}</AbsoluteFill>;
};
/** the backdrop under the big element: from `top` down, the base (or parchment) and a rule line that slides in */
const PortPanel: React.FC<{ windows: NonNullable<MontageSpec["psplits"]>; top?: number }> = ({ windows, top = 936 }) => {
  const t = useT(0);
  const w = windows.find((q) => t >= q.from - 0.01 && t <= q.to + 0.4);
  if (!w) return null;
  const k = Math.min(clamp((t - w.from) / 0.4), clamp((w.to + 0.4 - t) / 0.4));
  return (
    <div style={{ position: "absolute", left: 0, top: (w.top ?? top) + (1 - k) * (1920 - (w.top ?? top)), width: 1080, height: 1920 - (w.top ?? top), overflow: "hidden", borderTop: `8px solid ${BRAND.accent}`, boxSizing: "border-box" }}>
      {/* hybrid: the ground would cover the clip (drawn under the graphics); GPU renderer (2026-11-12): in layer 1, above his footage, under the clip (level 1) */}
      <div style={{ position: "absolute", left: 0, top: -(w.top ?? top), width: 1080, height: 1920 }}>{HY && !HYL ? null : <HyLayer z={1}>{w.panel === "parchment" ? <Parchment /> : <WarmBase />}</HyLayer>}</div>
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
  if (sp.mainSrc) {   /* the pair (user 2026-11-16): the recorded clip and the added clip side by side under his face, each in a torn paper mount */
    const ih = sp.card?.innerH ?? 300, a2 = sp.mainAspect ?? 16 / 9, pw2 = Math.round(ih * a2) + CARD_PAD * 2;
    return (
      <Only from={sp.from} to={sp.to}>
        <CropPolaroid cut={sp.clipSrc ?? cut} aspect={sp.clipSrc ? sp.clipAspect ?? 16 / 9 : undefined} x={sp.clip.x} w={sp.clip.w} y={sp.clip.y} h={sp.clip.h} left={14} top={sp.card?.top ?? 1180} rot={-2} innerH={ih} t0={sp.clipSrc ? sp.from : undefined} />
        <CropPolaroid cut={sp.mainSrc} aspect={a2} x={0} w={1920} left={1080 - 14 - pw2} top={sp.card?.top ?? 1180} rot={2} innerH={ih} t0={sp.from} />
      </Only>
    );
  }
    return (
    <Only from={sp.from} to={sp.to}>
      <HyLevel z={sp.page ? 1 : 0}>{/* a shown page sits above the PortPanel ground (layer 1): its video must be level 1 or the ground covers it (2026-11-17) */}
      <CropPolaroid aspect={sp.clipSrc ? sp.clipAspect ?? 16 / 9 : undefined} cut={sp.clipSrc ?? cut} x={sp.clip.x} w={sp.clip.w} y={sp.clip.y} h={sp.clip.h} name={sp.clipName ?? "المقطع المردود عليه"} left={sp.page ? sp.card?.left ?? PAGE_CARD.left : sp.card?.left ?? 30} top={sp.page ? sp.card?.top ?? PAGE_CARD.top : sp.card?.top ?? 1320} rot={sp.page ? sp.card?.rot ?? PAGE_CARD.rot : sp.card?.rot ?? -2} innerH={sp.page ? sp.card?.innerH ?? PAGE_CARD.innerH : sp.card?.innerH ?? 450} blur={sp.blur} t0={sp.clipSrc ? sp.from : undefined} marks={sp.page ? sp.marks : undefined} />
      </HyLevel>
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
      <KhBg smooth />{/* WarmBase with evenly drifting stars (src/KhKit.tsx `smooth`; user 2026-11-13) */}
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
export const LandFootage: React.FC<{ cut: string; zooms?: { from: number; to: number; amt?: number }[]; splits?: Split[]; shifts?: { from: number; to: number; dx: number; feather?: number }[]; pips?: { at: number; until: number }[]; behind?: React.ReactNode; gaps?: { from: number; to: number }[] }> = ({ cut, zooms = [], splits = [], shifts = [], pips = [], behind, gaps }) => {
  const t = useT(0);
  const sh = shifts.find((s) => t >= s.from && t <= s.to + 0.4);
  const dx = sh ? sh.dx * Math.min(clamp((t - sh.from) / 0.4), clamp((sh.to + 0.4 - t) / 0.4)) : 0;
  const fth = sh?.feather ? sh.feather * Math.min(clamp((t - sh.from) / 0.4), clamp((sh.to + 0.4 - t) / 0.4)) : 0;
  const sp = splits.find((x) => t >= x.from && t < x.to);
  if (sp) { const L = DEBATE_LAYOUTS[sp.layout ?? "dossier"]; return <L at={sp.from} main={sp.mainSrc ? { src: sp.mainSrc, aspect: sp.mainAspect ?? 16 / 9, t0: sp.from } : { src: cut, x: sp.sheikh.x, w: sp.sheikh.w }} guest={sp.clipSrc ? { src: sp.clipSrc, aspect: sp.clipAspect ?? 16 / 9, blur: sp.blur, t0: sp.from } : { src: cut, x: sp.clip.x, w: sp.clip.w, y: sp.clip.y, h: sp.clip.h, blur: sp.blur }} guestName={sp.clipName} url={sp.clipUrl} behind={behind} gaps={gaps} />; }
  const zz = zooms.find((z) => t >= z.from - 0.01 && t <= z.to + 1.2);
  const pp = pips.find((q) => t >= q.at && t <= q.until), pu = pp ? pipK(t, pp.at, pp.until) : 0;   // PipSource (user 2026-11-14): he shrinks into the top-right corner window
  const z = zz ? 1 + (zz.amt ?? 0.08) * smoother2(Math.min(clamp((t - zz.from) / 1.0), clamp((zz.to + 1.2 - t) / 1.2))) : 1;
  return (
    <AbsoluteFill style={{ background: hyBg(BRAND.base), transform: pu > 0 ? `scale(${1 - (1 - PIP.s) * pu})` : `translate3d(${dx}px, 0, 0) scale(${z})`, willChange: "transform", transformOrigin: pu > 0 ? `${PIP.W - PIP.m / (1 - PIP.s)}px ${PIP.m / (1 - PIP.s)}px` : LANDSCAPE.faceOrigin }}>
      {/* (user 2026-11-12, frame 6758) slid aside, his video's left part turns transparent and melts into the background (\`feather\` px): CSS mask here, the same ramp in the GPU compositor (fx.featherL) */}
      {HY ? <VSlot src={cut} w={LANDSCAPE.W} h={LANDSCAPE.H} fx={fth > 0 ? { featherL: fth } : undefined} grow={0} /> : <div style={{ position: "absolute", inset: 0, ...(fth > 0 ? { WebkitMaskImage: `linear-gradient(to right, transparent 0px, black ${fth}px)`, maskImage: `linear-gradient(to right, transparent 0px, black ${fth}px)` } : {}) }}><RV src={staticFile(cut)} style={{ position: "absolute", left: 0, top: 0, width: LANDSCAPE.W, height: LANDSCAPE.H }} /></div>}
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
const underHim = (spec: MontageSpec, o: Orient, x: { t?: string; from?: number; to?: number }) => UNDER_TYPES.has(x.t ?? "full") && ((spec.behind ?? []).some((w) => (w.matte ?? spec.matte) && (!w.only || w.only === o) && (o === "land" || w.dx === undefined) && (x.from ?? 0) < w.to && (x.to ?? 0) > w.from)
  /* (2026-11-12) a `mini` window (landscape) cuts him out on the GPU as well: its map lies under him (same test in tools/window_frames.mjs) */
  || (o === "land" && spec.items.some((m) => m.t === "mini" && (m.matte ?? spec.matte) && (x.from ?? 0) < m.to && (x.to ?? 0) > m.from)));
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
  if (HY) {   /* hybrid / GPU render (2026-11-12): his cut-out on the GPU (a masked <VSlot>, the matte as one more NVDEC stream); the CSS drop shadow is drawn
                 by the compositor from the cut-out's own alpha (fx.shadow*, same numbers, scaled with him); what lies under him is in the under layer */
    return (
      <AbsoluteFill style={{ transformOrigin: `${fx}px ${fy}px`, transform: `translate(${(it.cx - fx) * e}px, ${(it.cy - fy) * e}px) scale(${1 + (it.scale - 1) * e})` }}>
        <VSlot src={cut} startFrom={Math.round(it.from * 30)} w={LANDSCAPE.W} h={LANDSCAPE.H} matte={{ src: matte.src, startFrom: (matte.startFrom ?? 0) + Math.round((it.from - (matte.start ?? 0)) * 30) }}
          fx={e > 0.05 ? { shadowY: 10, shadowBlur: 18, shadowA: 0.55, shR: 20, shG: 12, shB: 4 } : undefined} grow={0} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ transformOrigin: `${fx}px ${fy}px`, transform: `translate(${(it.cx - fx) * e}px, ${(it.cy - fy) * e}px) scale(${1 + (it.scale - 1) * e})`, filter: e > 0.05 ? "drop-shadow(0 10px 18px rgba(20,12,4,.55))" : undefined }}>
      <MaskedVideo video={cut} matte={matte.src} videoStartFrom={Math.round(it.from * 30)} matteStartFrom={(matte.startFrom ?? 0) + Math.round((it.from - (matte.start ?? 0)) * 30)} width={LANDSCAPE.W} height={LANDSCAPE.H} />
    </AbsoluteFill>
  );
};

/** every item type the renderer knows (= the elements approved in the gallery); anything else is an error, never silently skipped (user 2026-10-28) */
const APPROVED_TYPES = new Set(["word", "pick", "blur", "nameTag", "phone", "crop", "pic", "scene", "full", "rewrite", "flash", "credit", "subscribe", "verse", "hadith", "rows", "scholar", "cover", "tree", "pmap", "mini", "timeline", "p2c", "torn", "news", "treefx", "tphoto", "scraps", "clock", "arc", "flag", "date", "note", "bgclip", "hclip", "wm", "zoomblend", "horror", "tvoff", "brushx", "peek", "weights", "stamp"]);

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
  const inPanel = (ld as { panel?: boolean }).panel === true || isHalfWay(it);   // a half-screen verse/hadith way has its own fixed place
  return { ...it, dx: (it.dx ?? 0) + P.dx, dy: (it.dy ?? 0) + P.dy, k: (it.k ?? 1) * P.k, land: inPanel ? ld : { ...ld, dx: (ld.dx ?? 0) + L.dx, dy: (ld.dy ?? 0) + L.dy, k: (ld.k ?? 1) * L.k } } as SpecItem;
}) };
/* VERSE / HADITH WAYS AT RANDOM (user 2026-11-12: «كل ما تمر آية أو حديث يختار واحد عشوائي… دائماً عشوائي»): every landscape verse and every hadith with `phrases`
   that has no `way` gets one of the approved ways, drawn from a hash of the video + the item's second — a different draw for every verse/hadith and every episode,
   and the same draw in Studio and in the render. A recited isnad (`chain`) always shows the chain. The half-screen ways slide him right (an extra `shifts` window). */
const VERSE_WAYS = ["noor", "bigword"] as const, HADITH_WAYS = ["quote", "books"] as const;
const draw = (key: string, n: number) => { let h = 2166136261; for (const c of key) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) % n; };
const ayaOf = (it: { aya?: number; refText: string }) => it.aya ?? Number((it.refText.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).match(/\d+/) ?? ["0"])[0]);
/** HOLD AFTER COMPLETION (user 2026-11-15: «العناصر تختفي بمجرد أن تتم … لازم تبقى ثانية أو ثانيتين بحيث أن الناس تستوعب»): a picked element never leaves before
 *  its LAST part has appeared (every `at`/`…At` inside it, typed text ends, the entrance animation ≈0.8 s) + PICK_HOLD seconds — whatever `until` the spec says. */
export const PICK_HOLD = 2;   /* user 2026-11-15 (frame 17337): after the writing ends the element stays AT LEAST 2 s */
type PickItem = Extract<SpecItem, { t: "pick" }>;
export const pickLastEvent = (it: PickItem): number => {
  let m = it.at; const walk = (v: unknown, key: string) => { if (typeof v === "number" && (key === "at" || /At$/.test(key))) m = Math.max(m, v); else if (Array.isArray(v)) v.forEach((x) => walk(x, key)); else if (v && typeof v === "object") Object.entries(v).forEach(([k, x]) => walk(x, k)); };
  Object.entries(it).forEach(([k, v]) => { if (k !== "until" && k !== "land") walk(v, k); });
  const a = it as unknown as { typeAt?: number; query?: string; cps?: number; lines?: { text: string; at: number }[] };
  if (a.typeAt != null && a.query) m = Math.max(m, a.typeAt + a.query.length / (a.cps ?? 12));
  (a.lines ?? []).forEach((l) => { m = Math.max(m, l.at + Math.max(0.5, l.text.length * 0.06)); });
  return m + 0.8;
};
export const pickUntil = (it: PickItem) => Math.max(it.until, pickLastEvent(it) + PICK_HOLD);
/** a picked element (PickKit) in landscape sits on the left half: the approved blended panel behind it, while he is slid right (shift window below) */
const PickPanel: React.FC<{ at: number; until: number }> = ({ at, until }) => { const t = useT(); return <BlendPanel k={halfK(t, at - HALF_LEAD, until)} t={t} id={"pk" + at} />; };
const isHalfWay = (it: SpecItem) => (it.t === "pick" && !(it.noShift ?? !!PICK_NOSPLIT[it.el]) && !PICK_FULL_FRAME.has(it.el)) || (it.t === "verse" && !it.full && (it.way === "noor" || it.way === "bigword")) || (it.t === "note" && !!it.phrases?.length && (it.way === "quote" || it.way === "books"));
/** a note with only `title`: split the matn into short phrases (at punctuation, then ≤5 words) and spread them over the spoken span by length */
const autoPhrases = (title: string, at: number, until: number) => {
  const parts = title.replace(/[«»"]/g, "").split(/[،,.؛:!؟?\n]+/).map((p) => p.trim()).filter(Boolean)
    .flatMap((p) => { const w = p.split(/\s+/), out: string[] = []; for (let i = 0; i < w.length; i += 5) out.push(w.slice(i, i + 5).join(" ")); return out; });
  const total = parts.reduce((a, p) => a + p.length, 0) || 1, span = Math.max(0.4, until - at - 1.5);
  let acc = 0;
  return parts.map((text) => { const p = { text, at: +(at + 0.2 + (acc / total) * span).toFixed(2) }; acc += text.length; return p; });
};
const withHalfWays = (s: MontageSpec): MontageSpec => {
  const seed = s.cut ?? (s as { title?: string }).title ?? "";
  const items = s.items.map((it) => {
    if (it.only === "port") return it;
    if (it.t === "verse" && !it.full && !it.way) return { ...it, way: VERSE_WAYS[draw(`${seed}|v|${it.times[0]}`, VERSE_WAYS.length)] } as SpecItem;
    if (it.t === "note" && !it.phrases?.length && it.way !== "card") it = { ...it, phrases: autoPhrases(it.title, it.at, it.until) };   // (user 2026-11-12: «اعتمدنا طريقة جديدة وخلاص») every hadith takes the new ways
    if (it.t === "note" && it.phrases?.length && !it.way) return { ...it, way: it.chain?.length ? "isnad" : HADITH_WAYS[draw(`${seed}|h|${it.phrases[0].at}`, HADITH_WAYS.length)] } as SpecItem;
    return it;
  });
  const extra = items.filter(isHalfWay).map((it) => it.t === "verse" ? halfShift(it.times[0] - HALF_LEAD, it.until ?? it.times[it.times.length - 1] + 1.2)
    : it.t === "pick" ? halfShift(it.at - HALF_LEAD, pickUntil(it))
    : halfShift((it as { phrases: { at: number }[] }).phrases[0].at - HALF_LEAD, (it as { until: number }).until));
  return extra.length ? { ...s, items, shifts: [...(s.shifts ?? []), ...extra].sort((a, b) => a.from - b.from) } : { ...s, items };
};
/* OPENING BUMPER IN STUDIO TOO (user 2026-11-12, binding law: «دائماً قبل أن أقول للمرة الأولى في الفيديو (طيب السلام عليكم / طيب بسم الله / السلام عليكم / بسم الله)
   تضع الفاصل، فاصل عشوائي… ما عدا الريلز»): spec.bumper = { id, at } (tools/bumper_at.mjs --write). The render inserts it into the final file (prepend_bumper --at --id);
   Studio shows the same thing: the talk stops at `at`, the bumper plays 5 s with its sound, then the talk goes on. Composition frames in Studio = spec.frames + 150. */
const FAWASEL: Record<string, { file: string; fileP: string }> = { press: { file: "fawasel/fasel_press.mp4", fileP: "fawasel/fasel_press_p.mp4" }, shelf: { file: "fawasel/fasel_shelf.mp4", fileP: "fawasel/fasel_shelf_p.mp4" }, wall: { file: "fawasel/fasel_wall.mp4", fileP: "fawasel/fasel_wall_p.mp4" }, notebook: { file: "fawasel/fasel_notebook.mp4", fileP: "fawasel/fasel_notebook_p.mp4" }, tear: { file: "fawasel/fasel_tear.mp4", fileP: "fawasel/fasel_tear_p.mp4" } };
const studioBumper = (s: MontageSpec) => { const b = (s as { bumper?: { id: string; at: number; end?: boolean } }).bumper; return getRemotionEnvironment().isStudio && b && (b.at >= 1 || b.end) && FAWASEL[b.id] && (s as { kind?: string }).kind !== "reel" ? b : null; };
export const specFrames = (s: MontageSpec) => s.frames + (studioBumper(s) ? 150 : 0);
/** `muted`: no sound from this copy (the side-by-side preview, src/MontageBoth.tsx, plays the sound from one side only) */
export const MontageFromSpec: React.FC<{ spec: MontageSpec; muted?: boolean }> = ({ spec, muted }) => {
  const b = studioBumper(spec), { width, height } = useVideoConfig(), frame = useCurrentFrame();
  if (!b) return <MontageFromSpecBody spec={spec} muted={muted} />;
  const G = Math.round(b.at * 30), f = FAWASEL[b.id], fr = frame;   // the Studio keeps an ended Sequence's audio tag playing: each voice piece is MUTED outside its own span
  return (
    <>
      {/* (user 2026-11-16: «أسمع اختلاط صوت الفاصل مع صوت الفيديو الذي بعده») the Studio kept the first part's voice playing on through the bumper and after it
          (an unmounted Sequence did not stop its shared audio tag). His voice is therefore NOT in the two copies of the body: it is two bounded audio pieces here,
          the first cut off at the bumper (endAt), the second starting at the same second after it */}
      {G > 0 ? <Sequence durationInFrames={G}><MontageFromSpecBody spec={spec} muted={muted} noCutAudio /></Sequence> : null}
      {G > 0 && spec.cut ? <Audio key="voiceA" src={staticFile(spec.cut)} volume={(v) => (v < G ? 0.8 : 0)} muted={muted || fr >= G} /> : null}   {/* no endAt either (it wraps the tag in a Sequence that ends): it stays mounted, so the Studio keeps steering (and silencing) it */}
      <Sequence from={G} durationInFrames={150}><AbsoluteFill style={{ background: "#000" }}><Video muted={muted} src={staticFile(width > height ? f.file : f.fileP)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></AbsoluteFill></Sequence>
      <Sequence from={G + 150}><Sequence from={-G}><MontageFromSpecBody spec={spec} muted={muted} noCutAudio /></Sequence></Sequence>
      {spec.cut ? <Sequence key="voiceB" from={G + 150}><Audio src={staticFile(spec.cut)} startFrom={G} volume={0.8} muted={muted || fr < G + 150} /></Sequence> : null}
    </>
  );
};
/** TESTS ONLY (2026-11-12): inputProps {specTest: {items?, psplits?, dropBehind?: [index…]}} adds elements to the spec for ONE render or still
 *  (gpu_render --props / stills.mjs --props) — the spec files are never touched while a queue may be rendering from them. Absent: no effect. */
type SpecTest = { items?: SpecItem[]; psplits?: NonNullable<MontageSpec["psplits"]>; dropBehind?: number[]; dropCut?: boolean };
const withSpecTest = (s: MontageSpec): MontageSpec => {
  const x = (getInputProps() as { specTest?: SpecTest }).specTest;
  if (!x) return s;
  return { ...s, ...(x.dropCut ? { cut: undefined } : {}), items: [...s.items, ...(x.items ?? [])], psplits: [...(s.psplits ?? []), ...(x.psplits ?? [])], behind: (s.behind ?? []).filter((_, i) => !(x.dropBehind ?? []).includes(i)) };
};
/** (user order 2026-11-16, every video, the gallery too) PORTRAIT THREE ZONES while a panel element is up: his video in the upper half (a split window, scale 0.5 from the top),
 *  the caption just under it (y 985), the ELEMENT in the zone below (1100–1780): hadith panel, picked elements (their 1920×1080 board scaled into the zone) */
const SPLITZ = { s: 0.5, top: 960 };
const withPortZones = (spec0: MontageSpec): MontageSpec => {
  const spec: MontageSpec = spec0;
  const w: { from: number; to: number }[] = [];
  for (const it of spec.items) {
    if (it.only === "land") continue;
    if (it.t === "note" && it.phrases?.length) w.push({ from: it.phrases[0].at - 0.35, to: it.until });
    else if (it.t === "pick" && !PICK_FULL_FRAME.has(it.el)) w.push({ from: it.at - 0.35, to: pickUntil(it as PickItem) });
    else if (it.t === "verse" && !(it as { full?: boolean }).full && ((it as { way?: string }).way === "noor" || (it as { way?: string }).way === "bigword")) { const v = it as unknown as { times: number[]; until?: number }; w.push({ from: v.times[0] - 0.35, to: v.until ?? v.times[v.times.length - 1] + 1.2 }); }
    /* (user 2026-11-17, frame 2800 of umawi_actress, overrides the rule of frame 16936) a picture NEVER shrinks him: pic/tphoto/scholar/news sit in the lower band away from his face (grid_plan), he stays full size */
  }
  w.sort((a, b) => a.from - b.from);
  const m: { from: number; to: number }[] = [];
  for (const x of w) { const l = m[m.length - 1]; if (l && x.from <= l.to + 0.6) l.to = Math.max(l.to, x.to); else m.push({ ...x }); }
  /* the sections rail (2026-11-17): his video drops under the band above his head while it shows */
  const drops = spec.items.filter((it): it is PickItem => it.t === "pick" && (it as PickItem).el === "SectionsRail" && it.only !== "land").map((it) => ({ from: it.at - 0.35, to: pickUntil(it), s: 1, dy: railPortDrop(((it as unknown as { sections?: unknown[] }).sections ?? []).length) }));
  return m.length || drops.length ? { ...spec, psplits: [...(spec.psplits ?? []), ...m.map((x) => ({ ...x, ...SPLITZ })), ...drops] } : spec;
};
const MontageFromSpecBody: React.FC<{ spec: MontageSpec; muted?: boolean; noCutAudio?: boolean }> = ({ spec: raw, muted, noCutAudio }) => {
  /* (2026-11-17) a `galleryRef` spec carries only codes, content and timing: size and place come from the gallery now (src/galleryRef.ts) */
  const spec0 = withGallery(withHalfWays(resolveGalleryRef(withSpecTest(raw), galleryGeo as unknown as GalleryGeo, layoutGrids as unknown as Grids)));
  for (const it of spec0.items) if (!APPROVED_TYPES.has(it.t)) throw new Error(`عنصر غير معتمد في المعرض: «${it.t}» في ${spec0.id} — المعتمد: ${[...APPROVED_TYPES].join("، ")}`);
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const o: Orient = width > height ? "land" : "port";
  const spec = o === "port" ? withPortZones(spec0) : spec0;
  usePublishOnScreen(spec.items, o, f / 30, (spec.showTitleBar ?? spec.kind !== "reel") ? ["TitleBar"] : []);   // Studio only: the names of the elements on screen now, written under the screen (src/studioTools.ts)
  /* (2026-11-12) the GPU renderer (HYL) draws every element: solos (SoloLand), phone (PhoneWin), mini (MiniMe), treefx, psplits. Only the hybrid
     fallback (hybrid_any, no extra layers) still refuses the ones it cannot draw */
  if (HY && !HYL && ((o === "port" && spec.items.some((x) => x.t === "phone")) || (o === "land" && spec.psplits?.length) || spec.solos?.length || spec.items.some((x) => x.t === "mini" || x.t === "treefx"))) throw new Error(`المسار الهجين لا يدعم هذا المونتاج (${spec.id}): طولي أو solos/psplits/mini/treefx — استعمل المحرّك الجديد tools/gpu_render.mjs`);
  applyBrand(spec.brand);
  FONT_TITLE(); FONT_TEXT();
  const bar = spec.bar ?? BAR_WARM;
  const fulls = spec.items.filter((i): i is Extract<SpecItem, { t: "full" }> => i.t === "full" && (!i.only || i.only === o));
  const cover = spec.items.find((i): i is Extract<SpecItem, { t: "cover" }> => i.t === "cover" && (!i.only || i.only === o));
  const mine = <T extends SpecItem["t"]>(k: T) => spec.items.filter((i): i is Extract<SpecItem, { t: T }> => i.t === k && (!i.only || i.only === o));
  /* portrait isolation layout (user 2026-11-12): the experiment's inputProps win over the spec */
  /* the user's choice (2026-11-12, «B»): the clip fills the frame lightly blurred behind him, a tilted paper card of the same clip on its subject top-left,
     he slid right at 66 % — the default for every portrait background-clip isolation; the experiment's inputProps or the spec may override it */
  const portIso = (((getRemotionEnvironment().isPlayer ? {} : getInputProps()) as { portIso?: PortIso }).portIso ?? (spec as { portIso?: PortIso }).portIso ?? PORT_ISO_DEFAULT) as PortIso | undefined;
  const bgUnder = (w: { from: number; to: number }) => spec.items.some((x) => (x.t === "bgclip" || (x.t === "pmap" && (x as { iso?: boolean }).iso)) && (x as { from: number }).from < w.to && (x as { to: number }).to > w.from);   /* (user 2026-11-17) a map behind him in portrait also needs the room: his isolated cut-out shrinks to the bottom like over a background clip */   /* the B layout only where a background clip is behind him */
  const bgclips = mine("bgclip"), hclips = mine("hclip"), pulses = mine("zoomblend"), horrors = mine("horror");
  const hasFx = pulses.length > 0 || horrors.length > 0;
  const wrapStage = (kids: React.ReactNode) => hasFx ? <FxStage pulses={pulses} horrors={horrors}>{kids}</FxStage> : <>{kids}</>;   // an element, not a component type: the videos inside never remount
  /* (user 2026-11-15) inside a split window the pictures go in the MIDDLE between the two screens, behind both frames, while he slides aside (DebateDossier behind/gaps) */
  const SPLIT_BEHIND = new Set(["tphoto", "pic", "scholar", "news", "date", "flag", "clock", "brushx"]);
  const inSplitWin = (it: SpecItem) => { const a = (it as { at?: number }).at; return a != null && (spec.splits ?? []).some((s) => a >= s.from - 0.05 && a < s.to); };
  const behindIt = (it: SpecItem) => o === "land" && !!spec.cut && SPLIT_BEHIND.has(it.t) && it.only !== "port" && inSplitWin(it);
  const behindGaps = spec.items.filter(behindIt).map((it) => { const a = (it as { at: number }).at, sp = (spec.splits ?? []).find((s) => a >= s.from - 0.05 && a < s.to)!; return { from: a - 0.05, to: Math.min((it as { until?: number }).until ?? a + 6, sp.to) }; });
  const behindNodes = spec.items.map((it, i) => (behindIt(it) ? renderItem(it, i, o, bar) : null));
  const body = o === "land"
    ? (spec.cut ? <LandFootage cut={spec.cut} zooms={spec.zooms} splits={spec.splits} shifts={spec.shifts} behind={behindGaps.length ? behindNodes : undefined} gaps={behindGaps} pips={spec.items.filter((x) => x.t === "pick" && x.el === "PipSource" && x.only !== "port").map((x) => ({ at: (x as { at: number }).at, until: pickUntil(x as PickItem) }))} /> : null)
    : (spec.cut ? <SheikhLayers cut={spec.cut} cams={spec.cams ?? [{ from: 0, to: 9999, cx: 990 }]} zooms={spec.zooms} drops={(spec.psplits ?? []).filter((w) => w.dy)} /> : null);
  const effPs: NonNullable<MontageSpec["psplits"]> = [...(spec.psplits ?? []), ...(o === "port" && spec.kind === "reel" ? (spec.splits ?? []).filter((sp) => sp.page).map((sp) => ({ from: sp.from, to: sp.to, s: PAGE_S, top: PAGE_TOP, panel: "warm" as const })) : [])];   /* a shown page in a reel: the same split window the engine uses for a big element (user 2026-11-17) */
  return (
    <HybridHost>
    <AbsoluteFill style={{ background: hyBg(BRAND.base) }}>
      {spec.cut && !noCutAudio ? <Audio src={staticFile(spec.cut)} volume={0.8} muted={muted} /> : null}
      {(spec.sfx ?? []).filter((x) => !x.only || x.only === o).map((x, i) => <Sequence key={"sfx" + i} from={Math.max(0, Math.round(x.at * 30))} durationInFrames={x.dur ? Math.round(x.dur * 30) : 45}><Audio src={staticFile(x.src)} volume={x.vol} muted={muted} /></Sequence>)}
      {o === "port" || !spec.cut ? (HY ? <HybridBg><WarmBase /></HybridBg> : <WarmBase />) : null}
      {/* the base's stars drift with the frame (KhBg): the GPU renderer renders this background's parts apart and its compositor drifts the stars (2026-11-12) */}
      {wrapStage(<>
      <Sequence from={0} durationInFrames={spec.tail ? Math.round(spec.tail.from * 30) : spec.frames}>{(() => { const b2 = o === "port" && effPs.length ? <PortSplit windows={effPs}>{body}</PortSplit> : body; return spec.shake?.length ? <HandheldShake windows={spec.shake} amp={6} rot={0.4}>{b2}</HandheldShake> : b2; })()}</Sequence>
      {o === "port" && effPs.some((w) => !w.dy) ? <PortPanel windows={effPs.filter((w) => !w.dy)} /> : null}
      {o === "port" ? (spec.splits ?? []).map((sp, i) => spec.cut ? <PortraitClipCard key={i} cut={spec.cut} sp={cover && cover.style !== "kit" ? { ...sp, from: Math.max(sp.from, (cover.style === "pro" ? THUMBPRO_END : PAPER_COVER_END) / 30) } : sp} /> : null) : null}
      {/* a curtain at BOTH the entry and the exit of every baked split (rule 41; user 2026-10-30: «خطأ فادح أن تظهر الشاشة المقسومة بدون المؤثر الخاص»); none at the very start (the cover covers it) and one per shared edge */}
      {o === "land" ? [...new Set((spec.splits ?? []).flatMap((sp) => [sp.from, sp.to]).filter((t) => t > 0.5))].map((t) => <Curtain key={"cs" + t} at={t} />) : null}
      {o === "land" && spec.cut ? (spec.solos ?? []).map((sp, i) => <SoloLand key={"so" + i} cut={spec.cut!} sp={sp} zooms={spec.zooms} />) : null}
      {o === "land" ? (spec.solos ?? []).flatMap((sp, i) => [<Curtain key={"ca" + i} at={sp.from} />, <Curtain key={"cb" + i} at={sp.to} />, ...(sp.center ?? []).flatMap((c, j) => [<Curtain key={"cc" + i + j} at={c.from} />, <Curtain key={"cd" + i + j} at={c.to} />])]) : null}
      {spec.tail ? <Sequence from={Math.round(spec.tail.from * 30)}><Audio src={staticFile(spec.tail.src)} volume={0.95} muted={muted} /></Sequence> : null}
      {spec.tail ? <TailVoice tl={spec.tail} /> : null}
      {fulls.map((x, i) => {
        const fp = { src: x.src, from: x.from, to: x.to, origin: o === "land" ? x.land?.origin ?? x.origin : x.origin, marker: o === "land" ? x.land?.marker : x.marker, box: o === "land" ? undefined : x.box };
        /* hybrid / GPU render (2026-11-12): a full-screen VIDEO is decoded on the GPU — the clip as a <VSlot> outside <UnderHim> (so it lies just under
           his cut-out), its marker in the under-him layer; FullImage ignores `part` for pictures and boxes */
        const vid = HY && !fp.box && /\.mp4$/i.test(x.src);
        return (
          <React.Fragment key={i}>
            {vid ? <FullImage {...fp} part="video" /> : null}
            <UnderHim active={underHim(spec, o, x)} from={x.from} to={x.to}><FullImage {...fp} part={vid ? "graphics" : undefined} /></UnderHim>
          </React.Fragment>
        );
      })}
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
        {spec.items.map((it, i) => (behindIt(it) ? null : renderItem(it, i, o, bar)))}
        {(spec.showTitleBar ?? spec.kind !== "reel") ? <TitleBar title={spec.title} theme={bar} date={spec.date} bottomHalf={o === "port"} /> : null}   {/* the counter bar is on in every episode by default (user 2026-11-16); lessons/streams set it false */}
      </Gfx>
      {/* the ONLY transition of the user-ordered layers is the gallery Curtain (user 2026-11-09: no opacity transitions, nothing outside the gallery): where a clip hands over to the next clip of its group, and where a background clip / isolation ends */}
      {o === "land" ? [...new Set([...hclips.flatMap((x) => hclips.filter((y) => y !== x && y.from - x.to > -0.01 && y.from - x.to < 1).map((y) => (x.to + y.from) / 2)), /* no curtain when a background clip ends or an isolation window (moved or not) starts/ends: the isolation just goes away (user 2026-11-11) */].map((v) => +v.toFixed(2)))].map((t) => <Curtain key={"gc" + t} at={t} />) : null}
      {horrors.length ? <HorrorVeil windows={horrors} /> : null}
      {mine("weights").map((x, i) => <WeightsOnBack key={"wt" + i} at={x.at} until={x.until} fig={x.fig} crowd={x.crowd} n={x.n} />)}
      {mine("tvoff").map((x, i) => <TvOff key={"tv" + i} at={x.at} dur={x.dur} />)}
      {cover && cover.style === "image" && f < THUMBPRO_END ? <PaperTear from={3} to={THUMBPRO_TEAR_END} sheet={<AbsoluteFill style={{ background: "#0d0f14" }}>{o === "land" ? null : <Img src={staticFile(cover.srcPort ?? cover.src)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(40px) brightness(.55)", transform: "scale(1.2)" }} />}<Img src={staticFile(o === "land" ? cover.src : (cover.srcPort ?? cover.src))} style={o === "land" ? { width: "100%", height: "100%", objectFit: "cover" } : { position: "absolute", left: 0, top: "50%", width: "100%", transform: "translateY(-50%)" }} /></AbsoluteFill>} /> : null}
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
