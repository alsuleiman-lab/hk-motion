// GPU HYBRID RENDER of the Tirmidhi lesson (landscape, Full HD).
//   node tools/hybrid_render.mjs --out out/tir_hybrid.mp4 [--start 0] [--end 20132] [--no-audio] [--keep]
// 1) per-frame geometry (src/hybrid/geom.ts)   2) Remotion renders ONLY the graphics (ProRes 4444 + alpha, no video inside)
// 3) tools/hybrid_compose.py: NVDEC decode + CUDA compositing + NVENC encode   4) audio-only render + mux.
import { execFileSync, spawn, spawnSync } from "child_process";
import net from "net";
import { createRequire } from "module";
import os from "os";
import { bundle } from "@remotion/bundler";
import { renderFrames, renderMedia, selectComposition } from "@remotion/renderer";
import fs from "fs";
import path from "path";
import { startMonitor } from "./monitor.mjs";

const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i < 0 ? d : (process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : true); };
const root = "S:/AI_Tools/Remotion_Workspace";
const work = path.join(root, ".tmp/hybrid");
fs.mkdirSync(work, { recursive: true });
const out = path.resolve(root, arg("out", "out/tir_hybrid.mp4"));
const logProgress = startMonitor(path.join(root, ".tmp", "render_logs", `hybrid_${path.basename(out)}.log`), path.basename(out, path.extname(out)));
const orient = arg("orient", "landscape");
const SHORT = arg("short", false) === true;
const AZ = arg("project", "tir") === "az"; // Azerbaijan project: no splits/B-roll/quotes, own source + windows
const comp = AZ ? (orient === "portrait" ? "Azerbaijan-Hijab-Portrait" : "Azerbaijan-Hijab-Landscape") : SHORT ? (orient === "portrait" ? "TirShortPortrait" : "TirShort") : orient === "portrait" ? "TirPortrait" : "TirLandscape";
const mode = (SHORT ? "short-" : "") + orient;
const PY = "S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe";
const log = (m) => console.log(`[hybrid ${new Date().toLocaleTimeString()}] ${m}`);
let total = AZ ? 21015 : JSON.parse(execFileSync("node", ["-e", "const m=require('./public/tir_map.json');console.log(JSON.stringify(Math.ceil(m.duration*30)))"], { cwd: root }).toString());
if (SHORT) {
  execFileSync("npx", ["esbuild", "src/tirShort.ts", "--bundle", "--platform=node", "--format=cjs", `--outfile=${work}/tirShort.cjs`, "--log-level=error"], { cwd: root, shell: true });
  total = createRequire(import.meta.url)(`${work}/tirShort.cjs`).SHORT_FRAMES; // frames of the 3-minute essence
}
const start = Number(arg("start", 0)), end = Math.min(Number(arg("end", total - 1)), total - 1);
log(`frames ${start}-${end} of ${total}`);

