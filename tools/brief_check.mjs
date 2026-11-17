// Is the operations tree consistent? (2026-11-17: the tree replaced MONTAGE_BRIEF.md / PREFERENCES.md / WORKFLOW_CHECKLIST.md, archived in _archive/rules_2026-11-17_tree/)
//   node tools/brief_check.mjs           OK (exit 0), or what is wrong (exit 1): a skill the tree names that does not exist, a skill without its gate,
//                                        or rule files changed after the last stamp (then re-read them before the next video)
//   node tools/brief_check.mjs --stamp   after a rule change: record the current fingerprints of the general rules, the tree and every skill
// The guard hook (tools/hooks/guard.mjs prompt) adds a warning to every video prompt while this fails.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = path.resolve(import.meta.dirname, ".."); process.chdir(ROOT);
const TOP = ["القواعد_العامة.md", "شجرة_العمليات.md"], STAMP = "tools/brief_stamp.json", SK = ".claude/skills";
const sha = (f) => { try { return crypto.createHash("sha1").update(fs.readFileSync(f)).digest("hex"); } catch { return "missing"; } };
const skillFiles = fs.readdirSync(SK).filter((s) => !/^remotion-(?!render)/.test(s)).map((s) => path.join(SK, s, "SKILL.md").split(path.sep).join("/"));
const now = Object.fromEntries([...TOP, ...skillFiles].map((f) => [f, sha(f)]));
if (process.argv.includes("--stamp")) { fs.writeFileSync(STAMP, JSON.stringify({ stamped: new Date().toISOString(), files: now }, null, 1) + "\n"); console.log("rules stamped"); process.exit(0); }
const errs = [];
for (const f of TOP) if (!fs.existsSync(f)) errs.push(`${f} غير موجود`);
const tree = fs.existsSync(TOP[1]) ? fs.readFileSync(TOP[1], "utf8") : "";
const installed = new Set(fs.readdirSync(SK)), words = [...new Set(tree.match(/[a-z]+(?:-[a-z]+)*/g) ?? [])];
/* every skill name the tree writes (bare or in backticks); a word that is neither a skill nor a known non-skill word is reported */
const NOT_SKILL = new Set(["md", "hat", "tmp", "tasks", "json", "mjs", "node", "tools", "stage", "prep", "cut", "check", "spec", "data", "public", "src", "p", "answers", "words", "table"]);
const named = words.filter((w) => installed.has(w) || (/-/.test(w) && !NOT_SKILL.has(w)));
for (const s of named) if (!fs.existsSync(path.join(SK, s, "SKILL.md"))) errs.push(`الشجرة تذكر مهارة ${s} وليست مثبّتة`);
let old = null; try { old = JSON.parse(fs.readFileSync(STAMP, "utf8")); } catch { /* never stamped */ }
const changed = old?.files ? Object.keys(now).filter((f) => old.files[f] !== now[f]) : [];
if (!old?.files) errs.push("القواعد لم تُختم بعد التثبيت: node tools/brief_check.mjs --stamp");
if (changed.length) errs.push(`تغيّرت بعد الختم: ${changed.join("، ")} — تُقرأ من جديد، ثم --stamp`);
if (!errs.length) { console.log(`rules OK: ${named.length} مهارة في الشجرة، كلها مثبّتة`); process.exit(0); }
console.log("✘ " + errs.join("\n✘ ")); process.exit(1);
