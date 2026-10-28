// Deletes what a manifest from tools/mark_export.mjs lists (run by the scheduled task, or by hand: node tools/cleanup_leftovers.mjs .cleanup/<name>.json [--dry]).
// Shared work folders (out, .tmp, public/matte, public/stock/prep) lose ONLY entries last modified at/before the export, so a project in progress is never touched.
import fs from "fs"; import path from "path"; import os from "os";
const [mf, ...rest] = process.argv.slice(2); const dry = rest.includes("--dry");
const m = JSON.parse(fs.readFileSync(mf, "utf8")); let freed = 0; const cutoff = new Date(m.exported).getTime();
const SHARED = ["out", ".tmp", "matte", "prep"];
const size = (p) => { try { const s = fs.statSync(p); return s.isFile() ? s.size : fs.readdirSync(p).reduce((a, f) => a + size(path.join(p, f)), 0); } catch { return 0; } };
for (const p of m.paths) {
  if (SHARED.includes(path.basename(p))) {
    let n = 0;
    for (const f of fs.readdirSync(p)) { const fp = path.join(p, f); try { if (fs.statSync(fp).mtimeMs <= cutoff) { n += size(fp); if (!dry) fs.rmSync(fp, { recursive: true, force: true }); } } catch {} }
    freed += n; console.log(dry ? "would clean" : "cleaned", p, (n / 1048576).toFixed(0) + " MB (older than the export)"); continue;
  }
  const n = size(p); freed += n;
  if (dry) { console.log("would delete", p, (n / 1048576).toFixed(0) + " MB"); continue; }
  try { fs.rmSync(p, { recursive: true, force: true }); } catch (e) { console.log("skip", p, e.message); }
}
for (const t of new Set([os.tmpdir(), "C:\Users\mshms\AppData\Local\Temp"])) { try { for (const d of fs.readdirSync(t, { withFileTypes: true })) if (d.isDirectory() && (d.name.startsWith("remotion-") || d.name.startsWith("puppeteer_dev_chrome_profile")) && fs.statSync(path.join(t, d.name)).mtimeMs <= cutoff) { if (!dry) fs.rmSync(path.join(t, d.name), { recursive: true, force: true }); } } catch {} }
console.log(dry ? "dry run" : "cleaned", (freed / 1073741824).toFixed(2), "GB");