// the graphics layer needs only small images: give Remotion a slim public folder (copying the real public/ = several GB per bundle)
const slim = path.join(work, "public_top");
fs.mkdirSync(slim, { recursive: true });
for (const d of ["books", "cover", "people", "sfx", "broll", "az"]) { const src = path.join(root, "public", d); if (fs.existsSync(src)) fs.cpSync(src, path.join(slim, d), { recursive: true }); }
// static assets (gradient / vignette / star tile) once
for (const c of ["HybridGrad", "HybridVig", "HybridStar", "HybridGradP135", "HybridGradP160", "HybridVigP"]) {
  if (!fs.existsSync(path.join(work, c + ".png"))) spawnSync("npx", ["remotion", "still", c, path.join(work, c + ".png"), "--image-format=png", "--gl=angle", `--public-dir=${slim}`], { cwd: root, shell: true, stdio: "ignore" });
}
// 1) geometry
const dims = [];
for (const n of AZ ? [] : ["ab", "ps", "ip"]) { const o = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", path.join(root, `public/stock/prep/${n}_prepped.mp4`)]).toString().trim().split(","); dims.push({ w: +o[0], h: +o[1] }); }
fs.writeFileSync(path.join(work, "clipdims.json"), JSON.stringify(dims));
execFileSync("npx", ["esbuild", AZ ? "src/hybrid/exportAz.ts" : "src/hybrid/export.ts", "--bundle", "--platform=node", "--format=cjs", "--external:remotion", "--external:react", `--outfile=${work}/export.cjs`, "--log-level=warning"], { cwd: root, shell: true, stdio: "inherit" });
execFileSync("node", [`${work}/export.cjs`, `${work}/timeline.json`, String(start), String(end), `${work}/clipdims.json`, mode], { cwd: root, stdio: "inherit" });

// 2+3) graphics only (transparent PNG frames, streamed over a local socket) + GPU compositing (NVDEC → CUDA → NVENC), pipelined
log("starting the GPU compositor…");
const video = path.join(work, "video_noaudio.mp4");
const PORT = 47731;
const comp_py = spawn(PY, ["-u", "tools/hybrid_compose.py", "--timeline", `${work}/timeline.json`, "--listen", String(PORT), "--out", video, "--assets", work, "--orient", orient, ...(AZ ? ["--src", "public/az_v3_cut.mp4", "--win", orient === "portrait" ? "public/azwin/composed_all_p.mp4" : "public/azwin/composed_all.mp4", "--brolls", ""] : [])], { cwd: root, stdio: ["ignore", "pipe", "inherit"] });
// the compositor (GPU feeding thread) must never be starved by Chrome's render workers: Chrome (children of this node process) runs below normal, the compositor above
try { os.setPriority(comp_py.pid, os.constants.priority.PRIORITY_ABOVE_NORMAL); } catch (e) { log("priority: " + e.message); }
let ready; const readyP = new Promise((res) => (ready = res));
comp_py.stdout.on("data", (d) => { const t = d.toString(); process.stdout.write(t); if (t.includes("READY")) ready(); });
const exited = new Promise((res, rej) => comp_py.on("exit", (c) => (c === 0 ? res() : rej(new Error("compositor exit " + c)))));
exited.catch((e) => { console.error("the compositor stopped: " + e.message); process.exit(1); }); // never hang waiting for a dead compositor
await Promise.race([readyP, exited]);
const sock = net.connect(PORT, "127.0.0.1");
await new Promise((res) => sock.on("connect", res));
log("rendering the graphics layer (Remotion, no video decoding) and streaming it…");
const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts"), rspack: true, publicDir: slim });
const t0 = Date.now();
const props = { layer: "top" };
const composition = await selectComposition({ serveUrl, id: comp, inputProps: props, chromiumOptions: { gl: "angle" } });
let sent = 0;
let lastPercent = -1;
await renderFrames({
  composition, serveUrl, inputProps: props, imageFormat: "png", outputDir: null, concurrency: process.env.HYBRID_CONC ? Number(process.env.HYBRID_CONC) : null, frameRange: [start, end], chromiumOptions: { gl: "angle" }, logLevel: "error",
  onFrameUpdate: () => {},
  onFrameBuffer: (buf, frame) => { const h = Buffer.alloc(8); h.writeUInt32LE(frame, 0); h.writeUInt32LE(buf.length, 4); sock.write(h); sock.write(buf); sent++; const percent = Math.floor(sent / (end - start + 1) * 100); if (percent !== lastPercent) { lastPercent = percent; logProgress(`[جزء 1/1] ${percent}%`); } if (sent % 600 === 0) log(`graphics ${sent}/${end - start + 1}`); },
});
sock.end();
log(`graphics done in ${((Date.now() - t0) / 1000).toFixed(0)}s — waiting for the compositor`);
await exited;

// 4) audio + mux
if (arg("no-audio", false)) { fs.copyFileSync(video, out); }
else {
  log("rendering audio…");
  const acomp = await selectComposition({ serveUrl, id: comp, inputProps: {}, chromiumOptions: { gl: "angle" } });
  await renderMedia({ composition: acomp, serveUrl, codec: "aac", outputLocation: path.join(work, "audio.aac"), frameRange: [start, end], overwrite: true, logLevel: "error" });
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", video, "-i", path.join(work, "audio.aac"), "-c:v", "copy", "-c:a", "copy", "-shortest", "-movflags", "+faststart", out]);
}
try { fs.rmSync(serveUrl, { recursive: true, force: true }); } catch {} // the bundle lives in TEMP: remove it now
spawnSync("node", ["tools/clean_temp.mjs"], { cwd: root, stdio: "ignore" });
log(`DONE → ${out}`);
logProgress(`DONE ${out}`);
