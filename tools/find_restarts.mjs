// Find restarts (the speaker says a phrase wrongly, says "أعيد/عفواً", then repeats it).
// Standing rule (PREFERENCES.md): the FIRST take is the error -> cut it (and the cue word); keep the LAST take.
//   node tools/find_restarts.mjs <words.json> [--window 20]
// words.json = [{s,e,w}] word-level transcript (faster-whisper word_timestamps) of the SOURCE audio.
// Reports (a) cue words, (b) phrases repeated within <window> seconds (2-3+ word n-grams). Whisper often "fixes" stumbles and omits the cue,
// so repeats are the main signal; timestamps near long silences can drift — snap cuts to speech with tools/vad_segments.py and VERIFY by transcribing the cut.
import fs from "fs";
const [file, ...rest] = process.argv.slice(2);
const W = parseFloat(rest[rest.indexOf("--window") + 1] ?? "20");
const w = JSON.parse(fs.readFileSync(file, "utf8"));
const t = w.map((x) => x.w.replace(/[^\u0600-\u06FF]/g, ""));
const CUES = /(عفو|أفو|افو|اعيد|أعيد|اعد|أعد|عذر|معذر|آسف|اسف|لحظة|غلط|خطأ)/;
const cues = w.filter((x, i) => CUES.test(t[i])).map((x) => `${x.w}@${x.s}`);
console.log("cue words:", cues.join(" ") || "none (Whisper usually drops them)");
const seen = new Set();
for (const n of [4, 3, 2]) for (let i = 0; i + n <= t.length; i++) for (let j = i + n; j + n <= t.length && w[j].s - w[i].e < W; j++) {
  let ok = true; for (let k = 0; k < n; k++) if (t[i + k] !== t[j + k] || t[i + k].length < 2) ok = false;
  if (!ok) continue; const key = Math.round(w[i].s) + "/" + Math.round(w[j].s); if (seen.has(key)) continue; seen.add(key);
  console.log(`repeat (${n} words) "${t.slice(i, i + n).join(" ")}": first take @${w[i].s.toFixed(1)}  ->  repeat @${w[j].s.toFixed(1)}   => cut the first take [${w[i].s.toFixed(1)}-${w[j].s.toFixed(1)}] (extend back to the clause start)`);
}
