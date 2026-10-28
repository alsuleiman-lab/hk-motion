// Video Analysis Cache (v3, 2026-10-23): analyse a video ONCE, keep the results, reuse them until the input or the analysis logic changes. For every project.
//   node tools/video_cache.mjs analyze <video> [--from s --to s] [--force] [--map public/<name>_map.json --of source|cut] [--proxy]
//   node tools/video_cache.mjs show <video> [--from s --to s]            -> prints the cached windows
//   node tools/video_cache.mjs bench <video>                             -> times the three decode methods on 90 s of THIS file and remembers the fastest stable one per codec
// Output: .tmp/cache/<id>/{meta.json, windows.json, thumbs/*.jpg, stamp.json, panel.raw, mid.raw, chunks/*, proxy.mp4+proxy.json (only with --proxy)}
//
// Why it is fast (measured on the RTX 3090, 3.7 GB HEVC, 24:41; full scan stage, same output):
//   M1 CPU decode                       184.7 s wall, 1529 CPU-seconds (8.3 cores busy)
//   M2 -hwaccel cuda (frames copied back) 159.2 s wall,  186 CPU-seconds
//   M3 -hwaccel cuda -hwaccel_output_format cuda + fps + scale_cuda 480x270, download only the tiny frames:  41.8 s wall, 40 CPU-seconds, NVDEC 96 %
//   M3 is the default (falls back to M2 then M1 if it fails). Features are read on a 480x270 copy (3 of 5923 samples differ from M1; boundaries move ≤ 0.25 s).
//
// Cache keys — a stage is recomputed ONLY when one of its fingerprints changes:
//   input  = sha1(absolute path | size | mtime | from | to [| map file content])          — the video (never modified) and, for `windows`, the cut map
//   logic  = sha1(TOOL_VERSION | STAGE_VERSION[stage] | every numeric setting | decode mode family)  — bump the version when you change the logic; old results are never reused
// The scan is split in CHUNKS of 300 s, each with its own stamp: an interrupted run resumes, and a bigger --to only analyses the new chunks.
// Timeline: all times are SECONDS of the analysed file (never frame numbers: with a variable frame rate frames ≠ time×fps; meta.json says if VFR).
// Cut ↔ source: pass --map public/<name>_map.json ({segments:[{a,b,n}]}: a,b = source seconds, n = start on the cut) and --of source|cut (what the analysed file IS).
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const TOOL_VERSION = "video_cache_v3";
const STAGE_VERSION = { meta: "meta_v1", scan: "scan_v2", windows: "windows_v3", proxy: "proxy_v1" };
const SETTINGS = {
  fps: 4, chunk: 300, small: [480, 270],
  // regions as FRACTIONS of the frame so they work at any resolution: panel = media-player bar (bottom-left), mid = probe pixel between panel and speaker
  panel: [40 / 1920, 1030 / 1080, 860 / 1920, 50 / 1080], mid: [906 / 1920, 536 / 1080, 8 / 1920, 8 / 1080],
  panelDark: 60, midDark: 40, minWindow: 1.0,
};
const argv = process.argv.slice(2);
const [cmd, video] = argv;
const flag = (n) => argv.includes("--" + n);
const opt = (n, d) => (flag(n) ? argv[argv.indexOf("--" + n) + 1] : d);
if (!cmd || !video) { console.error("usage: node tools/video_cache.mjs analyze|show|bench <video> [--from s --to s] [--force] [--map file --of source|cut] [--proxy]"); process.exit(2); }
const abs = path.resolve(video);
const st = fs.statSync(abs);
const from = Number(opt("from", 0)), toOpt = opt("to", "");
const sha = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 16);
const mapFile = opt("map", ""), mapOf = opt("of", "source");
const mapSegs = mapFile ? JSON.parse(fs.readFileSync(path.resolve(mapFile), "utf8")).segments : null;
const mapFp = mapFile ? sha(fs.readFileSync(path.resolve(mapFile))) : "";
const run0 = (a, o = {}) => spawnSync(a[0], a.slice(1), { encoding: "utf8", maxBuffer: 1 << 26, ...o });

