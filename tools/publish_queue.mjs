// Publishing package kept OUTSIDE the approval purge (approval skill, 2026-11-17: the purge deleted the YouTube package before publishing).
//   node tools/publish_queue.mjs save <p>    → copies data/youtube/<p>*, data/episode_refs/<p>.json, .tmp/<p>/answers.json, .tmp/<p>/{sections,chapters}*.json
//                                              and the cover pictures of .tmp/<p>/ into data/publish_queue/<p>/   (approve_purge calls it first)
//   node tools/publish_queue.mjs list <p>    → what is kept
//   node tools/publish_queue.mjs clear <p>   → deletes the package (only after every platform was verified)
import fs from "node:fs";
import path from "node:path";

const [cmd, p] = process.argv.slice(2);
if (!cmd || !p) { console.error("usage: node tools/publish_queue.mjs save|list|clear <p>"); process.exit(2); }
process.chdir(path.resolve(import.meta.dirname, ".."));
const key = p.toLowerCase(), Q = path.join("data", "publish_queue", p);
if (cmd === "save") {
  const files = [];
  const yt = path.join("data", "youtube");
  if (fs.existsSync(yt)) for (const n of fs.readdirSync(yt)) if (n.toLowerCase().startsWith(key)) files.push(path.join(yt, n));
  const er = path.join("data", "episode_refs", `${key}.json`); if (fs.existsSync(er)) files.push(er);
  const T = path.join(".tmp", p);
  if (fs.existsSync(T)) for (const n of fs.readdirSync(T)) if (/^(first_)?answers\.json$|^(sections|chapters)[^/]*\.json$|^(cover|thumb)[^/]*\.(png|jpe?g|webp)$/i.test(n)) files.push(path.join(T, n));
  if (!files.length) { console.log("لا شيء من حزمة النشر لهذا المشروع"); process.exit(0); }
  fs.mkdirSync(Q, { recursive: true });
  for (const f of files) fs.copyFileSync(f, path.join(Q, path.basename(f)));
  console.log(`✔ حُفظت حزمة النشر (${files.length} ملفاً) في data/publish_queue/${p}/`);
} else if (cmd === "list") {
  if (!fs.existsSync(Q)) { console.log("لا حزمة محفوظة"); process.exit(1); }
  for (const n of fs.readdirSync(Q)) console.log(n);
} else if (cmd === "clear") {
  // (approval 2026-11-21: save → publish → purge after an explicit yes → trash outputs) the package outlives the purge: while the project is still registered
  // the purge has not run, and clearing now would lose what the purge re-saves from
  let reg = []; try { const r = JSON.parse(fs.readFileSync(path.join(".tmp", "active_montage.json"), "utf8")); reg = r.projects ?? (r.project ? [r.project] : []); } catch { /* none */ }
  if (reg.some((x) => x.toLowerCase() === key)) { console.log(`✘ «${p}» ما زال مسجَّلاً: المسح لم يجرِ بعد (ينتظر موافقة المستخدم الصريحة على الحذف)، فالحزمة تبقى. احذفها بعد المسح.`); process.exit(1); }
  fs.rmSync(Q, { recursive: true, force: true }); console.log(`✔ حُذفت حزمة النشر ${p}`);
} else { console.error("أمر غير معروف"); process.exit(2); }
