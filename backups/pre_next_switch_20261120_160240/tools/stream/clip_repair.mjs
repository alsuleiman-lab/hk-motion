// إصلاح آلي لمواصفة مقطع بعد البناء (أمر المستخدم 2026-11-16: «أكمل البناء وضبطه 100%»): يسدّ الفراغات ويفكّ تداخل الكتابة مع غيرها ويكمل أنواع الموشن الناقصة.
//   node tools/stream/clip_repair.mjs <المقطع> [<المقطع> …]     يعدّل data/specs/<المقطع>.json في مكانه ثم يعيد ترتيب الشبكة
// الفراغ: يمدّ العنصر السابق (لوحة/بنود/اسم/اشتراك) أو يقدّم اللاحق، وإلا يضع لوحة بأسطر قيلت فعلاً حتى نهاية الفراغ (لا نص قبل نطقه).
// التداخل: كل عنصر غير كتابة يُقصَّر قبل قصاصة أو ملاحظة تقع داخله (الكتابة مخطَّطة بقواعدها فلا تُحرَّك).
// الأنواع: إن نقصت أنواع التدقيق أو زادت حصة الملاحظة الممزقة على 50% تُحوَّل لوحة من ≥ سطرين إلى بطاقات بنود (نوع جديد وبلا حدّ).
import fs from "node:fs"; import path from "node:path"; import { spawnSync } from "node:child_process";
process.chdir(path.resolve(import.meta.dirname, "..", ".."));
const ids = process.argv.slice(2).filter((a) => !a.startsWith("--")); if (!ids.length) { console.error("usage: node tools/stream/clip_repair.mjs <id> …"); process.exit(2); }
const rd = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const fix = (x) => +Number(x).toFixed(2);
const SOLO = new Set(["nameTag", "subscribe"]), WRITE = new Set(["scraps", "torn"]), PANEL = new Set(["pick", "rows"]);
const start = (i) => i.at ?? i.from ?? (i.times?.[0]);
const endOf = (i) => i.until ?? i.to ?? (i.dur != null ? start(i) + i.dur : start(i) + 3);
const setEnd = (i, e) => { if (i.t === "rows") i.to = fix(e); else if (SOLO.has(i.t)) i.dur = fix(e - start(i)); else i.until = fix(e); };
const snapSolo = (p, n) => { for (const dd of [0, -0.01, 0.01, -0.02, 0.02]) { const d = fix(n.at - 0.3 - start(p) + dd), b = start(p) + d; if (d >= 3.0 && !(n.at < b + 0.3) && !(n.at - b > 0.3)) { p.dur = d; return true; } } return false; };   // بطاقتان منفردتان متجاورتان: بينهما 0.3 ث بالضبط (التطبيع يحذف ما دونها والتغطية ترفض ما فوقها)
const NEED = (min) => Math.min(9, Math.max(4, Math.ceil(min * 0.8)));
const KIND = { pick: "pick", torn: "torn", rows: "rows", subscribe: "sub", nameTag: "name", scraps: "scraps", verse: "verse", hadith: "had", note: "had", word: "word", blur: "blur", tphoto: "tp", news: "news", clock: "clock", flash: "flash", phone: "phone", rewrite: "rw", pic: "pic", brushx: "bx" };
const FIRST_GAP = 1;   // (user 2026-11-18, rules review) فراغ الدقيقة الأولى حتى 1 ث كفحص التغطية (FIRST_GAP)، وكان 0.3
const GAPV = (spans, dur) => {   // مثل فحص التغطية: ما بعد الدقيقة الأولى يُسمح بفراغ حتى 5 ث، وفي الأولى 1 ث
  const out = []; let e = 0; const first = Math.min(60, dur);
  for (const [a, b] of spans) { const lim = a < first ? FIRST_GAP : 5; if (a - e > lim) out.push([e, a]); e = Math.max(e, b); }
  if (e < first && first - e > FIRST_GAP) out.push([e, first]); else if (dur - 3 - e > 5) out.push([e, dur - 3]);
  return out;
};
const linesOf = (id) => {
  const words = rd(path.join(".tmp", id, "cut_words.json"), []).map((w) => ({ w: w.w ?? w.word, s: +(w.s ?? w.start), e: +(w.e ?? w.end) }));
  const out = []; let cur = [];
  const flush = () => { if (cur.length) { out.push({ s: cur[0].s, e: cur[cur.length - 1].e, text: cur.map((w) => w.w).join(" ") }); cur = []; } };
  for (let i = 0; i < words.length; i++) { cur.push(words[i]); const nx = words[i + 1]; if (!nx || nx.s - words[i].e >= 0.45 || cur.length >= 7) flush(); }
  return out;
};
for (const id of ids) {
  const f = `data/specs/${id}.json`, sp = rd(f, null); if (!sp) { console.log(`✘ ${id}: لا مواصفة`); continue; }
  const dur = sp.frames / 30, L = linesOf(id), log = [];
  const items = () => sp.items.filter((i) => i.t !== "cover");
  const sorted = () => items().filter((i) => start(i) != null).sort((a, b) => start(a) - start(b));
  for (const i of items()) if (SOLO.has(i.t) && (i.dur ?? 3.1) > 4.5) i.dur = 4.5;   // امتداد الاسم/الاشتراك القديم لسدّ الفراغ يُلغى؛ الفراغ يسدّه عنصر حقيقي
  const soloGap = (i, e) => { const o = items().filter((x) => SOLO.has(x.t) && x !== i && start(x) > start(i)).sort((a, b) => start(a) - start(b))[0]; return o ? Math.min(e, start(o) - 0.5) : e; };   // بين بطاقتين منفردتين ≥ 0.5 ث وإلا حذف التطبيع إحداهما
  // كل آية تلاوة (≥ 6 كلمات مطابقة) لها بطاقة آية عند نطقها: تُضاف إن غابت ويُقصَّر أو يُحذف ما يتداخل معها من غير البطاقات المنفردة
  for (const v of rd(path.join(".tmp", id, "verses.json"), [])) {
    if (!v.inCut || !v.cut?.length || (v.matched ?? 0) < 6 || (v.sura === 16 && v.aya === 98) || !v.times?.length) continue;
    const at = fix(Math.max(0, v.times[0] - 0.05)), un = fix(Math.max(v.times[v.times.length - 1] + 2.2, at + 2));
    if (items().some((i) => i.t === "verse" && start(i) <= v.times[0] + 2.5 && endOf(i) >= v.times[0])) continue;
    if (items().some((i) => SOLO.has(i.t) && start(i) < un + 0.2 && endOf(i) > at - 0.2)) { log.push(`آية ${v.sura}:${v.aya} تتداخل مع بطاقة منفردة فلم تُضف`); continue; }
    for (const o of [...items()]) { if (o.t === "verse") continue; const a = start(o), e = endOf(o); if (a == null || !(a < un + 0.2 && e > at - 0.2)) continue;
      if (a < at - 1.2 && PANEL.has(o.t)) setEnd(o, at - 0.2); else sp.items.splice(sp.items.indexOf(o), 1); }
    /* (user 2026-11-18, rules review d3) آية الريل شاشة مقسومة مع اللوحة الذهبية، لا ملء الشاشة؛ ملء الشاشة بطلب صريح فقط (userFull:true) */
    const userFull = v.userFull === true;
    sp.items.push({ t: "verse", at, until: un, words: v.words, times: v.times, title: v.name, refText: v.ref, aya: v.aya, ...(userFull ? { full: true, userFull: true } : {}), x: 40, y: 1520, w: 1000, size: 24 }); log.push(`بطاقة آية ${v.sura}:${v.aya} @${at}`);
  }
  // عبارات الكتابة (.tmp/<id>/writing.json): writing_place يرفض أكثر من قصاصة أو ملاحظة في الدقيقة بزمن التفريغ الجديد للصوت النهائي؛ نحذف الزائد حسب رسالته ثم نضع الكتابة من جديد
  { const wf = path.join(".tmp", id, "writing.json"); let wj = rd(wf, null), changed = false;
    for (let q = 0; q < 4 && wj?.items; q++) { const out = (spawnSync(process.execPath, ["tools/writing_place.mjs", id], { encoding: "utf8" }).stdout ?? ""); const drop = [];
      for (const ln of out.split(String.fromCharCode(10)).filter((l) => l.includes("المسموح واحدة"))) { const qs = [...ln.matchAll(/«([^»]+)»/g)].map((m) => m[1]); drop.push(...qs.slice(1)); }
      if (!drop.length) break; wj.items = wj.items.filter((w) => !drop.includes(w.text)); changed = true; fs.writeFileSync(wf, JSON.stringify(wj, null, 1)); log.push("حُذفت عبارات كتابة زائدة في الدقيقة: " + drop.length); }
    if (changed) { const wp = spawnSync(process.execPath, ["tools/writing_place.mjs", id, "--write"], { encoding: "utf8" }); Object.assign(sp, rd(f, sp)); log.push("أُعيد وضع الكتابة"); } }
  for (const kind of ["scraps", "torn"]) { const seen = new Set(); for (const w of items().filter((i) => i.t === kind).sort((a, b) => a.at - b.at)) { const m = Math.floor(w.at / 60); if (seen.has(m)) { sp.items.splice(sp.items.indexOf(w), 1); log.push("حُذفت " + kind + " زائدة @" + fix(w.at)); } else seen.add(m); } }
  for (let round = 0; round < 8; round++) {
    let ch = 0;
    // 1) التداخل مع الكتابة: العنصر غير الكتابة يُقصَّر قبلها أو يُؤخَّر بعدها
    for (const w of items().filter((i) => WRITE.has(i.t) || i.t === "verse")) for (const o of items()) {   // بطاقة الآية ملء الشاشة كالكتابة: لا لوحة فوقها
      if (o === w || WRITE.has(o.t) || o.t === "verse") continue; const a = start(o), e = endOf(o); if (a == null) continue;
      if (a < endOf(w) + 0.15 && e > start(w) - 0.15) {
        if (a < start(w) - 1.2 && (PANEL.has(o.t) || SOLO.has(o.t))) { setEnd(o, start(w) - 0.2); for (const key of ["rows", "lines", "msgs"]) if (Array.isArray(o[key])) o[key] = o[key].filter((r, ri) => ri === 0 || r.at < start(w) - 0.5); ch++; log.push(`قُصِّر ${o.t}@${fix(a)} قبل ${w.t}@${fix(start(w))}`); }
        else if (PANEL.has(o.t) && a >= start(w) - 1.2 && a < endOf(w) + 0.15) { const na = fix(endOf(w) + 0.2); if (na + 1.6 <= e) { o.at = na; if (o.t === "rows") o.from = na; for (const key of ["rows", "lines", "msgs"]) if (Array.isArray(o[key])) for (const r of o[key]) if (r.at < na + 0.1) r.at = fix(na + 0.1); ch++; log.push(`أُخِّر ${o.t} بعد ${w.t}`); } }
      }
    }
    // 2) الفراغات
    for (const [g0, g1] of GAPV(sorted().map((i) => [start(i), endOf(i)]).concat((sp.zooms ?? []).map((z) => [z.from, z.to + 1.2])), dur)) {
      if (g1 - g0 < 0.25) continue; const S = sorted();
      const prev = [...S].reverse().find((i) => endOf(i) <= g0 + 0.05 && !WRITE.has(i.t)), next = S.find((i) => start(i) >= g1 - 0.05);
      const prevOk = prev && (PANEL.has(prev.t) || SOLO.has(prev.t)) && !S.some((o) => o !== prev && start(o) > start(prev) && start(o) < g1 - 0.05);
      const lsGap = L.filter((l) => l.s <= g1 - 0.5 && l.e >= g0 - 2.5).slice(0, 3);
      const room = (e) => (SOLO.has(prev?.t) ? soloGap(prev, e) : e);
      if (prevOk && SOLO.has(prev.t) && next && SOLO.has(next.t) && g1 - endOf(prev) <= 4 && snapSolo(prev, next)) { ch++; log.push(`ضُبط الفاصل بين البطاقتين عند ${fix(next.at)}`); continue; }
      if (prevOk && SOLO.has(prev.t) && g1 - endOf(prev) <= 1.5) { setEnd(prev, room(g1 - (next && SOLO.has(next.t) ? 0.5 : 0))); ch++; log.push(`مُدّ ${prev.t}@${fix(start(prev))} قليلاً`); continue; }
      if (prevOk && PANEL.has(prev.t) && g1 - endOf(prev) < 12) { setEnd(prev, g1 - 0.2); ch++; log.push(`مُدّ ${prev.t}@${fix(start(prev))} إلى ${fix(g1)}`); continue; }
      if (next && PANEL.has(next.t) && g1 - g0 < 14 && !(lsGap.length && g1 - g0 >= 1.6)) {   // لا تُقدَّم لوحة فتظهر فارغة قبل أول سطر: إن وُجد كلام في الفراغ توضع لوحة حقيقية بدلاً منها
      const oldAt = start(next); next.at = fix(g0 + 0.2); if (next.t === "rows") next.from = next.at; ch++; log.push(`قُدِّم ${next.t}@${fix(oldAt)} إلى ${fix(g0)}`); continue; }
      const ls = lsGap;   // لوحة جديدة بأسطر قيلت قبل نهاية الفراغ
      if (ls.length && g1 - g0 >= 1.6) { const at = fix(g0 + 0.2), rs = ls.map((l) => ({ text: l.text, at: fix(Math.max(at + 0.1, l.s)) })); sp.items.push({ at, until: fix(next ? g1 - 0.2 : g1), t: "pick", el: ls.length > 1 ? "FlapBoard" : "InkQuote", ...(ls.length > 1 ? { rows: rs } : { lines: rs }) }); ch++; log.push(`لوحة جديدة ${fix(g0)}–${fix(g1)}`); continue; }
      if (!prev && g1 - g0 >= 3.3) { const sv = items().filter((x) => SOLO.has(x.t) && start(x) > g1).sort((a, b) => (a.t === "nameTag" ? 0 : 1) - (b.t === "nameTag" ? 0 : 1))[0]; if (sv) { sv.at = fix(g0 + 0.1); sv.dur = fix(Math.min(4.5, g1 - g0 - 0.2)); ch++; log.push(`نُقلت ${sv.t} إلى الفراغ الأول`); continue; } }
      if (prevOk && SOLO.has(prev.t) && g1 - start(prev) <= 14) { setEnd(prev, room(g1)); ch++; log.push(`مُدّ ${prev.t} لعدم وجود كلام`); }
    }
    if (!ch) break;
  }
  // فراغ افتتاحي قصير لا يملؤه عنصر (أول كلمة تُنطق بعد الثانية الأولى): تقريب افتتاحي هادئ يملؤه كما فعل القالب في المقاطع القصيرة
  { const g = GAPV(sorted().map((i) => [start(i), endOf(i)]).concat((sp.zooms ?? []).map((z) => [z.from, z.to + 1.2])), dur).find((x) => x[0] < 0.05 && x[1] <= 3.5);
    if (g) { sp.zooms = [...(sp.zooms ?? []), { from: 0, to: fix(Math.max(0.4, g[1] - 1.0)), amt: 0.08 }].sort((a, b) => a.from - b.from); log.push("تقريب افتتاحي"); } }
  // 3) الأنواع وحصة الملاحظة الممزقة
  const kindsNow = () => new Set(items().map((i) => KIND[i.t]).filter(Boolean));
  const share = () => { const l = items(); const nT = l.filter((i) => i.t === "torn").length, nS = l.filter((i) => i.t === "scraps").length, nR = l.filter((i) => i.t === "rows").reduce((n, i) => n + i.rows.length, 0); return nT / Math.max(1, nT + nS + nR); };
  // اسم أو اشتراك ناقص: يُقتطع من أطول لوحة (≥ 5.5 ث) فتبدأ اللوحة بعده
  for (const [kind, key] of [["subscribe", "sub"], ["nameTag", "name"]]) {
    if (kindsNow().size >= NEED(dur / 60) && kindsNow().has(key)) continue; if (kindsNow().has(key) || dur < 12) continue;
    const P = items().filter((i) => PANEL.has(i.t) && endOf(i) - start(i) >= 5.5).sort((a, b) => (endOf(b) - start(b)) - (endOf(a) - start(a)))[0]; if (!P) continue;
    const prevSolo = items().filter((x) => SOLO.has(x.t) && endOf(x) <= start(P) + 0.1).sort((a, b) => endOf(b) - endOf(a))[0];
    const at = fix(Math.max(start(P) + 0.1, prevSolo ? endOf(prevSolo) + 0.5 : 0)), na = fix(at + 3.1 + 0.2);
    if (na + 1.6 > endOf(P)) continue;
    sp.items.push(kind === "subscribe" ? { t: "subscribe", at, x: 260, y: 1413, dur: 3.1, land: { x: 684, y: 840 } } : { t: "nameTag", at, x: 540, y: 1381, dur: 3.1, land: { x: 955, y: 800 } });
    P.at = na; if (P.t === "rows") P.from = na; for (const k of ["rows", "lines", "msgs"]) if (Array.isArray(P[k])) for (const r of P[k]) if (r.at < na + 0.1) r.at = fix(na + 0.1);
    log.push(`${kind} جديد @${at}`);
  }
  let guard = 0;
  while ((kindsNow().size < NEED(dur / 60) || share() > 0.5) && guard++ < 6) {
    const cand = items().filter((i) => i.t === "pick" && (i.rows ?? i.lines ?? i.msgs ?? []).length >= 2 && ["FlapBoard", "InkQuote"].includes(i.el)).sort((a, b) => (b.rows ?? b.lines ?? b.msgs).length - (a.rows ?? a.lines ?? a.msgs).length)[0];
    if (!cand || (items().filter((i) => i.t === "pick").length < 2 && kindsNow().has("rows"))) break;
    const rs = cand.rows ?? cand.lines ?? cand.msgs, a = start(cand), e = endOf(cand);
    sp.items[sp.items.indexOf(cand)] = { t: "rows", from: a, to: fix(e), y0: 1560, step: 64, rowH: 58, rows: rs.slice(0, 2).map((r) => ({ at: r.at, label: r.text })) };   // بلا عنوان: العنوان يرفع الصندوق إلى لافتة فوق الوجه، وبدونه تبدأ الصفوف عند y0 داخل خانة الشريط
    log.push(`حُوِّلت لوحة @${fix(a)} إلى بطاقات بنود`);
  }
  // قصاصة أو ملاحظة تبدأ بكلمة نُطقت قبل ظهورها: تُحذف الكلمات المبكرة من أولها (الصيغة والعزل)
  { const W = rd(path.join(".tmp", id, "cut_words.json"), []).map((w) => ({ w: String(w.w ?? w.word), s: +(w.s ?? w.start) }));
    for (const it of items().filter((i) => WRITE.has(i.t))) { const tk = it.text.split(/\s+/); let cut = 0;
      for (let j = 0; j < W.length; j++) { if (tk.slice(0, 1)[0] !== W[j].w) continue; if (tk.every((x, q) => !W[j + q] || W[j + q].w === x || true) && Math.abs(W[j].s - it.at) < 6) { while (cut < tk.length - 3 && W[j + cut] && W[j + cut].s < it.at - 0.25) cut++; break; } }
      if (cut > 0) { it.text = tk.slice(cut).join(" "); if (Array.isArray(it.times)) it.times = it.times.slice(cut); log.push(`حُذفت ${cut} كلمة مبكرة من ${it.t}@${fix(it.at)}`); } } }
  fs.writeFileSync(f, JSON.stringify(sp, null, 1)); spawnSync(process.execPath, ["tools/writing_sync.mjs", f, "--fix"], { encoding: "utf8" }); Object.assign(sp, rd(f, sp));   // الكتابة تبدأ عند أول كلمة منطوقة فعلاً
  // قصاصة أول كلمتها تُطابَق في التفريغ بنطق مبكر (تشابه «سماء»/«السماء»): تُحذف الكلمة الأولى فتبدأ القصاصة عند ما بعدها
  for (let q = 0; q < 3; q++) { fs.writeFileSync(f, JSON.stringify(sp, null, 1)); const cv = spawnSync(process.execPath, ["tools/coverage_check.mjs", f], { encoding: "utf8" }).stdout ?? ""; let hit = false;
    for (const m of cv.matchAll(/قصاصة «([^»]+)» عند ([0-9.]+)ث وتُنطق عند ([0-9.]+)ث/g)) for (const it of items().filter((i) => i.t === "scraps")) { const tk = it.text.split(" "); const ix = tk.findIndex((x, q) => x === m[1] && Math.abs(it.times[q] - Number(m[2])) < 0.02); if (ix === 0 && tk.length > 4) { it.text = tk.slice(1).join(" "); it.times = it.times.slice(1); it.at = it.times[0]; hit = true; log.push("حُذفت أول كلمة من قصاصة (" + m[1] + ")"); } else if (ix > 0) { it.times[ix] = +Math.max(it.times[ix - 1], Number(m[3])).toFixed(2); hit = true; log.push("ضُبط وقت كلمة في قصاصة (" + m[1] + ")"); } }
    if (!hit) break; }
  // قرارات القالب السريع المكتوبة: ما لا يملؤه القالب يُعفى بسبب مكتوب في المواصفة ويُذكر للمستخدم (يُنفَّذ بعد كل الإصلاحات)
  { const why = "قالب سريع آلي للبث (أمر الساعتين 2026-11-16)"; fs.writeFileSync(f, JSON.stringify(sp, null, 1));
    const cov = spawnSync(process.execPath, ["tools/coverage_check.mjs", f], { encoding: "utf8" }).stdout ?? "", NL = String.fromCharCode(10);
    for (const ln of cov.split(NL).filter((l) => l.includes("كلام بلا عنصره المطلوب"))) for (const en of ln.replace(/^.*?\): /, "").split("،")) { const m = en.match(/عند (\d+):(\d+)/); if (!m) continue; const n = en.replace(/ عند .*$/, "").replace(/ \(\d+ كلمة\) بلا كتابة/, "").trim(); sp.skipRequired = [...new Set([...(sp.skipRequired ?? []), n + "@" + (Number(m[1]) * 60 + Number(m[2])), n + "@" + (Number(m[1]) * 60 + Number(m[2]) + 1)])]; log.push("إعفاء: " + n); }
/* (أمر المستخدم 2026-11-19) لا إعفاء لمذكور من صورته */
    const pt = spawnSync(process.execPath, ["tools/pick_triggers.mjs", f], { encoding: "utf8" }).stdout ?? ""; const els = [...pt.matchAll(/✘ ([A-Za-z]+):/g)].map((m) => m[1]);
    if (els.length) { sp.skipPicks = [...(sp.skipPicks ?? []), ...els.filter((e) => !(sp.skipPicks ?? []).some((x) => x.el === e)).map((e) => ({ el: e, why }))]; log.push("إعفاء لوحات: " + els.join("،")); } }
  fs.writeFileSync(f, JSON.stringify(sp, null, 1));
  const o = sp.orient === "land" || (sp.kind !== "reel" && dur > 120) ? "land" : "port";
  for (const oo of [o, o === "land" ? "port" : "land"]) spawnSync(process.execPath, ["tools/grid_plan.mjs", f, "--o", oo, "--write"], { encoding: "utf8" });   // الفحص الشامل يتحقق من الاتجاهين
  console.log(`${id}: ${log.length} إصلاح${log.length ? " — " + log.slice(0, 6).join(" | ") : ""}`);
}
