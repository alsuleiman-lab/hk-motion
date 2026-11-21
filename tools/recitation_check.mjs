// RECITATION CHECK — every verse he RECITES, found in his own words (not only the verse cards of the spec), compared word by word with the Mushaf, and every
// difference heard a second time in the audio before it is reported (gta6 2026-11-21: at 3:51 of the cut he recited An-Nur 24:19 «لهم عذابٌ شديد في الدنيا
// والآخرة»; the Mushaf says «لهم عذابٌ أليم». verse_audit wrote it as two loose lines («زيادة: شديد»، «نقص: أليم») with «قد يكون من المفرّغ لا منك»; it was
// left to wait and the user found it himself in the Studio).
//   node tools/recitation_check.mjs <p> [--words F] [--audio F] [--no-audio] [--strict] [--json]
// Words : .tmp/<p>/cut_words.json (cut seconds). Audio: .tmp/<p>/cut_audio.wav (else cut16k.wav / cut.wav) — the SAME timeline as the words.
// Quran : data/quran/quran-uthmani.json (database, never memory). Shamela is not reachable from scripts; quran_ayah.mjs prints the same text.
// 1. find: every spoken run that shares three words (exact, or with one word between them changed) with an ayah is aligned with that whole ayah (local
//    alignment: a recitation of part of an ayah is fine); a run is a recitation when ≥ 4 words match exactly, ≥ 60 % of the ayah stretch matches and three
//    match in a row. Overlapping candidates (the same phrase in several ayat) keep the best alignment.
// 2. compare: inside the recited stretch every word is «same» (spelling only: hamza, vowel letters, taa marbuta), «near» (one letter), or different →
//    استبدال (he said another word), نقص (a Mushaf word not said), زيادة (a word said that is not there). A stutter (the same word twice) is not a زيادة.
// 3. hear again (the transcript is noisy): the recitation span is re-transcribed ON ITS OWN by tools/span_recheck.py (large-v3 float16, beam 8, no prompt) and
//    aligned with the same ayah. A difference both passes hear = «مؤكد بالصوت»; one the second pass does not hear = «استمع» (still a failing line: flag for the
//    agent to listen rather than pass silently). Only a one-letter / missing-word difference that the second pass hears exactly as the Mushaf (confidence ≥ 0.8)
//    is dropped as transcription noise.
// 4. report: one failing line per difference: time (cut m:ss and seconds), the sura:ayah, the spoken word against the Mushaf word, the audio verdict, and the
//    fix route — tools/recitation_fix.mjs (Chatterbox in his own voice, method 6 the user chose, critical-rules 17) with --at/--from/--to filled in.
//    .tmp/<p>/recitation_check.{json,md}; exit 1 with --strict on any open line. Settled by the user: spec "verseAccepted": [{ "title": "النور", "ref": "الآية 19" }].
// Run by tools/verse_audit.mjs (so stage cut/research, stage check and recitation_fix all get it). Limit: words, not vowel marks or elongation.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

process.chdir(path.resolve(import.meta.dirname, ".."));
const argv = process.argv.slice(2), p = argv.find((a) => !a.startsWith("--") && !/[\\/.]/.test(a));
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; }, has = (k) => argv.includes(`--${k}`);
if (!p) { console.error("usage: node tools/recitation_check.mjs <p> [--words F] [--audio F] [--no-audio] [--strict]"); process.exit(2); }
const T = path.join(".tmp", p), PY = process.env.PY ?? "S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe";
const rd = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const mm = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
const wordsF = opt("words", path.join(T, "cut_words.json"));
const W0 = rd(wordsF, null);
if (!W0) { console.log(`recitation_check: لا كلمات (${wordsF}) — لا فحص`); process.exit(0); }

