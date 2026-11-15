#!/usr/bin/env node
// Read-only checks for known high-risk stale rules in the staged workspace.
// This is a targeted guard, not proof that all prose is contradiction-free.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const files = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full);
    else if (ent.isFile() && /\.(?:md|html|mjs)$/.test(ent.name)) files.push(full);
  }
}
for (const f of ["PREFERENCES.md", "WORKFLOW_CHECKLIST.md", "AGENTS.md", "CLAUDE.md", "effects_catalog.html"]) {
  if (fs.existsSync(path.join(ROOT, f))) files.push(path.join(ROOT, f));
}
walk(path.join(ROOT, ".claude", "skills"));

const errors = [];
const checks = [];
function check(label, condition, detail) {
  checks.push({ label, ok: Boolean(condition), detail });
  if (!condition) errors.push(`${label}: ${detail}`);
}

const prefs = read("PREFERENCES.md");
const checklist = read("WORKFLOW_CHECKLIST.md");
const cutting = read(".claude/skills/video-cutting/SKILL.md");
const hook = read(".claude/skills/hook/SKILL.md");
const sourceSkills = ["book-source-display", "video-source-display", "website-source-display"]
  .map((name) => read(`.claude/skills/${name}/SKILL.md`));
const activeText = files
  .map((file) => ({ file: path.relative(ROOT, file).replaceAll("\\", "/"), text: fs.readFileSync(file, "utf8") }))
  .filter(({ file }) => !/HISTORY_ARCHIVE|AUDIT_REPORT|CHANGES|VERIFY|\.zip/.test(file));

check("pause threshold", /0\.40ث/.test(prefs) && /0\.40ث/.test(checklist) && /0\.40ث/.test(cutting), "The active preference, checklist, and cutting skill must use the user's 0.40-second ceiling.");
check("stale pause exception", !/سكتات?\s*>?\s*0\.45ث|أكبر من 0\.45ث/.test([prefs, checklist, cutting].join("\n")), "A 0.45-second threshold or third-party exception remains in active pause rules.");
// elements the user cancelled are DELETED from the code (2026-10-28): none of their names may return to src/ or tools/
{
  const ret = JSON.parse(read("data/retired_elements.json")), hits = [];
  const scan = (dir) => { for (const ent of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) { const rel = dir + "/" + ent.name; if (ent.isDirectory()) { if (ent.name !== "node_modules" && ent.name !== "gallery_site") scan(rel); } else if (/\.(tsx?|mjs)$/.test(ent.name) && !ret.allowedIn.includes(rel)) { const txt = fs.readFileSync(path.join(ROOT, rel), "utf8"); for (const n of ret.components) if (new RegExp("\\b" + n + "\\b").test(txt)) hits.push(rel + ":" + n); } } };
  scan("src"); scan("tools");
  check("no retired elements", hits.length === 0, "A cancelled element is back in the code (" + hits.slice(0, 6).join(", ") + "): delete it and use the approved gallery element (data/retired_elements.json).");
}
check("quick isolation only", /العزل السريع/.test(prefs) && /العزل السريع/.test(read("MONTAGE_BRIEF.md")) && /لا عزل للخلفية إطلا/.test(hook) && !fs.existsSync(path.join(ROOT, ".claude/skills/background-isolation")) && !activeText.some(({ text }) => /background-isolation|عزل.{0,20}(اختياري|بطلب صريح|غير مفعّل افتراضياً)/.test(text)), "Only the quick isolation of PREFERENCES.md (user 2026-10-29): reel clip windows and windows where needed, no isolation skill, no isolated hook.");
check("legacy automatic isolation", !activeText.some(({ text }) => /عزل الخلفية مع شيء خلفه.{0,80}أول 5 ثوانٍ|عزل[^.]{0,60}مرة كل 3 دقائق/.test(text)), "An automatic isolation schedule remains outside the opt-in skill.");
check("source display layout", !sourceSkills.some((text) => /لوحة المصدر.{0,100}بجانبها بفاصل|الشيخ في بطاقة \*\*بجانبها بفاصل/.test(text)), "A source skill still prescribes the old split-card layout.");
check("hook non-isolation rules", /لو كُتم الصوت/.test(hook) && /ممنوع الحشو/.test(hook) && /--must/.test(hook) && /✔\/✘/.test(hook), "The hook must retain relevance, no-filler, source-search, and post-build review rules.");
check("binding hooks installed", (() => { try { const s = read(".claude/settings.json"); return ["UserPromptSubmit", "PreToolUse", "PostToolUse", "Stop"].every((h) => s.includes(h)) && s.includes("tools/hooks/guard.mjs") && fs.existsSync(path.join(ROOT, "tools/hooks/guard.mjs")); } catch { return false; } })(), "The four enforcement hooks (PREFERENCES.md section 0) must be wired in .claude/settings.json to tools/hooks/guard.mjs.");
check("no stale instructions", spawnSync(process.execPath, [path.join(ROOT, "tools", "rules_lint.mjs")], { cwd: ROOT, encoding: "utf8", windowsHide: true }).status === 0, "A replaced instruction is still written somewhere: run node tools/rules_lint.mjs and fix each line (user 2026-10-29).");
check("binding contract present", /^## 0\) عقد الالتزام/m.test(prefs) && /عقد الالتزام/.test(read("CLAUDE.md")) && /عقد الالتزام/.test(read("AGENTS.md")), "PREFERENCES.md section 0 and the pointers in CLAUDE.md and AGENTS.md must exist.");
check(
  "audit inputs present",
  ["PREFERENCES.md", "WORKFLOW_CHECKLIST.md", ".claude/skills/hook/SKILL.md", ".claude/skills/video-cutting/SKILL.md", "MONTAGE_BRIEF.md"].every((file) => fs.existsSync(path.join(ROOT, file))),
  "One or more required staged audit inputs are missing."
);

for (const item of checks) console.log(`${item.ok ? "PASS" : "FAIL"} ${item.label} — ${item.detail}`);
if (errors.length) {
  console.error(`\n${errors.length} targeted audit check(s) failed. This script does not claim full contradiction coverage.`);
  process.exitCode = 1;
} else {
  console.log("\nAll targeted checks passed. This is not a general proof that every instruction is conflict-free.");
}
