// بناء مقاطع البث آلياً من نقطة البداية والنهاية والعنوان والغلاف فقط (أمر المستخدم 2026-11-16: «ضع لهم نقطة البداية والنهاية لكل مقطع واسماً وغلافاً… وهو يقصّ الصوت وما شابه»).
//   node tools/stream/clip_autobuild.mjs <بث> [id,id…] [--run]
// المدخلات: .tmp/<بث>/plan.json (البداية والنهاية بعبارتين منطوقتين، تُقتطع بها الشرائح) و.tmp/<بث>/titles.json = { "<id>": { title, main, accent?, sub?, brand?, pose?, bg? } }
//   title = عنوان التصدير (≤99 حرفاً) · main/accent/sub = كلمات الغلاف · bg = رقم خلفية من public/stream_bg (1–6) أو مسار صورة · pose = رقم وضعية الشيخ (03/06/07/10)
// الناتج: .tmp/<بث>/build.json بصيغة clip_build.mjs؛ وبـ--run يبني ويسجّل كل مقطع (clip_build: يسجّل التركيبات تلقائياً بـspec_register). كل زمن من كلمات المقطع بعد القص (cut_words.json)، وكل كتابة بنص كلامه حرفياً.
// القالب: سطور من كلام الشيخ (حتى 7 كلمات) تُرصّ بلا فراغ: بطاقة سؤال وجواب حيث يتبدّل المتكلم (متصل ← شيخ)، ثم لوحة بنود، ثم قصاصة، بالتناوب؛ والاسم والاشتراك في فجوتين محجوزتين (عنصر منفرد).
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import { spawnSync } from "node:child_process";
try { os.setPriority(process.pid, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* best effort */ }
process.chdir(path.resolve(import.meta.dirname, "..", ".."));
const [P, only0, ...more] = process.argv.slice(2);
if (!P) { console.error("usage: node tools/stream/clip_autobuild.mjs <stream> [id,id] [--run]"); process.exit(2); }
const run = [only0, ...more].includes("--run"), onlyArg = only0 && !only0.startsWith("--") ? new Set(only0.split(",")) : null;
const rd = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const plan = rd(path.join(".tmp", P, "plan.json"), null), titles = rd(path.join(".tmp", P, "titles.json"), {});
if (!plan) { console.error(`لا خطة .tmp/${P}/plan.json`); process.exit(1); }
if (run) {
  const cfg = rd(path.join(".tmp", P, "prep_config.json"), {}), source = path.resolve(cfg.source ?? path.join("public", `${P}_src.mp4`));
  if (!fs.existsSync(source)) { console.error(`✘ لا يوجد فيديو المصدر للبناء: ${source} — أعد وضع نسخة المصدر في مساحة S ثم أعد هذا المقطع وحده.`); process.exit(1); }
}
const MAXW = 7, GAP = 0.45, HOLD = 2.85;
const workTmp = path.resolve(".tmp");
const childEnv = { ...process.env, TEMP: workTmp, TMP: workTmp, TMPDIR: workTmp.replace(/\\/g, "/"), HF_HOME: "S:/AI_Tools/ComfyUI_models/huggingface",
  PIP_CACHE_DIR: path.join(workTmp, "pip"), PYTHONPYCACHEPREFIX: path.join(workTmp, "pyc"), PYTHONIOENCODING: "utf-8",
  NODE_OPTIONS: [process.env.NODE_OPTIONS, `--import ${new URL("../hide_windows.mjs", import.meta.url).href}`, process.env.NODE_OPTIONS_EXTRA].filter(Boolean).join(" ") };
/* the due-picks list of one clip lives in its OWN file (.tmp/<stream>/needs_picks/<id>.json; the old single needs_picks.json was a read-modify-write shared by 3 parallel processes and lost entries); written whole, via rename */
const writeNeeds = (id, due) => {
  const dir = path.join(".tmp", P, "needs_picks"), file = path.join(dir, `${id}.json`);
  fs.mkdirSync(dir, { recursive: true }); const tmp = `${file}.${process.pid}.tmp`; fs.writeFileSync(tmp, JSON.stringify(due, null, 1)); fs.renameSync(tmp, file);
};
const fix = (x) => +x.toFixed(2);
const clip = (s, n) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…");
const lines = (words, turns) => {
  const out = []; let cur = [];
  const flush = () => { if (cur.length) { const s = cur[0].s, e = cur[cur.length - 1].e, mid = (s + e) / 2, t = turns.find((u) => mid >= u.s - 0.05 && mid <= u.e + 0.05); out.push({ s, e, text: cur.map((w) => w.w).join(" "), who: t ? (t.name === "sheikh" ? "sheikh" : "other") : "sheikh", n: cur.length }); cur = []; } };
  for (let i = 0; i < words.length; i++) { cur.push(words[i]); const nx = words[i + 1]; if (!nx || nx.s - words[i].e >= GAP || cur.length >= MAXW) flush(); }
  // سطر قصير جداً (< 3 كلمات) يُضمّ إلى التالي إن كان المتكلم نفسه
  const m = []; for (const l of out) { const p = m[m.length - 1]; if (p && p.n < 3 && p.who === l.who && l.s - p.e < 1) { p.e = l.e; p.text += " " + l.text; p.n += l.n; } else m.push({ ...l }); }
  return m;
};
const build = (c) => {
  const id = c.id, T = titles[id]; if (!T) throw new Error(`${id}: لا عنوان في titles.json`);
  const words = rd(path.join(".tmp", id, "cut_words.json"), []).map((w) => ({ w: w.w ?? w.word, s: +(w.s ?? w.start), e: +(w.e ?? w.end) }));
  const turns = rd(path.join(".tmp", id, "speakers.json"), { turns: [] }).turns ?? [];
  const dur = rd(path.join("public", `${id}_map.json`), { duration: 0 }).duration;
  if (!words.length || !dur) throw new Error(`${id}: لا كلمات أو لا خريطة بعد التقسيم`);
  // مؤشر زمني واحد: كتلة بعد كتلة بلا فراغ؛ الاسم ثم الاشتراك يُوضعان حين يبلغ المؤشر موضعهما فيُحجز لهما ثلاث ثوانٍ ونصف وحدهما
  const V = rd(path.join(".tmp", id, "verses.json"), []).filter((v) => v.inCut !== false && v.times?.length), ist = V.filter((v) => v.sura === 16 && v.aya === 98), VV = V.filter((v) => !(v.sura === 16 && v.aya === 98));   // أعوذ بالله من الشيطان الرجيم تُكشف آيةً وليست تلاوة
  const L = lines(words, turns), items = [], kinds = [], writing = [], wrMin = { S: new Set(), T: new Set() }; const lastWordEnd = (l) => { const nx = words.find((w) => w.s > l.e - 0.01 && w.s >= l.e); return nx ? nx.s : l.e + 0.6; }; let t = 0, k = 0, i = 0, nameDone = dur < 14, subDone = dur < 16, tn = null, ts = null;
  const wantName = Math.min(12, dur / 4), wantSub = Math.min(40, dur * 0.45);   // اشتراك لكل مقطع ≥ 16 ث (نوع رابع في التدقيق للمقاطع القصيرة)
  const solo = () => { const x = fix(Math.min(t, dur - 3.2)); t = x + 3.1 + 0.2; return x; };
  if (dur >= 16 && dur < 40) { ts = solo(); subDone = true; kinds.push("SOLO"); }   // المقطع القصير: الاشتراك أولاً ثم الاسم (نوع رابع في التدقيق بلا فراغ)
  while (i < L.length) {
    if (!nameDone && t >= wantName && kinds[kinds.length - 1] !== "SOLO") { tn = solo(); nameDone = true; kinds.push("SOLO"); continue; }
    if (!subDone && nameDone && kinds[kinds.length - 1] !== "SOLO" && t >= wantSub && dur - t > 5) { ts = solo(); subDone = true; kinds.push("SOLO"); continue; }
    { const v = VV.find((x) => !x.done && x.times[0] >= t - 0.3 && x.times[0] < (L[i]?.s ?? 1e9) + 0.5);
      if (v) { v.done = true; const at = fix(Math.max(t, v.times[0] - 0.05)), un = fix(Math.max(v.times[v.times.length - 1] + 2.2, at + 2)); items.push({ t: "verse", at, until: un, words: v.words, times: v.times, title: v.name, refText: v.ref, aya: v.aya, full: true, x: 40, y: 1520, w: 1000, size: 24 }); kinds.push("V"); t = un + 0.2; continue; } }
    while (i < L.length && L[i].s < t - 0.15) i++;                       // أسطر قيلت أثناء الاسم أو الاشتراك أو الاحتفاظ لا تُكتب
    if (i >= L.length) break;
    const blk = [L[i]]; let j = i;
    while (j + 1 < L.length && blk.length < 3 && L[j + 1].s - L[j].e < 1.5 && (L[j].e - L[i].s) < 5) blk.push(L[++j]);
    const afterW = items.length && items[items.length - 1].t === "WRITING";
    const atEl = items.length || tn !== null || ts !== null ? fix(afterW ? t : Math.max(t, blk[0].s - 0.1)) : 0;   // بعد قصاصة: يبدأ العنصر التالي فوراً (لا فراغ)
    { const pv = items[items.length - 1]; if (pv && pv.t !== "WRITING" && kinds[kinds.length - 1] !== "SOLO" && atEl - (pv.until ?? pv.to) > 0.4) { if (pv.until != null) pv.until = fix(atEl - 0.2); else pv.to = fix(atEl - 0.2); } }   // لا فراغ بين عنصرين: السابق يمتد حتى التالي
    const hasQ = blk.length >= 2 && blk[0].who === "other" && blk.slice(1).some((x) => x.who === "sheikh");
    const alt = blk.some((x) => x.who === "other") && blk.some((x) => x.who === "sheikh");
    const DANGLE = new Set(["و", "مع", "ان", "انه", "انها", "له", "لها", "علي", "في", "من", "الي", "عن", "الذي", "التي", "اللي", "بين", "او", "ثم", "لكن", "ولكن", "قد", "هو", "هي", "يعني", "بس", "ف"]);
    const nrm = (x) => String(x).replace(/[ً-ْٰـ]/g, "").replace(/[إأآٱا]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[^\p{L}\p{N}]/gu, "");
    const okEnds = (l) => { const q = l.text.split(/\s+/).map(nrm).filter(Boolean); return q.length >= 3 && !DANGLE.has(q[q.length - 1]) && !DANGLE.has(q[0]); };
    const mnt = Math.floor(blk[0].s / 60);
    let kind = hasQ ? "QA" : alt ? "CT" : ["FB", "IQ"][k % 2];
    if (!hasQ && !alt && !wrMin.S.has(mnt) && blk[0].n <= 7 && okEnds(blk[0])) kind = "S";
    else if (!hasQ && !alt && !wrMin.T.has(mnt) && blk[0].n <= 10 && okEnds(blk[0]) && kinds.includes("S")) kind = "T";
    if (kinds[kinds.length - 1] === kind && kind !== "QA") kind = kind === "FB" ? "IQ" : "FB";
    if (kind === "S" || kind === "T") { blk.length = 1; j = i; }
    const e = { at: atEl, until: 0 }, rowAt = (x) => fix(Math.max(atEl + 0.1, x.s));
    if (kind === "QA") { const q = blk.find((x) => x.who === "other"), a = blk.find((x) => x.who === "sheikh"); Object.assign(e, { t: "pick", el: "QACard", q: clip(q.text, 60), a: clip(a.text, 60), flipAt: fix(a.s), qTag: "المتصل", aTag: "الشيخ" }); }
    else if (kind === "CT") Object.assign(e, { t: "pick", el: "ChatThread", msgs: blk.map((x) => ({ text: x.text, at: rowAt(x), me: x.who === "sheikh" })) });
    else if (kind === "S" || kind === "T") { const x = blk[0]; wrMin[kind].add(mnt); writing.push({ t: kind === "S" ? "scraps" : "torn", text: x.text, from: fix(Math.max(0, x.s - 1)) }); Object.assign(e, { at: fix(x.s), t: "WRITING", until: fix(lastWordEnd(x) + (kind === "S" ? 1.0 : 1.8) + 0.4) }); }
    else if (kind === "RW") { delete e.until; Object.assign(e, { t: "rows", from: atEl, y0: 1492, step: 64, rowH: 58, title: { at: fix(Math.max(atEl, blk[0].s)), text: blk[0].text.split(" ").slice(0, 3).join(" ") }, rows: blk.map((x) => ({ at: rowAt(x), label: x.text })) }); delete e.at; }
    else if (kind === "IQ") Object.assign(e, { t: "pick", el: "InkQuote", lines: blk.map((x) => ({ text: x.text, at: rowAt(x) })) });
    else Object.assign(e, { t: "pick", el: "FlapBoard", rows: blk.map((x) => ({ text: x.text, at: rowAt(x) })) });
    const keys = (e.rows ?? e.lines ?? e.msgs ?? [{ at: e.flipAt }]).map((r) => r.at), next = L[j + 1];
    if (e.t === "WRITING") { items.push(e); kinds.push(kind); k++; t = e.until + 0.2; i = j + 1; continue; }
    const hold = fix(Math.max(Math.max(...keys) + 0.8 + HOLD, atEl + 1.6, next ? Math.min(next.s - 0.2, Math.max(...keys) + 0.8 + HOLD + 4) : 0));
    if (kind === "RW") e.to = hold; else e.until = hold;
    // الاسم/الاشتراك المقبل يحتاج المؤشر عنده: لا نمدّ العنصر فوق موضعه
    items.push(e); kinds.push(kind); k++; t = (e.until ?? e.to) + 0.2; i = j + 1;
  }
  { const only = items.filter((x) => x.t !== "WRITING"); items.length = 0; items.push(...only); }
  if (items.length) { const z = items[items.length - 1]; if (z.t === "rows") z.to = fix(dur - 0.1); else z.until = fix(dur - 0.1); }
  // لا تداخل: كل عنصر يبدأ بعد انتهاء السابق بـ0.2 ث على الأقل (الشبكة)
  items.sort((a, b) => a.at - b.at); for (let q = 1; q < items.length; q++) if (items[q].at < items[q - 1].until + 0.2) items[q - 1].until = fix(Math.max(items[q - 1].at + 1.6, items[q].at - 0.2));
  return { orient: c.kind === "reel" || dur <= 120 ? "port" : "land", title: T.title, brand: T.brand ?? "maroon", pose: T.pose ?? "10", bg: typeof T.bg === "string" && T.bg.includes("/") ? T.bg : `stream_bg/bg_${T.bg ?? ((k % 6) + 1)}.jpg`,
    words: { main: T.main, accent: T.accent, sub: T.sub }, items, writing, extra: { name: tn === null ? [] : [tn], sub: ts === null ? [] : [ts] }, skipMetaphors: "قالب سريع آلي للبث: بلا استعارات مرسومة (أمر الساعتين 2026-11-16)", skipRequired: ist.map((v) => `آية ${v.sura}:${v.aya}@${Math.round(v.times[0])}`) };
};
const BF = onlyArg && onlyArg.size === 1 ? `build_${[...onlyArg][0]}.json` : "build.json";   // ملف لكل مقطع حين يُبنى مقطع وحده: بناء عدة مقاطع معاً بلا تسابق على ملف واحد
const todo = plan.clips.filter((c) => !onlyArg || onlyArg.has(c.id) ), out = rd(path.join(".tmp", P, BF), {}), errs = [];
for (const c of todo) { try { out[c.id] = build(c); } catch (e) { errs.push(String(e.message)); } }
fs.writeFileSync(path.join(".tmp", P, BF), JSON.stringify(out, null, 1));
console.log(`بُنيت خطة ${todo.length - errs.length} مقطعاً → .tmp/${P}/${BF}`); errs.forEach((m) => console.log("✘", m));
if (run) for (const c of todo) { if (!out[c.id]) continue;
  const sh = (...args) => spawnSync(process.execPath, args, { cwd: process.cwd(), env: childEnv, encoding: "utf8", maxBuffer: 1 << 26, windowsHide: true });
  const b = sh("tools/stream/clip_build.mjs", c.id, `.tmp/${P}/${BF}`);
  if (b.error || b.status !== 0) {
    const why = b.error?.message || [b.stderr, b.stdout].filter(Boolean).join("\n").trim() || `exit=${b.status ?? "unknown"}`;
    errs.push(`${c.id}: clip_build failed: ${why.split("\n").slice(-8).join(" | ").slice(0, 900)}`);
    console.log(`✘ ${errs[errs.length - 1]}`);
    console.log(`لن تُعتمد مواصفة ${c.id} أو تُتابع خطواتها.`);
    continue;
  }
  { const f = `data/specs/${c.id}.json`, sp = rd(f, null); if (sp) {   // الاسم والاشتراك يمتدان حتى العنصر التالي (بلا فراغ، حتى 6 ث)
      const key = (i) => i.at ?? i.from ?? 0, all = sp.items.filter((i) => i.t !== "cover").sort((a, b2) => key(a) - key(b2));
      for (const it of all) if (it.t === "nameTag" || it.t === "subscribe") { const nx = all.find((o) => key(o) > key(it) + 0.5); if (nx) it.dur = +Math.min(4.5, Math.max(3.1, key(nx) - 0.5 - key(it))).toFixed(2); }
      const rq = sh("tools/requirements.mjs", c.id, "--check").stdout ?? "";   // ما ذُكر بلا صورة: قرار القالب السريع (بلا صور مخصصة) يُسجَّل في المواصفة ويُذكر للمستخدم
      const rows = [...rq.matchAll(/«([^»]+)» عند (\d+):(\d+)/g)].map((m) => ({ n: m[1], at: Number(m[2]) * 60 + Number(m[3]) })); /* (أمر المستخدم 2026-11-19: «من قال لك تستثني الصور؟») لا إعفاء لمذكور من صورته؛ تُضاف صوره بـtools/stream/clip_pictures.mjs من .tmp/<البث>/pictures.json */ void rows;
      // بعد كتابة writing_place الفعلية: العنصر الذي يلي قصاصة/ملاحظة يبدأ عند نهايتها الحقيقية + 0.2 (لا تداخل ولا فراغ)
      { const wr = new Set(["scraps", "torn"]), arr = sp.items.filter((i) => i.t !== "cover").sort((a, b2) => (a.at ?? a.from ?? 0) - (b2.at ?? b2.from ?? 0));
        for (let q = 0; q < arr.length - 1; q++) if (wr.has(arr[q].t)) { const nx = arr[q + 1], end = arr[q].until ?? arr[q].to; if (wr.has(nx.t) || nx.t === "nameTag" || nx.t === "subscribe" || end == null) continue;
          const a0 = +(end + 0.2).toFixed(2); if (nx.at != null) { nx.at = a0; for (const r of nx.rows ?? nx.lines ?? nx.msgs ?? []) if (r.at < a0 + 0.1) r.at = +(a0 + 0.1).toFixed(2); if (nx.flipAt != null && nx.flipAt < a0 + 0.1) nx.flipAt = +(a0 + 0.1).toFixed(2); if (nx.until != null && nx.until < nx.at + 1.6) nx.until = +(nx.at + 1.6).toFixed(2); } } }
      // قرارات القالب السريع المكتوبة: ما لا يملؤه القالب يُعفى بسبب مكتوب في المواصفة ويُذكر للمستخدم
      /* (2026-11-22, stream dress rehearsal; user rule «لا طلب إعفاء: كل مستحق له عنصره») NO waiver is written here any more (skipRequired / skipPicks): coverage_check refuses every entry the user did not
         allow («إعفاءات بلا إذن المستخدم»), so the old template made every stream clip fail its check. What the template leaves unfilled is LISTED (ℹ, and .tmp/<stream>/needs_picks/<id>.json, one file per clip): the due picks
         are given their element by the agent in .tmp/<stream>/pictures.json (entries with "vals", applied by tools/stream/clip_pictures.mjs); what coverage_check still reports stays a failure for the check to name. */
      const pt = sh("tools/pick_triggers.mjs", f).stdout ?? ""; const due = [...pt.matchAll(/✘ ([A-Za-z]+): (.*?) عند (.*?) — لم يُستعمل/g)].map((m) => ({ el: m[1], why: m[2], at: m[3].trim() }));
      writeNeeds(c.id, due);   // always: an empty list replaces an older list of this clip
      if (due.length) { console.log(`ℹ ${c.id}: ${due.length} عنصر مستحق بلا عنصره (يُكتب في pictures.json بـvals): ${due.map((x) => `${x.el}@${x.at}`).join("، ")}`); }      fs.writeFileSync(f, JSON.stringify(sp, null, 1));
      /* grid_plan --write records the face track and the slot names in the spec: its crash (exit ≥ 2, a signal, a spawn error) is a failed clip, never a silent skip; exit 1 = «overlap/off-grid findings», which the check names */
      const gp = sh("tools/grid_plan.mjs", f, "--o", sp.orient === "land" || c.kind !== "reel" && c.dur > 120 ? "land" : "port", "--write");
      if (gp.error || gp.status === null || gp.status >= 2) { errs.push(`${c.id}: grid_plan --write failed (${gp.error?.message ?? gp.signal ?? `exit=${gp.status}`}): ${[gp.stderr, gp.stdout].filter(Boolean).join(" ").trim().split(/ *[\r\n]+/).slice(-3).join(" | ").slice(0, 300)}`); console.log(`✘ ${errs[errs.length - 1]}`); continue; }
      if (gp.status === 1) console.log(`ℹ ${c.id}: grid_plan وجد مشكلات شبكة (يسمّيها الفحص): ${(gp.stdout.match(/✘.*/g) ?? []).slice(0, 2).join(" | ").slice(0, 200)}`); } }
  console.log(`${c.id}: ${(b.stdout || b.stderr).trim().split("\n").slice(-2).join(" | ").slice(0, 200)}`) }
process.exit(errs.length ? 1 : 0);