// ── text ──
const norm = (w) => String(w).replace(/ٰ/g, "ا").replace(/[ً-ٰٟۖ-ۭـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[ؤئء]/g, "ا").replace(/[^ء-ي]/g, "");
const skel = (x) => x.replace(/[اويى]/g, "");
const lev = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
const eq = (v, s) => (v === s || (skel(v) === skel(s) && skel(v).length >= 2) ? "same" : Math.min(v.length, s.length) >= 3 && lev(v, s) <= 1 ? "near" : null);
const plainV = (w) => String(w).trim().replace(/آ/g, "آ").replace(/[ؐ-ًؚ-ٰٟۖ-ۭ]/g, "").replace(/ٱ/g, "ا").replace(/\s+/g, " ").trim();   // the Mushaf word without marks, for reading
const voc = (w) => String(w).replace(/[ۖ-ۭ]/g, "").replace(/ٱ/g, "ا").replace(/\s+/g, " ").trim();   // with its tashkeel (Quranic marks off), for recitation_fix --to
const suraName = (n) => plainV(n).replace(/^سوره\s*|^سورة\s*/, "").trim();

const db = rd("data/quran/quran-uthmani.json", null)?.data?.surahs;
if (!db) { console.log("✘ recitation_check: data/quran/quran-uthmani.json مفقود"); process.exit(1); }
const ayat = [];
for (const su of db) for (const ay of su.ayahs) {
  let text = ay.text; if (su.number !== 1 && ay.numberInSurah === 1) text = text.replace(/^بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\s*/, "");
  const orig = [], n = [];
  for (const t of text.replace(/[۞۩]/g, "").trim().split(/\s+/)) { const k = norm(t); if (k) { orig.push(t); n.push(k); } else if (orig.length) orig[orig.length - 1] += " " + t; }
  ayat.push({ s: su.number, a: ay.numberInSurah, name: suraName(su.name), orig, n });
}
// three-word keys with one gap allowed: (0,1,2) exact, (0,1,3) and (0,2,3) = one word between them changed
const PATS = [[0, 1, 2], [0, 1, 3], [0, 2, 3]];
const idx = PATS.map(() => new Map());
ayat.forEach((A, ai) => PATS.forEach((P, k) => { for (let i = 0; i + P[2] < A.n.length; i++) { const key = P.map((d) => A.n[i + d]).join(" "); const l = idx[k].get(key); if (l) l.push([ai, i]); else idx[k].set(key, [[ai, i]]); } }));

// ── spoken words (the transcript sometimes doubles a word: dropped) ──
const S = (Array.isArray(W0) ? W0 : W0.words).map((w) => ({ w: String(w.w), s: +w.s, e: +(w.e ?? +w.s + 0.3), n: norm(w.w) })).filter((x) => x.n)
  .filter((x, q, a) => !(q > 0 && a[q - 1].n === x.n && Math.abs(a[q - 1].s - x.s) < 0.3));

// local alignment of an ayah (or a stretch of it) with a run of spoken words
function align(V, Sp) {
  const m = V.length, n = Sp.length, H = Array.from({ length: m + 1 }, () => new Float64Array(n + 1)), P = Array.from({ length: m + 1 }, () => new Int8Array(n + 1));
  let best = [0, 0, 0];
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    const e = eq(V[i - 1], Sp[j - 1].n), o = [[0, 0], [H[i - 1][j - 1] + (e === "same" ? 2 : e === "near" ? 1 : -1), 3], [H[i - 1][j] - 1.2, 1], [H[i][j - 1] - 1.2, 2]];
    if (j >= 2 && eq(V[i - 1], Sp[j - 2].n + Sp[j - 1].n) === "same") o.push([H[i - 1][j - 2] + 2, 4]);   // one Mushaf word said as two (يَٰٓأَيُّهَا = «يا» + «أيها»)
    if (i >= 2 && eq(V[i - 2] + V[i - 1], Sp[j - 1].n) === "same") o.push([H[i - 2][j - 1] + 2, 5]);   // two Mushaf words heard as one
    const b = o.reduce((x, y) => (y[0] > x[0] ? y : x)); H[i][j] = b[0]; P[i][j] = b[1];
    if (b[0] > best[0]) best = [b[0], i, j];
  }
  let [score, i, j] = best; const ops = [];
  while (i > 0 && j > 0 && H[i][j] > 0) {
    const k = P[i][j];
    if (k === 3) { ops.push({ k: eq(V[i - 1], Sp[j - 1].n) ? "m" : "sub", q: i - 1, j: j - 1, e: eq(V[i - 1], Sp[j - 1].n) }); i--; j--; }
    else if (k === 4) { ops.push({ k: "m", q: i - 1, j: j - 2, j2: j - 1, e: "same" }); i--; j -= 2; }
    else if (k === 5) { ops.push({ k: "m", q: i - 2, q2: i - 1, j: j - 1, e: "same" }); i -= 2; j--; }
    else if (k === 1) { ops.push({ k: "del", q: i - 1, j }); i--; }
    else { ops.push({ k: "ins", q: i, j: j - 1 }); j--; }
  }
  return { score, ops: ops.reverse() };
}

