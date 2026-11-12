// (2026-11-12, R-RENDER-GPU.1: «يجب نقل كل شيء إلى طريقتنا الجديدة») — kept only so that old commands still work: it now runs the GPU renderer.
//   node tools/hybrid_parallel.mjs --comp <CompositionId> --out <file.mp4> [--start 0] [--end <lastFrame>] [--no-bumper]
// = node tools/gpu_render.mjs with the same range. The split into --parts parallel hybrid_any processes is gone: gpu_render already works on several
// windows at once (≈ 58 fps against 6.7 per hybrid process). --parts / --conc are accepted and ignored. The bumper rule is gpu_render's own
// (a full range gets it, BUMPER_AT / BUMPER_ID / BUMPER_POSITION honoured). The old parallel hybrid is in git history (before this commit).
import { spawnSync } from "node:child_process";
import path from "node:path";

const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i < 0 ? d : process.argv[i + 1]; };
const comp = arg("comp"), out = arg("out");
if (!comp || !out) { console.error("usage: node tools/hybrid_parallel.mjs --comp <Id> --out <file.mp4> [--start 0] [--end <lastFrame>] [--no-bumper]"); process.exit(2); }
const root = path.resolve(import.meta.dirname, "..");
console.log("[hybrid_parallel] → tools/gpu_render.mjs (the GPU renderer replaces the parallel hybrid, R-RENDER-GPU.1)");
const r = spawnSync("node", ["tools/gpu_render.mjs", "--comp", comp, "--out", path.resolve(root, out),
  ...(arg("start", null) ? ["--start", arg("start")] : []), ...(arg("end", null) ? ["--end", arg("end")] : []), ...(process.argv.includes("--no-bumper") ? ["--no-bumper"] : [])], { cwd: root, stdio: "inherit" });
process.exit(r.status ?? 1);
