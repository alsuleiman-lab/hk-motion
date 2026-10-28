// Judder gate on the RENDERED output (R-RENDER-JUDDER.1; user 2026-10-26 «الفيديو يرتجف… حلّها من جذورها»).
//   node tools/judder_check.mjs <out.mp4> --src <source-video.mp4> --offset <output frame where source frame 0 shows> --name <project> [--windows 8] [--len 90]
//        [--crop x,y,w,h] [--src-crop x,y,w,h] [--avoid a-b,c-d (output seconds: curtains, zooms, shakes, cards…)] [--min 0.96]
// For an entirely animated composition with no source footage, use --animation to verify exact 30-fps frame timestamps and count.
// For several windows it decodes the output and the source, compares the SERIES of frame-to-frame differences (so static overlays do not matter) and counts the steps that agree:
// a stale / skipped / repeated frame made by the render shows as a step that disagrees. Passes when the agreeing share >= --min. Writes .tmp/gates/<name>.judder.ok (final_review.mjs needs it).
import { spawnSync } from "node:child_process";
import fs from "node:fs";

const [out, ...rest] = process.argv.slice(2);
const opt = (n, d) => (rest.includes("--" + n) ? rest[rest.indexOf("--" + n) + 1] : d);
const src = opt("src", ""), offset = Number(opt("offset", "0")), name = opt("name", ""), nW = Number(opt("windows", "8")), len = Number(opt("len", "90")), min = Number(opt("min", "0.96"));
if (rest.includes("--animation")) {
  if (!out || !name) { console.error("usage: node tools/judder_check.mjs <out.mp4> --animation --name <project>"); process.exit(2); }
  const metaRun = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate,duration,nb_frames", "-show_entries", "format=duration", "-of", "json", out], { encoding: "utf8", maxBuffer: 1 << 26 });
  const meta = JSON.parse(metaRun.stdout || "{}");
  const stream = meta.streams?.[0], rate = (stream?.r_frame_rate ?? "0/1").split("/").map(Number), fps = rate[1] ? rate[0] / rate[1] : 0;
  const duration = Number(meta.format?.duration ?? stream?.duration ?? 0), expected = Math.round(duration * fps);
  const ptsRun = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_frames", "-show_entries", "frame=best_effort_timestamp_time", "-of", "csv=p=0", out], { encoding: "utf8", maxBuffer: 1 << 28 });
  const pts = (ptsRun.stdout ?? "").split(/\r?\n/).map((x) => x.trim().split(",")[0]).filter((x) => x !== "").map(Number).filter(Number.isFinite);
  const deltas = pts.slice(1).map((v, i) => v - pts[i]);
  const frameStep = fps > 0 ? 1 / fps : 0;
  const bad = deltas.filter((d) => Math.abs(d - frameStep) > 0.00015).length;
  const ok = fps === 30 && pts.length === expected && bad === 0 && expected > 0;
  console.log(`animation frame cadence: ${pts.length}/${expected} timestamps at ${fps} fps; irregular intervals ${bad} — ${ok ? "PASSED" : "FAILED"}`);
  fs.mkdirSync(".tmp/gates", { recursive: true });
  const gate = `.tmp/gates/${name}.judder.ok`;
  if (ok) fs.writeFileSync(gate, JSON.stringify({ files: { [out]: fs.statSync(out).size }, method: "animation-pts", fps, frames: pts.length, irregularIntervals: bad }, null, 1));
  else { try { fs.rmSync(gate); } catch { /* no prior proof */ } }
  process.exit(ok ? 0 : 1);
}
if (!out || !src || !name) { console.error("usage: node tools/judder_check.mjs <out.mp4> --src <source.mp4> --offset <frames> --name <project> [--windows 8] [--len 90] [--crop x,y,w,h] [--src-crop x,y,w,h] [--avoid a-b,…]"); process.exit(2); }
const fps = 30, W = 110, H = 80, SZ = W * H;
const crop = opt("crop", "660,280,1100,800").split(",").map(Number);      // region of the OUTPUT frame
const srcCrop = opt("src-crop", "").split(",").filter(Boolean).map(Number);   // matching region of the SOURCE (when the output is a re-framed / cropped version, e.g. portrait)
const avoid = opt("avoid", "").split(",").filter(Boolean).map((r) => r.split("-").map(Number));
const dur = Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out], { encoding: "utf8" }).stdout);
const raw = (file, startSec, n, [cx, cy, cw, ch]) => spawnSync("ffmpeg", ["-v", "error", "-ss", String(startSec), "-i", file, "-frames:v", String(n), "-vf", `crop=${cw}:${ch}:${cx}:${cy},scale=${W}:${H},format=gray`, "-f", "rawvideo", "-"], { maxBuffer: 1 << 28 }).stdout;
const steps = (buf) => { const k = Math.floor(buf.length / SZ), r = []; for (let i = 1; i < k; i++) { let t = 0; for (let p = 0; p < SZ; p++) t += Math.abs(buf[i * SZ + p] - buf[(i - 1) * SZ + p]); r.push(t / SZ); } return r; };
const bad = (s, e) => avoid.some(([a, b]) => s < b && e > a);
const pick = [];
const at = opt("at", "");   // --at <output second>: one window starting exactly there (used by judder_probe.mjs on a 10-second clip)
if (at !== "") pick.push(Number(at));
else for (let k = 1; k <= nW; k++) { let s = (dur * k) / (nW + 1); for (let g = 0; g < 400 && (bad(s, s + len / fps + 0.5) || s * fps - offset < 5); g++) s += 0.5; if (s + len / fps < dur - 4) pick.push(+s.toFixed(3)); }
let agree = 0, total = 0, dup = 0;
for (const s of pick) {
  const a = steps(raw(out, s, len, crop)), b = steps(raw(src, s - offset / fps, len, srcCrop.length === 4 ? srcCrop : crop));
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) { total++; if (Math.abs(a[i] - b[i]) <= 0.35 + 0.15 * b[i]) agree++; else if (a[i] < 0.3 && b[i] >= 0.3) dup++; }
  console.log(`  window ${s.toFixed(1)}s: ${n} steps`);
}
const ratio = total ? agree / total : 0, ok = ratio >= min;
console.log(`judder: ${agree}/${total} steps agree with the source (${(ratio * 100).toFixed(1)}%), render-made repeats: ${dup} — ${ok ? "PASSED" : "FAILED (stale/skipped frames in the output)"}`);
fs.mkdirSync(".tmp/gates", { recursive: true });
const gate = `.tmp/gates/${name}.judder.ok`;
let g = { files: {} }; try { g = JSON.parse(fs.readFileSync(gate, "utf8")); } catch { /* new */ }
if (ok) { g.files[out] = fs.statSync(out).size; fs.writeFileSync(gate, JSON.stringify(g, null, 1)); } else if (g.files[out]) { delete g.files[out]; fs.writeFileSync(gate, JSON.stringify(g, null, 1)); }
process.exit(ok ? 0 : 1);
