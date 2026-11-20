// GPU RENDERER — drop-in replacement of tools/hybrid_any.mjs (which stays as the fallback). Every frame is processed on the GPU:
//   Chromium (Electron, offscreen, D3D11) draws the Remotion graphics on the GPU; each frame leaves Electron as a shared D3D11 texture (no screenshot,
//   no PNG/JPEG, no copy to the CPU), tools/gpu/bridge.dll copies it GPU -> GPU into CUDA, and tools/gpu_compositor.py stacks it over the videos
//   (NVDEC) and encodes on NVENC with the hybrid's exact settings. Same components, same report, same audio mix and bumper as hybrid_any.
//   node tools/gpu_render.mjs --comp SaintRambal-L --out <file.mp4> [--start N --end N] [--under "a-b,…"] [--procs 2 --windows 3 --block 60]
//   [--dump "dir:frame,frame"] [--no-bumper] [--props '<json input props>'] [--scale 0.5 (smaller copy, previews)]
//   Any composition: with <HybridHost> its videos are placed on the GPU; without it the whole frame is the graphics layer over black (as Remotion).
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
const SMALL_JOB = arg("frames", false) !== false || (arg("start", false) !== false && arg("end", false) !== false && Number(arg("end", 0)) - Number(arg("start", 0)) <= 900);   // a short span / scattered frames may run beside another render (user 2026-11-15)
acquireRenderLock("gpu " + compId, { small: SMALL_JOB });
const { projectOf: projectOfComp } = await import("./cut_lazy.mjs");
const EDL = (await import("./cut_lazy.mjs")).edlSetup(compId);   // a tracked project is read from the original through its cut list (tools/gpu/edl_stream.py); any other: the cut video is made current first (tools/cut_lazy.mjs)
if (EDL) process.env.HK_EDL_MAP = EDL.file;   // a FULL render is still one at a time, like every other render entry point
const PROJ = (await import("./lib/projdir.mjs")).projTmp(compId);   /* the project's own temporary folder: work frames and logs go there (user 2026-11-19) */
const out = path.resolve(root, arg("out", `render_work/gpu/${compId}.mp4`));
const logProgress = startMonitor(path.join(PROJ, "logs", `gpu_render_${compId}${process.argv.includes("--frames") ? "_frames" : ""}.log`), path.basename(out, path.extname(out)));   /* a frames run never overwrites the video render's log */
const work = path.join(PROJ, "gpu_work", compId);   // in the project folder (was .tmp/gpu_render/work/<Comp>), 2026-11-19
fs.rmSync(work, { recursive: true, force: true });
fs.mkdirSync(work, { recursive: true });
fs.mkdirSync(path.dirname(out), { recursive: true });
const PORT_BASE = SMALL_JOB ? 47800 + 3 * Math.floor(Math.random() * 600) : 47751;   // a small job beside another render must not collide with its ports
const CTL_PORT = Number(arg("ctl-port", PORT_BASE)), GEOM_PORT = Number(arg("geom-port", PORT_BASE + 1)), HTTP_PORT = Number(arg("http-port", PORT_BASE + 2));
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
    if (e.isDirectory() || (e.isSymbolicLink() && fs.statSync(s).isDirectory())) { if (src === path.join(root, "public") && /^(fr|_vprobe_fr|matte_cache)$/.test(e.name)) continue; sync(s, d); continue; }
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
/* (2026-11-20) a read-only file in public (a font) is copied read-only into the bundle; the next bundle into the same folder then failed (EPERM copyfile):
   every file left in this comp's bundle folders is made writable first */
