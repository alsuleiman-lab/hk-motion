// Fajr ad #2: drop the verbatim-repeated block (54.9-75.0 of the raw voice) and shorten the 8.1-8.75 pause.
import fs from "fs"; import { execFileSync } from "child_process";
const SEG = [[0, 8.30], [8.55, 54.90], [75.0, 79.65]];
const words = JSON.parse(fs.readFileSync("public/ad2/words_raw.json", "utf8"));
let off = 0; const starts = SEG.map(([a, b]) => { const o = off; off += b - a; return o; });
const map = (t) => { for (let i = 0; i < SEG.length; i++) if (t >= SEG[i][0] - 0.1 && t <= SEG[i][1] + 0.01) return +(starts[i] + t - SEG[i][0]).toFixed(3); return null; };
const out = words.map((w) => ({ w: w.w, s: map(w.s), e: map(w.e) })).filter((w) => w.s !== null && w.e !== null);
fs.writeFileSync("public/ad2/words.json", JSON.stringify(out));
const f = SEG.map(([a, b], i) => `[0:a]atrim=${a}:${b},asetpts=PTS-STARTPTS,afade=t=in:d=0.01,afade=t=out:st=${(b - a - 0.012).toFixed(3)}:d=0.012[a${i}]`).join(";") + `;${SEG.map((_, i) => `[a${i}]`).join("")}concat=n=${SEG.length}:v=0:a=1[o]`;
execFileSync("ffmpeg", ["-hide_banner", "-v", "error", "-y", "-i", "public/ad2/voice_raw.mp3", "-filter_complex", f, "-map", "[o]", "-ar", "44100", "-b:a", "192k", "public/ad2/voice.mp3"]);
console.log("duration", off.toFixed(2), "words", out.length, "of", words.length);
