import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Gfx, HandheldShake, SourceWalk, BlurRise, RewriteWindow, FlashCut, PinnedPhoto, useT } from "./MG";
import { KeyChip, VerseWords, ReelVerseFull } from "./MGExtras";
import { TitleBar } from "./TitleBar";
import type { BarTheme } from "./TitleBar";
import { NameCard1, NameCard3 } from "./NameCards";
import { Banner, StatRow, Pic, Subscribe, Sources } from "./EuKit";
import { FONT_TITLE, FONT_TEXT } from "./localFonts";
import { BAR_WARM, WarmBase, Only, Word, PhoneWin, SheikhLayers, PaperScene, FullImage, Marker, RV, LANDSCAPE, clamp } from "./PortraitKit";
import { CoverKit, COVER_PALETTES, PaperCoverKit, PAPER_COVER_END } from "./CoverKit";
import type { CoverProps } from "./CoverKit";
import { ThumbProOpen, THUMBPRO_END } from "./ThumbPro";
import type { ThumbProps } from "./ThumbPro";
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
  | { t: "rows"; from: number; to: number; y0?: number; step?: number; rowH?: number; title?: { at: number; text: string }; rows: { at: number; label: string; sub?: string; icon?: string; photo?: string }[] }
  /** a scholar he quotes: polaroid with the name in the white band (empty side of his frame; portrait: below the beard) */
  | { t: "scholar"; src: string; name: string; sub?: string; at: number; until?: number; x?: number; y?: number; w?: number; h?: number; pos?: string }
  /** the cover drawn over everything at the start (skill thumbnail-design). DEFAULT style "paper" (user 2026-10-27) = PaperCoverKit: newsprint sheet, 3 still frames, then the
   *  elements fly out and the sheet tears off in stop-motion until frame 51 (`tearOrder` overrides the face-first strip order). style "kit" = the old CoverKit for `frames` (default 3). `kitLand` overrides `kit` in landscape */
  | { t: "cover"; style?: "paper" | "kit"; tearOrder?: number[]; frames?: number; palette?: keyof typeof COVER_PALETTES; kit: Omit<CoverProps, "format" | "palette">; kitLand?: Partial<Omit<CoverProps, "format" | "palette">> }
  /** style "pro" (user 2026-10-28) = ThumbPro cover (duel / word / evidence, skill thumbnail-design) for frames 0–2, then the cover itself tears into paper strips (stop-motion) until frame 51; `proLand` overrides `pro` in landscape */
  | { t: "cover"; style: "pro"; tearOrder?: number[]; pro: Omit<ThumbProps, "format">; proLand?: Partial<Omit<ThumbProps, "format">> }
);