const unlock = (d) => { try { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const q = path.join(d, e.name); if (e.isDirectory()) unlock(q); else if (e.isFile()) try { fs.chmodSync(q, 0o666); } catch { /* gone */ } } } catch { /* no folder */ } };
for (const b of ["bundle_", "bundle_keep_"]) unlock(path.join(root, ".tmp/gpu_render", b + compId));
const serveUrl = KEEP && KEEP !== true ? path.resolve(root, KEEP) : await bundle({ entryPoint: path.join(root, "src/index.ts"), rspack: true, publicDir: slim, outDir: path.join(root, ".tmp/gpu_render/" + (process.env.GR_KEEP_BUNDLE ? "bundle_keep_" : "bundle_") + compId), onProgress: () => {} });
const linkVideos = (src, dst) => { for (const e of fs.readdirSync(src, { withFileTypes: true })) { const s2 = path.join(src, e.name), d2 = path.join(dst, e.name); if (e.isDirectory() || (e.isSymbolicLink() && fs.statSync(s2).isDirectory())) { fs.mkdirSync(d2, { recursive: true }); linkVideos(s2, d2); } else if (VID.test(e.name) && !fs.existsSync(d2)) { try { fs.linkSync(s2, d2); } catch (err) { log("link failed " + e.name + ": " + err.message); } } } };
if (!KEEP) linkVideos(path.join(root, "public"), path.join(serveUrl, "public"));   // hard links: zero copy (audio assets of <Audio>/<Video> point into the bundle)
timing.bundleSec = (Date.now() - t) / 1000;
if (!process.env.GR_KEEP_BUNDLE && !KEEP) process.on("exit", () => { try { fs.rmSync(serveUrl, { recursive: true, force: true }); } catch {} });
/* --props '<json>' (or env RENDER_PROPS): the composition's own input props (silent reactions, probes…), under the renderer's own keys */
const PROPS = (() => { const s = arg("props", null); const j = s && s !== true ? s : process.env.RENDER_PROPS; try { return j ? JSON.parse(j) : {}; } catch { console.error("--props is not valid JSON"); process.exit(1); } })();
/* BUMPER INSIDE THE MONTAGE (user 2026-11-20: «ما يضاف في طابور الرندر هو يضاف في المونتاج، يعني يضاف داخل المونتاج»): spec.bumper {id, at | end} is drawn by
   the composition itself (src/MontageSpec.tsx, input prop withBumper) exactly as the Studio shows it — the render renders the montage, it splices nothing.
   A full render turns it on; a partial range (--start/--end/--frames) keeps the plain cut timeline of the check tools unless --with-bumper is given. */
const BSPEC_ID = [arg("spec", null), arg("name", null)].find((x) => x && x !== true) ?? projectOfComp(compId);
const BSPEC = (() => { try { return BSPEC_ID ? JSON.parse(fs.readFileSync(path.join(root, "data/specs", `${BSPEC_ID}.json`), "utf8")) : null; } catch { return null; } })();
const BUMP = (() => {
  const b = BSPEC?.bumper; if (!b || b.position === "none" || process.env.BUMPER_POSITION === "none" || process.argv.includes("--no-bumper")) return null;   /* (2026-11-20) reels included: drawn in the montage, never spliced */
  if (["--start", "--end", "--frames"].some((a) => process.argv.includes(a)) && !process.argv.includes("--with-bumper")) return null;
  let man = null; try { man = JSON.parse(fs.readFileSync(path.join(root, "public/fawasel/manifest.json"), "utf8")).bumpers.find((x) => x.id === b.id); } catch { /* none */ }
  /* (user 2026-11-20: «هذا لازم يضاف من قبلك وليس من قبل الرندر») a bumper the montage cannot draw is NOT spliced after the render any more: refused, the montage is fixed */
  if (!man) { console.error(`✘ spec.bumper has no known id («${b.id ?? ""}»): the montage cannot draw it — fix it in the montage (node tools/bumper_at.mjs ${BSPEC_ID} --write) and check it in the Studio. Not rendered.`); process.exit(1); }
  const end = !!b.end || b.position === "end"; if (!end && typeof b.at !== "number") { console.error(`✘ spec.bumper has neither «at» nor end: fix it in the montage (node tools/bumper_at.mjs ${BSPEC_ID} --write). Not rendered.`); process.exit(1); }
  if (BSPEC.kind === "reel" && (BSPEC.frames + 150) / 30 > 179) { console.error(`✘ the reel with its bumper is ${((BSPEC.frames + 150) / 30).toFixed(1)} s, over 179 s (a Short): shorten the montage. Not rendered.`); process.exit(1); }
  return { id: b.id, title: man.title, seconds: 5, at: end ? null : b.at, end, G: end ? BSPEC.frames : Math.round(b.at * 30), N: 150 };
})();
/* (user 2026-11-20) a FULL render of a montage that needs a bumper and has none in it is refused before any frame: the montage gets it first (seen in the Studio) */
if (BSPEC && !BSPEC.bumper && !["paper", "ad", "explainer", "cartoon"].includes(BSPEC.kind) && process.env.BUMPER_POSITION !== "none" && !process.argv.includes("--no-bumper")
  && !["--start", "--end", "--frames"].some((a) => process.argv.includes(a))) {
  console.error(`✘ the montage «${BSPEC_ID}» has no bumper: write it into the montage (node tools/bumper_at.mjs ${BSPEC_ID} --write), check it in the Studio, then render (a montage meant without one: "bumper": {"position": "none"}). Not rendered.`); process.exit(1);
}
const inputProps = { ...PROPS, hybrid: "top", hybridPort: GEOM_PORT, hybridLayers: true, ...(BUMP ? { withBumper: true } : {}) };   /* hybridLayers: <HyLayer>/<VSlot z> active (GPU renderer only) */
const composition = await selectComposition({ serveUrl, id: compId, inputProps, chromiumOptions: { gl: "angle" } });
const W = composition.width, H = composition.height, FPS = composition.fps;
if (BUMP) { if (composition.durationInFrames !== BSPEC.frames + BUMP.N) { console.error(`✘ ${compId} is ${composition.durationInFrames} frames, the montage + its bumper should be ${BSPEC.frames + BUMP.N}: the composition did not take the bumper in — not rendered`); process.exit(1); }
  log(`bumper inside the montage: «${BUMP.title}» frames ${BUMP.G}-${BUMP.G + BUMP.N - 1} (${BUMP.end ? "at the end" : `at ${BUMP.at}s of the cut`})`); }
