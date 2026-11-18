// WRITING CHOSEN BY READING, PLACED AT ITS WORDS (user 2026-11-11: «تكتب عبارات غير مفهومة وغير مكتملة… تنقص كلمات وتكتب كلمات أخرى»).
// The old build cut his speech mechanically into ~6-word pieces every few seconds (every 3rd a torn note) from the weaker transcript: fragments like
// «مثلي فكبير مع أنه». Now the phrases are CHOSEN by me in .tmp/<p>/writing.json (torn = a statement that sums up what he says; scraps = a caption of his
// important speech, complete in meaning, ≤ 7 words) and this tool:
//   node tools/writing_place.mjs <p> [--write]
// 1) finds each phrase as CONSECUTIVE words of the full large-model transcript of the final audio (.tmp/<p>/drift_fresh.json) — a missing, added or
//    changed word fails (a mishearing is corrected only through the file's "fix" map: transcript word → what he said);
// 2) refuses a phrase that starts or ends on a dangling word (و، مع، أن، أنه، له، على، في، من، إلى، عن، الذي، اللي، بين…) or a scraps longer than 7 words;
// 3) with --write: removes EVERY torn/scraps of the spec and puts these in, `at` = first word, scraps `times` = each word, until = last word + hold
//    (user 2026-11-18, rules review w5/w15: every writing 1.5 s after its last part, ≥ 0.2 s before the next writing of the band; was torn 1.8 / scraps 1.0 / −0.15).
import fs from "node:fs";
import path from "node:path";

const [p] = process.argv.slice(2), WRITE = process.argv.includes("--write");
if (!p) { console.error("usage: node tools/writing_place.mjs <p> [--write]"); process.exit(2); }
process.chdir(path.resolve(import.meta.dirname, ".."));
const T = path.join(".tmp", p), specF = path.join("data", "specs", `${p}.json`);
const W = JSON.parse(fs.readFileSync(path.join(T, "writing.json"), "utf8"));
const fresh = JSON.parse(fs.readFileSync(path.join(T, "drift_fresh.json"), "utf8"));
const norm = (s) => String(s).replace(/[ً-ْٰـ]/g, "").replace(/[إأآٱا]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[^\p{L}\p{N}]/gu, "");
const FIX = Object.fromEntries(Object.entries(W.fix ?? {}).map(([k, v]) => [norm(k), norm(v)]));
const N = fresh.map((w) => { const n = norm(w.w); return FIX[n] ?? n; });
const cwRaw = fs.existsSync(path.join(T, "cut_words.json")) ? JSON.parse(fs.readFileSync(path.join(T, "cut_words.json"), "utf8")) : [];
const CW = (cwRaw.words ?? cwRaw).map((w) => ({ s: +(w.s ?? w.start), n: norm(w.w ?? w.word) }));
/* (2026-11-13) the fresh pass can hallucinate a stretch (a repeated loop over a clip) or spell a word otherwise; the merged large-model words of the cut are a second accurate reading: a phrase is accepted when it is consecutive words in EITHER */
const CWl = CW.map((w) => ({ s: w.s, w: w.n })), CWn = CW.map((w) => FIX[w.n] ?? w.n);
const DANGLE = new Set(["و", "مع", "ان", "انه", "انها", "له", "لها", "علي", "في", "من", "الي", "عن", "الذي", "التي", "اللي", "بين", "او", "ثم", "لكن", "ولكن", "قد", "هو", "هي", "يعني", "بس", "ف"].map(norm));
const bad = [], out = [];
for (const it of W.items) {
  const q = it.text.split(/\s+/).map(norm).filter(Boolean);
  let hit = -1, L = fresh, NN = N;
  for (let i = 0; i < NN.length; i++) { if (L[i].s < (it.from ?? 0) - 15) continue; /* later cut blocks move the words earlier */ if (q.every((x, j) => NN[i + j] === x)) { hit = i; break; } }
  if (hit < 0) { L = CWl; NN = CWn; for (let i = 0; i < NN.length; i++) { if (L[i].s < (it.from ?? 0) - 15) continue; if (q.every((x, j) => NN[i + j] === x)) { hit = i; break; } } }
  if (hit < 0) { bad.push(`«${it.text}» ليست كلماته متتابعة كما نطقها (من ${it.from}ث)`); continue; }
  if (it.t === "scraps" && q.length > 7) bad.push(`«${it.text}» قصاصات أطول من 7 كلمات`);
  if (DANGLE.has(q[q.length - 1])) bad.push(`«${it.text}» تنتهي بكلمة معلّقة «${it.text.split(/\s+/).pop()}»`);
  if (DANGLE.has(q[0]) && !["و", "ولكن", "لكن", "هو", "هي"].includes(it.text.split(/\s+/)[0].replace(/[إأآ]/g, "ا"))) bad.push(`«${it.text}» تبدأ بكلمة معلّقة`);
  /* two transcripts disagree on word starts by up to 0.7 s: a word shows at the LATER of the two, so writing is never ahead of his voice */
  const times = q.map((x, j) => { const s0 = L[hit + j].s, c = CW.find((w) => Math.abs(w.s - s0) < 0.8 && (w.n === x || w.n.endsWith(x))); return +Math.max(s0, c?.s ?? 0).toFixed(2); }), lastEnd = L[hit + q.length]?.s ?? times[times.length - 1] + 0.6;
  out.push({ ...it, times, at: times[0], lastEnd });
}
/* (user 2026-11-12) «القصاصات والملاحظة الممزقة: كل واحدة منهما مرة واحدة في الدقيقة، ولا يجوز تكرارها»: per minute of the video at most ONE scraps and ONE torn */
{
  const per = {};
  for (const o of out) { const k = `${o.t}@${Math.floor(o.at / 60)}`; (per[k] ??= []).push(o); }
  for (const [k, list] of Object.entries(per)) if (list.length > 1) { const [t, m] = k.split("@"); bad.push(`الدقيقة ${m}: ${list.length} ${t === "torn" ? "ملاحظات ممزقة" : "قصاصات"} (المسموح واحدة): ${list.map((o) => `«${o.text}»`).join("، ")}`); }
}
/* (user 2026-11-12) «الكتابة لازم توافق قولي كلمة بكلمة»: a list card (rows) — its title, every label and every small line — is his spoken words, consecutive */
if (fs.existsSync(specF)) {
  const has = (txt) => { const q = String(txt).split(/\s+/).map(norm).filter(Boolean); return !q.length || N.some((_, i) => q.every((x, j) => N[i + j] === x)) || CWn.some((_, i) => q.every((x, j) => CWn[i + j] === x)); };
  for (const r of JSON.parse(fs.readFileSync(specF, "utf8")).items.filter((x) => x.t === "rows")) {
    for (const txt of [r.title?.text, ...(r.rows ?? []).flatMap((x) => [x.label, x.sub])].filter(Boolean)) if (!has(txt)) bad.push(`بطاقة البنود عند ${r.from}ث: «${txt}» ليست كلماته متتابعة كما نطقها`);
  }
}
if (bad.length && !process.argv.includes("--hold")) { console.log(`✘ writing_place: ${bad.length} عبارة مرفوضة:\n  ` + bad.join("\n  ")); process.exit(1); }
out.sort((a, b) => a.at - b.at);
/* (user 2026-11-18, rules review w5/w15) one hold for every writing element: 1.5 s after its last part; two writings of the same band (torn and scraps share it)
   keep ≥ 0.2 s between them. A phrase the next writing cuts below its 1.5 s is named (⚠) so the plan can move or drop one of them. */
