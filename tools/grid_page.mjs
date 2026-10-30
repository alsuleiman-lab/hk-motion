// Builds the grid page (user 2026-10-29: «نفس المعرض لكن للشبكة وبأكواد»): data/layout_grids.json drawn over 10 s of his real recording, every mode, both
// orientations, slots draggable; «احفظ» writes the edited grid to the page's db (grids/current) and Claude applies it back to data/layout_grids.json.
//   node tools/grid_page.mjs [data/specs/<p>.json] [--at 40]  →  scratch/grid_site/{index.html, clip.mp4}, then publish index.html with the Artifact tool
//   (same url every time: see GRID_PAGE_URL in data/layout_grids.json "_page")
import fs from "node:fs"; import path from "node:path"; import { spawnSync } from "node:child_process";
import { faceZoner } from "./lib/face_zone.mjs";

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const specF = argv.find((a) => a.endsWith(".json")) ?? "data/specs/zaynab_shrine.json";
const at = Number(opt("at", 40)), OUT = "scratch/grid_site";
const spec = JSON.parse(fs.readFileSync(specF, "utf8"));
const grids = JSON.parse(fs.readFileSync("data/layout_grids.json", "utf8"));
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });

// his face + beard over the 10 s, in recording pixels (landscape, no push-in, no shift)
const zoneAt = faceZoner({ ...spec, zooms: [], behind: [], shake: [], splits: [], solos: [] });
let Z = null; for (let t = at; t <= at + 10; t += 0.5) { const q = zoneAt(t, "land"); Z = Z ? [Math.min(Z[0], q[0]), Math.min(Z[1], q[1]), Math.max(Z[2], q[2]), Math.max(Z[3], q[3])] : q; }
const cam = (spec.cams ?? []).find((c) => at >= c.from && at < c.to) ?? { cx: 990 };

// 10 s of the cut, 1280x720 (portrait crops it in the page), NVENC, no audio
const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-hwaccel", "cuda", "-ss", String(at), "-t", "10", "-i", path.join("public", spec.cut), "-an", "-vf", "scale=1280:720", "-c:v", "h264_nvenc", "-preset", "p4", "-cq", "28", "-movflags", "+faststart", path.join(OUT, "clip.mp4")], { encoding: "utf8" });
if (r.status !== 0) { console.error(r.stderr); process.exit(1); }

const data = {
  grids: Object.fromEntries(["land", "port"].map((o) => [o, grids[o]])), kinds: grids.kinds, zone: Z.map(Math.round), cx: cam.cx,
  dx: (spec.behind ?? []).find((b) => b.dx !== undefined)?.dx ?? 430, soloScale: spec.solos?.[0]?.scale ?? 1.05, clip: "clip.mp4", builtAt: new Date().toISOString(),
};
const html = fs.readFileSync("tools/grid_page.html", "utf8").replace("/*GRID_DATA*/null", JSON.stringify(data));
fs.writeFileSync(path.join(OUT, "index.html"), html);
fs.writeFileSync(path.join(OUT, "data.json"), JSON.stringify(data));   // the gallery embeds this page too (tools/gallery_build.mjs)
console.log(`${OUT}/index.html + clip.mp4 (${(fs.statSync(path.join(OUT, "clip.mp4")).size / 1048576).toFixed(1)} MB) · face zone ${data.zone.join(",")} · cam cx ${cam.cx}`);