/** map helpers (segments {a,b,n}: source a..b ↔ cut n..n+(b-a)) */
export const cutToSource = (segments, t) => { for (const s of segments) if (t >= s.n && t <= s.n + (s.b - s.a)) return s.a + (t - s.n); return null; };
export const sourceToCut = (segments, t) => { for (const s of segments) if (t >= s.a && t <= s.b) return s.n + (t - s.a); for (const s of segments) if (s.a > t) return s.n; const l = segments[segments.length - 1]; return l.n + l.b - l.a; };

// ───── meta (also needed to compute the cache id) ─────
const probe = run0(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name,width,height,r_frame_rate,avg_frame_rate:format=duration", "-of", "json", abs]);
const pj = JSON.parse(probe.stdout), vs = pj.streams[0];
const durationFile = Number(pj.format.duration);
const to = toOpt === "" ? null : Number(toOpt);
const end = to ?? durationFile;
const inputFp = sha(`${abs}|${st.size}|${Math.round(st.mtimeMs)}`);
const id = sha(abs);
const dir = path.join(process.cwd(), ".tmp", "cache", id);
fs.mkdirSync(path.join(dir, "thumbs"), { recursive: true }); fs.mkdirSync(path.join(dir, "chunks"), { recursive: true });
const stampFile = path.join(dir, "stamp.json");
const stamp = fs.existsSync(stampFile) ? JSON.parse(fs.readFileSync(stampFile, "utf8")) : { chunks: {} };
stamp.chunks ??= {};
// each stage is keyed only by the settings IT uses: changing a classification threshold re-runs `windows` (seconds), not the decode scan
const STAGE_SETTINGS = { meta: {}, scan: { fps: SETTINGS.fps, chunk: SETTINGS.chunk, small: SETTINGS.small, panel: SETTINGS.panel, mid: SETTINGS.mid }, windows: { panelDark: SETTINGS.panelDark, midDark: SETTINGS.midDark, minWindow: SETTINGS.minWindow }, proxy: {} };
const logicFp = (stage) => sha(`${TOOL_VERSION}|${STAGE_VERSION[stage]}|${JSON.stringify(STAGE_SETTINGS[stage])}`);
const saveStamp = () => fs.writeFileSync(stampFile, JSON.stringify(stamp, null, 1));
const freshStage = (stage, extra = "", deps = []) => !flag("force") && stamp[stage]?.input === sha(inputFp + extra) && stamp[stage]?.logic === logicFp(stage) && deps.every((d) => (stamp[d]?.at ?? 0) <= stamp[stage].at);
const mark = (stage, extra = "") => { stamp[stage] = { input: sha(inputFp + extra), logic: logicFp(stage), at: Date.now() }; saveStamp(); };
const t0 = Date.now(), ran = [], timing = {};
const timed = (name, fn) => { const s = Date.now(); const r = fn(); timing[name] = +((Date.now() - s) / 1000).toFixed(1); ran.push(name); return r; };

const meta = { file: abs, size: st.size, codec: vs.codec_name, width: vs.width, height: vs.height, fps: vs.r_frame_rate, avgFps: vs.avg_frame_rate, variableFrameRate: vs.r_frame_rate !== vs.avg_frame_rate, duration: durationFile };
if (!freshStage("meta")) { fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify(meta, null, 1)); mark("meta"); }

// ───── decode mode (measured, per codec) ─────
const modeFile = path.join(process.cwd(), ".tmp", "cache", "decode_mode.json");
const fcFor = (mode) => {
  const [sw, sh] = SETTINGS.small, [W, H] = mode === "M3" ? [sw, sh] : [meta.width, meta.height];
  const c = (f) => `${Math.max(1, Math.round(f[2] * W))}:${Math.max(1, Math.round(f[3] * H))}:${Math.round(f[0] * W)}:${Math.round(f[1] * H)}`;
  const tail = `split[a][b];[a]crop=${c(SETTINGS.panel)},scale=1:1,format=gray[pa];[b]crop=${c(SETTINGS.mid)},scale=1:1,format=gray[pb]`;
  return mode === "M3" ? `[0:v]fps=${SETTINGS.fps},scale_cuda=${sw}:${sh}:format=nv12,hwdownload,format=nv12,${tail}` : `[0:v]fps=${SETTINGS.fps},${tail}`;
};
const inArgs = (mode) => (mode === "M3" ? ["-hwaccel", "cuda", "-hwaccel_output_format", "cuda"] : mode === "M2" ? ["-hwaccel", "cuda"] : []);
const scanChunk = (mode, ss, len, outP, outM) => run0(["ffmpeg", "-hide_banner", "-v", "error", "-y", ...inArgs(mode), "-ss", String(ss), "-t", String(len), "-i", abs, "-filter_complex", fcFor(mode), "-map", "[pa]", "-f", "rawvideo", outP, "-map", "[pb]", "-f", "rawvideo", outM]);
const modeOrder = () => { let pref = null; try { pref = JSON.parse(fs.readFileSync(modeFile, "utf8"))[meta.codec]?.mode; } catch { /* none */ } return [...new Set([pref, "M3", "M2", "M1"].filter(Boolean))]; };

