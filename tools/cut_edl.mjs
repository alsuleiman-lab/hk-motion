// Cut from an EDL (the cut map = the single source of truth) — no repeated full re-encodes (user order 2026-10-22, all future projects).
//   node tools/cut_edl.mjs audio <video> <map.json> <out.wav> [--until S]        audio-only cut (seconds, no video; speaker levels evened out unless --no-level): use it to tune silences / run tools/audio_gate.mjs
//   node tools/cut_edl.mjs build <video> <map.json> <out.mp4> [--mode batch|parallel|filter] [--workers 2] [--batch 12] [--until S] [--audio-from file.wav]
//        parallel (default): one NVDEC->NVENC job per segment (fast input seek, so the removed parts are never decoded), N jobs at a time, joined with -c copy;
//        filter            : the old single trim/concat filter graph (kept for comparison / fallback).
//   map.json = { segments:[{a,b,n}] } (a,b = source seconds on a 1/30 s grid, n = start on the cut timeline) as written by tools/auto_cut.mjs.
// Encoding stays NVENC (h264_nvenc p5 vbr cq15, g=15, no B-frames, 30 fps) — same settings as auto_cut.mjs, so quality is unchanged. The source is never modified.
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const [cmd, video, mapFile, out, ...rest] = process.argv.slice(2);
const flag = (n) => rest.includes("--" + n), opt = (n, d) => (flag(n) ? rest[rest.indexOf("--" + n) + 1] : d);
if (!cmd || !video || !mapFile || !out) { console.error("usage: node tools/cut_edl.mjs audio|build <video> <map.json> <out> [--mode parallel|filter] [--workers 4] [--until S]"); process.exit(2); }
const FPS = 30, until = Number(opt("until", "1e9"));
let segs = JSON.parse(fs.readFileSync(mapFile, "utf8")).segments.filter((s) => s.n < until).map((s) => ({ ...s }));
if (segs.length && segs[segs.length - 1].n + (segs[segs.length - 1].b - segs[segs.length - 1].a) > until) { const l = segs[segs.length - 1]; l.b = +(l.a + Math.floor((until - l.n) * FPS) / FPS).toFixed(4); }
segs = segs.filter((s) => s.b - s.a > 0.05);
const run = (args, o = {}) => new Promise((resolve, reject) => { const p = spawn("ffmpeg", ["-hide_banner", "-v", "error", ...args], { stdio: ["ignore", "inherit", "inherit"], windowsHide: true, ...o }); p.on("close", (c) => (c === 0 ? resolve() : reject(new Error("ffmpeg exit " + c + ": " + args.slice(0, 6).join(" "))))); p.on("error", reject); });
const tmp = fs.mkdtempSync(path.join(process.env.TEMP || os.tmpdir(), "cutedl_"));
const t0 = process.hrtime.bigint(); const secs = () => Number(process.hrtime.bigint() - t0) / 1e9;

