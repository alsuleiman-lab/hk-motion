// SCALE=0.5 renders at half size (quick previews). Render one short composition to an MP4 on the GPU encoder (test clips / previews): node tools/render_clip.mjs <CompositionId> <out.mp4>
// NVENC via ffmpegOverride (tools/nvenc.mjs), concurrency 3, below-normal priority. No progress window (Janib is used by the montage sessions).
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { nvencOverride } from "./nvenc.mjs";
import { acquireRenderLock } from "./render_lock.mjs";
import { startMonitor } from "./monitor.mjs";

const [id, out] = process.argv.slice(2);
acquireRenderLock(`مقطع ${id}`);   // same single-render lock as render_final (no two renders at once)
const log = startMonitor(path.join(".tmp", "render_logs", `clip_${id}.log`), path.basename(out, path.extname(out)));
try { os.setPriority(0, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* ignore */ }
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), onProgress: () => {} });
const composition = await selectComposition({ serveUrl, id });
let lastPercent = -1;
await renderMedia({ composition, serveUrl, codec: "h264", crf: 18, outputLocation: out, scale: Number(process.env.SCALE ?? 1), concurrency: 3, chromiumOptions: { gl: "angle" }, ffmpegOverride: nvencOverride,
  onProgress: ({ progress }) => { const percent = Math.floor(progress * 100); if (percent !== lastPercent) { lastPercent = percent; log(`[جزء 1/1] ${percent}%`); } } });
log(`DONE ${out}`);
try { fs.rmSync(serveUrl, { recursive: true, force: true }); } catch { /* ignore */ }
console.log("RENDERED →", out);
