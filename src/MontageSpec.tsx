import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Gfx, HandheldShake, SourceWalk, BlurRise, RewriteWindow, FlashCut, PinnedPhoto, TimelineTravel, PanelToCanvas, useT } from "./MG";
import { KeyChip, VerseWords, ReelVerseFull } from "./MGExtras";
import { TitleBar } from "./TitleBar";
import type { BarTheme } from "./TitleBar";
import { NameCard1, NameCard3 } from "./NameCards";
import { Banner, StatRow, Pic, Subscribe, Sources } from "./EuKit";
import { FONT_TITLE, FONT_TEXT } from "./localFonts";
import { BAR_WARM, WarmBase, Only, Word, PhoneWin, SheikhLayers, PaperScene, PaperMap, FamilyTree, TreeFx, Parchment, miniEase, FullImage, Marker, RV, LANDSCAPE, clamp } from "./PortraitKit";
import type { TreeNode, TreeLink, MapPt, MapLeg } from "./PortraitKit";
import { CoverKit, COVER_PALETTES, PaperCoverKit, PAPER_COVER_END } from "./CoverKit";
import type { CoverProps } from "./CoverKit";
import { ThumbProOpen, THUMBPRO_END } from "./ThumbPro";
import type { ThumbProps } from "./ThumbPro";
import { TornNote, NewsClip } from "./PaperKit";
import { BRAND, applyBrand } from "./brand";
import type { BrandName } from "./brand";
import { MaskedVideo } from "./MaskedVideo";
import { DEBATE_LAYOUTS } from "./DebateLayouts";
import type { DebateLayoutName } from "./DebateLayouts";

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
export type Land = { x?: number; y?: number; w?: number; h?: number; photoH?: number; size?: number; origin?: string; marker?: Mark; skip?: boolean };
type Common = { only?: "port" | "land"; land?: Land };
export type SpecItem = Common & (
  | { t: "word"; text: string; at: number; until: number; x: number; y: number; size?: number; tone?: "gold" | "cream"; flag?: string }
  | { t: "blur"; text: string; at: number; until: number; y: number; size?: number; accentWords?: number[] }
  | { t: "nameTag"; at: number; x: number; y: number; dur?: number; style?: "card" | "pinned" }
  | { t: "phone"; at: number; to: number; src: string; dur: number; cx?: number; cy?: number; w?: number; h?: number }
  | { t: "crop"; src: string; nat: { w: number; h: number }; crop: { x: number; y: number; w: number; h: number }; name: string; at: number; until: number; x: number; y: number; w: number; walk?: boolean }
  | { t: "pic"; src: string; at: number; until: number; x: number; y: number; w: number; h: number; marker?: Mark }
  | { t: "scene"; at: number; until: number; x: number; y: number; w: number; h: number; pieces: { src: string; x: number; y: number; w: number; at: number; rot?: number; from?: "left" | "right" | "top" | "bottom" }[] }
  | { t: "full"; src: string; from: number; to: number; origin?: string; marker?: Mark }
  | { t: "rewrite"; x: number; y: number; w: number; h?: number; oldText: string; newText: string; oldAt: number; strikeAt: number; newAt: number; extra?: string; until?: number }
  | { t: "flash"; src: string; name?: string; at: number; until: number; x: number; y: number; w: number; h: number; crops: { fx: number; fy: number; zoom: number }[]; beats: number[] }
  | { t: "credit"; text: string; from?: number; to?: number }
  /** a verse written word by word at the second he recites it (text copied from data/quran by tools/quran_ayah.mjs, never typed) */
  | { t: "subscribe"; at: number; x: number; y: number; dur?: number }
  | { t: "verse"; words: string[]; times: number[]; title: string; refText: string; x: number; y: number; w: number; size?: number; until?: number }
  /** a column of written cards (EU-Protests style): dark `Banner` title + one `StatRow` card per spoken item; placed by the orientation's layout (no x/y) */
  | { t: "rows"; from: number; to: number; y0?: number; step?: number; rowH?: number; pin?: { x: number; w: number }; title?:{ at: number; text: string }; rows: { at: number; label: string; sub?: string; icon?: string; photo?: string }[] }
  /** a scholar he quotes: polaroid with the name in the white band (empty side of his frame; portrait: below the beard) */
  | { t: "scholar"; src: string; name: string; sub?: string; at: number; until?: number; x?: number; y?: number; w?: number; h?: number; pos?: string }
  /** the cover drawn over everything at the start (skill thumbnail-design). DEFAULT style "paper" (user 2026-10-27) = PaperCoverKit: newsprint sheet, 3 still frames, then the
   *  elements fly out and the sheet tears off in stop-motion until frame 35 (`tearOrder` overrides the face-first strip order). style "kit" = the old CoverKit for `frames` (default 3). `kitLand` overrides `kit` in landscape */
  | { t: "cover"; style?: "paper" | "kit"; tearOrder?: number[]; frames?: number; palette?: keyof typeof COVER_PALETTES; kit: Omit<CoverProps, "format" | "palette">; kitLand?: Partial<Omit<CoverProps, "format" | "palette">> }
  /** style "pro" (user 2026-10-28) = ThumbPro cover (duel / word / evidence, skill thumbnail-design) for frames 0–2, then the cover itself tears into paper strips (stop-motion) until frame 35; `proLand` overrides `pro` in landscape */
  | { t: "cover"; style: "pro"; tearOrder?: number[]; pro: Omit<ThumbProps, "format">; proLand?: Partial<Omit<ThumbProps, "format">> }
  /** family tree on a paper card (user 2026-10-29): landscape = left half of a split screen (his frame slides right through `shifts`), portrait = card under the beard; node/link positions are relative (0..1) */
  | { t: "tree"; from: number; to: number; x: number; y: number; w: number; h: number; title: string; titleAt?: number; nodes: TreeNode[]; links: TreeLink[]; nodeW?: number; nodeH?: number; font?: number }
  /** paper map (user 2026-10-29): landscape = the whole frame behind his shrunk cut-out (`mini`), portrait = a card under the beard */
  | { t: "pmap"; from: number; to: number; x: number; y: number; w: number; h: number; center: [number, number]; spanLat: number; landCenter?: [number, number]; landSpan?: number; highlight?: string[]; pts: MapPt[]; legs?: MapLeg[]; carSrc?: string; carW?: number }
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
  | { t: "mini"; from: number; to: number; shrinkAt: number; scale: number; cx: number; cy: number; matte?: { src: string; start?: number } }
);

