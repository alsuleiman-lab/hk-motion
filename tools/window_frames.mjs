/* Frames of the isolation windows for the FAST hybrid render (2026-11-12, user: «5 إطارات للثانية قليل جداً»).
   In a `behind` window his cut-out is drawn in Chrome from his recording + the window's matte. As seeking <video> elements that ran at ~2.5 fps
   (Chrome seeks two videos every frame, more browsers do not help); as JPEG frames (MaskedVideo with inputProps.frames) it runs at full speed.
   Only the frames the windows need are extracted (GPU decode, -threads 4, low priority):
     node tools/window_frames.mjs <p>          → public/fr/<cut>/f_<frame>.jpg for each window span + public/fr/<matte>/f_<n>.jpg; prints the --fr list
     node tools/window_frames.mjs <p> clean    → deletes those folders (run after the render; they are big)
   render_job.sh calls both around hybrid_any. */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";

const [p, mode] = process.argv.slice(2);
process.chdir(path.resolve(import.meta.dirname, ".."));
const spec = JSON.parse(fs.readFileSync(`data/specs/${p}.json`, "utf8"));
const base = (f) => path.basename(f).replace(/\.[^.]+$/, "");
/* (2026-11-12) windows with nothing Chrome draws under him are cut out on the GPU (MontageSpec gpuWindow) and need no frames — same test here */
const UNDER_HIM = new Set(["pmap", "full", "treefx", "mini", "hclip"]);
const gpuWindow = (w) => !spec.items.some((x) => UNDER_HIM.has(x.t) && (x.from ?? 0) < w.to && (x.to ?? 0) > w.from);
const wins = (spec.behind ?? []).filter((w) => (w.matte ?? spec.matte) && spec.cut && !gpuWindow(w));
const cutDir = spec.cut ? base(spec.cut) : null;
const mattes = [...new Set(wins.map((w) => (w.matte ?? spec.matte).src))];
const dirs = [...(wins.length ? [cutDir] : []), ...mattes.map(base)];
if (mode === "clean") { for (const d of dirs) fs.rmSync(path.join("public/fr", d), { recursive: true, force: true }); console.log(`window_frames: حُذفت ${dirs.length} مجلدات إطارات`); process.exit(0); }
if (!wins.length) { console.log(""); process.exit(0); }
try { os.setPriority(os.constants.priority.PRIORITY_BELOW_NORMAL); } catch {}
const ff = (args) => { const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-threads", "4", ...args], { stdio: ["ignore", "ignore", "pipe"], encoding: "utf8" }); if (r.status !== 0) { console.error(r.stderr); process.exit(1); } };
/* the cut: each window span (merged; land and port windows share spans), named by the cut's own frame number */
const spans = [...new Set(wins.map((w) => `${Math.round(w.from * 30)}:${Math.round(w.to * 30) + 2}`))].map((s) => s.split(":").map(Number)).sort((a, b) => a[0] - b[0]);
const out = path.join("public/fr", cutDir); fs.mkdirSync(out, { recursive: true });
for (const [a, b] of spans) {
  if (fs.existsSync(path.join(out, `f_${String(b - 1).padStart(6, "0")}.jpg`)) && fs.existsSync(path.join(out, `f_${String(a).padStart(6, "0")}.jpg`))) continue;
  ff(["-hwaccel", "cuda", "-ss", (a / 30).toFixed(4), "-i", path.join("public", spec.cut), "-an", "-frames:v", String(b - a), "-q:v", "3", "-start_number", String(a), path.join(out, "f_%06d.jpg")]);
}
/* each matte file whole (they are window-length), from frame 0 */
for (const m of mattes) {
  const md = path.join("public/fr", base(m)); if (fs.existsSync(path.join(md, "f_000000.jpg"))) continue;
  fs.mkdirSync(md, { recursive: true });
  ff(["-i", path.join("public", m), "-an", "-q:v", "3", "-start_number", "0", path.join(md, "f_%06d.jpg")]);
}
console.log(dirs.join(","));
