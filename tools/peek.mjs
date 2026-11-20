// LOOK BEFORE SAYING «DONE» (2026-11-20): every defect the user found in the Studio on mufti-hiraba was VISIBLE and no gate saw it (a hadith card in
// broken lines, a clipped thumbnail, a fade over his face, two elements stacked, a map of the wrong region, a black band over his head).
// peek draws the given moments with the GPU engine (the same pixels as the render) into ONE sheet the agent opens and looks at.
//   node tools/peek.mjs <p> <CompositionId> <cut seconds, comma-separated> [--out file.jpg]
//   node tools/peek.mjs <p> <CompositionId> --ids <id,id,…>     the middle of each of these spec items
// Times are CUT seconds (the engine renders the cut; the Studio's 5 s break is a Studio-only insert). Prints the sheet path and the order of the frames.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { projTmp } from "./lib/projdir.mjs";

const a = process.argv.slice(2), [p, comp] = a, opt = (k, d) => (a.includes("--" + k) ? a[a.indexOf("--" + k) + 1] : d);
if (!p || !comp) { console.error("usage: node tools/peek.mjs <p> <Comp> <t,t,…> | --ids <id,…> [--out file.jpg]"); process.exit(2); }
const spec = JSON.parse(fs.readFileSync(path.join("data", "specs", `${p}.json`), "utf8"));
let times = [];
if (opt("ids", "")) {
  for (const id of opt("ids", "").split(",").map((x) => x.replace(/^#/, "")).filter(Boolean)) {
    const it = spec.items.find((x) => x.id === id); if (!it) { console.error(`✘ لا عنصر #${id}`); continue; }
    const s = it.at ?? it.from, e = it.until ?? it.to ?? s + 2;
    times.push(+(s + Math.min(2.2, Math.max(0.6, (e - s) * 0.55))).toFixed(2));   // past the entry animation, before the exit
  }
} else times = String(a[2] ?? "").split(",").map(Number).filter((x) => Number.isFinite(x) && x >= 0);
if (!times.length) { console.error("✘ لا أوقات"); process.exit(2); }
const frames = [...new Set(times.map((t) => Math.round(t * 30)))].sort((x, y) => x - y);
const dir = projTmp(p, "peek", String(Date.now()));
const r = spawnSync(process.execPath, ["tools/gpu_render.mjs", "--comp", comp, "--frames", frames.join(","), "--frames-dir", dir, "--procs", "1", "--windows", "2"], { stdio: ["ignore", "ignore", "pipe"], encoding: "utf8" });
const pngs = frames.map((f) => path.join(dir, `gp_${String(f).padStart(6, "0")}.png`));
const miss = pngs.filter((x) => !fs.existsSync(x));
if (r.status !== 0 || miss.length) { console.error(`✘ peek: ${miss.length} إطار لم يُرسم (exit ${r.status}) ${(r.stderr || "").trim().split("\n").slice(-2).join(" | ")}`); process.exit(1); }
const out = opt("out", path.join(projTmp(p), "peek.jpg"));
const cols = Math.min(3, frames.length), rows = Math.ceil(frames.length / cols);
const inputs = pngs.flatMap((x) => ["-i", x]);
const scale = pngs.map((_, i) => `[${i}]scale=640:-2,drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':text='${frames[i]}':x=8:y=8:fontsize=26:fontcolor=white:box=1:boxcolor=black@0.6[s${i}]`).join(";");
const pad = Array.from({ length: cols * rows - frames.length }, (_, k) => `color=c=black:s=640x360[z${k}]`).join(";");
const all = [...pngs.map((_, i) => `[s${i}]`), ...Array.from({ length: cols * rows - frames.length }, (_, k) => `[z${k}]`)].join("");
const fc = [scale, pad, `${all}xstack=inputs=${cols * rows}:layout=${Array.from({ length: cols * rows }, (_, i) => `${(i % cols) * 640}_${Math.floor(i / cols) * 360}`).join("|")}[o]`].filter(Boolean).join(";");
const f2 = spawnSync("ffmpeg", ["-v", "error", "-y", ...inputs, "-filter_complex", fc, "-map", "[o]", "-frames:v", "1", out], { encoding: "utf8" });
if (f2.status !== 0) { console.error("✘ peek: اللوحة لم تُصنع: " + (f2.stderr || "").slice(-300)); process.exit(1); }
fs.rmSync(dir, { recursive: true, force: true });
console.log(`peek → ${out}`);
console.log("الترتيب (إطارات القص): " + frames.map((f) => `${f} = ${Math.floor(f / 30 / 60)}:${String(Math.floor((f / 30) % 60)).padStart(2, "0")}`).join("، "));
