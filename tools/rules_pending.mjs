/* RULES PENDING — no order of the user may stay a draft (user 2026-11-12: «وين عم تروح تعليماتي؟» — his 2026-10-23 decisions on the Companions and
   on imams' pictures sat in rules_registry/ as drafts, were never read, and he was asked again).
     node tools/rules_pending.mjs          → lists every rules_registry/*.draft.md and rules_registry/proposals/*.md not marked merged; exit 1 if any
   A file counts as merged when its status line says «مدمج» / «دُمج» / «طُبّق» / «مرفوض» (rejected by the user). Merging = its text is in PREFERENCES.md
   + MONTAGE_BRIEF.md (+ the skill that executes it), then the status line is changed to «مدمج <date> في …». stage.mjs prep|cut|check refuse to run while any is pending. */
import fs from "node:fs";
import path from "node:path";

process.chdir(path.resolve(import.meta.dirname, ".."));
const files = [
  ...fs.readdirSync("rules_registry").filter((f) => f.endsWith(".draft.md")).map((f) => path.join("rules_registry", f)),
  ...fs.readdirSync("rules_registry/proposals").filter((f) => f.endsWith(".md") && f !== "README.md").map((f) => path.join("rules_registry/proposals", f)),
];
const DONE = /(مدمج|دُمج|دمج في|طُبّق|طبق في|مرفوض)/;
const pending = files.filter((f) => { const head = fs.readFileSync(f, "utf8").split("\n").slice(0, 8).join("\n"); return !DONE.test(head); });
if (!pending.length) { console.log("✔ rules_pending: كل أوامر المستخدم مدمجة في الملفات الملزمة"); process.exit(0); }
console.log(`✘ rules_pending: ${pending.length} ملف أوامر لم يُدمج في الملفات الملزمة (يُدمج أو يُعرض على المستخدم قبل أي مونتاج):\n  ` + pending.join("\n  "));
process.exit(1);
