// Quran text ALWAYS comes from a database, never from memory (user rule 2026-10-16: «القرآن خط أحمر»).
//   node tools/quran_ayah.mjs <sura> <aya> [fromWord toWord]     → prints the Uthmani text (+ words, numbered) from data/quran/quran-uthmani.json
// Source: api.alquran.cloud edition quran-uthmani (downloaded once, 2.1 MB). Cross-check against the Shamela library when quoting a verse (shamela_get_aya).
import fs from "node:fs";
const [sura, aya, from, to] = process.argv.slice(2).map(Number);
const db = JSON.parse(fs.readFileSync(new URL("../data/quran/quran-uthmani.json", import.meta.url), "utf8"));
let text = db.data.surahs[sura - 1].ayahs.find((a) => a.numberInSurah === aya).text;
if (sura !== 1 && sura !== 9 && aya === 1) { const w = text.trim().split(/\s+/); if (w.length > 4 && /^بِسْ?مِ?/.test(w[0])) text = w.slice(4).join(" "); }   // the edition prefixes the basmala (its letters vary, so drop the first four words) // the basmala is prefixed to ayah 1 in this edition
const words = text.replace(/[۞۩]/g, "").trim().split(/\s+/);
const sel = from ? words.slice(from - 1, to ?? words.length) : words;
console.log(JSON.stringify({ sura, aya, name: db.data.surahs[sura - 1].name, words: sel, text: sel.join(" ") }, null, 1));
