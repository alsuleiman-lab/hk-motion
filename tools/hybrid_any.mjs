// GENERIC GPU HYBRID RENDER — one command renders ANY composition that uses <HybridHost> / <VSlot> / <HybridBg> (src/hybrid/Slot.tsx).
//   node tools/hybrid_any.mjs --comp EU-Protests-Landscape --out "C:/Users/mshms/Videos/جاهز/عرضي/أساسية/<العنوان>.mp4" [--start 0] [--end N] [--conc 3] [--report render_work/x]
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

process.env.TEMP = process.env.TMP = "S:/AI_Tools/Remotion_Workspace/.tmp"; // project rule: never write temp files to C:
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i < 0 ? d : (process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : true); };
const root = path.resolve(import.meta.dirname, "..").replace(/\\/g, "/");
const compId = arg("comp", null);
if (!compId || compId === true) { console.error("usage: node tools/hybrid_any.mjs --comp <CompositionId> --out <file.mp4> [--start N --end N --conc 3 --dump 'dir:frames,...']"); process.exit(1); }
const out = path.resolve(root, arg("out", `render_work/hybrid/${compId}.mp4`));
const logProgress = startMonitor(path.join(root, ".tmp", "render_logs", `hybrid_any_${compId}.log`), path.basename(out, path.extname(out)));
const work = path.join(root, ".tmp/hybrid_any", compId);
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
    if (e.isDirectory()) { sync(s, d); continue; }
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
const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts"), rspack: true, publicDir: slim, outDir: path.join(root, ".tmp/hybrid_any/bundle_" + compId), onProgress: () => {} });
// Chrome never plays the videos, but Remotion downloads the files of <Audio> elements from the bundle: hard-link (zero copy) the real videos into it
const linkVideos = (src, dst) => { for (const e of fs.readdirSync(src, { withFileTypes: true })) { const s2 = path.join(src, e.name), d2 = path.join(dst, e.name); if (e.isDirectory()) { fs.mkdirSync(d2, { recursive: true }); linkVideos(s2, d2); } else if (VID.test(e.name) && !fs.existsSync(d2)) { try { fs.linkSync(s2, d2); } catch (err) { log("link failed " + e.name + ": " + err.message); } } } };
linkVideos(path.join(root, "public"), path.join(serveUrl, "public"));
timing.bundleSec = (Date.now() - t) / 1000;
const inputProps = { hybrid: "top", hybridPort: GEOM_PORT };
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
const comp_py = spawn(PY, ["-u", "tools/hybrid_generic.py", "--listen", String(PNG_PORT), "--geom", String(GEOM_PORT), "--out", video, "--bg", bgPng, "--public", `${root}/public`, "--w", String(W), "--h", String(H), "--fps", String(FPS), "--start", String(start), "--end", String(end), ...(dump && dump !== true ? ["--dump", dump] : [])], { cwd: root, stdio: ["ignore", "pipe", "inherit"] });
try { os.setPriority(comp_py.pid, os.constants.priority.PRIORITY_ABOVE_NORMAL); } catch {} // the feeding thread must never be starved by Chrome
let ready; const readyP = new Promise((res) => (ready = res));
let pyOut = "";
comp_py.stdout.on("data", (d) => { const s = d.toString(); pyOut += s; process.stdout.write(s); if (s.includes("READY")) ready(); });
const exited = new Promise((res, rej) => comp_py.on("exit", (c) => (c === 0 ? res() : rej(new Error("compositor exit " + c)))));
exited.catch((e) => { console.error("the compositor stopped: " + e.message); process.exit(1); });
await Promise.race([readyP, exited]);
const sock = net.connect(PNG_PORT, "127.0.0.1");
await new Promise((res) => sock.on("connect", res));

// ---- graphics layer ----
log("rendering the graphics layer (Remotion, transparent PNG, no video decoding)…");
const tg0 = Date.now();
let sent = 0;
let lastPercent = -1;
const conc = arg("conc", null);
const { assetsInfo } = await renderFrames({
  composition, serveUrl, inputProps, imageFormat: "png", outputDir: null, concurrency: conc && conc !== true ? Number(conc) : 3, frameRange: [start, end], chromiumOptions: { gl: "angle" }, logLevel: "error", timeoutInMilliseconds: 180000,
  onFrameUpdate: () => {},
  onFrameBuffer: (buf, frame) => { const h = Buffer.alloc(8); h.writeUInt32LE(frame, 0); h.writeUInt32LE(buf.length, 4); sock.write(h); sock.write(buf); sent++; const percent = Math.floor(sent / NF * 100); if (percent !== lastPercent) { lastPercent = percent; logProgress(`[جزء 1/1] ${percent}%`); } if (sent % 600 === 0) log(`graphics ${sent}/${NF}  ${(sent / ((Date.now() - tg0) / 1000)).toFixed(1)} fps`); },
});
sock.end();
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
const inputs = [], parts = [], mixIn = [];
segs.forEach((o, k) => {
  const v = o.vols.reduce((a, b) => a + b, 0) / o.vols.length;
  if (Math.max(...o.vols) - Math.min(...o.vols) > 0.02) log(`audio ${o.id}: volume varies (${Math.min(...o.vols).toFixed(2)}–${Math.max(...o.vols).toFixed(2)}), using the mean`);
  const dur = (o.last - o.startRel + 1) / FPS, ms = Math.round((o.startRel / FPS) * 1000);
  inputs.push("-i", toPath(o.src));
  parts.push(`[${k}:a]atrim=start=${(o.trim / FPS).toFixed(4)}:duration=${(dur * o.rate).toFixed(4)},asetpts=PTS-STARTPTS${o.rate !== 1 ? `,atempo=${o.rate}` : ""},volume=${v.toFixed(4)},adelay=${ms}:all=1[a${k}]`);
  mixIn.push(`[a${k}]`);
});
const audio = path.join(work, "audio.aac");
let hasAudio = false;
if (segs.length) {
  const fc = parts.join(";") + ";" + mixIn.join("") + `amix=inputs=${mixIn.length}:duration=longest:normalize=0:dropout_transition=0,aresample=48000,atrim=duration=${(NF / FPS).toFixed(4)}[a]`;
  execFileSync("ffmpeg", ["-v", "error", "-y", ...inputs, "-filter_complex", fc, "-map", "[a]", "-c:a", "aac", "-b:a", "192k", audio]);
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
