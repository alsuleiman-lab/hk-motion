// Render any composition straight into the ready folder (C:/Users/mshms/Videos/جاهز/<العنوان>.mp4, the only export folder). NVENC + concurrency 3 + below-normal priority; progress card comes from startMonitor.
//   node tools/render_final.mjs <CompositionId> "<out.mp4>" "<عنوان البطاقة>" [<monitor-id>]
import { renderMedia, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { nvencOverride } from "./nvenc.mjs";
import { startMonitor } from "./monitor.mjs";
import { acquireRenderLock } from "./render_lock.mjs";
import { cachedServeUrl, privateTemp } from "./lib/cached_bundle.mjs";

privateTemp("render_final");

const [id, out, title = "فيديو", monitorId] = process.argv.slice(2);
// ONE render at a time, always (user order 2026-10-22) — exclusive lock shared by every render entry point (tools/render_lock.mjs).
acquireRenderLock(title);
let log = () => {};
try { os.setPriority(0, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* ignore */ }
fs.mkdirSync(path.dirname(out), { recursive: true });
const { serveUrl } = await cachedServeUrl(id, { tag: "render" });
const composition = await selectComposition({ serveUrl, id, port: Number(process.env.RENDER_PORT ?? 3458) });
log = startMonitor(".tmp/render_final.log", title, monitorId);
let lastP = -1;
await renderMedia({
  composition, serveUrl, port: Number(process.env.RENDER_PORT ?? 3458), codec: "h264", crf: 18, outputLocation: out, concurrency: 3,
  chromiumOptions: { gl: "angle" }, ffmpegOverride: nvencOverride,
  onProgress: ({ progress }) => { const p = Math.floor(progress * 100); if (p !== lastP) { lastP = p; log(`[جزء 1/1] ${p}%`); } },
});
log("DONE " + out);