const HOLD = 1.5, GAP = 0.2, short = [];
const items = out.map((o, i) => {
  const next = out[i + 1]?.at ?? 1e9, until = +Math.min(o.lastEnd + HOLD, next - GAP).toFixed(2);
  if (until < o.lastEnd + HOLD - 0.01) short.push(`«${o.text}» @${o.at}ث تبقى ${Math.max(0, until - o.lastEnd).toFixed(2)}ث بعد آخر كلمة (< ${HOLD}) لأن الكتابة التالية تبدأ ${next}ث`);
  /* a long torn note keeps ONE line in landscape (2026-11-12, kitab 1:45: two lines ran under the title bar / onto the face): the largest size ≤ 37 whose text fits one line of the 1000-px note (TornNote wrap estimate, as grid_plan) */
  const oneLine = (txt) => { const L = txt.replace(/\s+/g, " ").length; for (let z = 37; z > 30; z--) { const w = Math.min(1000, Math.round(L * z * 0.5 + 3.6 * z + 70)); if (L <= Math.floor((w - 3.6 * z) / (z * 0.52))) return z; } return 30; };
  return o.t === "torn" ? { t: "torn", text: o.text, at: o.at, until, land: { size: oneLine(o.text), y: 822 } } : { t: "scraps", text: o.text, at: o.at, until, times: o.times, y: 1500, land: { size: 34 } };
});
console.log(`✔ writing_place: ${items.length} عبارة (ملاحظة ممزقة ${items.filter((x) => x.t === "torn").length}، قصاصات ${items.filter((x) => x.t === "scraps").length}) كلها بكلماته متتابعة ومكتملة`);
if (short.length) console.log(`⚠ writing_place: ${short.length} كتابة أقصر من ${HOLD}ث بعد آخر كلمة:\n  ` + short.join("\n  "));
// --hold: after writing_sync / grid moved things, each writing item stays until the next writing item (−0.15 s) or the next card in the writing band,
// at most 7 s after its start, never shorter than its last word + 0.6 s — no two writings overlap and no blank stretch is left after a phrase
if (process.argv.includes("--hold")) {
  const spec = JSON.parse(fs.readFileSync(specF, "utf8")), Wr = spec.items.filter((x) => x.t === "torn" || x.t === "scraps").sort((a, b) => a.at - b.at);
  const solo = spec.items.filter((x) => ["nameTag", "subscribe"].includes(x.t)).map((x) => [x.at, x.at + (x.dur ?? 3)]);
  // the writing band holds ONE thing at a time (portrait full mode): a card of a mention (picture, date, verse, hadith, news…) wins; writing that starts
  // inside a card moves just after it if its words are still being said, else it goes; writing never runs into the next card
  const CARD = new Set(["stamp", "peek", "tphoto", "pic", "date", "scholar", "news", "note", "verse", "flag", "clock", "rows", "hadith", "timeline", "rewrite", "pmap"]);   /* pmap: a full-frame map is a card too (2026-11-12, kitab 0:29) */
  const cards = spec.items.filter((x) => CARD.has(x.t)).map((x) => [x.at ?? x.from ?? x.times?.[0], x.until ?? x.to ?? (x.at ?? x.from) + 4]).filter(([a]) => a != null).concat(solo).sort((p, q) => p[0] - q[0]);
  const drop = new Set();
  for (const it of Wr) {
    const last = it.times ? it.times[it.times.length - 1] : it.at + 1.2;
    const c = cards.find(([a, b]) => it.at >= a - 0.05 && it.at < b);
    if (c) {
      // a card that has been up ≥ 1.6 s ends just before the phrase (each word stays at its own second); a younger card keeps the band and the phrase goes
      const cardItem = spec.items.find((x) => CARD.has(x.t) && (x.at ?? x.from) === c[0]);
      if (cardItem && it.at - 0.35 - c[0] >= 1.6 && !["verse", "hadith", "note"].includes(cardItem.t)) { const nu = +(it.at - 0.35).toFixed(2); if (cardItem.until !== undefined) cardItem.until = nu; else if (cardItem.to !== undefined) cardItem.to = nu; c[1] = nu; }
      else if (last + 0.4 > c[1] + 0.1 && it.t === "torn") { it.at = +(c[1] + 0.35).toFixed(2); }
      else drop.add(it);
    }
  }
  spec.items = spec.items.filter((x) => !drop.has(x));
  Wr.splice(0, Wr.length, ...Wr.filter((x) => !drop.has(x)));
  for (let i = 0; i < Wr.length; i++) {
    const it = Wr[i], last = it.times ? it.times[it.times.length - 1] : it.at + 1.2, next = Wr[i + 1]?.at ?? 1e9;
    const cardNext = Math.min(...cards.map(([a]) => a).filter((a) => a > it.at), 1e9);
    // the next writing or card always wins the band: a phrase stays to its last word + 1.5 s (user 2026-11-18, rules review w5/w15; was +0.25) only if nothing starts before that
    const cap = Math.min(next - GAP, cardNext - GAP, (spec.frames ?? 1e9) / 30 - 0.1);   // never past the video's end; ≥ 0.2 s between two writings of the band; coverage allows ≤ 1 s empty in the first minute (user 2026-11-18, rules review)
    it.until = +Math.min(cap, Math.max(last + HOLD, Math.min(cap, it.at + 7))).toFixed(2);
    if (it.until < it.at + 0.6) drop.add(it);   // no room before the next one: the phrase goes (never a span that ends before it starts)
    if (solo.some(([a, b]) => it.at < b && it.until > a)) { const [a, b] = solo.find(([a, b]) => it.at < b && it.until > a); if (it.at >= a) { it.at = +(b + 0.1).toFixed(2); if (it.times) it.times = it.times.map((t) => Math.max(t, it.at)); } }
  }
  spec.items = spec.items.filter((x) => !drop.has(x)); fs.writeFileSync(specF, JSON.stringify(spec, null, 1)); console.log(`writing_place --hold: ${Wr.length} كتابة، حُذف ${drop.size} قيلت كلها أثناء بطاقة`); process.exit(0);
}
if (WRITE) {
  const spec = JSON.parse(fs.readFileSync(specF, "utf8"));
  const before = spec.items.filter((x) => x.t === "torn" || x.t === "scraps").length;
  spec.items = [...spec.items.filter((x) => x.t !== "torn" && x.t !== "scraps"), ...items].sort((a, b) => (a.at ?? a.from ?? 0) - (b.at ?? b.from ?? 0));
  fs.writeFileSync(specF, JSON.stringify(spec, null, 1));
  console.log(`writing_place: حُذفت ${before} كتابة آلية ووُضعت ${items.length} مختارة`);
}