// audio: decode the source audio ONCE (cached by video fingerprint), slice it with numpy (tools/audio_cut.py) — the one-atrim-per-segment ffmpeg graph is O(n^2) (292 segments = 240 s)
import crypto from "node:crypto";
const PY = process.env.PY ?? "S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe";
function videoId() {
  const st = fs.statSync(video), head = Buffer.alloc(Math.min(1 << 20, st.size)); { const fd = fs.openSync(video, "r"); fs.readSync(fd, head, 0, head.length, 0); fs.closeSync(fd); }
  return crypto.createHash("sha1").update(`${path.resolve(video)}|${st.size}|${Math.round(st.mtimeMs)}|`).update(head).digest("hex").slice(0, 16);
}
// تسوية عامة للصوت (المستخدم 2026-10-28): صوته وصوت من يرد عليه أو المتصل بمستوى واحد؛ dynaudnorm يرفع المقاطع الخافتة ويخفض العالية (نافذة ~4.5 ث تتبع تبدّل المتحدث) ثم limiter يمنع القصّ. --no-level لإيقافها
const LEVEL = !process.argv.includes("--no-level");
const LEVEL_AF = "dynaudnorm=f=300:g=15:p=0.9:m=15:s=12,alimiter=limit=0.95:level=false";
async function ensureAudio48() {
  const st = fs.statSync(video), head = Buffer.alloc(Math.min(1 << 20, st.size)); { const fd = fs.openSync(video, "r"); fs.readSync(fd, head, 0, head.length, 0); fs.closeSync(fd); }
  const id = crypto.createHash("sha1").update(`${path.resolve(video)}|${st.size}|${Math.round(st.mtimeMs)}|`).update(head).digest("hex").slice(0, 16);
  const dir = path.join(process.cwd(), ".tmp", "cache", id); fs.mkdirSync(dir, { recursive: true });
  const wav = path.join(dir, LEVEL ? "audio48_lvl.wav" : "audio48.wav");
  if (!fs.existsSync(wav)) { const t = process.hrtime.bigint(); await run(["-y", "-i", video, "-vn", ...(LEVEL ? ["-af", LEVEL_AF] : []), "-ac", "2", "-ar", "48000", "-c:a", "pcm_s16le", wav]); console.log(`audio decoded once in ${(Number(process.hrtime.bigint() - t) / 1e9).toFixed(1)} s (cached)`); }
  return wav;
}
async function buildAudio(target, codecArgs) {
  const wav = await ensureAudio48();
  const cutWav = target.endsWith(".wav") ? target : path.join(tmp, "audio_cut.wav");
  const r = spawnSync(PY, ["-X", "utf8", path.join(process.cwd(), "tools", "audio_cut.py"), wav, mapFile, cutWav, ...(until < 1e9 ? ["--until", String(until)] : [])], { encoding: "utf8" });
  if (r.status !== 0) throw new Error("audio_cut.py failed: " + r.stderr);
  if (cutWav !== target) await run(["-y", "-i", cutWav, ...codecArgs, target]);
}
const ENC = ["-c:v", "h264_nvenc", "-preset", "p5", "-rc", "vbr", "-cq", "15", "-b:v", "0", "-g", "15", "-bf", "0", "-pix_fmt", "yuv420p"];