// ── 1. find the recitations ──
const cands = new Map();   // `${ai}:${diag band}` → anchor
for (let i = 0; i + 3 < S.length + 1; i++) PATS.forEach((P, k) => {
  if (i + P[2] >= S.length) return;
  const hits = idx[k].get(P.map((d) => S[i + d].n).join(" ")); if (!hits || hits.length > 400) return;   // a phrase in 400+ places is not a recitation anchor
  for (const [ai, wi] of hits) { const key = `${ai}:${Math.round((wi - i) / 4)}:${Math.floor(i / 40)}`; if (!cands.has(key)) cands.set(key, { ai, i, wi }); }
});
const found = [];
for (const { ai, i, wi } of cands.values()) {
  const A = ayat[ai], j0 = Math.max(0, i - wi - 3), j1 = Math.min(S.length, i + (A.n.length - wi) + 5);
  const Sp = S.slice(j0, j1), { score, ops } = align(A.n, Sp);
  const ms = ops.filter((o) => o.k === "m"), same = ms.filter((o) => o.e === "same").length;
  if (!ms.length) continue;
  const q0 = Math.min(...ops.filter((o) => o.k !== "ins").map((o) => o.q)), q1 = Math.max(...ops.filter((o) => o.k !== "ins").map((o) => o.q2 ?? o.q));
  let run = 0, maxRun = 0; for (const o of ops) { if (o.k === "m" && o.e === "same") maxRun = Math.max(maxRun, ++run); else run = 0; }
  if (same < 4 || ms.length / (q1 - q0 + 1) < 0.6 || maxRun < 3) continue;
  const js = ops.filter((o) => o.k !== "del").map((o) => j0 + (o.j2 ?? o.j));
  found.push({ ai, score, ops: ops.map((o) => ({ ...o, j: o.j + j0, ...(o.j2 != null ? { j2: o.j2 + j0 } : {}) })), q0, q1, sj0: Math.min(...js), sj1: Math.max(...js), same });
}
found.sort((a, b) => b.score - a.score || (a.q1 - a.q0) - (b.q1 - b.q0));
const kept = [];
for (const f of found) {
  const ov = kept.some((k) => Math.min(k.sj1, f.sj1) - Math.max(k.sj0, f.sj0) + 1 > 0.5 * (f.sj1 - f.sj0 + 1));
  if (!ov) kept.push(f);
}
kept.sort((a, b) => a.sj0 - b.sj0);

// ── 2. the differences ──
const recs = kept.map((f) => {
  const A = ayat[f.ai], iss = [];
  const ops = f.ops;
  // three or more spoken words in a row that are not in the ayah = his explanation between two parts of the verse (debate-r1 62:5: «لم يأخذوها على حقها
  // ولم يحملوها»), not a misrecitation: not reported, the verse continues after it
  for (let k = 0; k < ops.length; ) { let e = k; while (e < ops.length && ops[e].k === "ins") e++; if (e - k >= 3) for (let q = k; q < e; q++) ops[q].used = true; k = e > k ? e : k + 1; }
  for (let k = 0; k < ops.length; k++) {
    const o = ops[k];
    if (o.k === "sub") iss.push({ k: "sub", q: o.q, j: o.j });
    else if (o.k === "m" && o.e === "near") iss.push({ k: "near", q: o.q, j: o.j });
    else if (o.k === "del") {   // a missing word next to an extra one = he said another word there
      const nb = ops[k + 1]?.k === "ins" && !ops[k + 1].used ? k + 1 : ops[k - 1]?.k === "ins" && !ops[k - 1].used ? k - 1 : -1;
      if (nb >= 0) { ops[nb].used = true; iss.push({ k: "sub", q: o.q, j: ops[nb].j }); } else iss.push({ k: "del", q: o.q, j: o.j });
    } else if (o.k === "ins" && !o.used) {
      if (ops[k + 1]?.k === "del") continue;   // handled by the del
      const w = S[o.j].n; if (S[o.j - 1]?.n === w || S[o.j + 1]?.n === w) continue;   // a stutter, not an added word
      iss.push({ k: "ins", q: o.q, j: o.j });
    }
  }
  return { f, A, iss: iss.sort((a, b) => a.j - b.j || a.q - b.q) };
});

