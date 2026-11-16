// Pre-render check sheet: one contact sheet of stills taken at the places where a montage most often breaks, BEFORE any long render.
//   node tools/prerender_sheet.mjs <CompositionId> <outDir> [--times 0,2.6,23,29.3] [--every 60] [--bounds "0-2.57,29.3-38.33,..."] [--props '{"frames":true}'] [--fps 30] [--cols 6] [--width 420]
// Frames chosen: the times you list, every N seconds, and for each window in --bounds: 0.2 s after the start, the middle, 0.2 s before the end and 0.2 s AFTER the end (the usual place of crop / layout / stale-frame mistakes).
// Output: <outDir>/sheet.png (labelled with seconds) + the single stills. Uses tools/stills.mjs (cached bundle, hard-linked assets, pinned port). It renders nothing else.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const [id, outDir] = argv;
const opt = (n, d) => (argv.includes("--" + n) ? argv[argv.indexOf("--" + n) + 1] : d);
if (!id || !outDir) { console.error("usage: node tools/prerender_sheet.mjs <CompositionId> <outDir> [--times a,b] [--every N] [--bounds a-b,c-d] [--fps 30]"); process.exit(2); }
const fps = Number(opt("fps", "30")), cols = Number(opt("cols", "6")), tw = Number(opt("width", "420"));
const times = new Set((opt("times", "") || "").split(",").filter(Boolean).map(Number));
for (const b of (opt("bounds", "") || "").split(",").filter(Boolean)) {
  const [a, z] = b.split("-").map(Number);
  [a + 0.2, (a + z) / 2, z - 0.2, z + 0.2].forEach((t) => times.add(Math.max(0, +t.toFixed(2))));
}
const every = Number(opt("every", "0"));
if (every > 0) {
  const dur = Number(opt("duration", "0"));
  if (dur > 0) for (let t = 0; t < dur; t += every) times.add(t);
}
const list = [...times].sort((x, y) => x - y);
if (!list.length) { console.error("no times: pass --times, --bounds or --every with --duration"); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });
const pts = list.map((t) => `t${String(Math.round(t * 100)).padStart(6, "0")}:${Math.round(t * fps)}`);
const env = { ...process.env, ...(opt("props", "") ? { STILLS_PROPS: opt("props", "") } : {}) };
const r = spawnSync("node", ["tools/stills.mjs", id, outDir, ...pts], { stdio: "inherit", env });
if (r.status !== 0) process.exit(r.status ?? 1);
// contact sheet (ffmpeg concat + tile)
const files = pts.map((p) => path.join(outDir, p.split(":")[0] + ".png"));
const rows = Math.ceil(files.length / cols);
// simple, robust tiling: ImageMagick-free, ffmpeg tile filter
const sheet = path.join(outDir, "sheet.png");
const tile = spawnSync("ffmpeg", ["-hide_banner", "-v", "error", "-y", ...files.flatMap((f) => ["-i", f]), "-filter_complex",
  files.map((_, i) => `[${i}:v]scale=${tw}:-1[s${i}]`).join(";") + `;${files.map((_, i) => `[s${i}]`).join("")}concat=n=${files.length}:v=1:a=0,tile=${cols}x${rows}:padding=4:color=black`, "-frames:v", "1", sheet], { stdio: "inherit" });
if (tile.status !== 0) { console.error("tile failed"); process.exit(1); }
console.log(`sheet: ${sheet}\ntimes (s): ${list.join(", ")}`);
