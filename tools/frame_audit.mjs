// "Is the montage doing any work?" audit — MANDATORY before showing a video (user 2026-10-19: «المونتاج ضعيف، لا عمل فيه»).
//   node tools/frame_audit.mjs <CompositionId> [--step 2] [--max 5] [--skip 0-60,300-330] [--props '{}']
// Renders every <step> seconds twice (normal, and with hideGfx) and measures how many pixels the <Gfx> layer changes.
// A frame with < 1.5% changed pixels = "plain" (talking head with nothing designed on it). FAIL if plain frames run longer than --max seconds.
// --skip ranges (seconds) are excluded when the BASE layer itself is designed (baked intro, designed clip scenes).
import { cachedServeUrl, privateTemp } from "./lib/cached_bundle.mjs";
privateTemp("frameaudit");   // 2026-10-25: asset folders of every still went to the shared temp and piled up; now private + deleted on exit
const { openBrowser, renderFrames, renderStill, selectComposition } = await import("@remotion/renderer");
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
const argv = process.argv.slice(2), id = argv[0];
const opt = (n, d) => (argv.includes("--" + n) ? argv[argv.indexOf("--" + n) + 1] : d);
const step = Number(opt("step", 2)), maxPlain = Number(opt("max", 5)), props = JSON.parse(opt("props", "{}"));
const skips = opt("skip", "").split(",").filter(Boolean).map((r) => r.split("-").map(Number));
const out = ".tmp/audit"; fs.mkdirSync(out, { recursive: true });
const PY = "C:/Users/mshms/AppData/Local/Programs/Python/Python310/python.exe";
const { serveUrl } = await cachedServeUrl(id, { tag: "frameaudit" });   // cached code bundle + hard-linked assets (was: the whole public/ copied, 5.4 GB per run)
// --port (2026-10-25): the default 3000 is sometimes taken → "Error while getting compositions"
const port = Number(opt("port", process.env.FRAME_AUDIT_PORT ?? "3461"));
const comp = await selectComposition({ serveUrl, id, inputProps: props, port });
const dur = comp.durationInFrames / comp.fps;
// speed + disk (2026-10-25, same fix as face_check): ONE renderFrames call per pass (frameRange + everyNthFrame) so the video is loaded once instead of being copied
// into a temp folder for every still; FA_CONC tabs (default 3) in parallel.
const nth = Math.max(1, Math.round(step * comp.fps)), first = Math.round(0.5 * comp.fps);
const frames = []; for (let f = first; f < comp.durationInFrames; f += nth) frames.push(f);
const browser = await openBrowser("chrome", { chromiumOptions: { gl: "angle" } });
const pass = (ip, tag) => renderFrames({ composition: comp, serveUrl, inputProps: ip, imageFormat: "png", scale: 0.25, frameRange: [first, frames[frames.length - 1]], everyNthFrame: nth, outputDir: null,
  onFrameBuffer: (buf, fr) => fs.writeFileSync(`${out}/${tag}${fr}.png`, buf), onStart: () => {}, concurrency: Number(process.env.FA_CONC || 3), port, puppeteerInstance: browser, chromiumOptions: { gl: "angle" }, timeoutInMilliseconds: Number(process.env.RT || 30000) });
await pass(props, "a");
await pass({ ...props, hideGfx: true }, "b");
await browser.close({ silent: true }).catch(() => {});
const rows = frames.map((fr) => {
  const t = fr / comp.fps;
  if (skips.some(([a, b]) => t >= a && t <= b)) return { t, plain: false, skipped: true };
  const r = spawnSync(PY, [path.resolve("tools/frame_audit.py"), `${out}/a${fr}.png`, `${out}/b${fr}.png`], { encoding: "utf8" });
  const g = JSON.parse(r.stdout.trim().split("\n").pop()).gfx;
  fs.rmSync(`${out}/a${fr}.png`, { force: true }); fs.rmSync(`${out}/b${fr}.png`, { force: true });
  return { t, gfx: g, plain: g < 0.015 };
});
let worst = { len: 0, from: 0 }, run = null;
for (const r of rows) { if (r.plain) { run = run ?? { from: r.t, to: r.t }; run.to = r.t; const len = run.to - run.from + step; if (len > worst.len) worst = { len, from: run.from, to: run.to }; } else run = null; }
const plainShare = rows.filter((r) => r.plain).length / rows.filter((r) => !r.skipped).length;
console.log(rows.map((r) => `${r.t.toFixed(0)}s:${r.skipped ? "skip" : r.plain ? "PLAIN" : "ok"}`).join(" "));
console.log(`plain share ${(plainShare * 100).toFixed(0)}%, longest plain stretch ${worst.len}s (${worst.from?.toFixed?.(0)}s–${worst.to?.toFixed?.(0)}s), limit ${maxPlain}s`);
const firstPlain = rows.filter((r) => r.plain && r.t < 60);
if (firstPlain.length) { console.log(`FAILED: first minute must never be plain — plain at ${firstPlain.map((r) => r.t.toFixed(0) + "s").join(", ")}`); process.exit(1); }
if (worst.len > maxPlain) { console.log("FAILED: add motion graphics / written elements to the plain stretch, then re-run."); process.exit(1); }
console.log("PASSED");
