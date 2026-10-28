// معرض صور الشيخ للأغلفة (أمر المستخدم 2026-10-25): يُحفظ دائماً ولا يُحذف عند الاعتماد أو التنظيف.
//   node tools/sheikh_gallery.mjs add <cutout.png> <robe> ["ملاحظة"]   → ينسخ الصورة (مفرّغة الخلفية) إلى public/sheikh_gallery/<robe>/ ويسجّلها في gallery.json
//   node tools/sheikh_gallery.mjs list [robe]                          → يسرد الصور (حسب لون الثوب)
//   node tools/sheikh_gallery.mjs sheet [robe]                         → شبكة معاينة على خلفية خضراء في .tmp/sheikh_gallery.jpg
// ألوان الثوب: black (أسود) white (أبيض) brown (بني) green (أخضر) black_white (أسود مع أبيض).
// القاعدة: كل صورة يختارها المستخدم للغلاف تُضاف هنا فوراً؛ وإن لم يحدّد صورة فاختر من المعرض صورة بلون ثوبه في الفيديو الحالي.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
const ROOT = "public/sheikh_gallery", DB = path.join(ROOT, "gallery.json");
const ROBES = { black: "أسود", white: "أبيض", brown: "بني", green: "أخضر", black_white: "أسود مع أبيض" };
const db = fs.existsSync(DB) ? JSON.parse(fs.readFileSync(DB, "utf8")) : [];
const save = () => fs.writeFileSync(DB, JSON.stringify(db, null, 1));
const [cmd, a, b, note = ""] = process.argv.slice(2);
if (cmd === "add") {
  if (!a || !ROBES[b]) { console.error("usage: add <png> <" + Object.keys(ROBES).join("|") + "> [note]"); process.exit(2); }
  const dir = path.join(ROOT, b); fs.mkdirSync(dir, { recursive: true });
  let name = path.basename(a); if (fs.existsSync(path.join(dir, name))) name = Date.now() + "_" + name;
  fs.copyFileSync(a, path.join(dir, name));
  db.push({ file: `sheikh_gallery/${b}/${name}`, robe: b, from: a, note, date: new Date().toISOString().slice(0, 10) }); save();
  console.log(`✔ أُضيفت: ${b}/${name} (${ROBES[b]})`);
} else if (cmd === "list") {
  for (const e of db.filter((e) => !a || e.robe === a)) console.log(`${ROBES[e.robe]}\t${e.file}\t${e.note}`);
} else if (cmd === "sheet") {
  const L = db.filter((e) => !a || e.robe === a); if (!L.length) { console.log("المعرض فارغ"); process.exit(0); }
  const ins = L.flatMap((e) => ["-i", path.join("public", e.file)]);
  const f = L.map((_, i) => `color=0x00b050:s=300x420[g${i}];[${i}:v]scale=300:420:force_original_aspect_ratio=decrease[s${i}];[g${i}][s${i}]overlay=(W-w)/2:H-h[o${i}]`).join(";") + ";" + L.map((_, i) => `[o${i}]`).join("") + `hstack=inputs=${L.length}`;
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...ins, "-filter_complex", L.length > 1 ? f : f.replace(/;\[o0\]hstack=inputs=1$/, ""), ...(L.length > 1 ? [] : ["-map", "[o0]"]), "-frames:v", "1", ".tmp/sheikh_gallery.jpg"], { encoding: "utf8" });
  console.log(r.status === 0 ? "✔ .tmp/sheikh_gallery.jpg" : r.stderr);
} else { console.error("usage: add|list|sheet"); process.exit(2); }
