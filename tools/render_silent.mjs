// Render any composition (used for the silent-reaction videos) with the progress window and a notification at the end.
// 2026-11-12: on the GPU renderer (R-RENDER-GPU.1) — the old renderMedia path is retired. Same arguments as before:
//   node tools/render_silent.mjs <CompositionId> "<out.mp4>" "<window title>" [--props '{"name":"x","orient":"portrait"}']
// = node tools/gpu_render.mjs --comp <Id> --out <out> --name <title> --props … with BUMPER_POSITION=end (the bumper closes the silent clip, 2026-11-15). OUT/TITLE env: safe for Arabic paths from PowerShell.
import { spawnSync } from "node:child_process";
import path from "node:path";
import { sendNotification } from "./notify.mjs";

const [id, outArg, titleArg, ...rest] = process.argv.slice(2);
const out = process.env.OUT ?? outArg, title = process.env.TITLE ?? titleArg;
if (!id || !out) { console.error('usage: node tools/render_silent.mjs <CompositionId> "<out.mp4>" "<window title>" [--props \'<json>\']'); process.exit(2); }
const props = rest.includes("--props") ? rest[rest.indexOf("--props") + 1] : null;
const root = path.resolve(import.meta.dirname, "..");
const r = spawnSync("node", ["tools/gpu_render.mjs", "--comp", id, "--out", path.resolve(out), ...(title ? ["--name", title] : []), ...(props ? ["--props", props] : [])], { cwd: root, stdio: "inherit", env: { ...process.env, BUMPER_POSITION: "end" } });   // التعليق الصامت: الفاصل في آخره (أمر 2026-11-15)
if (r.status !== 0) { console.error(`render_silent: gpu_render failed (exit ${r.status})`); process.exit(r.status ?? 1); }
console.log("RENDERED →", out);

sendNotification({
  title: "اكتمل المونتاج والرندرة بنجاح ✅",
  body: `${title ?? id}\nالمسار: ${out}`,
  source: "مونتاج ورندر البثوث",
  link: out,
});
