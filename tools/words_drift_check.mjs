// node tools/words_drift_check.mjs <project> [--fresh]   (user 2026-11-09: «اضمن عدم التكرار للخطأ»)
// Proves .tmp/<p>/cut_words.json matches the REAL cut audio, because every element time (at("…"), scraps_times, verses, zooms, writing_sync, verse_audit…) is derived from it and all of those
// tools trust it blindly. A stale file (made before a later re-cut) put every element after 2:48 about 2.7 s late while every other check passed.
//  1. cheap: cut_words.json older than the cut audio, or its last word ends after the audio does  → ✘
//  2. real:  a fresh Whisper pass over the cut audio, per-20 s-bin median offset of matching words; any bin whose median differs from 0 by > 0.30 s → ✘ (prints the offsets so a piecewise shift can be applied)
// The fresh pass is cached (.tmp/<p>/drift_fresh.json) until the cut audio changes; --fresh forces it.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
const p = process.argv[2];
if (!p) { console.error("usage: node tools/words_drift_check.mjs <project> [--fresh]"); process.exit(2); }
const T = path.join(".tmp", p), PY = process.env.PY ?? "S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe";
const wordsF = path.join(T, "cut_words.json"), cutWav = path.join(T, "cut.wav"), w16 = path.join(T, "cut16k.wav"), freshF = path.join(T, "drift_fresh.json");
/* (2026-11-13) the fresh pass must run on the audio of the file the video really uses (spec.cut), not on an intermediate cut.wav: a fragment muted/edited in one copy only slipped through */
let audioSrc = cutWav;
try { const sp = JSON.parse(fs.readFileSync(path.join("data", "specs", `${p}.json`), "utf8")); const cf = path.join("public", sp.cut); if (sp.cut && fs.existsSync(cf)) audioSrc = cf; } catch { /* no spec yet */ }
if (!fs.existsSync(wordsF) || !fs.existsSync(cutWav)) { console.log(`words_drift: ✘ ${!fs.existsSync(wordsF) ? "cut_words.json" : "cut.wav"} missing in ${T}`); process.exit(1); }
const m = (f) => fs.statSync(f).mtimeMs;
const words = JSON.parse(fs.readFileSync(wordsF, "utf8"));
let bad = 0;
const dur = Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", cutWav], { encoding: "utf8" }).stdout);
const lastEnd = Math.max(...words.map((w) => w.e ?? w.s));
if (lastEnd > dur + 0.5) { console.log(`words_drift: ✘ the last word ends at ${lastEnd.toFixed(1)} s but the cut audio is ${dur.toFixed(1)} s (${(lastEnd - dur).toFixed(1)} s too long → the words file is from an older cut)`); bad++; }
if (m(wordsF) < m(cutWav) - 1000) { console.log("words_drift: ⚠ cut_words.json is older than cut.wav (the cut was redone after the words were made)"); }
if (!fs.existsSync(w16) || m(w16) < m(audioSrc)) spawnSync("ffmpeg", ["-v", "error", "-y", "-threads", "4", "-i", audioSrc, "-vn", "-ar", "16000", "-ac", "1", w16], { stdio: "inherit" });
if (process.argv.includes("--fresh") || !fs.existsSync(freshF) || m(freshF) < m(w16)) {
  console.log("words_drift: fresh Whisper pass over the cut audio …");
  const r = spawnSync(PY, ["tools/words_drift.py", w16, freshF], { stdio: "inherit", env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
  if (r.status !== 0) { console.log("words_drift: ✘ the fresh pass failed"); process.exit(1); }
}
const n = (s) => String(s).replace(/[ً-ْـ]/g, "").replace(/[إأآا]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[^\p{L}\p{N}]/gu, "");
const fresh = JSON.parse(fs.readFileSync(freshF, "utf8")).map((x) => ({ s: x.s, n: n(x.w) }));
const old = words.map((x) => ({ s: x.s, n: n(x.w) }));
const bins = {};
for (const w of fresh) {
  if (w.n.length < 4) continue;
  let best = null;
  for (const o of old) if (o.n === w.n && Math.abs(o.s - w.s) < 12 && (best == null || Math.abs(o.s - w.s) < Math.abs(best - w.s))) best = o.s;
  if (best != null) (bins[Math.floor(w.s / 20) * 20] ??= []).push(best - w.s);
}
const med = (a) => { a = [...a].sort((x, y) => x - y); return a[a.length >> 1]; };
const rows = Object.entries(bins).filter(([, a]) => a.length >= 4).map(([b, a]) => [Number(b), med(a)]);
const off = rows.filter(([, d]) => Math.abs(d) > 0.3);
if (off.length) { bad++; console.log(`words_drift: ✘ cut_words.json does not match the cut audio in ${off.length} of ${rows.length} bins (offset = words file − real audio):`); console.log("  " + off.map(([b, d]) => `${b}s:${d.toFixed(2)}`).join("  ")); console.log("  → shift every word-derived time piecewise (see feedback_verify_cut_words_against_cut_audio) before building or rendering"); }
else console.log(`words_drift: ✔ cut_words.json matches the cut audio (${rows.length} bins, all within 0.30 s)`);
// leftover correction / instruction words in the FINAL audio (2026-11-11: «عفواً» survived three cuts because only the transcript was searched, never the cut audio).
// The fresh pass is the cut audio itself; words inside a replied-to clip window (spec splits) belong to the other speaker and are not his corrections.
{
  let splits = [], keep = [];
  /* spec.keepMarks [{t, w, why, userConfirmed:true}]: a word that IS part of his speech (a rhetorical «عفواً، لا لا»): honoured ONLY with the user's own confirmation (2026-11-13: I overrode this gate with a wrong measurement and a real «عفواً» fragment stayed in the video; no self-made exemption any more) */
  try { for (const f of fs.readdirSync("data/specs")) { const s = JSON.parse(fs.readFileSync(path.join("data/specs", f), "utf8")); if (s.id === p || f === `${p}.json`) { splits = s.splits ?? []; keep = s.keepMarks ?? []; } } } catch { /* no spec yet */ }
  /* (user 2026-11-18, rules review t11/t12) the markers are «عفواً» (also «عفواً سأعيد», whose «عفواً» is the hit) and «مونتاج» only; «أعيد» or «معليش» alone is
     ordinary speech. «أفوان/أفون/فوان/فون» is how Whisper hears «عفواً», but NOT when a noun follows («أفوان الكل» = «أفواه الكل») or «كمّم/كمم/تكميم» comes before it
     («كمّم الأفواه»); «أفغان» is never a marker. */
  const MARK = /^(عفو|عفوا|عفواً|عفوني|أفوان|أفون|فون|فوان|مونتاج|موتاج|منتاج)$/, AFWAN = /^(أفوان|أفون|فون|فوان)$/, NOT_MARK = /^[اأإ]?فغان/;
  const bare = (w) => String(w ?? "").replace(/[.،؟?!]/g, "").replace(/[ً-ْ]/g, "").trim();
  const raw = JSON.parse(fs.readFileSync(freshF, "utf8"));
  const isMark = (x, i) => {
    const w = bare(x.w); if (!MARK.test(w) || NOT_MARK.test(w)) return false;
    if (AFWAN.test(w)) {
      const nx = raw[i + 1], nb = nx ? bare(nx.w) : "";
      if (nx && nx.s - x.s < 1.5 && /^(ال|لل)/.test(nb) && nb.length >= 4) return false;   // «أفوان الكل» → «أفواه الكل»: a noun follows
      if (raw.slice(Math.max(0, i - 2), i).some((y) => /^(كمم|تكميم|يكمم|وكمم)/.test(bare(y.w).replace(/ّ/g, "")))) return false;   // «كمّم أفواه»
    }
    return true;
  };
  const hits = raw.filter((x, i) => isMark(x, i) && !splits.some((sp) => x.s >= sp.from && x.s <= sp.to) && !keep.some((k) => Math.abs(k.t - x.s) < 0.6 && k.why && k.userConfirmed === true));
  if (hits.length) { bad++; console.log(`words_drift: ✘ correction/instruction words still audible in the cut (${hits.length}): ` + hits.map((x) => `${x.s.toFixed(1)}s «${x.w}»`).join("، ") + " — cut them at the real silence (large-model word times), re-cut, re-run"); }
  else console.log("words_drift: ✔ no «عفواً/مونتاج» left in the cut audio");
}
process.exit(bad ? 1 : 0);
