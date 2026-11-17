// ONE ELEMENT AT A TIME (user 2026-11-17: «ممنوع استخدام عنصرين بنفس الوقت إلا في حال سمح به في المعرض… كل عنصر يأخذ مساحة وقتية لا يدخل فيها عنصر آخر،
// وإذا تعارض عنصران يؤخذ الأهم: الصورة أهم من الكتابة، الحديث والآية أولى من الكتابة والصورة… واستثناءات مثل شريط الحلقة»).
//   node tools/element_slots.mjs <p>          → lists every pair of spec items on screen together (same orientation); exit 1 when any
//   node tools/element_slots.mjs <p> --fix    → the LOWER-ranked item yields: trimmed to end before the higher one starts, or moved to start after it ends,
//                                               or removed when less than 1.5 s would remain; equal ranks: the later one yields. Writes data/specs/<p>.json
// Ranks and exempt types: data/element_priority.json. A gallery element that holds two pictures is ONE item, so it never clashes with itself.
import fs from "node:fs";
import path from "node:path";

const p = process.argv[2], FIX = process.argv.includes("--fix");
if (!p) { console.error("usage: node tools/element_slots.mjs <p> [--fix]"); process.exit(2); }
process.chdir(path.resolve(import.meta.dirname, ".."));
const PR = JSON.parse(fs.readFileSync("data/element_priority.json", "utf8"));
const f = `data/specs/${p}.json`, spec = JSON.parse(fs.readFileSync(f, "utf8"));
const end = (it) => it.until ?? (it.dur != null ? it.at + it.dur : it.to ?? null);
const rank = (it) => PR.rank[it.t] ?? 2;
const sides = (it) => (it.only === "land" ? ["land"] : it.only === "port" ? ["port"] : ["land", "port"]);
const unknown = new Set();
const live = () => spec.items.map((it, i) => ({ it, i })).filter(({ it }) => typeof it.at === "number" && end(it) != null && !PR.exempt.includes(it.t));
const mm = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`;
const clashes = () => {
  const L = live(), out = [];
  for (const x of L) if (PR.rank[x.it.t] == null) unknown.add(x.it.t);
  for (let a = 0; a < L.length; a++) for (let b = a + 1; b < L.length; b++) {
    const A = L[a].it, B = L[b].it;
    if (!sides(A).some((s) => sides(B).includes(s))) continue;
    const o0 = Math.max(A.at, B.at), o1 = Math.min(end(A), end(B));
    if (o1 - o0 > 0.05) out.push([L[a], L[b], o0, o1]);
  }
  return out;
};
let C = clashes();
for (const [x, y, o0, o1] of C) console.log(`✘ ${mm(o0)}–${mm(o1)}: «${x.it.t}» (${x.it.at}–${end(x.it)}) مع «${y.it.t}» (${y.it.at}–${end(y.it)})`);
if (unknown.size) console.log(`⚠ أنواع بلا رتبة (عُدّت 2): ${[...unknown].join("، ")} — أضفها إلى data/element_priority.json`);
if (!C.length) { console.log("✔ لا عنصران في وقت واحد"); process.exit(0); }
if (!FIX) { console.log(`\n${C.length} تعارضاً — الأهم يبقى (الحديث والآية ← الصورة ← الكتابة)؛ للتصحيح: --fix`); process.exit(1); }

// fix: repeatedly let the lower-ranked item of the first clash yield
const removed = new Set(), log = [];
for (let guard = 0; guard < 500; guard++) {
  C = clashes().filter(([x, y]) => !removed.has(x.i) && !removed.has(y.i));
  if (!C.length) break;
  const [x, y] = C[0];
  const [hi, lo] = rank(x.it) > rank(y.it) ? [x, y] : rank(y.it) > rank(x.it) ? [y, x] : x.it.at <= y.it.at ? [x, y] : [y, x];
  const H = hi.it, Lo = lo.it, len = end(Lo) - Lo.at, before = H.at - Lo.at, after = end(Lo) - end(H);
  const setEnd = (it, t) => { if (it.until != null) it.until = +t.toFixed(2); else if (it.dur != null) it.dur = +(t - it.at).toFixed(2); else it.to = +t.toFixed(2); };
  if (before >= 1.5 && before >= after) { setEnd(Lo, H.at - 0.05); log.push(`قُصّر «${Lo.t}» ليتنحّى عن «${H.t}» عند ${mm(H.at)}`); }
  else if (after >= 1.5) { const e = end(Lo); Lo.at = +(end(H) + 0.05).toFixed(2); setEnd(Lo, e); log.push(`أُخّر «${Lo.t}» إلى ما بعد «${H.t}» (${mm(Lo.at)})`); }
  else { removed.add(lo.i); log.push(`حُذف «${Lo.t}» عند ${mm(Lo.at)} (${len.toFixed(1)}ث) لأن «${H.t}» أهم ولا يبقى له 1.5ث`); }
}
spec.items = spec.items.filter((_, i) => !removed.has(i));
fs.writeFileSync(f, JSON.stringify(spec, null, 1));
console.log("\n" + log.join("\n"));
const left = clashes(); console.log(left.length ? `✘ بقي ${left.length}` : "✔ بعد التصحيح: لا عنصران في وقت واحد"); process.exit(left.length ? 1 : 0);
