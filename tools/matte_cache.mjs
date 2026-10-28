// Saved-matte cache: isolate the Sheikh ONCE, reuse the matte for every background / layout change (user order 2026-10-22, all future projects).
//   node tools/matte_cache.mjs get <video> <start> <end> [--map public/x_map.json] [--ratio 0.6] [--force]
//        -> prints the matte file + the frame OFFSET to use ( matte frame = round((t - fileStart) * fps) ), computing it on the GPU only when no valid saved matte COVERS [start,end]
//   node tools/matte_cache.mjs list <video>
// The matte = gray video (white = person), already cleaned (tools/matte_gpu.py: NVDEC -> RVM fp16 -> GPU cleaning -> NVENC). Use it with:
//   · Studio/Remotion preview: <MaskedVideo video="..." matte="..." /> (src/MaskedVideo.tsx), or
//   · final render: ffmpeg  -i video -i matte -filter_complex "[1:v]format=gray[a];[0:v][a]alphamerge"  (no VP9 alpha video is ever built).
// A matte is reused only if ALL match: the video fingerprint, the cleaning/model LOGIC version, the params (ratio, cleaning thresholds), the model file, and — when --map is given — the cut map
// (RVM memory is reset at every cut join, so a different map = a different matte). Originals are never modified.
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const LOGIC = 1;                                          // bump when tools/matte_gpu.py changes behaviour
const CLEAN = { ymax: 700, xl: 840, xr: 1100, xs0: 760, xs1: 1180 };
const [cmd, video, ...rest] = process.argv.slice(2);
const flag = (n) => rest.includes("--" + n), opt = (n, d) => (flag(n) ? rest[rest.indexOf("--" + n) + 1] : d);
if (!cmd || !video) { console.error("usage: node tools/matte_cache.mjs get|list <video> [start end] [--map file] [--ratio 0.6] [--force]"); process.exit(2); }
const abs = path.resolve(video), st = fs.statSync(abs);
const head = Buffer.alloc(Math.min(1 << 20, st.size)); { const fd = fs.openSync(abs, "r"); fs.readSync(fd, head, 0, head.length, 0); fs.closeSync(fd); }
const id = crypto.createHash("sha1").update(`${abs}|${st.size}|${Math.round(st.mtimeMs)}|`).update(head).digest("hex").slice(0, 16);
const dir = path.join(process.cwd(), ".tmp", "mattes", id); fs.mkdirSync(dir, { recursive: true });
const modelPath = path.resolve("models/rvm_resnet50_fp32.torchscript"), ms = fs.statSync(modelPath);
const model = `${ms.size}|${Math.round(ms.mtimeMs)}`;
const ratio = Number(opt("ratio", "0.6"));
const mapFile = opt("map", "");
const mapFp = mapFile ? crypto.createHash("sha1").update(fs.readFileSync(mapFile)).digest("hex").slice(0, 12) : "";
const params = crypto.createHash("sha1").update(JSON.stringify({ ratio, CLEAN })).digest("hex").slice(0, 12);
const records = () => fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => { try { return { ...JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")), jsonFile: f }; } catch { return null; } }).filter(Boolean);
const valid = (r, anyMap = false) => r.logic === LOGIC && r.params === params && r.model === model && fs.existsSync(path.join(dir, r.file)) && (anyMap || r.mapFp === mapFp);

if (cmd === "list") { for (const r of records()) console.log(`${valid(r, true) ? "valid" : "STALE"}  ${r.start}–${r.end}s  map=${r.mapFp || "none"}  ${r.file}  (${r.seconds}s to compute, ${r.fps} fps)`); process.exit(0); }
const start = Number(rest[0]), end = Number(rest[1]);
const hit = flag("force") ? null : records().find((r) => valid(r) && r.start <= start + 1e-6 && r.end >= end - 1e-6);
if (hit) { console.log(`reused ${path.join(dir, hit.file)}  (covers ${hit.start}–${hit.end})  offsetFrames=${Math.round((start - hit.start) * hit.fps)}`); process.exit(0); }
const name = `m_${start}_${end}_${params}${mapFp ? "_" + mapFp : ""}`, outFile = path.join(dir, name + ".mp4");
const PY = process.env.PY ?? "S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe";
const t0 = process.hrtime.bigint();
// tools/matte_gpu.py has NO --start/--end/--map options (it matted the WHOLE video: 25 000 frames, 164 MB, >15 min for a 20 s window — found 2026-10-23), so cut the window out first (high-quality NVENC, GOP 15)
const trimFile = path.join(dir, `src_${start}_${end}.mp4`);
if (!fs.existsSync(trimFile)) {
  const tr = spawnSync("ffmpeg", ["-hide_banner", "-v", "error", "-y", "-ss", String(start), "-i", abs, "-t", String(end - start), "-an", "-c:v", "h264_nvenc", "-preset", "p5", "-rc", "constqp", "-qp", "10", "-g", "15", "-bf", "0", "-pix_fmt", "yuv420p", trimFile], { encoding: "utf8" });
  if (tr.status !== 0) { console.error(tr.stderr); process.exit(1); }
}
const r = spawnSync(PY, ["-X", "utf8", "tools/matte_gpu.py", trimFile, outFile, "--ratio", String(ratio),
  ...Object.entries(CLEAN).flatMap(([k, v]) => ["--" + k, String(v)])], { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
if (r.status !== 0) { console.error(r.stdout); process.exit(1); }
const seconds = +(Number(process.hrtime.bigint() - t0) / 1e9).toFixed(1);
const fps = Number((spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate", "-of", "default=nw=1:nk=1", abs], { encoding: "utf8" }).stdout.trim().split("/").reduce((a, b) => a / b)));
fs.writeFileSync(path.join(dir, name + ".json"), JSON.stringify({ file: name + ".mp4", video: abs, input: id, start, end, fps, logic: LOGIC, params, model, mapFp, seconds, created: new Date().toISOString(), log: r.stdout.trim().split("\n").pop() }, null, 1));
console.log(`computed ${outFile} in ${seconds} s  offsetFrames=0\n${r.stdout.trim().split("\n").pop()}`);