// ── 3. hear again ──
const audioF = opt("audio", [path.join(T, "cut_audio.wav"), path.join(T, "cut16k.wav"), path.join(T, "cut.wav")].find((f) => fs.existsSync(f)));
const need = recs.filter((r) => r.iss.length);
let heard = new Map(), audioNote = "";
if (need.length && !has("no-audio") && audioF && fs.existsSync(audioF)) {
  const st = fs.statSync(audioF), sig = `${path.resolve(audioF)}|${st.size}|${Math.round(st.mtimeMs)}`;
  const spans = need.map((r) => ({ id: `${r.A.s}:${r.A.a}@${S[r.f.sj0].s.toFixed(2)}`, s: +(S[r.f.sj0].s - 0.6).toFixed(2), e: +(S[r.f.sj1].e + 0.6).toFixed(2) }));
  const cacheF = path.join(T, "recitation_recheck.json"), cache = rd(cacheF, {});
  const todo = spans.filter((x) => cache[`${sig}|${x.id}|${x.s}|${x.e}`] == null);
  if (todo.length) {
    fs.mkdirSync(T, { recursive: true });
    const inF = path.join(T, "recitation_recheck_in.json"), outF = path.join(T, "recitation_recheck_out.json");
    fs.writeFileSync(inF, JSON.stringify(todo));
    const r = spawnSync(PY, ["-I", "tools/span_recheck.py", audioF, inF, outF], { encoding: "utf8", windowsHide: true, env: { ...process.env, PYTHONIOENCODING: "utf-8" }, timeout: 300000 });
    const res = r.status === 0 ? rd(outF, []) : [];
    if (r.status !== 0) audioNote = `تعذّر سماع الصوت ثانيةً (${(r.stderr || r.stdout || "").trim().split("\n").pop()?.slice(0, 120)})`;
    for (const x of res) { const sp = todo.find((y) => y.id === x.id); if (sp) cache[`${sig}|${sp.id}|${sp.s}|${sp.e}`] = x.words; }
    fs.writeFileSync(cacheF, JSON.stringify(cache));
    for (const f of [inF, outF]) fs.rmSync(f, { force: true });
  }
  for (const [k, r] of need.entries()) { const x = spans[k], w = cache[`${sig}|${x.id}|${x.s}|${x.e}`]; if (w) heard.set(r, w); }
} else if (need.length) audioNote = has("no-audio") ? "بلا سماع ثانٍ (--no-audio)" : "لا ملف صوت للقص — بلا سماع ثانٍ";

const verdict = (r, is) => {
  const H = heard.get(r); if (!H) return { v: "listen", why: audioNote || "لم يُسمع ثانيةً" };
  const R = H.map((w) => ({ w: w.w, s: w.s, e: w.e, p: w.p, n: norm(w.w) })).filter((x) => x.n);
  const V = r.A.n.slice(r.f.q0, r.f.q1 + 1), { ops } = align(V, R);
  const at = (q) => ops.find((o) => o.k !== "ins" && o.k !== "del" && (o.q === q - r.f.q0 || o.q2 === q - r.f.q0));
  const o = at(is.q), rw = o ? R[o.j2 ?? o.j] : null, mw = r.A.n[is.q] ?? "";
  if (is.k === "sub" || is.k === "near") {
    if (rw && eq(mw, rw.n) === "same") return is.k === "near" && rw.p >= 0.8 ? { v: "drop" } : { v: "listen", why: `السماع الثاني سمع «${rw.w}» كما في المصحف (ثقة ${rw.p})` };
    if (rw) return { v: "confirmed", why: `السماع الثاني سمع «${rw.w}» أيضاً (ثقة ${rw.p})` };
    const sp = S[is.j], alt = R.find((x) => x.s < sp.e + 0.5 && x.e > sp.s - 0.5 && eq(sp.n, x.n));
    return alt ? { v: "confirmed", why: `السماع الثاني سمع «${alt.w}» أيضاً (ثقة ${alt.p})` } : { v: "listen", why: "السماع الثاني لم يحسم الكلمة" };
  }
  if (is.k === "del") return rw && eq(mw, rw.n) && rw.p >= 0.8 ? { v: "drop" } : rw && eq(mw, rw.n) ? { v: "listen", why: `السماع الثاني سمعها «${rw.w}» (ثقة ${rw.p})` } : { v: "confirmed", why: "السماع الثاني لم يسمعها أيضاً" };
  const sp = S[is.j], alt = R.find((x) => x.s < sp.e + 0.4 && x.e > sp.s - 0.4 && eq(sp.n, x.n));
  return alt ? { v: "confirmed", why: `السماع الثاني سمع «${alt.w}» أيضاً (ثقة ${alt.p})` } : { v: "listen", why: "السماع الثاني لم يسمعها" };
};

