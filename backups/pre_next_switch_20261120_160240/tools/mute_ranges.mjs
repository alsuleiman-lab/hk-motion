// Silence short sound fragments in the final audio WITHOUT moving the timeline (user 2026-11-13, frame 10878: a leftover onset of a removed «الله… عفواً» was audible).
//   node tools/mute_ranges.mjs <file> a-b[,a-b…] [<file2> …]      seconds of THAT file; files: .mp4 (video copied, audio re-encoded AAC 192k) or .wav
// Every range must sit inside a measured sound ≤ 120 ms long that the cut left behind (onset of a deleted word); a longer range is refused (cut it with cut_block instead).
import { spawnSync } from "node:child_process";
import fs from "node:fs";
const args = process.argv.slice(2);
const ranges = (args.find((a) => /^\d/.test(a)) ?? "").split(",").filter(Boolean).map((r) => r.split("-").map(Number));
const files = args.filter((a) => !/^\d/.test(a));
if (!ranges.length || !files.length) { console.error("usage: node tools/mute_ranges.mjs <file…> a-b[,c-d]"); process.exit(2); }
for (const [a, b] of ranges) if (!(b > a) || b - a > 0.12) { console.error(`✘ range ${a}-${b}: longer than 0.12 s — cut it, do not mute it`); process.exit(1); }
const expr = ranges.map(([a, b]) => `between(t,${a},${b})`).join("+");
const af = `volume=enable='${expr}':volume=0`;
for (const f of files) {
  const tmp = f.replace(/(\.\w+)$/, ".mute$1");
  const isWav = /\.wav$/i.test(f);
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-i", f, "-af", af, ...(isWav ? ["-c:a", "pcm_s16le"] : ["-map", "0:v", "-map", "0:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k"]), tmp], { stdio: "inherit", windowsHide: true });
  if (r.status !== 0) { console.error("✘ ffmpeg failed on " + f); process.exit(1); }
  fs.renameSync(tmp, f);
  console.log("muted", ranges.map((r) => r.join("-")).join(","), "in", f);
}
