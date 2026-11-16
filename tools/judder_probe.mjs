// 10-second judder probe BEFORE any full render (user order 2026-10-27: «دائماً رندر 10 ثواني من وسط الفيديو وافحص الارتجاف قبل ما ترندر بشكل كامل»).
//   node tools/judder_probe.mjs <CompositionId> --src <smoothed-cut.mp4> --offset <comp frame where source frame 0 shows> --name <project>
//        [--avoid a-b,c-d (comp seconds: curtains, zooms, shakes, card scenes…)] [--len 300] [--props '{"frames":true}']
// Renders `len` frames (default 300 = 10 s) from the MIDDLE of the composition with the final renderer (tools/gpu_render.mjs, since 2026-11-12), compares the
// result frame by frame with the source (judder_check.mjs) and only then writes .tmp/gates/<name>.probe.ok. The Bash hook refuses render_chunked / render_final
// for the project until a probe.ok newer than every src/*.tsx file exists.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const [id, ...rest] = process.argv.slice(2);
const opt = (n, d) => (rest.includes("--" + n) ? rest[rest.indexOf("--" + n) + 1] : d);
const src = opt("src", ""), offset = Number(opt("offset", "0")), name = opt("name", ""), len = Number(opt("len", "300"));
const props = opt("props", "");
const animation = rest.includes("--animation"), audioFile = opt("audio-file", "");
const avoid = opt("avoid", "").split(",").filter(Boolean).map((r) => r.split("-").map(Number));
if (!id || (!src && !animation) || !name) { console.error("usage: node tools/judder_probe.mjs <CompositionId> (--src <cut> | --animation --total-frames N) --name <project> [--audio-file <wav>]"); process.exit(2); }
const fps = 30;
// total frames from Root.tsx is not parseable reliably: ask the last progress line of an earlier render or the cut length (src duration + offset)
const srcDur = animation ? 0 : Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src], { encoding: "utf8" }).stdout);
const totalFrames = animation ? Number(opt("total-frames", "0")) : Math.round(srcDur * fps) + offset;
if (!Number.isInteger(totalFrames) || totalFrames < len) throw new Error("Invalid total frame count");
const bad = (s, e) => avoid.some(([a, b]) => s < b && e > a);
// --random (user 2026-11-16: «بعد ما يخلص مونتاج … فحص ارتجاف على عينة عشوائية من وسط الفيديو 10 ثواني»): a random window inside the middle 30–70 %
const random = rest.includes("--random");
let len2 = len;
let start = random ? Math.round(totalFrames * (0.3 + Math.random() * 0.4) - len / 2) : Math.round(totalFrames / 2 - len / 2);
// with a spec: only where nothing moves or covers him (tools/free_windows.mjs --spans: no split/half-screen element, verse, map, zoom, shake, behind, bumper) —
// a slide of his picture reads as judder (2026-11-16: a window on two half-screen picks gave 75 % on a clean render). Prefer the middle 30–70 %, else any clear stretch;
// the window is the clear stretch when it is shorter than 10 s (never under 4.5 s).
if (random && fs.existsSync(path.join("data", "specs", `${name}.json`))) {
  const fw = spawnSync(process.execPath, ["tools/free_windows.mjs", name, "--spans"], { encoding: "utf8" });
  const spans = (fw.stdout || "").trim().split(/\s+/).filter(Boolean).map((x) => x.split("-").map(Number)).map(([a, b]) => [Math.round(a * fps) + offset, Math.round(b * fps) + offset]);
  const mid = spans.filter(([a, b]) => b > totalFrames * 0.3 && a < totalFrames * 0.7), pool = mid.length ? mid : spans;
  if (pool.length) {
    const best = Math.max(...pool.map(([a, b]) => b - a)), fit = pool.filter(([a, b]) => b - a >= Math.min(len, best));
    const [a, b] = fit[Math.floor(Math.random() * fit.length)];
    len2 = Math.min(len, b - a);
    start = a + Math.floor(Math.random() * Math.max(1, b - a - len2));
    console.log(`[probe] clear stretches: ${spans.length} (chose ${(a / fps).toFixed(1)}–${(b / fps).toFixed(1)} s)`);
  } else console.log("[probe] ⚠ no clear stretch in the spec: measuring in the middle");
}
start = Math.max(offset + 5, Math.min(start, totalFrames - len2));
for (let g = 0; g < 600 && (bad(start / fps - 0.5, (start + len2) / fps + 0.5) || start - offset < 5); g++) start += 15;
const end = start + len2 - 1;
console.log(`[probe] ${id}: frames ${start}-${end} (${(len2 / fps).toFixed(1)} s from the middle${random ? ", random" : ""})`);

const out = path.join(".tmp", `${name}_probe.mp4`);
fs.mkdirSync(".tmp", { recursive: true });
/* (2026-11-12, R-RENDER-GPU.1) the probe renders with the FINAL renderer, tools/gpu_render.mjs (render_chunked is the retired old path and is refused by
   hybrid_gate). --props only when given (the old default {"frames":true} switched the legacy extracted-frames path, which the GPU renderer does not use);
   --audio-file is accepted and ignored: the judder check reads the picture only. */
void audioFile;
const r = spawnSync("node", ["tools/gpu_render.mjs", "--comp", id, "--start", String(start), "--end", String(end), "--out", out, "--no-bumper", ...(props ? ["--props", props] : [])], { stdio: "inherit" });
if (r.status !== 0 || !fs.existsSync(out)) { console.error("[probe] render failed"); process.exit(1); }

const j = spawnSync("node", ["tools/judder_check.mjs", out, ...(animation ? ["--animation", "--name", name + "_probe"] : ["--src", src, "--offset", String(offset - start), "--name", name + "_probe", ...(opt("crop", "") ? ["--crop", opt("crop", "")] : []), ...(opt("src-crop", "") ? ["--src-crop", opt("src-crop", "")] : []), "--at", "0.4", "--len2", String(Math.min(len2 - 30, 270)), "--min", "0.96"] )], { stdio: "inherit" });
if (j.status !== 0) { console.error("[probe] ✘ judder found in the 10-second probe — fix the cause before any full render"); process.exit(1); }
fs.mkdirSync(".tmp/gates", { recursive: true });
fs.writeFileSync(`.tmp/gates/${name}.probe.ok`, JSON.stringify({ at: Date.now(), id, frames: [start, end], src }, null, 1));
console.log("[probe] ✔ passed — a full render is now allowed");
