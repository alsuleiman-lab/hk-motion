// PARALLEL HYBRID RENDER (user order 2026-11-10: «فيديو مدته ساعة يكون جاهزاً مع رندر كامل خلال ساعة»).
//   node tools/hybrid_parallel.mjs --comp <CompositionId> --out <file.mp4> [--start 0] --end <lastFrame> [--parts 4] [--conc 3]
// One hybrid_any.mjs process renders at a fixed speed whatever its --conc (measured 6.7 fps at conc 3 and 6.9 at conc 10: the
// screenshot path of ONE Chromium is serial). So the range is split into --parts pieces rendered AT THE SAME TIME, each with its own
// Chromium, GPU compositor, ports and work dir; this process holds the one render lock for the whole job. The pieces' videos are joined
// without re-encoding (concat demuxer: every piece starts with an IDR frame) and their audio is joined once, then muxed.
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { acquireRenderLock } from "./render_lock.mjs";

const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i < 0 ? d : process.argv[i + 1]; };
const root = path.resolve(import.meta.dirname, "..").replace(/\\/g, "/");
process.chdir(root);
const comp = arg("comp"), out = path.resolve(root, arg("out", `render_work/hybrid/${comp}.mp4`));
const start = Number(arg("start", "0")), end = Number(arg("end")), K = Math.max(1, Number(arg("parts", "4"))), conc = arg("conc", "3");
if (!comp || !Number.isInteger(end) || end <= start) { console.error("usage: node tools/hybrid_parallel.mjs --comp <Id> --out <file.mp4> [--start 0] --end <lastFrame> [--parts 4] [--conc 3]"); process.exit(2); }
acquireRenderLock(`hybrid_parallel ${comp} ×${K}`);
try { os.setPriority(process.pid, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* best effort */ }
const log = (m) => console.log(`[hybrid-parallel ${new Date().toLocaleTimeString()}] ${m}`);
const T0 = Date.now();
const n = end - start + 1, size = Math.ceil(n / K);
const parts = Array.from({ length: K }, (_, i) => ({ i, a: start + i * size, b: Math.min(end, start + (i + 1) * size - 1) })).filter((p) => p.a <= p.b);
const work = path.join(root, ".tmp/hybrid_parallel", comp); fs.mkdirSync(work, { recursive: true });
log(`${comp}: frames ${start}-${end} (${n}) in ${parts.length} parts of ≤${size}`);

const runPart = (p) => new Promise((res) => {
  const lf = path.join(work, `part_${p.i}.log`);
  const c = spawn("node", ["tools/hybrid_any.mjs", "--comp", comp, "--out", path.join(work, `part_${p.i}.mp4`), "--start", String(p.a), "--end", String(p.b), "--conc", String(conc), "--browsers", "1",
    "--part", String(p.i), "--png-port", String(47741 + 10 * (p.i + 1)), "--geom-port", String(47742 + 10 * (p.i + 1))],
    { env: { ...process.env, HYBRID_PARENT_LOCK: String(process.pid) }, windowsHide: true });
  const ws = fs.createWriteStream(lf); c.stdout.pipe(ws); c.stderr.pipe(ws);
  c.on("close", (code) => {
    // the part's video is complete once the compositor wrote it, even if the part process fails later (seen: ECONNRESET after DONE)
    const v = path.join(root, ".tmp/hybrid_any", `${comp}_p${p.i}`, "video_noaudio.mp4"), a = path.join(root, ".tmp/hybrid_any", `${comp}_p${p.i}`, "audio.aac");
    let frames = 0; try { frames = Number(execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=nb_frames", "-of", "csv=p=0", v], { encoding: "utf8" }).trim()); } catch { /* none */ }
    log(`part ${p.i} (${p.a}-${p.b}) exit ${code}, ${frames}/${p.b - p.a + 1} frames`);
    res({ ...p, code, v, aud: fs.existsSync(a) ? a : null, ok: frames === p.b - p.a + 1 });
  });
});
// stagger the starts a little: bundling and Chromium start-up are the heavy, short phase
const results = await Promise.all(parts.map((p, k) => new Promise((r) => setTimeout(() => runPart(p).then(r), k * 4000))));
const bad = results.filter((r) => !r.ok);
if (bad.length) { log(`✘ parts failed: ${bad.map((r) => r.i).join(", ")} — logs in ${work}`); process.exit(1); }
const tRender = (Date.now() - T0) / 1000;

// video: join without re-encoding
const list = path.join(work, "concat.txt");
fs.writeFileSync(list, results.map((r) => `file '${r.v.replace(/\\/g, "/")}'`).join("\n") + "\n");
const vOut = path.join(work, "video.mp4");
execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", list, "-map", "0:v:0", "-c", "copy", vOut]);
// audio: every part's audio is exactly its range; decode, join and encode once
const aParts = results.filter((r) => r.aud);
let aOut = null;
if (aParts.length === results.length) {
  aOut = path.join(work, "audio.aac");
  const ins = aParts.flatMap((r) => ["-i", r.aud]);
  const fc = aParts.map((_, k) => `[${k}:a]aresample=48000,atrim=duration=${((results[k].b - results[k].a + 1) / 30).toFixed(4)},apad=whole_dur=${((results[k].b - results[k].a + 1) / 30).toFixed(4)}[a${k}]`).join(";") + ";" + aParts.map((_, k) => `[a${k}]`).join("") + `concat=n=${aParts.length}:v=0:a=1[a]`;
  execFileSync("ffmpeg", ["-v", "error", "-y", ...ins, "-filter_complex", fc, "-map", "[a]", "-c:a", "aac", "-b:a", "192k", aOut]);
} else log("⚠ some parts had no audio: the output is video-only (mix the audio separately)");
fs.mkdirSync(path.dirname(out), { recursive: true });
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", vOut, ...(aOut ? ["-i", aOut] : []), "-map", "0:v", ...(aOut ? ["-map", "1:a"] : []), "-c", "copy", "-movflags", "+faststart", out]);
const total = (Date.now() - T0) / 1000;
const frames = Number(execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=nb_frames", "-of", "csv=p=0", out], { encoding: "utf8" }).trim());
log(`DONE ${frames}/${n} frames → ${out} | render ${tRender.toFixed(0)} s, total ${total.toFixed(0)} s = ${(n / total).toFixed(1)} fps (×${((n / 30) / total).toFixed(2)} real time)`);
for (const r of results) { try { fs.rmSync(path.join(root, ".tmp/hybrid_any", `${comp}_p${r.i}`), { recursive: true, force: true }); } catch { /* keep */ } }
// فاصل الافتتاح (صارم، 2026-11-11): بعد دمج الأجزاء، للرندر الكامل العرضي فقط
if (start === 0 && !comp.startsWith("Fasel-") && !process.argv.includes("--no-bumper")) {
  execFileSync("node", ["tools/prepend_bumper.mjs", out, "--name", path.basename(out, path.extname(out))], { cwd: root, stdio: "inherit" });
}