/* NVENC H.264 refuses tiny frames (measured 2026-11-13: 140×140 "Frame Dimension less than the minimum"): such a composition is an image asset — a still */
if (W < 160 || H < 160) { console.error(`✘ ${compId} is ${W}×${H}: too small for the NVENC video encoder — it is an image asset; render it as a still (node tools/stills.mjs ${compId} <dir> x:0 --scale 1)`); process.exit(2); }
/* --frames "f,f,…" --frames-dir <dir> (2026-11-13): only these scattered frames, each written as a PNG (gp_<frame>.png) into the dir — no video, no audio (check sheets) */
const FRAME_LIST = (() => { const s = arg("frames", null); return s && s !== true ? [...new Set(String(s).split(",").filter(Boolean).map(Number))].filter((f) => f >= 0 && f < composition.durationInFrames).sort((a, b) => a - b) : null; })();
const FRAMES_DIR = FRAME_LIST ? path.resolve(root, String(arg("frames-dir", path.join(work, "frames")))) : null;
if (FRAMES_DIR) fs.mkdirSync(FRAMES_DIR, { recursive: true });
const start = FRAME_LIST ? FRAME_LIST[0] : Number(arg("start", 0)), end = FRAME_LIST ? FRAME_LIST[FRAME_LIST.length - 1] : Math.min(Number(arg("end", composition.durationInFrames - 1)), composition.durationInFrames - 1);
const NF = FRAME_LIST ? FRAME_LIST.length : end - start + 1;
log(`${compId}: ${W}x${H} @${FPS}, frames ${start}-${end} (${NF})`);

// ---- static background (rendered once, as in hybrid_any) ----
t = Date.now();
const bgPng = path.join(work, "bg.png");
/* (2026-11-12) the decorated background (KhBg) has DRIFTING stars, which one static image froze: its three parts are rendered apart too (hyBgPart,
   src/KhKit.tsx) and the compositor drifts the stars every frame between the gradient and the vignette. No KhBg in the background = an empty stars
   image, and the compositor keeps the plain static background. One browser for the four stills. */
const bgParts = { base: path.join(work, "bg_base.png"), stars: path.join(work, "bg_stars.png"), vignette: path.join(work, "bg_vignette.png") };
{
  const { openBrowser } = await import("@remotion/renderer");
  const browser = await openBrowser("chrome", { chromiumOptions: { gl: "angle" } });
  try {
    await renderStill({ composition, serveUrl, inputProps: { ...inputProps, hybrid: "bg" }, output: bgPng, imageFormat: "png", frame: start, chromiumOptions: { gl: "angle" }, overwrite: true, puppeteerInstance: browser });
    for (const [part, file] of Object.entries(bgParts))
      await renderStill({ composition, serveUrl, inputProps: { ...inputProps, hybrid: "bg", hyBgPart: part }, output: file, imageFormat: "png", frame: start, chromiumOptions: { gl: "angle" }, overwrite: true, puppeteerInstance: browser });
  } finally { await browser.close({ silent: true }).catch(() => {}); }
}
timing.bgSec = (Date.now() - t) / 1000;

