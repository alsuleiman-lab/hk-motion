// WHOLE-LIBRARY CHECK of the GPU renderer (2026-11-13, user: «أصلح كل شيء حتى الكرتون وغيره»).
// For every composition (active, archived and reference, shown through inputProps showArchive/showReference — src/archive.ts):
//   a short span rendered by tools/gpu_render.mjs (dumps of 2 frames), the same 2 frames rendered by Remotion itself (renderStill = the look the user
//   approved in Studio), PSNR of each pair, `chromeVideo` (videos still decoded by the browser) and whether the render failed.
//   node tools/gpu/all_comps_check.mjs [--ids A,B,…] [--out .tmp/gpu_render/allcomps] [--span 12]
// One render at a time: it waits for the render lock before each render (the user's queue keeps priority). Result: <out>/summary.json and summary.md,
// a comparison panel (Remotion | GPU | |diff|×6) for every pair under 40 dB.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { getCompositions, openBrowser, renderStill } from "@remotion/renderer";

const root = path.resolve(import.meta.dirname, "..", "..");
process.chdir(root);
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i < 0 ? d : process.argv[i + 1]; };
const OUT = path.resolve(arg("out", ".tmp/gpu_render/allcomps")), SPAN = Number(arg("span", 12));
const PY = "S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe";
const PROPS = { showArchive: true, showReference: true };
fs.mkdirSync(OUT, { recursive: true });
const log = (m) => { console.log(m); fs.appendFileSync(path.join(OUT, "run.log"), m + "\n"); };

const lockBusy = () => { try { const o = JSON.parse(fs.readFileSync(".tmp/render.lock", "utf8")); process.kill(o.pid, 0); return o.label || String(o.pid); } catch { return null; } };
const waitLock = async () => { for (let i = 0; lockBusy(); i++) { if (i % 30 === 0) log(`  … waiting for the render lock (${lockBusy()})`); await new Promise((r) => setTimeout(r, 10000)); } };

/* one bundle for everything: the first gpu_render keeps its bundle (GR_KEEP_BUNDLE, videos hard-linked), every later one reuses it with --bundle */
const KEEP = path.join(root, ".tmp/gpu_render/bundle_keep_allcomps");
const gr = (id, a, b, frames, extra = []) => spawnSync("node", ["tools/gpu_render.mjs", "--comp", id, "--start", String(a), "--end", String(b), "--out", path.join(OUT, id, "gpu.mp4"),
  "--props", JSON.stringify(PROPS), "--dump", `${path.join(OUT, id, "gpu")}:${frames.join(",")}`, "--no-bumper", "--procs", "1", "--windows", "3", ...extra],
  { encoding: "utf8", env: { ...process.env, GR_DUMP_PREFIX: "hy" }, timeout: 15 * 60 * 1000, maxBuffer: 64 << 20 });

let comps;
{
  if (!fs.existsSync(path.join(KEEP, "index.html"))) {
    log("bundling once (kept for every composition)…");
    await waitLock();
    fs.mkdirSync(path.join(OUT, "_bundle", "gpu"), { recursive: true });
    const r = spawnSync("node", ["tools/gpu_render.mjs", "--comp", "TimelineCounter-Demo", "--start", "0", "--end", "1", "--out", path.join(OUT, "_bundle", "x.mp4"), "--props", JSON.stringify(PROPS), "--no-bumper", "--procs", "1"],
      { encoding: "utf8", env: { ...process.env, GR_KEEP_BUNDLE: "1" }, maxBuffer: 64 << 20 });
    const made = path.join(root, ".tmp/gpu_render/bundle_keep_TimelineCounter-Demo");
    if (!fs.existsSync(path.join(made, "index.html"))) { log("could not build the bundle:\n" + (r.stdout + r.stderr).slice(-2000)); process.exit(1); }
    fs.renameSync(made, KEEP);
  }
  comps = await getCompositions(KEEP, { inputProps: PROPS, chromiumOptions: { gl: "angle" } });
}
const only = arg("ids", null);
const list = comps.filter((c) => !only || only.split(",").includes(c.id));
log(`${list.length} compositions`);

