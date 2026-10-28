// Notes for the «مونتاج … انتهى مونتاج» code-word protocol (user 2026-10-22): everything the user says between the two phrases is instructions for THIS video.
//   node tools/montage_notes.mjs add <project> "<instruction, verbatim>"     → appends a numbered note to .tmp/<project>/montage_notes.md (state: open)
//   node tools/montage_notes.mjs list <project>                               → prints all notes with their state
//   node tools/montage_notes.mjs done <project> <n> ["how it was executed"]  → marks note n as executed (with the evidence)
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
  const n = notes.length + 1; notes.push({ n, text: a, state: "open", at: new Date().toISOString() }); save(); console.log(`أُضيفت التعليمة ${n}`);
} else if (cmd === "done") {
  const n = notes.find((x) => x.n === Number(a));
  if (!n) { console.error("رقم غير موجود"); process.exit(2); }
  n.state = "done"; n.evidence = b ?? ""; save(); console.log(`نُفّذت التعليمة ${n.n}`);
} else if (cmd === "list" || cmd === "check") {
  for (const n of notes) console.log(`${n.state === "done" ? "✔" : "·"} ${n.n}. ${n.text}${n.evidence ? "  ← " + n.evidence : ""}`);
  const open = notes.filter((n) => n.state !== "done");
  if (cmd === "check") { console.log(open.length ? `\n✘ ${open.length} تعليمة لم تُنفَّذ بعد` : `\n✔ كل التعليمات (${notes.length}) نُفّذت`); process.exit(open.length ? 1 : 0); }
} else { console.error("أمر غير معروف"); process.exit(2); }
