// GPU RENDERER — drop-in replacement of tools/hybrid_any.mjs (which stays as the fallback). Every frame is processed on the GPU:
//   Chromium (Electron, offscreen, D3D11) draws the Remotion graphics on the GPU; each frame leaves Electron as a shared D3D11 texture (no screenshot,
//   no PNG/JPEG, no copy to the CPU), tools/gpu/bridge.dll copies it GPU -> GPU into CUDA, and tools/gpu_compositor.py stacks it over the videos
//   (NVDEC) and encodes on NVENC with the hybrid's exact settings. Same components, same report, same audio mix and bumper as hybrid_any.
//   node tools/gpu_render.mjs --comp SaintRambal-L --out <file.mp4> [--start N --end N] [--under "a-b,…"] [--procs 2 --windows 3 --block 60]
//   [--dump "dir:frame,frame"] [--no-bumper]
import { execFileSync, spawn, spawnSync } from "node:child_process";
import http from "node:http";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { NoReactInternals } from "remotion/no-react";
import { startMonitor } from "./monitor.mjs";
import { acquireRenderLock } from "./render_lock.mjs";

process.env.TEMP = process.env.TMP = "S:/AI_Tools/Remotion_Workspace/.tmp"; // project rule: never write temp files to C:
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i < 0 ? d : (process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : true); };
const root = path.resolve(import.meta.dirname, "..").replace(/\\/g, "/");
const compId = arg("comp", null);
if (!compId || compId === true) { console.error("usage: node tools/gpu_render.mjs --comp <CompositionId> --out <file.mp4> [--start N --end N --under 'a-b,…' --dump 'dir:frames,...']"); process.exit(1); }
process.chdir(root);
try { os.setPriority(process.pid, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch {} // every child (Electron, its GPU process, python, ffmpeg) inherits BelowNormal
acquireRenderLock("gpu " + compId);   // one render at a time, like every other render entry point
const out = path.resolve(root, arg("out", `render_work/gpu/${compId}.mp4`));
const logProgress = startMonitor(path.join(root, ".tmp", "render_logs", `gpu_render_${compId}.log`), path.basename(out, path.extname(out)));
const work = path.join(root, ".tmp/gpu_render/work", compId);
fs.rmSync(work, { recursive: true, force: true });
fs.mkdirSync(work, { recursive: true });
fs.mkdirSync(path.dirname(out), { recursive: true });
const CTL_PORT = Number(arg("ctl-port", 47751)), GEOM_PORT = Number(arg("geom-port", 47752)), HTTP_PORT = Number(arg("http-port", 47753));
const PY = "S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe";
const ELECTRON = process.env.GR_ELECTRON || "S:/AI_Tools/Electron_GpuRender/node_modules/electron/dist/electron.exe";
const log = (m) => console.log(`[gpu-render ${new Date().toLocaleTimeString()}] ${m}`);
const T_START = Date.now();
const timing = {};

// ---- GPU / CPU sampler (nvidia-smi once a second + os.cpus deltas), as in hybrid_any ----
const gpuSamples = [], cpuSamples = [];
const smi = spawn("nvidia-smi", ["--query-gpu=utilization.gpu,utilization.encoder,utilization.decoder,memory.used", "--format=csv,noheader,nounits", "-l", "1"], { stdio: ["ignore", "pipe", "ignore"] });
let smiBuf = "";
smi.stdout.on("data", (d) => { smiBuf += d; const L = smiBuf.split("\n"); smiBuf = L.pop(); for (const l of L) { const v = l.split(",").map(Number); if (v.length === 4 && !v.some(isNaN)) gpuSamples.push({ t: Date.now(), gpu: v[0], enc: v[1], dec: v[2], mem: v[3] }); } });
let lastCpu = os.cpus().map((c) => ({ ...c.times }));
const cpuTimer = setInterval(() => { const now = os.cpus().map((c) => ({ ...c.times })); let busy = 0, tot = 0; now.forEach((c, i) => { const p = lastCpu[i]; const d = (k) => c[k] - p[k]; const all = d("user") + d("nice") + d("sys") + d("idle") + d("irq"); tot += all; busy += all - d("idle"); }); lastCpu = now; if (tot) cpuSamples.push({ t: Date.now(), cpu: (100 * busy) / tot }); }, 1000);
const stats = (arr, key, t0, t1) => { const v = arr.filter((s) => s.t >= t0 && s.t <= t1).map((s) => s[key]); if (!v.length) return null; v.sort((a, b) => a - b); return { mean: +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1), median: v[Math.floor(v.length / 2)], p95: v[Math.floor(v.length * 0.95)], max: v[v.length - 1], n: v.length }; };

// ---- slim public dir + bundle (identical to hybrid_any: videos are decoded by NVDEC from the real public/, never by Chromium) ----
const slim = path.join(root, ".tmp/hybrid_any/public_slim");
const VID = /\.(mp4|mov|webm|mkv|avi|m4v)$/i;
const sync = (src, dst) => {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) { if (src === path.join(root, "public") && /^(fr|_vprobe_fr|matte_cache)$/.test(e.name)) continue; sync(s, d); continue; }
    if (VID.test(e.name)) continue;
    const st = fs.statSync(s);
    if (st.size > 12e6) continue;
    if (fs.existsSync(d)) { const dt = fs.statSync(d); if (dt.size === st.size && Math.abs(dt.mtimeMs - st.mtimeMs) < 2000) continue; }
    fs.copyFileSync(s, d); fs.utimesSync(d, st.atime, st.mtime);
  }
};
let t = Date.now();
sync(path.join(root, "public"), slim);
timing.slimPublicSec = (Date.now() - t) / 1000;
t = Date.now();
log("bundling…");
/* --bundle <dir>: reuse a bundle made earlier (tests: the same build for every run; it is kept) */
const KEEP = arg("bundle", null);
const serveUrl = KEEP && KEEP !== true ? path.resolve(root, KEEP) : await bundle({ entryPoint: path.join(root, "src/index.ts"), rspack: true, publicDir: slim, outDir: path.join(root, ".tmp/gpu_render/bundle_" + compId), onProgress: () => {} });
const linkVideos = (src, dst) => { for (const e of fs.readdirSync(src, { withFileTypes: true })) { const s2 = path.join(src, e.name), d2 = path.join(dst, e.name); if (e.isDirectory()) { fs.mkdirSync(d2, { recursive: true }); linkVideos(s2, d2); } else if (VID.test(e.name) && !fs.existsSync(d2)) { try { fs.linkSync(s2, d2); } catch (err) { log("link failed " + e.name + ": " + err.message); } } } };
if (!KEEP) linkVideos(path.join(root, "public"), path.join(serveUrl, "public"));   // hard links: zero copy (audio assets of <Audio>/<Video> point into the bundle)
timing.bundleSec = (Date.now() - t) / 1000;
if (!process.env.GR_KEEP_BUNDLE && !KEEP) process.on("exit", () => { try { fs.rmSync(serveUrl, { recursive: true, force: true }); } catch {} });
const inputProps = { hybrid: "top", hybridPort: GEOM_PORT };
const composition = await selectComposition({ serveUrl, id: compId, inputProps, chromiumOptions: { gl: "angle" } });
const W = composition.width, H = composition.height, FPS = composition.fps;
const start = Number(arg("start", 0)), end = Math.min(Number(arg("end", composition.durationInFrames - 1)), composition.durationInFrames - 1);
const NF = end - start + 1;
log(`${compId}: ${W}x${H} @${FPS}, frames ${start}-${end} (${NF})`);

