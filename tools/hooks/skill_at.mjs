// «@» skill trees (user 2026-11-22: «أريد أن أستورد كل المهارات عبر @ أو كلمة معينة… أحياناً المهارة الواحدة شجرة كاملة: حلقة، شيخ الردود، بث، درس، صامت، موشن، دبلجة، كرتون، صدى، مونتاج ورقي»).
// A UserPromptSubmit hook, separate from guard.mjs (it never touches the conductor). Reads the prompt from stdin; for every «@<name>» that is a known type
// (data/skill_trees.json) or a skill folder, it adds to the turn the type's whole tree: what to read NOW in full, then each stage's skill in order (read when the stage is reached:
// all skill texts are half a megabyte, so they are not loaded at once). «@مهارات» lists every type. Nothing found = silent.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
let input = {};
try { input = JSON.parse(fs.readFileSync(0, "utf8")); } catch { /* no input */ }
const prompt = String(input.prompt ?? "");
if (!prompt.includes("@")) process.exit(0);

const norm = (s) => s.normalize("NFKD").replace(/[ً-ْٰـ]/g, "").replace(/[إأآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[\s_\-]+/g, " ").trim().toLowerCase().replace(/^ال(?=\S)/, "");
let DB;
try { DB = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "skill_trees.json"), "utf8")); } catch { process.exit(0); }
const skillsDir = path.join(ROOT, ".claude", "skills");
const skills = fs.existsSync(skillsDir) ? fs.readdirSync(skillsDir).filter((d) => fs.existsSync(path.join(skillsDir, d, "SKILL.md"))) : [];
const skillPath = (s) => `.claude/skills/${s}/SKILL.md`;

// the candidates: type aliases and skill names, longest first, matched after an «@» (a type name may hold a space: «@شيخ الردود»)
const cands = [];
for (const [k, t] of Object.entries(DB.types)) for (const a of [t.ar, ...(t.aliases ?? [])]) cands.push({ n: norm(a), kind: "type", k });
for (const s of skills) cands.push({ n: norm(s), kind: "skill", k: s });
cands.push({ n: "مهارات", kind: "all" }, { n: "كل", kind: "all" }, { n: "skills", kind: "all" });
cands.sort((a, b) => b.n.length - a.n.length);

const found = [], seen = new Set();
for (const m of prompt.matchAll(/@\s*([^@\n،,.:؛؟?!()«»"]+)/g)) {
  const rest = norm(m[1]);
  const c = cands.find((x) => rest === x.n || rest.startsWith(x.n + " "));
  if (c && !seen.has(c.kind + c.k)) { seen.add(c.kind + c.k); found.push(c); }
}
if (!found.length) process.exit(0);

const out = [];
for (const c of found) {
  if (c.kind === "all") {
    out.push("• @مهارات — الأنواع التي تُفتح بعلامة @ (كل نوع شجرة بمهاراته): " + Object.values(DB.types).map((t) => `@${t.ar}`).join(" · ") + `. وأي مهارة بعينها: @اسمها (${skills.length} مهارة).`);
    continue;
  }
  if (c.kind === "skill") {
    const det = fs.existsSync(path.join(skillsDir, c.k, "references", "detail.md")) ? ` (وتفصيلها بحثاً لا قراءة كاملة: .claude/skills/${c.k}/references/detail.md)` : "";
    out.push(`• @${c.k} — مهارة بعينها: اقرأ الآن كاملةً ${skillPath(c.k)}${det}.`);
    continue;
  }
  const t = DB.types[c.k], L = [];
  L.push(`• @${t.ar} — شجرة «${t.ar}» (أمر المستخدم: تُستورد كاملة بمهاراتها وبترتيبها؛ الالتزام بها لا بما أتذكره):`);
  if (t.note) L.push(`  ملاحظة: ${t.note}`);
  if (t.plan) L.push(`  الخطة المكتوبة وحدها: ${t.plan}`);
  const now = (t.now ?? []).filter((s) => skills.includes(s));
  if (now.length) L.push(`  اقرأ الآن كاملةً بالترتيب: القواعد_العامة.md ← شجرة_العمليات.md ← ${now.map(skillPath).join(" ← ")}`);
  const st = (t.stages ?? []).filter(([s]) => skills.includes(s) || s === "arabic-tts-pronunciation");
  if (st.length) {
    L.push("  مراحل النوع بترتيبها (تُقرأ مهارة كل مرحلة كاملةً حين تصلها، وتفصيلها في references/detail.md بحثاً):");
    st.forEach(([s, w], i) => L.push(`   ${i + 1}) ${s} — ${w}`));
  }
  if (DB.always?.length) L.push(`  متاحة في أي وقت: ${DB.always.join("، ")}.`);
  out.push(L.join("\n"));
}
process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: out.join("\n") } }));
