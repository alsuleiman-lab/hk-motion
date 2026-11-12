// Render several still frames of one composition (for checking scenes without a full render).
//   node tools/stills.mjs <CompositionId> <outDir> name:frame name:frame ... [--scale 0.5] [--manifest <file>] [--clean] [--legacy] [--jobs 1]
//
// 2026-10-22 (user order): NEVER copy the whole public/ folder. Remotion's bundle() copies publicDir into the bundle on every run (7 GB here, 1-2 min each time).
// New method:
//   1. the CODE is bundled with an EMPTY publicDir and the bundle is CACHED in .tmp/stills_bundle/<Id> (re-bundled only when src/** or package.json changed);
//   2. the ASSETS the project needs are HARD-LINKED (instant, no copy, same S: volume) into <bundle>/public with their relative paths unchanged, so staticFile("kh/x.png") still works.
//   Which assets? Automatically: Root.tsx -> the composition's component file -> every local import (recursively); each string / template literal in them that names a file
//   (or a folder prefix like `kh/alpha_${n}.webm`, `fonts/${f}`) and exists under public/ is linked. Add more with a manifest (one path or folder per line, relative to public/; # comments).
//   Originals are never touched; nothing is deleted except the cached bundle's own public/ links when you pass --clean.
//   --legacy = the old behaviour (bundle with the real public/), env PD=<dir> = bundle with that publicDir as-is.
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import path from "path"; import fs from "fs"; import os from "os";
import { cachedServeUrl, privateTemp } from "./lib/cached_bundle.mjs";
privateTemp("stills");   // per-still asset folders go to a private temp that is deleted on exit (2026-10-25)

const argv = process.argv.slice(2);
const flag = (n) => argv.includes("--" + n);
const opt = (n, d) => (flag(n) ? argv[argv.indexOf("--" + n) + 1] : d);
const valueFlags = new Set(["scale", "manifest", "jobs"]);
const pos = argv.filter((a, i) => !a.startsWith("--") && !(i > 0 && argv[i - 1].startsWith("--") && valueFlags.has(argv[i - 1].slice(2))));
const [id, outDir, ...pts] = pos;
if (!id || !outDir || !pts.length) { console.error("usage: node tools/stills.mjs <CompositionId> <outDir> name:frame ... [--scale 0.5] [--manifest file] [--clean] [--legacy]"); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });
const ENTRY = path.resolve(process.env.ENTRY ?? "src/index.ts");
const scale = Number(opt("scale", "0.5"));

// ───────── bundle (cached, shared with face_check/frame_audit: tools/lib/cached_bundle.mjs) ─────────
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
const comp = await selectComposition({ serveUrl, id, port: Number(process.env.STILLS_PORT ?? 3457), puppeteerInstance: browser });
const jobs = Math.max(1, Math.min(pts.length, Number(opt("jobs", process.env.STILLS_JOBS ?? "1"))));
let next = 0;
await Promise.all(Array.from({ length: jobs }, async () => {
  while (next < pts.length) {
    const p = pts[next++];
    const [name, fr] = p.split(":");
    await renderStill({ composition: comp, serveUrl, port: Number(process.env.STILLS_PORT ?? 3457), frame: Number(fr), output: path.join(outDir, name + ".png"), scale, puppeteerInstance: browser, timeoutInMilliseconds: Number(process.env.RT || 30000), chromiumOptions: { gl: "angle" } });
    console.log("still", name);
    // every renderStill leaves a ~1.6 GB remotion-*-assets* folder (audio preprocessing of the long cut) until exit: 35 stills = 58 GB = a full S: (2026-11-09). Delete them right after each still (single job only: parallel jobs may still use theirs).
    if (jobs === 1) for (const d of fs.readdirSync(os.tmpdir())) if (/^remotion-v[\d.]+-assets/.test(d)) { try { fs.rmSync(path.join(os.tmpdir(), d), { recursive: true, force: true }); } catch { /* in use */ } }
  }
}));
await browser.close({ silent: true });
if (flag("clean") && cacheDir) fs.rmSync(path.join(cacheDir, "public"), { recursive: true, force: true });
if (!cacheDir) { try { fs.rmSync(serveUrl, { recursive: true, force: true }); } catch { /* ignore */ } }