// ---- the bundle is served by @remotion/renderer's OWN server (RenderInternals.prepareServer, as renderFrames does): same files, and its /proxy
//      endpoint extracts frames for any <OffthreadVideo> still left in the graphics layer (FatimaSheikhayn-L uses one at frame 0), exactly as in
//      the hybrid. Page and proxy share the origin http://localhost:<port>, so no CORS. --own-server = the minimal static server below (no /proxy).
let pageUrl, proxyPort, closeRemotionServer = null;
if (!process.argv.includes("--own-server")) {
  const { RenderInternals } = await import("@remotion/renderer");
  const srv = await RenderInternals.prepareServer({ webpackConfigOrServeUrl: serveUrl, port: HTTP_PORT, remotionRoot: root, offthreadVideoThreads: 2, logLevel: "error", indent: false, offthreadVideoCacheSizeInBytes: null, binariesDirectory: null, forceIPv4: false, sampleRate: composition.defaultSampleRate ?? 48000 });
  pageUrl = srv.serveUrl.replace(/\/$/, ""); proxyPort = srv.offthreadPort; closeRemotionServer = srv.closeServer;
  log(`bundle served by Remotion's server at ${pageUrl} (proxy port ${proxyPort})`);
}
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
if (!pageUrl) { await new Promise((res) => server.listen(HTTP_PORT, "127.0.0.1", res)); pageUrl = `http://127.0.0.1:${HTTP_PORT}`; proxyPort = HTTP_PORT; }

