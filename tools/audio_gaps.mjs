// Automatic audio-gap analysis of a silent-reaction timeline (user 2026-10-18: «فراغ صوتي كبير» must be found by me, not by him).
//   node tools/audio_gaps.mjs public/silent/<name>/config.json [--db -38] [--min 0.3]
// Builds the exact audio of the final video (every voice note / clip audio padded or cut to its segment length, in order) and lists every silent span >= --min seconds
// with its global time, frame number and the segment + local time it belongs to. RULE: no silent span > 0.4 s (except deliberate) — shorten voice tails, trim clip heads/tails, or
// put the sound under a graphic. Fix, re-run, and only then show the video.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const cfgPath = process.argv[2];
const arg = (n, d) => (process.argv.includes("--" + n) ? process.argv[process.argv.indexOf("--" + n) + 1] : d);
const db = arg("db", "-38"), min = Number(arg("min", "0.3"));
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
const fps = cfg.fps ?? 30;
const pub = path.resolve("public");
const inputs = [], labels = [], segInfo = [];
let at = 0, n = 0;
for (const sg of cfg.segments ?? []) {
  const file = sg.kind === "voice" ? sg.voice.src : (sg.audio ?? sg.source?.src ?? cfg.source.src);   // a clip with `audio` has its source muted
  inputs.push("-i", path.join(pub, file));
  labels.push(`[${n}:a]aresample=44100,aformat=channel_layouts=mono,apad,atrim=0:${sg.durationSec},asetpts=N/SR/TB[a${n}]`);
  segInfo.push({ kind: sg.kind, from: at, dur: sg.durationSec, file });
  at += sg.durationSec; n++;
}
const fc = labels.join(";") + ";" + segInfo.map((_, i) => `[a${i}]`).join("") + `concat=n=${n}:v=0:a=1,silencedetect=noise=${db}dB:d=${min}[o]`;
const r = spawnSync("ffmpeg", ["-hide_banner", ...inputs, "-filter_complex", fc, "-map", "[o]", "-f", "null", "-"], { encoding: "utf8", maxBuffer: 1 << 26 });
const log = String(r.stderr);
const starts = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
const ends = [...log.matchAll(/silence_end: ([\d.]+) \| silence_duration: ([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
let bad = 0;
starts.forEach((s, i) => {
  const dur = ends[i]?.[1] ?? at - s;
  const sg = segInfo.find((x) => s >= x.from - 0.001 && s < x.from + x.dur) ?? segInfo[segInfo.length - 1];
  const flag = dur > 0.4 ? "GAP" : "ok ";
  if (dur > 0.4) bad++;
  console.log(`${flag} ${s.toFixed(2)}s → ${(s + dur).toFixed(2)}s (${dur.toFixed(2)}s, frame ${Math.round(s * fps)}) in ${sg.kind} @${(s - sg.from).toFixed(2)}s of ${path.basename(sg.file)}`);
});
console.log(bad ? `\n${bad} silent span(s) > 0.4 s — fix them.` : "\nNo audio gap longer than 0.4 s.");