export type MontageSpec = {
  id: string; title: string; frames: number; fps?: number;
  cut?: string;                       // public/<cut>.mp4 — his video (also the audio)
  bar?: BarTheme;                     // title-bar / key-chip colours (default BAR_WARM)
  cams?: { from: number; to: number; cx: number }[];
  zooms?: { from: number; to: number; amt?: number }[];
  shake?: { from: number; to: number }[];
  /** windows where the source recording has a baked-in split (clip left | him right): landscape = the reply model `layout` behind a curtain (default "dossier" = الملف, user 2026-10-30;
   *  blocks | dossier, src/DebateLayouts.tsx;); portrait = his slice + the clip as a tilted card at his shoulder (x/w are source px) */
  splits?: { from: number; to: number; clip: { x: number; w: number }; sheikh: { x: number; w: number }; clipName?: string; clipUrl?: string; faceX?: number; blur?: number; layout?: DebateLayoutName; card?: { left: number; top: number; rot: number; innerH: number } }[];
  /** an audio message added after his video: plays `src` from `from` s (+ voice card with a waveform and cycling photos) */
  tail?: { from: number; to: number; src: string; label: string; photos: string[] };
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
  shifts?: { from: number; to: number; dx: number }[];
  /** windows (cut seconds) where he is drawn over the full-screen pictures and the clip card (needs `matte`) */
  behind?: { from: number; to: number; matte?: { src: string; startFrom?: number; start?: number }; dx?: number }[];
  items: SpecItem[];
};

type Orient = "port" | "land";
const ROWS = {
  port: { x: 40, w: 1000, bannerY: 1440, rowY: (i: number, t: boolean) => (t ? 1515 : 1445) + i * 122, rowH: 112, bannerSize: 32 },
  land: { x: 40, w: 600, bannerY: 150, rowY: (i: number, t: boolean) => (t ? 285 : 150) + i * 185, rowH: 160, bannerSize: 38 },
};

