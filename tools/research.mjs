// PARALLEL RESEARCH right after the cut (user order 2026-11-10: «تشغّل أكثر من سكريبت بنفس الوقت: الدول، الآيات، أخطاء الآيات، الأحاديث، أسماء الشخصيات»).
//   node tools/research.mjs <project>            (after `stage.mjs cut`; reads .tmp/<p>/cut_words.json)
// All workers start together; each writes .tmp/<p>/research/<name>.json, and the summary goes to .tmp/<p>/research/research.md.
//   verses    : verse_scan (if not done) → verse_audit on the found verses (omitted / added / changed words) — BEFORE any build or render
//   mentions  : every country / place / book / sect / institution of data/mention_lexicon.json, all its times
//   people    : named people (الشيخ/الإمام/الدكتور/ابن/أبو … + the lexicon's «أشخاص») with context — to fetch a real photo for each
//   hadith    : every narration he recites (قال رسول الله / النبي ﷺ / في الحديث …) with its words — verified in Shamela by Claude
//   numbers   : years, numbers and dates (a news item or number needs a picture or link on screen)
// Every finding that needs the user goes to the questions page (tools/questions.mjs) with a playable clip of the moment, while the work goes on.
import fs from "node:fs"; import path from "node:path"; import { spawn } from "node:child_process";
import { addQuestion } from "./questions.mjs";

const p = process.argv[2];
if (!p) { console.error("usage: node tools/research.mjs <project>"); process.exit(2); }
const root = path.resolve(import.meta.dirname, ".."); process.chdir(root);
const T = path.join(".tmp", p), R = path.join(T, "research"); fs.mkdirSync(R, { recursive: true });
const read = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const W = read(path.join(T, "cut_words.json"), null);
if (!W) { console.error(`✘ ${T}/cut_words.json missing — run tools/stage.mjs cut ${p} first`); process.exit(1); }
(await import("./cut_lazy.mjs")).ensureCut(p);   // the cut video matches the cut list (tools/cut_lazy.mjs)
const cutVideo = ["_cut_s.mp4", "_cut.mp4"].map((s) => `public/${p}${s}`).find((f) => fs.existsSync(f)) ?? null;
const mm = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const norm = (s) => String(s).replace(/[ً-ْٰـ]/g, "").replace(/[إأآٱا]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[^\p{L}\p{N} ]/gu, " ").replace(/\s+/g, " ").trim();
const bare = (w) => w.replace(/^(و|ف)?(ب|ل|ك)?(ال)?/, "");
const N = W.map((w) => ({ ...w, n: norm(w.w) }));
const ctx = (i, before = 6, after = 14) => N.slice(Math.max(0, i - before), i + after).map((w) => w.w).join(" ");
const clip = (t) => (cutVideo ? { src: cutVideo, t0: Math.max(0, t - 2), t1: t + 8 } : undefined);
const save = (name, data) => { fs.writeFileSync(path.join(R, `${name}.json`), JSON.stringify(data, null, 1)); return data; };
const run = (cmd, args) => new Promise((res) => { const c = spawn(cmd, args, { windowsHide: true }); let out = ""; c.stdout.on("data", (d) => (out += d)); c.stderr.on("data", (d) => (out += d)); c.on("close", (code) => res({ code, out })); });
const T0 = Date.now();

// ── workers ──────────────────────────────────────────────────────────────────────────────────────────────
const verses = async () => {
  if (!fs.existsSync(path.join(T, "verses.json"))) await run("node", ["tools/verse_scan.mjs", p]);
  const vs = read(path.join(T, "verses.json"), []).filter((v) => v.inCut !== false && v.cut?.length);
  const tmpSpec = path.join(R, "verses_spec.json");
  fs.writeFileSync(tmpSpec, JSON.stringify({ id: p, frames: Math.ceil((W.at(-1)?.e ?? 0) * 30) + 30, items: vs.map((v) => ({ t: "verse", at: v.cut[0], words: v.words, times: v.cut, sura: v.sura, aya: v.aya, name: v.name, ref: v.ref })) }));
  const a = vs.length ? await run("node", ["tools/verse_audit.mjs", tmpSpec, "--words", path.join(T, "cut_words.json")]) : { code: 0, out: "" };
  const report = a.out.trim();
  const problems = report.split("\n").filter((l) => /أسقط|زاد|قرأ|بدل|✘/.test(l));
  for (const [k, line] of problems.entries()) {
    const t = Number((line.match(/(\d+):(\d\d)/) ?? []).slice(1).reduce((s, x, j) => s + Number(x) * (j ? 1 : 60), 0)) || 0;
    addQuestion(p, { id: `verse-${k}`, kind: "آية", q: `خطأ محتمل في التلاوة: ${line.trim()} — هل تعيد تسجيلها أم نتركها؟`, video: clip(t), opts: ["سأعيد تسجيلها", "اتركها كما هي", "ليست خطأ"] });
  }
  return save("verses", { count: vs.length, verses: vs.map((v) => ({ ref: `${v.name} ${v.ref}`, at: mm(v.cut[0]), t: v.cut[0] })), audit: report, problems: problems.length });
};

