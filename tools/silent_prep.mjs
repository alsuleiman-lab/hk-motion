// Prepare a «التعليق الصامت» project: node tools/silent_prep.mjs <name> "<reaction.mp4>" "<source.mp4>" [--title "..."]
// Copies both videos to public/silent/<name>/, detects black borders of the source (cropdetect), makes light Studio proxies
// (540p, keyframe every 15 frames) and writes a starter config.json (see .claude/skills/silent-reaction/). Work on S: only (run `source tools/env.sh` first).
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const [name, reactionIn, sourceIn, ...rest] = process.argv.slice(2);
if (!name || !reactionIn || !sourceIn) { console.error('usage: node tools/silent_prep.mjs <name> "<reaction.mp4>" "<source.mp4>" [--title "..."]'); process.exit(1); }
const ti = rest.indexOf("--title");
const title = ti >= 0 ? rest[ti + 1] : name;
const dir = path.resolve("public", "silent", name);
fs.mkdirSync(dir, { recursive: true });

const run = (bin, args) => execFileSync(bin, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 1 << 28 });
const probe = (file) => {
  const j = JSON.parse(run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate:format=duration", "-of", "json", file]));
  const s = j.streams[0];
  return { w: s.width, h: s.height, dur: Number(j.format.duration), fps: s.r_frame_rate };
};

const reactionDst = path.join(dir, "reaction.mp4"), sourceDst = path.join(dir, "source.mp4");
fs.copyFileSync(reactionIn, reactionDst);
fs.copyFileSync(sourceIn, sourceDst);
const R = probe(reactionDst), S = probe(sourceDst);

// black borders of the source (a recorded screen / app always has them): sample 8 s from the middle; ffmpeg prints cropdetect on stderr
let crop = { x: 0, y: 0, w: S.w, h: S.h };
const cd = spawnSync("ffmpeg", ["-hide_banner", "-ss", String(Math.max(0, S.dur / 2 - 4)), "-t", "8", "-i", sourceDst, "-vf", "cropdetect=24:2:0", "-an", "-f", "null", "-"], { encoding: "utf8", maxBuffer: 1 << 28 });
const m = [...String(cd.stderr ?? "").matchAll(/crop=(\d+):(\d+):(\d+):(\d+)/g)].pop();
if (m) crop = { w: +m[1], h: +m[2], x: +m[3], y: +m[4] };

const proxy = (src, dst) => run("ffmpeg", ["-y", "-hide_banner", "-i", src, "-vf", "scale=-2:540", "-c:v", "libx264", "-preset", "veryfast", "-crf", "26", "-g", "15", "-keyint_min", "15", "-c:a", "aac", "-b:a", "96k", dst]);
proxy(reactionDst, path.join(dir, "reaction_proxy.mp4"));
proxy(sourceDst, path.join(dir, "source_proxy.mp4"));

const fps = 30;
const hw = Math.round(R.w / 2);
const cfg = {
  name, title, fps, durationSec: Math.round(Math.min(R.dur, S.dur) * 10) / 10,
  reaction: {
    src: `silent/${name}/reaction.mp4`, proxy: `silent/${name}/reaction_proxy.mp4`, w: R.w, h: R.h, offset: 0,
    // starter crops around the centre of his frame: adjust x so the head sits at ~54% of the card height with headroom
    crop: { portrait: { x: Math.max(0, hw - Math.round(R.h * 0.65)), y: 0, w: Math.round(R.h * 1.3), h: R.h }, landscape: { x: Math.max(0, hw - Math.round(R.h * 0.3)), y: 0, w: Math.round(R.h * 0.6), h: R.h } },
  },
  source: { src: `silent/${name}/source.mp4`, proxy: `silent/${name}/source_proxy.mp4`, w: S.w, h: S.h, crop, startSec: 0 },
  cover: `silent/${name}/cover.jpg`,
  theme: { bgA: "#24456e", bgB: "#6b4630", accent: "#e8ae2c" },
  captions: [], keywords: [], facts: [], highlights: [], punches: [], reactionZoom: [],
};
fs.writeFileSync(path.join(dir, "config.json"), JSON.stringify(cfg, null, 2));
console.log(`reaction ${R.w}x${R.h} ${R.dur.toFixed(1)}s | source ${S.w}x${S.h} ${S.dur.toFixed(1)}s | source crop ${JSON.stringify(crop)}`);
console.log(`config: ${path.join(dir, "config.json")}  (set the real cover.jpg, crops, offset, then the captions)`);
