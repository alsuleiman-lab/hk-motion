// Newest recording in the user's video folder, by type (user order 2026-11-16: «أقول له اعمل الدرس الأخير أو البث المباشر الأخير، هو بنفسه سيدخل إلى مجلد الفيديو ويسحب التسجيل»).
//   node tools/latest_recording.mjs [lesson|stream|episode|any] [--json]
// Looks only at the top of C:\Users\mshms\Videos (not جاهز or other sub-folders). Type by name:
//   stream  = «بث» in the name;  lesson = «درس / شرح / مجلس» or a series number at the end («نونية ابن القيم - 62»);  episode = anything else.
import fs from "node:fs";
import path from "node:path";

export const VIDEOS = "C:/Users/mshms/Videos";
export const kindOf = (name) => {
  const n = name.replace(/\.[^.]+$/, "");
  if (/بث/.test(n)) return "stream";
  if (/(درس|شرح|مجلس)/.test(n) || /[-–]\s*\d+\s*$/.test(n)) return "lesson";
  return "episode";
};
export const recordings = () => fs.readdirSync(VIDEOS, { withFileTypes: true })
  .filter((e) => e.isFile() && /\.(mp4|mkv|mov)$/i.test(e.name))
  .map((e) => { const f = path.join(VIDEOS, e.name), st = fs.statSync(f); return { file: f, name: e.name, kind: kindOf(e.name), mtime: st.mtime.toISOString(), gb: +(st.size / 1e9).toFixed(2) }; })
  .sort((a, b) => b.mtime.localeCompare(a.mtime));

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve("tools/latest_recording.mjs")) {
  const want = (process.argv[2] && !process.argv[2].startsWith("--")) ? process.argv[2] : "any";
  const hit = recordings().find((r) => want === "any" || r.kind === want);
  if (!hit) { console.log(`✘ لا تسجيل من نوع «${want}» في مجلد الفيديو`); process.exit(1); }
  console.log(process.argv.includes("--json") ? JSON.stringify(hit) : `${hit.kind}\t${hit.mtime.slice(0, 16)}\t${hit.gb} GB\t${hit.file}`);
}
