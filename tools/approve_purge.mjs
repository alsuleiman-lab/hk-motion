#!/usr/bin/env node
/* Approval purge (user 2026-11-13: «لما نعتمد مشروع كل ملفاته تروح… ليش دائما انبهك؟»).
   Called by `montage_guard.mjs end <project>` BEFORE its leftover scan, so approval removes the project's CODE and DATA by itself:
   - data/specs/<p>.json and <p>_*.json; the src files/lines that import them (dedicated component files deleted, registry lines removed
     from Root.tsx / ReelsComps.tsx / any file), and the JSX/imports of deleted component files;
   - Arabic titles + dates of every composition id that was removed (set_title --remove);
   - data/youtube/<p>*.md, data/preview_proxies.json keys, finished render-queue jobs, .tmp/<first-word>_prep.log;
   then typechecks; exit 1 on a type error (git keeps everything, nothing is lost).
   Usage: node tools/approve_purge.mjs <project> [--dry] */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const project = process.argv[2];
const dry = process.argv.includes("--dry");
if (!project) { console.error("usage: approve_purge.mjs <project> [--dry]"); process.exit(2); }
const key = project.toLowerCase();
if (key.length < 4) { console.log(`⚠ «${project}» أقصر من 4 أحرف: لا حذف آلي للكود`); process.exit(0); }
const SHARED = new Set(["Root.tsx", "ReelsComps.tsx", "MontageSpec.tsx", "index.ts", "compositionTitles.ts", "compositionDates.ts"]);
const say = (s) => console.log((dry ? "[تجربة] " : "") + s);
// 0) the publishing package (YouTube text, mentioned episodes, answers, cover) is kept in data/publish_queue/<p>/ BEFORE anything is deleted (2026-11-17)
if (!dry) { const r = spawnSync("node", ["tools/publish_queue.mjs", "save", project], { encoding: "utf8" }); process.stdout.write(r.stdout || ""); if (r.status !== 0) { console.log("✘ تعذّر حفظ حزمة النشر — لا مسح قبلها\n" + (r.stderr || "")); process.exit(1); } }
const rd = (f) => fs.readFileSync(f, "utf8");
const wr = (f, s) => { if (!dry) fs.writeFileSync(f, s); };
const del = (f) => { if (!dry) fs.rmSync(f, { recursive: true, force: true }); };
const eol = (s) => (s.includes("\r\n") ? "\r\n" : "\n");

// 1) the project's spec files
const specDir = path.join("data", "specs");
const specs = (fs.existsSync(specDir) ? fs.readdirSync(specDir) : []).filter((n) => n.toLowerCase() === `${key}.json` || (n.toLowerCase().startsWith(`${key}_`) && n.endsWith(".json")));
const specNames = new Set(specs.map((n) => n.replace(/\.json$/, "")));

