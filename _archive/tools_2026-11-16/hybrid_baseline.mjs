// Reference (normal Remotion) render of a slice, exactly like tools/eu_render.mjs (ANGLE, NVENC override, concurrency 3), for A/B timing and for reference stills.
//   node tools/hybrid_baseline.mjs --comp ID --start 600 --end 749 --out file.mp4 [--stills "dir:610,700"]
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { nvencOverride } from "./nvenc.mjs";
import { startMonitor } from "./monitor.mjs";
import fs from "node:fs"; import path from "node:path";
process.env.TEMP = process.env.TMP = "S:/AI_Tools/Remotion_Workspace/.tmp";
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i < 0 ? d : process.argv[i + 1]; };
const root = "S:/AI_Tools/Remotion_Workspace";
const comp = arg("comp"), start = Number(arg("start", 0)), end = Number(arg("end", 149)), out = path.resolve(root, arg("out", "render_work/hybrid_test/baseline.mp4"));
const VID = /\.(mp4|mov|webm|mkv|avi|m4v)$/i;
const slim = path.join(root, ".tmp/hybrid_any/public_slim");
const linkVideos = (src, dst) => { for (const e of fs.readdirSync(src, { withFileTypes: true })) { const s2 = path.join(src, e.name), d2 = path.join(dst, e.name); if (e.isDirectory()) { fs.mkdirSync(d2, { recursive: true }); linkVideos(s2, d2); } else if (VID.test(e.name) && !fs.existsSync(d2)) fs.linkSync(s2, d2); } };
const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts"), rspack: true, publicDir: slim, outDir: path.join(root, ".tmp/hybrid_any/bundle_base_" + comp), onProgress: () => {} });
linkVideos(path.join(root, "public"), path.join(serveUrl, "public"));
const props = process.env.PROPS ? JSON.parse(process.env.PROPS) : {};
const composition = await selectComposition({ serveUrl, id: comp, inputProps: props });
fs.mkdirSync(path.dirname(out), { recursive: true });
if (arg("stills", null)) {
  const [dir, lst] = [arg("stills").slice(0, arg("stills").lastIndexOf(":")), arg("stills").slice(arg("stills").lastIndexOf(":") + 1)];
  for (const f of lst.split(",").map(Number)) await renderStill({ composition, serveUrl, inputProps: props, frame: f, output: `${dir}/ref_${String(f).padStart(6, "0")}.png`, imageFormat: "png", chromiumOptions: { gl: "angle" }, overwrite: true });
  console.log("stills done");
}
if (!arg("stills-only", false) && process.argv.includes("--video")) {
  const log = startMonitor(path.join(root, ".tmp", "render_logs", `baseline_${comp}.log`), path.basename(out, path.extname(out)));
  const t0 = Date.now();
  let lastPercent = -1;
  await renderMedia({ composition, serveUrl, codec: "h264", crf: 18, outputLocation: out, frameRange: [start, end], chromiumOptions: { gl: "angle" }, chromeMode: process.env.CM || undefined, hardwareAcceleration: "if-possible", concurrency: 3, ffmpegOverride: nvencOverride, timeoutInMilliseconds: 180000, logLevel: "error", overwrite: true,
    onProgress: ({ progress }) => { const percent = Math.floor(progress * 100); if (percent !== lastPercent) { lastPercent = percent; log(`[جزء 1/1] ${percent}%`); } } });
  log(`DONE ${out}`);
  const s = (Date.now() - t0) / 1000; console.log(`BASELINE ${end - start + 1} frames in ${s.toFixed(1)}s => ${((end - start + 1) / s).toFixed(2)} fps`);
}
try { fs.rmSync(serveUrl, { recursive: true, force: true }); } catch {}
