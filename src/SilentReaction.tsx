import React from "react";
import { AbsoluteFill, Audio, CalculateMetadataFunction, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, Video, getRemotionEnvironment } from "remotion";
import { loadFont as loadKufi } from "@remotion/google-fonts/NotoKufiArabic";
import { loadFont as loadAlmarai } from "@remotion/google-fonts/Almarai";
import { loadFont as loadAmiriQuran } from "@remotion/google-fonts/AmiriQuran";
import { TitleBar } from "./TitleBar";
import { Burst, DrawIcon, Ring, ShoePrint, Sparks, StageVisual, VisualKind } from "./MotionKit";
import { Gfx } from "./MG";
import { CoverKit, CoverProps } from "./CoverKit";
import { PALETTES } from "./CoverTry4";
import type { BarTheme } from "./TitleBar";
import { STAR } from "./SplitScene";

/**
 * «التعليق الصامت» (silent reaction) — the Sheikh's silent recording of himself watching + the source video, re-edited together.
 * Skill: .claude/skills/silent-reaction/SKILL.md. All project data lives in public/silent/<name>/config.json (times in SECONDS of the OUTPUT timeline).
 * Portrait (default): him on top, the source below. Landscape: source big on the left, him in a tall card on the right. At every change of his clip the two cards swap places.
 * Quotes/keywords/photos of the SOURCE are drawn INSIDE the source card (they belong to its speaker, never to him) and appear at the word's START, never after it.
 * His audio is muted; the source audio is the only sound. No black backgrounds, nothing over his face, headroom kept (set via the crop in the config).
 * Voice-over outro: scenes timed word-by-word to his voice; there is NEVER an empty frame (the last started scene stays until the next).
 * Quran text is never typed from memory: the words in `scenes[].words` are copied by script from tools/quran_ayah.mjs (data/quran/quran-uthmani.json).
 */
const { fontFamily: kufi } = loadKufi("normal", { weights: ["800"], subsets: ["arabic"] });
const { fontFamily: almarai } = loadAlmarai("normal", { weights: ["700", "800"], subsets: ["arabic"] });
const { fontFamily: quranFont } = loadAmiriQuran("normal", { weights: ["400"], subsets: ["arabic"] });

type Rect = { x: number; y: number; w: number; h: number };
type T = { at: number; dur: number };
type Word = { w: string; at: number };
export type SilentConfigBase = {
  name: string; title: string; fps: number; durationSec: number;
  reaction: { src: string; proxy: string; w: number; h: number; offset: number; crop: { portrait: Rect; landscape: Rect };
    /** several pieces of his recording (when one clip is shorter than the source). `from` = output second, `srcStart` = second inside the recording. At every clip change the two cards SWAP places (never a bare cut between his clips: user rule). */
    clips?: { from: number; srcStart: number }[] };
  source: { src: string; proxy: string; w: number; h: number; crop: Rect; startSec: number; muted?: boolean };
  /** replaces the source audio for this block (e.g. a Quran recitation sent by the Sheikh): plays from the block start; combine with source.muted */
  audioSrc?: string;
  /** 3-frame cover: a nice still of him from his own recording + the topic title + photos of the people mentioned (never his own old video's title) */
  cover?: string;
  coverPeople?: { src: string; label: string }[];
  /** approved CoverKit recipe (skill thumbnail-design) — when set it replaces the simple cover above */
  coverKit?: Omit<CoverProps, "format" | "palette"> & { palette?: "steel" | "olive" | "walnut" };
  /** title-bar colours inspired by the video theme; `timerOffset` = seconds already elapsed before this block (the timer never restarts) */
  barTheme?: BarTheme; timerOffset?: number;
  /** timeline of blocks (voice-over scenes and silent source clips in any order). When set, durationSec/voiceover are ignored. */
  segments?: Segment[];
  theme: { bgA: string; bgB: string; accent: string };
  /** all of these belong to the SOURCE speaker and are drawn inside the source card; `at` = the second the speaker STARTS saying it */
  captions: (T & { text: string; pos?: "top" | "bottom"; quran?: boolean })[];
  keywords: (T & { text: string; tone?: "bad" | "good"; pos?: "top" })[];
  photos?: (T & { src: string; label: string })[];
  /** our own generated B-roll stills (faceless): cover the source card for `dur` seconds with a slow push-in while its audio keeps playing */
  broll?: (T & { src: string })[];
  /** the empty band under the two cards: our own stills + stock clips + a paper tag, each at its word's onset (user 2026-11-03) */
  under?: { at: number; dur: number; src: string; kind: "img" | "video"; startSec?: number; label?: string }[];
  facts: (T & { label: string; value: string })[];
  highlights: (T & { box: { x: number; y: number; w: number; h: number } })[];
  punches: (T & { scale: number; cx: number; cy: number })[];
  /** sparse ambient motion of the source card (gentle: rise/drift/pulse/tilt/dip, one move every `every` seconds, never a constant shake). amount 0 = off */
  ambient?: { every?: number; amount?: number };
};
/** one block of the timeline: a voice-over with motion-graphics scenes, or a silent clip (source video sped up/cut by tools, overlays timed in the clip's own seconds) */
export type Segment =
  | { kind: "voice"; durationSec: number; voice: VoiceOver }
  | { kind: "clip"; durationSec: number; audio?: string; source?: Partial<SilentConfigBase["source"]>; reaction?: Partial<SilentConfigBase["reaction"]>; captions?: SilentConfigBase["captions"]; keywords?: SilentConfigBase["keywords"]; photos?: SilentConfigBase["photos"]; facts?: SilentConfigBase["facts"]; highlights?: SilentConfigBase["highlights"]; punches?: SilentConfigBase["punches"]; ambient?: SilentConfigBase["ambient"] };