if (cmd === "bench") {
  const res = {};
  for (const m of ["M1", "M2", "M3"]) {
    const s = Date.now(); const r = scanChunk(m, 0, 90, path.join(dir, `b_${m}.p`), path.join(dir, `b_${m}.m`));
    res[m] = r.status === 0 ? +((Date.now() - s) / 1000).toFixed(1) : null; console.log(`bench ${m}: ${res[m] ?? "FAILED"} s for 90 s of ${meta.codec}`);
  }
  const best = Object.entries(res).filter(([, v]) => v !== null).sort((a, b) => a[1] - b[1])[0][0];
  let all = {}; try { all = JSON.parse(fs.readFileSync(modeFile, "utf8")); } catch { /* new */ }
  all[meta.codec] = { mode: best, wall90s: res, at: new Date().toISOString() };
  fs.writeFileSync(modeFile, JSON.stringify(all, null, 1)); console.log(`fastest stable for ${meta.codec}: ${best}`);
  for (const m of ["M1", "M2", "M3"]) for (const x of [".p", ".m"]) fs.rmSync(path.join(dir, `b_${m}${x}`), { force: true });
  process.exit(0);
}
if (cmd === "show") { console.log(fs.readFileSync(path.join(dir, "windows.json"), "utf8")); process.exit(0); }

// ───── scan: chunked, resumable, one decode pass per chunk ─────
const fps = SETTINGS.fps, nChunks = Math.ceil((end - from) / SETTINGS.chunk);
let usedMode = null, chunksDone = 0;
const chunkOk = (i) => stamp.chunks[`${from}_${i}`]?.input === inputFp && stamp.chunks[`${from}_${i}`]?.logic === logicFp("scan") && !flag("force") && fs.existsSync(path.join(dir, "chunks", `c${from}_${i}.p`));
const scanStart = Date.now();
for (let i = 0; i < nChunks; i++) {
  if (chunkOk(i)) continue;
  const ss = from + i * SETTINGS.chunk, len = Math.min(SETTINGS.chunk, end - ss);
  let r = null;
  for (const m of usedMode ? [usedMode] : modeOrder()) {
    r = scanChunk(m, ss, len, path.join(dir, "chunks", `c${from}_${i}.p`), path.join(dir, "chunks", `c${from}_${i}.m`));
    if (r.status === 0) { usedMode = m; break; }
  }
  if (!r || r.status !== 0) { console.error(r?.stderr); process.exit(1); }
  stamp.chunks[`${from}_${i}`] = { input: inputFp, logic: logicFp("scan"), mode: usedMode, at: Date.now() }; saveStamp(); chunksDone++;
}
if (chunksDone) { timing.scan = +((Date.now() - scanStart) / 1000).toFixed(1); ran.push(`scan(${chunksDone}/${nChunks} chunks, ${usedMode})`); }
const nSamples = Math.floor((end - from) * fps);
const cat = (ext) => { const parts = []; for (let i = 0; i < nChunks; i++) { const b = fs.readFileSync(path.join(dir, "chunks", `c${from}_${i}.${ext}`)); parts.push(i < nChunks - 1 ? b.subarray(0, SETTINGS.chunk * fps) : b); } return Buffer.concat(parts).subarray(0, nSamples); };

