// Fast trial render of a frame range of ONE composition (2026-11-12: on the GPU renderer, R-RENDER-GPU.1 — the old renderMedia path is retired).
//   node tools/render_trial.mjs <CompositionId> <out.mp4> [--frames 0-249] [--props '<json>']
// = node tools/gpu_render.mjs --comp <Id> --out <out> --start A --end B --no-bumper (one render at a time: gpu_render holds the render lock itself).
// The old renderMedia version needed tools/stills.mjs' cached bundle first; this one bundles on its own. --concurrency is accepted and ignored.
import { spawnSync } from "node:child_process";
import path from "node:path";

const argv = process.argv.slice(2);
const [id, out] = argv;
const opt = (n, d) => (argv.includes("--" + n) ? argv[argv.indexOf("--" + n) + 1] : d);
if (!id || !out) { console.error("usage: node tools/render_trial.mjs <CompositionId> <out.mp4> [--frames A-B] [--props '<json>']"); process.exit(2); }
const fr = opt("frames", null), [a, b] = fr ? fr.split("-").map(Number) : [];
const root = path.resolve(import.meta.dirname, "..");
const t0 = Date.now();
const r = spawnSync("node", ["tools/gpu_render.mjs", "--comp", id, "--out", path.resolve(out), "--no-bumper", ...(fr ? ["--start", String(a), "--end", String(b)] : []), ...(opt("props", null) ? ["--props", opt("props", null)] : [])], { cwd: root, stdio: "inherit" });
if (r.status !== 0) { console.error(`render_trial: gpu_render failed (exit ${r.status})`); process.exit(r.status ?? 1); }
console.log(`RENDERED ${id} frames ${fr ?? "all"} in ${((Date.now() - t0) / 1000).toFixed(1)} s -> ${out}`);
