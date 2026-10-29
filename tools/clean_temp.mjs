// Auto-cleanup tool for Remotion temporary bundles, puppeteer profiles, and test stills.
// Safe: NEVER touches real Chrome profiles, source files, or final exported videos.
import fs from "fs";
import path from "path";
import os from "os";

function removeDirOrFile(p) {
  try {
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      let sz = 0;
      for (const f of fs.readdirSync(p)) {
        const fp = path.join(p, f);
        try {
          const st = fs.statSync(fp);
          if (st.isDirectory()) sz += removeDirOrFile(fp);
          else { sz += st.size; fs.rmSync(fp, { force: true }); }
        } catch {}
      }
      fs.rmdirSync(p);
      return sz;
    } else {
      const sz = stat.size;
      fs.rmSync(p, { force: true });
      return sz;
    }
  } catch {
    return 0;
  }
}

// SAFETY (review 2026-10-22): other sessions work in this folder at the same time. An item touched in the last 30 minutes (newest mtime of itself or its first level) is treated as IN USE
// (open Studio bundle, running render, a still being checked) and is SKIPPED, never deleted. `node tools/clean_temp.mjs --dry` only lists what would go. `--force` removes the young items too (only when you KNOW nothing runs).
const DRY = process.argv.includes("--dry"), FORCE = process.argv.includes("--force");
// --approval (montage_guard end): the montage is finished, so only items written in the last 3 min count as in use — unless a render holds .tmp/render.lock
const renderAlive = () => { try { const o = JSON.parse(fs.readFileSync(".tmp/render.lock", "utf8")); process.kill(o.pid, 0); return true; } catch { return false; } };
const APPROVAL = process.argv.includes("--approval") && !renderAlive();
const AGE_MS = (APPROVAL ? 3 : 30) * 60 * 1000;
const newest = (p) => { let m = 0; try { const st = fs.statSync(p); m = st.mtimeMs; if (st.isDirectory()) for (const f of fs.readdirSync(p)) { try { m = Math.max(m, fs.statSync(path.join(p, f)).mtimeMs); } catch {} } } catch {} return m; };
const skipped = [];
function safeRemove(p) {
  if (!FORCE && Date.now() - newest(p) < AGE_MS) { skipped.push(p); return 0; }
  if (DRY) { console.log("[clean] would remove:", p); return 0; }
  return removeDirOrFile(p);
}

export function runAutoCleanup(verbose = true) {
  let freed = 0;
  const log = (...args) => { if (verbose) console.log("[clean]", ...args); };

  // 1. Clean Remotion temp folders from OS Temp (C:\Users\...\AppData\Local\Temp)
  const cTemp = os.tmpdir();
  let cCount = 0;
  let cFreed = 0;
  try {
    for (const d of fs.readdirSync(cTemp, { withFileTypes: true })) {
      if (d.isDirectory() && /^(remotion-v[\d.]+-assets|remotion-webpack-bundle|puppeteer_dev_chrome_profile|react-motion-render)/.test(d.name)) {
        const p = path.join(cTemp, d.name);
        cFreed += safeRemove(p);
        cCount++;
      }
    }
  } catch {}
  freed += cFreed;
  if (cCount > 0) log(`Purged ${cCount} temp Remotion folders from C: Temp (${(cFreed / 1024 / 1024).toFixed(1)} MB)`);

  // 2. Clean S: Remotion Workspace .tmp directory
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
  const sTmp = path.join(root, ".tmp");
  let sCount = 0;
  let sFreed = 0;
  if (fs.existsSync(sTmp)) {
    for (const d of fs.readdirSync(sTmp, { withFileTypes: true })) {
      if (/^(remotion-|puppeteer_dev_chrome_profile|react-motion-render|seq|shots)/.test(d.name) || (d.isFile() && /\.(tmp|png|jpeg|jpg)$/i.test(d.name))) {
        const p = path.join(sTmp, d.name);
        sFreed += safeRemove(p);
        sCount++;
      }
      // the private temps of stills / face_check / frame_audit / renders (run_<kind>_<pid>) are deleted on exit; one left a day later was leaked by a killed process (25 GB on 2026-10-29)
      else if (d.isDirectory() && /^run_[a-z_]+_\d+$/.test(d.name)) {
        const p = path.join(sTmp, d.name);
        try { if (Date.now() - newest(p) < 24 * 3600 * 1000) continue; } catch {}
        sFreed += safeRemove(p);
        sCount++;
      }
    }
  }
  // --project <p> (on approval, user 2026-10-29: «لازم تمب لكل مشروع، بعد الاعتماد يحذف كلياً»): the project's whole temp goes — .tmp/<p>, .tmp/<p>_*, its cached stills bundles and render_work/<p>
  const pi = process.argv.indexOf("--project"), proj = pi > 0 ? process.argv[pi + 1] : null;
  if (proj && /^[\w.-]+$/.test(proj)) {
    const hits = [];
    for (const d of fs.existsSync(sTmp) ? fs.readdirSync(sTmp) : []) if (d === proj || d.startsWith(proj + "_") || d.startsWith(proj + "-")) hits.push(path.join(sTmp, d));
    const sb = path.join(sTmp, "stills_bundle");
    for (const d of fs.existsSync(sb) ? fs.readdirSync(sb) : []) if (d.toLowerCase().replace(/[-_]/g, "").startsWith(proj.toLowerCase().replace(/[-_]/g, ""))) hits.push(path.join(sb, d));
    const rw = path.join(root, "render_work", proj);
    if (fs.existsSync(rw)) hits.push(rw);
    let pf = 0;
    for (const p of hits) pf += safeRemove(p);
    freed += pf;
    log(`المشروع ${proj}: حُذف مؤقته كلياً (${hits.length} عنصراً، ${(pf / 1024 / 1024).toFixed(1)} MB)`);
  }
  freed += sFreed;
  if (sCount > 0) log(`Purged ${sCount} temp items from S: .tmp (${(sFreed / 1024 / 1024).toFixed(1)} MB)`);

  // 3. Clean test screenshot images in out/ (keeps exported .mp4 / .mov untouched)
  const outDir = path.join(root, "out");
  let outCount = 0;
  let outFreed = 0;
  if (fs.existsSync(outDir)) {
    for (const f of fs.readdirSync(outDir)) {
      if (/\.(png|jpg|jpeg|log)$/i.test(f)) {
        const p = path.join(outDir, f);
        try {
          if (Date.now() - fs.statSync(p).mtimeMs < 5 * 60 * 1000) continue;
        } catch {}
        outFreed += safeRemove(p);
        outCount++;
      }
    }
  }
  freed += outFreed;
  if (outCount > 0) log(`Cleaned ${outCount} temp test stills/logs from out/ (${(outFreed / 1024 / 1024).toFixed(1)} MB)`);

  if (skipped.length) log(`تخطّى ${skipped.length} عنصراً لُمس خلال آخر 30 دقيقة (قيد الاستعمال محتملاً): أعد التشغيل لاحقاً أو استعمل --force إن كنتَ متأكداً أن شيئاً لا يعمل`);
  log(`Auto-cleanup complete: total ${(freed / 1024 / 1024).toFixed(1)} MB freed.`);
  return freed;
}

// When executed directly from CLI
if (process.argv[1] && process.argv[1].endsWith("clean_temp.mjs")) {
  runAutoCleanup(true);
}
