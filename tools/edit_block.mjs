// Scoped re-check after an edit: the edited span [A,B] (composition seconds) is ONE block — nothing outside it is checked or re-rendered (user order 2026-10-26).
//   node tools/edit_block.mjs <CompositionId> <A> <B> [--avoid a-b,… (designed scenes: skipped by frame_audit)] [--props '{"frames":true}'] [--chunk 3000] [--step 10]
// 1) face_check on the frames inside [A,B] only (every --step frames, plus both ends)
// 2) frame_audit with everything outside [A,B] skipped
// 3) deletes ONLY the chunk parts of render_work/chunked_<id>/ that overlap [A,B], so re-running the same render_chunked command re-renders just those parts
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const [id, A, B, ...rest] = process.argv.slice(2);
const opt = (n, d) => (rest.includes("--" + n) ? rest[rest.indexOf("--" + n) + 1] : d);
if (!id || !(Number(B) > Number(A))) { console.error("usage: node tools/edit_block.mjs <CompositionId> <A sec> <B sec> [--props '{...}'] [--chunk 3000] [--step 10]"); process.exit(2); }
const fps = 30, a = Number(A), b = Number(B), step = Number(opt("step", 10)), chunk = Number(opt("chunk", 3000));
const props = opt("props", "{}");
const f0 = Math.round(a * fps), f1 = Math.round(b * fps);
// sample points: --tsx <file> = 2–3 per element (start/middle/end) inside the block, --motion <json> = big face-movement moments; plus both ends of the block. No --tsx → uniform every --step frames
let frames = [];
if (opt("tsx", "")) {
  const ev = JSON.parse(spawnSync("node", ["tools/block_samples.mjs", "events", opt("tsx", "")], { encoding: "utf8" }).stdout || "[]");
  const mo = opt("motion", "") && fs.existsSync(opt("motion", "")) ? JSON.parse(fs.readFileSync(opt("motion", ""), "utf8")) : [];
  frames = [...new Set([...ev, ...mo].filter((s) => s >= a && s <= b).map((s) => Math.round(s * fps)).concat([f0, f1]))].sort((x, y) => x - y);
} else { for (let f = f0; f <= f1; f += step) frames.push(f); if (frames[frames.length - 1] !== f1) frames.push(f1); }
const port = opt("port", "3461");
const run = (args) => spawnSync("node", args, { stdio: "inherit" }).status === 0;
const out = path.join(".tmp", "edit_block_" + id); fs.mkdirSync(out, { recursive: true });
let ok = true;
console.log(`[edit_block] block ${a}s–${b}s = frames ${f0}–${f1} (${frames.length} samples)`);
ok = run(["tools/face_check.mjs", id, "--props", props, "--frames", frames.join(","), "--out", out, "--port", port]) && ok;
ok = run(["tools/frame_audit.mjs", id, "--props", props, "--skip", `0-${Math.max(0, a - 0.01)},${b + 0.01}-99999${opt("avoid", "") ? "," + opt("avoid", "") : ""}`]) && ok;
const dir = path.resolve(`render_work/chunked_${id}`);
if (fs.existsSync(dir) && !rest.includes("--keep")) {
  const first = Math.floor(f0 / chunk) * chunk, last = Math.floor(f1 / chunk) * chunk;
  const gone = [];
  for (const n of fs.readdirSync(dir)) { const m = n.match(/^part_(\d+)\.mp4$/); if (m && Number(m[1]) >= first && Number(m[1]) <= last) { fs.rmSync(path.join(dir, n)); gone.push(n); } }
  console.log(`[edit_block] chunk parts removed (only these re-render): ${gone.join(", ") || "none"}`);
}
console.log(ok ? "[edit_block] ✔ block checks passed" : "[edit_block] ✘ block checks failed — fix inside the block and re-run");
process.exit(ok ? 0 : 1);
