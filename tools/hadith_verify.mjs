// Verify a hadith he narrates against the books themselves, offline (rules §8.3; user 2026-11-16: «مو ضروري للمكتبة الشاملة، شوف خدمة اونلاين وتنزلها وتتوثق عن طريقها»).
//   node tools/hadith_verify.mjs "<words he said>" [--n 5] [--book bukhari,muslim]
//   node tools/hadith_verify.mjs --p <p>        every unverified entry of .tmp/<p>/hadith.json → best matches printed (I choose, then fill text/book/n, verified:true)
// Library: S:/AI_Tools/hadith_db/ara-<book>.json — the nine books (Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasa'i, Ibn Majah, Malik, Nawawi's forty, Qudsi) from the open
// hadith-api dataset (fawazahmed0, jsDelivr). Refresh: node tools/hadith_verify.mjs --download. Shamela (the connector) stays the first choice when it answers;
// this is the fallback that never goes down. Numbering = the standard printed one (`arabicnumber`: Muslim by Abd al-Baqi, e.g. «بني الإسلام» = 16), not the site's running number.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const DB = "S:/AI_Tools/hadith_db";
const BOOKS = { bukhari: "صحيح البخاري", muslim: "صحيح مسلم", abudawud: "سنن أبي داود", tirmidhi: "سنن الترمذي", nasai: "سنن النسائي", ibnmajah: "سنن ابن ماجه", malik: "موطأ مالك", nawawi: "الأربعون النووية", qudsi: "الأحاديث القدسية" };
const argv = process.argv.slice(2), opt = (k, d) => (argv.includes("--" + k) ? argv[argv.indexOf("--" + k) + 1] : d);

if (argv.includes("--download")) {
  fs.mkdirSync(DB, { recursive: true });
  for (const b of Object.keys(BOOKS)) { const r = spawnSync("curl", ["-s", "-m", "180", "-o", `${DB}/ara-${b}.json`, `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-${b}.json`]); console.log(`${r.status === 0 ? "✔" : "✘"} ${BOOKS[b]}`); }
  process.exit(0);
}

const norm = (s) => String(s).replace(/[\u064B-\u0652\u0670\u0640]/g, "").replace(/[إأآٱا]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[ؤئ]/g, "ء").replace(/[^\u0621-\u064A ]/g, " ").replace(/\s+/g, " ").trim();
const STOP = new Set(["صلي", "الله", "عليه", "وسلم", "رسول", "النبي", "قال", "عن", "في", "من", "ان", "الي", "علي", "ما", "لا", "هذا", "يعني", "انه", "كان", "ثم", "او", "و", "يا", "هو", "هي", "لم", "قد", "اذا", "فقال", "يقول", "رضي", "عنه"]);
const toks = (s) => norm(s).split(" ").map((w) => w.replace(/^(و|ف)(?=...)/, "")).filter((w) => w.length > 1 && !STOP.has(w));

const pick = opt("book", null)?.split(",") ?? Object.keys(BOOKS);
const lib = [];
for (const b of pick) {
  const f = `${DB}/ara-${b}.json`; if (!fs.existsSync(f)) continue;
  for (const h of JSON.parse(fs.readFileSync(f, "utf8")).hadiths ?? []) if (h.text) lib.push({ b, n: Math.floor(Number(h.arabicnumber)) || h.hadithnumber, text: h.text, t: new Set(toks(h.text)) });
}
if (!lib.length) { console.error(`✘ no books in ${DB} — run: node tools/hadith_verify.mjs --download`); process.exit(2); }

// score = share of his distinctive words found in the hadith, plus a bonus for his word pairs kept in order
// score = the best run of ~10 consecutive words of his speech (his commentary around the narration does not dilute it): share of its words in the hadith
// + a bonus for its word pairs kept in order. A short quote is scored whole.
const search = (said, n) => {
  const q = toks(said); if (!q.length) return [];
  const W = Math.min(10, q.length), wins = [];
  for (let i = 0; i + W <= q.length; i += Math.max(1, Math.floor(W / 2))) wins.push(q.slice(i, i + W));
  if (!wins.length) wins.push(q);
  return lib.map((h) => {
    const hn = norm(h.text).split(" ").map((w) => w.replace(/^(و|ف)(?=...)/, "")).join(" ");
    let score = 0;
    for (const w of wins) { const hit = w.filter((x) => h.t.has(x)).length / w.length; let pairs = 0; for (let i = 0; i + 1 < w.length; i++) if (hn.includes(w[i] + " " + w[i + 1])) pairs++; score = Math.max(score, hit + (pairs / Math.max(1, w.length - 1)) * 0.5); }
    return { ...h, score };
  }).sort((a, b) => b.score - a.score).slice(0, n);
};
const show = (said, n) => {
  for (const r of search(said, n)) console.log(`  ${(r.score * 100 / 1.5).toFixed(0).padStart(3)}٪  ${BOOKS[r.b]} (${r.n}): ${r.text.replace(/\s+/g, " ").slice(0, 260)}…`);
};

if (opt("p", null)) {
  const F = path.join(".tmp", opt("p"), "hadith.json"), list = JSON.parse(fs.readFileSync(F, "utf8"));
  for (const h of list.filter((x) => !x.verified && !x.skip)) { console.log(`\n${Math.floor(h.at / 60)}:${String(Math.floor(h.at % 60)).padStart(2, "0")}  ${h.spoken.slice(0, 160)}`); show(h.spoken, Number(opt("n", "4"))); }
} else {
  const said = argv.find((a, i) => !a.startsWith("--") && !argv[i - 1]?.startsWith("--"));
  if (!said) { console.error('usage: node tools/hadith_verify.mjs "<words>" | --p <p> | --download'); process.exit(2); }
  show(said, Number(opt("n", "5")));
}