try {
  if (cmd === "audio") {
    await buildAudio(out, ["-c:a", "pcm_s16le", "-ar", "48000"]);
    console.log(`audio-only cut: ${segs.length} segments -> ${out} in ${secs().toFixed(1)} s`);
  } else if (cmd === "build") {
    const mode = opt("mode", "batch"), workers = Number(opt("workers", "2")), batch = Number(opt("batch", "12"));
    const aac = path.join(tmp, "audio.m4a");
    const audioJob = opt("audio-from", "") ? Promise.resolve() : buildAudio(aac, ["-c:a", "aac", "-b:a", "192k"]);
    const vOnly = path.join(tmp, "video.mp4");
    // video-only trim/concat graph for a group of segments
    const groupJob = async (group, target) => {
      const fo = Math.max(0, Math.round(group[0].a * FPS) - FPS), off = fo / FPS;   // fast input seek 1 s before the group (on the frame grid)
      // frame-exact trim: keep source frames [round(a*fps), round(b*fps)); a half-frame margin makes float rounding of pts irrelevant
      const v = group.map((s, i) => `[0:v]trim=start=${((Math.round(s.a * FPS) - fo - 0.5) / FPS).toFixed(6)}:end=${((Math.round(s.b * FPS) - fo - 0.5) / FPS).toFixed(6)},setpts=PTS-STARTPTS[v${i}]`).join(";\n");
      const cat = group.map((_, i) => `[v${i}]`).join("") + `concat=n=${group.length}:v=1:a=0[v]`;
      const gf = target + ".txt"; fs.writeFileSync(gf, v + ";\n" + cat);
      await run(["-y", "-hwaccel", "cuda", "-ss", off.toFixed(6), "-i", video, "-/filter_complex", gf, "-map", "[v]", "-r", String(FPS), ...ENC, target]);
    };
    if (mode === "filter") {                       // the old way: ONE graph over the whole source (decodes the removed parts too)
      await Promise.all([audioJob, groupJob(segs.map((s) => ({ ...s })), vOnly)]);
    } else if (mode === "batch") {                 // groups of N segments: graph per group, fast input seek per group, W groups at a time, joined with -c copy
      // groups = segments whose SOURCE time falls in the same `bucket`-second window, so an edit only changes its own group; encoded groups are cached by content
      const bucket = Number(opt("bucket", "30")), byB = new Map();
      for (const s of segs) { const k = Math.floor(s.a / bucket); if (!byB.has(k)) byB.set(k, []); byB.get(k).push(s); }
      const groups = [...byB.entries()].sort((x, y) => x[0] - y[0]).map((e) => e[1]);
      const cdir = path.join(process.cwd(), ".tmp", "cache", videoId(), "cutgroups"); fs.mkdirSync(cdir, { recursive: true });
      const files = groups.map((g) => path.join(cdir, crypto.createHash("sha1").update(JSON.stringify([g.map((s) => [s.a, s.b]), ENC, FPS])).digest("hex").slice(0, 20) + ".mp4"));
      const todo = groups.map((_, i) => i).filter((i) => !fs.existsSync(files[i]));
      console.log(`groups: ${groups.length}, cached: ${groups.length - todo.length}, to encode: ${todo.length}`);
      let next = 0, failed = null;
      const worker = async () => { while (next < todo.length && !failed) { const i = todo[next++], g = groups[i], tmpf = files[i] + ".part.mp4"; try { await groupJob(g, tmpf); fs.renameSync(tmpf, files[i]); } catch (e) { failed = e; } } };
      await Promise.all([audioJob, ...Array.from({ length: workers }, worker)]);
      if (failed) throw failed;
      const lf = path.join(tmp, "list.txt"); fs.writeFileSync(lf, files.map((f) => `file '${f.replace(/\\/g, "/")}'`).join("\n"));
      await run(["-y", "-f", "concat", "-safe", "0", "-i", lf, "-c", "copy", vOnly]);
    } else {                                       // parallel: one job per segment
      const list = []; let next = 0, failed = null;
      const worker = async () => { while (next < segs.length && !failed) { const i = next++, s = segs[i], f = path.join(tmp, `s${String(i).padStart(5, "0")}.mp4`), frames = Math.round((s.b - s.a) * FPS); try { await run(["-y", "-hwaccel", "cuda", "-ss", String(s.a), "-i", video, "-frames:v", String(frames), "-an", "-r", String(FPS), ...ENC, f]); list[i] = f; } catch (e) { failed = e; } } };
      await Promise.all([audioJob, ...Array.from({ length: workers }, worker)]);
      if (failed) throw failed;
      const lf = path.join(tmp, "list.txt"); fs.writeFileSync(lf, list.map((f) => `file '${f.replace(/\\/g, "/")}'`).join("\n"));
      await run(["-y", "-f", "concat", "-safe", "0", "-i", lf, "-c", "copy", vOnly]);
    }
    await audioJob;
    const audioIn = opt("audio-from", "") || aac;
    await run(["-y", "-i", vOnly, "-i", audioIn, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", audioIn.endsWith(".wav") ? "aac" : "copy", "-b:a", "192k", out]);
    const d = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", out], { encoding: "utf8" }).stdout.trim();
    const expect = segs.reduce((x, s) => x + (s.b - s.a), 0);
    console.log(`${mode}: ${segs.length} segments, ${expect.toFixed(2)} s expected, ${(+d).toFixed(2)} s produced, built in ${secs().toFixed(1)} s -> ${out}`);
  }
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }
