// No two elements overlap in time (user order 2026-11-16: «يمنع تداخل عنصرين» + «الصور لا تقسم الشاشة»).
//   node tools/overlap_gate.mjs data/specs/<p>.json [--o land|port]
// Spans use what the engine really draws: a picked element lives until max(until, its last event + 1.5 s) (pickUntil), a hadith/verse until its `until`.
// (a) two WRITING/PANEL elements (pick, note, verse, hadith, torn, scraps, word, blur, rows, stamp, news, p2c, tree…) never overlap in the same orientation;
// (b) a picture (tphoto, scholar, pic, flag, crop, clock) never overlaps a split-screen element (a half-way pick / a note with phrases / a non-full verse), because a picture must not split the screen.
// Exit 1 while any pair overlaps by more than 0.15 s.
import fs from "node:fs";
const specF = process.argv.find((a) => a.endsWith(".json")); const oi = process.argv.indexOf("--o");
if (!specF) { console.error("usage: node tools/overlap_gate.mjs data/specs/<p>.json [--o land|port]"); process.exit(2); }
const spec = JSON.parse(fs.readFileSync(specF, "utf8"));
const NOSPLIT = new Set(["RingStat", "MythFact", "ChatThread", "FlapBoard", "Battery", "BigQuestion"]);
const FULL = new Set(["AlertFrame", "BrushWipe", "MinuteTeaser", "PipSource"]);
const WRITE = new Set(["pick", "note", "verse", "hadith", "torn", "scraps", "word", "blur", "rows", "stamp", "news", "p2c", "tree", "treefx", "timeline", "pmap", "rewrite", "date"]);
const PIC = new Set(["tphoto", "scholar", "pic", "flag", "crop", "clock", "flash"]);
const lastEvent = (o) => { let m = -1; const walk = (x, k) => { if (Array.isArray(x)) x.forEach((v) => walk(v, k)); else if (x && typeof x === "object") for (const [kk, v] of Object.entries(x)) walk(v, kk); else if (typeof x === "number" && /(^|[a-z])At$|^at$/.test(k ?? "")) m = Math.max(m, x); }; walk(o, ""); return m; };
const span = (it) => {
  if (it.t === "pick") { const le = lastEvent(it); return [it.at, Math.max(it.until, le + 1.5)]; }
  if (it.t === "verse" || it.t === "hadith") return [it.times[0], it.until ?? it.times[it.times.length - 1] + 1.2];
  if (it.t === "note") return [it.phrases?.[0]?.at ?? it.at, it.until];
  if (it.t === "rows" || it.t === "p2c" || it.t === "tree" || it.t === "pmap" || it.t === "timeline" || it.t === "treefx") return [it.from, it.to];
  return [it.at ?? it.from, it.until ?? it.to ?? (it.at ?? it.from) + 2.5];
};
const split = (it) => (it.t === "pick" && !(it.noShift ?? NOSPLIT.has(it.el)) && !FULL.has(it.el)) || (it.t === "note" && !!it.phrases?.length) || (it.t === "verse" && !it.full);
let bad = 0;
for (const o of oi > 0 ? [process.argv[oi + 1]] : ["land", "port"]) {
  const els = spec.items.map((it, i) => ({ it, i, s: span(it) })).filter((x) => (WRITE.has(x.it.t) || PIC.has(x.it.t)) && (!x.it.only || x.it.only === o) && !(o === "land" && x.it.land?.skip) && x.s[0] != null);
  for (let a = 0; a < els.length; a++) for (let b = a + 1; b < els.length; b++) {
    const A = els[a], B = els[b], ov = Math.min(A.s[1], B.s[1]) - Math.max(A.s[0], B.s[0]);
    if (ov <= 0.15) continue;
    const wa = WRITE.has(A.it.t), wb = WRITE.has(B.it.t), pa = PIC.has(A.it.t), pb = PIC.has(B.it.t);
    const kind = wa && wb ? "عنصران كتابيان" : (pa && split(B.it)) || (pb && split(A.it)) ? "صورة فوق تقسيم الشاشة" : null;
    if (!kind) continue;
    if (kind === "عنصران كتابيان" && o === "port" && (A.it.t === "word" || B.it.t === "word")) continue;
    bad++; console.log(`✘ [${o === "land" ? "عرضي" : "طولي"}] ${kind}: ${A.it.t}${A.it.el ? ":" + A.it.el : ""}#${A.i} (${A.s[0].toFixed(1)}–${A.s[1].toFixed(1)}) مع ${B.it.t}${B.it.el ? ":" + B.it.el : ""}#${B.i} (${B.s[0].toFixed(1)}–${B.s[1].toFixed(1)}) تداخل ${ov.toFixed(1)}ث`);
  }
}
console.log(bad ? `✘ overlap_gate: ${bad} تداخل` : "✔ overlap_gate: لا تداخل بين عنصرين");
process.exit(bad ? 1 : 0);
