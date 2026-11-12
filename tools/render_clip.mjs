// Render one short composition to an MP4 (test clips / previews) — 2026-11-12: on the GPU renderer (R-RENDER-GPU.1), the old renderMedia path is retired.
//   node tools/render_clip.mjs <CompositionId> <out.mp4> [--props '<json>']        SCALE=0.5 = half-size preview (resized on the GPU)
// = node tools/gpu_render.mjs --comp <Id> --out <out> --no-bumper [--scale k]. One render at a time: gpu_render holds the render lock itself.
import { spawnSync } from "node:child_process";
import path from "node:path";

const argv = process.argv.slice(2);
const [id, out] = argv;
if (!id || !out) { console.error("usage: node tools/render_clip.mjs <CompositionId> <out.mp4> [--props '<json>']   (SCALE=0.5 for a half-size preview)"); process.exit(2); }
const props = argv.includes("--props") ? argv[argv.indexOf("--props") + 1] : null;
const scale = Number(process.env.SCALE ?? 1) || 1;
const root = path.resolve(import.meta.dirname, "..");
const r = spawnSync("node", ["tools/gpu_render.mjs", "--comp", id, "--out", path.resolve(out), "--no-bumper", ...(scale !== 1 ? ["--scale", String(scale)] : []), ...(props ? ["--props", props] : [])], { cwd: root, stdio: "inherit" });
if (r.status !== 0) { console.error(`render_clip: gpu_render failed (exit ${r.status})`); process.exit(r.status ?? 1); }
console.log("RENDERED →", out);
