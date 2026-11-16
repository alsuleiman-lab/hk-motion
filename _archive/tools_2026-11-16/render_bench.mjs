// Render-speed benchmark (user order 2026-11-08: «اعمل كل الفحوصات لتعطيني أسرع نتيجة»). Renders the SAME 150 frames from the middle of one composition
// with different settings and prints frames/second per setting. Output goes to .tmp/bench and is deleted. One render at a time (render lock).
//   node tools/render_bench.mjs <CompositionId> [--props '{"frames":true}'] [--start 1500] [--len 150] [--only name,name]
import { renderMedia, selectComposition } from "@remotion/renderer";
import fs from "node:fs"; import os from "node:os";
import { nvencOverride } from "./nvenc.mjs";
import { acquireRenderLock } from "./render_lock.mjs";
import { cachedServeUrl, privateTemp } from "./lib/cached_bundle.mjs";

privateTemp("bench");
const [id, ...rest] = process.argv.slice(2);
const opt = (n, d) => (rest.includes("--" + n) ? rest[rest.indexOf("--" + n) + 1] : d);
const props = JSON.parse(opt("props", '{"frames":true}')), start = Number(opt("start", "1500")), len = Number(opt("len", "150"));
const only = opt("only", "").split(",").filter(Boolean);
acquireRenderLock("benchmark");
try { os.setPriority(0, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* ignore */ }
fs.mkdirSync(".tmp/bench", { recursive: true });
const { serveUrl } = await cachedServeUrl(id, { tag: "render" });
const composition = await selectComposition({ serveUrl, id, inputProps: props });
const nv = nvencOverride;
const CONFIGS = [
  { name: "warmup",        c: 3, gl: "angle", ff: nv },
  { name: "base c3 angle", c: 3, gl: "angle", ff: nv },
  { name: "c2",            c: 2, gl: "angle", ff: nv },
  { name: "c4",            c: 4, gl: "angle", ff: nv },
  { name: "c6",            c: 6, gl: "angle", ff: nv },
  { name: "c8",            c: 8, gl: "angle", ff: nv },
  { name: "c10",           c: 10, gl: "angle", ff: nv },
  { name: "c12",           c: 12, gl: "angle", ff: nv },
  { name: "gl=angle-egl c6", c: 6, gl: "angle-egl", ff: nv },
  { name: "gl=egl c6",       c: 6, gl: "egl", ff: nv },
  { name: "gl=vulkan c6",    c: 6, gl: "vulkan", ff: nv },
  { name: "gl=default c6",   c: 6, gl: undefined, ff: nv },
  { name: "jpeg70 c6",       c: 6, gl: "angle", ff: nv, jq: 70 },
  { name: "libx264 c6 (CPU enc)", c: 6, gl: "angle", ff: undefined },
];
const results = [];
// --rounds N: every setting N times in SHUFFLED order (the first run showed a warm-up bias: later settings were all faster) and the MEDIAN per setting
const rounds = Number(opt("rounds", "1")), runList = [];
for (let r = 0; r < rounds; r++) { const c = CONFIGS.filter((k) => k.name !== "warmup" || r === 0); if (rounds > 1) for (let i = c.length - 1; i > 1; i--) { const j = 1 + Math.floor(Math.random() * i); [c[i], c[j]] = [c[j], c[i]]; } runList.push(...c); }
for (const k of runList) {
  if (only.length && !only.includes(k.name)) continue;
  const out = `.tmp/bench/${k.name.replace(/\W+/g, "_")}.mp4`;
  const t0 = Date.now();
  try {
    await renderMedia({ composition, serveUrl, inputProps: props, codec: "h264", crf: 18, muted: true, frameRange: [start, start + len - 1], outputLocation: out,
      concurrency: k.c, chromiumOptions: k.gl ? { gl: k.gl } : {}, hardwareAcceleration: "if-possible", jpegQuality: k.jq, ffmpegOverride: k.ff, timeoutInMilliseconds: 180000, onProgress: () => {} });
    const s = (Date.now() - t0) / 1000; results.push({ name: k.name, s, fps: len / s });
    console.log(`${k.name.padEnd(24)} ${s.toFixed(1).padStart(6)} s  ${(len / s).toFixed(1).padStart(6)} fps`);
  } catch (e) { console.log(`${k.name.padEnd(24)} FAILED ${String(e.message ?? e).split("\n")[0].slice(0, 120)}`); }
  try { fs.unlinkSync(out); } catch { /* ignore */ }
}
const by = {}; for (const r of results.filter((x) => x.name !== "warmup")) (by[r.name] ??= []).push(r.fps);
const med = Object.entries(by).map(([name, v]) => ({ name, n: v.length, fps: v.sort((a, b) => a - b)[Math.floor(v.length / 2)], min: v[0], max: v[v.length - 1] })).sort((a, b) => b.fps - a.fps);
for (const m of med) console.log(`MEDIAN ${m.name.padEnd(24)} n=${m.n} ${m.fps.toFixed(1)} fps (${m.min.toFixed(1)}–${m.max.toFixed(1)})`);
if (med[0]) console.log(`BEST: ${med[0].name} ${med[0].fps.toFixed(1)} fps`);
