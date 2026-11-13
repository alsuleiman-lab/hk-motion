// Proof that the grid works: 2–3 scattered frames of every minute rendered small and tiled into ONE sheet to look at (user 2026-10-29).
//   node tools/grid_sheet.mjs <CompositionId> data/specs/<p>.json [--per-min 3] [--scale 0.25]
// Each sample moves to the middle of the nearest element (±8 s) so the sheet shows the slots in use, not empty moments. → .tmp/<p>/grid_sheet_<Id>.jpg
import fs from "node:fs"; import path from "node:path"; import { spawnSync } from "node:child_process";

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const [id, specF] = argv.filter((a) => !a.startsWith("--") && !/^\d/.test(a));
if (!id || !specF) { console.error("usage: node tools/grid_sheet.mjs <CompositionId> data/specs/<p>.json [--per-min 3] [--scale 0.25]"); process.exit(2); }
const spec = JSON.parse(fs.readFileSync(specF, "utf8"));
const per = Number(opt("per-min", 3)), scale = opt("scale", "0.25"), fps = spec.fps ?? 30, dur = spec.frames / fps;
const mids = spec.items.filter((it) => it.t !== "cover" && it.t !== "credit").map((it) => { const a = it.at ?? it.from ?? it.times?.[0], b = it.until ?? it.to ?? (a != null ? a + 3 : null); return a == null ? null : (a + b) / 2; }).filter((m) => m != null);
const pts = [];
for (let m = 0; m * 60 < dur; m++) for (let k = 0; k < per; k++) {
  let t = m * 60 + ((k + 0.5) * 60) / per;
  if (t > dur - 1) continue;
  const near = mids.reduce((best, x) => (Math.abs(x - t) < Math.abs(best - t) ? x : best), Infinity);
  if (Math.abs(near - t) <= 8) t = near;
  pts.push(`s${String(pts.length).padStart(3, "0")}:${Math.round(t * fps)}`);
}
if (!pts.length) for (let k = 1; k <= 3; k++) pts.push(`s${String(pts.length).padStart(3, "0")}:${Math.round((dur * k / 4) * fps)}`);   // clips under ~10 s: no minute-sample fits, sample quarters
const T = path.join(".tmp", spec.id), out = path.join(T, "grid_sheet_" + id), sheet = path.join(T, `grid_sheet_${id}.jpg`);
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
/* (user 2026-11-13: «شغلة الإطارات بدنا ننقلها») the frames come from the GPU engine (tools/gpu_render.mjs --frames): 32 s instead of 139 s for 29 frames
   of a 10-min montage, the same pixels as its video render. --browser = the old way (tools/stills.mjs, Remotion's browser), also the fallback when the engine fails */
const frameOf = (p) => Number(p.split(":")[1]);
let ok = false;
if (!argv.includes("--browser")) {
  const gdir = path.join(out, "gpu");
  const g = spawnSync("node", ["tools/gpu_render.mjs", "--comp", id, "--frames", [...new Set(pts.map(frameOf))].join(","), "--frames-dir", gdir, "--procs", "1", "--windows", "3"], { stdio: ["ignore", "ignore", "inherit"] });
  if (g.status === 0 && pts.every((p) => fs.existsSync(path.join(gdir, `gp_${String(frameOf(p)).padStart(6, "0")}.png`)))) {
    pts.forEach((p) => fs.copyFileSync(path.join(gdir, `gp_${String(frameOf(p)).padStart(6, "0")}.png`), path.join(out, `${p.split(":")[0]}.png`)));
    fs.rmSync(gdir, { recursive: true, force: true });
    ok = true;
  } else { console.error("GPU engine frames failed — falling back to the browser stills"); fs.rmSync(gdir, { recursive: true, force: true }); }
}
if (!ok) {
  const r = spawnSync("node", ["tools/stills.mjs", id, out, ...pts, "--scale", scale], { stdio: ["ignore", "ignore", "inherit"] });
  if (r.status !== 0) { console.error("stills failed"); process.exit(1); }
}
/* (2026-11-12) a sheet with frames missing passed as «OK» (2 of 18 drawn): every asked frame must exist, or the eye review did not happen */
{ const got = fs.readdirSync(out).filter((f) => f.endsWith(".png")).length; if (got < pts.length) { console.error(`stills failed: ${got}/${pts.length} frames drawn`); process.exit(1); } }
const cols = 6, rows = Math.ceil(pts.length / cols);
/* (2026-11-12) frames of different sizes made ffmpeg rebuild the tile and keep only the last frames (2 of 18 shown): one fixed size, no filter re-init */
const W = 1920, H = id.endsWith("-L") ? 1080 : 1920;
const f = spawnSync("ffmpeg", ["-v", "error", "-y", "-threads", "4", "-framerate", "1", "-reinit_filter", "0", "-i", path.join(out, "s%03d.png"), "-vf", `scale=${spec.id && W > H ? "640:360" : "360:640"},tile=${cols}x${rows}:padding=6:color=white`, "-frames:v", "1", "-q:v", "3", sheet], { encoding: "utf8" });
if (f.status !== 0) { console.error(f.stderr); process.exit(1); }
fs.rmSync(out, { recursive: true, force: true });
console.log(`${pts.length} إطاراً (${per}/دقيقة) → ${sheet}`);
console.log("الترتيب من اليسار، صفاً صفاً: " + pts.map((p) => { const s = Number(p.split(":")[1]) / fps; return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`; }).join(" "));
