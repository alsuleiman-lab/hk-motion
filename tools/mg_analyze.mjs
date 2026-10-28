// Frame-by-frame analysis of a reference video's motion graphics (used to build the `motion-graphics` skill).
//   node tools/mg_analyze.mjs sheets <video> <outDir> [fps=4]        → crop auto-detected (black bars removed), contact sheets 4x5 of that fps (tile n of sheet k = time (k*20+n)/fps)
//   node tools/mg_analyze.mjs seq <video> <outDir> <t0> [dur=0.7]    → 16 consecutive frames (native fps) starting at t0, 4x4 sheet: for studying ONE transition
//   node tools/mg_analyze.mjs cuts <video>                           → scene-change times (ffmpeg scene filter)
// Then LOOK at every sheet (Read the png) and write down: what appears, when (s), how it enters/leaves (slide/fade/pop/draw), easing and duration.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const [cmd, video, out, a, b] = process.argv.slice(2);
const run = (args) => spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { encoding: "utf8" });
const dur = parseFloat(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video], { encoding: "utf8" }).stdout);
const cropOf = () => {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-ss", String(Math.max(0, dur / 3)), "-t", "3", "-i", video, "-vf", "cropdetect=24:2:0", "-an", "-f", "null", "-"], { encoding: "utf8" });
  const m = [...String(r.stderr).matchAll(/crop=(\d+:\d+:\d+:\d+)/g)].pop();
  return m ? `crop=${m[1]}` : "null";
};

if (cmd === "cuts") {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-i", video, "-vf", "select='gt(scene,0.2)',showinfo", "-an", "-f", "null", "-"], { encoding: "utf8" });
  console.log([...String(r.stderr).matchAll(/pts_time:([\d.]+)/g)].map((m) => m[1]).join(" "));
} else if (cmd === "sheets") {
  const fps = Number(a ?? 4), crop = cropOf();
  fs.mkdirSync(path.join(out, "f"), { recursive: true });
  run(["-i", video, "-vf", `${crop},fps=${fps},scale=360:-2`, path.join(out, "f", "f_%03d.png")]);
  const n = fs.readdirSync(path.join(out, "f")).length;
  for (let k = 0; k * 20 < n; k++) run(["-start_number", String(k * 20 + 1), "-i", path.join(out, "f", "f_%03d.png"), "-frames:v", "20", "-filter_complex", "tile=4x5", path.join(out, `sheet${k}.png`)]);
  console.log(`${crop} | ${n} frames @ ${fps}fps → ${Math.ceil(n / 20)} sheets in ${out}`);
} else if (cmd === "seq") {
  const t0 = Number(a), d = Number(b ?? 0.7), crop = cropOf();
  fs.mkdirSync(out, { recursive: true });
  run(["-ss", String(t0), "-t", String(d), "-i", video, "-vf", `${crop},scale=360:-2`, "-frames:v", "16", path.join(out, "q_%02d.png")]);
  run(["-i", path.join(out, "q_%02d.png"), "-filter_complex", "tile=4x4", path.join(out, `seq_${t0}.png`)]);
  console.log(`seq_${t0}.png in ${out}`);
} else console.log("usage: sheets | seq | cuts (see header)");