// ---- parity guard: the compositing code (rrect_sdf … draw_slot) is a copy of tools/hybrid_generic.py; warn loudly when the hybrid changed it ----
{
  const part = (file) => {
    const t = fs.readFileSync(path.join(root, file), "utf8").replace(/\r/g, "");
    const a = t.indexOf("\ndef rrect_sdf"), b = t.indexOf("\n# ---------------- encoder");
    if (a < 0 || b < a) return null;
    return t.slice(a, b).split("\n").map((l) => l.replace(/#.*$/, "").trimEnd()).filter(Boolean).join("\n");   /* comments ignored */
  };
  const h = part("tools/hybrid_generic.py"), g = part("tools/gpu_compositor.py");
  if (!h || h !== g) log("WARNING: the compositing functions of tools/gpu_compositor.py differ from tools/hybrid_generic.py (rrect_sdf … draw_slot): port the hybrid change before trusting the look");
}
// ---- the D3D11 -> CUDA bridge (tools/gpu/bridge.cpp) is built from source with Visual Studio 2022 when missing ----
if (!fs.existsSync(path.join(root, "tools/gpu/bridge.dll"))) {
  log("building tools/gpu/bridge.dll (Visual Studio 2022)…");
  const r = spawnSync("cmd", ["/c", path.join(root, "tools/gpu/build_bridge.bat").split("/").join("\\")], { cwd: root, stdio: "inherit", windowsHide: true });
  if (r.status !== 0 || !fs.existsSync(path.join(root, "tools/gpu/bridge.dll"))) { console.error("could not build tools/gpu/bridge.dll"); process.exit(1); }
}
// ---- compositor ----
/* (2026-11-20, mufti-hiraba) without --under the maps under him were simply not drawn: the check sheets (grid_sheet, peek) showed no map and him twice
   while the export (render_job.sh passes --under) would have them — a check that shows another picture than the export. Not given → computed here,
   the same way render_job.sh does (tools/window_frames.mjs <p> under <o>). --under "" (explicitly empty) keeps it off. */
const underArg = (() => {
  if (process.argv.includes("--under")) return String(arg("under", "") === true ? "" : arg("under", ""));
  try { const pj = projectOfComp(compId); if (!pj) return ""; const r = spawnSync(process.execPath, ["tools/window_frames.mjs", pj, "under", /-L$|Both/i.test(compId) ? "L" : "R"], { encoding: "utf8", cwd: root }); return r.status === 0 ? r.stdout.trim().split(/\s+/).pop() ?? "" : ""; } catch { return ""; }
})();
/* the under-him windows are frames of the CUT timeline (tools/window_frames.mjs): with the bumper inside the montage every frame from G on moves by 150 */
const bShift = ([a, b]) => (!BUMP || BUMP.end || b < BUMP.G ? [[a, b]] : a >= BUMP.G ? [[a + BUMP.N, b + BUMP.N]] : [[a, BUMP.G - 1], [BUMP.G + BUMP.N, b + BUMP.N]]);
const UNDER = String(underArg).split(",").filter(Boolean).map((r) => r.split("-").map(Number)).flatMap(bShift).map(([a, b]) => [Math.max(a, start), Math.min(b, end)]).filter(([a, b]) => b >= a);
const NU = UNDER.reduce((n, [a, b]) => n + b - a + 1, 0);
if (NU) log(`under-him layer: ${NU} frames (${UNDER.map(([a, b]) => a + "-" + b).join(", ")})`);
const LEVELS = Math.max(0, Number(arg("levels", 3)) || 0);
const PROCS = Math.max(1, Number(arg("procs", 2)) || 1), WINDOWS = Math.max(1, Number(arg("windows", 3)) || 1), BLOCK = Math.max(5, Number(arg("block", 60)) || 60);
log("starting the GPU compositor…");
const video = path.join(work, "video_noaudio.mp4");
const dump = arg("dump", null);
const comp_py = spawn(PY, ["-u", "tools/gpu_compositor.py", "--ctl", String(CTL_PORT), "--workers", String(PROCS), "--block", String(BLOCK), "--lookahead", String(arg("lookahead", 240)), "--geom", String(GEOM_PORT), "--out", video, "--bg", bgPng, "--bg-parts", `${bgParts.base}|${bgParts.stars}|${bgParts.vignette}`, "--public", `${root}/public`, "--w", String(W), "--h", String(H), "--fps", String(FPS), "--start", String(start), "--end", String(end), ...(NU ? ["--under", UNDER.map(([a, b]) => a + "-" + b).join(",")] : []), ...(FRAME_LIST ? ["--frames", FRAME_LIST.join(","), "--dump", FRAMES_DIR.replace(/\\/g, "/") + ":"] : dump && dump !== true ? ["--dump", dump] : [])], { cwd: root, stdio: ["ignore", "pipe", "inherit"] });
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
  /* one window per extra layer level below the videos (<HyLayer z>); they only work for the frames whose geometry asks for their level */
  if (p === 0) for (let k = 0; k < LEVELS; k++) wins.push({ mode: "below", level: k, inputProps: ser({ ...inputProps, hybrid: "below", hybridLevel: k }), initialFrame: start });
  const cfgFile = path.join(work, `worker_${p}.json`);
  fs.writeFileSync(cfgFile, JSON.stringify({ url: pageUrl, compId: composition.id, bundleMode, width: W, height: H, markRows: 8, ctlPort: CTL_PORT, proxyPort, timeout: 180000, mediaCache: null, sampleRate: composition.defaultSampleRate ?? 48000, windows: wins, windowBase: wBase, workDir: work, paintRate: Number(arg("paint-rate", 240)) }));
  wBase += wins.length;
  const ew = spawn(ELECTRON, [path.join(root, "tools/gpu/electron_worker.cjs"), cfgFile], { cwd: root, stdio: ["ignore", "inherit", "inherit"], env: { ...process.env, ELECTRON_ENABLE_LOGGING: "" }, windowsHide: true });
  ew.on("exit", (c) => { if (c) log(`electron worker ${p} exited with ${c}`); });
  workers.push(ew);
}
log(`graphics: ${PROCS} Electron process(es) × ${WINDOWS} offscreen windows${NU ? " + 1 under-him window" : ""}, blocks of ${BLOCK} frames`);
await exited;
const tc1 = Date.now();
timing.graphicsPlusCompositeSec = (tc1 - tg0) / 1000;
/* (2026-11-12) wait for EVERY Electron worker to exit on its own (each writes assets_<pid>_<k>.json on "quit"): killing them after 0.5 s lost the second
   process's audio records → the first 6 s and ~20 blocks of all four delivered videos were silent */
await Promise.all(workers.map((w) => (w.exitCode !== null ? null : new Promise((r) => { const t = setTimeout(r, 60000); w.once("exit", () => { clearTimeout(t); r(); }); }))));
killWorkers();
if (server.listening) server.close();
if (closeRemotionServer) { try { await closeRemotionServer(); } catch {} }
if (FRAME_LIST) {
  smi.kill(); clearInterval(cpuTimer);
  log(`DONE ${NF} frames → ${FRAMES_DIR} in ${((Date.now() - T_START) / 1000).toFixed(1)} s (graphics + composite ${timing.graphicsPlusCompositeSec.toFixed(1)} s, bundle ${timing.bundleSec.toFixed(1)} s, background ${timing.bgSec.toFixed(1)} s)`);
  logProgress(`DONE ${FRAMES_DIR}`);
  process.exit(0);
}

// ---- audio: same mix as hybrid_any, from the audio assets each window collected (window.remotion_collectAssets, as renderFrames does) ----
t = Date.now();
const frames = [];
for (const f of fs.readdirSync(work)) if (/^assets_.*\.json$/.test(f)) frames.push(...JSON.parse(fs.readFileSync(path.join(work, f), "utf8")));
frames.sort((a, b) => a.frame - b.frame);
/* every rendered frame must have its audio record: a missing block = silent audio there. Refuse to mux instead of delivering a silent stretch (2026-11-12) */
{ const have = new Set(frames.map((f) => f.frame)), miss = []; for (let f = start; f <= end; f++) if (!have.has(f)) miss.push(f);
  if (miss.length) { console.error(`✘ audio records missing for ${miss.length} frame(s) (first ${miss.slice(0, 5).join(", ")}): a graphics worker did not write its assets — the audio would be silent there. Not muxing.`); process.exit(1); } }
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
  const sp0 = toPath(o.src), sp = EDL?.audio && path.resolve(sp0).toLowerCase() === path.resolve(EDL.heavy).toLowerCase() ? EDL.audio : sp0; if (!uniq.has(sp)) { uniq.set(sp, { idx: uniq.size, n: 0 }); inputs.push("-i", sp); } const u = uniq.get(sp); o.inLabel = `u${u.idx}_${u.n++}`;
  parts.push(`[${o.inLabel}]atrim=start=${(o.trim / FPS).toFixed(4)}:duration=${(dur * o.rate).toFixed(4)},asetpts=PTS-STARTPTS${o.rate !== 1 ? `,atempo=${o.rate}` : ""},volume=${v.toFixed(4)},adelay=${ms}:all=1[a${k}]`);
  mixIn.push(`[a${k}]`);
});
const audio = path.join(work, "audio.aac");
let hasAudio = false;
if (segs.length) {
  const splits = [...uniq.values()].map((u) => `[${u.idx}:a]aresample=48000,${u.n > 1 ? `asplit=${u.n}${Array.from({ length: u.n }, (_, j) => `[u${u.idx}_${j}]`).join("")}` : `anull[u${u.idx}_0]`}`);
  parts.unshift(...splits);
  const fc = parts.join(";\n") + ";\n" + mixIn.join("") + `amix=inputs=${mixIn.length}:duration=longest:normalize=0:dropout_transition=0,aresample=48000,apad=whole_dur=${(NF / FPS).toFixed(4)},atrim=duration=${(NF / FPS).toFixed(4)}[a]`;   /* (2026-11-20) padded with silence to the picture: a bumper whose own sound is shorter (shelf: 3.84 s) left the file's audio 1.1 s short */
  const fcFile = path.join(work, "audio_fc.txt"); fs.writeFileSync(fcFile, fc);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-threads", "4", ...inputs, "-/filter_complex", fcFile, "-map", "[a]", "-c:a", "aac", "-b:a", "192k", audio]);
  hasAudio = true;
}
timing.audioSec = (Date.now() - t) / 1000;
log(`audio: ${segs.length} segments mixed in ${timing.audioSec.toFixed(1)}s`);

