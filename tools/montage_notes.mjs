// Notes for the «مونتاج … انتهى مونتاج» code-word protocol (user 2026-10-22): everything the user says between the two phrases is instructions for THIS video.
//   node tools/montage_notes.mjs add <project> "<instruction, verbatim>"     → appends a numbered note to .tmp/<project>/montage_notes.md (state: open)
//   node tools/montage_notes.mjs list <project>                               → prints all notes with their state
//   node tools/montage_notes.mjs done <project> <n> ["how it was executed"]  → marks note n as executed (with the evidence)
//   node tools/montage_notes.mjs add <project> "<text>" --at <source sec>   → where he said it in the ORIGINAL recording (requirements.mjs matches its editor-talk stretches to notes)
//   node tools/montage_notes.mjs plan <project> <n> "type@cutSec,…"      → the elements this order becomes (pmap, peek, date, bgclip, behind, pic…); requirements.mjs --check fails until the spec has them
//   node tools/montage_notes.mjs check <project>                              → exit 1 while any note is still open (use it before saying «انتهيت»)
import fs from "node:fs";
import path from "node:path";

const [cmd, project, a, b] = process.argv.slice(2);
if (!cmd || !project) { console.error('usage: node tools/montage_notes.mjs add|list|done|check <project> [text|n] [evidence]'); process.exit(2); }
const file = path.join(".tmp", project, "montage_notes.json");
fs.mkdirSync(path.dirname(file), { recursive: true });
const notes = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : [];
const save = () => {
  fs.writeFileSync(file, JSON.stringify(notes, null, 1));
  const md = ["# تعليمات المستخدم لهذا الفيديو (بين «مونتاج» و«انتهى مونتاج»)", "", ...notes.map((n) => `${n.state === "done" ? "- [x]" : "- [ ]"} **${n.n}.** ${n.text}${n.evidence ? `  ← ${n.evidence}` : ""}  _(${n.at.slice(0, 16).replace("T", " ")})_`)];
  fs.writeFileSync(path.join(".tmp", project, "montage_notes.md"), md.join("\n") + "\n");
};
if (cmd === "add") {
  if (!a) { console.error("نص التعليمة مطلوب"); process.exit(2); }
  const n = notes.length + 1, ai = process.argv.indexOf("--at"); notes.push({ n, text: a, state: "open", at: new Date().toISOString(), ...(ai > 0 ? { at_src: Number(process.argv[ai + 1]) } : {}) }); save(); console.log(`أُضيفت التعليمة ${n}`);
} else if (cmd === "done") {
  const n = notes.find((x) => x.n === Number(a));
  if (!n) { console.error("رقم غير موجود"); process.exit(2); }
  // done = executed in full and checked on the output (2026-11-11: notes were closed with «لم يُنفَّذ/جزئياً/تعذّر» and the gate passed while the user's orders were not done)
  const ev = String(b ?? "").trim();
  if (ev.length < 12) { console.error("✘ لا إغلاق بلا دليل: اكتب كيف نُفّذت وأين يُرى (الزمن/الإطار أو ملف اللقطة)"); process.exit(2); }
  if (/لم\s*يُ?نفَّ?ذ|لم\s*أ|جزئي|تعذّ?ر|ليست? في المعرض|بلا (عزل|حركة|فقاعة)|لاحقاً|مؤجَّ?ل/.test(ev)) { console.error("✘ هذه ليست تعليمة منفَّذة: ما لم يُنفَّذ كاملاً يبقى مفتوحاً (أو اسأل المستخدم بالنقر إن تعذّر)"); process.exit(2); }
  n.state = "done"; n.evidence = ev; save(); console.log(`نُفّذت التعليمة ${n.n}`);
} else if (cmd === "plan") {
  const n = notes.find((x) => x.n === Number(a));
  if (!n || !b) { console.error('usage: plan <project> <n> "type@sec,type@sec"'); process.exit(2); }
  // "type@sec" = an element of that type on screen at sec;  "cut:<word>" = the word must be gone from the final audio;  "none:<reason>" = nothing to show (silent order), the reason is shown to the user
  n.plan = b.split(",").map((x) => { x = x.trim(); if (/^(cut|none):/.test(x)) { const [type, ...r] = x.split(":"); return { type, arg: r.join(":").trim() }; } const [type, at] = x.split("@"); return { type, at: Number(at) }; });
  if (n.plan.some((x) => !x.type || (x.arg == null && !Number.isFinite(x.at)) || (x.arg != null && x.arg.length < 2))) { console.error("✘ خطة غير صالحة: type@ثانية أو cut:كلمة أو none:سبب"); process.exit(2); }
  save(); console.log(`خطة التعليمة ${n.n}: ${n.plan.map((x) => x.type + (x.arg != null ? ":" + x.arg : "@" + x.at)).join("، ")}`);
} else if (cmd === "reopen") {
  const n = notes.find((x) => x.n === Number(a));
  if (!n) { console.error("رقم غير موجود"); process.exit(2); }
  n.state = "open"; n.evidence = b ? `أُعيد فتحها: ${b}` : ""; save(); console.log(`أُعيد فتح التعليمة ${n.n}`);
} else if (cmd === "list" || cmd === "check") {
  for (const n of notes) console.log(`${n.state === "done" ? "✔" : "·"} ${n.n}. ${n.text}${n.evidence ? "  ← " + n.evidence : ""}`);
  const FAIL = /لم\s*يُ?نفَّ?ذ|لم\s*أ|جزئي|تعذّ?ر|ليست? في المعرض|بلا (عزل|حركة|فقاعة)|لاحقاً|مؤجَّ?ل/;
  const open = notes.filter((n) => n.state !== "done" || FAIL.test(n.evidence ?? "") || !n.plan?.length);
  for (const n of notes) if (n.state === "done" && FAIL.test(n.evidence ?? "")) console.log(`✘ ${n.n}: أُغلقت ونص دليلها يقول إنها لم تُنفَّذ — reopen`);
  for (const n of notes) if (!n.plan?.length) console.log(`✘ ${n.n}: بلا خطة تنفيذ (plan)`);
  if (cmd === "check") { console.log(open.length ? `\n✘ ${open.length} تعليمة لم تُنفَّذ بعد` : `\n✔ كل التعليمات (${notes.length}) نُفّذت`); process.exit(open.length ? 1 : 0); }
} else { console.error("أمر غير معروف"); process.exit(2); }
