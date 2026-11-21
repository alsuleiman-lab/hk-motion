// (own file: answers.json belongs to the questions page, tools/questions.mjs) Answers to the first questions of a video (first-questions skill, 2026-11-17): asked ONCE at the start, read by approval/publishing without asking again.
//   node tools/answers.mjs set <p> <key> "<value>"   → .tmp/<p>/first_answers.json   (keys: title, title_options, formats, yt_channel, yt_when, yt_at, dest_portrait, dest_reel, sections, playlist, …)
//   node tools/answers.mjs get <p> [key]              → prints one value (exit 1 when missing) or the whole file
//   node tools/answers.mjs need <p> key1,key2,…        → exit 1 and lists the keys still unanswered (approval refuses to publish while any is missing)
import fs from "node:fs";
import path from "node:path";

const [cmd, p, k, v] = process.argv.slice(2);
if (!cmd || !p) { console.error("usage: node tools/answers.mjs set|get|need <p> [key] [value]"); process.exit(2); }
process.chdir(path.resolve(import.meta.dirname, ".."));
const f = path.join(".tmp", p, "first_answers.json");
const A = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : {};
if (cmd === "set") {
  if (!k || v == null) { console.error("المفتاح والقيمة مطلوبان"); process.exit(2); }
  let val = v; try { val = JSON.parse(v); } catch { /* plain text */ }
  A[k] = val; A._at = new Date().toISOString();
  fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(A, null, 1));
  console.log(`✔ ${k} = ${typeof val === "string" ? val : JSON.stringify(val)}`);
} else if (cmd === "get") {
  if (!k) { console.log(JSON.stringify(A, null, 1)); process.exit(0); }
  if (A[k] == null) { console.error(`✘ لا جواب لـ${k}`); process.exit(1); }
  console.log(typeof A[k] === "string" ? A[k] : JSON.stringify(A[k]));
} else if (cmd === "need") {
  const miss = String(k ?? "").split(",").map((x) => x.trim()).filter((x) => x && A[x] == null);
  if (miss.length) { console.log(`✘ أجوبة ناقصة: ${miss.join("، ")}`); process.exit(1); }
  console.log("✔ كل الأجوبة المطلوبة موجودة");
} else { console.error("أمر غير معروف"); process.exit(2); }