// ───── windows (classification + thumbnails + optional cut↔source mapping) ─────
const winExtra = `|${from}|${end}|${mapFp}|${mapOf}|${logicFp("scan")}`;
if (!freshStage("windows", winExtra)) {
  timed("windows", () => {
    const pan = cat("p"), mid = cat("m"), n = Math.min(pan.length, mid.length);
    const lab = Array.from({ length: n }, (_, i) => (pan[i] >= SETTINGS.panelDark ? 0 : mid[i] < SETTINGS.midDark ? 2 : 1));
    const runs = []; let s0 = 0;
    for (let i = 1; i <= n; i++) if (i === n || lab[i] !== lab[s0]) { runs.push({ k: lab[s0], a: s0 / fps, b: i / fps }); s0 = i; }
    const out = [];
    for (const r of runs) {   // runs shorter than minWindow are noise: absorb into the previous run; then merge ADJACENT runs of the same kind
      if (out.length && (r.b - r.a < SETTINGS.minWindow)) { out[out.length - 1].b = r.b; continue; }
      if (out.length && out[out.length - 1].k === r.k) out[out.length - 1].b = r.b; else out.push({ ...r });
    }
    const wins = out.filter((w) => w.k !== 0 && w.b - w.a >= SETTINGS.minWindow).map((w, i) => {
      const a = +(w.a + from).toFixed(2), b = +(w.b + from).toFixed(2), o = { type: w.k === 1 ? "clip" : "book", a, b, thumb: `thumbs/w${i}.jpg` };
      if (mapSegs && mapOf === "source") { o.cut = [+sourceToCut(mapSegs, a).toFixed(2), +sourceToCut(mapSegs, b).toFixed(2)]; }
      if (mapSegs && mapOf === "cut") { const sa = cutToSource(mapSegs, a + 0.01), sb = cutToSource(mapSegs, b - 0.01); o.source = [sa === null ? null : +sa.toFixed(2), sb === null ? null : +sb.toFixed(2)]; }
      return o;
    });
    for (const w of wins) run0(["ffmpeg", "-hide_banner", "-v", "error", "-y", "-ss", String((w.a + w.b) / 2), "-i", abs, "-frames:v", "1", "-vf", "scale=480:-1", path.join(dir, w.thumb)]);
    fs.writeFileSync(path.join(dir, "windows.json"), JSON.stringify({ file: abs, from, to: end, map: mapFile || null, analysedFileIs: mapSegs ? mapOf : null, windows: wins, durationAnalysed: n / fps, decodeMode: usedMode }, null, 1));
  });
  mark("windows", winExtra);
}

// ───── proxy (only on request): low-res NVENC copy for inspection/preview tools; NEVER for export or background isolation ─────
if (flag("proxy")) {
  const prox = path.join(dir, "proxy.mp4");
  if (meta.variableFrameRate) console.warn("[video_cache] variable frame rate: proxy skipped (frame numbers would not match the source). Use times, or re-encode the source to CFR first.");
  else if (!freshStage("proxy") || !fs.existsSync(prox)) {
    timed("proxy", () => {
      const r = run0(["ffmpeg", "-hide_banner", "-v", "error", "-y", "-hwaccel", "cuda", "-hwaccel_output_format", "cuda", "-i", abs, "-vf", "scale_cuda=640:360", "-c:v", "h264_nvenc", "-preset", "p4", "-cq", "28", "-g", "15", "-bf", "0", "-an", prox]);
      if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
      fs.writeFileSync(path.join(dir, "proxy.json"), JSON.stringify({ source: abs, sourceSize: st.size, sourceMtime: Math.round(st.mtimeMs), width: 640, height: 360, fps: meta.fps, sameTimeline: true, note: "CFR source: proxy frame n = source frame n; times are identical. Not for export or matting." }, null, 1));
    });
    mark("proxy");
  }
}
console.log(`[video_cache] ${ran.length ? "computed: " + ran.join(", ") : "all stages cached"} | total ${((Date.now() - t0) / 1000).toFixed(1)} s | stage times ${JSON.stringify(timing)} | ${path.relative(process.cwd(), dir)} (VFR=${meta.variableFrameRate}, mode=${usedMode ?? "cached"})`);
console.log(fs.readFileSync(path.join(dir, "windows.json"), "utf8").split("\n").slice(0, 14).join("\n"));
