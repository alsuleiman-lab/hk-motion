// WHERE writing_place PUTS A PHRASE — one source for writing_place.mjs (the gate and generator) and montage_build.mjs (the builder that plans the writing).
// (rehearsal 2026-11-21, ledger builder-writing-minute-drift) the builder counted «one scraps a minute» on the cut words, writing_place on the final-audio
// transcript (drift_fresh.json) with the later of the two readings: a phrase the builder put at 2:00.1 was 1:59.8 for writing_place, two scraps fell in one
// minute, writing_place refused the whole list, and the build was written with NO writing (three gaps of 8–12 s). Both now read the phrase time here.
import fs from "node:fs";
import path from "node:path";

export const wpNorm = (s) => String(s).replace(/[ً-ْٰـ]/g, "").replace(/[إأآٱا]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[^\p{L}\p{N}]/gu, "");

/** the two readings of the project (.tmp/<p>/drift_fresh.json = the final-audio transcript, cut_words.json = the merged large-model words of the cut) */
export function wpReadings(T, fixMap = {}) {
  const fresh = JSON.parse(fs.readFileSync(path.join(T, "drift_fresh.json"), "utf8"));
  const FIX = Object.fromEntries(Object.entries(fixMap ?? {}).map(([k, v]) => [wpNorm(k), wpNorm(v)]));
  const N = fresh.map((w) => { const n = wpNorm(w.w); return FIX[n] ?? n; });
  const cwRaw = fs.existsSync(path.join(T, "cut_words.json")) ? JSON.parse(fs.readFileSync(path.join(T, "cut_words.json"), "utf8")) : [];
  const CW = (cwRaw.words ?? cwRaw).map((w) => ({ s: +(w.s ?? w.start), n: wpNorm(w.w ?? w.word) }));
  /* (2026-11-13) the fresh pass can hallucinate a stretch (a repeated loop over a clip) or spell a word otherwise; the merged large-model words of the cut are a second accurate reading: a phrase is accepted when it is consecutive words in EITHER */
  const CWl = CW.map((w) => ({ s: w.s, w: w.n })), CWn = CW.map((w) => FIX[w.n] ?? w.n);
  return { fresh, N, CW, CWl, CWn, FIX };
}

/** a phrase {text, from} → its word times as writing_place uses them ({times, at, lastEnd, q}), or null when it is not his consecutive words */
export function wpPlace(R, it) {
  const { fresh, N, CW, CWl, CWn } = R;
  const q = String(it.text).split(/\s+/).map(wpNorm).filter(Boolean);
  let hit = -1, L = fresh, NN = N;
  for (let i = 0; i < NN.length; i++) { if (L[i].s < (it.from ?? 0) - 15) continue; /* later cut blocks move the words earlier */ if (q.every((x, j) => NN[i + j] === x)) { hit = i; break; } }
  if (hit < 0) { L = CWl; NN = CWn; for (let i = 0; i < NN.length; i++) { if (L[i].s < (it.from ?? 0) - 15) continue; if (q.every((x, j) => NN[i + j] === x)) { hit = i; break; } } }
  if (hit < 0) return null;
  /* two transcripts disagree on word starts by up to 0.7 s: a word shows at the LATER of the two, so writing is never ahead of his voice */
  const times = q.map((x, j) => { const s0 = L[hit + j].s, c = CW.find((w) => Math.abs(w.s - s0) < 0.8 && (w.n === x || w.n.endsWith(x))); return +Math.max(s0, c?.s ?? 0).toFixed(2); }), lastEnd = L[hit + q.length]?.s ?? times[times.length - 1] + 0.6;
  return { q, times, at: times[0], lastEnd };
}

/** writing_place's per-minute key of a placed phrase (one torn and one scraps a minute) */
export const wpMinuteKey = (t, at) => `${t}@${Math.floor(at / 60)}`;