export type Card = { at: number; text: string; sub?: string; subAt?: number; tone: "bad" | "good" | "neutral" };
export type Scene = { at: number; dur: number; kind: "intro" | "verse" | "photo" | "cross" | "cards"; words: Word[]; cards?: Card[]; photo?: string; label?: string; ref?: string; stamp?: string; stampAt?: number; xAt?: number; arrowAt?: number; cardH?: number; stampTop?: number; stampSize?: number; shoeAt?: number; shoe?: { x: number; y: number; size: number; rot: number };
  /** the stage visual changes phrase by phrase: [{at, kind}] (sun | book | trust | judge | justice | speed); `hi` = indexes of key words that pop in gold; `decor` = extra icons drawn around the photo */
  visuals?: { at: number; kind: VisualKind }[]; hi?: number[]; decor?: { icon: string; at: number; x: number; y: number; size: number; color?: string }[] };
/** Optional voice-over he sends afterwards: plays after the silent part over motion-graphic scenes. Times are seconds INSIDE the voice-over. */
export type VoiceOver = { src: string; durationSec: number; scenes: Scene[] };
export type SilentConfigVO = SilentConfigBase & { voiceover?: VoiceOver };
export type SilentProps = { name: string; orient: "portrait" | "landscape"; config?: SilentConfigVO };

export const calculateSilentMetadata: CalculateMetadataFunction<SilentProps> = async ({ props }) => {
  const config: SilentConfigVO = await fetch(staticFile(`silent/${props.name}/config.json`)).then((r) => r.json());
  return { durationInFrames: Math.round((config.segments ? config.segments.reduce((a, x) => a + x.durationSec, 0) : config.durationSec + (config.voiceover?.durationSec ?? 0)) * config.fps), fps: config.fps, width: props.orient === "portrait" ? 1080 : 1920, height: props.orient === "portrait" ? 1920 : 1080, props: { ...props, config } };
};

const IS_RENDER = getRemotionEnvironment().isRendering;
const Vid: React.FC<{ src: string; startFrom: number; muted?: boolean; style: React.CSSProperties }> = ({ src, startFrom, muted, style }) =>
  IS_RENDER ? <OffthreadVideo src={staticFile(src)} startFrom={startFrom} muted={muted} style={style} /> : <Video src={staticFile(src)} startFrom={startFrom} muted={muted} style={style} />;

/** the band under the two cards: a picture / stock clip with a slow push, sliding up at `at`, a torn paper tag on it */
const UnderBand: React.FC<{ it: NonNullable<SilentConfigBase["under"]>[number]; fps: number; top: number; height: number; accent: string }> = ({ it, fps, top, height, accent }) => {
  const lf = useCurrentFrame();
  const t = lf / fps;
  const inU = Math.min(1, t / 0.35), outU = Math.min(1, Math.max(0, (it.dur - t) / 0.2));
  const e = 1 - Math.pow(1 - inU, 3);
  const push = 1 + 0.1 * Math.min(1, t / it.dur);
  const media: React.CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: `scale(${push})` };
  return (
    <Gfx>
      <div style={{ position: "absolute", left: 60, width: 960, top, height, overflow: "hidden", borderRadius: 30, border: "6px solid #f3e3c0", boxShadow: "0 16px 40px rgba(20,12,4,.5)", transform: `translateY(${(1 - e) * 420}px)`, opacity: outU }}>
        {it.kind === "video" ? <Vid src={it.src} startFrom={Math.round((it.startSec ?? 0) * fps)} muted style={media} /> : <Img src={staticFile(it.src)} style={media} />}
        {it.label ? (
          <div style={{ position: "absolute", right: 22, bottom: 18, padding: "8px 30px", background: "#f6efe0", border: "3px solid #3a2414", borderRadius: 6, borderRight: `14px solid ${accent}`, fontFamily: kufi, fontWeight: 800, fontSize: 44, color: "#3a2414", transform: "rotate(-2deg)", boxShadow: "0 6px 16px rgba(20,12,4,.5)" }}>{it.label}</div>
        ) : null}
      </div>
    </Gfx>
  );
};