// ── 4. report ──
const spec = rd(path.join("data", "specs", `${p}.json`), null), acc = spec?.verseAccepted ?? [];
const plain = (x) => plainV(x).replace(/ة/g, "ه").replace(/[أإآ]/g, "ا");
const accepted = (A) => acc.some((a) => plain(A.name).includes(plain(a.title ?? "")) && new RegExp(`(^|\\D)${A.a}(\\D|$)`).test(String(a.ref ?? "")));
const lines = [], out = [];
const route = (r, is) => {
  // the words around the slip, as said (recitation_fix finds them in cut_words near --at) and as in the Mushaf (with tashkeel)
  const A = r.A, ops = r.f.ops, oPrev = [...ops].reverse().find((o) => o.k === "m" && (o.j2 ?? o.j) < is.j && o.q < is.q);
  const oNext = ops.find((o) => o.k === "m" && (is.k === "del" ? o.j >= is.j : o.j > is.j) && o.q > is.q);
  const sp = (o) => (o ? (o.j2 != null ? [S[o.j].w, S[o.j2].w] : [S[o.j].w]) : []), mv = (o) => (o ? (o.q2 != null ? [A.orig[o.q], A.orig[o.q2]] : [A.orig[o.q]]) : []);
  const fromW = [...sp(oPrev), ...(is.k === "del" ? [] : [S[is.j].w]), ...(is.k === "del" || !oPrev ? sp(oNext) : [])];
  const toW = [...mv(oPrev), ...(is.k === "ins" ? [] : [A.orig[is.q]]), ...(is.k === "del" || !oPrev ? mv(oNext) : [])];
  const at0 = oPrev ? S[oPrev.j].s : is.k === "del" ? S[oNext?.j ?? r.f.sj0].s : S[is.j].s;
  return `node tools/recitation_fix.mjs ${p} --at ${at0.toFixed(2)} --from "${fromW.join(" ")}" --to "${voc(toW.join(" "))}"`;
};
let open = 0;
for (const r of recs) {
  const A = r.A, t0 = S[r.f.sj0].s, head = `${A.name} ${A.s}:${A.a} عند ${mm(t0)} (${t0.toFixed(1)}ث) — ${r.f.q1 - r.f.q0 + 1} كلمة من الآية، ${r.f.same} مطابقة`;
  const items = r.iss.map((is) => ({ ...is, ...verdict(r, is) })).filter((x) => x.v !== "drop");
  const isAcc = items.length && accepted(A);
  out.push({ sura: A.s, aya: A.a, name: A.name, at: +t0.toFixed(2), words: [r.f.q0, r.f.q1], accepted: !!isAcc, issues: items.map((x) => ({ kind: x.k, at: +S[x.j]?.s.toFixed(2), said: x.k === "del" ? null : S[x.j].w, mushaf: x.k === "ins" ? null : plainV(A.orig[x.q]), audio: x.v, why: x.why, fix: route(r, x) })) });
  if (!items.length) { lines.push(`✔ ${head}`); continue; }
  if (isAcc) { lines.push(`☑ ${head} — حسمها المستخدم (verseAccepted)`); continue; }
  for (const x of items) {
    open++;
    const t = S[x.j]?.s ?? t0, what = x.k === "del" ? `نقص: لم يقل «${plainV(A.orig[x.q])}» (في المصحف)` : x.k === "ins" ? `زيادة: قال «${S[x.j].w}» وليست في الآية` : `استبدال: قال «${S[x.j].w}» والمصحف «${plainV(A.orig[x.q])}»`;
    lines.push(`✘ ${mm(t)} (${t.toFixed(2)}ث) ${A.name} ${A.s}:${A.a} — ${what} · الصوت: ${x.v === "confirmed" ? "مؤكد" : "استمع"} (${x.why})`);
    lines.push(`    - الإصلاح بصوته (الطريقة السادسة): ${route(r, x)}`);
  }
}
const rep = `# فحص التلاوة بالمصحف — ${p}\n\n${lines.join("\n") || "لا تلاوة في الكلام"}\n\n${open ? `⚠ ${open} موضع في التلاوة يخالف المصحف: يُعرض على الشيخ بوضوح قبل أي رندر، ويُصلح بصوته (recitation_fix) أو يحسمه هو.` : `✔ recitation_check: ${recs.length} تلاوة، كلها كما في المصحف (بالتفريغ${heard.size ? " والسماع الثاني" : ""})`}\nحدّ الفحص: الكلمات لا التشكيل ولا المدّ.\n`;
fs.mkdirSync(T, { recursive: true });
fs.writeFileSync(path.join(T, "recitation_check.md"), rep);
fs.writeFileSync(path.join(T, "recitation_check.json"), JSON.stringify({ words: wordsF, audio: audioF ?? null, recitations: out }, null, 1));
console.log(has("json") ? JSON.stringify(out, null, 1) : rep);
if (open && has("strict")) process.exit(1);
