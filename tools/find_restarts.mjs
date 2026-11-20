// Find restarts (the speaker says a phrase wrongly, says «عفواً» / «عفواً سأعيد», then repeats it).
// Standing rule (skill montage-orders, القواعد_العامة.md): the FIRST take is the error -> cut it (and the marker); keep the LAST take.
//   node tools/find_restarts.mjs <words.json> [--window 20]
// words.json = [{s,e,w}] word-level transcript (faster-whisper word_timestamps) of the SOURCE audio.
// (user 2026-11-18, rules review t11/t12) a restart needs a MARKER: «عفواً» (Whisper also writes «أفوان/أفون/فوان»), «عفواً سأعيد», or «مونتاج».
// «أعيد» or «معليش» alone is not a marker; «أفوان» before a noun («أفوان الكل» = «أفواه الكل») or after «كمّم» is not one; «أفغان» never.
// A repetition alone is NOT a restart (rhetorical repetition): repeats are suggested ONLY when a marker lies between the first take and the repeat.
// Timestamps near long silences can drift — snap cuts to speech with tools/vad_segments.py and VERIFY by transcribing the cut.
import fs from "fs";
const [file, ...rest] = process.argv.slice(2);
const W = parseFloat(rest[rest.indexOf("--window") + 1] ?? "20");
const w = JSON.parse(fs.readFileSync(file, "utf8"));
const t = w.map((x) => x.w.replace(/[^؀-ۿ]/g, "").replace(/[ً-ْ]/g, ""));
const MARK = /^(عفو|عفوا|عفوني|أفوان|أفون|فوان|فون|مونتاج|موتاج|منتاج)$/, AFWAN = /^(أفوان|أفون|فوان|فون)$/, NOT_MARK = /^[اأإ]?فغان/;
const isMark = (i) => {
  if (!MARK.test(t[i]) || NOT_MARK.test(t[i])) return false;
  if (AFWAN.test(t[i])) {
    if (w[i + 1] && w[i + 1].s - w[i].s < 1.5 && /^(ال|لل)/.test(t[i + 1]) && t[i + 1].length >= 4) return false;   // a noun follows: «أفواه الكل»
    if (t.slice(Math.max(0, i - 2), i).some((x) => /^(كمم|تكميم|يكمم|وكمم)/.test(x))) return false;   // «كمّم الأفواه»
  }
  return true;
};
const marks = w.map((_, i) => i).filter(isMark);
console.log("markers:", marks.map((i) => `${w[i].w}@${w[i].s}`).join(" ") || "none");
const seen = new Set(); let ignored = 0;
for (const n of [4, 3, 2]) for (let i = 0; i + n <= t.length; i++) for (let j = i + n; j + n <= t.length && w[j].s - w[i].e < W; j++) {
  let ok = true; for (let k = 0; k < n; k++) if (t[i + k] !== t[j + k] || t[i + k].length < 2) ok = false;
  if (!ok) continue; const key = Math.round(w[i].s) + "/" + Math.round(w[j].s); if (seen.has(key)) continue; seen.add(key);
  const mk = marks.find((m) => m >= i && m < j);   // the marker must sit between the first take and the repeat
  if (mk == null) { ignored++; continue; }
  console.log(`restart (${n} words, marker «${w[mk].w}»@${w[mk].s.toFixed(1)}) "${t.slice(i, i + n).join(" ")}": first take @${w[i].s.toFixed(1)}  ->  repeat @${w[j].s.toFixed(1)}   => cut the first take [${w[i].s.toFixed(1)}-${w[j].s.toFixed(1)}] (extend back to the clause start)`);
}
if (ignored) console.log(`${ignored} repetition(s) without a marker ignored (rhetorical repetition is not a restart)`);
/* (user 2026-11-20, mufti-hiraba 7:11: «لم ترصد كلمة عفواً، هذا الأمر خطير جداً وقد تكرر كثيراً») the transcript often does NOT hear a soft «عفواً»: it leaves a
   silent hole instead. A short first take (1–4 words) that stops, a pause ≥ 1 s (the unheard marker), then the SAME first word again = a restart whose marker
   was not transcribed — printed as «restart (unheard marker)» and cut like the others («وتسمى قطعة … [عفواً] … وتسمى قطع الطريق»). */
for (let i = 0; i < t.length; i++) for (let j = i + 1; j <= Math.min(t.length - 1, i + 4); j++) {
  const gap = w[j].s - w[j - 1].e;
  if (gap < 1.0 || t[j] !== t[i] || t[i].length < 3) continue;
  const key = Math.round(w[i].s) + "/" + Math.round(w[j].s); if (seen.has(key)) continue; seen.add(key);
  console.log(`restart (unheard marker, pause ${gap.toFixed(1)} s) "${t.slice(i, j).join(" ")}": first take @${w[i].s.toFixed(1)}  ->  repeat @${w[j].s.toFixed(1)}   => cut the first take [${w[i].s.toFixed(1)}-${w[j].s.toFixed(1)}]`);
}
