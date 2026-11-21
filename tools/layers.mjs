// THE MONTAGE IN LAYERS (user 2026-11-20: «طبقة الآيات، طبقة الأحاديث، طبقة الأسئلة، طبقة تكبير الشاشة… طبقة الأشخاص، طبقة البلاد. فهون أنت تنشئها كطبقات…
// وتركب كل الطبقات، ويكون عندك أداة توازن… أداة لفك التعارض، وبعدين أداة لمراقبة الفراغات»).
// Every kind of moment in his speech is ONE layer, found all at once from the cut transcript, each with its own gallery element:
//   الأسئلة      a sentence that opens with a question word                → BigQuestion (the question as he asks it, written when said)
//   التعريفات    «الحرابة هي…»، «X يعني…»، «أي…»: he explains a word        → Footnote (the word, then its meaning when he gives it)
//   التعدادات    three or more parallel items («يُغرَّم، يُسجن، يُبتر»، «أولاً… ثانياً…») → StatRow (a card per item at its word)
//   المشاهد      a scene word (السجن، الماء، الضيق، النار…)                 → a scene effect behind him (built once in the gallery, then here)
// and the layers that already have their own tools, reported against the spec: الآيات (verse_scan), الأحاديث (hadith_scan), البلاد (names_scan),
// الأشخاص (requirements), التقريب والاهتزاز (moves_plan).
//   node tools/layers.mjs scan <p>     → .tmp/<p>/layers.json (every proposal: layer, time, his words, element, values, covered or missing) + a printed table
//   node tools/layers.mjs write <p>    → every MISSING proposal not marked "skip" is added through `el.mjs batch` (the quick gates judge them once), then the
//                                        conflicts are settled by `element_slots --fix` (higher rank stays; same rank → the SHORTER stays — user 2026-11-20)
//   node tools/layers.mjs gaps <p> [--win 30]   the gap watch: every 30-s window, each stretch > 5 s with no real element (a push-in is NOT an element) and
//                                        what he says in it — exit 1 while one is left (stage check runs it)
// I read layers.json between scan and write: a question/meaning/item text is his words as heard; I may shorten it (never add to it), or set "skip": "<why>".
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { takeSpecArg } from "./lib/selftest_spec.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
/* (2026-11-21) --spec <file>: the guard self-test's scratch spec (under .tmp/selftest/ only) instead of data/specs/<p>.json — tools/lib/selftest_spec.mjs */
const SPEC_FILE = takeSpecArg(ROOT);
process.chdir(ROOT);
const [cmd, p] = process.argv.slice(2);
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? d : process.argv[i + 1]; };
if (!cmd || !p) { console.error("usage: node tools/layers.mjs scan|write|gaps <p>"); process.exit(2); }
const specF = SPEC_FILE ?? `data/specs/${p}.json`, spec = JSON.parse(fs.readFileSync(specF, "utf8"));
const wf = path.join(".tmp", p, "cut_words.json");
if (!fs.existsSync(wf)) { console.error(`✘ لا نص للقص: ${wf}`); process.exit(2); }
const W0 = JSON.parse(fs.readFileSync(wf, "utf8")), words = (Array.isArray(W0) ? W0 : W0.words).map((w) => ({ s: w.s, e: w.e, w: w.w }));
const OUT = path.join(".tmp", p, "layers.json");
const mm = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
const norm = (s) => String(s).replace(/[ً-ٰٟـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[^\p{L}\p{N}]/gu, "");
const span = (x) => { const a = x.at ?? x.from ?? x.times?.[0]; return a == null ? null : [a, x.until ?? x.to ?? (x.dur != null ? a + x.dur : a + 6)]; };
const dur = words.length ? words[words.length - 1].e : 0;

/* sentences: a pause ≥ 0.45 s or 22 words closes one (as tools/moves_plan.mjs) */
const sentences = []; { let cur = [];
  for (let i = 0; i < words.length; i++) { cur.push(words[i]); const gap = (words[i + 1]?.s ?? 1e9) - words[i].e; if (gap >= 0.45 || cur.length >= 22) { sentences.push(cur); cur = []; } }
  if (cur.length) sentences.push(cur); }
const text = (ws) => ws.map((w) => w.w).join(" ");

/* what is already on screen, by kind */
const NOT_REAL = new Set(["wm", "cover"]);
const realItems = spec.items.filter((x) => !NOT_REAL.has(x.t) && x.only !== "port");
const covering = (a, b, ok) => realItems.some((x) => { const s = span(x); return s && s[0] < b && s[1] > a && ok(x); });
const isEl = (...els) => (x) => (x.t === "pick" && els.includes(x.el)) || els.includes(x.t);

const layers = [];
const add = (o) => layers.push({ id: `${o.layer[0]}${Math.round(o.at * 10)}`, ...o, status: o.covered ? "covered" : "missing" });

if (cmd === "scan") {
  /* ── الأسئلة */
  const QW = new Set(["لماذا", "هل", "فهل", "وهل", "كيف", "فكيف", "وكيف", "ماذا", "فماذا", "اين", "متي", "فاي", "واي", "اليس", "افلا", "افليس", "فلماذا", "ولماذا"]);
  let lastQ = -99;
  /* a question word ANYWHERE in the sentence (it often follows a lead-in: «… فلماذا لم تقل…»); «ما/فما/وما» only before a question noun or «الذي» */
  const QN = /^(ال|مقدار|كيفيه|حكم|الحل|الدليل|الفرق|جريمه|ذنب)/;
  for (const s of sentences) {
    const n = s.map((w) => norm(w.w));
    const qi = n.findIndex((h, k) => QW.has(h) || ((h === "اي" || h === "فاي" || h === "واي") && k + 1 < n.length && n[k + 1].length >= 4) || (["ما", "فما", "وما", "من", "فمن"].includes(h) && (n[k + 1] === "الذي" || (h !== "من" && h !== "فمن" && ((QN.test(n[k + 1] ?? "") && n[k + 1] !== "الله") || ((n[k + 1] === "هو" || n[k + 1] === "هي") && (n[k + 2] ?? "").length >= 2))))));   /* «ما هو حد الحرابة؟» */
    if (qi < 0 || s.length - qi < 4) continue;
    const q = s.slice(qi, qi + 14), a = q[0].s, b = q[q.length - 1].e;
    if (a - lastQ < 15) continue; lastQ = a;
    add({ layer: "الأسئلة", at: +a.toFixed(2), until: +(b + 1.5).toFixed(2), words: text(s), el: "BigQuestion",
      vals: { at: +(a - 0.05).toFixed(2), until: +(b + 1.5).toFixed(2), text: text(q) + "؟", textAt: +a.toFixed(2) },
      covered: covering(a - 0.5, b, isEl("BigQuestion", "QACard", "TypeBox", "DecisionFlow")) });
  }
  /* ── التعريفات */
  const DEF = new Set(["هي", "هو", "يعني", "اي", "بمعني", "معناه", "معناها", "معني"]), DSTOP = new Set(["لو", "ان", "انه", "انها", "اذا", "هذا", "هذه", "ما", "لا", "في", "من", "الذي", "التي", "هو", "هي", "اللي", "اصلا", "يعني", "واضح"]);
  for (const s of sentences) for (let i = 0; i + 3 < s.length; i++) {
    const t0 = norm(s[i].w), d = norm(s[i + 1].w), n2 = norm(s[i + 2].w);
    if (!DEF.has(d) || DSTOP.has(n2) || !/^(ال|فال|وال|بال)/.test(t0) || t0.length < 5) continue;
    const term = s[i].w.replace(/^[فوب](?=ال)/, ""), mean = s.slice(i + 2, i + 10), a = s[i].s, b = mean[mean.length - 1].e;
    add({ layer: "التعريفات", at: +a.toFixed(2), until: +(b + 1.5).toFixed(2), words: text(s), el: "Footnote",
      vals: { at: +(a - 0.05).toFixed(2), until: +(b + 1.5).toFixed(2), before: "", word: term, wordAt: +a.toFixed(2), meaning: text(mean), noteAt: +mean[0].s.toFixed(2) },
      covered: covering(a - 0.5, b, isEl("Footnote", "torn", "scraps", "TypeBox")) });
    break;
  }
  /* ── التعدادات: ≥ 3 parallel items — present verbs (يُغرَّم يسجن يبتر), «X أو Y أو Z» / «X و Y و Z», or ordinals */
  const ORD = ["اولا", "ثانيا", "ثالثا", "رابعا", "الاول", "الثاني", "الثالث", "الرابع"], VSTOP = new Set(["يعني", "يكون", "يمكن", "يقول", "يجوز", "يجب", "تكون", "يوجد", "تعالي"]);
  let lastL = -99;
  for (let i = 0; i < words.length; i++) {
    const win = words.slice(i, i + 8), n = win.map((w) => norm(w.w));
    let items = [];
    const verbs = win.filter((w, k) => /^[يت]/.test(n[k]) && n[k].length >= 4 && n[k].length <= 6 && !VSTOP.has(n[k]));
    if (verbs.length >= 3 && verbs[0] === win[0]) items = verbs.slice(0, 5);
    const conj = []; for (let k = 0; k < win.length; k++) { if (n[k] === "او" && win[k + 1]) conj.push(win[k + 1]); else if (/^و/.test(n[k]) && n[k].length >= 4 && k > 0 && conj.length) conj.push(win[k]); }
    if (!items.length && conj.length >= 2 && n[1] !== "او") items = [win[0], ...conj].slice(0, 5);
    const ords = words.slice(i, i + 60).filter((w) => ORD.includes(norm(w.w)));
    if (!items.length && ORD.includes(n[0]) && ords.length >= 3) items = ords.slice(0, 4);
    if (new Set(items.map((w) => norm(w.w).replace(/^(او|و|ف|ب|ل)(?=.{3,})/, "").replace(/^ال/, ""))).size < items.length) continue;   /* the same word repeated is not a list («العائلة… والعائلة») */
    if (items.length < 3 || items[0].s - lastL < 25) continue;
    const a = items[0].s, b = items[items.length - 1].e; lastL = a;
    add({ layer: "التعدادات", at: +a.toFixed(2), until: +(b + 2.5).toFixed(2), words: text(words.slice(i, i + 12)), el: "StatRow",
      vals: { from: +(a - 0.05).toFixed(2), to: +(b + 2.5).toFixed(2), rows: items.map((w) => ({ at: +w.s.toFixed(2), label: w.w })) },
      covered: covering(a - 0.5, b, isEl("StatRow", "PanelToCanvas", "FlapBoard", "rows", "p2c")) });
    i += 8;
  }
  /* ── المشاهد (scene effects behind him; user 2026-11-20: «لو قلت كلهم في السجن… قضبان سجن… لو قلت في الماء أمواج… ضيق عليهم… الخلفية تضيق») */
  const SCENE = { prison: ["سجن", "السجن", "سجون", "السجون", "يسجن", "سجنوا", "زنزانه", "قضبان", "معتقل"], water: ["ماء", "الماء", "البحر", "بحر", "غرق", "يغرق", "امواج", "الطوفان", "فيضان"], squeeze: ["ضيق", "يضيق", "ضيقوا", "ضيقت", "حصار", "حاصروا", "يخنق", "خنق"], fire: ["نار", "النار", "حريق", "احرق", "احرقوا", "يحرق"], dark: ["ظلام", "الظلام", "ظلمات", "الظلمات"] };
  const AR = { prison: "قضبان سجن تنزل خلفه", water: "أمواج ماء خلفه", squeeze: "الخلفية تضيق عليه", fire: "لهب خلفه", dark: "إظلام الخلفية" };
  /* (user 2026-11-20 evening: «هذه ليست مؤثرات ثابتة، هذه طريقة تفكير») these words only POINT at a moment whose meaning the background might carry; they
     choose nothing. The effect is thought for that moment (.claude/skills/visual-thinking) — an existing one only if it fits exactly, else a new one */
  const lastS = {};
  for (const w of words) { const n = norm(w.w); for (const [fx, list] of Object.entries(SCENE)) if (list.includes(n) && w.s - (lastS[fx] ?? -99) > 60) {
    lastS[fx] = w.s;
    add({ layer: "المشاهد", at: +w.s.toFixed(2), until: +(w.s + 3).toFixed(2), words: text(words.filter((x) => x.s >= w.s - 2 && x.s < w.s + 3)), el: `scene:${fx}`, vals: { at: +w.s.toFixed(2) }, note: `لحظة قد تعبّر عنها الخلفية (${AR[fx]} مثلاً) — فكّر بما يناسبها`,
      covered: covering(w.s - 0.3, w.s + 1, (x) => x.t === "scenefx") });
  } }
  /* ── the layers with their own tools: what they found against what the spec shows */
  const J = (f) => { try { return JSON.parse(fs.readFileSync(path.join(".tmp", p, f), "utf8")); } catch { return null; } };
  const vs = J("verses.json"); if (Array.isArray(vs)) for (const v of vs) { const a = v.cut?.[0] ?? v.times?.[0]; if (a == null) continue; add({ layer: "الآيات", at: +a.toFixed(2), until: +((v.cut ?? v.times).slice(-1)[0] + 1).toFixed(2), words: v.ref ?? `${v.sura}:${v.aya}`, el: "verse", vals: null, covered: covering(a - 1, a + 2, (x) => x.t === "verse") || (spec.skipRequired ?? []).some((k) => k.startsWith(`آية ${v.sura}:${v.aya}`)) }); }
  const hs = J("hadith.json"); if (Array.isArray(hs)) for (const h of hs.filter((x) => !x.skip)) { const a = h.at ?? h.s; if (a == null) continue; add({ layer: "الأحاديث", at: +a.toFixed(2), until: +(h.until ?? a + 4).toFixed(2), words: (h.text ?? h.cue ?? "").slice(0, 80), el: "note", vals: null, covered: covering(a - 1, a + 2, (x) => x.t === "note" || x.t === "hadith") }); }
  const ns = J("names.json"); for (const m of ns?.places ?? []) { const a = m.at; if (a == null) continue; add({ layer: "البلاد", at: +a.toFixed(2), until: +(a + 4).toFixed(2), words: m.said ?? m.name ?? "", el: "pmap", vals: null, covered: covering(a - 1, a + 3, (x) => x.t === "pmap") || spec.items.some((x) => x.t === "pmap" && (x.moves ?? []).some((q) => q.from <= a + 3 && q.to >= a - 1)) || (spec.skipRequired ?? []).includes(`${m.said ?? m.name}@${Math.round(a)}`) }); }
  /* requirements ledger rows (tools/requirements.mjs): person → الأشخاص, depict → الصور (what he describes); a row is met by one of its `need` types around its second */
  const rq = J("requirements.json"); const LN = { person: "الأشخاص", depict: "الصور" };
  for (const r of (Array.isArray(rq) ? rq : []).filter((x) => LN[x.kind])) { const a = r.t; if (a == null) continue; const need = new Set(r.need ?? []); add({ layer: LN[r.kind], at: +a.toFixed(2), until: +(a + (r.after ?? 4)).toFixed(2), words: `${r.text} — ${(r.ctx ?? "").slice(0, 70)}`, el: [...need][0] ?? "pic", vals: null, covered: covering(a - (r.before ?? 1), a + (r.after ?? 4), (x) => need.has(x.t) || need.has(x.el)) || (spec.skipRequired ?? []).some((k) => k.startsWith(r.text)) }); }
  const zs = (spec.zooms ?? []).filter((z) => z.auto !== "gap_fill"), fills = (spec.zooms ?? []).length - zs.length;
  for (const z of zs) add({ layer: "التقريب", at: z.from, until: z.to, words: "", el: "zoom", vals: null, covered: true });
  for (const z of spec.shake ?? []) add({ layer: "التهكم", at: z.from, until: z.to, words: "", el: "shake", vals: null, covered: true });

  /* a new scan keeps my review of the last one: its "skip" reasons, the values I shortened, and the moments I added by hand (ids "x…") */
  try {
    const old = JSON.parse(fs.readFileSync(OUT, "utf8")), byId = Object.fromEntries(old.map((l) => [l.id, l]));
    for (const l of layers) { const o = byId[l.id]; if (!o) continue; if (o.skip) l.skip = o.skip; if (o.vals && l.status === "missing") l.vals = o.vals; }
    for (const o of old) if (o.id.startsWith("x") && !layers.some((l) => l.id === o.id)) layers.push({ ...o, status: covering(o.at - 0.5, o.at + 1, isEl(o.el, o.el === "NoteCard" ? "note" : o.el)) ? "covered" : "missing" });
  } catch { /* first scan */ }
  layers.sort((a, b) => a.at - b.at);
  fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(layers, null, 1));
  const by = {}; for (const l of layers) (by[l.layer] ??= []).push(l);
  for (const [k, ls] of Object.entries(by)) {
    const miss = ls.filter((l) => l.status === "missing" && !l.skip), left = ls.filter((l) => l.status === "missing" && l.skip);
    console.log(`${miss.length ? "✘" : "✔"} طبقة ${k}: ${ls.length} موضعاً، ${miss.length} بلا عنصر${left.length ? `، ${left.length} متروك بسبب مكتوب` : ""}`);
    for (const l of miss) console.log(`   ${l.id}  ${mm(l.at)}  ${l.el}${l.note ? ` (${l.note})` : ""}  «${l.words.slice(0, 90)}»`);
    for (const l of left) console.log(`   ⚠ ${l.id}  ${mm(l.at)} متروك: ${l.skip}`);
  }
  if (fills) console.log(`⚠ ${fills} تقريباً وُضع آلياً لسدّ الفراغات (gap_fill): لا يُعدّ عنصراً`);
  console.log(`→ ${OUT}`);
} else if (cmd === "write") {
  const L = JSON.parse(fs.readFileSync(OUT, "utf8"));
  const todo = L.filter((l) => l.status === "missing" && !l.skip && l.vals && !l.el.startsWith("scene:") && ["BigQuestion", "Footnote", "StatRow", "NoteCard"].includes(l.el));
  const scenes = L.filter((l) => l.status === "missing" && !l.skip && l.el.startsWith("scene:"));
  if (!todo.length) console.log("لا موضع ناقص يُضاف من طبقات الأسئلة والتعريفات والتعدادات");
  else {
    const ops = todo.map((l) => ({ op: "add", code: l.el, vals: l.vals })), opsF = path.join(".tmp", p, "layers_ops.json");
    fs.writeFileSync(opsF, JSON.stringify(ops, null, 1));
    const r = spawnSync(process.execPath, ["tools/el.mjs", "batch", p, opsF, ...(SPEC_FILE ? ["--spec", SPEC_FILE] : [])], { encoding: "utf8" });
    console.log(((r.stdout || "") + (r.stderr || "")).trim().split(/\r?\n/).filter((x) => /^\s*[✔✘]/.test(x)).join("\n"));
    if (r.status !== 0) process.exit(1);
    const f = spawnSync(process.execPath, ["tools/element_slots.mjs", p, "--fix", ...(SPEC_FILE ? ["--spec", SPEC_FILE] : [])], { encoding: "utf8" });
    console.log(((f.stdout || "") + (f.stderr || "")).trim().split(/\r?\n/).filter((x) => /^(✔|✘|حُذف|قُصّر)/.test(x)).join("\n"));
  }
  if (scenes.length) console.log(`⚠ ${scenes.length} لحظة قد تحمل الخلفيةُ معناها — فكّر لكل واحدة بما يناسبها (مهارة التفكير البصري): ${scenes.map((l) => mm(l.at)).join("، ")}`);
} else if (cmd === "gaps") {
  /* the gap watch: real elements only — a push-in or a shake is a camera move, not an element (user 2026-11-20: «في مواضع كثيرة لا تضع فيها شيئاً») */
  const WIN = Number(arg("win", 30)), GAP = 5;
  const sp = [...realItems.map(span).filter(Boolean), ...(spec.splits ?? []).map((w) => [w.from, w.to]), ...(spec.solos ?? []).map((w) => [w.from, w.to])].sort((a, b) => a[0] - b[0]);
  const gaps = []; let end = 0; for (const [a, b] of sp) { if (a - end > GAP) gaps.push([end, a]); end = Math.max(end, b); } if (dur - end > GAP) gaps.push([end, dur]);
  if (!gaps.length) { console.log(`✔ مراقب الفراغات: لا فراغ أطول من ${GAP} ث بلا عنصر`); process.exit(0); }
  for (let w0 = 0; w0 < dur; w0 += WIN) {
    const g = gaps.filter(([a, b]) => a < w0 + WIN && b > w0 && a >= w0); if (!g.length) continue;
    for (const [a, b] of g) console.log(`✘ فراغ ${mm(a)}–${mm(b)} (${Math.round(b - a)} ث) بلا عنصر: «${text(words.filter((x) => x.s >= a && x.s < b)).slice(0, 160)}»`);
  }
  console.log(`✘ ${gaps.length} فراغاً مجموعها ${Math.round(gaps.reduce((s, [a, b]) => s + b - a, 0))} ث — املأها من الطبقات أو بعنصر يناسب ما قيل`);
  process.exit(1);
} else { console.error("usage: node tools/layers.mjs scan|write|gaps <p>"); process.exit(2); }
