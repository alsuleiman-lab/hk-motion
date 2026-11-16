import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { BRAND } from "./brand";

/**
 * PillCaptions — the caption of every portrait video and reel of his talks (user 2026-11-15: «أريد أن يكون عندنا كابشن لكل الفيديوهات الطولية والريلز»;
 * style picked on the captions page: «الحبة المتحركة», developed from the @remotion/captions moving-pill sample).
 *  - a word appears only when it is spoken (never an upcoming word); the pill of the palette accent slides by a spring under the word being said;
 *  - pages of ≤ 4 words, split at a comma/full stop or a pause > 0.6 s, balanced (5 words → 3 + 2, never a lone word when avoidable);
 *  - Almarai ExtraBold, white with a black stroke drawn under the fill (readable over any shot); the font is shrunk to fit the band, never wrapped past 2 lines;
 *  - it hides inside `skip` windows (a full-screen verse/hadith, a card the user wants alone).
 * Spec: "captions": { "words": [[word, startSec, endSec], …], "bottom"?: 1372 (or "y" = top), "x"?: 70, "w"?: 940, "size"?: 84, "skip"?: [{ from, to }] }
 * Words come from tools/captions_fill.mjs (the corrected cut_words of the video).
 */
export type CapWord = [string, number, number];
export type CaptionsSpec = { words: CapWord[]; y?: number; bottom?: number; x?: number; w?: number; size?: number; skip?: { from: number; to: number }[] };

const PILL_PAD_X = 16, PILL_PAD_Y = 10, PILL_MOVE = 5;   // frames the pill takes to slide to the next word

/** phrases end at punctuation or a pause; each phrase is cut into balanced pages of at most 4 words */
export const capPages = (words: CapWord[]): number[][] => {
  const pages: number[][] = []; let ph: number[] = [];
  const flush = () => { if (!ph.length) return; const n = Math.ceil(ph.length / 4), per = Math.ceil(ph.length / n); for (let i = 0; i < ph.length; i += per) pages.push(ph.slice(i, i + per)); ph = []; };
  words.forEach(([w, s, e], i) => { ph.push(i); const next = words[i + 1]; if (/[،,.؟?!:؛]$/.test(w) || !next || next[1] - e > 0.6) flush(); });
  flush();
  return pages;
};

/** one caption page. The pill lives UNDER the word being said (no DOM measuring, so every rendered frame is exact): when a new word starts it slides
 *  in from the side of the previous word (right, Arabic reading order) with a short spring, then sits still under the word. */
const Page: React.FC<{ words: CapWord[]; idx: number[]; t: number; fps: number; size: number; w: number }> = ({ words, idx, t, fps, size, w }) => {
  const chars = idx.reduce((n, i) => n + words[i][0].length + 1, 0), fs = Math.min(size, Math.floor((w * 2) / Math.max(1, chars * 0.62)));
  const cur = idx.reduce((n, i, j) => (words[i][1] <= t ? j : n), -1), stroke = Math.round(fs / 7);
  return (
    <div style={{ position: "relative", width: "100%", textAlign: "center", direction: "rtl", fontFamily: "Almarai", fontWeight: 800, fontSize: fs, lineHeight: 1.55, color: "#fff" }}>
      {idx.map((i, j) => {
        const on = j === cur, u = on ? spring({ frame: (t - words[i][1]) * fps, fps, config: { damping: 100 }, durationInFrames: PILL_MOVE }) : 0, first = j === 0;
        return <React.Fragment key={i}>
          <span style={{ position: "relative", display: "inline-block", whiteSpace: "pre", isolation: "isolate", visibility: words[i][1] <= t ? "visible" : "hidden" }}>
            {on ? <span style={{ position: "absolute", left: -PILL_PAD_X, right: -PILL_PAD_X, top: PILL_PAD_Y, bottom: PILL_PAD_Y, zIndex: -1, borderRadius: Math.round(fs * 0.18), background: BRAND.accent, boxShadow: "0 6px 16px rgba(0,0,0,.35)",
              transformOrigin: "100% 50%", transform: first ? `scale(${0.7 + 0.3 * u})` : `translateX(${(1 - u) * 60}%) scaleX(${0.75 + 0.25 * u})` }} /> : null}
            <span style={{ paintOrder: "stroke fill", WebkitTextStroke: `${stroke}px #000` }}>{words[i][0]}</span>
          </span>{j < idx.length - 1 ? " " : ""}
        </React.Fragment>;
      })}
    </div>
  );
};

export const PillCaptions: React.FC<{ cap: CaptionsSpec; hideAlso?: { from: number; to: number }[] }> = ({ cap, hideAlso = [] }) => {
  const frame = useCurrentFrame(), { fps } = useVideoConfig(), t = frame / fps;
  const pages = useMemo(() => capPages(cap.words), [cap.words]);
  const k = pages.findIndex((p, n) => t >= cap.words[p[0]][1] && (n === pages.length - 1 ? t <= cap.words[p[p.length - 1]][2] + 0.6 : t < cap.words[pages[n + 1][0]][1]));
  if (k < 0) return null;
  if ([...(cap.skip ?? []), ...hideAlso].some((w) => t >= w.from && t < w.to)) return null;
  /* (user 2026-11-16, marked screenshot) the caption sits in the band just ABOVE the elements' zone: its last line ends at `bottom` (1372), a second line grows upward */
  const x = cap.x ?? 70, w = cap.w ?? 940;
  return (
    <div style={{ position: "absolute", left: x, width: w, ...(cap.y != null ? { top: cap.y } : { bottom: 1920 - (cap.bottom ?? 1372) }) }}>
      <Page key={k} words={cap.words} idx={pages[k]} t={t} fps={fps} size={cap.size ?? 84} w={w} />
    </div>
  );
};
