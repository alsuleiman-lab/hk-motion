// Fast trial render (2026-10-23): renders a frame range of ONE composition to an MP4 using the CACHED bundle + hard-linked assets of tools/stills.mjs (no public/ copy).
//   node tools/render_trial.mjs <CompositionId> <out.mp4> [--frames 0-249] [--concurrency 3]
// Prerequisite: run tools/stills.mjs for the same composition once (it builds .tmp/stills_bundle/<Id> and links the assets). NVENC via tools/nvenc.mjs, GL = angle,
// the same single-render lock as render_final/render_clip (never two renders at once). Prints wall time; memory is sampled by the caller.
import { renderMedia, selectComposition } from "@remotion/renderer";
import fs from "node:fs"; import os from "node:os"; import path from "node:path";
import { nvencOverride } from "./nvenc.mjs";
import { acquireRenderLock } from "./render_lock.mjs";
import { startMonitor } from "./monitor.mjs";
const argv = process.argv.slice(2);
const [id, out] = argv;
const opt = (n, d) => (argv.includes("--" + n) ? argv[argv.indexOf("--" + n) + 1] : d);
acquireRenderLock(`تجربة ${id}`);
try { os.setPriority(0, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* ignore */ }
const serveUrl = path.resolve(".tmp", "stills_bundle", id);
if (!fs.existsSync(path.join(serveUrl, "index.html"))) { console.error(`no cached bundle for ${id}: run tools/stills.mjs ${id} <dir> x:0 first`); process.exit(2); }
const log = startMonitor(path.join(".tmp", "render_logs", `trial_${id}.log`), path.basename(out, path.extname(out)));
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
const composition = await selectComposition({ serveUrl, id });
const [a, b] = opt("frames", `0-${composition.durationInFrames - 1}`).split("-").map(Number);
const t0 = Date.now();
let lastPercent = -1;
await renderMedia({ composition, serveUrl, codec: "h264", crf: 18, outputLocation: out, frameRange: [a, b], concurrency: Number(opt("concurrency", "3")), chromiumOptions: { gl: "angle" }, ffmpegOverride: nvencOverride,
  onProgress: ({ progress }) => { const percent = Math.floor(progress * 100); if (percent !== lastPercent) { lastPercent = percent; log(`[جزء 1/1] ${percent}%`); } } });
log(`DONE ${out}`);
console.log(`RENDERED ${id} frames ${a}-${b} in ${((Date.now() - t0) / 1000).toFixed(1)} s -> ${out}`);
