#!/usr/bin/env node
// THE MONTAGE'S TYPECHECK JUDGES ONLY WHAT THE MONTAGE IMPORTS (rehearsal 2026-11-21, ledger shared-typecheck-foreign-file: a full `stage check` failed on
// src/ext/KeyArt2.tsx(436,9) TS2322 — another session's half-written file in the shared folder, not one line of this montage). tsc still runs on the whole
// project (one pass, incremental), and each error is judged by WHERE it is:
//   · in a file reachable from this project's compositions → ✘ (the montage's own compile is broken)
//     entries: src/SpecComps.tsx (every spec montage: MontageSpec, MontageBoth and the kits they import) when data/specs/<p>.json exists, plus the project's
//     own files (a src file that names the project key or its composition id in a string); the import graph is walked from them (static, `export … from`,
//     dynamic import(), require), relative paths only;
//   · anywhere else → «ملاحظة» (another session's file): reported with its place, never a failure of this montage;
//   · an error with no file (a compiler option) → ✘.
// When the project has no spec and no file of its own, every error counts (the old full typecheck).
//   node tools/project_typecheck.mjs <p> [--comp <CompId>] [--root <dir>] [--tsc-output <file>]   (--root/--tsc-output: self-test, a scratch tree and a fake tsc log)
// Used by tools/stage.mjs check (step «typecheck»). Self-test: tools/selftest_cases/i_rehearsal_fixes.mjs «typecheck.*».
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const EXT = [".tsx", ".ts", ".jsx", ".js", ".mjs"];
const SHARED_LISTS = new Set(["src/Root.tsx", "src/compositionDates.ts", "src/compositionTitles.ts", "src/index.ts"]);   // they name every project: never «own» files
const rel = (root, f) => path.relative(root, f).replace(/\\/g, "/");
const walkSrc = (dir, out = []) => { let es = []; try { es = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; } for (const e of es) { const f = path.join(dir, e.name); if (e.isDirectory()) walkSrc(f, out); else if (/\.(tsx?|jsx?|mjs)$/.test(e.name)) out.push(f); } return out; };
const resolveImp = (from, spec) => {
  const b = path.resolve(path.dirname(from), spec);
  for (const c of [b, ...EXT.map((e) => b + e), ...EXT.map((e) => path.join(b, "index" + e))]) { try { if (fs.statSync(c).isFile() && EXT.includes(path.extname(c))) return c; } catch { /* next */ } }
  if (/\.js$/.test(b)) for (const e of [".ts", ".tsx"]) { const c = b.replace(/\.js$/, e); if (fs.existsSync(c)) return c; }
  return null;
};
const IMP = /(?:\bimport\s+(?:type\s+)?[^'";]*?\bfrom\s*|\bexport\s+(?:type\s+)?[^'";]*?\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s+)(['"])(\.{1,2}\/[^'"]+)\1/g;
/** every file reachable from the entries (absolute paths) */
export function reachable(entries) {
  const seen = new Set(), stack = entries.filter((f) => fs.existsSync(f)).map((f) => path.resolve(f));
  while (stack.length) {
    const f = stack.pop(); if (seen.has(f)) continue; seen.add(f);
    let s = ""; try { s = fs.readFileSync(f, "utf8"); } catch { continue; }
    for (const m of s.matchAll(IMP)) { const r = resolveImp(f, m[2]); if (r && !seen.has(r)) stack.push(r); }
  }
  return seen;
}
/** the project's entries: SpecComps for a spec montage + the src files that name the project (key or composition id) in a string */
export function projectEntries(p, root, comp = null) {
  const src = path.join(root, "src"), spec = fs.existsSync(path.join(root, "data", "specs", `${p}.json`)), out = [];
  if (spec && fs.existsSync(path.join(src, "SpecComps.tsx"))) out.push(path.join(src, "SpecComps.tsx"));
  const ids = [p, comp, comp?.replace(/-(L|Both|R)$/, "")].filter(Boolean), esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`["'\`/](?:${ids.map(esc).join("|")})(?:["'\`/_.-]|$)`);
  for (const f of walkSrc(src)) { if (SHARED_LISTS.has(rel(root, f))) continue; try { if (re.test(fs.readFileSync(f, "utf8"))) out.push(f); } catch { /* unreadable */ } }
  return [...new Set(out)];
}
/** tsc errors: [{file (relative, /), line, col, code, msg}] (file null = a global error) */
export function parseTsc(text) {
  const out = [];
  for (const l of String(text).split(/\r?\n/)) {
    let m = l.match(/^(.+?)\((\d+),(\d+)\): error (TS\d+): (.*)$/);
    if (m) { out.push({ file: m[1].replace(/\\/g, "/").replace(/^\.\//, ""), line: +m[2], col: +m[3], code: m[4], msg: m[5] }); continue; }
    m = l.match(/^error (TS\d+): (.*)$/); if (m) out.push({ file: null, code: m[1], msg: m[2] });
  }
  return out;
}
/** judge: {own:[…], foreign:[…], files:n, scoped:boolean} */
export function judge(p, tscText, root, comp = null) {
  const errs = parseTsc(tscText), entries = projectEntries(p, root, comp);
  if (!entries.length) return { own: errs, foreign: [], files: 0, scoped: false, entries: [] };
  const R = new Set([...reachable(entries)].map((f) => rel(root, f)));
  const own = errs.filter((e) => !e.file || R.has(e.file)), foreign = errs.filter((e) => e.file && !R.has(e.file));
  return { own, foreign, files: R.size, scoped: true, entries: entries.map((f) => rel(root, f)) };
}
const at = (e) => (e.file ? `${e.file}(${e.line},${e.col})` : "(عام)");

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2), opt = (k) => (argv.includes(`--${k}`) ? argv[argv.indexOf(`--${k}`) + 1] : null);
  const p = argv[0], root = path.resolve(opt("root") ?? path.join(path.dirname(fileURLToPath(import.meta.url)), ".."));
  if (!p || p.startsWith("--")) { console.error("usage: node tools/project_typecheck.mjs <p> [--comp <CompId>]"); process.exit(2); }
  let text;
  if (opt("tsc-output")) text = fs.readFileSync(opt("tsc-output"), "utf8");
  else {
    const r = spawnSync(process.execPath, [path.join(root, "node_modules", "typescript", "bin", "tsc"), "-p", "."], { cwd: root, encoding: "utf8", maxBuffer: 1 << 27, windowsHide: true, timeout: 600000 });
    if (r.error || r.status === null) { console.log(`✘ typecheck (${p}): tsc لم ينتهِ (${String(r.error?.message ?? "مهلة 10 د").slice(0, 120)})`); process.exit(1); }
    text = `${r.stdout}\n${r.stderr}`;
  }
  const j = judge(p, text, root, opt("comp"));
  if (j.foreign.length) {
    const files = [...new Set(j.foreign.map((e) => e.file))];
    console.log(`⚠ ملاحظة لا فشل: ${j.foreign.length} خطأ أنواع في ${files.length} ملفاً خارج تركيبات «${p}» (ملف جلسة أخرى في المجلد المشترك؟): ${j.foreign.slice(0, 4).map((e) => `${at(e)} ${e.code}`).join("، ")}${j.foreign.some((e) => /^TS1\d{3}$/.test(e.code)) ? " — فيها خطأ صياغة قد يكسر حزمة الاستوديو كلها: أخبر صاحبها" : ""}`);
  }
  if (j.own.length) { for (const e of j.own.slice(0, 8)) console.log(`  ${at(e)}: error ${e.code}: ${e.msg.slice(0, 200)}`); console.log(`✘ typecheck (${p}): ${j.own.length} خطأ ${j.scoped ? `في ملفات تستوردها تركيبات المشروع (${j.files} ملفاً)` : "(لا مواصفة ولا ملف خاص بالمشروع: الفحص على المجلد كله)"} — أولها ${at(j.own[0])} error ${j.own[0].code}`); process.exit(1); }
  console.log(`✔ typecheck (${p}): لا خطأ ${j.scoped ? `في ${j.files} ملفاً تستوردها تركيبات المشروع` : "في المجلد كله"}${j.foreign.length ? ` (و${j.foreign.length} خطأ لغيره ملاحظةً)` : ""}`);
  process.exit(0);
}
