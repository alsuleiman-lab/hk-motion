// Render several still frames of one composition (for checking scenes without a full render).
//   node tools/stills.mjs <CompositionId> <outDir> name:frame name:frame ... [--scale 0.5] [--props '<json>'] [--browser] [--manifest <file>] [--clean] [--legacy] [--jobs 1]
//
// ON THE CARD BY DEFAULT (user 2026-11-13/14 «من المفترض ان نعمل على الكرت فقط» / «شغلة الإطارات بدنا ننقلها»; 2026-11-19 «ألا يمكن أن تنقل هذه إلى كرت الشاشة»):
//   the frames come from the GPU engine (tools/gpu_render.mjs --frames f,f,… --frames-dir <dir>, the same pixels as its video render, as tools/grid_sheet.mjs does);
//   each gp_<frame>.png becomes <outDir>/<name>.png at the asked --scale (default 0.5, same size as the browser way: round(width·scale) × round(height·scale)).
//   Output names, folder and size are unchanged for the callers. Over black where the composition is transparent (the engine draws a video frame).
//   --browser = Remotion's browser renderStill on the PROCESSOR, on purpose (the reference look for comparing against the engine, a transparent PNG, an image
//   asset under 160 px). If the engine fails, the browser way runs automatically with a LOUD «✘» warning on stderr. --legacy / env PD / env ENTRY imply --browser.
//
// The browser way (2026-10-22, user order): NEVER copy the whole public/ folder. Remotion's bundle() copies publicDir into the bundle on every run (7 GB here, 1-2 min each time).
//   1. the CODE is bundled with an EMPTY publicDir and the bundle is CACHED in .tmp/stills_bundle/<Id> (re-bundled only when src/** or package.json changed);
//   2. the ASSETS the project needs are HARD-LINKED (instant, no copy, same S: volume) into <bundle>/public with their relative paths unchanged, so staticFile("kh/x.png") still works.
//   Which assets? Automatically: Root.tsx -> the composition's component file -> every local import (recursively); each string / template literal in them that names a file
//   (or a folder prefix like `kh/alpha_${n}.webm`, `fonts/${f}`) and exists under public/ is linked. Add more with a manifest (one path or folder per line, relative to public/; # comments).
//   Originals are never touched; nothing is deleted except the cached bundle's own public/ links when you pass --clean.
//   --legacy = the old behaviour (bundle with the real public/), env PD=<dir> = bundle with that publicDir as-is.
import path from "path"; import fs from "fs"; import os from "os";
import { spawn, spawnSync } from "child_process";
import { fileURLToPath } from "url";

const argv = process.argv.slice(2);
const flag = (n) => argv.includes("--" + n);
const opt = (n, d) => (flag(n) ? argv[argv.indexOf("--" + n) + 1] : d);
const valueFlags = new Set(["scale", "manifest", "jobs", "props"]);
const pos = argv.filter((a, i) => !a.startsWith("--") && !(i > 0 && argv[i - 1].startsWith("--") && valueFlags.has(argv[i - 1].slice(2))));
const [id, outDir, ...pts] = pos;
if (!id || !outDir || !pts.length) { console.error("usage: node tools/stills.mjs <CompositionId> <outDir> name:frame ... [--scale 0.5] [--props '<json>'] [--browser] [--manifest file] [--clean] [--legacy]"); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });
const scale = Number(opt("scale", "0.5"));
/* --props '{json}' (2026-11-12): inputProps for every still (layout experiments without touching the spec) */
const PROPS_RAW = (() => { const i = process.argv.indexOf("--props"); return i > 0 ? process.argv[i + 1] : null; })();
const PROPS = (() => { try { return PROPS_RAW ? JSON.parse(PROPS_RAW) : {}; } catch { return {}; } })();

