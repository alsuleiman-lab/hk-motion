// ONE task list per video (rules §6; user 2026-11-16 «دائماً قائمة مهام لكل فيديو، ولا تُعلَّم مهمة منجزة إلا إذا أُنجزت كاملة»).
//   node tools/tasks.mjs <p>   → .tmp/<p>/tasks.md and a printed list; exit 1 while any task is open
// It reads the three ledgers that already exist and shows them as one list, without changing them:
//   1) what the video must show       tools/requirements.mjs <p> --check   (places, people, numbers, books… found in his words)
//   2) the user's orders               tools/montage_notes.mjs list <p>     («مونتاج … انتهى مونتاج», messages during the build)
//   3) the stages and the plan items   tools/montage_guard.mjs check <p>    (each stage report + every plan item with its evidence)
// A task is closed only by its own tool with evidence (montage_notes done …, montage_guard plan-done … --evidence, the element in the spec for a requirement).
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const p = process.argv[2];
if (!p) { console.error("usage: node tools/tasks.mjs <p>"); process.exit(2); }
const T = path.join(".tmp", p);
const run = (args) => { const r = spawnSync(process.execPath, args, { encoding: "utf8", windowsHide: true }); return { code: r.status, out: (r.stdout || "") + (r.stderr || "") }; };
const lines = (s) => s.split(/\r?\n/).map((l) => l.trimEnd()).filter(Boolean);
const sections = [];
let open = 0;

/* what the video must show (requirements.mjs): rows exist after the cut; with no spec yet every row is an OPEN task (nothing is built), and with no ledger at all the ledger itself is open */
{
  const reqF = path.join(T, "requirements.json"), specF = path.join("data", "specs", `${p}.json`);
  if (!fs.existsSync(reqF)) { open += 1; sections.push(["ما يجب أن يظهر في الفيديو", ["✘ سجل المطلوب لم يُستخرج بعد (يكتبه stage cut)"], []]); }
  else if (!fs.existsSync(specF)) {
    let n = 0; try { n = (JSON.parse(fs.readFileSync(reqF, "utf8")) || []).filter((r) => r.kind !== "ordercand" || !r.covered).length; } catch { /* unreadable */ }
    open += Math.max(1, n); sections.push(["ما يجب أن يظهر في الفيديو", [`✘ ${n} صفاً في سجل المطلوب بانتظار بنائها في المواصفة (${path.join(T, "requirements.md")})`], []]);
  } else {
    const r = run(["tools/requirements.mjs", p, "--check"]), L = lines(r.out);
    const bad = L.filter((l) => /^\s*✘/.test(l) && !/^✘ requirements:/.test(l));
    open += r.code === 0 ? 0 : Math.max(1, bad.length);
    sections.push(["ما يجب أن يظهر في الفيديو", r.code === 0 ? [L.find((l) => l.includes("✔")) ?? "✔"] : bad.length ? bad : L.slice(-6), L.filter((l) => l.includes("مستثنى"))]);
  }
}

if (fs.existsSync(path.join(T, "montage_notes.md")) || fs.existsSync(path.join(T, "montage_notes.json"))) {
  const r = run(["tools/montage_notes.mjs", "list", p]), L = lines(r.out);
  const o = L.filter((l) => /open|مفتوح|✘|☐/.test(l));
  open += o.length;
  sections.push(["أوامر المستخدم", L, []]);
} else sections.push(["أوامر المستخدم", ["– لا أوامر لهذا الفيديو"], []]);

{
  let registered = false; try { registered = (JSON.parse(fs.readFileSync(path.join(".tmp", "active_montage.json"), "utf8")).projects ?? []).includes(p); } catch { /* none */ }
  if (fs.existsSync(path.join(T, "stages")) || registered) {
    const r = run(["tools/montage_guard.mjs", "check", p]), L = lines(r.out);
    if (r.code !== 0) open += Math.max(1, L.filter((l) => /^\s*✘/.test(l)).length - 1);
    sections.push(["المراحل وبنود الخطة", L, []]);
  } else { open += 1; sections.push(["المراحل وبنود الخطة", ["✘ المونتاج غير مسجَّل (montage_guard start، ويفعله stage prep)"], []]); }
}

const md = [`# مهام «${p}»`, "", open ? `✘ مفتوح: ${open}` : "✔ كل المهام منجزة بدليل", ""];
for (const [title, L, extra] of sections) md.push(`## ${title}`, ...L.map((l) => `- ${l.trim()}`), ...extra.map((l) => `- ${l.trim()}`), "");
fs.mkdirSync(T, { recursive: true });
fs.writeFileSync(path.join(T, "tasks.md"), md.join("\n"));
console.log(md.join("\n"));
process.exit(open ? 1 : 0);
