// Are duplicated frames a REAL problem for this video? (user order 2026-10-22: never smooth automatically — measure first.)
//   node tools/dup_check.mjs <video> [--region x,y,w,h] [--thr 0.35] [--force]
// One NVDEC pass at native frame rate on a 480x270 gray proxy; frame i is a "dup" if its mean |diff| to frame i-1 inside the region is below --thr (0-255 scale).
// Reports: dup ratio, per-10-s density, the CADENCE (regular 4-6 frame gaps = frame-rate pulldown) and how many MOVING seconds are jittery (coefficient of variation of the per-frame motion).
// Verdict "smooth" only if ratio >= 5 % AND (jittery moving seconds >= 30 % or >= 70 % regular cadence); "borderline" at >= 15 % / >= 50 % (real but mild: decide with the user, never automatically); it lists the worst 10-s ranges so smoothing can be limited to them.
// Result cached in .tmp/cache/<video id>/dups.json (reused while video + logic + params match). Nothing is modified.
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const LOGIC = 2;
const argv = process.argv.slice(2);
const video = argv.find((a) => !a.startsWith("--") && !/^[\d.,]+$/.test(a));
const flag = (n) => argv.includes("--" + n), opt = (n, d) => (flag(n) ? argv[argv.indexOf("--" + n) + 1] : d);
if (!video) { console.error("usage: node tools/dup_check.mjs <video> [--region x,y,w,h] [--thr 0.35] [--force]"); process.exit(2); }
const abs = path.resolve(video), st = fs.statSync(abs);
const head = Buffer.alloc(Math.min(1 << 20, st.size)); { const fd = fs.openSync(abs, "r"); fs.readSync(fd, head, 0, head.length, 0); fs.closeSync(fd); }
const fp = crypto.createHash("sha1").update(`${abs}|${st.size}|${Math.round(st.mtimeMs)}|`).update(head).digest("hex");
const dir = path.join(process.cwd(), ".tmp", "cache", fp.slice(0, 16)); fs.mkdirSync(dir, { recursive: true });
const region = opt("region", "960,0,960,1080").split(",").map(Number), thr = Number(opt("thr", "0.35"));
const params = crypto.createHash("sha1").update(JSON.stringify({ region, thr })).digest("hex").slice(0, 12);
const out = path.join(dir, "dups.json");
try { const r = JSON.parse(fs.readFileSync(out, "utf8")); if (!flag("force") && r.input === fp && r.logic === LOGIC && r.params === params) { console.log(`reused (${r.seconds}s when computed)`); console.log(JSON.stringify(r.result.summary, null, 1)); process.exit(0); } } catch { /* compute */ }

