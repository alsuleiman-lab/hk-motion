// Fill the portrait/reel caption of a montage spec from the corrected words of its cut video (user 2026-11-15: a caption for every portrait video and reel).
//   node tools/captions_fill.mjs data/specs/<p>.json [--words .tmp/<p>/cut_words.json] [--y 1380] [--size 84]
// Writes spec.captions.words = [[word, start, end], …] (2 decimals), keeping any y/x/w/size/skip already there. Run it after the transcript is corrected
// (the caption shows exactly these words, so a wrong word in cut_words is a wrong word on screen): corrections go into cut_words first.
// A reel whose spec starts later than the cut (spec "from"/offset) is not supported here: give its own words file with --words.
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const specF = argv.find((a) => a.endsWith(".json") && a.includes("specs"));
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
if (!specF) { console.error("usage: node tools/captions_fill.mjs data/specs/<p>.json [--words file] [--y 1380] [--size 84]"); process.exit(2); }
const spec = JSON.parse(fs.readFileSync(specF, "utf8"));
const wf = opt("words", path.join(".tmp", spec.id, "cut_words.json"));
if (!fs.existsSync(wf)) { console.error(`✘ no words file: ${wf}`); process.exit(1); }
const raw = JSON.parse(fs.readFileSync(wf, "utf8"));
const r2 = (x) => Math.round(x * 100) / 100;
const words = raw.map((w) => [String(w.w ?? w.word ?? w.text ?? "").trim(), r2(w.s ?? w.start), r2(w.e ?? w.end ?? (w.s ?? w.start) + 0.3)]).filter((w) => w[0]);
const prev = spec.captions ?? {};
spec.captions = { ...prev, words, ...(opt("y") ? { y: +opt("y") } : {}), ...(opt("size") ? { size: +opt("size") } : {}) };
fs.writeFileSync(specF, JSON.stringify(spec, null, 1) + "\n");
console.log(`✔ captions: ${words.length} words (${r2(words[0]?.[1] ?? 0)}–${r2(words[words.length - 1]?.[2] ?? 0)} s) → ${specF}`);