// ───────── the GPU engine (default) ─────────
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pngSize = (f) => { const b = Buffer.alloc(24); const fd = fs.openSync(f, "r"); try { fs.readSync(fd, b, 0, 24, 0); } finally { fs.closeSync(fd); } return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };
const gpuStills = async () => {
  const frameOf = (p) => Number(p.split(":")[1]);
  const frames = [...new Set(pts.map(frameOf))];
  const gdir = path.resolve(outDir, `.gpu_frames_${process.pid}`);
  fs.rmSync(gdir, { recursive: true, force: true });
  const args = ["tools/gpu_render.mjs", "--comp", id, "--frames", frames.join(","), "--frames-dir", gdir, "--procs", "1", "--windows", String(Math.min(3, frames.length)), ...(PROPS_RAW ? ["--props", PROPS_RAW] : [])];
  /* the engine's chatter goes to stderr (callers read this tool's stdout); a hung engine is stopped with everything under it (Electron, python) */
  let tail = "";
  const code = await new Promise((res) => {
    const c = spawn(process.execPath, args, { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    const take = (d) => { process.stderr.write(d); tail = (tail + d).slice(-8000); };
    c.stdout.on("data", take); c.stderr.on("data", take);
    const limit = Number(process.env.STILLS_GPU_TIMEOUT_S || 900) * 1000;
    const timer = setTimeout(() => { tail += `\n(timed out after ${limit / 1000} s)`; spawnSync("taskkill", ["/T", "/F", "/PID", String(c.pid)], { windowsHide: true }); }, limit);
    c.on("close", (k) => { clearTimeout(timer); res(k); });
    c.on("error", (e) => { clearTimeout(timer); tail += "\n" + e.message; res(-1); });
  });
  const gp = (f) => path.join(gdir, `gp_${String(f).padStart(6, "0")}.png`);
  const missing = frames.filter((f) => !fs.existsSync(gp(f)));
  if (code !== 0 || missing.length) {
    fs.rmSync(gdir, { recursive: true, force: true });
    const why = code === 2 && /too small for the NVENC/.test(tail) ? "the composition is under 160 px — an image asset, the engine encodes video only" : `exit ${code}${missing.length ? `, ${missing.length} frame(s) not written` : ""}: ${(() => { const L = tail.trim().split(/\r?\n/).filter(Boolean), e = L.filter((l) => /✘|Error\b|failed|stopped/i.test(l)); return (e.length ? e.slice(-1) : L.slice(-2)).join(" | ").slice(0, 400); })()}`;
    return why;
  }
  for (const p of pts) {
    const [name, fr] = p.split(":"), src = gp(Number(fr)), dst = path.join(outDir, name + ".png");
    if (scale === 1) { fs.copyFileSync(src, dst); console.log("still", name); continue; }
    const { w, h } = pngSize(src), W = Math.max(1, Math.round(w * scale)), H = Math.max(1, Math.round(h * scale));
    const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-threads", "1", "-i", src, "-vf", `scale=${W}:${H}:flags=lanczos`, "-frames:v", "1", dst], { windowsHide: true, encoding: "utf8" });
    if (r.status !== 0) { fs.rmSync(gdir, { recursive: true, force: true }); return `resize of ${name} failed: ${(r.stderr || "").trim().split("\n").pop()}`; }
    console.log("still", name);
  }
  fs.rmSync(gdir, { recursive: true, force: true });
  return null;
};

const BROWSER = flag("browser") || flag("legacy") || !!process.env.PD || !!process.env.ENTRY;
if (!BROWSER) {
  const why = await gpuStills();
  if (!why) process.exit(0);
  console.error("\n✘✘✘ STILLS: THE GPU ENGINE FAILED — FALLING BACK TO REMOTION'S BROWSER ON THE PROCESSOR (CPU-heavy; user order: frames belong on the card) ✘✘✘");
  console.error(`✘ reason: ${why}`);
  console.error("✘ fix the engine (node tools/gpu_render.mjs --comp " + id + " --frames <f> --frames-dir <dir>), or pass --browser when the browser way is meant\n");
}

// ───────── Remotion's browser (--browser, or the fallback above) ─────────
const { bundle } = await import("@remotion/bundler");
const { openBrowser, renderStill, selectComposition } = await import("@remotion/renderer");
const { cachedServeUrl, privateTemp } = await import("./lib/cached_bundle.mjs");
privateTemp("stills");   // per-still asset folders go to a private temp that is deleted on exit (2026-10-25)
const ENTRY = path.resolve(process.env.ENTRY ?? "src/index.ts");

// bundle (cached, shared with face_check/frame_audit: tools/lib/cached_bundle.mjs)
let serveUrl, cacheDir = null;
if (flag("legacy") || process.env.PD) {
  serveUrl = await bundle({ entryPoint: ENTRY, publicDir: process.env.PD ? path.resolve(process.env.PD) : undefined, onProgress: () => {} });
} else {
  ({ serveUrl, cacheDir } = await cachedServeUrl(id, { manifest: opt("manifest", process.env.STILLS_MANIFEST ?? ""), manifestOnly: flag('manifest-only'), tag: "stills" }));
}

// SPEED (2026-10-22, from the official Remotion skills: one call for many frames): ONE shared headless browser for every still (no launch per frame) and the frames are rendered
// sequentially by default (--jobs N or env STILLS_JOBS for parallel: MEASURED slower here — 3 workers 12.2-13.0 s vs 1 worker 9.4-9.7 s for 6 stills, GPU/CPU contention). Output names/format are unchanged.
{ let freeGB = Infinity; try { const s = fs.statfsSync(process.cwd()); freeGB = (s.bavail * s.bsize) / 1073741824; } catch { /* unknown: go on */ } if (freeGB < 15) { console.error(`مساحة S الحرة ${freeGB.toFixed(1)} GB أقل من 15 GB: أوقفتُ اللقطات (حدّ المساحة، PREFERENCES القسم القرص). حرّر مؤقتاتك أولاً.`); process.exit(3); } }
const browser = await openBrowser("chrome", { chromiumOptions: { gl: "angle" }, logLevel: "error" });
// another session may hold 3457 (2026-11-12): take the first free port from 3457 up unless STILLS_PORT is set
const STILLS_PORT = process.env.STILLS_PORT ? Number(process.env.STILLS_PORT) : await (async () => { const net = await import("node:net"); for (let p = 3457; p < 3500; p++) { const free = await new Promise((r) => { const sv = net.createServer().once("error", () => r(false)).once("listening", () => sv.close(() => r(true))).listen(p, "127.0.0.1"); }); if (free) return p; } return 3457; })();
const comp = await selectComposition({ serveUrl, id, port: STILLS_PORT, puppeteerInstance: browser, inputProps: PROPS });
const jobs = Math.max(1, Math.min(pts.length, Number(opt("jobs", process.env.STILLS_JOBS ?? "1"))));
let next = 0;
await Promise.all(Array.from({ length: jobs }, async () => {
  while (next < pts.length) {
    const p = pts[next++];
    const [name, fr] = p.split(":");
    await renderStill({ composition: comp, serveUrl, inputProps: PROPS, port: STILLS_PORT, frame: Number(fr), output: path.join(outDir, name + ".png"), scale, puppeteerInstance: browser, timeoutInMilliseconds: Number(process.env.RT || 180000), chromiumOptions: { gl: "angle" } });
    console.log("still", name);
    // every renderStill leaves a ~1.6 GB remotion-*-assets* folder (audio preprocessing of the long cut) until exit: 35 stills = 58 GB = a full S: (2026-11-09). Delete them right after each still (single job only: parallel jobs may still use theirs).
    if (jobs === 1) for (const d of fs.readdirSync(os.tmpdir())) if (/^remotion-v[\d.]+-assets/.test(d)) { try { fs.rmSync(path.join(os.tmpdir(), d), { recursive: true, force: true }); } catch { /* in use */ } }
  }
}));
await browser.close({ silent: true });
if (flag("clean") && cacheDir) fs.rmSync(path.join(cacheDir, "public"), { recursive: true, force: true });
if (!cacheDir) { try { fs.rmSync(serveUrl, { recursive: true, force: true }); } catch { /* ignore */ } }