// 2) src files: dedicated ones deleted, registry lines removed
const srcFiles = fs.readdirSync("src").filter((n) => /\.(tsx?|jsx?)$/.test(n));
const ids = new Set(), deletedBases = [], deletedExports = new Set();
const impRe = /import\s+(\w+)\s+from\s+["'][./]*data\/specs\/([^"']+)\.json["']/g;
for (const n of srcFiles) {
  const f = path.join("src", n); const s = rd(f);
  const imps = [...s.matchAll(impRe)].map((m) => ({ v: m[1], spec: m[2] }));
  const mine = imps.filter((i) => specNames.has(i.spec));
  if (!mine.length) continue;
  if (!SHARED.has(n) && mine.length === imps.length) {
    for (const m of s.matchAll(/\bid=["']([^"']+)["']/g)) ids.add(m[1]);
    for (const m of s.matchAll(/export\s+(?:const|function)\s+(\w+)/g)) deletedExports.add(m[1]);
    deletedBases.push(n.replace(/\.(tsx?|jsx?)$/, ""));
    del(f); say(`✔ حُذف المكوّن src/${n}`);
    continue;
  }
  const vars = mine.map((i) => i.v), comps = [];
  const E = eol(s); let lines = s.split(/\r?\n/);
  for (const l of lines) { const m = l.match(/const\s+(\w+)\s*:\s*React\.FC[^=]*=.*spec=\{(\w+)/); if (m && vars.includes(m[2])) comps.push(m[1]); }
  const hit = (l) => vars.some((v) => new RegExp(`\\b${v}\\b`).test(l)) || comps.some((c) => new RegExp(`component=\\{${c}\\}`).test(l));
  const before = lines.length;
  lines = lines.filter((l) => { if (!hit(l)) return true; for (const m of l.matchAll(/\bid=["']([^"']+)["']/g)) ids.add(m[1]); return false; });
  wr(f, lines.join(E)); say(`✔ src/${n}: حُذف ${before - lines.length} سطراً من تسجيل المشروع`);
}
// imports / JSX of deleted component files
if (deletedBases.length) for (const n of fs.readdirSync("src").filter((x) => /\.(tsx?|jsx?)$/.test(x))) {
  const f = path.join("src", n); if (!fs.existsSync(f)) continue; const s = rd(f); const E = eol(s);
  const lines = s.split(/\r?\n/);
  const kept = lines.filter((l) => !deletedBases.some((b) => new RegExp(`from\\s+["']\\./${b}["']`).test(l)) && ![...deletedExports].some((x) => new RegExp(`^\\s*<${x}\\b[^>]*/>\\s*$`).test(l)));
  if (kept.length !== lines.length) { wr(f, kept.join(E)); say(`✔ src/${n}: أُزيل استيراد/استعمال ${lines.length - kept.length} من المكوّن المحذوف`); }
}
for (const n of specs) { del(path.join(specDir, n)); say(`✔ حُذف ملف البيانات data/specs/${n}`); }

// 3) titles and dates of removed compositions
for (const id of ids) { if (!dry) spawnSync("node", ["tools/set_title.mjs", id, "--remove"], { encoding: "utf8" }); say(`✔ أُزيل عنوان التركيبة ${id}`); }

// 4) data around the project
{ const f = path.join("data", "episode_refs", `${key}.json`); if (fs.existsSync(f)) { del(f); say(`✔ حُذف ملف المقاطع السابقة data/episode_refs/${key}.json`); } }
const yt = path.join("data", "youtube");
if (fs.existsSync(yt)) for (const n of fs.readdirSync(yt)) if (n.toLowerCase().startsWith(key)) { del(path.join(yt, n)); say(`✔ حُذفت حزمة يوتيوب ${n}`); }
{ const f = path.join("data", "preview_proxies.json");
  if (fs.existsSync(f)) { const s = rd(f); const E = eol(s); const d = JSON.parse(s); const ks = Object.keys(d).filter((k) => k.toLowerCase().startsWith(key));
    if (ks.length) { for (const k of ks) delete d[k]; const body = JSON.stringify(d, null, 1).split("\n").join(E); wr(f, s.endsWith("\n") ? body + E : body); say(`✔ أُزيلت ${ks.length} من نسخ المعاينة الخفيفة`); } } }
{ const f = path.join("data", "render_queue", "state.json");
  if (fs.existsSync(f)) { const s = rd(f); const d = JSON.parse(s); const n0 = d.jobs?.length ?? 0;
    if (n0) { d.jobs = d.jobs.filter((j) => !(String(j.spec).toLowerCase() === key && j.state === "done")); if (d.jobs.length !== n0) { wr(f, JSON.stringify(d, null, 2)); say(`✔ أُزيلت ${n0 - d.jobs.length} من مهام الرندر المنتهية`); } } } }
{ const seg = key.split(/[_-]/)[0];
  const reg = (() => { try { const r = JSON.parse(rd(path.join(".tmp", "active_montage.json"))); return r.projects ?? (r.project ? [r.project] : []); } catch { return []; } })();
  if (seg.length >= 4 && !reg.some((p) => p.toLowerCase().startsWith(seg) && p.toLowerCase() !== key))
    for (const n of fs.existsSync(".tmp") ? fs.readdirSync(".tmp") : []) if (n.toLowerCase() === `${seg}_prep.log`) { del(path.join(".tmp", n)); say(`✔ حُذف .tmp/${n}`); } }

// 5) typecheck after code removal
if (!dry && (deletedBases.length || ids.size)) {
  const t = spawnSync("npx tsc --noEmit", { encoding: "utf8", shell: true });
  if (t.status !== 0) { console.log("✘ فحص الأنواع فشل بعد حذف الكود (استرجع بـgit إن لزم):\n" + ((t.stdout || "") + (t.stderr || "")).slice(-1500)); process.exit(1); }
  say("✔ فحص الأنواع نجح بعد الحذف");
}
if (!specs.length && !deletedBases.length && !ids.size) say("لا كود ولا ملف بيانات للمشروع (حُذف من قبل)");
