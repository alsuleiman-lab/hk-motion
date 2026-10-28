// 10-second judder probe BEFORE any full render (user order 2026-10-27: «دائماً رندر 10 ثواني من وسط الفيديو وافحص الارتجاف قبل ما ترندر بشكل كامل»).
//   node tools/judder_probe.mjs <CompositionId> --src <smoothed-cut.mp4> --offset <comp frame where source frame 0 shows> --name <project>
//        [--avoid a-b,c-d (comp seconds: curtains, zooms, shakes, card scenes…)] [--len 300] [--props '{"frames":true}']
// Renders `len` frames (default 300 = 10 s) from the MIDDLE of the composition with the same fast path as the final render (extracted frames), compares the
// result frame by frame with the source (judder_check.mjs) and only then writes .tmp/gates/<name>.probe.ok. The Bash hook refuses render_chunked / render_final
// for the project until a probe.ok newer than every src/*.tsx file exists.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const [id, ...rest] = process.argv.slice(2);
const opt = (n, d) => (rest.includes("--" + n) ? rest[rest.indexOf("--" + n) + 1] : d);
const src = opt("src", ""), offset = Number(opt("offset", "0")), name = opt("name", ""), len = Number(opt("len", "300"));
const props = opt("props", '{"frames":true}');
const animation = rest.includes("--animation"), audioFile = opt("audio-file", "");
const avoid = opt("avoid", "").split(",").filter(Boolean).map((r) => r.split("-").map(Number));
if (!id || (!src && !animation) || !name) { console.error("usage: node tools/judder_probe.mjs <CompositionId> (--src <cut> | --animation --total-frames N) --name <project> [--audio-file <wav>]"); process.exit(2); }
const fps = 30;
// total frames from Root.tsx is not parseable reliably: ask the last progress line of an earlier render or the cut length (src duration + offset)
const srcDur = animation ? 0 : Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src], { encoding: "utf8" }).stdout);
const totalFrames = animation ? Number(opt("total-frames", "0")) : Math.round(srcDur * fps) + offset;
if (!Number.isInteger(totalFrames) || totalFrames < len) throw new Error("Invalid total frame count");
const bad = (s, e) => avoid.some(([a, b]) => s < b && e > a);
let start = Math.round(totalFrames / 2 - len / 2);
for (let g = 0; g < 600 && (bad(start / fps - 0.5, (start + len) / fps + 0.5) || start - offset < 5); g++) start += 15;
const end = start + len - 1;
console.log(`[probe] ${id}: frames ${start}-${end} (${(len / fps).toFixed(1)} s from the middle)`);

const out = path.join(".tmp", `${name}_probe.mp4`);
fs.mkdirSync(".tmp", { recursive: true });
const r = spawnSync("node", ["tools/render_chunked.mjs", "--id", id, "--range", `${start}-${end}`, "--out", out, "--title", "probe", "--chunk", "3000", ...(audioFile ? ["--audio-file", audioFile] : [])], {
  stdio: "inherit", env: { ...process.env, RENDER_PROPS: props },
});
if (r.status !== 0 || !fs.existsSync(out)) { console.error("[probe] render failed"); process.exit(1); }

const j = spawnSync("node", ["tools/judder_check.mjs", out, ...(animation ? ["--animation", "--name", name + "_probe"] : ["--src", src, "--offset", String(offset - start), "--name", name + "_probe", ...(opt("crop", "") ? ["--crop", opt("crop", "")] : []), ...(opt("src-crop", "") ? ["--src-crop", opt("src-crop", "")] : []), "--at", "0.4", "--len", String(Math.min(len - 30, 270)), "--min", "0.96"] )], { stdio: "inherit" });
if (j.status !== 0) { console.error("[probe] ✘ judder found in the 10-second probe — fix the cause before any full render"); process.exit(1); }
fs.mkdirSync(".tmp/gates", { recursive: true });
fs.writeFileSync(`.tmp/gates/${name}.probe.ok`, JSON.stringify({ at: Date.now(), id, frames: [start, end], src }, null, 1));
console.log("[probe] ✔ passed — a full render is now allowed");
