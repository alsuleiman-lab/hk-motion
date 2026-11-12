// VIDEO LINT (2026-11-12, user: «لما ننشئ عناصر جديدة فإنها ستستخدم نظامنا الجديد»).
// Every video drawn in the montage path (src/MontageSpec.tsx and every file it imports, gallery elements included) must reach the final render as a
// <VSlot> (decoded by NVDEC, placed by the GPU compositor), never as a video the browser decodes: <OffthreadVideo>, <Video>, <Html5Video>, RV,
// ClipVideo, KhVideo, SafeVideo, PVideo. A browser video is allowed only as the Studio/plain-render branch of a hybrid switch (`HY ? <VSlot …/> : <Old …/>`,
// or an early `if (HY…) return <VSlot…>` above it), inside the video primitives themselves, or in the recorded baseline of older code.
//   node tools/gpu/video_lint.mjs                 -> exit 1 and the list when a NEW browser video appears in the montage path
//   node tools/gpu/video_lint.mjs --all           -> also lists the baseline entries
//   node tools/gpu/video_lint.mjs --update-baseline   (only for code that is already ported or explicitly accepted by the user)
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const BASE = path.join(ROOT, "tools", "gpu", "video_lint_baseline.json");
const VID = /<(OffthreadVideo|Video|Html5Video|RV|ClipVideo|KhVideo|SafeVideo|PVideo)\b/;
/* the primitives that wrap a browser video on purpose (their callers are what is checked) */
const PRIMITIVES = new Set(["src/SafeMedia.tsx", "src/hybrid/Slot.tsx", "src/MaskedVideo.tsx", "src/StockClip.tsx"]);

const rel = (f) => path.relative(ROOT, f).split(path.sep).join("/");
const files = new Set();
const stack = [path.join(ROOT, "src", "MontageSpec.tsx")];
while (stack.length) {
  const f = stack.pop();
  if (files.has(f) || !fs.existsSync(f)) continue;
  files.add(f);
  const t = fs.readFileSync(f, "utf8");
  for (const m of t.matchAll(/from\s+["'](\.[^"']+)["']/g)) {
    const p = path.join(path.dirname(f), m[1]);
    for (const e of ["", ".tsx", ".ts", "/index.tsx", "/index.ts"]) {
      if (fs.existsSync(p + e) && fs.statSync(p + e).isFile()) { stack.push(p + e); break; }
    }
  }
}

const hits = [];
for (const f of [...files].sort()) {
  const r = rel(f);
  if (PRIMITIVES.has(r)) continue;
  const L = fs.readFileSync(f, "utf8").split(/\r?\n/);
  L.forEach((line, i) => {
    if (!VID.test(line) || /^\s*(\/\/|\*|\/\*)/.test(line)) return;
    /* the Studio / plain-render branch of a hybrid switch: `HY ?` / `HYL ?` with a VSlot in the same statement (this line or the 6 above), or an early
       `if (HY…)` / `if (HYL…)` return of a VSlot in the same component (up to 40 lines above) */
    const near = L.slice(Math.max(0, i - 12), i + 1).join("\n");
    const above = L.slice(Math.max(0, i - 40), i + 1).join("\n");
    const switched = (/\bHYL?\s*\?/.test(near) && /<VSlot\b/.test(near)) || (/if\s*\(\s*HYL?\b[^)]*\)\s*(return|\{)/.test(above) && /<VSlot\b/.test(above))
      || /\bisStudio\b|studioBumper/.test(near);   /* Studio-only branches never reach a render */
    if (switched) return;
    hits.push({ file: r, line: i + 1, key: r + "|" + crypto.createHash("sha1").update(line.trim()).digest("hex").slice(0, 12), text: line.trim().slice(0, 160) });
  });
}

if (process.argv.includes("--update-baseline")) {
  fs.writeFileSync(BASE, JSON.stringify({ note: "browser videos in the montage path accepted on " + new Date().toISOString().slice(0, 10) + " (older code). New code may not add to this list.", keys: hits.map((h) => h.key).sort() }, null, 1));
  console.log(`baseline: ${hits.length} entries written to ${rel(BASE)}`);
  process.exit(0);
}
let base = new Set();
try { base = new Set(JSON.parse(fs.readFileSync(BASE, "utf8")).keys); } catch { /* no baseline: everything is new */ }
const fresh = hits.filter((h) => !base.has(h.key));
if (process.argv.includes("--all")) for (const h of hits) console.log(`${base.has(h.key) ? "baseline" : "NEW     "} ${h.file}:${h.line}  ${h.text}`);
if (fresh.length) {
  console.log(`✘ video_lint: ${fresh.length} فيديو جديد يفكّه المتصفح في مسار المونتاج — اعرضه بـ <VSlot> (src/hybrid/Slot.tsx)، والقديم فرعاً لـ Studio فقط (HY ? <VSlot …/> : <القديم …/>):`);
  for (const h of fresh) console.log(`  ${h.file}:${h.line}  ${h.text}`);
  process.exit(1);
}
console.log(`✔ video_lint: ${files.size} ملفاً في مسار المونتاج، لا فيديو جديد خارج VSlot (${hits.length} في الأساس القديم)`);
