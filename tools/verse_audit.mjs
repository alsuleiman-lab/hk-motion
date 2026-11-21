// Verse-reading audit (user order 2026-11-09): every verse card is compared with what he actually SAID in its time window.
//   node tools/verse_audit.mjs data/specs/<p>.json [--words .tmp/<p>/cut_words.json] [--strict]
// For each `verse` item (all of them: inside the talk or full screen) the Quran words on the card (text from data/quran) are aligned with the transcript words
// spoken around the card's times; it reports, in plain Arabic, WHERE (mm:ss), WHICH verse, and WHAT: a word he skipped, a word he added to the verse, a word read differently.
// It writes .tmp/<p>/verse_audit.md and prints the report; exit 1 with --strict when anything is found (stage.mjs check prints it; the report goes to the user BEFORE any render so he can re-record).
// Limit (always say it): the check is by transcript (Whisper large-v3) — it catches omitted / added / replaced words, not a wrong vowel mark or elongation.
import fs from "node:fs"; import path from "node:path"; import { spawnSync } from "node:child_process";
const argv = process.argv.slice(2), opt = (n, d) => (argv.includes("--" + n) ? argv[argv.indexOf("--" + n) + 1] : d);
const specF = argv.find((a) => a.endsWith(".json") && !a.includes("words"));
if (!specF) { console.error("usage: node tools/verse_audit.mjs data/specs/<p>.json [--words …] [--strict]"); process.exit(2); }
const spec = JSON.parse(fs.readFileSync(specF, "utf8"));
const wordsF = opt("words", path.join(".tmp", spec.id, "cut_words.json"));
const W0 = JSON.parse(fs.readFileSync(wordsF, "utf8")), W = Array.isArray(W0) ? W0 : W0.words;
const norm = (s) => s.replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ‌‍]/g, "").replace(/[ٱأإآ]/g, "ا").replace(/ء/g, "").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[^ء-ي]/g, "");
const lev = (a, b) => { const m = a.length, n = b.length; const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]); for (let j = 1; j <= n; j++) d[0][j] = j; for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[m][n]; };
const mm = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
const skel = (x) => x.replace(/[اويى]/g, "");   // Uthmani spelling vs the transcript's spelling differs only in the vowel letters (الحيوة/الحياة، متع/متاع): equal
const sub = (a, b) => { if (a === b) return 0; if (skel(a) === skel(b) && skel(a).length >= 2) return 0.1; const l = lev(a, b); return l <= Math.max(1, Math.floor(Math.min(a.length, b.length) / 3)) ? 0.4 + 0.2 * l : 2; };   // 2 = never a substitution (cheaper as delete + insert)
const out = [], lines = [];
for (const it of spec.items.filter((i) => i.t === "verse")) {
  const ts = it.times ?? [it.at], t0 = ts[0], t1 = Math.max(ts[ts.length - 1] + 0.9, it.until ?? 0);
  const V = it.words.map((w) => ({ w, n: norm(w) })).filter((x) => x.n.length > 0);
  const S = W.filter((w) => w.s >= t0 - 0.35 && w.s <= t1 - 0.2).map((w) => ({ w: w.w, n: norm(w.w), s: w.s })).filter((x) => x.n.length > 0).filter((x, q, a) => !(q > 0 && a[q - 1].n === x.n && Math.abs(a[q - 1].s - x.s) < 0.3));   // the transcript sometimes doubles a word
  // global alignment (verse words vs spoken words)
  const m = V.length, n = S.length, INF = 1e9, D = Array.from({ length: m + 1 }, () => Array(n + 1).fill(INF)), P = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  D[0][0] = 0; for (let j = 1; j <= n; j++) { D[0][j] = 0; P[0][j] = 2; }   // spoken words BEFORE the verse starts are free (talk around it)
  for (let i = 1; i <= m; i++) D[i][0] = i * 1, P[i][0] = 1;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    const c = sub(V[i - 1].n, S[j - 1].n), opts = [[D[i - 1][j - 1] + (c >= 2 ? INF : c), 3], [D[i - 1][j] + 1, 1], [D[i][j - 1] + (i === m ? 0 : 1), 2]];   // spoken words AFTER the last verse word are free
    if (j >= 2) { const c2 = sub(V[i - 1].n, S[j - 2].n + S[j - 1].n); if (c2 < 0.5) opts.unshift([D[i - 1][j - 2] + c2, 4]); }   // one Mushaf word written as two spoken words (يَٰٓأُو۟لِى = «يا» + «أولي»): a clean join beats a skip + insertion (2026-11-14: «فاعتبروا» was reported missing)
    const b = opts.reduce((x, y) => (y[0] < x[0] ? y : x)); D[i][j] = b[0]; P[i][j] = b[1];
  }
  let i = m, j = n; const ops = [];
  while (i > 0 || j > 0) { const p = P[i][j]; if (i > 0 && j > 1 && p === 4) { ops.push({ k: "m", v: V[i - 1], s: { ...S[j - 2], n: S[j - 2].n + S[j - 1].n, w: S[j - 2].w + " " + S[j - 1].w } }); i--; j -= 2; } else if (i > 0 && j > 0 && p === 3) { ops.push({ k: "m", v: V[i - 1], s: S[j - 1] }); i--; j--; } else if (i > 0 && (p === 1 || j === 0)) { ops.push({ k: "del", v: V[i - 1] }); i--; } else { ops.push({ k: "ins", s: S[j - 1] }); j--; } }
  ops.reverse();
  // trim insertions before the first / after the last matched verse word (not part of the recitation)
  const firstM = ops.findIndex((o) => o.k === "m"), lastM = ops.map((o) => o.k).lastIndexOf("m");
  const core = firstM < 0 ? ops.filter((o) => o.k === "del") : ops.filter((o, q) => q >= Math.min(firstM, ops.findIndex((x) => x.k === "del") < 0 ? firstM : ops.findIndex((x) => x.k === "del")) && q <= Math.max(lastM, ops.map((x) => x.k).lastIndexOf("del")));
  const issues = [];
  for (const [q, o] of core.entries()) {
    /* a missing word next to an extra one = ONE word said instead of another (gta6 2026-11-21: «زيادة: شديد» + «نقص: أليم» were read as noise and left) */
    const pair = o.k === "del" ? (core[q + 1]?.k === "ins" ? core[q + 1] : core[q - 1]?.k === "ins" && !core[q - 1].paired ? core[q - 1] : null) : null;
    if (pair) { pair.paired = true; issues.push(`استبدال: قلتَ «${pair.s.w}» عند ${mm(pair.s.s)} والمصحف «${o.v.w.replace(/[ؐ-ًؚ-ٰٟۖ-ۭ]/g, "").replace(/ٱ/g, "ا").trim()}» — الإصلاح بصوته: node tools/recitation_fix.mjs ${spec.id} --at ${pair.s.s.toFixed(2)} --from "${pair.s.w}" --to "${o.v.w.replace(/[ۖ-ۭ]/g, "").replace(/ٱ/g, "ا").trim()}"`); continue; }
    if (o.paired) continue;
    if (o.k === "del") issues.push(`نقص: لم تُسمَع كلمة «${o.v.w.replace(/[ؐ-ًؚ-ٰٟۖ-ۭ]/g, "")}» (موجودة في الآية)`);
    else if (o.k === "ins" && core[q + 1]?.k === "del") continue;   // paired by the del after it
    else if (o.k === "ins") issues.push(`زيادة: قلتَ «${o.s.w}» عند ${mm(o.s.s)} وليست في هذا الموضع من الآية`);
    else if (o.k === "m" && skel(o.v.n) !== skel(o.s.n)) issues.push(`اختلاف: قلتَ «${o.s.w}» والآية «${o.v.w.replace(/[ؐ-ًؚ-ٰٟۖ-ۭ]/g, "")}» (قد يكون من المفرّغ لا منك: استمع)`);
  }
  const head = `${it.title ?? ""} ${it.refText ?? ""} — عند ${mm(t0)} (${t0.toFixed(1)}ث)${it.full ? " [ملء الشاشة]" : ""}`;
  out.push({ head, issues }); lines.push(issues.length ? `✘ ${head}\n${issues.map((x) => "    - " + x).join("\n")}` : `✔ ${head}`);
}
// the user's answer on the questions page settles a verse: spec "verseAccepted": [{ "ref": "الآية 6", "title": "البقرة", "answer": "…" }] (he heard it and chose: card = the Mushaf text, audio as it is)
const acc = spec.verseAccepted ?? [];
const plain = (x) => String(x).replace(/[ؐ-ًؚ-ٰٟۖ-ۭ]/g, "");
for (const o of out) if (o.issues.length && acc.some((a) => plain(o.head).includes(plain(a.title)) && plain(o.head).includes(plain(a.ref)))) { o.accepted = true; }
const bad = out.filter((o) => o.issues.length && !o.accepted);
if (out.some((o) => o.accepted)) lines.push("", ...out.filter((o) => o.accepted).map((o) => `☑ حسمها المستخدم: ${o.head}`));
const rep = `# تدقيق قراءة الآيات — ${spec.id}\n\n${lines.join("\n")}\n\n${bad.length ? `⚠ ${bad.length} آية فيها فروق بين قراءتك ونص الآية: أصلحها أو أكّد أنها صحيحة قبل الرندر.` : "✔ لا فروق: كل آية مقروءة كما في المصحف (حسب التفريغ)."}\n\nحدّ الفحص: يعتمد على التفريغ الآلي؛ يكشف نقص كلمة أو زيادتها أو استبدالها، ولا يكشف خطأ التشكيل أو المدّ.\n`;
fs.mkdirSync(path.join(".tmp", spec.id), { recursive: true }); fs.writeFileSync(path.join(".tmp", spec.id, "verse_audit.md"), rep);
console.log(rep);
/* RECITATION CHECK (2026-11-21, gta6 «عذاب شديد» for «عذاب أليم», found by the user in the Studio): every verse he recites, found in his own words and not only
   on the cards, word by word against the Mushaf, each difference heard a second time in the audio, with the fix route — tools/recitation_check.mjs */
let rc = 0;
if (!argv.includes("--no-recitation") && fs.existsSync(wordsF)) {
  const r = spawnSync(process.execPath, [path.join(import.meta.dirname, "recitation_check.mjs"), spec.id, "--words", path.resolve(wordsF), ...(opt("audio") ? ["--audio", path.resolve(opt("audio"))] : []), "--strict"], { encoding: "utf8", windowsHide: true, maxBuffer: 1 << 24 });
  process.stdout.write(r.stdout || r.stderr || ""); rc = r.status === 1 ? 1 : 0;
}
if ((bad.length || rc) && argv.includes("--strict")) process.exit(1);
