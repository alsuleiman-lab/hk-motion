// Every hadith he narrates → a note card from its first word (rules §8.3; user 2026-11-16 «أداة الحديث»).
//   node tools/hadith_scan.mjs <p>            find the narrations in .tmp/<p>/cut_words.json → .tmp/<p>/hadith.json (verified:false) + a list to verify
//   node tools/hadith_scan.mjs <p> --write    add a `note` for every entry I verified (verified:true + text + book + n), from its first spoken word
// The cue is often the END of a narration («فقال رسول الله…» after «جاء رجل…»): while verifying I set `at` to its first spoken word and `until` to its last.
// Verification is mine, in the Shamela connector (shamela_search_hadith / shamela_verify_quote), never from memory: I fill text (the wording of the book),
// book, n (its number) and narrator, set verified:true, then --write. An entry that is not a hadith (he only mentions the Prophet ﷺ) → skip:true.
import fs from "node:fs";
import path from "node:path";

const [p, ...rest] = process.argv.slice(2);
if (!p) { console.error("usage: node tools/hadith_scan.mjs <p> [--write]"); process.exit(2); }
const T = path.join(".tmp", p), F = path.join(T, "hadith.json");
const read = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const r2 = (x) => Math.round(x * 100) / 100;

if (!rest.includes("--write")) {
  const words = read(path.join(T, "cut_words.json"), null);
  if (!words) { console.error(`✘ ${T}/cut_words.json missing — run stage cut first`); process.exit(2); }
  const norm = (s) => String(s).replace(/[ً-ْـ]/g, "").replace(/[إأآا]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[^\p{L} ]/gu, "").trim();
  const nw = words.map((w) => norm(w.w));
  // cues that open a narration
  const CUES = [["قال", "رسول", "الله"], ["قال", "النبي"], ["يقول", "رسول", "الله"], ["يقول", "النبي"], ["عن", "النبي"], ["عن", "رسول", "الله"], ["ان", "النبي"], ["ان", "رسول", "الله"], ["في", "الحديث"], ["في", "الصحيح"], ["ثبت", "عن", "النبي"], ["قال", "عليه", "الصلاه"], ["جاء", "رجل"], ["اتى", "رجل"], ["سال", "رجل"], ["جاء", "اعرابي"], ["عن", "ابي", "هريره"], ["عن", "ابن", "عمر"], ["عن", "ابن", "عباس"], ["عن", "عايشه"], ["عن", "انس"], ["روى", "البخاري"], ["روى", "مسلم"]];
  const strip = (w) => w.replace(/^(و|ف)/, "");
  const old = read(F, []), found = [];
  for (let i = 0; i < nw.length; i++) {
    const cue = CUES.find((c) => c.every((x, k) => strip(nw[i + k] ?? "") === x || nw[i + k] === x));
    if (!cue) continue;
    if (found.length && words[i].s < found.at(-1).until) continue;   // inside the previous narration
    // the narration runs until a pause > 1.2 s, «رواه …» + book, or 15 s (I correct `until` while verifying)
    let j = i + cue.length;
    while (j < words.length - 1 && words[j + 1].s - words[j].e < 1.2 && words[j].s - words[i].s < 15) { if (nw[j] === "رواه" || nw[j] === "اخرجه") { j = Math.min(words.length - 1, j + 2); break; } j++; }
    const at = r2(words[i].s), until = r2(words[j].e ?? words[j].s + 0.5);
    const prev = old.find((o) => Math.abs(o.at - at) < 1);   // keep what I already verified
    found.push(prev ?? { at, until, spoken: words.slice(i, j + 1).map((w) => w.w).join(" "), verified: false, text: null, book: null, n: null, narrator: null });
  }
  fs.writeFileSync(F, JSON.stringify(found, null, 1));
  const todo = found.filter((h) => !h.verified && !h.skip);
  console.log(`hadith: ${found.length} narration(s) → ${F}; ${todo.length} to verify in Shamela (fill text, book, n, narrator, verified:true; or skip:true), then --write`);
  for (const h of todo) console.log(`  ${Math.floor(h.at / 60)}:${String(Math.floor(h.at % 60)).padStart(2, "0")}  ${h.spoken}`);
  process.exit(0);
}