export type MontageSpec = {
  id: string; title: string; frames: number; fps?: number;
  cut?: string;                       // public/<cut>.mp4 — his video (also the audio)
  bar?: BarTheme;                     // title-bar / key-chip colours (default BAR_WARM)
  cams?: { from: number; to: number; cx: number }[];
  zooms?: { from: number; to: number; amt?: number }[];
  shake?: { from: number; to: number }[];
  /** windows where the source recording has a baked-in split (clip left | him right): landscape = two polaroid cards on the decorated base behind a curtain, or the reply model `layout`
   *  (orbital | dossier | blocks, src/DebateLayouts.tsx); portrait = his slice + the clip as a tilted card at his shoulder (x/w are source px) */
  splits?: { from: number; to: number; clip: { x: number; w: number }; sheikh: { x: number; w: number }; clipName?: string; faceX?: number; blur?: number; layout?: DebateLayoutName }[];
  /** an audio message added after his video: plays `src` from `from` s (+ voice card with a waveform and cycling photos) */
  tail?: { from: number; to: number; src: string; label: string; photos: string[] };
  /** the colour palette of the one identity (src/brand.ts PALETTES; default steel) */
  brand?: BrandName;
  /** "full" = the whole video (landscape and/or full portrait, same timeline); "reel" = a chosen excerpt ≤ 3 min, portrait only (hook 10–15 s, full-screen verses) */
  kind?: "full" | "reel";
  /** quick isolation: the gray matte of the cut (white = him) from  node tools/matte_cache.mjs get public/<cut> 0 <end>  → { src, startFrom = its offsetFrames } */
  matte?: { src: string; startFrom?: number };
  /** windows (cut seconds) where he is drawn over the full-screen pictures and the clip card (needs `matte`) */
  behind?: { from: number; to: number }[];
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
          {it.rows.map((r, n) => <StatRow key={n} at={r.at} x={g.x} y={rowY(n)} w={g.w} h={rowH} icon={r.icon ?? "Quote"} label={r.label} sub={r.sub} photo={r.photo} rot={n % 2 ? 1 : -1} />)}
        </Only>
      );
    }
    case "scholar": return <Only key={i} from={it.at} to={it.until ?? it.at + 6}><PinnedPhoto at={it.at} x={L ? ov.x ?? LANDSCAPE.right.x : it.x ?? 40} y={L ? ov.y ?? LANDSCAPE.right.y : it.y ?? 1360} w={it.w ?? 300} h={it.h ?? 370} name={it.name} sub={it.sub} rot={-3}><Pic src={it.src} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: it.pos ?? "50% 20%" }} /></PinnedPhoto></Only>;
    default: return null; // "full" is a base-layer item and "cover" a top-layer item (below)
  }
};


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
/** landscape: the baked split is hidden; the clip and his video each sit in a polaroid card side by side on the decorated base (margins ≥ 60 px, ≥ 40 px between) */
export const SplitCards: React.FC<{ cut: string; sp: Split }> = ({ cut, sp }) => {
  const k = CARD_H / 1080, cw = Math.round(sp.clip.w * k) + CARD_BORDER * 2, sw = Math.round(sp.sheikh.w * k) + CARD_BORDER * 2, gap = 110;
  const x0 = Math.round((LANDSCAPE.W - (cw + sw + gap)) / 2), top = 60;   // centred; the title bar only covers a corner of the lower strip, never the name
  return (
    <AbsoluteFill>
      <WarmBase />
      <CropPolaroid cut={cut} x={sp.clip.x} w={sp.clip.w} name={`${sp.clipName ?? "المقطع المردود عليه"}`} left={x0} top={top} rot={-1.5} blur={sp.blur} />
      <CropPolaroid cut={cut} x={sp.sheikh.x} w={sp.sheikh.w} name="الشيخ محمد بن شمس الدين" left={x0 + cw + gap} top={top} rot={1.5} />
    </AbsoluteFill>
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
      <CropPolaroid cut={cut} x={sp.clip.x} w={sp.clip.w} name={sp.clipName ?? "المقطع المردود عليه"} left={30} top={1380} rot={-2} innerH={390} blur={sp.blur} />
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
export const LandFootage: React.FC<{ cut: string; zooms?: { from: number; to: number; amt?: number }[]; splits?: Split[] }> = ({ cut, zooms = [], splits = [] }) => {
  const t = useT(0);
  const sp = splits.find((x) => t >= x.from && t < x.to);
  if (sp?.layout) { const L = DEBATE_LAYOUTS[sp.layout]; return <L at={sp.from} main={{ src: cut, x: sp.sheikh.x, w: sp.sheikh.w }} guest={{ src: cut, x: sp.clip.x, w: sp.clip.w, blur: sp.blur }} guestName={sp.clipName} />; }
  if (sp) return <SplitCards cut={cut} sp={sp} />;
  const zz = zooms.find((z) => t >= z.from - 0.01 && t <= z.to + 0.5);
  const z = zz ? 1 + (zz.amt ?? 0.08) * Math.min(clamp((t - zz.from) / 0.35), clamp((zz.to + 0.5 - t) / 0.45)) : 1;
  return (
    <AbsoluteFill style={{ background: BRAND.base, transform: `scale(${z})`, transformOrigin: LANDSCAPE.faceOrigin }}>
      <RV src={staticFile(cut)} style={{ position: "absolute", left: 0, top: 0, width: LANDSCAPE.W, height: LANDSCAPE.H }} />
    </AbsoluteFill>
  );
};

/** quick isolation: his cut-out (cut + saved matte) with exactly the geometry of his video layer (LandFootage / SheikhLayers), drawn over what sits behind him */
const MaskedSheikh: React.FC<{ cut: string; matte: NonNullable<MontageSpec["matte"]>; o: Orient; cams?: MontageSpec["cams"]; zooms?: MontageSpec["zooms"] }> = ({ cut, matte, o, cams, zooms = [] }) => {
  const t = useT(0);
  const zz = zooms.find((z) => t >= z.from - 0.01 && t <= z.to + 0.5);
  const z = zz ? 1 + (zz.amt ?? 0.08) * Math.min(clamp((t - zz.from) / 0.35), clamp((zz.to + 0.5 - t) / 0.45)) : 1;
  if (o === "land") return (
    <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: LANDSCAPE.faceOrigin }}>
      <MaskedVideo video={cut} matte={matte.src} matteStartFrom={matte.startFrom ?? 0} width={LANDSCAPE.W} height={LANDSCAPE.H} />
    </AbsoluteFill>
  );
  const cs = cams ?? [{ from: 0, to: 9999, cx: 990 }], cam = cs.find((c) => t >= c.from && t < c.to) ?? cs[cs.length - 1], K = 1920 / 1080;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${z})`, transformOrigin: "540px 600px", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: -(cam.cx - 304) * K, top: 0, width: 1920 * K, height: 1920 }}>
        <MaskedVideo video={cut} matte={matte.src} matteStartFrom={matte.startFrom ?? 0} width={Math.round(1920 * K)} height={1920} />
      </div>
    </div>
  );
};

/** every item type the renderer knows (= the elements approved in the gallery); anything else is an error, never silently skipped (user 2026-10-28) */
const APPROVED_TYPES = new Set(["word", "blur", "nameTag", "phone", "crop", "pic", "scene", "full", "rewrite", "flash", "credit", "subscribe", "verse", "rows", "scholar", "cover"]);

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
    ? (spec.cut ? <LandFootage cut={spec.cut} zooms={spec.zooms} splits={spec.splits} /> : null)
    : (spec.cut ? <SheikhLayers cut={spec.cut} cams={spec.cams ?? [{ from: 0, to: 9999, cx: 990 }]} zooms={spec.zooms} /> : null);
  return (
    <AbsoluteFill style={{ background: BRAND.base }}>
      {spec.cut ? <Audio src={staticFile(spec.cut)} volume={0.8} /> : null}
      {o === "port" || !spec.cut ? <WarmBase /> : null}
      <Sequence from={0} durationInFrames={spec.tail ? Math.round(spec.tail.from * 30) : spec.frames}>{spec.shake?.length ? <HandheldShake windows={spec.shake} amp={6} rot={0.4}>{body}</HandheldShake> : body}</Sequence>
      {o === "port" ? (spec.splits ?? []).map((sp, i) => spec.cut ? <PortraitClipCard key={i} cut={spec.cut} sp={cover && cover.style !== "kit" ? { ...sp, from: Math.max(sp.from, 51 / 30) } : sp} /> : null) : null}
      {o === "land" ? (spec.splits ?? []).map((sp, i) => <Curtain key={i} at={sp.to} />) : null}
      {spec.tail ? <Sequence from={Math.round(spec.tail.from * 30)}><Audio src={staticFile(spec.tail.src)} volume={0.95} /></Sequence> : null}
      {spec.tail ? <TailVoice tl={spec.tail} /> : null}
      {fulls.map((x, i) => <FullImage key={i} src={x.src} from={x.from} to={x.to} origin={o === "land" ? x.land?.origin ?? x.origin : x.origin} marker={o === "land" ? x.land?.marker : x.marker} />)}
      {spec.cut && spec.matte ? (spec.behind ?? []).map((w, i) => <Only key={i} from={w.from} to={w.to}><MaskedSheikh cut={spec.cut!} matte={spec.matte!} o={o} cams={spec.cams} zooms={spec.zooms} /></Only>) : null}
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