const renderItem = (it: SpecItem, i: number, o: Orient, bar: BarTheme): React.ReactNode => {
  if (it.only && it.only !== o) return null;
  const L = o === "land", ov: Land = it.land ?? {}, G = LANDSCAPE.left;
  if (L && ov.skip) return null;
  switch (it.t) {
    case "word":
      return L
        ? <KeyChip key={i} phrases={[{ text: it.text, at: it.at }]} until={it.until} x={ov.x} y={ov.y ?? LANDSCAPE.keyY} size={ov.size ?? 54} theme={bar} />
        : <Word key={i} text={it.text} at={it.at} until={it.until} x={it.x} y={it.y} size={it.size} tone={it.tone} flag={it.flag} />;
    case "blur":
      return L
        ? <KeyChip key={i} phrases={[{ text: it.text, at: it.at }]} until={it.until} x={ov.x} y={ov.y ?? LANDSCAPE.keyY} size={ov.size ?? 54} theme={bar} />
        : <Only key={i} from={it.at} to={it.until}><BlurRise at={it.at} times={[it.at, it.at + 0.4]} text={it.text} x={40} w={1000} y={it.y} size={it.size ?? 58} color="#fff" accentColor={BRAND.accent} accentWords={it.accentWords ?? []} canvasW={1080} /></Only>;
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
    case "subscribe": return <Subscribe key={i} at={it.at} x={L ? ov.x ?? 330 : it.x} y={L ? ov.y ?? 720 : it.y} dur={it.dur} />;
    case "verse":
      // portrait: the verse fills the screen, his picture hidden while he recites (PREFERENCES §6); landscape: a card on the empty side
      return L ? <VerseWords key={i} words={it.words} times={it.times} x={ov.x ?? it.x} y={ov.y ?? it.y} w={ov.w ?? it.w} size={ov.size ?? it.size} title={it.title} refText={it.refText} until={it.until} />
        : <ReelVerseFull key={i} to={it.until ?? it.times[it.times.length - 1] + 1.2} refName={`${it.title} — ${it.refText}`} lines={[{ words: it.words, times: it.times }]} />;
    case "credit": return <Only key={i} from={it.from ?? 0.5} to={it.to ?? 9999}><Sources links={[{ at: it.from ?? 0.5, url: it.text }]} x={40} bottom={L ? 24 : 178} w={L ? 1100 : 1000} size={L ? 22 : 24} /></Only>;
    case "rows": {
      const g = ROWS[o], titled = !!it.title && (L || it.rows.length < 3);
      // `y0/step/rowH` (portrait) pack a long list under the beard: first row top, row pitch, row height
      const rowY = (n: number) => (!L && it.y0 !== undefined ? it.y0 + n * (it.step ?? 112) : g.rowY(n, titled)), rowH = !L && it.rowH ? it.rowH : g.rowH;
      return (
        <Only key={i} from={it.from} to={it.to}>
          {titled && it.title ? <Banner at={it.title.at} x={g.x} y={g.bannerY} w={g.w} text={it.title.text} size={g.bannerSize} /> : null}
          {it.rows.map((r, n) => <StatRow key={n} at={r.at} x={!L && it.pin ? it.pin.x : g.x} y={rowY(n)} w={!L && it.pin ? it.pin.w : g.w} h={rowH} icon={r.icon ?? "Quote"} label={r.label} sub={r.sub} photo={r.photo} rot={n % 2 ? 1 : -1} />)}
        </Only>
      );
    }
    case "tree": {
      const x = L ? ov.x ?? 30 : it.x, y = L ? ov.y ?? 60 : it.y, w = L ? ov.w ?? 820 : it.w, h = L ? ov.h ?? 900 : it.h;
      return <FamilyTree key={i} from={it.from} until={it.to} x={x} y={y} w={w} h={h} title={it.title} titleAt={it.titleAt} nodes={it.nodes} links={it.links} nodeW={it.nodeW} nodeH={it.nodeH} font={it.font} />;
    }
    case "pmap": return L ? null : <PaperMap key={i} at={it.from} until={it.to} x={it.x} y={it.y} w={it.w} h={it.h} center={it.center} spanLat={it.spanLat} highlight={it.highlight} pts={it.pts} legs={it.legs} carSrc={it.carSrc} carW={it.carW} />;
    case "mini": return null;
    case "treefx": return L ? null : <TreeFx key={i} skin={it.skin} from={it.from} until={it.to} x={it.x} y={it.y} w={it.w} h={it.h} title={it.title} titleAt={it.titleAt} nodes={it.nodes} links={it.links} nodeW={it.nodeW} nodeH={it.nodeH} font={it.font} titleSize={it.titleSize} />;   // landscape: base layer under him, see MontageFromSpec
    case "torn": {
      const size = L ? ov.size ?? 60 : it.size ?? 52, w = Math.min(L ? 1000 : 960, Math.max(380, Math.round(it.text.replace(/[ً-ٰٟۖ-ۭ]/g, "").length * size * 0.5 + 140)));
      const x = L ? (ov.x !== undefined ? ov.x - w / 2 : (1920 - w) / 2) : it.right ? 1040 - w : (1080 - w) / 2, y = L ? ov.y ?? 850 : it.y ?? 1470;
      return <TornNote key={i} at={it.at} until={it.until} x={x} y={y} w={w} text={it.text} size={size} underline={it.underline} />;
    }
    case "news": { const w = L ? ov.w ?? 600 : it.w, h = Math.round((it.h * w) / it.w); return <NewsClip key={i} at={it.at} until={it.until} x={L ? ov.x ?? LANDSCAPE.left.x : it.x} y={L ? ov.y ?? LANDSCAPE.left.y : it.y} w={w} h={h} src={it.src} headline={it.headline} source={it.source} />; }
    case "p2c": return <Only key={i} from={it.from} to={it.to}><PanelToCanvas at={it.from} panel={L && it.landPanel ? { ...it.panel, ...it.landPanel } : !L && it.portPanel ? { ...it.panel, ...it.portPanel } : it.panel} canvas={L && it.landCanvas ? it.landCanvas : !L && it.portCanvas ? it.portCanvas : it.canvas} rows={L ? it.rows : it.rows.map(({ title }) => ({ title }))} picks={it.picks} /></Only>;
    case "timeline": return L
      ? <TimelineTravel key={i} stages={it.stages} hold={it.hold} travel={it.travel} bandY={it.bandY} axisK={it.axisK} compact />
      : <div key={i} style={{ position: "absolute", left: 0, top: it.portTop ?? 1313, width: 1920, height: 1080, transform: "scale(0.5625)", transformOrigin: "0 0" }}><TimelineTravel stages={it.stages} hold={it.hold} travel={it.travel} compact /></div>;
    case "scholar": return <Only key={i} from={it.at} to={it.until ?? it.at + 6}><PinnedPhoto at={it.at} x={L ? ov.x ?? LANDSCAPE.right.x : it.x ?? 40} y={L ? ov.y ?? LANDSCAPE.right.y : it.y ?? 1360} w={it.w ?? 300} h={it.h ?? 370} name={it.name} sub={it.sub} rot={-3}><Pic src={it.src} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: it.pos ?? "50% 20%" }} /></PinnedPhoto></Only>;
    default: return null; // "full" is a base-layer item and "cover" a top-layer item (below)
  }
};