/** 0→1→0 envelope with 0.4 s ease on each side, for a window [at, at+dur] (seconds). */
const env = (f: number, fps: number, at: number, dur: number) => interpolate(f / fps, [at, at + 0.4, at + dur - 0.4, at + dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const active = <A extends T>(list: A[], f: number, fps: number) => list.find((x) => f / fps >= x.at && f / fps <= x.at + x.dur);

/** Sparse ambient motion of the source card (user 2026-10-16: constant shaking is distracting; zoom/focus and an occasional change of place are good). One gentle 1.4 s move every `every` s. */
const AMBIENT = ["rise", "drift", "pulse", "tilt", "dip"] as const;
const ambientStyle = (t: number, every: number, amount: number): React.CSSProperties => {
  const tt = t - every * 0.6;
  if (amount <= 0 || tt < 0) return {};
  const i = Math.floor(tt / every), u = (tt - i * every) / 1.4;
  if (u > 1) return {};
  const e = Math.sin(Math.PI * u) * amount, side = i % 2 ? 1 : -1;
  switch (AMBIENT[i % AMBIENT.length]) {
    case "rise": return { transform: `translateY(${-18 * e}px)` };
    case "drift": return { transform: `translateX(${side * 22 * e}px)` };
    case "pulse": return { transform: `scale(${1 + 0.03 * e})` };
    case "tilt": return { transform: `rotate(${side * 1.2 * e}deg)` };
    default: return { transform: `translateY(${14 * e}px)` };
  }
};

const layout = (orient: "portrait" | "landscape") =>
  orient === "portrait"
    ? { react: { x: 60, y: 190, w: 960, h: 690 }, area: { x: 60, y: 900, w: 960, h: 700 }, caption: { x: 40, y: 1560, w: 1000, h: 140 }, seamY: 790 }   // y>=190: the title bar now sits at the top (doubled font)
    : { react: { x: 1320, y: 50, w: 560, h: 910 }, area: { x: 40, y: 50, w: 1240, h: 740 }, caption: { x: 40, y: 812, w: 1240, h: 148 }, seamY: 700 };


const Words: React.FC<{ words: Word[]; t: number; font: string; size: number; color: string; stroke?: string; lh?: number; hi?: number[]; hiColor?: string }> = ({ words, t, font, size, color, stroke, lh = 1.4, hi = [], hiColor = "#a8650f" }) => (
  <div style={{ direction: "rtl", textAlign: "center", fontFamily: font, fontSize: size, lineHeight: lh, color, WebkitTextStroke: stroke, paintOrder: "stroke fill" }}>
    {words.map((w, i) => {
      const u = Math.max(0, Math.min(1, (t - w.at) / 0.22));
      const on = hi.includes(i);
      const pop = on ? 1 + 0.18 * Math.sin(Math.PI * Math.min(1, Math.max(0, (t - w.at) / 0.6))) : 1;  // key words pop and glow gold
      return <span key={i} style={{ display: "inline-block", margin: "0 0.16em", opacity: u, color: on && u > 0.5 ? hiColor : undefined, textShadow: on && u > 0.5 ? "0 0 22px rgba(255,200,80,.9)" : undefined, transform: `translateY(${(1 - u) * 26}px) scale(${(0.85 + 0.15 * u) * pop})` }}>{w.w}</span>;
    })}
  </div>
);

const KitCover: React.FC<{ orient: "portrait" | "landscape"; ck: NonNullable<SilentConfigBase["coverKit"]> }> = ({ orient, ck }) => {
  const { palette, ...rest } = ck;
  return <CoverKit format={orient} palette={PALETTES[palette ?? "steel"]} {...rest} />;
};
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ease01 = (u: number) => 1 - Math.pow(1 - u, 3);
const easeIO = (u: number) => u * u * (3 - 2 * u);

/** The ONE transition style of the voice-over (user 2026-10-16: no blinding flash): the old element slides out to the right and fades, the new one slides in from the left (the way Arabic is read, forward), 0.45 s, with a thin soft gold line sweeping across. */
const Transit: React.FC<{ t: number; at: number; prev?: React.ReactNode; cur: React.ReactNode; dist?: number }> = ({ t, at, prev, cur, dist = 340 }) => {
  const u = clamp01((t - at) / 0.45), e = easeIO(u);
  return (
    <div style={{ display: "grid", justifyItems: "center", alignItems: "start" }}>
      {prev && u < 1 ? <div style={{ gridArea: "1 / 1", opacity: 1 - e, transform: `translateX(${e * dist}px) scale(${1 - 0.06 * e})`, filter: `blur(${e * 4}px)` }}>{prev}</div> : null}
      <div style={{ gridArea: "1 / 1", opacity: prev ? e : 1, transform: prev ? `translateX(${-(1 - e) * dist}px) scale(${0.94 + 0.06 * e})` : undefined }}>{cur}</div>
    </div>
  );
};

type OutroItem = { at: number; kind: VisualKind | "photo" | "cards"; sc: Scene };

/** Voice-over outro: his recorded commentary over motion-graphic scenes; each word appears AT its start, the stage visual changes phrase by phrase, and there is never an empty frame. */
const VoiceOutro: React.FC<{ c: SilentConfigVO; orient: "portrait" | "landscape" }> = ({ c, orient }) => {
  const f = useCurrentFrame();
  const vo = c.voiceover!;
  const fps = c.fps, t = f / fps;
  const { bgA, bgB } = c.theme;
  const big = orient === "portrait";
  const idx = Math.max(0, vo.scenes.map((s0) => s0.at).filter((a) => a <= t).length - 1);   // the last started scene stays until the next one: never empty
  const sc = vo.scenes[idx];
  const items: OutroItem[] = vo.scenes.flatMap<OutroItem>((s0) => s0.kind === "cards" ? [{ at: s0.at, kind: "cards" as const, sc: s0 }] : s0.kind === "photo" || s0.kind === "cross" ? [{ at: s0.at, kind: "photo" as const, sc: s0 }] : (s0.visuals ?? [{ at: s0.at, kind: (s0.kind === "intro" ? "book" : "sun") as VisualKind }]).map((v) => ({ at: v.at, kind: v.kind, sc: s0 })));
  const ii = Math.max(0, items.filter((i) => i.at <= t).length - 1);
  const cur = items[ii], prev = ii > 0 ? items[ii - 1] : undefined;

  const photoBlock = (s0: Scene) => {
    const lt = t - s0.at;
    const xP = s0.kind === "cross" ? clamp01((t - (s0.xAt ?? s0.at)) / 0.5) : 0;
    const stP = s0.stampAt != null ? spring({ frame: f - Math.round(s0.stampAt * fps), fps, config: { damping: 8, stiffness: 170 } }) : 0;
    const kb = 1 + 0.06 * (lt / Math.max(1, s0.dur));
    const shT = s0.shoeAt != null ? t - s0.shoeAt : -1;                     // seconds since the shoe lands
    const shk = shT > 0 && shT < 0.4 ? 1 - shT / 0.4 : 0;                   // card shake right after the impact
    const shS = s0.shoeAt != null ? spring({ frame: f - Math.round(s0.shoeAt * fps), fps, config: { damping: 7, stiffness: 240 } }) : 0;
    const x2 = clamp01((xP - 0.3) / 0.7);
    return (
      <div style={{ position: "relative", width: 560, height: s0.cardH ?? 740, transform: `scale(${s0.kind === "cross" ? 0.94 : 1}) translate(${shk * Math.sin((t - (s0.shoeAt ?? 0)) * 70) * 14}px, ${shk * Math.cos((t - (s0.shoeAt ?? 0)) * 58) * 9}px)` }}>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 30, border: "8px solid #f3e3c0", boxShadow: "0 18px 44px rgba(20,12,4,.55)" }}>
          <Img src={staticFile(s0.photo!)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 20%", transform: `scale(${kb})`, filter: xP > 0 ? `grayscale(${xP * 0.8}) brightness(${1 - xP * 0.25})` : undefined }} />
        </div>
        <Gfx>{s0.label ? <div style={{ position: "absolute", bottom: -26, left: 40, right: 40, textAlign: "center", padding: "8px 0", borderRadius: 16, background: "#f6ecd3", fontFamily: kufi, fontSize: 40, color: "#3a2414", boxShadow: "0 8px 20px rgba(20,12,4,.4)" }}>{s0.label}</div> : null}
        {s0.stamp ? <div style={{ position: "absolute", top: s0.stampTop ?? 70, left: -30, transform: `rotate(-14deg) scale(${stP})`, opacity: Math.min(1, stP * 2), padding: "6px 34px", border: "10px solid #c93f2f", borderRadius: 18, background: "rgba(246,236,211,.92)", color: "#c93f2f", fontFamily: kufi, fontSize: s0.stampSize ?? 120, whiteSpace: "nowrap" }}>{s0.stamp}</div> : null}
        {(s0.decor ?? []).map((d, i) => t >= d.at ? (
          <div key={i} style={{ position: "absolute", left: d.x, top: d.y + 8 * Math.sin((t - d.at) * 3 + i), transform: `rotate(${4 * Math.sin((t - d.at) * 2.4 + i)}deg)` }}>
            <DrawIcon name={d.icon} p={Math.min(1, (t - d.at) / 0.7)} size={d.size} color={d.color ?? "#ffd978"} sw={1.5} glow={16} />
          </div>
        ) : null)}
        {s0.shoeAt != null && shT >= 0 ? (
          <div style={{ position: "absolute", left: s0.shoe?.x ?? 70, top: s0.shoe?.y ?? 120, width: (s0.shoe?.size ?? 420) * 0.5, height: s0.shoe?.size ?? 420, transform: `rotate(${s0.shoe?.rot ?? -18}deg) scale(${Math.max(0.97, 2.6 - 1.6 * shS)})`, opacity: Math.min(1, shS * 3) * 0.88, mixBlendMode: "multiply" }}>
            <ShoePrint size={s0.shoe?.size ?? 420} />
            <div style={{ position: "absolute", inset: 0 }}><Burst t={shT} /><Ring p={shT / 0.6} size={520} color="#ffffff" /></div>
          </div>
        ) : null}
        </Gfx>
        {xP > 0 ? (
          <svg viewBox="0 0 560 740" style={{ position: "absolute", inset: 0 }}>
            <line x1={50} y1={80} x2={50 + 460 * xP} y2={80 + 580 * xP} stroke="#c93f2f" strokeWidth={34} strokeLinecap="round" />
            <line x1={510} y1={80} x2={510 - 460 * x2} y2={80 + 580 * x2} stroke="#c93f2f" strokeWidth={34} strokeLinecap="round" />
          </svg>
        ) : null}
      </div>
    );
  };
  const cardsBlock = (s0: Scene) => {
    const cs = s0.cards ?? [];
    const shown = cs.filter((k) => k.at <= t);
    const h = cs.length <= 2 ? 330 : cs.length === 3 ? 250 : 185;
    return (
      <div style={{ position: "relative", width: 920, height: 800, display: "flex", flexDirection: "column", justifyContent: "center", gap: 26 }}>
        {shown.map((k, i) => {
          const u = ease01(clamp01((t - k.at) / 0.4));
          const col = k.tone === "bad" ? "#b5412f" : k.tone === "good" ? "#4f7a3e" : "#6b5a3a";
          const x = clamp01((t - k.at - 0.35) / 0.3);
          return (
            <div key={i} style={{ position: "relative", height: h, opacity: u, transform: `translateX(${(1 - u) * -160}px)`, background: "#f8f4e8", border: `10px solid ${col}`, borderRadius: 26, boxShadow: "0 16px 34px rgba(0,0,0,.35)", direction: "rtl", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
              <div style={{ position: "absolute", top: -26, right: 30, background: col, color: "#fff", fontFamily: kufi, fontSize: 38, padding: "2px 24px 8px", borderRadius: 14 }}>{k.tone === "bad" ? "خطأ ✗" : k.tone === "good" ? "الصواب ✓" : "ملاحظة"}</div>
              <div style={{ fontFamily: quranFont, fontSize: cs.length <= 2 ? 92 : cs.length === 3 ? 70 : 54, color: "#2a1d13", lineHeight: 1.5, textAlign: "center", position: "relative" }}>
                {k.text}
                {k.tone === "bad" ? <div style={{ position: "absolute", left: 0, right: 0, top: "52%", height: 8, background: "#b5412f", width: `${x * 100}%`, borderRadius: 6, transform: "rotate(-2deg)", transformOrigin: "right" }} /> : null}
              </div>
              {k.sub && t >= (k.subAt ?? k.at) ? <div style={{ fontFamily: almarai, fontWeight: 800, fontSize: cs.length > 3 ? 30 : 36, color: col, marginTop: 2, textAlign: "center", padding: "0 24px" }}>{k.sub}</div> : null}
            </div>
          );
        })}
      </div>
    );
  };
  const renderItem = (it: OutroItem) => (it.kind === "photo" ? photoBlock(it.sc) : it.kind === "cards" ? cardsBlock(it.sc) : <StageVisual kind={it.kind} t={t - it.at} />);

  const textPanel = (s0: Scene) =>
    s0.kind === "verse" ? (
      <div style={{ padding: "30px 36px", borderRadius: 34, background: "rgba(246,236,211,.96)", border: "8px double #c28938", boxShadow: "0 16px 40px rgba(20,12,4,.5)" }}>
        <Words words={s0.words} t={t} font={quranFont} size={big ? 74 : 62} color="#3a2414" lh={1.7} hi={s0.hi} />
        {s0.ref ? <div style={{ textAlign: "center", fontFamily: almarai, fontWeight: 800, fontSize: 34, color: "#7a4b2a", marginTop: 6 }}>{s0.ref}</div> : null}
      </div>
    ) : (
      <Words words={s0.words} t={t} font={kufi} size={big ? 78 : 64} color="#fff4d6" stroke="10px #4a2f1d" lh={1.35} hi={s0.hi} hiColor="#ffd978" />
    );

  const sweepU = clamp01((t - cur.at) / 0.55);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${bgB}, ${bgA})`, direction: "rtl" }}>
      <AbsoluteFill style={{ backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(STAR)}")`, backgroundSize: "140px 140px", backgroundPosition: `${f * 0.3}px ${f * 0.2}px`, opacity: 0.22 }} />
      <div style={{ position: "absolute", inset: 0 }}><Sparks t={t} w={1080} h={1920} n={18} seed={idx + 11} /></div>
      <Audio src={staticFile(vo.src)} />
      <div style={{ position: "absolute", left: 0, right: 0, top: big ? 150 : 40, overflow: "hidden", height: 880 }}>
        <Transit t={t} at={cur.at} prev={prev ? renderItem(prev) : undefined} cur={renderItem(cur)} />
      </div>
      {ii > 0 && sweepU < 1 ? <div style={{ position: "absolute", top: 120, height: 860, width: 140, left: 1080 * (1 - sweepU) - 70, background: "linear-gradient(90deg, rgba(255,217,120,0), rgba(255,217,120,.35), rgba(255,217,120,0))", opacity: Math.sin(Math.PI * sweepU) }} /> : null}
      <div style={{ position: "absolute", left: big ? 50 : 300, right: big ? 50 : 300, top: big ? 1030 : 700, overflow: "hidden" }}>
        <Transit t={t} at={sc.at} prev={idx > 0 ? textPanel(vo.scenes[idx - 1]) : undefined} cur={textPanel(sc)} dist={260} />
      </div>
      {sc.arrowAt != null && t >= sc.arrowAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: big ? 930 : 640, height: 110, overflow: "hidden" }}>
          {[0, 1, 2, 3].map((i) => { const u = (((t - sc.arrowAt!) * 1.3 + i / 4) % 1); return <div key={i} style={{ position: "absolute", left: 1000 - u * 1000, top: 0, opacity: Math.sin(Math.PI * u) }}><DrawIcon name="ChevronsLeft" p={1} size={110} color="#ffd978" sw={2.2} glow={14} /></div>; })}
        </div>
      ) : null}
      <Gfx><TitleBar title={c.title} theme={c.barTheme} offsetSec={c.timerOffset ?? c.durationSec} hideNotice /></Gfx>
    </AbsoluteFill>
  );
};