// ---- mux ----
/* --scale k (previews, the old render_clip SCALE=0.5): the picture is resized on the GPU (scale_cuda) and re-encoded on NVENC; 1 = the stream as encoded */
const SCALE = Number(arg("scale", 1)) || 1;
const vcodec = SCALE === 1 ? ["-c:v", "copy"] : ["-vf", `scale_cuda=${2 * Math.round((W * SCALE) / 2)}:${2 * Math.round((H * SCALE) / 2)}`, "-c:v", "h264_nvenc", "-preset", "p4", "-cq", "23"];
execFileSync("ffmpeg", ["-v", "error", "-y", ...(SCALE === 1 ? [] : ["-hwaccel", "cuda", "-hwaccel_output_format", "cuda"]), "-i", video, ...(hasAudio ? ["-i", audio] : []), "-map", "0:v", ...(hasAudio ? ["-map", "1:a"] : []), ...vcodec, ...(hasAudio ? ["-c:a", "copy"] : []), "-threads", "4", "-movflags", "+faststart", out]);
const T_END = Date.now();
smi.kill(); clearInterval(cpuTimer);
if (!process.env.GR_KEEP_BUNDLE && !KEEP) { try { fs.rmSync(serveUrl, { recursive: true, force: true }); } catch {} }
spawnSync("node", ["tools/clean_temp.mjs"], { cwd: root, stdio: "ignore" });