const browser = await openBrowser("chrome", { chromiumOptions: { gl: "angle" } });
const results = [];
for (const c of list) {
  const d = c.durationInFrames, a = Math.max(0, Math.min(d - 1, Math.floor(d * 0.4))), b = Math.min(d - 1, a + SPAN), frames = [...new Set([Math.min(b, a + 3), Math.min(b, a + Math.floor(SPAN * 0.75))])];
  const dir = path.join(OUT, c.id);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, "gpu"), { recursive: true }); fs.mkdirSync(path.join(dir, "ref"), { recursive: true });
  const row = { id: c.id, size: `${c.width}x${c.height}`, frames: d, span: [a, b], ok: false };
  log(`${c.id} (${c.width}x${c.height}, ${d} frames): span ${a}-${b}`);
  let r;
  try { const now = new Date(); fs.utimesSync(KEEP, now, now); } catch { /* keep going */ }   /* clean_temp skips what was touched in the last 30 min */
  for (let k = 0; k < 20; k++) {
    await waitLock();
    r = gr(c.id, a, b, frames, ["--bundle", KEEP]);
    if (r.status !== 3) break;   /* another render took the lock between our check and our start */
  }
  fs.writeFileSync(path.join(dir, "gpu.log"), (r.stdout || "") + (r.stderr || ""));
  row.ok = r.status === 0;
  if (!row.ok) row.error = ((r.stderr || "") + (r.stdout || "")).split("\n").filter((l) => /error|✘|Error|FATAL|ممنوع/.test(l)).slice(-3).join(" | ").slice(0, 400) || `exit ${r.status}`;
  const rep = fs.readdirSync(path.join(root, "render_work")).filter((f) => f.startsWith(`gpu_render_${c.id}_`)).sort().pop();
  try { const j = JSON.parse(fs.readFileSync(path.join(root, "render_work", rep), "utf8")); row.chromeVideo = j.chromeVideo; row.fps = j.fpsGraphicsPlusComposite; } catch { /* no report */ }
  /* Remotion's own frames (what Studio shows), PNG, same props */
  for (const f of frames) {
    try { await renderStill({ composition: c, serveUrl: KEEP, inputProps: PROPS, frame: f, output: path.join(dir, "ref", `f${f}.png`), imageFormat: "png", puppeteerInstance: browser, overwrite: true, timeoutInMilliseconds: 120000 }); }
    catch (e) { row.refError = String(e.message || e).slice(0, 200); }
  }
  const p = spawnSync(PY, ["-I", "tools/gpu/psnr_pairs.py", dir], { encoding: "utf8" });
  try { row.psnr = JSON.parse(p.stdout.trim().split("\n").pop()); } catch { row.psnrError = (p.stderr || p.stdout).slice(-300); }
  log(`  → ${row.ok ? "ok" : "FAILED " + row.error} | psnr ${JSON.stringify(row.psnr ?? row.psnrError ?? null)} | chromeVideo ${JSON.stringify(row.chromeVideo ?? null)}`);
  results.push(row);
  fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify(results, null, 1));
}
await browser.close({ silent: true }).catch(() => {});
const md = ["| التركيبة | الحجم | الرندر | أدنى dB | فيديو يفكّه المتصفح |", "|---|---|---|---|---|",
  ...results.map((r) => `| ${r.id} | ${r.size} | ${r.ok ? "✔" : "✘ " + (r.error ?? "").replace(/\|/g, "/").slice(0, 80)} | ${r.psnr ? Math.min(...Object.values(r.psnr)).toFixed(1) : "—"} | ${r.chromeVideo && Object.keys(r.chromeVideo).length ? Object.keys(r.chromeVideo).join("، ").slice(0, 80) : "—"} |`)];
fs.writeFileSync(path.join(OUT, "summary.md"), md.join("\n") + "\n");
log("summary: " + path.join(OUT, "summary.md"));
