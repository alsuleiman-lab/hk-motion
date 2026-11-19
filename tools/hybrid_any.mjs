// GENERIC GPU HYBRID RENDER — one command renders ANY composition that uses <HybridHost> / <VSlot> / <HybridBg> (src/hybrid/Slot.tsx).
//   node tools/hybrid_any.mjs --comp EU-Protests-Landscape --out "C:/Users/mshms/Videos/جاهز/عرضي/أساسية/<العنوان>.mp4" [--start 0] [--end N] [--conc 3] [--browsers 3 (default) --block 150] [--report render_work/x]
// Remotion draws ONLY the graphics (transparent PNG frames, no video decoding) and reports each video slot's on-screen matrix per frame;
// tools/hybrid_generic.py decodes the videos on NVDEC, composites on CUDA and encodes on NVENC. Audio is mixed by ffmpeg from the assets Remotion registered.
// Writes a measurement report (time, GPU/encoder/decoder utilisation sampled by nvidia-smi, CPU) next to the output.
import { execFileSync, spawn, spawnSync } from "node:child_process";
import net from "node:net";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderFrames, renderStill, selectComposition } from "@remotion/renderer";
import { startMonitor } from "./monitor.mjs";
import { acquireRenderLock } from "./render_lock.mjs";

process.env.TEMP = process.env.TMP = "S:/AI_Tools/Remotion_Workspace/.tmp"; // project rule: never write temp files to C:
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i < 0 ? d : (process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : true); };
const root = path.resolve(import.meta.dirname, "..").replace(/\\/g, "/");
const compId = arg("comp", null);
if (!compId || compId === true) { console.error("usage: node tools/hybrid_any.mjs --comp <CompositionId> --out <file.mp4> [--start N --end N --conc 3 --dump 'dir:frames,...']"); process.exit(1); }
process.chdir(root);
const PARENT = process.env.HYBRID_PARENT_LOCK;   // set by tools/hybrid_parallel.mjs, which holds the render lock for the whole job
let parentOk = false; try { parentOk = !!PARENT && JSON.parse(fs.readFileSync(".tmp/render.lock", "utf8")).pid === Number(PARENT); } catch { /* no lock */ }
if (!parentOk) acquireRenderLock("hybrid " + compId);
(await import("./cut_lazy.mjs")).ensureCutForComp(compId);   // the cut video matches the cut list (tools/cut_lazy.mjs)   // one render at a time, like every other render entry point
const out = path.resolve(root, arg("out", `render_work/hybrid/${compId}.mp4`));
const PART = arg("part", "") === true ? "" : String(arg("part", ""));
const logProgress = startMonitor(path.join((await import("./lib/projdir.mjs")).projTmp(compId, "logs"), `hybrid_any_${compId}${PART ? "_p" + PART : ""}.log`), path.basename(out, path.extname(out)));
const work = path.join(root, ".tmp/hybrid_any", compId + (PART ? "_p" + PART : ""));
fs.mkdirSync(work, { recursive: true });
fs.mkdirSync(path.dirname(out), { recursive: true });
const PNG_PORT = Number(arg("png-port", 47741)), GEOM_PORT = Number(arg("geom-port", 47742));
const PY = "S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe";
const log = (m) => console.log(`[hybrid-any ${new Date().toLocaleTimeString()}] ${m}`);
try { os.setPriority(process.pid, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch {} // Chrome children inherit: keeps the machine responsive (project rule)
const T_START = Date.now();
const timing = {};

// ---- GPU / CPU sampler (nvidia-smi once a second + os.cpus deltas) ----
const gpuSamples = [], cpuSamples = [];
const smi = spawn("nvidia-smi", ["--query-gpu=utilization.gpu,utilization.encoder,utilization.decoder,memory.used", "--format=csv,noheader,nounits", "-l", "1"], { stdio: ["ignore", "pipe", "ignore"] });
let smiBuf = "";
smi.stdout.on("data", (d) => { smiBuf += d; const L = smiBuf.split("\n"); smiBuf = L.pop(); for (const l of L) { const v = l.split(",").map(Number); if (v.length === 4 && !v.some(isNaN)) gpuSamples.push({ t: Date.now(), gpu: v[0], enc: v[1], dec: v[2], mem: v[3] }); } });
let lastCpu = os.cpus().map((c) => ({ ...c.times }));
const cpuTimer = setInterval(() => { const now = os.cpus().map((c) => ({ ...c.times })); let busy = 0, tot = 0; now.forEach((c, i) => { const p = lastCpu[i]; const d = (k) => c[k] - p[k]; const all = d("user") + d("nice") + d("sys") + d("idle") + d("irq"); tot += all; busy += all - d("idle"); }); lastCpu = now; if (tot) cpuSamples.push({ t: Date.now(), cpu: (100 * busy) / tot }); }, 1000);
const stats = (arr, key, t0, t1) => { const v = arr.filter((s) => s.t >= t0 && s.t <= t1).map((s) => s[key]); if (!v.length) return null; v.sort((a, b) => a - b); return { mean: +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1), median: v[Math.floor(v.length / 2)], p95: v[Math.floor(v.length * 0.95)], max: v[v.length - 1], n: v.length }; };

// ---- slim public dir: everything small except videos (videos are decoded by NVDEC from the real public/, never by Chrome) ----
const slim = path.join(root, ".tmp/hybrid_any/public_slim");
const VID = /\.(mp4|mov|webm|mkv|avi|m4v)$/i;
const sync = (src, dst) => {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory() || (e.isSymbolicLink() && fs.statSync(s).isDirectory())) { if (src === path.join(root, "public") && /^(fr|_vprobe_fr|matte_cache)$/.test(e.name)) continue; sync(s, d); continue; }   // fr/ = extracted JPEG frames (tens of GB, never used by the hybrid)
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
const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts"), rspack: true, publicDir: slim, outDir: path.join(root, ".tmp/hybrid_any/bundle_" + compId + (PART ? "_p" + PART : "")), onProgress: () => {} });
// Chrome never plays the videos, but Remotion downloads the files of <Audio> elements from the bundle: hard-link (zero copy) the real videos into it
const linkVideos = (src, dst) => { for (const e of fs.readdirSync(src, { withFileTypes: true })) { const s2 = path.join(src, e.name), d2 = path.join(dst, e.name); if (e.isDirectory() || (e.isSymbolicLink() && fs.statSync(s2).isDirectory())) { fs.mkdirSync(d2, { recursive: true }); linkVideos(s2, d2); } else if (VID.test(e.name) && !fs.existsSync(d2)) { try { fs.linkSync(s2, d2); } catch (err) { log("link failed " + e.name + ": " + err.message); } } } };
linkVideos(path.join(root, "public"), path.join(serveUrl, "public"));
// --fr name1,name2 : hard-link these extracted-frame folders (public/fr/<name>) into the bundle for <MaskedVideo> windows (his isolated cut-out is drawn by Remotion into the graphics layer; it needs JPEG frames of the cut and of each matte)
const FR = String(arg("fr", "")).split(",").filter(Boolean);
for (const d of FR) { const sd = path.join(root, "public/fr", d), dd = path.join(serveUrl, "public/fr", d); fs.mkdirSync(dd, { recursive: true }); for (const f of fs.readdirSync(sd)) { try { fs.linkSync(path.join(sd, f), path.join(dd, f)); } catch { fs.copyFileSync(path.join(sd, f), path.join(dd, f)); } } }
timing.bundleSec = (Date.now() - t) / 1000;
process.on("exit", () => { try { fs.rmSync(serveUrl, { recursive: true, force: true }); } catch {} });   // a failed run must not leave a 30-60 GB bundle behind (disk filled 2026-11-09)
const inputProps = { hybrid: "top", hybridPort: GEOM_PORT, ...(FR.length ? { frames: true } : {}) };
const composition = await selectComposition({ serveUrl, id: compId, inputProps, chromiumOptions: { gl: "angle" } });
const W = composition.width, H = composition.height, FPS = composition.fps;
const start = Number(arg("start", 0)), end = Math.min(Number(arg("end", composition.durationInFrames - 1)), composition.durationInFrames - 1);
const NF = end - start + 1;
log(`${compId}: ${W}x${H} @${FPS}, frames ${start}-${end} (${NF})`);

// ---- static background (rendered once) ----
t = Date.now();
const bgPng = path.join(work, "bg.png");
await renderStill({ composition, serveUrl, inputProps: { hybrid: "bg", hybridPort: GEOM_PORT }, output: bgPng, imageFormat: "png", frame: start, chromiumOptions: { gl: "angle" }, overwrite: true });
timing.bgSec = (Date.now() - t) / 1000;

// ---- compositor ----
log("starting the GPU compositor…");
const video = path.join(work, "video_noaudio.mp4");
const dump = arg("dump", null);
const comp_py = spawn(PY, ["-u", "tools/hybrid_generic.py", "--listen", String(PNG_PORT), "--geom", String(GEOM_PORT), "--out", video, "--bg", bgPng, "--public", `${root}/public`, "--w", String(W), "--h", String(H), "--fps", String(FPS), "--start", String(start), "--end", String(end), ...(dump && dump !== true ? ["--dump", dump] : [])], { cwd: root, stdio: ["ignore", "pipe", "inherit"], env: { ...process.env, HY_UNDER: String(arg("under", "")).length > 1 ? "1" : "0" } });
try { os.setPriority(comp_py.pid, os.constants.priority.PRIORITY_ABOVE_NORMAL); } catch {} // the feeding thread must never be starved by Chrome
let ready; const readyP = new Promise((res) => (ready = res));
let pyOut = "";
comp_py.stdout.on("data", (d) => { const s = d.toString(); pyOut += s; process.stdout.write(s); if (s.includes("READY")) ready(); });
const exited = new Promise((res, rej) => comp_py.on("exit", (c) => (c === 0 ? res() : rej(new Error("compositor exit " + c)))));
exited.catch((e) => { console.error("the compositor stopped: " + e.message); process.exit(1); });
await Promise.race([readyP, exited]);
const sock = net.connect(PNG_PORT, "127.0.0.1");
await new Promise((res) => sock.on("connect", res));
let sockEnded = false;
sock.on("error", (e) => { if (sockEnded) return; console.error("compositor socket: " + e.message); process.exit(1); });   // ECONNRESET after the compositor closed (2026-11-11) crashed the mux step

// ---- graphics layer ----
log("rendering the graphics layer (Remotion, transparent PNG, no video decoding)…");
const tg0 = Date.now();
let sent = 0;
let lastPercent = -1;
const conc = arg("conc", null);
const CONC = conc && conc !== true ? Number(conc) : 3;
// --browsers K (2026-11-11): K independent Chromium instances render at the same time. One Chromium is latency-bound (each tab waits
// ~200 ms per frame while using little CPU) and extra tabs barely help, but separate browsers do (measured on Mufti-Iraq-L: 3×3 = 22–23 fps
// vs 11–15 for 1×3; full hybrid A/B under load 2026-11-11: 86 s vs 126 s for 900 frames). The range is handed out in blocks of --block frames
// (default 150; smaller blocks cost more because every renderFrames call reopens its pages). Default 3 since the compositor was pipelined
// (2026-11-11); --browsers 1 = the original single call.
const BROWSERS = Math.max(1, Number(arg("browsers", 3)) || 1), BLOCK = Math.max(10, Number(arg("block", 150)) || 150);
/* --under "a-b,c-d" (2026-11-12): frames that also need the UNDER-HIM layer (graphics drawn below his GPU cut-out: a map in an isolation window). They are
   rendered a second time with {hybrid:"under"} and sent with bit 31 set on the frame number; the compositor stacks videos → under → cut-out → top. */
const UNDER = String(arg("under", "") === true ? "" : arg("under", "")).split(",").filter(Boolean).map((r) => r.split("-").map(Number)).map(([a, b]) => [Math.max(a, start), Math.min(b, end)]).filter(([a, b]) => b >= a);
const NU = UNDER.reduce((n, [a, b]) => n + b - a + 1, 0);
if (NU) log(`under-him layer: ${NU} frames (${UNDER.map(([a, b]) => a + "-" + b).join(", ")})`);
const onFrameBufferUnder = (buf, frame) => { const h = Buffer.alloc(8); h.writeUInt32LE((frame | 0x80000000) >>> 0, 0); h.writeUInt32LE(buf.length, 4); sock.write(h); sock.write(buf); };
const onFrameBuffer = (buf, frame) => { const h = Buffer.alloc(8); h.writeUInt32LE(frame, 0); h.writeUInt32LE(buf.length, 4); sock.write(h); sock.write(buf); sent++; const percent = Math.floor(sent / NF * 100); if (percent !== lastPercent) { lastPercent = percent; logProgress(`[جزء 1/1] ${percent}%`); } if (sent % 600 === 0) log(`graphics ${sent}/${NF}  ${(sent / ((Date.now() - tg0) / 1000)).toFixed(1)} fps`); };
const renderRange = (a, b, puppeteerInstance, under = false) => renderFrames({
  composition, serveUrl, inputProps: under ? { ...inputProps, hybrid: "under" } : inputProps, imageFormat: "png", outputDir: null, concurrency: CONC, frameRange: [a, b], chromiumOptions: { gl: "angle" }, logLevel: "error", timeoutInMilliseconds: 180000,
  onFrameUpdate: () => {}, onFrameBuffer: under ? onFrameBufferUnder : onFrameBuffer, ...(puppeteerInstance ? { puppeteerInstance } : {}),
});
let assetsInfo;
if (BROWSERS === 1) { for (const [a, b] of UNDER) await renderRange(a, b, undefined, true); ({ assetsInfo } = await renderRange(start, end)); }
else {
  const { openBrowser } = await import("@remotion/renderer");
  log(`graphics: ${BROWSERS} browsers × ${CONC} tabs, blocks of ${Math.max(30, Math.min(BLOCK, Math.ceil(NF / BROWSERS)))} frames`);
  const B = Math.max(30, Math.min(BLOCK, Math.ceil(NF / BROWSERS)));   // a short patch span is still shared by every browser
  const blocks = []; for (let a = start; a <= end; a += B) blocks.push([a, Math.min(end, a + B - 1), false]);
  for (const [ua, ub] of UNDER) for (let a = ua; a <= ub; a += B) blocks.push([a, Math.min(ub, a + B - 1), true]);
  blocks.sort((p, q) => p[0] - q[0] || (q[2] ? 1 : 0) - (p[2] ? 1 : 0));   // in frame order, the under block of a span just before its top block
  const browsers = await Promise.all(Array.from({ length: BROWSERS }, () => openBrowser("chrome", { logLevel: "error", chromiumOptions: { gl: "angle" } })));
  const all = []; let next = 0;
  const worker = async (br, wi) => { while (next < blocks.length) { const [a, b, u] = blocks[next++]; let tries = 0; for (;;) { try { const tb = Date.now(); const r = await renderRange(a, b, br, u); if (!u) all.push(...r.assetsInfo.assets); if (arg("block-log", false)) log(`  browser ${wi}: block ${a}-${b} in ${((Date.now() - tb) / 1000).toFixed(1)}s`); break; } catch (e) { if (++tries >= 3) throw e; log(`block ${a}-${b} failed (${e.message.split("\n")[0]}), retry ${tries}`); } } } };
  try { await Promise.all(browsers.map((br, wi) => worker(br, wi))); } finally { await Promise.all(browsers.map((br) => br.close({ silent: true }).catch(() => {}))); }
  assetsInfo = { assets: all };
}
sockEnded = true; sock.end();
const tg1 = Date.now();
timing.graphicsSec = (tg1 - tg0) / 1000;
log(`graphics done in ${timing.graphicsSec.toFixed(0)}s — waiting for the compositor`);
await exited;
const tc1 = Date.now();
timing.graphicsPlusCompositeSec = (tc1 - tg0) / 1000;

// ---- audio: mix the audio assets Remotion registered (no extra Chrome pass) ----
t = Date.now();
const realSrc = new Map();
const frames = assetsInfo.assets.slice().sort((a, b) => a.frame - b.frame);
for (const f of frames) for (const a of f.audioAndVideoAssets) if (!a.src.startsWith("same-as")) realSrc.set(a.id, a.src);
const open = new Map(), segs = [];
for (const f of frames) {
  const rel = f.frame - start, present = new Set();
  for (const a of f.audioAndVideoAssets) {
    if (a.type !== "audio") continue;
    present.add(a.id);
    let o = open.get(a.id);
    if (!o) { o = { id: a.id, src: realSrc.get(a.id) ?? a.src, startRel: rel, trim: a.mediaFrame, rate: a.playbackRate, vols: [], last: rel }; open.set(a.id, o); segs.push(o); }
    o.vols.push(a.volume); o.last = rel;
  }
  for (const [id, o] of open) if (!present.has(id)) open.delete(id);
}
const toPath = (s) => { if (s.startsWith("file:")) return decodeURIComponent(new URL(s).pathname.replace(/^\//, "")); const u = new URL(s); const m = decodeURIComponent(u.pathname).match(/\/public\/(.*)$/); return m ? `${root}/public/${m[1]}` : s; };
const inputs = [], parts = [], mixIn = [], uniq = new Map();   // one -i per distinct source (hundreds of sfx hits of the same file overflowed the Windows command line)
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
  const fcFile = path.join(work, "audio_fc.txt"); fs.writeFileSync(fcFile, fc);   // filter graph in a file: no command-line length limit
  execFileSync("ffmpeg", ["-v", "error", "-y", ...inputs, "-/filter_complex", fcFile, "-map", "[a]", "-c:a", "aac", "-b:a", "192k", audio]);
  hasAudio = true;
}
timing.audioSec = (Date.now() - t) / 1000;
log(`audio: ${segs.length} segments mixed in ${timing.audioSec.toFixed(1)}s`);

// ---- mux ----
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", video, ...(hasAudio ? ["-i", audio] : []), "-map", "0:v", ...(hasAudio ? ["-map", "1:a"] : []), "-c", "copy", "-movflags", "+faststart", out]);
const T_END = Date.now();
smi.kill(); clearInterval(cpuTimer);
try { fs.rmSync(serveUrl, { recursive: true, force: true }); } catch {}
spawnSync("node", ["tools/clean_temp.mjs"], { cwd: root, stdio: "ignore" });

// ---- report ----
const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=codec_name,width,height,nb_frames,duration", "-of", "json", out]).toString());
const comp_fps = /DONE (\d+) frames in ([\d.]+)s/.exec(pyOut);
const profile = /PROFILE (.*)/.exec(pyOut)?.[1];
const rep = {
  composition: compId, frames: NF, range: [start, end], output: out, sizeMB: +(fs.statSync(out).size / 1e6).toFixed(1), probe: probe.streams,
  totalMinutes: +((T_END - T_START) / 60000).toFixed(2),
  renderMinutes_graphicsPlusComposite: +(timing.graphicsPlusCompositeSec / 60).toFixed(2),
  fpsGraphicsPlusComposite: +(NF / timing.graphicsPlusCompositeSec).toFixed(2),
  timing, compositor: comp_fps ? { frames: +comp_fps[1], sec: +comp_fps[2] } : null, compositorProfile: profile,
  gpuDuringRender: { util: stats(gpuSamples, "gpu", tg0, tc1), encoder: stats(gpuSamples, "enc", tg0, tc1), decoder: stats(gpuSamples, "dec", tg0, tc1), memMB: stats(gpuSamples, "mem", tg0, tc1) },
  cpuDuringRender: stats(cpuSamples, "cpu", tg0, tc1),
};
const repFile = path.join(root, "render_work", `hybrid_any_${compId}_${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
fs.mkdirSync(path.dirname(repFile), { recursive: true });
fs.writeFileSync(repFile, JSON.stringify(rep, null, 2));
console.log(JSON.stringify(rep, null, 2));
log(`DONE → ${out}   (report: ${repFile})`);
logProgress(`DONE ${out}`);
// فاصل الافتتاح (صارم، 2026-11-11): الرندر الكامل (عرضي أو طولي) لأي مونتاج يأخذ فاصلاً ورقياً عشوائياً في أوله (يُتخطّى للأجزاء/المدى الجزئي/الفواصل نفسها/--no-bumper)
{
  const partial = (PART !== "") || Number(arg("start", 0)) !== 0 || arg("end", null) !== null;
  if (!partial && !compId.startsWith("Fasel-") && !/^(Stick|Dodo)-/.test(compId) && !process.argv.includes("--no-bumper")) {
    spawnSync("node", ["tools/prepend_bumper.mjs", out, "--name", String(arg("name", path.basename(out, path.extname(out)))), ...(Number(process.env.BUMPER_AT) > 0 ? ["--at", String(process.env.BUMPER_AT)] : []), ...(process.env.BUMPER_ID ? ["--id", process.env.BUMPER_ID] : [])], { cwd: root, stdio: "inherit" });   /* the bumper goes before his first greeting (tools/bumper_at.mjs) */
  }
}
