// Render any composition (used for the silent-reaction videos) on the GPU encoder with the progress window — the house render recipe (CLAUDE.md):
//   node tools/render_silent.mjs <CompositionId> "<out.mp4>" "<window title>" [--props '{"name":"x","orient":"portrait"}']
// NVENC through ffmpegOverride (tools/nvenc.mjs), concurrency 3, always shows tools/render_monitor.ps1 (name + bar). Output goes straight to the final folder.
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";
import { nvencOverride } from "./nvenc.mjs";
import { startMonitor } from "./monitor.mjs";
import { sendNotification } from "./notify.mjs";

const [id, outArg, titleArg, ...rest] = process.argv.slice(2);
const out = process.env.OUT ?? outArg, title = process.env.TITLE ?? titleArg;   // OUT/TITLE env: safe for Arabic paths when launched from PowerShell
const props = rest.includes("--props") ? JSON.parse(rest[rest.indexOf("--props") + 1]) : {};
const logFile = path.resolve(".tmp/render_logs", `${id}.log`);
const log = startMonitor(logFile, title ?? id);
fs.mkdirSync(path.dirname(out), { recursive: true });
log("جارٍ تجهيز الرندر");
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), onProgress: () => {} });
const composition = await selectComposition({ serveUrl, id, inputProps: props });
log(`بدأ رندر ${composition.durationInFrames} إطار`);
let last = -1;
await renderMedia({
  composition, serveUrl, codec: "h264", crf: 18, outputLocation: out, inputProps: props, concurrency: 3, chromiumOptions: { gl: "angle" },
  ffmpegOverride: nvencOverride,
  onProgress: ({ progress }) => { const p = Math.floor(progress * 100); if (p !== last) { last = p; log(`[جزء 1/1] ${p}%`); } },
});
log(`DONE ${out}`);
try { fs.rmSync(serveUrl, { recursive: true, force: true }); } catch {}
console.log("RENDERED →", out);

sendNotification({
  title: "اكتمل المونتاج والرندرة بنجاح ✅",
  body: `${title ?? id}\nالمسار: ${out}`,
  source: "مونتاج ورندر البثوث",
  link: out,
});
