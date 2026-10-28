// Cover VARIETY guard (user complaint 2026-10-22: every cover had the same background and manuscript). Keeps data/covers_log.json and refuses a cover whose backdrop image or issue prop
// repeats one of the last N covers (default 3), or that uses the old default manuscript look without the topic being hadith/manuscripts.
//   node tools/cover_variety.mjs check  --bg <public path> --book <public path|none> [--palette BLUE] [--topic-is-manuscript] [--last 3]
//   node tools/cover_variety.mjs add    <compositionId> --bg <path> --book <path|none> [--palette X]          (after the user approves the cover)
//   node tools/cover_variety.mjs list
import fs from "node:fs";

const FILE = "data/covers_log.json";
const MANUSCRIPTS = ["cov/ms_marinid.jpg", "cov/ms_calli.jpg", "cov/ms_bukhari.jpg"];
const argv = process.argv.slice(2);
const cmd = argv[0];
const opt = (n, d = "") => (argv.includes("--" + n) ? argv[argv.indexOf("--" + n) + 1] : d);
const has = (n) => argv.includes("--" + n);
const log = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, "utf8")) : [];
const norm = (s) => String(s ?? "").replace(/\\/g, "/").replace(/^public\//, "").toLowerCase();

if (cmd === "list") { for (const c of log) console.log(`${c.at?.slice(0, 10) ?? ""}  ${c.id}  bg=${c.bg}  book=${c.book}  palette=${c.palette}`); process.exit(0); }
if (cmd === "add") {
  const id = argv[1];
  if (!id || id.startsWith("--")) { console.error("usage: add <compositionId> --bg … --book … [--palette …]"); process.exit(2); }
  log.push({ id, bg: norm(opt("bg")), book: norm(opt("book", "none")), palette: opt("palette", "?"), at: new Date().toISOString() });
  fs.mkdirSync("data", { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(log, null, 1)); console.log("سُجّل غلاف", id); process.exit(0);
}
if (cmd === "check") {
  const bg = norm(opt("bg")), book = norm(opt("book", "none")), n = Number(opt("last", "3")), recent = log.slice(-n);
  const problems = [];
  if (!bg) problems.push("لا خلفية موضوعية (--bg): الغلاف يجب أن يملك خلفية تخص موضوع هذا الفيديو");
  if (!has("topic-is-manuscript")) {
    if (MANUSCRIPTS.includes(bg)) problems.push(`الخلفية «${bg}» مخطوطة افتراضية قديمة وموضوع الفيديو ليس المخطوطات/الحديث`);
    if (MANUSCRIPTS.includes(book)) problems.push(`الصورة المعبّرة «${book}» مخطوطة افتراضية قديمة وموضوع الفيديو ليس المخطوطات/الحديث`);
  }
  for (const c of recent) {
    if (bg && c.bg === bg) problems.push(`الخلفية «${bg}» استُعملت في غلاف «${c.id}» الأخير`);
    if (book !== "none" && c.book === book) problems.push(`الصورة المعبّرة «${book}» استُعملت في غلاف «${c.id}» الأخير`);
  }
  console.log(`آخر ${recent.length} أغلفة: ${recent.map((c) => c.id).join("، ") || "(لا سجل)"}`);
  if (problems.length) { for (const p of problems) console.log("✘ " + p); console.log("\nاختر خلفية وصورة تعبّر عن موضوع هذا الفيديو (مكان، حشد، مبنى، علم، منظر) ولا تُعد ما سبق."); process.exit(1); }
  console.log("✔ الخلفية والصورة المعبّرة جديدتان وتخصان الموضوع"); process.exit(0);
}
console.error("usage: node tools/cover_variety.mjs check|add|list …"); process.exit(2);
