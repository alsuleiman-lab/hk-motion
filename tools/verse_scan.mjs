// Finds EVERY Quran recitation in a project's spoken words and aligns each verse word to the second it is said.
//   node tools/verse_scan.mjs <project> [--min 4]
// Input : .tmp/<p>/words.json (source seconds, [{w,s,e}]), public/<p>_map.json (to drop what the cut removed and to give cut seconds).
// Output: .tmp/<p>/verses.json = [{sura,aya,name,ref,words[Uthmani],times[source s],cut[cut s],spoken:[i0,i1],matched}] and a printed table.
// Why (user 2026-10-28, «ما كتبت الآيات التي قرأتها» + «الآيات متأخرة عن كلامي»): verses were picked by eye (one recitation missed) and timed by spreading the verse
// words evenly over a time range (late when the range held other speech). Here every spoken run that matches the Quran text (database, never memory) becomes a verse item
// and each verse word takes the start time of the spoken word that matched it. Spoken text is Whisper's, so matching is fuzzy (spelling of hamza/yaa/taa marbuta, one slip).
import fs from "node:fs";
import path from "node:path";

const [p, ...rest] = process.argv.slice(2);
if (!p) { console.error("usage: node tools/verse_scan.mjs <project> [--min 4]"); process.exit(2); }
const MIN = Number(rest.includes("--min") ? rest[rest.indexOf("--min") + 1] : 4);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const norm = (w) => w.replace(/ٰ/g, "ا").replace(/[ً-ٰٟۖ-ۭـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[ؤئء]/g, "ا").replace(/[^ء-ي]/g, "");
const lev = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
const sim = (a, b) => (a === b ? 1 : a && b ? 1 - lev(a, b) / Math.max(a.length, b.length) : 0);

const db = JSON.parse(fs.readFileSync(path.join(root, "data/quran/quran-uthmani.json"), "utf8")).data.surahs;
const ayat = [];   // {s, a, name, orig[], n[]}
for (const su of db) for (const ay of su.ayahs) {
  let text = ay.text; if (su.number !== 1 && ay.numberInSurah === 1) text = text.replace(/^بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\s*/, "");
  const toks = text.replace(/[۞۩]/g, "").trim().split(/\s+/);
  const orig = [], n = [];
  for (const t of toks) { const k = norm(t); if (k) { orig.push(t); n.push(k); } else if (orig.length) orig[orig.length - 1] += " " + t; }   // stop signs ride on the previous word
  ayat.push({ s: su.number, a: ay.numberInSurah, name: su.name, orig, n });
}
const idx = new Map();   // trigram → [[ayahIndex, wordIndex]]
ayat.forEach((ay, ai) => { for (let i = 0; i + 2 < ay.n.length; i++) { const k = ay.n[i] + " " + ay.n[i + 1] + " " + ay.n[i + 2]; (idx.get(k) ?? idx.set(k, []).get(k)).push([ai, i]); } });

const allWords = JSON.parse(fs.readFileSync(path.join(".tmp", p, "words.json"), "utf8"));
const segs = JSON.parse(fs.readFileSync(path.join("public", `${p}_map.json`), "utf8")).segments;
const cutOf = (s) => { for (const g of segs) if (s >= g.a - 0.3 && s <= g.b + 0.1) return +(g.n + Math.max(0, Math.min(s - g.a, g.b - g.a))).toFixed(2); return null; };
const words = allWords.filter((w) => cutOf(w.s) != null);   // only what stays in the cut (a removed stumble must not break a recitation)
const S = words.map((w) => norm(w.w));
const LEAD = new Set(["تقول", "يقول", "قال", "قوله", "الايه", "الايات", "وتقول", "فيقول", "تعالي"]);

// every spoken position with a matching trigram → extend both ways (fuzzy, one stutter allowed) → keep the longest run per spoken start
const runs = [];
for (let i = 0; i + 2 < S.length; i++) {
  const hits = idx.get(S[i] + " " + S[i + 1] + " " + S[i + 2]); if (!hits) continue;
  for (const [ai, wi] of hits) {
    const A = ayat[ai]; const pairs = [[i, wi], [i + 1, wi + 1], [i + 2, wi + 2]];
    let subs = 0, j = i + 3, q = wi + 3;   // forward: exact/fuzzy match, a spoken stutter is skipped, ONE substitution allowed
    while (q < A.n.length && j < S.length) {
      if (sim(S[j], A.n[q]) >= 0.6) { pairs.push([j, q]); j++; q++; continue; }
      if (S[j] === S[j - 1]) { j++; continue; }
      if (subs < 1 && q + 1 < A.n.length && j + 1 < S.length && sim(S[j + 1], A.n[q + 1]) >= 0.6) { subs++; pairs.push([j, q]); j++; q++; continue; }
      break;
    }
    for (let k = 1; ; k++) { const j = i - k, q = wi - k; if (q < 0 || j < 0 || sim(S[j], A.n[q]) < 0.6) break; pairs.unshift([j, q]); }
    runs.push({ ai, pairs, uniq: hits.length === 1 });
  }
}
runs.sort((x, y) => y.pairs.length - x.pairs.length);
const taken = new Set(), kept = [];
for (const r of runs) {
  if (r.pairs.length < MIN && !(r.pairs.length >= 3 && [1, 2, 3].some((d) => LEAD.has(S[r.pairs[0][0] - d])))) continue;
  if (r.pairs.some(([j]) => taken.has(j))) continue;
  r.pairs.forEach(([j]) => taken.add(j)); kept.push(r);
}
kept.sort((x, y) => x.pairs[0][0] - y.pairs[0][0]);
// merge consecutive ayat said in one breath
const out = [];
for (const r of kept) {
  const A = ayat[r.ai], last = out[out.length - 1];
  const from = r.pairs[0], to = r.pairs[r.pairs.length - 1];
  if (last && last.s === A.s && A.a === last.aTo + 1 && from[0] - last.spokenTo <= 3 && from[1] <= 1 && last.wToIsEnd) {
    last.parts.push({ ai: r.ai, pairs: r.pairs }); last.aTo = A.a; last.spokenTo = to[0]; last.wToIsEnd = to[1] >= A.orig.length - 2; continue;
  }
  out.push({ s: A.s, aFrom: A.a, aTo: A.a, name: A.name, parts: [{ ai: r.ai, pairs: r.pairs }], spokenFrom: from[0], spokenTo: to[0], wToIsEnd: to[1] >= A.orig.length - 2 });
}
const result = [];
for (const o of out) {
  const vw = [], tm = [];
  for (const part of o.parts) {
    const A = ayat[part.ai], q0 = part.pairs[0][1], q1 = part.pairs[part.pairs.length - 1][1];
    for (let q = q0; q <= q1; q++) {
      vw.push(A.orig[q]);
      const m = part.pairs.find(([, qq]) => qq === q);
      tm.push(m ? words[m[0]].s : null);
    }
  }
  // fill unmatched verse words between neighbours (linear), then keep strictly increasing times
  for (let i = 0; i < tm.length; i++) if (tm[i] == null) {
    let a = i - 1, b = i + 1; while (b < tm.length && tm[b] == null) b++;
    const ta = a >= 0 ? tm[a] : tm[b], tb = b < tm.length ? tm[b] : tm[a];
    tm[i] = ta + ((tb - ta) * (i - a)) / (b - a);
  }
  for (let i = 1; i < tm.length; i++) if (tm[i] <= tm[i - 1]) tm[i] = tm[i - 1] + 0.05;
  const cuts = tm.map(cutOf);
  const kept_ = cuts.filter((x) => x != null).length;
  result.push({ sura: o.s, aya: o.aFrom, ayaTo: o.aTo, name: o.name, ref: o.aFrom === o.aTo ? `الآية ${o.aFrom}` : `الآيات ${o.aFrom}–${o.aTo}`, words: vw, times: tm.map((x) => +x.toFixed(2)), cut: cuts, inCut: kept_ === tm.length, matched: o.parts.reduce((n, x) => n + x.pairs.length, 0), spoken: [o.spokenFrom, o.spokenTo] });
}
fs.writeFileSync(path.join(".tmp", p, "verses.json"), JSON.stringify(result, null, 1));
for (const v of result) console.log(`${v.inCut ? "✔" : "✘ (محذوفة من القص)"} ${v.sura}:${v.aya}${v.ayaTo !== v.aya ? "-" + v.ayaTo : ""} ${v.name} | ${v.words.length} كلمة (${v.matched} مطابقة) | مصدر ${v.times[0]}–${v.times[v.times.length - 1]}ث${v.inCut ? ` | قص ${v.cut[0]}–${v.cut[v.cut.length - 1]}ث` : ""} | ${v.words.slice(0, 4).join(" ")}…`);
console.log(`→ .tmp/${p}/verses.json (${result.length} تلاوة)`);