// ---- videos that were still decoded by Chromium (not on the GPU path): listed in the report and shouted in the log ----
const chromeVideo = {};
for (const f of fs.readdirSync(work)) if (/^chromevideo_.*.json$/.test(f)) for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(path.join(work, f), "utf8")))) { const c = (chromeVideo[k] ??= { frames: 0, first: v.first, last: v.last }); c.frames += v.frames; c.first = Math.min(c.first, v.first); c.last = Math.max(c.last, v.last); }
if (Object.keys(chromeVideo).length) log("WARNING: videos still decoded by Chromium, not on the GPU path (port them to <VSlot>): " + JSON.stringify(chromeVideo));
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
  chromeVideo, config: { procs: PROCS, windows: WINDOWS, block: BLOCK, underFrames: NU },
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
  const partial = start !== 0 || end < composition.durationInFrames - 1;   /* an --end equal to the last frame is still a full render */
  /* (user 2026-11-18, rules review) the bumper comes from the montage: spec.bumper {id?, at?, position: start|end|none} of --spec <p> (else --name <p>) wins;
     without it the env from render_job.sh (BUMPER_POSITION/AT/ID), else the legacy default with a warning; kinds paper/ad/explainer/cartoon → none */
  const specId = [arg("spec", null), arg("name", null)].find((x) => x && x !== true);
  let spec = null; try { spec = specId ? JSON.parse(fs.readFileSync(path.join(root, "data/specs", `${specId}.json`), "utf8")) : null; } catch { /* no spec */ }
  /* (2026-11-20) a spec.bumper with `at` and no position (the Studio writes {id, at}) is a break AT that second: it was ignored and the legacy default put it at the END */
  const sb = spec?.bumper && ["start", "end", "none"].includes(spec.bumper.position) ? spec.bumper : spec?.bumper && Number(spec.bumper.at) > 0 ? { ...spec.bumper, position: "start" } : null;
  const bEnv = { BUMPER_POSITION: process.env.BUMPER_POSITION ?? "", BUMPER_AT: process.env.BUMPER_AT ?? "", BUMPER_ID: process.env.BUMPER_ID ?? "" };
  if (sb) { bEnv.BUMPER_POSITION = sb.position; if (sb.at != null) bEnv.BUMPER_AT = String(sb.at); if (sb.id) bEnv.BUMPER_ID = String(sb.id); if (sb.position === "end") bEnv.BUMPER_AT = ""; }
  /* (user 2026-11-20: «هذا لازم يضاف من قبلك وليس من قبل الرندر») the bumper is a MONTAGE decision written in the spec (tools/bumper_at.mjs --write, seen in
     the Studio): the render never invents one. No spec.bumper (and no explicit BUMPER_* from render_job.sh) = no bumper, said loudly; the old «legacy default»
     put a random bumper at the END of mufti-hiraba although the montage had it at 0:44 */
  else if (!bEnv.BUMPER_POSITION) { bEnv.BUMPER_POSITION = "none"; if (spec && !["paper", "ad", "explainer", "cartoon"].includes(spec?.kind)) log("✘ no spec.bumper: the montage has no bumper — none added (write it: node tools/bumper_at.mjs <p> --write, check it in the Studio)"); }
  if (bEnv.BUMPER_POSITION === "none" && !partial) log("bumper: none (spec.bumper / kind) — no bumper added");
  if (BUMP) {   /* the bumper is already in the montage: nothing spliced. For the gates (final_review, judder on the bumper-free picture) the same record
                   prepend_bumper wrote, and the bumper-free copy the judder gate reads (.tmp/<root>/bumper_orig/<file>) */
    if (!partial) {
      /* (user 2026-11-20: «كل حلقة لازم تكون بياناتها المؤقتة في مكان واحد») the copy lives in the project's folder .tmp/<root>/bumper_orig/, not the shared .tmp/bumper_orig */
      const name = String(arg("name", path.basename(out, path.extname(out)))), keepDir = path.join(PROJ, "bumper_orig"); fs.mkdirSync(keepDir, { recursive: true });
      const orig = path.join(keepDir, path.basename(out)), a0 = BUMP.G / FPS, a1 = (BUMP.G + BUMP.N) / FPS;
      const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-i", out, "-vf", `select='not(between(n,${BUMP.G},${BUMP.G + BUMP.N - 1}))',setpts=N/FRAME_RATE/TB`, "-af", `aselect='not(between(t,${a0},${a1 - 1e-4}))',asetpts=N/SR/TB`,
        "-c:v", "h264_nvenc", "-preset", "p5", "-cq", "18", "-c:a", "aac", "-b:a", "192k", orig], { cwd: root, stdio: "inherit" });
      if (r.status !== 0) log("✘ bumper-free check copy failed: the judder gate will read the full file");
      const { contentId } = await import("./cut_model.mjs");
      const gate = path.join(root, ".tmp", "gates", `${name}.bumper.json`); fs.mkdirSync(path.dirname(gate), { recursive: true });
      fs.writeFileSync(gate, JSON.stringify({ id: BUMP.id, title: BUMP.title, seconds: BUMP.seconds, originalSize: r.status === 0 ? fs.statSync(orig).size : null, originalId: r.status === 0 ? contentId(orig) : null, orig: r.status === 0 ? path.relative(root, orig).replace(/\\/g, "/") : null, size: fs.statSync(out).size, at: BUMP.end ? +(BSPEC.frames / FPS).toFixed(3) : BUMP.at, position: BUMP.end ? "end" : "start", inMontage: true, date: new Date().toISOString() }, null, 2));
      try { const mf = path.join(root, "public/fawasel/manifest.json"), d = JSON.parse(fs.readFileSync(mf, "utf8")); d.last = BUMP.id; fs.writeFileSync(mf, JSON.stringify(d, null, 2) + "\n"); } catch { /* ignore */ }
      log(`bumper: rendered inside the montage («${BUMP.title}» at ${BUMP.end ? "the end" : BUMP.at + "s"}); gate ${path.relative(root, gate)}`);
    }
  } else if (BSPEC && !partial && bEnv.BUMPER_POSITION !== "none") {
    log("✘ a bumper was asked from outside the montage (render queue / env): ignored — the render never splices one into a montage (user 2026-11-20)");
  } else if (!BSPEC && !partial && bEnv.BUMPER_POSITION !== "none" && !compId.startsWith("Fasel-") && !/^(Stick|Dodo)-/.test(compId) && !process.argv.includes("--no-bumper")) {
    /* render_job.sh sets BUMPER_AT (seconds: before his first greeting, tools/bumper_at.mjs) and BUMPER_ID (the bumper chosen for this project); BUMPER_POSITION=end is read by prepend_bumper itself — same arguments as hybrid_any */
    spawnSync("node", ["tools/prepend_bumper.mjs", out, "--name", String(arg("name", path.basename(out, path.extname(out)))),
      ...(Number(bEnv.BUMPER_AT) > 0 ? ["--at", String(bEnv.BUMPER_AT)] : []), ...(bEnv.BUMPER_ID ? ["--id", bEnv.BUMPER_ID] : [])], { cwd: root, stdio: "inherit", env: { ...process.env, ...bEnv } });
  }
}
process.exit(0);