const mentions = async () => {
  const lex = read("data/mention_lexicon.json", {}), out = [];
  for (const [cat, entries] of Object.entries(lex)) {
    if (cat === "_" || cat === "أشخاص") continue;
    for (const [name, forms] of Object.entries(entries)) {
      const fs2 = forms.map((f) => norm(f).split(" ").map(bare));
      const times = [];
      for (let i = 0; i < N.length; i++) for (const f of fs2) if (f.every((x, j) => N[i + j] && bare(N[i + j].n) === x)) { times.push(N[i].s); break; }
      if (times.length) out.push({ cat, name, first: mm(times[0]), t: times[0], count: times.length, times: times.map((t) => +t.toFixed(2)) });
    }
  }
  return save("mentions", out.sort((a, b) => a.t - b.t));
};

const TITLES = ["الشيخ", "شيخ", "الامام", "الدكتور", "الاستاذ", "العلامه", "الحافظ", "القاضي", "المفتي", "الفنان", "المطرب", "الرئيس", "الملك", "الامير", "الوزير", "السيد"];
// words that follow a title but are not a name (verbs, pronouns, particles seen in his speech); the finder lists candidates, Claude confirms each one
const STOP = new Set(["الله", "الاسلام", "المسلمين", "هذا", "هذه", "ذلك", "الذي", "التي", "كان", "يعني", "انه", "في", "من", "على", "عن", "الى", "ما", "لا", "هو", "هي", "قال", "يقول", "مع", "ونحن", "نحن", "انت", "انا", "صار", "اسال", "اعوذ", "سوء", "يعرف", "وتبع", "تبع", "بنفسه", "نفسه", "خسر", "والله", "كمان", "بس", "هون", "هنا", "اللي", "يا", "قلي", "بده", "عنده", "معه", "معي", "الكبير", "الكريم"]);
const people = async () => {
  const lex = read("data/people_lexicon.json", {}), lib = read("public/scholar_images/library.json", {});
  const known = Object.entries(lex).filter(([k]) => k !== "_").map(([name, forms]) => ({ name, forms: forms.map((f) => norm(f).split(" ")) }));
  const found = new Map(), taken = new Set();
  const hit = (name, i, how) => { const k = norm(name); const e = found.get(k) ?? { name, how, times: [], context: ctx(i) }; if (!e.times.some((t) => Math.abs(t - N[i].s) < 1)) e.times.push(+N[i].s.toFixed(2)); found.set(k, e); };
  for (let i = 0; i < N.length; i++) for (const k of known) for (const f of k.forms) if (f.every((x, j) => N[i + j] && bare(N[i + j].n) === bare(x))) { hit(k.name, i, "معروف"); for (let j = 0; j < f.length; j++) taken.add(i + j); }
  for (let i = 0; i < N.length; i++) {
    if (taken.has(i) || taken.has(i + 1)) continue;
    const w = N[i].n, nx = N[i + 1]?.n, nx2 = N[i + 2]?.n;
    if (!nx || STOP.has(nx) || nx.length < 3 || /[?؟]/.test(N[i + 1].w) || N[i - 1]?.n === "يا") continue;
    if (w === "الشيخ" && N[i - 1]?.n === "ال") { hit(`${N[i - 2]?.w ?? ""} آل الشيخ`.trim(), i - 2, "لقب"); continue; }   // «تركي آل الشيخ» is a family name, not «الشيخ + name»
    if (TITLES.includes(w)) hit(`${N[i].w} ${N[i + 1].w}${nx2 && !STOP.has(nx2) && /^ال|^ابن|^بن/.test(nx2) ? " " + N[i + 2].w : ""}`, i, "لقب");
    else if ((w === "ابن" || w === "ابو" || w === "ابي") && nx.length > 2) hit(`${N[i].w} ${N[i + 1].w}`, i, "كنية");
  }
  const libNames = JSON.stringify(lib);
  const out = [...found.values()].map((e) => ({ ...e, first: mm(e.times[0]), t: e.times[0], count: e.times.length, inScholarLib: libNames.includes(e.name.split(" ").pop()) })).sort((a, b) => a.t - b.t);
  return save("people", out);
};