/** push-in easing: smoothstep, no constant-speed ramp (user 2026-10-30: «فيه رجفة») */
const ease = (x: number) => x * x * (3 - 2 * x);
type Split = NonNullable<MontageSpec["splits"]>[number];
const CARD_BORDER = 14, CARD_STRIP = 56, CARD_H = 800;
/** one polaroid card showing the source-pixel column [x, x+w) of the cut at height CARD_H */
const CropPolaroid: React.FC<{ cut: string; x: number; w: number; name: string; left: number; top: number; rot: number; innerH?: number; blur?: number }> = ({ cut, x, w, name, left, top, rot, innerH = CARD_H, blur }) => {
  const k = innerH / 1080, iw = Math.round(w * k);
  return (
    <div style={{ position: "absolute", left, top, width: iw + CARD_BORDER * 2, height: innerH + CARD_BORDER * 2 + CARD_STRIP, background: BRAND.card, borderRadius: 12, transform: `rotate(${rot}deg)`, boxShadow: "0 14px 34px rgba(0,0,0,.45)" }}>
      <div style={{ position: "absolute", left: CARD_BORDER, top: CARD_BORDER, width: iw, height: innerH, overflow: "hidden", background: "#000" }}>
        <RV src={staticFile(cut)} style={{ position: "absolute", left: -x * k, top: 0, width: 1920 * k, height: innerH, ...(blur ? { filter: `blur(${blur}px)` } : {}) }} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: CARD_STRIP, display: "flex", alignItems: "center", justifyContent: "center", direction: "rtl", fontFamily: "Noto Kufi Arabic", fontWeight: 800, fontSize: 28, color: BRAND.ink }}>{name}</div>
    </div>
  );
};
/** landscape: only his slice of a baked-split recording, centred on the decorated base (the clip beside him is never shown) */
const SoloLand: React.FC<{ cut: string; sp: NonNullable<MontageSpec["solos"]>[number]; zooms?: MontageSpec["zooms"] }> = ({ cut, sp, zooms = [] }) => {
  const t = useT(0), zz = zooms.find((q) => t >= q.from - 0.01 && t <= q.to + 0.5), zm = zz ? 1 + (zz.amt ?? 0.08) * ease(Math.min(clamp((t - zz.from) / 0.6), clamp((zz.to + 0.5 - t) / 0.7))) : 1, s = sp.scale ?? 1, w = sp.sheikh.w * s, h = LANDSCAPE.H * s, centered = (sp.center ?? []).some((c) => t >= c.from && t < c.to);
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
      <div style={{ position: "absolute", left: 0, top: -top, width: 1080, height: 1920 }}>{w.panel === "parchment" ? <Parchment /> : <WarmBase />}</div>
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
      <CropPolaroid cut={cut} x={sp.clip.x} w={sp.clip.w} name={sp.clipName ?? "المقطع المردود عليه"} left={sp.card?.left ?? 30} top={sp.card?.top ?? 1380} rot={sp.card?.rot ?? -2} innerH={sp.card?.innerH ?? 390} blur={sp.blur} />
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
export const LandFootage: React.FC<{ cut: string; zooms?: { from: number; to: number; amt?: number }[]; splits?: Split[]; shifts?: { from: number; to: number; dx: number }[] }> = ({ cut, zooms = [], splits = [], shifts = [] }) => {
  const t = useT(0);
  const sh = shifts.find((s) => t >= s.from && t <= s.to + 0.4);
  const dx = sh ? sh.dx * Math.min(clamp((t - sh.from) / 0.4), clamp((sh.to + 0.4 - t) / 0.4)) : 0;
  const sp = splits.find((x) => t >= x.from && t < x.to);
  if (sp) { const L = DEBATE_LAYOUTS[sp.layout ?? "dossier"]; return <L at={sp.from} main={{ src: cut, x: sp.sheikh.x, w: sp.sheikh.w }} guest={{ src: cut, x: sp.clip.x, w: sp.clip.w, blur: sp.blur }} guestName={sp.clipName} url={sp.clipUrl} />; }
  const zz = zooms.find((z) => t >= z.from - 0.01 && t <= z.to + 0.5);
  const z = zz ? 1 + (zz.amt ?? 0.08) * ease(Math.min(clamp((t - zz.from) / 0.6), clamp((zz.to + 0.5 - t) / 0.7))) : 1;
  return (
    <AbsoluteFill style={{ background: BRAND.base, transform: `translateX(${dx}px) scale(${z})`, transformOrigin: LANDSCAPE.faceOrigin }}>
      <RV src={staticFile(cut)} style={{ position: "absolute", left: 0, top: 0, width: LANDSCAPE.W, height: LANDSCAPE.H }} />
    </AbsoluteFill>
  );
};

/** quick isolation: his cut-out (cut + saved matte) with exactly the geometry of his video layer (LandFootage / SheikhLayers), drawn over what sits behind him */
const MaskedSheikh: React.FC<{ cut: string; matte: NonNullable<MontageSpec["matte"]>; o: Orient; cams?: MontageSpec["cams"]; zooms?: MontageSpec["zooms"]; dx?: number; from?: number }> = ({ cut, matte, o, cams, zooms = [], dx = 0, from = 0 }) => {
  const t = from + useCurrentFrame() / 30;     // inside a Sequence that starts at `from`
  const vStart = Math.round(from * 30), mStart = (matte.startFrom ?? 0) + Math.round((from - (matte.start ?? 0)) * 30);
  const zz = zooms.find((z) => t >= z.from - 0.01 && t <= z.to + 0.5);
  const z = zz ? 1 + (zz.amt ?? 0.08) * ease(Math.min(clamp((t - zz.from) / 0.6), clamp((zz.to + 0.5 - t) / 0.7))) : 1;
  if (o === "land") return (
    <AbsoluteFill style={{ transform: `translateX(${dx}px) scale(${z})`, transformOrigin: LANDSCAPE.faceOrigin }}>
      <MaskedVideo video={cut} matte={matte.src} videoStartFrom={vStart} matteStartFrom={mStart} width={LANDSCAPE.W} height={LANDSCAPE.H} />
    </AbsoluteFill>
  );
  const cs = cams ?? [{ from: 0, to: 9999, cx: 990 }], cam = cs.find((c) => t >= c.from && t < c.to) ?? cs[cs.length - 1], K = 1920 / 1080;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${z})`, transformOrigin: "540px 600px", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: -(cam.cx - 304) * K, top: 0, width: 1920 * K, height: 1920 }}>
        <MaskedVideo video={cut} matte={matte.src} videoStartFrom={vStart} matteStartFrom={mStart} width={Math.round(1920 * K)} height={1920} />
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
const APPROVED_TYPES = new Set(["word", "blur", "nameTag", "phone", "crop", "pic", "scene", "full", "rewrite", "flash", "credit", "subscribe", "verse", "rows", "scholar", "cover", "tree", "pmap", "mini", "timeline", "p2c", "torn", "news", "treefx"]);

export const MontageFromSpec: React.FC<{ spec: MontageSpec }> = ({ spec }) => {
  for (const it of spec.items) if (!APPROVED_TYPES.has(it.t)) throw new Error(`عنصر غير معتمد في المعرض: «${it.t}» في ${spec.id} — المعتمد: ${[...APPROVED_TYPES].join("، ")}`);
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const o: Orient = width > height ? "land" : "port";
  applyBrand(spec.brand);
  FONT_TITLE(); FONT_TEXT();
  const bar = spec.bar ?? BAR_WARM;
  const fulls = spec.items.filter((i): i is Extract<SpecItem, { t: "full" }> => i.t === "full" && (!i.only || i.only === o));
  const cover = spec.items.find((i): i is Extract<SpecItem, { t: "cover" }> => i.t === "cover" && (!i.only || i.only === o));
  const body = o === "land"
    ? (spec.cut ? <LandFootage cut={spec.cut} zooms={spec.zooms} splits={spec.splits} shifts={spec.shifts} /> : null)
    : (spec.cut ? <SheikhLayers cut={spec.cut} cams={spec.cams ?? [{ from: 0, to: 9999, cx: 990 }]} zooms={spec.zooms} /> : null);
  return (
    <AbsoluteFill style={{ background: BRAND.base }}>
      {spec.cut ? <Audio src={staticFile(spec.cut)} volume={0.8} /> : null}
      {o === "port" || !spec.cut ? <WarmBase /> : null}
      <Sequence from={0} durationInFrames={spec.tail ? Math.round(spec.tail.from * 30) : spec.frames}>{(() => { const b2 = o === "port" && spec.psplits?.length ? <PortSplit windows={spec.psplits}>{body}</PortSplit> : body; return spec.shake?.length ? <HandheldShake windows={spec.shake} amp={6} rot={0.4}>{b2}</HandheldShake> : b2; })()}</Sequence>
      {o === "port" && spec.psplits?.length ? <PortPanel windows={spec.psplits} /> : null}
      {o === "port" ? (spec.splits ?? []).map((sp, i) => spec.cut ? <PortraitClipCard key={i} cut={spec.cut} sp={cover && cover.style !== "kit" ? { ...sp, from: Math.max(sp.from, (cover.style === "pro" ? THUMBPRO_END : PAPER_COVER_END) / 30) } : sp} /> : null) : null}
      {o === "land" ? (spec.splits ?? []).map((sp, i) => <Curtain key={i} at={sp.to} />) : null}
      {o === "land" && spec.cut ? (spec.solos ?? []).map((sp, i) => <SoloLand key={"so" + i} cut={spec.cut!} sp={sp} zooms={spec.zooms} />) : null}
      {o === "land" ? (spec.solos ?? []).flatMap((sp, i) => [<Curtain key={"ca" + i} at={sp.from} />, <Curtain key={"cb" + i} at={sp.to} />, ...(sp.center ?? []).flatMap((c, j) => [<Curtain key={"cc" + i + j} at={c.from} />, <Curtain key={"cd" + i + j} at={c.to} />])]) : null}
      {spec.tail ? <Sequence from={Math.round(spec.tail.from * 30)}><Audio src={staticFile(spec.tail.src)} volume={0.95} /></Sequence> : null}
      {spec.tail ? <TailVoice tl={spec.tail} /> : null}
      {fulls.map((x, i) => <FullImage key={i} src={x.src} from={x.from} to={x.to} origin={o === "land" ? x.land?.origin ?? x.origin : x.origin} marker={o === "land" ? x.land?.marker : x.marker} />)}
      {o === "land" ? spec.items.map((it, i) => it.t === "pmap" && !it.only ? <PaperMap key={"pm" + i} at={it.from} until={it.to} x={it.land?.x ?? 0} y={it.land?.y ?? 0} w={it.land?.w ?? 1920} h={it.land?.h ?? 1080} center={it.landCenter ?? it.center} spanLat={it.landSpan ?? it.spanLat} highlight={it.highlight} pts={it.pts} legs={it.legs} carSrc={it.carSrc} carW={it.carW} /> : null) : null}
      {o === "land" && spec.cut ? spec.items.map((it, i) => it.t === "mini" && (it.matte ?? spec.matte) ? <Sequence key={"mi" + i} from={Math.round(it.from * 30)} durationInFrames={Math.round((it.to - it.from) * 30)}><MiniMe cut={spec.cut!} matte={(it.matte ?? spec.matte)!} it={it} /></Sequence> : null) : null}
      {o === "land" ? spec.items.map((it, i) => it.t === "treefx" && !it.only ? <Only key={"tf" + i} from={it.from} to={it.to}>{it.skin === "parchment" ? <Parchment /> : <AbsoluteFill><WarmBase /></AbsoluteFill>}<TreeFx skin={it.skin} from={it.from} until={it.to} x={o === "land" ? it.land?.x ?? 20 : it.x} y={o === "land" ? it.land?.y ?? 50 : it.y} w={o === "land" ? it.land?.w ?? 880 : it.w} h={o === "land" ? it.land?.h ?? 980 : it.h} title={it.title} titleAt={it.titleAt} nodes={it.nodes} links={it.links} nodeW={o === "land" ? it.land?.nodeW ?? it.nodeW : it.nodeW} nodeH={o === "land" ? it.land?.nodeH ?? it.nodeH : it.nodeH} font={o === "land" ? it.land?.font ?? it.font : it.font} titleSize={o === "land" ? it.land?.titleSize ?? it.titleSize : it.titleSize} /></Only> : null) : null}
      {spec.cut ? (spec.behind ?? []).map((w, i) => { const mt = w.matte ?? spec.matte; return mt && (o === "land" || w.dx === undefined) ? <Sequence key={i} from={Math.round(w.from * 30)} durationInFrames={Math.round((w.to - w.from) * 30)}><MaskedSheikh cut={spec.cut!} matte={mt} o={o} cams={spec.cams} zooms={spec.zooms} dx={o === "land" ? w.dx : 0} from={w.from} /></Sequence> : null; }) : null}
      <Gfx>
        {spec.items.map((it, i) => renderItem(it, i, o, bar))}
        <TitleBar title={spec.title} theme={bar} bottomHalf={o === "port"} />
      </Gfx>
      {cover && cover.style === "pro" && f < THUMBPRO_END ? <ThumbProOpen format={o === "land" ? "landscape" : "portrait"} tearOrder={cover.tearOrder} {...cover.pro} {...(o === "land" ? cover.proLand : {})} /> : null}
      {cover && cover.style !== "pro" && (cover.style ?? "paper") === "paper" && f < PAPER_COVER_END ? <PaperCoverKit format={o === "land" ? "landscape" : "portrait"} palette={COVER_PALETTES[cover.palette ?? "steel"]} tearOrder={cover.tearOrder} {...cover.kit} {...(o === "land" ? cover.kitLand : {})} /> : null}
      {cover && cover.style === "kit" && f < (cover.frames ?? 3) ? <CoverKit format={o === "land" ? "landscape" : "portrait"} palette={COVER_PALETTES[cover.palette ?? "steel"]} {...cover.kit} {...(o === "land" ? cover.kitLand : {})} /> : null}
    </AbsoluteFill>
  );
};