const SilentMain: React.FC<{ orient: "portrait" | "landscape"; c: SilentConfigVO }> = ({ orient, c }) => {
  const f = useCurrentFrame();
  const fps = c.fps;
  const L = layout(orient);
  const { bgA, bgB, accent } = c.theme;

  // ---- two slots; the source is contain-fitted in its slot, he is cover-fitted. At each clip change the cards swap slots (0.6 s move) ----
  const sc = c.source.crop;
  const slotR = L.react, slotS = L.area;
  const fit = (sl: Rect): Rect => { const k = Math.min(sl.w / sc.w, sl.h / sc.h); const w = sc.w * k, h = sc.h * k; return { x: sl.x + (sl.w - w) / 2, y: sl.y + (sl.h - h) / 2, w, h }; };
  const clips = c.reaction.clips ?? [{ from: 0, srcStart: c.reaction.offset }];
  const swaps = clips.slice(1).map((k) => k.from);
  const t = f / fps, SW = 0.6;
  const n = swaps.filter((x) => t >= x).length;
  const lastSw = n > 0 ? swaps[n - 1] : -9;
  const prog = n > 0 && t - lastSw < SW ? (() => { const u = (t - lastSw) / SW; return u * u * (3 - 2 * u); })() : 1;
  const inSwap = prog < 1;
  const lerpR = (a: Rect, b: Rect, u: number): Rect => ({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, w: a.w + (b.w - a.w) * u, h: a.h + (b.h - a.h) * u });
  // he starts in slotR (n even), the source in its own slot; odd n = swapped
  const reactHome = slotR, srcHome = fit(slotS), reactAway = slotS, srcAway = fit(slotR);
  const wantSwapped = n % 2 === 1;
  const from = !wantSwapped ? { r: reactAway, s: srcAway } : { r: reactHome, s: srcHome };
  const to = wantSwapped ? { r: reactAway, s: srcAway } : { r: reactHome, s: srcHome };
  const RR = n === 0 ? reactHome : lerpR(from.r, to.r, prog);
  const SR = n === 0 ? srcHome : lerpR(from.s, to.s, prog);
  const bump = inSwap ? 1 + 0.05 * Math.sin(Math.PI * prog) : 1, tiltSw = inSwap ? 2.2 * Math.sin(Math.PI * prog) : 0;
  const ss = SR.w / sc.w;
  const pun = active(c.punches, f, fps);
  const pk = pun ? 1 + (pun.scale - 1) * env(f, fps, pun.at, pun.dur) : 1;

  // ---- reaction card: cover-fit his crop ----
  const rc = c.reaction.crop[orient];
  const rs = Math.max(RR.w / rc.w, RR.h / rc.h);
  const rk = 1;

  const cap = active(c.captions, f, fps), kw = active(c.keywords, f, fps), fact = active(c.facts, f, fps), hl = active(c.highlights, f, fps), ph = active(c.photos ?? [], f, fps), bl = active(c.broll ?? [], f, fps);
  const capP = cap ? spring({ frame: f - Math.round(cap.at * fps), fps, config: { damping: 14, stiffness: 150 } }) : 0;
  const capOut = cap ? interpolate(f / fps, [cap.at + cap.dur - 0.25, cap.at + cap.dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  const kwP = kw ? spring({ frame: f - Math.round(kw.at * fps), fps, config: { damping: 9, stiffness: 160 } }) : 0;
  const kwOut = kw ? interpolate(f / fps, [kw.at + kw.dur - 0.25, kw.at + kw.dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  const phP = ph ? spring({ frame: f - Math.round(ph.at * fps), fps, config: { damping: 12, stiffness: 140 } }) : 0;
  const bigText = orient === "portrait" ? 104 : 90;
  const card: React.CSSProperties = { position: "absolute", overflow: "hidden", borderRadius: 30, border: "6px solid #f3e3c0", boxShadow: "0 16px 40px rgba(20,12,4,.5)" };

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${bgA}, ${bgB})`, direction: "rtl", fontFamily: almarai }}>
      <AbsoluteFill style={{ backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(STAR)}")`, backgroundSize: "140px 140px", backgroundPosition: `${f * 0.25}px ${f * 0.15}px`, opacity: 0.2 }} />

      {c.audioSrc ? <Audio src={staticFile(c.audioSrc)} /> : null}
      {/* the Sheikh watching (muted); several clips = Sequences, switched while the cards swap places */}
      <div style={{ ...card, left: RR.x, top: RR.y, width: RR.w, height: RR.h, zIndex: inSwap ? 2 : 1, transform: `scale(${bump}) rotate(${-tiltSw}deg)` }}>
        <div style={{ position: "absolute", left: (RR.w - rc.w * rs) / 2, top: (RR.h - rc.h * rs) / 2, width: rc.w * rs, height: rc.h * rs, overflow: "hidden", transform: `scale(${rk})`, transformOrigin: "50% 38%" }}>
          {clips.map((k, i) => {
            const end = i + 1 < clips.length ? clips[i + 1].from : c.durationSec;
            return (
              <Sequence key={i} from={Math.round(k.from * fps)} durationInFrames={Math.max(1, Math.round((end - k.from) * fps))}>
                <Vid src={IS_RENDER ? c.reaction.src : c.reaction.proxy} startFrom={Math.round(k.srcStart * fps)} muted style={{ position: "absolute", left: -rc.x * rs, top: -rc.y * rs, width: c.reaction.w * rs, height: c.reaction.h * rs, maxWidth: "none" }} />
              </Sequence>
            );
          })}
        </div>
      </div>

      {/* the source video: its audio is the only sound */}
      <div style={{ ...card, left: SR.x, top: SR.y, width: SR.w, height: SR.h, zIndex: inSwap ? 3 : 1, ...(inSwap ? { transform: `scale(${bump}) rotate(${tiltSw}deg)` } : ambientStyle(f / fps, c.ambient?.every ?? 7, c.ambient?.amount ?? 1)) }}>
        <div style={{ position: "absolute", inset: 0, transform: `scale(${pk})`, transformOrigin: `${(pun?.cx ?? 0.5) * 100}% ${(pun?.cy ?? 0.5) * 100}%` }}>
          <Vid src={IS_RENDER ? c.source.src : c.source.proxy} startFrom={Math.round(c.source.startSec * fps)} muted={c.source.muted} style={{ position: "absolute", left: -sc.x * ss, top: -sc.y * ss, width: c.source.w * ss, height: c.source.h * ss, maxWidth: "none" }} />
          {bl ? <Gfx><Img src={staticFile(bl.src)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: Math.min(1, env(f, fps, bl.at, bl.dur) * 3), transform: `scale(${1 + 0.12 * clamp01((f / fps - bl.at) / bl.dur)})` }} /></Gfx> : null}
          {hl ? (
            <div style={{ position: "absolute", left: `${hl.box.x * 100}%`, top: `${hl.box.y * 100}%`, width: `${hl.box.w * 100}%`, height: `${hl.box.h * 100}%`, border: `6px solid ${accent}`, borderRadius: 14, boxShadow: `0 0 0 ${4 + 6 * Math.abs(Math.sin(f / 7))}px ${accent}55`, opacity: env(f, fps, hl.at, hl.dur) }} />
          ) : null}
        </div>
        {fact ? (
          <div style={{ position: "absolute", top: 18, right: 18, minWidth: 220, padding: "10px 22px", borderRadius: 18, background: "#f6ecd3", borderRight: `12px solid ${accent}`, boxShadow: "0 8px 22px rgba(20,12,4,.45)", opacity: env(f, fps, fact.at, fact.dur), transform: `translateY(${(1 - env(f, fps, fact.at, fact.dur)) * -24}px)` }}>
            <div style={{ fontFamily: almarai, fontWeight: 700, fontSize: 26, color: "#7a4b2a" }}>{fact.label}</div>
            <div style={{ fontFamily: kufi, fontSize: 48, color: "#3a2414", lineHeight: 1.1 }}>{fact.value}</div>
          </div>
        ) : null}
        {/* everything below belongs to the SOURCE speaker: inside his card, appearing at the word's start */}
        <Gfx>
        {ph ? (
          <div style={{ position: "absolute", top: 16, left: 16, width: 190, opacity: Math.min(1, phP * 1.6) * env(f, fps, ph.at, ph.dur), transform: `scale(${0.6 + 0.4 * phP}) rotate(${(1 - phP) * -8}deg)` }}>
            <Img src={staticFile(ph.src)} style={{ width: 190, height: 250, objectFit: "cover", objectPosition: "50% 15%", borderRadius: 16, border: "5px solid #f3e3c0", boxShadow: "0 8px 22px rgba(20,12,4,.55)" }} />
            <div style={{ textAlign: "center", marginTop: -6, padding: "4px 0", borderRadius: 10, background: "#f6ecd3", fontFamily: kufi, fontSize: 26, color: "#3a2414" }}>{ph.label}</div>
          </div>
        ) : null}
        {kw ? (
          <div style={{ position: "absolute", left: 0, right: 0, ...(kw.pos === "top" ? { top: 14 } : { bottom: 14 }), textAlign: "center", opacity: Math.min(1, kwP * 1.5) * kwOut, transform: `scale(${0.6 + 0.4 * kwP}) rotate(${(1 - kwP) * -4}deg)` }}>
            <span style={{ fontFamily: kufi, whiteSpace: "nowrap", fontSize: kw.text.length > 14 ? Math.round(bigText * 0.55) : kw.text.length > 8 ? Math.round(bigText * 0.72) : bigText, color: kw.tone === "bad" ? "#ffd9cf" : "#fff4d6", WebkitTextStroke: `14px ${kw.tone === "bad" ? "#7a1f12" : "#4a2f1d"}`, paintOrder: "stroke fill", textShadow: "0 10px 0 rgba(0,0,0,.3)" }}>{kw.tone === "bad" ? "✗ " : kw.tone === "good" ? "✓ " : ""}{kw.text}</span>
          </div>
        ) : null}
        {cap ? (
          <div style={{ position: "absolute", left: 16, right: 16, ...(cap.pos === "top" ? { top: 16 } : { bottom: 16 }), display: "flex", justifyContent: "center", opacity: Math.min(1, capP * 1.6) * capOut, transform: `translateY(${(cap.pos === "top" ? -1 : 1) * (1 - capP) * 30}px)` }}>
            <div style={{ padding: "10px 30px", borderRadius: 22, background: "rgba(246,236,211,.96)", borderRight: `14px solid ${accent}`, boxShadow: "0 10px 26px rgba(20,12,4,.5)", fontFamily: cap.quran ? quranFont : kufi, fontSize: cap.quran ? (cap.text.length > 40 ? 40 : 48) : cap.text.length > 30 ? 42 : 52, lineHeight: cap.quran ? 1.6 : 1.25, color: "#3a2414", textAlign: "center" }}>{cap.text}</div>
          </div>
        ) : null}
        </Gfx>
      </div>

      {(c.under ?? []).map((u, i) => (
        <Sequence key={i} from={Math.round(u.at * fps)} durationInFrames={Math.round(u.dur * fps)}>
          <UnderBand it={u} fps={fps} top={Math.max(RR.y + RR.h, SR.y + SR.h) + 34} height={1880 - (Math.max(RR.y + RR.h, SR.y + SR.h) + 34)} accent={accent} />
        </Sequence>
      ))}
      <Gfx><TitleBar title={c.title} theme={c.barTheme} offsetSec={c.timerOffset ?? 0} hideNotice /></Gfx>

      {/* cover: first 3 frames (0.10 s) = a nice still of the Sheikh + the TOPIC title + the people mentioned (never the title of his own earlier video) */}
      {c.coverKit ? (
        <Sequence  durationInFrames={3} style={{ zIndex: 20 }}>
          <KitCover orient={orient} ck={c.coverKit} />
        </Sequence>
      ) : c.cover ? (
        <Sequence  durationInFrames={3} style={{ zIndex: 20 }}>
          <AbsoluteFill style={{ background: bgA }}>
            <Img src={staticFile(c.cover)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 20%" }} />
            <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(36,26,14,.85) 100%)" }} />
            {(c.coverPeople ?? []).map((p, i) => (
              <div key={i} style={{ position: "absolute", right: 30 + i * (orient === "portrait" ? 275 : 330), top: orient === "portrait" ? 1110 : 80, width: orient === "portrait" ? 255 : 300 }}>
                <Img src={staticFile(p.src)} style={{ width: "100%", height: orient === "portrait" ? 270 : 380, objectFit: "cover", objectPosition: "50% 20%", borderRadius: 24, border: "8px solid #f3e3c0", boxShadow: "0 14px 34px rgba(20,12,4,.6)" }} />
                <div style={{ textAlign: "center", marginTop: -10, padding: "6px 0", borderRadius: 14, background: "#c93f2f", fontFamily: kufi, fontSize: 30, color: "#fff4d6" }}>{p.label}</div>
              </div>
            ))}
            <div style={{ position: "absolute", left: 40, right: 40, bottom: orient === "portrait" ? 190 : 90, textAlign: "center", fontFamily: kufi, fontSize: (orient === "portrait" ? 130 : 110) * (c.title.length > 22 ? 0.82 : 1), lineHeight: 1.15, color: "#fff4d6", WebkitTextStroke: "16px #4a2f1d", paintOrder: "stroke fill" }}>{c.title}</div>
          </AbsoluteFill>
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};

export const SilentReaction: React.FC<SilentProps> = ({ orient, config: c }) => {
  if (!c) return null;
  const fps = c.fps;
  if (c.segments) {
    let at = 0;
    const blocks = c.segments.map((sg, i) => {
      const from = Math.round(at * fps), dur = Math.round(sg.durationSec * fps), offset = at;
      at += sg.durationSec;
      if (sg.kind === "voice") {
        return <Sequence key={i} from={from} durationInFrames={dur}><VoiceOutro c={{ ...c, voiceover: sg.voice, timerOffset: offset }} orient={orient} /></Sequence>;
      }
      const d: SilentConfigVO = { ...c, durationSec: sg.durationSec, source: { ...c.source, ...sg.source }, reaction: { ...c.reaction, ...sg.reaction }, captions: sg.captions ?? [], keywords: sg.keywords ?? [], photos: sg.photos ?? [], facts: sg.facts ?? [], highlights: sg.highlights ?? [], punches: sg.punches ?? [], ambient: sg.ambient ?? c.ambient, audioSrc: sg.audio, cover: undefined, coverKit: undefined, voiceover: undefined, segments: undefined, timerOffset: offset };
      return <Sequence key={i} from={from} durationInFrames={dur}><SilentMain orient={orient} c={d} /></Sequence>;
    });
    return (
      <AbsoluteFill>
        {blocks}
        {c.coverKit ? <Sequence  durationInFrames={3} style={{ zIndex: 20 }}><KitCover orient={orient} ck={c.coverKit} /></Sequence> : null}
      </AbsoluteFill>
    );
  }
  const mainFrames = Math.round(c.durationSec * c.fps);
  return (
    <AbsoluteFill>
      <Sequence  durationInFrames={mainFrames}>
        <SilentMain orient={orient} c={c} />
      </Sequence>
      {c.voiceover ? (
        <Sequence from={mainFrames} durationInFrames={Math.round(c.voiceover.durationSec * c.fps)}>
          <VoiceOutro c={c} orient={orient} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
