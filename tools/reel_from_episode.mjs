// ريل من حلقة منتهية (أمر المستخدم 2026-11-18: «يختار كلمات وجمل ليختصر الحلقة الى ريل وينتبه الى الفرق بين المتحدثين ليكون سياق كلام كل واحد تام») — مهارة reel-from-episode.
//   node tools/reel_from_episode.mjs <episode> --story-only [--target 60-90]     القصة أولاً: .tmp/<episode>/reel_story.md + reel_ranges.json (لا قص)
//   node tools/reel_from_episode.mjs <episode> --approved [--out <id>]            يبني الريل من القصة المعتمدة كما هي (reel_ranges.json)
//   node tools/reel_from_episode.mjs <episode> --ranges "3,1,2" | "0:33-0:45,2:10-2:31" [--out <id>] [--as-is]
//        أرقام أجزاء القصة أو أمدية بزمن قص الحلقة (دقيقة:ثانية أو ثوانٍ)، بترتيب المستخدم لا بالترتيب الزمني؛ كل حدّ يُضبط على كلمة كاملة.
//        --as-is: يبني رغم مخالفات السياق (بنص المستخدم فقط)؛ بدونه أي مخالفة توقف البناء.
// المصدر: كلمات التفريغ بزمن الأصل (.tmp/<p>/words_table.json، وإلا كلمات المتحدثين في speakers.json، وإلا words_vad.json بلا متحدث) وخريطة القص public/<p>_map.json.
// الجمل: تنقسم عند سكتة ≥ sentenceGap (من data/cut_rules.json إن وُجد، وإلا 0.45ث) وعند تبدّل المتحدث وعند كلمة حذفها القص؛ لا قطع داخل كلمة؛ الجملة < 1.2ث تُضم لجارتها من المتحدث نفسه.
// السياق: دور المتحدث الآخر (متصل/خصم/مقطع) كاملاً من أول كلمة إلى آخرها + جملة رد الشيخ التي تليه؛ لا بداية بأداة ربط ولا نهاية بكلمة معلّقة.
// البناء: مشروع جديد <episode>-reel شريحةً من قص الحلقة (tools/stream/clip_slice.mjs) + كلماته مزاحة + مواصفة ريل دنيا data/specs/<id>.json (kind "reel")؛ بلا رندر.
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import { spawnSync } from "node:child_process"; import { coverItem } from "./cover_item.mjs";   /* the cover first (user 2026-11-21: «يعني يكون الغلاف في أوله») */
try { os.setPriority(process.pid, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* best effort */ }
process.chdir(path.resolve(import.meta.dirname, ".."));

const argv = process.argv.slice(2), P = argv[0];
const opt = (k) => { const i = argv.indexOf(`--${k}`); return i < 0 ? null : argv[i + 1]; };
const has = (k) => argv.includes(`--${k}`);
if (!P || P.startsWith("--")) { console.error("usage: node tools/reel_from_episode.mjs <episode> --story-only [--target 60-90] | --approved | --ranges \"…\" [--out <id>] [--as-is]"); process.exit(2); }
const rd = (f, d = null) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const T = path.join(".tmp", P);
const tg = String(opt("target") ?? "60-90").split("-").map(Number);
const SL = await import("./short_limit.mjs"), BUDGET = SL.contentBudget();   /* (2026-11-18) the reel + its bumper ≤ the Shorts limit: the story never asks for more than the budget */
const [tMin, tMax0] = tg.length > 1 ? tg : [Math.round(tg[0] * 0.85), tg[0]], tMax = Math.min(tMax0, BUDGET - 4), tMid = (tMin + tMax) / 2;   // 4 s spare for an end stamp or freeze

// ── الأرقام (تفصيلها في .claude/skills/reel-from-episode/references/detail.md) ──
const RULES = rd(path.join("data", "cut_rules.json"), {});
const SG = RULES.sentenceGap ?? 0.45, MIN_SENT = 1.2, JOIN_GAP = 2.0, MAX_SENT = 18;
const PAD_B = 0.12, PAD_A = 0.26, REPLY_MIN = 5, REPLY_MAX = 25, HOOK_MAX = 15, POINT_MAX = 22, IDEA_MIN = 6, IDEA_GAP = 3.0, INTERJ_MAX = 3, PART_MIN = 3, KEY_MIN = 5;

// ── المدخلات ──
const mapJ = rd(path.join("public", `${P}_map.json`));
if (!mapJ?.segments?.length) { console.error(`✘ لا خريطة قص public/${P}_map.json`); process.exit(1); }
const segs = mapJ.segments;
const segEnd = (g) => g.n + (g.b - g.a);
const srcToCut = (t) => { for (const g of segs) if (t >= g.a - 1e-6 && t <= g.b + 1e-6) return g.n + (t - g.a); return null; };
const cutToSrc = (t) => { for (const g of segs) if (t >= g.n - 1e-6 && t <= segEnd(g) + 1e-6) return g.a + (t - g.n); return null; };
const spk = rd(path.join(T, "speakers.json"));
const nameOf = (lab) => (lab == null ? null : spk?.speakers?.[lab]?.name ?? lab);
let raw = null, wordsFrom = "", speakersFrom = null;
const wt = rd(path.join(T, "words_table.json"));
if (wt?.words?.length) { raw = wt.words.map((w) => ({ w: w.w, s: +w.s, e: +w.e, p: w.p ?? null, sp: nameOf(w.sp ?? w.spk ?? null) })); wordsFrom = "words_table.json"; if (raw.some((w) => w.sp)) speakersFrom = "words_table.json"; }
if (!raw && spk?.words?.length) { raw = spk.words.map((w) => ({ w: w.w, s: +w.s, e: +w.e, p: w.p ?? null, sp: nameOf(w.spk) })); wordsFrom = "speakers.json"; speakersFrom = "speakers.json"; }
if (!raw) { const v = rd(path.join(T, "words_vad.json")) ?? rd(path.join(T, "words.json")); const vv = v?.words ?? v; if (Array.isArray(vv) && vv.length) { raw = vv.map((w) => ({ w: w.w ?? w.word, s: +(w.s ?? w.start), e: +(w.e ?? w.end), p: w.p ?? null, sp: null })); wordsFrom = "words_vad.json"; } }
if (!raw) { console.error(`✘ لا كلمات تفريغ في .tmp/${P}/ (words_table.json / speakers.json / words_vad.json)`); process.exit(1); }
if (!speakersFrom && spk?.turns?.length) { for (const w of raw) { const m = (w.s + w.e) / 2, t = spk.turns.find((u) => m >= u.s - 0.05 && m <= u.e + 0.05); w.sp = t ? t.name ?? nameOf(t.spk) : null; } speakersFrom = "speakers.json (turns)"; }
const ALL = raw.filter((w) => w.w && Number.isFinite(w.s) && Number.isFinite(w.e)).sort((a, b) => a.s - b.s).map((w, i) => ({ ...w, i, sp: w.sp == null ? "unknown" : w.sp === "sheikh" ? "sheikh" : String(w.sp) }));
for (const w of ALL) { const m = (w.s + w.e) / 2, c = srcToCut(m); w.c = c; if (c !== null) { w.cs = Math.max(0, c - (m - w.s)); w.ce = c + (w.e - m); } }
const IN = ALL.filter((w) => w.c !== null);
const known = speakersFrom !== null && IN.some((w) => w.sp !== "unknown");
const others = [...new Set(IN.filter((w) => w.sp !== "sheikh" && w.sp !== "unknown").map((w) => w.sp))];
const spName = (sp) => (sp === "sheikh" ? "الشيخ" : sp === "unknown" ? "متحدث غير مميَّز" : others.length > 1 ? `المتحدث الآخر ${others.indexOf(sp) + 1}` : "المتحدث الآخر");
const isOther = (sp) => sp !== "sheikh" && sp !== "unknown";

// ── تطبيع ومعاجم ──
const norm = (s) => String(s).replace(/[ً-ٰٟـ]/g, "").replace(/[إأآٱ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[^\p{L}\p{N}؟?]/gu, "").replace(/[؟?]/g, "");
const strip = (t) => t.replace(/^(وال|بال|كال|فال|لل|ال|و|ف|ب|ل|ك)(?=.{3,})/, "");
const S_ = (a) => new Set(a.split(" "));
// حشو منفرد يُحذف من طرف الجملة (كلمة كاملة، فلا قطع داخل كلمة)
const FILL_START = S_("و ف ثم يعني بس اه ايه طيب طب يعني فيعني ويعني ام اا");
const FILL_END = S_("يعني بس اه ايه و ف ثم يا اا");
// أداة ربط في أول النطاق = الجملة تكملة لما قبلها
const CONNECT = S_("لكن ولكن بل لان لانه لانها لانهم لذلك فلذلك ولذلك اذن فاذن حتي او ام كمان وكمان بالتالي وبالتالي فبالتالي ايضا وايضا كذلك وكذلك اما واما فاما فان وان");
// واو العطف أو الفاء متصلة بكلمة («ورياض»، «ولكنهم»، «فالعباده») = تكملة لما قبلها، إلا كلمات أصلها الواو أو الفاء
const WAW_FA_OK = S_("وجود وجد وقت وطن ولد وزير وزاره واحد واحده وحي وجه ورق وصل وضع وعد وقف والله وين وسط وحده وحيد واجب واضح واقع وصف وراء ورا وكيل وفاه ولي وليد ورد وزن وفد وهابي وهابيه وهم وقع فيديو فقط فلان فكره فعل فرق فضيحه فضيله فتوي فتاوي فرنسا فلسطين فيه فيها في فوق فقه فقيه فساد فتنه فرح فائده فوائد فصل فرعون فارس فقير فقراء فرد فاسد فلوس");
const CONNECT_PREFIXED = { test: (t) => t.length >= 3 && /^[وف]/.test(t) && !WAW_FA_OK.has(t) };
// كلمة معلّقة في آخر النطاق (فكرة قائمة DANGLE في tools/stream/clip_autobuild.mjs وفحص الكتابة tools/writing_sync.mjs)
const DANGLE = S_("و مع ان انه انها له لها علي في من الي عن الذي التي اللي الذين بين او ثم لكن ولكن قد هو هي يعني بس ف عند حتي اذا لما لو يا كان لان لانه ما لم لن لا بل كي هذا هذه هؤلاء ذلك تلك هاد هاي اولا ثانيا ثالثا رابعا اخيرا بالتالي وبالتالي فبالتالي ايضا كمان مثل كل بعض غير احد لاحد اي");
const QUESTION = S_("هل لماذا ليش ليه كيف شو ايش ماذا متي اين وين مين لمن كم اليس اليست اليسوا ايش");
const STRONG = S_("خطير خطيره خطيرا فضيحه اعتراف يعترف اعترافين اعترف صادم عجيب غريب كذب كذاب كذابين باطل شرك كفر كافر بدعه ضلال ضال حرام يجوز ابدا قطعا الحقيقه الدليل اخطر اعظم اكبر جريمه مصيبه كارثه تقديس يقدسون قدسنا يعبدون عباده خيانه منافق نفاق دجال تحريف");
const SHOCK = S_("خطير خطيره فضيحه اعتراف يعترف اعترافين اعترف صادم عجيب غريب انظروا اسمعوا كارثه مصيبه");
const CONCL = S_("اذن فاذن الخلاصه خلاصه باختصار فالحاصل الحاصل النتيجه والنتيجه هكذا وهكذا فالواجب المستعان نسال فاحذروا احذروا");
const NUMW = S_("واحد اثنين اثنان ثلاث ثلاثه اربع اربعه خمس خمسه ست سته سبع سبعه ثمان ثمانيه تسع تسعه عشر عشره عشرين ثلاثين اربعين خمسين ستين سبعين ثمانين تسعين مئه مائه ميه الف الاف مليون ملايين مليار");
const FORMULA = [/بسم الله/, /الحمد لله رب/, /والصلاه والسلام/, /السلام عليكم/, /اشترك/, /القناه/, /الجرس/, /لايك/, /مونتاج/];
const tok = (w) => norm(w.w);

// ── 1) الجمل ──
const contig = (a, b) => b.i === a.i + 1;   // لا كلمة محذوفة بينهما (كتلة «مونتاج» أو إعادة)
let sents = [], cur = [];
const flush = () => { if (cur.length) sents.push({ words: cur }); cur = []; };
for (let k = 0; k < IN.length; k++) {
  const w = IN[k], pv = IN[k - 1];
  if (pv && (w.sp !== pv.sp || w.s - pv.e >= SG || !contig(pv, w) || (w.s - cur[0].s > MAX_SENT && w.s - pv.e >= 0.25))) flush();
  cur.push(w);
}
flush();
const sDur = (x) => x.words[x.words.length - 1].e - x.words[0].s;
const gapOf = (a, b) => b.words[0].s - a.words[a.words.length - 1].e;
const cutGap = (a, b) => b.words[0].cs - a.words[a.words.length - 1].ce;   // الفراغ في قص الحلقة (السكتات الطويلة قُصّرت فيه)
const canJoin = (a, b) => a.words[0].sp === b.words[0].sp && contig(a.words[a.words.length - 1], b.words[0]) && cutGap(a, b) < JOIN_GAP;
// الجملة القصيرة < 1.2ث تُضم لجارتها من المتحدث نفسه (السابقة أولاً)
for (let changed = true; changed;) {
  changed = false;
  for (let k = 0; k < sents.length; k++) {
    if (sDur(sents[k]) >= MIN_SENT) continue;
    if (k > 0 && canJoin(sents[k - 1], sents[k])) { sents[k - 1].words.push(...sents[k].words); sents.splice(k, 1); changed = true; break; }
    if (k + 1 < sents.length && canJoin(sents[k], sents[k + 1])) { sents[k + 1].words.unshift(...sents[k].words); sents.splice(k, 1); changed = true; break; }
  }
}
const coreOf = (words) => { let a = 0, b = words.length - 1; while (a <= b && FILL_START.has(tok(words[a]))) a++; while (b >= a && FILL_END.has(tok(words[b]))) b--; return words.slice(a, b + 1); };
const endOk = (core) => core.length > 0 && !DANGLE.has(tok(core[core.length - 1]));
const startOk = (core) => core.length > 0 && !CONNECT.has(tok(core[0])) && !CONNECT_PREFIXED.test(tok(core[0]));
// جملة تنتهي بكلمة معلّقة تُكمَل بالتالية من المتحدث نفسه
for (let k = 0; k < sents.length - 1; k++) {
  while (k + 1 < sents.length && !endOk(coreOf(sents[k].words)) && canJoin(sents[k], sents[k + 1])) { sents[k].words.push(...sents[k + 1].words); sents.splice(k + 1, 1); }
}
const nerF = [path.join(T, "ner_cut.json"), path.join(T, "ner.json")].find((f) => fs.existsSync(f));
const NER = (rd(nerF, []) ?? []).filter((x) => ["PERS", "ORG", "LOC"].includes(x.type));
const PLACES = (rd(path.join(T, "names.json"), {})?.places ?? []).filter((x) => Number.isFinite(x.at));
sents = sents.map((x, k) => {
  const core = coreOf(x.words), sp = x.words[0].sp;
  const toks = core.map(tok), st = toks.map(strip), text = core.map((w) => w.w).join(" "), nt = toks.join(" ");
  const c0 = core.length ? core[0].cs : x.words[0].cs, c1 = core.length ? core[core.length - 1].ce : x.words[x.words.length - 1].ce;
  const hit = (set) => toks.filter((t, j) => set.has(t) || set.has(st[j])).length;
  const f = {
    names: Math.min(3, NER.filter((n) => n.s >= c0 - 0.2 && n.s <= c1 + 0.2).length + PLACES.filter((n) => n.at >= c0 - 0.2 && n.at <= c1 + 0.2).length),
    numbers: Math.min(2, toks.filter((t) => /[0-9٠-٩]/.test(t) || NUMW.has(t) || NUMW.has(strip(t))).length),
    question: hit(QUESTION) > 0 || /[؟?]/.test(core.map((w) => w.w).join("")) ? 1 : 0,
    strong: Math.min(3, hit(STRONG)), shock: Math.min(2, hit(SHOCK)), concl: Math.min(2, hit(CONCL)),
    formula: FORMULA.some((r) => r.test(nt)) ? 1 : 0,
  };
  return { k, sp, words: x.words, core, text, c0, c1, dur: Math.max(0, c1 - c0), startOk: startOk(core), endOk: endOk(core), f };
});

// ── 2) الوحدات: فكرة للشيخ، أو حوار = دور المتحدث الآخر كاملاً + رد الشيخ ──
// حدّ الفكرة تكيّفي: سكتة أطول من ثلاثة أرباع سكتات الشيخ بين جمله (المتكلم البطيء يسكت وسط جملته)
const pauses = []; for (let k = 1; k < sents.length; k++) if (sents[k].sp === "sheikh" && sents[k - 1].sp === "sheikh" && contig(sents[k - 1].words[sents[k - 1].words.length - 1], sents[k].words[0])) pauses.push(gapOf(sents[k - 1], sents[k]));
pauses.sort((a, b) => a - b);
const IDEA_BREAK = Math.min(IDEA_GAP, Math.max(0.8, pauses[Math.floor(pauses.length * 0.75)] ?? 0.8));
const units = [];
for (let k = 0; k < sents.length;) {
  const s = sents[k];
  if (!s.core.length) { k++; continue; }
  if (known && isOther(s.sp)) {
    let j = k;
    for (;;) {
      if (j + 1 < sents.length && sents[j + 1].sp === s.sp) { j++; continue; }
      // مداخلة قصيرة من الشيخ أثناء تشغيل المقطع («اسمع الآن») ثم يعود المتحدث نفسه: الدور واحد
      let q = j + 1, d = 0; while (q < sents.length && sents[q].sp === "sheikh" && d + sents[q].dur < INTERJ_MAX) { d += sents[q].dur; q++; }
      if (q > j + 1 && q < sents.length && sents[q].sp === s.sp) { j = q; continue; }
      break;
    }
    const turn = sents.slice(k, j + 1), reply = []; let r = j + 1, rdur = 0;
    while (r < sents.length && sents[r].sp === "sheikh" && (rdur < REPLY_MIN || !reply[reply.length - 1].endOk) && rdur < REPLY_MAX) { if (sents[r].core.length) { reply.push(sents[r]); rdur += sents[r].dur; } r++; }
    units.push({ kind: "dialogue", sents: [...turn, ...reply], turn: { from: turn[0].k, to: turn[turn.length - 1].k, sp: s.sp }, reply: reply.length ? reply.map((x) => x.k) : [] });
    k = r; continue;
  }
  const pv = units[units.length - 1], pl = pv?.sents[pv.sents.length - 1];
  const pvDur = pv ? pl.c1 - pv.sents[0].c0 : 0;
  // الفكرة: جمل الشيخ المتصلة تُجمع حتى IDEA_MIN ثانية على الأقل؛ وجملة تبدأ بأداة ربط تلحق بفكرتها السابقة دائماً إن اتصلت بها
  if (pv && pv.kind === "point" && pl.k === s.k - 1 && canJoin(pl, s) && pvDur + s.dur <= POINT_MAX && (!s.startOk || !pl.endOk || (pvDur < IDEA_MIN && gapOf(pl, s) < IDEA_GAP) || gapOf(pl, s) < IDEA_BREAK)) { pv.sents.push(s); k++; continue; }
  units.push({ kind: "point", sents: [s] });
  k++;
}
const cutDur = mapJ.duration ?? segEnd(segs[segs.length - 1]);
for (const u of units) {
  const a = u.sents[0], b = u.sents[u.sents.length - 1];
  u.c0 = a.c0; u.c1 = b.c1; u.dur = u.c1 - u.c0 + PAD_B + PAD_A; u.k0 = a.k; u.k1 = b.k;
  const F = u.sents.reduce((o, x) => { for (const [n, v] of Object.entries(x.f)) o[n] = (o[n] ?? 0) + v; return o; }, {});
  u.f = F;
  let sc = 2 * Math.min(3, F.names) + 1.5 * Math.min(2, F.numbers) + 2 * Math.min(1, F.question) + 1.5 * Math.min(3, F.strong) + (u.kind === "dialogue" ? 2 : 0) - 4 * Math.min(1, F.formula);
  if (u.dur < 2.5) sc -= 2; if (u.dur > 25) sc -= (u.dur - 25) / 5;
  u.score = +sc.toFixed(2); u.density = sc / Math.sqrt(Math.max(1, u.dur));
  u.ok = a.startOk || u.kind === "dialogue" ? b.endOk && !(u.kind === "dialogue" && !u.reply.length) : false;
  if (u.kind === "dialogue" && !u.reply.length) u.noReply = true;
  u.hookScore = 2 * Math.min(1, F.question) + 2 * Math.min(2, F.shock) + Math.min(3, F.strong) + Math.min(2, F.names);
  u.conclScore = 2 * Math.min(2, F.concl) + Math.min(3, F.strong) + 4 * Math.max(0, u.c0 / cutDur - 0.75) / 0.25 + (u.kind === "point" ? 1 : 0);   // الأقرب إلى آخر الحلقة، وكلام الشيخ أولى
}

// ── 3) الاختيار ──
const pick = new Set(); let total = 0;
const add = (u) => { if (!u || pick.has(u)) return false; pick.add(u); total += u.dur; return true; };
const cand = units.filter((u) => u.ok && !u.f.formula && u.dur >= PART_MIN && u.dur <= tMax * 0.6);
const hookPool = cand.filter((u) => u.c0 < cutDur * 0.3 && u.dur >= KEY_MIN && u.dur <= HOOK_MAX && u.hookScore > 0);
const hook = hookPool.sort((a, b) => b.hookScore - a.hookScore || a.c0 - b.c0)[0] ?? cand.filter((u) => u.c0 < cutDur * 0.3).sort((a, b) => b.density - a.density)[0];
const conclPool = cand.filter((u) => u.c0 >= cutDur * 0.75 && u.dur >= KEY_MIN && u !== hook);
const concl = conclPool.sort((a, b) => b.conclScore - a.conclScore || b.density - a.density || b.c0 - a.c0)[0];
add(hook); add(concl);
const SECT = (rd(path.join(T, "sections.json"), []) ?? []).map((x) => +x.at).filter(Number.isFinite).sort((a, b) => a - b);
const nChunks = Math.max(3, Math.round(tMid / 18));
const bounds = SECT.length >= 2 ? [...SECT.map((x, j) => (j === 0 ? 0 : x)), cutDur] : Array.from({ length: nChunks + 1 }, (_, j) => (cutDur * j) / nChunks);
const covered = [];
for (let j = 0; j + 1 < bounds.length; j++) {
  const inSec = cand.filter((u) => u.c0 >= bounds[j] && u.c0 < bounds[j + 1]);
  if (inSec.some((u) => pick.has(u))) continue;
  const best = inSec.filter((u) => u.score > 0).sort((a, b) => b.density - a.density)[0];
  if (best && total + best.dur <= tMax) { add(best); covered.push(best); }
}
for (const u of [...cand].sort((a, b) => b.density - a.density)) {
  if (total >= tMid) break;
  if (u.score <= 0 || pick.has(u)) continue;
  if (total + u.dur <= tMax) add(u);
}
while (total > tMax && covered.length) { const w = covered.sort((a, b) => a.density - b.density).shift(); pick.delete(w); total -= w.dur; }

// ── 4) النطاقات: وحدات متجاورة تلتحم؛ الهوك أولاً ثم الترتيب الزمني ثم الخاتمة ──
const chron = [...pick].sort((a, b) => a.k0 - b.k0), groups = [];
for (const u of chron) {
  const g = groups[groups.length - 1];
  if (g && g.k1 + 1 === u.k0 && contig(sents[g.k1].words[sents[g.k1].words.length - 1], sents[u.k0].words[0]) && cutGap(sents[g.k1], sents[u.k0]) < JOIN_GAP) { g.units.push(u); g.k1 = u.k1; }
  else groups.push({ units: [u], k0: u.k0, k1: u.k1 });
}
const kindOf = (g) => (g.units.includes(hook) ? "hook" : g.units.includes(concl) ? "conclusion" : g.units.some((u) => u.kind === "dialogue") ? "dialogue" : "point");
const story = [...groups.filter((g) => kindOf(g) === "hook"), ...groups.filter((g) => !["hook", "conclusion"].includes(kindOf(g))), ...groups.filter((g) => kindOf(g) === "conclusion")];

/** حدّا نطاق بزمن الأصل من أول كلمة وآخر كلمة: في الفراغ بينهما وبين جارتيهما في التفريغ كله (لا قطع داخل كلمة) */
const edgesOf = (w0, w1) => {
  const pv = ALL[w0.i - 1], nx = ALL[w1.i + 1];
  const from = Math.min(w0.s, Math.max(w0.s - PAD_B, pv ? Math.max(pv.e, (pv.e + w0.s) / 2) : 0));
  const to = Math.max(w1.e, Math.min(w1.e + PAD_A, nx ? Math.min(nx.s, (w1.e + nx.s) / 2) : w1.e + PAD_A));
  return { from: +from.toFixed(3), to: +to.toFixed(3) };
};
/** قطع زمن القص لنطاق من الأصل (كما يقتطعها clip_slice) */
const piecesOf = (from, to) => { const out = []; for (const g of segs) { const lo = Math.max(g.a, from), hi = Math.min(g.b, to); if (hi - lo > 0.02) out.push([g.n + (lo - g.a), g.n + (hi - g.a)]); } return out; };
const wordsIn = (from, to) => IN.filter((w) => { const m = (w.s + w.e) / 2; return m >= from && m <= to; });
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
const rangeObj = (from, to, extra = {}) => {
  const pcs = piecesOf(from, to), ws = wordsIn(from, to);
  const dur = +pcs.reduce((a, [x, y]) => a + y - x, 0).toFixed(2);
  const turns = []; for (const w of ws) { const l = turns[turns.length - 1]; if (l && l.sp === w.sp) l.words.push(w.w); else turns.push({ sp: w.sp, words: [w.w] }); }
  return { ...extra, from, to, cutFrom: +(pcs[0]?.[0] ?? 0).toFixed(2), cutTo: +(pcs[pcs.length - 1]?.[1] ?? 0).toFixed(2), dur, words: ws.length, speakers: [...new Set(ws.map((w) => w.sp))], turns: turns.map((t) => ({ sp: t.sp, text: t.words.join(" ") })) };
};

// ── 5) فحص السياق لأي مجموعة نطاقات (القصة والبناء) ──
const sentOfWord = new Map(); for (const s of sents) for (const w of s.words) sentOfWord.set(w.i, s);
const turnsAll = units.filter((u) => u.kind === "dialogue");
const checkRanges = (ranges) => {
  const issues = [], incl = new Set();
  ranges.forEach((r, n) => {
    const ws = wordsIn(r.from, r.to), lab = `الجزء ${n + 1} (${mmss(r.cutFrom ?? 0)})`;
    if (!ws.length) { issues.push(`${lab}: بلا كلام`); return; }
    for (const w of ws) incl.add(w.i);
    for (const e of [r.from, r.to]) { const x = ALL.find((w) => w.s < e - 1e-3 && w.e > e + 1e-3); if (x) issues.push(`${lab}: حدّ ${e.toFixed(2)} داخل كلمة «${x.w}»`); }
    const a = ws[0], b = ws[ws.length - 1], sa = sentOfWord.get(a.i), sb = sentOfWord.get(b.i);
    const turnStart = isOther(a.sp) && turnsAll.some((u) => sents[u.turn.from].words[0].i === a.i);
    if (sa && a.i !== sa.words[0].i && a.i !== sa.core[0]?.i) issues.push(`${lab}: يبدأ وسط جملة عند «${a.w}»`);
    else if (!turnStart && (!startOk([a]) || FILL_START.has(tok(a)))) issues.push(`${lab}: يبدأ بأداة ربط «${a.w}»`);
    if (sb && b.i !== sb.words[sb.words.length - 1].i && b.i !== sb.core[sb.core.length - 1]?.i) issues.push(`${lab}: ينتهي وسط جملة عند «${b.w}»`);
    else if (DANGLE.has(tok(b))) issues.push(`${lab}: ينتهي بكلمة معلّقة «${b.w}»`);
  });
  for (const u of turnsAll) {
    const tw = sents.slice(u.turn.from, u.turn.to + 1).flatMap((s) => s.words), got = tw.filter((w) => incl.has(w.i)).length;
    if (!got) continue;
    const at = mmss(tw[0].cs ?? 0);
    if (got < tw.length) issues.push(`كلام ${spName(u.turn.sp)} عند ${at} مبتور (${got} من ${tw.length} كلمة)`);
    if (!u.reply.length) issues.push(`كلام ${spName(u.turn.sp)} عند ${at} بلا رد للشيخ بعده في الحلقة`);
    else if (!sents[u.reply[0]].core.some((w) => incl.has(w.i))) issues.push(`كلام ${spName(u.turn.sp)} عند ${at} بلا رد الشيخ الذي يليه`);
  }
  return issues;
};

const KIND_AR = { hook: "الهوك", conclusion: "الخاتمة", dialogue: "حوار", point: "فكرة", user: "نطاق المستخدم" };
const storyRanges = story.map((g, n) => { const a = g.units[0].kind === "dialogue" ? sents[g.k0].words[0] : sents[g.k0].core[0], b = sents[g.k1].core[sents[g.k1].core.length - 1]; const e = edgesOf(a, b); return rangeObj(e.from, e.to, { n: n + 1, kind: kindOf(g), score: +g.units.reduce((s, u) => s + u.score, 0).toFixed(1) }); });

const writeStory = () => {
  const tot = +storyRanges.reduce((a, r) => a + r.dur, 0).toFixed(1), issues = checkRanges(storyRanges);
  const spec = rd(path.join("data", "specs", `${P}.json`), {});
  const L = [`# قصة الريل${spec.title ? `: ${spec.title}` : ""}`, "",
    `- المدة: ${mmss(tot)} (${tot}ث) من ${storyRanges.length} أجزاء؛ المطلوب ${tMin}–${tMax}ث. الأوقات بزمن قص الحلقة (بلا الفاصل).`,
    `- المتحدثون: ${known ? `مميَّزون (${others.length ? `الشيخ و${others.map(spName).join(" و")}` : "الشيخ وحده"})` : "غير مميَّزين في التفريغ؛ الاختيار بالجمل وحدها ولم يُفحص سياق المتحدثين"}.`,
    `- الترتيب: الهوك أولاً، ثم الأجزاء بترتيبها في الحلقة، ثم الخاتمة.`, ""];
  for (const r of storyRanges) {
    L.push(`## ${r.n}) ${KIND_AR[r.kind]} — ${mmss(r.cutFrom)}–${mmss(r.cutTo)} (${Math.round(r.dur)}ث)`);
    for (const t of r.turns) L.push(`- **${spName(t.sp)}:** «${t.text}»`);
    L.push("");
  }
  L.push(issues.length ? `## ملاحظات السياق\n${issues.map((x) => `- ${x}`).join("\n")}\n` : "", "للاعتماد: «اعتمدها» تبني الريل بهذه الأجزاء وهذا الترتيب؛ أو اذكر أرقام الأجزاء بترتيبك (مثل 3، 1، 2)، أو أمدية بدقيقة:ثانية من الحلقة.");
  fs.writeFileSync(path.join(T, "reel_story.md"), L.join("\n") + "\n");
  fs.writeFileSync(path.join(T, "reel_ranges.json"), JSON.stringify({ episode: P, made: new Date().toISOString(), target: [tMin, tMax], sentenceGap: SG, wordsFrom, speakersFrom: speakersFrom ?? "none", total: tot, parts: storyRanges }, null, 1));
  console.log(`قصة الريل: ${storyRanges.length} أجزاء، ${mmss(tot)} (المطلوب ${tMin}–${tMax}ث) | الكلمات من ${wordsFrom}، المتحدثون: ${speakersFrom ?? "غير مميَّزين"}`);
  for (const r of storyRanges) console.log(`  ${r.n}) ${KIND_AR[r.kind]} ${mmss(r.cutFrom)}–${mmss(r.cutTo)} ${Math.round(r.dur)}ث [${r.speakers.map(spName).join("+")}] «${r.turns.map((t) => t.text).join(" | ").slice(0, 90)}…»`);
  if (issues.length) { console.log("⚠ ملاحظات السياق:"); issues.forEach((x) => console.log("  " + x)); }
  console.log(`→ ${path.join(T, "reel_story.md")}`);
  return issues;
};

if (has("story-only")) { const iss = writeStory(); process.exit(iss.length ? 1 : 0); }

// ── 6) البناء ──
const parseT = (x) => { const s = String(x).trim(); if (s.includes(":")) { const [m, q] = s.split(":").map(Number); return m * 60 + q; } return Number(s); };
let chosen = [], order = "story";
if (opt("ranges")) {
  const saved = rd(path.join(T, "reel_ranges.json"));
  order = "user";
  for (const tk of opt("ranges").split(/[,،]\s*/).map((x) => x.trim()).filter(Boolean)) {
    if (/^\d+$/.test(tk)) {
      const p = saved?.parts?.find((x) => x.n === +tk);
      if (!p) { console.error(`✘ لا جزء ${tk} في .tmp/${P}/reel_ranges.json (شغّل --story-only أولاً)`); process.exit(1); }
      chosen.push(rangeObj(p.from, p.to, { n: p.n, kind: p.kind }));
      continue;
    }
    const [x, y] = tk.split(/-(?=[\d.:])/).map(parseT);
    // الحدّ بزمن قص الحلقة ← كلمات كاملة: الكلمة التي يقع منتصفها في النطاق تبقى كلها، والباقي يخرج كله؛ والحشو المنفرد في الطرفين («و»، «يعني»…) يخرج كله
    const w0 = IN.filter((w) => w.c >= x && w.c <= y), ws = isOther(w0[0]?.sp) ? w0 : coreOf(w0);
    if (!ws.length || !(y > x) || cutToSrc(x) === null) { console.error(`✘ النطاق ${tk} بلا كلام في قص الحلقة`); process.exit(1); }
    const e = edgesOf(ws[0], ws[ws.length - 1]);
    chosen.push(rangeObj(e.from, e.to, { kind: "user", asked: tk }));
  }
} else if (has("approved")) {
  const saved = rd(path.join(T, "reel_ranges.json"));
  if (!saved?.parts?.length) { console.error(`✘ لا قصة محفوظة: شغّل --story-only واعرضها على المستخدم أولاً`); process.exit(1); }
  chosen = saved.parts.map((p) => rangeObj(p.from, p.to, { n: p.n, kind: p.kind }));
} else { console.error("✘ القصة أولاً: --story-only، ثم البناء بـ--approved (اعتمدها كما هي) أو --ranges (بترتيب المستخدم)"); process.exit(2); }

{ const sum = chosen.reduce((a, r) => a + r.dur, 0); if (sum > BUDGET - 4) { console.error(`✘ الريل ${sum.toFixed(1)}ث والحد ${BUDGET - 4}ث (حد القصير ${SL.SHORT_MAX}ث − الفاصل ${SL.bumperSeconds()}ث − 4ث احتياطاً لختم أو تجميد في آخره): احذف ${(sum - BUDGET + 4).toFixed(1)}ث على الأقل`); process.exit(1); } }
const issues = checkRanges(chosen);
if (issues.length) { console.log("⚠ مخالفات السياق:"); issues.forEach((x) => console.log("  " + x)); if (!has("as-is")) { console.error("✘ لم يُبنَ الريل: أصلح الأمدية أو مرّر --as-is بنص المستخدم"); process.exit(1); } }
const id = opt("out") ?? `${P}-reel`;
if (!/^[A-Za-z0-9_-]+$/.test(id)) { console.error(`✘ معرّف غير صالح ${id}`); process.exit(2); }
if (fs.existsSync(path.join("data", "specs", `${id}.json`)) || fs.existsSync(path.join("public", `${id}_cut_s.mp4`))) { console.error(`✘ ${id} موجود: اختر --out آخر أو احذفه أولاً`); process.exit(1); }
const epSpec = rd(path.join("data", "specs", `${P}.json`), {});
(await import("./cut_lazy.mjs")).ensureCut(P);   // the episode's cut video matches its cut list (tools/cut_lazy.mjs)
const video = epSpec.cut && fs.existsSync(path.join("public", epSpec.cut)) ? path.join("public", epSpec.cut) : null;
const t0 = Date.now(), gateF = path.join(".tmp", "gates", `${id}.audio.ok`);
const spanArg = chosen.map((r) => `${r.from}-${r.to}`).join(",");
console.log(`… الشريحة من ${video ?? "قص الحلقة"}: ${chosen.length} نطاقاً، ${chosen.reduce((a, r) => a + r.dur, 0).toFixed(1)}ث`);
const r1 = spawnSync(process.execPath, ["tools/stream/clip_slice.mjs", P, id, spanArg], { stdio: "inherit", windowsHide: true, env: { ...process.env, ...(video ? { SLICE_VIDEO: video } : {}), SLICE_AUDIO_CHECK: "1" } });
if (r1.status !== 0) { console.error("✘ فشل الاقتطاع"); process.exit(1); }
// الكلمات بمتحدثيها ← زمن الريل (القطع نفسها التي اقتطعها clip_slice، بعدد صحيح من الإطارات)
const pieces = [];
for (const r of chosen) for (const g of segs) { const lo = Math.max(g.a, r.from), hi = Math.min(g.b, r.to); if (hi - lo > 0.02) { const cs = g.n + (lo - g.a), ce = g.n + (hi - g.a), l = pieces[pieces.length - 1]; if (l && Math.abs(cs - l[1]) < 0.02) l[1] = ce; else pieces.push([cs, ce]); } }
for (const p of pieces) p[1] = p[0] + Math.max(1, Math.round((p[1] - p[0]) * 30)) / 30;
const off = []; let acc = 0; for (const [a, b] of pieces) { off.push(acc); acc += b - a; }
const D = +acc.toFixed(3);
const toChild = (t) => { for (let k = 0; k < pieces.length; k++) if (t >= pieces[k][0] - 1e-6 && t < pieces[k][1] + 1e-6) return t - pieces[k][0] + off[k]; return null; };
const RW = []; for (const r of chosen) for (const w of wordsIn(r.from, r.to)) { const m = toChild(w.c); if (m === null) continue; const d = w.e - w.s, s = Math.max(0, m - d / 2); RW.push({ w: w.w, s: +s.toFixed(3), e: +Math.min(D, s + d).toFixed(3), p: w.p, sp: w.sp, src: +w.s.toFixed(3) }); }
RW.sort((a, b) => a.s - b.s); RW.forEach((w, i) => (w.i = i));
const TR = path.join(".tmp", id);
fs.writeFileSync(path.join(TR, "words_table.json"), JSON.stringify({ model: `remapped from ${P} (${wordsFrom}) by reel_from_episode`, from: P, words: RW }));
// المتحدثون في الريل من كلماته المزاحة نفسها (أدوار متتابعة)، بدل نقل أدوار الحلقة التي قد يقع طرفها في سكتة محذوفة
if (known) {
  const turns = []; for (const w of RW) { const l = turns[turns.length - 1]; if (l && l.name === w.sp && w.s - l.e < 1.5) { l.e = w.e; l.text += " " + w.w; } else turns.push({ s: w.s, e: w.e, spk: w.sp, name: w.sp, text: w.w }); }
  fs.writeFileSync(path.join(TR, "speakers.json"), JSON.stringify({ speakers: spk?.speakers ?? {}, turns, from: P }));
  fs.writeFileSync(path.join(TR, "speakers.txt"), turns.map((t) => `[${t.s.toFixed(1)}–${t.e.toFixed(1)}] ${t.name}: ${t.text}`).join("\n") + "\n");
}
const cw = rd(path.join(TR, "cut_words.json"), []);
fs.writeFileSync(path.join(TR, "reel_source.json"), JSON.stringify({ episode: P, order, wordsFrom, speakersFrom: speakersFrom ?? "none", ranges: chosen.map(({ turns, ...r }) => r), duration: D }, null, 1));
const spec = { id, title: epSpec.title ?? id, cut: `${id}_cut_s.mp4`, duration: D, frames: Math.round(D * 30), fps: 30, kind: "reel", showTitleBar: false, cams: [], zooms: [], shake: [], items: [coverItem(id, { kind: "reel", fromEpisode: { project: P } })], date: epSpec.date ?? new Date().toISOString().slice(0, 10), fromEpisode: { project: P, order, ranges: chosen.map((r) => ({ from: r.from, to: r.to, cutFrom: r.cutFrom, cutTo: r.cutTo })) } };
fs.writeFileSync(path.join("data", "specs", `${id}.json`), JSON.stringify(spec, null, 1));
// ── 7) البوابة على الناتج ──
const probe = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path.join("public", `${id}_cut_s.mp4`)], { encoding: "utf8", windowsHide: true });
const fileD = Number(String(probe.stdout).trim()), tol = RULES.fileTolerance ?? 0.15;
const want = chosen.reduce((a, r) => a + r.words, 0);
const gate = [
  [`طول الملف ${fileD.toFixed(2)}ث = الخريطة ${D}ث (±${tol})`, Math.abs(fileD - D) <= tol],
  [`الكلمات المزاحة ${RW.length} = كلمات الأمدية ${want}`, RW.length === want],
  [`كلمات القص المزاحة ${cw.length} مرتبة`, cw.length > 0 && cw.every((w, i) => !i || w.s >= cw[i - 1].s - 1e-3)],
  ["لا حدّ داخل كلمة، وسياق كل متحدث تام", !issues.length || has("as-is")],
];
const audioOk = fs.existsSync(gateF) && fs.statSync(gateF).mtimeMs >= t0;
console.log(`${audioOk ? "✔" : "✘"} بوابة الصوت على الشريحة${audioOk ? "" : `: بقي حسم «للمراجعة» (حذف أو سبب الإبقاء في .tmp/${id}/noise_ok.json) ثم إعادتها`}`);
gate.push(["بوابة الصوت", audioOk]);
for (const [t, ok] of gate) console.log(`${ok ? "✔" : "✘"} ${t}`);
console.log(`الريل ${id}: ${mmss(D)} من ${chosen.length} أجزاء (${order === "user" ? "بترتيب المستخدم" : "بترتيب القصة"}) → data/specs/${id}.json (kind reel)؛ بلا رندر. التالي: مراحل الريل في الشجرة من الاستخراج.`);
process.exit(gate.every(([, ok]) => ok) ? 0 : 1);
