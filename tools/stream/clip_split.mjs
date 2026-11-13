// Cut one stream/lesson clip out of the whole recording: several source ranges joined in the order given, each range input-seeked (-ss/-t per input: fast and frame-exact when re-encoding), re-encoded at a constant 30 fps
// (never -c copy: copy cuts land on keyframes and the joins drift), a 15 ms audio fade at every join so no click.
//   node tools/stream/clip_split.mjs <source.mp4> <out.mp4> a-b[,c-d…]
// Each range should start ~0.15 s before the first word and end ~0.3 s after the last full word (word times from .tmp/<p>/words_vad.json);
// listen to the last word of every range afterwards (tool todo: a last-word-complete check).
import { spawnSync } from "node:child_process";
const [src, out, spec] = process.argv.slice(2);
if (!src || !out || !spec) { console.error("usage: node tools/stream/clip_split.mjs <source.mp4> <out.mp4> a-b[,c-d…]"); process.exit(2); }
const R = spec.split(",").map((r) => r.split("-").map(Number));
if (R.some(([a, b]) => !(b > a))) { console.error("✘ bad range in " + spec); process.exit(2); }
const F = 0.015, parts = [];
let fc = "";
R.forEach(([a, b], i) => {
  const d = (b - a).toFixed(3);
  fc += `[${i}:v]setpts=PTS-STARTPTS,fps=30[v${i}];`;
  fc += `[${i}:a]asetpts=PTS-STARTPTS,afade=t=in:d=${F},afade=t=out:st=${(b - a - F).toFixed(3)}:d=${F}[a${i}];`;
  parts.push(`[v${i}][a${i}]`);
  void d;
});
fc += `${parts.join("")}concat=n=${R.length}:v=1:a=1[v][a]`;
const args = ["-y", "-hide_banner", "-loglevel", "error", "-threads", "4", ...R.flatMap(([a, b]) => ["-ss", String(a), "-t", (b - a).toFixed(3), "-i", src]), "-filter_complex", fc, "-map", "[v]", "-map", "[a]",
  "-c:v", "h264_nvenc", "-preset", "p7", "-rc", "vbr", "-cq", "19", "-b:v", "0", "-r", "30", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", out];
const r = spawnSync("ffmpeg", args, { stdio: "inherit", windowsHide: true });
if (r.status !== 0) process.exit(r.status ?? 1);
const tot = R.reduce((s, [a, b]) => s + b - a, 0);
console.log(`✔ clip_split: ${R.length} range(s), ${tot.toFixed(1)} s → ${out}`);