const W = 480, H = 270, S = 4, rx = Math.round(region[0] / S), ry = Math.round(region[1] / S), rw = Math.round(region[2] / S), rh = Math.round(region[3] / S);
const probe = JSON.parse((await import("node:child_process")).spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate,codec_name", "-of", "json", abs], { encoding: "utf8" }).stdout).streams[0];
const [a, b] = probe.r_frame_rate.split("/").map(Number), fps = a / b, gpu = ["hevc", "h264", "av1", "vp9"].includes(probe.codec_name);
const vf = gpu ? `scale_cuda=${W}:${H},hwdownload,format=nv12,format=gray` : `scale=${W}:${H},format=gray`;
const t0 = process.hrtime.bigint();
const diffs = []; let prev = null, buf = Buffer.alloc(0);
await new Promise((resolve, reject) => {
  const p = spawn("ffmpeg", ["-hide_banner", "-v", "error", ...(gpu ? ["-hwaccel", "cuda", "-hwaccel_output_format", "cuda"] : []), "-i", abs, "-vf", vf, "-f", "rawvideo", "pipe:1"], { stdio: ["ignore", "pipe", "inherit"], windowsHide: true });
  p.stdout.on("data", (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    while (buf.length >= W * H) {
      const f = buf.subarray(0, W * H); buf = buf.subarray(W * H);
      if (prev) { let d = 0, n = 0; for (let y = ry; y < ry + rh; y += 2) for (let x = rx; x < rx + rw; x += 2) { d += Math.abs(f[y * W + x] - prev[y * W + x]); n++; } diffs.push(d / n); } else diffs.push(0);
      prev = Buffer.from(f);
    }
  });
  p.on("error", reject); p.on("close", (c) => (c === 0 ? resolve() : reject(new Error("ffmpeg exit " + c))));
});
const seconds = Number(process.hrtime.bigint() - t0) / 1e9;
const dup = diffs.map((d, i) => i > 0 && d < thr);
const total = diffs.length, dups = dup.filter(Boolean).length;
const med = [...diffs.filter((d, i) => i > 0 && !dup[i])].sort((x, y) => x - y)[Math.floor(total / 2)] || 1;
// cadence: intervals (in frames) between consecutive dups; a regular 4-6 frame cadence = frame-rate-conversion pulldown (24->30 gives a dup every 5th frame)
const pos = []; for (let i = 1; i < total; i++) if (dup[i]) pos.push(i);
const gaps = pos.slice(1).map((p, i) => p - pos[i]);
const regular = gaps.length ? gaps.filter((g) => g >= 4 && g <= 6).length / gaps.length : 0;
let isolated = 0;
for (let i = 1; i < total - 1; i++) if (dup[i] && !dup[i - 1] && !dup[i + 1]) isolated++;
// visible judder: in each 1-second window WITH motion (mean motion > 0.8), the coefficient of variation of the per-frame motion; dups make it large (zeros between moving frames)
let movingSecs = 0, jitterySecs = 0;
for (let i = 0; i + Math.round(fps) <= total; i += Math.round(fps)) {
  const w = diffs.slice(i, i + Math.round(fps)), m = w.reduce((x, y) => x + y, 0) / w.length;
  if (m <= 0.8) continue; movingSecs++;
  const sd = Math.sqrt(w.reduce((x, y) => x + (y - m) ** 2, 0) / w.length); if (sd / m > 0.7) jitterySecs++;
}
const judder = movingSecs ? jitterySecs / movingSecs : 0, hitch = 0;
const per10 = {};
for (let i = 0; i < total; i++) if (dup[i]) { const k = Math.floor(i / fps / 10) * 10; per10[k] = (per10[k] ?? 0) + 1; }
const worst = Object.entries(per10).map(([k, n]) => ({ from: +k, to: +k + 10, dupRatio: +(n / (fps * 10)).toFixed(3) })).sort((x, y) => y.dupRatio - x.dupRatio).slice(0, 10);
const ratio = dups / total;
const strong = ratio >= 0.05 && (judder >= 0.3 || regular >= 0.7) && movingSecs > 0, weak = ratio >= 0.05 && (judder >= 0.15 || regular >= 0.5) && movingSecs > 0;
const verdict = strong ? "smooth" : weak ? "borderline" : "leave";
const summary = { frames: total, fps, dups, dupRatio: +ratio.toFixed(4), isolatedShare: +(dups ? isolated / dups : 0).toFixed(3), regularCadenceShare: +regular.toFixed(3), movingSeconds: movingSecs, jitterySecondsShare: +judder.toFixed(3), medianMotion: +med.toFixed(2), verdict, note: verdict === "borderline" ? "real but mild: frequent dups with a mostly regular cadence (frame-rate pulldown). Do NOT smooth automatically; smooth only if the user still sees tremor, and then only the moving seconds" : verdict === "smooth" ? "dups are frequent and move-seconds are jittery / the cadence is regular pulldown: smoothing is justified (a rate-conversion judder the eye sees)" : "dups are rare or not visible: do NOT smooth", worst };
fs.writeFileSync(out, JSON.stringify({ input: fp, logic: LOGIC, params, source: abs, created: new Date().toISOString(), seconds: +seconds.toFixed(1), result: { summary, per10 } }, null, 1));
console.log(`done in ${seconds.toFixed(1)} s`); console.log(JSON.stringify(summary, null, 1));