// ---- static background (rendered once, as in hybrid_any) ----
t = Date.now();
const bgPng = path.join(work, "bg.png");
await renderStill({ composition, serveUrl, inputProps: { hybrid: "bg", hybridPort: GEOM_PORT }, output: bgPng, imageFormat: "png", frame: start, chromiumOptions: { gl: "angle" }, overwrite: true });
timing.bgSec = (Date.now() - t) / 1000;

// ---- static file server for the bundle (what @remotion/renderer's own server does for Chromium) ----
const MIME = { ".html": "text/html; charset=utf-8", ".js": "application/javascript", ".mjs": "application/javascript", ".css": "text/css", ".json": "application/json", ".map": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".avif": "image/avif", ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".otf": "font/otf", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".m4a": "audio/mp4", ".aac": "audio/aac", ".ogg": "audio/ogg", ".mp4": "video/mp4", ".webm": "video/webm", ".txt": "text/plain" };
const missing = new Set();
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  let p = decodeURIComponent(u.pathname);
  if (p === "/" || p === "") p = "/index.html";
  const f = path.join(serveUrl, p);
  if (!f.startsWith(serveUrl) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { if (!missing.has(p)) { missing.add(p); log("404 " + p.slice(0, 200)); } res.writeHead(404); res.end(); return; }
  const st = fs.statSync(f), type = MIME[path.extname(f).toLowerCase()] || "application/octet-stream";
  const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
  if (range) {
    const a = range[1] ? +range[1] : 0, b = range[2] ? +range[2] : st.size - 1;
    res.writeHead(206, { "Content-Type": type, "Content-Range": `bytes ${a}-${b}/${st.size}`, "Content-Length": b - a + 1, "Accept-Ranges": "bytes", "Access-Control-Allow-Origin": "*" });
    fs.createReadStream(f, { start: a, end: b }).pipe(res);
  } else {
    res.writeHead(200, { "Content-Type": type, "Content-Length": st.size, "Accept-Ranges": "bytes", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" });
    fs.createReadStream(f).pipe(res);
  }
});
await new Promise((res) => server.listen(HTTP_PORT, "127.0.0.1", res));

// ---- the D3D11 -> CUDA bridge (tools/gpu/bridge.cpp) is built from source with Visual Studio 2022 when missing ----
if (!fs.existsSync(path.join(root, "tools/gpu/bridge.dll"))) {
  log("building tools/gpu/bridge.dll (Visual Studio 2022)…");
  const r = spawnSync("cmd", ["/c", path.join(root, "tools/gpu/build_bridge.bat").split("/").join("\\")], { cwd: root, stdio: "inherit", windowsHide: true });
  if (r.status !== 0 || !fs.existsSync(path.join(root, "tools/gpu/bridge.dll"))) { console.error("could not build tools/gpu/bridge.dll"); process.exit(1); }
}
// ---- compositor ----
const UNDER = String(arg("under", "") === true ? "" : arg("under", "")).split(",").filter(Boolean).map((r) => r.split("-").map(Number)).map(([a, b]) => [Math.max(a, start), Math.min(b, end)]).filter(([a, b]) => b >= a);
const NU = UNDER.reduce((n, [a, b]) => n + b - a + 1, 0);
if (NU) log(`under-him layer: ${NU} frames (${UNDER.map(([a, b]) => a + "-" + b).join(", ")})`);
const PROCS = Math.max(1, Number(arg("procs", 2)) || 1), WINDOWS = Math.max(1, Number(arg("windows", 3)) || 1), BLOCK = Math.max(5, Number(arg("block", 60)) || 60);
log("starting the GPU compositor…");
const video = path.join(work, "video_noaudio.mp4");
const dump = arg("dump", null);
const comp_py = spawn(PY, ["-u", "tools/gpu_compositor.py", "--ctl", String(CTL_PORT), "--workers", String(PROCS), "--block", String(BLOCK), "--lookahead", String(arg("lookahead", 240)), "--geom", String(GEOM_PORT), "--out", video, "--bg", bgPng, "--public", `${root}/public`, "--w", String(W), "--h", String(H), "--fps", String(FPS), "--start", String(start), "--end", String(end), ...(NU ? ["--under", UNDER.map(([a, b]) => a + "-" + b).join(",")] : []), ...(dump && dump !== true ? ["--dump", dump] : [])], { cwd: root, stdio: ["ignore", "pipe", "inherit"] });
let ready; const readyP = new Promise((res) => (ready = res));
let pyOut = "";
const tg0 = Date.now();
let lastPercent = -1;
comp_py.stdout.on("data", (d) => {
  const s = d.toString(); pyOut += s; process.stdout.write(s);
  if (s.includes("READY")) ready();
  const m = /frame (\d+)\/(\d+)/.exec(s);
  if (m) { const percent = Math.floor((+m[1] / NF) * 100); if (percent !== lastPercent) { lastPercent = percent; logProgress(`[جزء 1/1] ${percent}%`); } }
});
const exited = new Promise((res, rej) => comp_py.on("exit", (c) => (c === 0 ? res() : rej(new Error("compositor exit " + c)))));
const workers = [];
const killWorkers = () => { for (const w of workers) { try { w.kill(); } catch {} } };
exited.catch((e) => { console.error("the compositor stopped: " + e.message); killWorkers(); process.exit(1); });
await Promise.race([readyP, exited]);

// ---- Electron graphics workers: PROCS processes × WINDOWS offscreen windows (+ one "under" window when an under-him layer is needed) ----
const ser = (data) => NoReactInternals.serializeJSONWithSpecialTypes({ indent: undefined, staticBase: null, data }).serializedString;
const bundleMode = {
  type: "composition", compositionName: composition.id, serializedResolvedPropsWithSchema: ser(composition.props), compositionDurationInFrames: composition.durationInFrames,
  compositionFps: composition.fps, compositionHeight: composition.height, compositionWidth: composition.width, compositionDefaultCodec: composition.defaultCodec,
  compositionDefaultOutName: composition.defaultOutName, compositionDefaultVideoImageFormat: composition.defaultVideoImageFormat, compositionDefaultPixelFormat: composition.defaultPixelFormat,
  compositionDefaultProResProfile: composition.defaultProResProfile, compositionDefaultSampleRate: composition.defaultSampleRate,
};
let wBase = 0;
for (let p = 0; p < PROCS; p++) {
  const wins = Array.from({ length: WINDOWS }, () => ({ mode: "top", inputProps: ser(inputProps), initialFrame: start }));
  if (NU && p === 0) wins.push({ mode: "under", inputProps: ser({ ...inputProps, hybrid: "under" }), initialFrame: UNDER[0][0] });
  const cfgFile = path.join(work, `worker_${p}.json`);
  fs.writeFileSync(cfgFile, JSON.stringify({ url: `http://127.0.0.1:${HTTP_PORT}`, compId: composition.id, bundleMode, width: W, height: H, markRows: 8, ctlPort: CTL_PORT, proxyPort: HTTP_PORT, timeout: 180000, mediaCache: null, sampleRate: composition.defaultSampleRate ?? 48000, windows: wins, windowBase: wBase, workDir: work, paintRate: Number(arg("paint-rate", 240)) }));
  wBase += wins.length;
  const ew = spawn(ELECTRON, [path.join(root, "tools/gpu/electron_worker.cjs"), cfgFile], { cwd: root, stdio: ["ignore", "inherit", "inherit"], env: { ...process.env, ELECTRON_ENABLE_LOGGING: "" }, windowsHide: true });
  ew.on("exit", (c) => { if (c) log(`electron worker ${p} exited with ${c}`); });
  workers.push(ew);
}
log(`graphics: ${PROCS} Electron process(es) × ${WINDOWS} offscreen windows${NU ? " + 1 under-him window" : ""}, blocks of ${BLOCK} frames`);
await exited;
const tc1 = Date.now();
timing.graphicsPlusCompositeSec = (tc1 - tg0) / 1000;
await new Promise((r) => setTimeout(r, 500));
killWorkers();
server.close();

// ---- audio: same mix as hybrid_any, from the audio assets each window collected (window.remotion_collectAssets, as renderFrames does) ----
t = Date.now();
const frames = [];
for (const f of fs.readdirSync(work)) if (/^assets_.*\.json$/.test(f)) frames.push(...JSON.parse(fs.readFileSync(path.join(work, f), "utf8")));
frames.sort((a, b) => a.frame - b.frame);
const open = new Map(), segs = [];
for (const f of frames) {
  const rel = f.frame - start, present = new Set();
  for (const a of f.audioAndVideoAssets) {
    if (a.type !== "audio") continue;
    present.add(a.id);
    let o = open.get(a.id);
    if (!o) { o = { id: a.id, src: a.src, startRel: rel, trim: a.mediaFrame, rate: a.playbackRate, vols: [], last: rel }; open.set(a.id, o); segs.push(o); }
    o.vols.push(a.volume); o.last = rel;
  }
  for (const [id] of open) if (!present.has(id)) open.delete(id);
}
const toPath = (s) => { if (s.startsWith("file:")) return decodeURIComponent(new URL(s).pathname.replace(/^\//, "")); const u = new URL(s); const m = decodeURIComponent(u.pathname).match(/\/public\/(.*)$/); return m ? `${root}/public/${m[1]}` : s; };
const inputs = [], parts = [], mixIn = [], uniq = new Map();
segs.forEach((o, k) => {
  const v = o.vols.reduce((a, b) => a + b, 0) / o.vols.length;
  if (Math.max(...o.vols) - Math.min(...o.vols) > 0.02) log(`audio ${o.id}: volume varies (${Math.min(...o.vols).toFixed(2)}–${Math.max(...o.vols).toFixed(2)}), using the mean`);
  const dur = (o.last - o.startRel + 1) / FPS, ms = Math.round((o.startRel / FPS) * 1000);
  const sp = toPath(o.src); if (!uniq.has(sp)) { uniq.set(sp, { idx: uniq.size, n: 0 }); inputs.push("-i", sp); } const u = uniq.get(sp); o.inLabel = `u${u.idx}_${u.n++}`;
  parts.push(`[${o.inLabel}]atrim=start=${(o.trim / FPS).toFixed(4)}:duration=${(dur * o.rate).toFixed(4)},asetpts=PTS-STARTPTS${o.rate !== 1 ? `,atempo=${o.rate}` : ""},volume=${v.toFixed(4)},adelay=${ms}:all=1[a${k}]`);
  mixIn.push(`[a${k}]`);
});
const audio = path.join(work, "audio.aac");
let hasAudio = false;
if (segs.length) {
  const splits = [...uniq.values()].map((u) => `[${u.idx}:a]aresample=48000,${u.n > 1 ? `asplit=${u.n}${Array.from({ length: u.n }, (_, j) => `[u${u.idx}_${j}]`).join("")}` : `anull[u${u.idx}_0]`}`);
  parts.unshift(...splits);
  const fc = parts.join(";\n") + ";\n" + mixIn.join("") + `amix=inputs=${mixIn.length}:duration=longest:normalize=0:dropout_transition=0,aresample=48000,atrim=duration=${(NF / FPS).toFixed(4)}[a]`;
  const fcFile = path.join(work, "audio_fc.txt"); fs.writeFileSync(fcFile, fc);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-threads", "4", ...inputs, "-/filter_complex", fcFile, "-map", "[a]", "-c:a", "aac", "-b:a", "192k", audio]);
  hasAudio = true;
}
timing.audioSec = (Date.now() - t) / 1000;
log(`audio: ${segs.length} segments mixed in ${timing.audioSec.toFixed(1)}s`);

// ---- mux ----
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", video, ...(hasAudio ? ["-i", audio] : []), "-map", "0:v", ...(hasAudio ? ["-map", "1:a"] : []), "-c", "copy", "-movflags", "+faststart", out]);
const T_END = Date.now();
smi.kill(); clearInterval(cpuTimer);
if (!process.env.GR_KEEP_BUNDLE && !KEEP) { try { fs.rmSync(serveUrl, { recursive: true, force: true }); } catch {} }
spawnSync("node", ["tools/clean_temp.mjs"], { cwd: root, stdio: "ignore" });

// ---- report (same fields as hybrid_any, plus the graphics-path counters) ----
const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=codec_name,width,height,nb_frames,duration", "-of", "json", out]).toString());
const comp_fps = /DONE (\d+) frames in ([\d.]+)s/.exec(pyOut);
const profile = /PROFILE (.*)/.exec(pyOut)?.[1];
const graphics = /GRAPHICS (.*)/.exec(pyOut)?.[1];
const rep = {
  engine: "gpu_render", composition: compId, frames: NF, range: [start, end], output: out, sizeMB: +(fs.statSync(out).size / 1e6).toFixed(1), probe: probe.streams,
  totalMinutes: +((T_END - T_START) / 60000).toFixed(2),
  renderMinutes_graphicsPlusComposite: +(timing.graphicsPlusCompositeSec / 60).toFixed(2),
  fpsGraphicsPlusComposite: +(NF / timing.graphicsPlusCompositeSec).toFixed(2),
  fpsEndToEnd: +(NF / ((T_END - T_START) / 1000)).toFixed(2),
  timing, compositor: comp_fps ? { frames: +comp_fps[1], sec: +comp_fps[2] } : null, compositorProfile: profile, graphics: graphics ? JSON.parse(graphics) : null,
  config: { procs: PROCS, windows: WINDOWS, block: BLOCK, underFrames: NU },
  gpuDuringRender: { util: stats(gpuSamples, "gpu", tg0, tc1), encoder: stats(gpuSamples, "enc", tg0, tc1), decoder: stats(gpuSamples, "dec", tg0, tc1), memMB: stats(gpuSamples, "mem", tg0, tc1) },
  cpuDuringRender: stats(cpuSamples, "cpu", tg0, tc1),
  cpuWholeRun: stats(cpuSamples, "cpu", T_START, T_END),
};
const repFile = path.join(root, "render_work", `gpu_render_${compId}_${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
fs.mkdirSync(path.dirname(repFile), { recursive: true });
fs.writeFileSync(repFile, JSON.stringify(rep, null, 2));
console.log(JSON.stringify(rep, null, 2));
log(`DONE → ${out}   (report: ${repFile})`);
logProgress(`DONE ${out}`);
// opening bumper (same rule as hybrid_any): a full render gets a random paper bumper; partial ranges / bumpers / --no-bumper skip it
{
  const partial = Number(arg("start", 0)) !== 0 || arg("end", null) !== null;
  if (!partial && !compId.startsWith("Fasel-") && !process.argv.includes("--no-bumper")) {
    spawnSync("node", ["tools/prepend_bumper.mjs", out, "--name", String(arg("name", path.basename(out, path.extname(out))))], { cwd: root, stdio: "inherit" });
  }
}
process.exit(0);