const HADITH = [["قال", "رسول", "الله"], ["قال", "النبي"], ["صلي", "الله", "عليه", "وسلم"], ["عليه", "الصلاه", "والسلام"], ["في", "الحديث"], ["في", "صحيح"], ["رواه"], ["عن", "النبي"], ["عن", "رسول", "الله"], ["حديث"]];
const hadith = async () => {
  const out = []; let last = -99;
  for (let i = 0; i < N.length; i++) for (const h of HADITH) if (h.every((x, j) => N[i + j] && N[i + j].n === norm(x))) {
    if (N[i].s - last < 12) break;   // one candidate per passage
    last = N[i].s;
    out.push({ at: mm(N[i].s), t: +N[i].s.toFixed(2), trigger: h.join(" "), words: N.slice(i, i + 40).map((w) => w.w).join(" ") });
    break;
  }
  return save("hadith", out);
};

const numbers = async () => {
  const out = [];
  for (let i = 0; i < N.length; i++) {
    const w = N[i].n;
    if (/^(سنه|عام)$/.test(w) && /^\d{3,4}$/.test(N[i + 1]?.n ?? "")) out.push({ at: mm(N[i].s), t: N[i].s, kind: "سنة", text: ctx(i, 4, 8) });
    else if (/^\d+$/.test(w) && Number(w) >= 100) out.push({ at: mm(N[i].s), t: N[i].s, kind: "رقم", text: ctx(i, 4, 8) });
    else if (/^(مليون|مليار|الف|بالمئه|بالميه)$/.test(w)) out.push({ at: mm(N[i].s), t: N[i].s, kind: "رقم", text: ctx(i, 4, 8) });
  }
  return save("numbers", out.filter((x, k, a) => !k || x.t - a[k - 1].t > 6));
};

// ── run all at once ──────────────────────────────────────────────────────────────────────────────────────
const jobs = { verses, mentions, people, hadith, numbers };
const res = await Promise.all(Object.entries(jobs).map(async ([k, f]) => { const t = Date.now(); try { const r = await f(); return [k, r, Date.now() - t]; } catch (e) { return [k, { error: String(e) }, Date.now() - t]; } }));
const R0 = Object.fromEntries(res.map(([k, r]) => [k, r]));
const md = [`# بحث ${p} (${((Date.now() - T0) / 1000).toFixed(1)} ث، كلها معاً)`, "",
  `## الآيات: ${R0.verses.count ?? 0}، مشكلات محتملة في التلاوة: ${R0.verses.problems ?? 0}`, ...(R0.verses.verses ?? []).map((v) => `- ${v.at} ${v.ref}`), "", "```", R0.verses.audit ?? R0.verses.error ?? "", "```", "",
  `## الأحاديث (${(R0.hadith ?? []).length}) — تُحقَّق في الشاملة: الكتاب والرقم`, ...(R0.hadith ?? []).map((h) => `- ${h.at} «${h.words}»`), "",
  `## الأشخاص (${(R0.people ?? []).length}) — صورة حقيقية لكل واحد`, ...(R0.people ?? []).map((x) => `- ${x.first} ${x.name} ×${x.count} (${x.how}${x.inScholarLib ? "، في مكتبة العلماء" : ""}) — «${x.context}»`), "",
  `## الدول والأماكن والكتب والفرق (${(R0.mentions ?? []).length})`, ...(R0.mentions ?? []).map((m) => `- ${m.first} ${m.name} (${m.cat}) ×${m.count}`), "",
  `## الأرقام والسنوات (${(R0.numbers ?? []).length}) — خبر أو رقم = صورة أو رابط`, ...(R0.numbers ?? []).map((n) => `- ${n.at} ${n.kind}: ${n.text}`)];
fs.writeFileSync(path.join(R, "research.md"), md.join("\n") + "\n");
for (const [k, r, ms] of res) console.log(`${k.padEnd(9)} ${r?.error ? "✘ " + r.error : Array.isArray(r) ? r.length : r.count ?? "ok"}  (${ms} ms)`);
console.log(`→ ${path.join(R, "research.md")}  ·  questions: http://localhost:3110/?p=${p}`);