const specF = path.join("data", "specs", `${p}.json`), spec = read(specF, null);
if (!spec) { console.error(`✘ ${specF} missing`); process.exit(2); }
const list = read(F, []), open = list.filter((h) => !h.verified && !h.skip);
if (open.length) { console.log(`✘ ${open.length} narration(s) not verified yet in ${F} — verify in Shamela first`); process.exit(1); }
let added = 0;
for (const h of list.filter((x) => x.verified && !x.skip)) {
  if (!h.text || !h.book || !h.n) { console.log(`✘ ${h.at}s: text/book/n missing`); process.exit(1); }
  if ((spec.items ?? []).some((it) => (it.t === "note" || it.t === "hadith") && Math.abs((it.at ?? it.times?.[0] ?? 0) - h.at) < 2)) continue;
  /* (أمر المستخدم 2026-11-19) حديث طويل لا يُقرأ في بطاقة صغيرة على الجوال ← ملء الشاشة سطراً سطراً (ReelVerseFull يُنزل السطر الأعلى حين يظهر الأسفل):
     كلمات المتن بتوقيت نطقها (مطابقة تقريبية مع كلمات القص) */
  const strip = (s) => String(s).replace(/[ً-ٰٟۖ-ۭ]/g, "");
  if ([...strip(h.text)].length > 110) {
    const nm = (s) => strip(s).replace(/[إأآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[^ء-ي]/g, "");
    const lev = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
    const cwF = path.join(".tmp", p, "cut_words.json"), cw0 = read(cwF, []), cwAll = (cw0.words ?? cw0).map((w) => ({ w: w.w ?? w.word, s: +(w.s ?? w.start) }));
    const sp = cwAll.filter((w) => w.s >= h.at - 0.3 && w.s <= h.until + 0.1);
    const mw = h.text.split(/\s+/).map((w) => w.replace(/[«»"“”.،:؛]/g, "")).filter((w) => nm(w));
    const at = new Array(mw.length).fill(null); let ptr = 0;
    mw.forEach((w, i) => { const a = nm(w); for (let j = ptr; j < Math.min(sp.length, ptr + 5); j++) { const b = nm(sp[j].w); if (a === b || (a.length >= 4 && lev(a, b) <= 1)) { at[i] = sp[j].s; ptr = j + 1; break; } } });
    for (let i = 0; i < at.length; i++) if (at[i] == null) { let a = i - 1; while (a >= 0 && at[a] == null) a--; let b = i + 1; while (b < at.length && at[b] == null) b++; const t0 = a >= 0 ? at[a] : sp[0]?.s ?? h.at, t1 = b < at.length ? at[b] : h.until; at[i] = a >= 0 || b < at.length ? t0 + ((t1 - t0) * (i - a)) / (b - a) : t0; }
    for (let i = 1; i < at.length; i++) if (at[i] < at[i - 1]) at[i] = at[i - 1] + 0.05;
    spec.items.push({ t: "hadith", at: r2(at[0] - 0.05), words: mw, times: at.map(r2), source: `${h.book} (${h.n})`, until: r2(h.until + 1.5), auto: "hadith_scan" });
    added++; continue;
  }
  // the card types at ~14 chars/s: it stays ≥ 1 s after the typing ends and ≥ 1.5 s after he finishes (rules §8.3, §9.5)
  /* (2026-11-19, mufti-hiraba) +1 here, but writing_sync requires 1.5 s after the typing ends: every card failed by a few tenths. +1.6 now. */
  const until = r2(Math.max(h.until + 1.5, h.at + h.text.length / 14 + 1.6));
  spec.items.push({ t: "note", at: r2(h.at - 0.05), until, label: "حديث شريف", tag: `${h.book} (${h.n})`, title: h.text, ...(h.narrator ? { narrator: h.narrator } : {}), books: [{ book: h.book, n: h.n }], auto: "hadith_scan" });
  added++;
}
spec.items.sort((a, b) => (a.at ?? a.from) - (b.at ?? b.from));
fs.writeFileSync(specF, JSON.stringify(spec, null, 1));
console.log(`✔ ${added} hadith card(s) added to ${specF}`);
