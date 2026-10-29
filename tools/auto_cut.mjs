// Cut silences (> 0.4 s -> ~0.25 s) and explicit mistakes out of a video, producing a Remotion-ready proxy + a time map.
//   node tools/auto_cut.mjs <input.mp4> <name> [--cut 87.95-91.85 --cut ...] [--keep 0.25] [--thr -35] [--min 0.4] [--vad public/x_vad.json]
// Outputs: public/<name>_cut.mp4 (1080p/30fps, short GOP, AAC audio) and public/<name>_map.json
//   { segments:[{a,b,n}], duration, silences, cuts }   (a,b = source seconds; n = start on the cut timeline)
// Standing rule (PREFERENCES.md): silences longer than 0.4 s are shortened to ~0.25 s; then ALL element timings are re-derived from the cut timeline.
import { execFileSync, spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const [input, name, ...rest] = process.argv.slice(2);
const flags = (n) => rest.flatMap((x, i) => (x === "--" + n ? [rest[i + 1]] : []));
const KEEP = parseFloat(flags("keep")[0] ?? "0.25");
const THR = flags("thr")[0] ?? "-35";
const MIN = parseFloat(flags("min")[0] ?? "0.4");
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");

const probe = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", input], { encoding: "utf8" });
const total = parseFloat(probe.stdout);
const log = spawnSync("ffmpeg", ["-hide_banner", "-i", input, "-af", `silencedetect=noise=${THR}dB:d=${MIN}`, "-vn", "-f", "null", "-"], { encoding: "utf8", maxBuffer: 1e8 }).stderr;
const sil = [];
for (const m of log.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_duration: ([\d.]+)/g)) sil.push([parseFloat(m[1]), parseFloat(m[2])]);

// optional: use Silero-VAD gaps (tools/vad_segments.py) instead of level-based silence detection (clicks/breaths/soft word ends fool silencedetect)
const vadFile = flags("vad")[0];
if (vadFile) { sil.length = 0; for (const g of JSON.parse(fs.readFileSync(vadFile, "utf8")).gaps) sil.push(g); }
// removal intervals: silence parts beyond KEEP, and explicit mistakes
const rem = [];
for (const [s, d] of sil) {
  if (d <= MIN) continue;
  if (s < 0.01) rem.push([0, Math.max(0, d - 0.12)]);               // leading silence: keep last 0.12 s
  else if (s + d >= total - 0.05) rem.push([s + KEEP, total]);      // trailing silence: keep 0.25 s
  else rem.push([s + KEEP / 2, s + d - KEEP / 2]);
}
const cuts = flags("cut").map((c) => c.split("-").map(parseFloat));
rem.push(...cuts);
rem.sort((x, y) => x[0] - y[0]);
const merged = [];
for (const r of rem) {
  const last = merged[merged.length - 1];
  if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
  else merged.push([...r]);
}
const fr = (t) => Math.round(t * 30) / 30;
const keep = [];
let cur = 0;
for (const [a, b] of merged) { if (a > cur) keep.push([fr(cur), fr(a)]); cur = b; }
if (cur < total) keep.push([fr(cur), fr(total)]);
const S = keep.filter(([a, b]) => b - a > 0.05);
let n = 0;
const segments = S.map(([a, b]) => { const r = { a, b, n: +n.toFixed(3) }; n += b - a; return r; });
fs.writeFileSync(path.join(root, "public", `${name}_map.json`), JSON.stringify({ segments, duration: +n.toFixed(3), silences: sil, cuts }, null, 1));
console.log(`silences>0.4s: ${sil.filter((x) => x[1] > 0.4).length}, explicit cuts: ${cuts.length}, segments: ${S.length}, ${total.toFixed(1)}s -> ${n.toFixed(1)}s`);

const v = S.map(([a, b], i) => `[0:v]trim=start=${a}:end=${b},setpts=PTS-STARTPTS[v${i}]`).join(";");
const au = S.map(([a, b], i) => `[0:a]atrim=start=${a}:end=${b},asetpts=PTS-STARTPTS,afade=t=in:d=0.008,afade=t=out:st=${(b - a - 0.008).toFixed(3)}:d=0.008[a${i}]`).join(";");
const cat = S.map((_, i) => `[v${i}][a${i}]`).join("") + `concat=n=${S.length}:v=1:a=1[v][a]`;
const tmp = path.join(os.tmpdir(), `${name}_filter.txt`);
fs.writeFileSync(tmp, [v, au, cat].join(";\n"));
// GPU by default (user rule: work on the NVIDIA card): NVDEC decode + NVENC encode. --cpu falls back to libx264.
const CPU = rest.includes("--cpu");
const enc = CPU ? ["-c:v", "libx264", "-preset", "veryfast", "-crf", "15", "-g", "15", "-pix_fmt", "yuv420p"] : ["-c:v", "h264_nvenc", "-preset", "p5", "-rc", "vbr", "-cq", "15", "-b:v", "0", "-g", "15", "-bf", "0", "-pix_fmt", "yuv420p"];
execFileSync("ffmpeg", ["-hide_banner", "-v", "error", "-y", "-threads", "4", ...(CPU ? [] : ["-hwaccel", "cuda"]), "-i", input, "-/filter_complex", tmp, "-map", "[v]", "-map", "[a]", "-r", "30", ...enc, "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", path.join(root, "public", `${name}_cut.mp4`)], { stdio: "inherit" });
console.log("done:", `public/${name}_cut.mp4`);
