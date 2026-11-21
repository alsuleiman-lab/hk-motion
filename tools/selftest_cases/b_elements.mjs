/* ELEMENT GUARDS (2026-11-21, user: «نعم» to tests for the guards that had none). Every case runs the real tool on a scratch spec and fake cut words under
   .tmp/selftest/<run>/b_el/: coverage_check / late_check take the spec path and --words; el.mjs, el_rules.mjs plan-check and layers.mjs take --spec <file>
   (tools/lib/selftest_spec.mjs, refused outside .tmp/selftest/). The project name is "selftest/<run>/b_el/<case>", so every .tmp/<p>/… a tool reads or
   writes (grid.md, plancheck/, layers.json, cut_words.json) is inside the scratch tree. One source read, named: src/SceneFx.tsx is a component (no runtime
   without a render), so «squeeze/water removed» is read from it. */
export default async (api) => {
  const { add, expect, put, runAsync, RUN, ROOT, NODE, path, fs } = api;
  const D = path.join(RUN, "b_el");
  const pName = (n) => path.relative(path.join(ROOT, ".tmp"), path.join(D, n)).split(path.sep).join("/");   // selftest/<run>/b_el/<n>
  /** fake cut words: "text" from second t0, 0.45 s a word */
  const W = (text, t0) => text.split(" ").map((w, i) => ({ w, s: +(t0 + i * 0.45).toFixed(2), e: +(t0 + i * 0.45 + 0.4).toFixed(2) }));
  /** scratch spec + its words at .tmp/<p>/cut_words.json; returns {p, f, wf} */
  const scratch = (n, spec, words) => {
    const p = pName(n), f = put(path.join(D, `${n}.json`), JSON.stringify({ id: p, fps: 30, ...spec }, null, 1)), wf = put(path.join(D, n, "cut_words.json"), words ?? []);
    return { p, f, wf };
  };
  const tool = (t) => path.join(ROOT, "tools", t);
  const COV = "tools/coverage_check.mjs", EL = "tools/el.mjs", ELR = "tools/el_rules.mjs", LATE = "tools/late_check.mjs", LY = "tools/layers.mjs";
  const BASE = { kind: "episode", frames: 30 * 30, bumper: { position: "none" }, zooms: [{ from: 10, to: 12 }], shake: [] };
  const cov = async (n, spec, words) => { const s = scratch(n, { ...BASE, ...spec }, words); return runAsync(NODE, [tool("coverage_check.mjs"), s.f, "--words", s.wf], { cwd: ROOT }); };
  const line = (out, re) => out.split(/\r?\n/).find((l) => re.test(l)) ?? "";
  const REQ = /كلام بلا عنصره المطلوب|كل رحلة وتاريخ/, WAIV = /إعفاء/, GAP = /فراغ أطول من 5|لا فراغ أطول من 5/;

  /* ── waivers-asked-not-filled: «150 ألف» is a count (the counter), never a year; a waiver of a missing element needs his words */
  add("cov.count_not_year", COV, "waivers-asked-not-filled", "«150 ألف» عدد لا سنة: لا يُطلب له عنصر تاريخ؛ و«سنة 1990» يُطلب لها", async () => {
    const a = await cov("count", { items: [] }, W("قتلوا 150 ألف إنسان في تلك الحرب", 5)), b = await cov("year", { items: [] }, W("وفي سنة 1990 جاء الجيش", 5));
    const la = line(a.out, REQ), lb = line(b.out, REQ);
    return expect(/^✔/.test(la) && /^✘/.test(lb) && /تاريخ ← عنصر التاريخ عند 0:05/.test(lb), !/^✔/.test(la) ? `«150 ألف» عُدّ سنة: ${la.slice(0, 90)}` : `السنة الحقيقية لم تُطلب: ${lb.slice(0, 90)}`);
  });
  add("cov.counter_waiver_refused", COV, "waivers-asked-not-filled", "إعفاء العدّاد (skipPicks) أو التاريخ (skipRequired) بلا كلام المستخدم ← مرفوض، ولو أخفى النقص", async () => {
    const x = await cov("waive_counter", { items: [], skipRequired: ["تاريخ ← عنصر التاريخ@6"], skipPicks: [{ el: "GlowCounter" }] }, W("وفي سنة 1990 جاء الجيش", 5));
    const lw = line(x.out, WAIV);
    return expect(x.status === 1 && /^✘ إعفاءات بلا إذن المستخدم \(2\)/.test(lw) && /GlowCounter/.test(lw) && /^✔/.test(line(x.out, REQ)), `الإعفاء قُبل (خروج ${x.status}): ${lw.slice(0, 100)}`);
  });

  /* ── self-written-waivers: every skipRequired / skipMentions / skipPicks entry needs waiverOK["<entry>"] = his words (≥ 4 letters) */
  add("cov.waiver_all_lists", COV, "self-written-waivers", "إعفاء كتبتُه لنفسي في أي قائمة (skipRequired وskipMentions وskipPicks) أو بإذن أقصر من 4 أحرف ← مرفوض", async () => {
    const x = await cov("waive_self", { items: [{ t: "torn", text: "جاء الجيش", at: 4, until: 30 }], skipRequired: ["تاريخ ← عنصر التاريخ@6"], skipMentions: ["الإنجيل"], skipPicks: ["StatRow", { el: "GlowCounter" }], waiverOK: { StatRow: "نعم" } }, W("وفي سنة 1990 جاء الجيش", 5));
    const lw = line(x.out, WAIV), named = ["تاريخ ← عنصر التاريخ@6", "الإنجيل", "StatRow", "GlowCounter"].every((k) => lw.includes(k));
    return expect(x.status === 1 && /^✘ إعفاءات بلا إذن المستخدم \(4\)/.test(lw) && named, `لم تُرفض كلها (خروج ${x.status}): ${lw.slice(0, 120)}`);
  });
  add("cov.waiver_with_words_ok", COV, "self-written-waivers", "إعفاء معه كلام المستخدم في waiverOK ← مقبول", async () => {
    const ok = { "تاريخ ← عنصر التاريخ@6": "قال 2026-11-21: لا تضع تاريخاً هنا", "الإنجيل": "قال: اتركه، ليس ذكراً حقيقياً" };
    const x = await cov("waive_user", { items: [], skipRequired: ["تاريخ ← عنصر التاريخ@6"], skipMentions: ["الإنجيل"], waiverOK: ok }, W("وفي سنة 1990 جاء الجيش", 5));
    return expect(/^✔ كل إعفاء بإذن المستخدم \(2\)/.test(line(x.out, WAIV)), `رُفض خطأً: ${line(x.out, WAIV).slice(0, 100)}`);
  });

  /* ── push-ins-hid-empty-screen: a push-in or a shake is a camera move, not an element — coverage_check and the gap watch (layers gaps) */
  const PUSH = { zooms: [{ from: 9, to: 12 }, { from: 13, to: 16 }, { from: 17, to: 21 }], shake: [{ from: 12, to: 13 }] };
  const T = (at, until) => ({ t: "torn", text: "كلام", at, until });
  const LONG = W(Array.from({ length: 64 }, (_, i) => `كلمة${i}`).join(" "), 0.5);   // speech to 29 s
  add("cov.pushin_not_element", [COV, LY], "push-ins-hid-empty-screen", "تقريب وهزّة في 14 ث فارغة لا يملآن الفراغ (الفحص ومراقب الفراغات)، والعنصر يملؤه", async () => {
    const a = await cov("push", { ...PUSH, items: [T(0, 8), T(22, 30)] }, LONG), b = await cov("push_filled", { ...PUSH, items: [T(0, 8), T(8, 22), T(22, 30)] }, LONG);
    const s = scratch("push_gaps", { ...BASE, ...PUSH, items: [T(0, 8), T(22, 30)] }, LONG), g = await runAsync(NODE, [tool("layers.mjs"), "gaps", s.p, "--spec", s.f], { cwd: ROOT });
    const la = line(a.out, GAP), lb = line(b.out, GAP);
    return expect(/^✘/.test(la) && /0:08–0:22/.test(la) && /^✔/.test(lb) && g.status === 1 && /✘ فراغ 0:08–0:22/.test(g.out),
      !/^✘/.test(la) ? `الفحص عدّ التقريب عنصراً: ${la.slice(0, 80)}` : !/^✔/.test(lb) ? `الفراغ المملوء رُفض: ${lb.slice(0, 80)}` : `مراقب الفراغات (خروج ${g.status}): ${(g.out + g.err).trim().slice(0, 100)}`);
  });

  /* ── date-calendar-2005-crash: digits given to a text field stay a string (el.mjs add on a scratch spec, --no-gate inside a fake batch) */
  add("el.date_text_string", [EL, ELR], "date-calendar-2005-crash", "el.mjs add DateCalendar text=2005 ← النص يُكتب «2005» نصاً، والحقل الرقمي يبقى رقماً؛ وقيوده تقول «text نص لا رقم»", async () => {
    const s = scratch("date", { frames: 3000, items: [] });
    const [x, r] = await Promise.all([runAsync(NODE, [tool("el.mjs"), "add", s.p, "DateCalendar", "at=70", "until=74", "text=2005", "sub=7", "from=1990", "--no-gate", "--spec", s.f], { cwd: ROOT, env: { ...process.env, EL_BATCH_CHILD: "1" } }),
      runAsync(NODE, [tool("el_rules.mjs"), "rules", "DateCalendar"], { cwd: ROOT })]);
    const it = JSON.parse(fs.readFileSync(s.f, "utf8")).items?.find((i) => i.t === "date");
    return expect(x.status === 0 && it?.text === "2005" && it?.sub === "7" && it?.from === 1990 && /text نص لا رقم/.test(r.out),
      !it ? `لم يُضف (خروج ${x.status}): ${(x.out + x.err).trim().slice(0, 120)}` : it.text !== "2005" ? `النص كُتب ${typeof it.text}: ${it.text}` : it.from !== 1990 ? "الحقل الرقمي صار نصاً" : "قيد «text نص لا رقم» اختفى من القيود");
  });
  add("el.plan_warns_number_text", ELR, "date-calendar-2005-crash", "plan-check: text=2005 رقماً في حقل نص ← تنبيه «اكتبه نصاً»", async () => {
    const s = scratch("date_plan", { frames: 3000, forms: ["land"], items: [] }), ops = put(path.join(D, "date_plan_ops.json"), [{ op: "add", code: "DateCalendar", vals: { at: 70, until: 74, text: 2005 } }]);
    const x = await runAsync(NODE, [tool("el_rules.mjs"), "plan-check", s.p, ops, "--spec", s.f], { cwd: ROOT });
    return expect(/text=2005 رقم والحقل نص/.test(x.out) && /اكتبه نصاً: "2005"/.test(x.out), `لا تنبيه (خروج ${x.status}): ${(x.out + x.err).trim().slice(0, 140)}`);
  });

  /* ── element-constraints-one-by-one: plan-check prints EVERY problem of the plan at once, and el.mjs batch applies nothing while it fails */
  const BAD_OPS = [
    { op: "add", code: "DateCalendar", vals: { at: 3, until: 6 } },                          // text missing
    { op: "add", code: "TornNote", vals: { at: 8, until: 11, text: "جاء الجيش", w: 400 } },  // a gallery field (size)
    { op: "add", code: "TornNote", vals: { at: 14, until: 12, text: "جاء الجيش" } },          // ends before it starts
    { op: "add", code: "TornNote", vals: { at: 20, until: 24, text: "سفينة فضائية عملاقة" } },// not his words
    { op: "set", id: "#nope", vals: { at: 1 } },                                              // no such item
  ];
  const PLAN_WORDS = [...W("وفي سنة 1990 جاء الجيش", 5), ...W("ثم جاء الجيش مرة أخرى", 8), ...W("وقال الناس كلاما كثيرا هنا", 20)];
  add("elr.plan_all_at_once", [ELR, EL], "element-constraints-one-by-one", "plan-check يطبع مشكلات الخطة الخمس معاً كلٌّ تحت عمليته بإصلاحه، ولا يلمس المواصفة", async () => {
    const s = scratch("plan", { frames: 3000, forms: ["land"], items: [] }, PLAN_WORDS), ops = put(path.join(D, "plan_ops.json"), BAD_OPS), before = fs.readFileSync(s.f, "utf8");
    const x = await runAsync(NODE, [tool("el_rules.mjs"), "plan-check", s.p, ops, "--spec", s.f], { cwd: ROOT });
    const want = [[/العملية 1 [^\n]*\n[^]*?ينقصه text/, "النص الناقص"], [/العملية 2 [^\n]*\n[^]*?حقول لا يقبلها: w/, "حقل المعرض"], [/العملية 3 [^\n]*\n[^]*?النهاية 12 ليست بعد البداية 14/, "النهاية قبل البداية"],
      [/العملية 4 [^\n]*\n[^]*?لا يطابق كلامه/, "نص ليس كلامه"], [/العملية 5 [^\n]*\n[^]*?لا عنصر #nope/, "عنصر غير موجود"]].filter(([re]) => !re.test(x.out)).map(([, n]) => n);
    return expect(x.status === 1 && !want.length && /✘ plan-check: \d+ مشكلة في 5 عملية/.test(x.out) && fs.readFileSync(s.f, "utf8") === before && !fs.existsSync(path.join(D, "plan", "plancheck")),
      want.length ? `لم يُطبع: ${want.join("، ")} (خروج ${x.status})` : x.status !== 1 ? `خروج ${x.status}` : "لمس المواصفة أو ترك نسخته");
  });
  add("el.batch_refused_before_apply", [EL, ELR], "element-constraints-one-by-one", "el.mjs batch بخطة فيها مشكلات ← لا يُطبَّق شيء (المواصفة كما هي) ويطبع مشكلاتها كلها", async () => {
    const s = scratch("batch", { frames: 3000, forms: ["land"], items: [] }, PLAN_WORDS), ops = put(path.join(D, "batch_ops.json"), BAD_OPS), before = fs.readFileSync(s.f, "utf8");
    const x = await runAsync(NODE, [tool("el.mjs"), "batch", s.p, ops, "--spec", s.f], { cwd: ROOT, timeout: 30000 });
    return expect(x.status === 1 && /لم تُطبَّق الدفعة/.test(x.err) && /ينقصه text/.test(x.err) && /لا يطابق كلامه/.test(x.err) && fs.readFileSync(s.f, "utf8") === before,
      `خروج ${x.status}، المواصفة ${fs.readFileSync(s.f, "utf8") === before ? "كما هي" : "تغيّرت"}: ${(x.out + x.err).trim().split("\n").slice(-2).join(" | ").slice(0, 140)}`);
  });

  /* ── element-late-or-stays-too-long (late_check: > 2.5 s after its words, a picture > 10 s, a scene effect > 8 s; each with its passing twin) */
  const late = async (n, items, words) => { const s = scratch(n, { frames: 3000, items }, words); return runAsync(NODE, [tool("late_check.mjs"), s.f, "--words", s.wf], { cwd: ROOT }); };
  const NAMEW = W("وقد قال ابن تيمية رحمه في كتابه هذا الكلام كله", 5);   // «تيمية» at 6.35 s
  add("late.after_words", LATE, "element-late-or-stays-too-long", "اسم يظهر بعد قوله بـ4 ث ← مرفوض؛ عند قوله ← مقبول", async () => {
    const a = await late("late_name", [{ id: "n1", t: "scholar", name: "ابن تيمية", at: 10.5, until: 14 }], NAMEW), b = await late("ontime_name", [{ id: "n1", t: "scholar", name: "ابن تيمية", at: 5.6, until: 9 }], NAMEW);
    return expect(a.status === 1 && /✘ متأخر 4\.\d ث: #n1/.test(a.out) && b.status === 0, a.status !== 1 ? `التأخر لم يُكشف: ${a.out.trim().slice(0, 100)}` : `في وقته رُفض: ${b.out.trim().slice(0, 100)}`);
  });
  add("late.picture_too_long", LATE, "element-late-or-stays-too-long", "صورة تبقى 12 ث ← مرفوضة؛ 6 ث أو «explain» ← مقبولة", async () => {
    const a = await late("pic_long", [{ id: "p1", t: "pic", src: "zz/a.png", at: 20, until: 32 }], []), b = await late("pic_ok", [{ id: "p1", t: "pic", src: "zz/a.png", at: 20, until: 26 }, { id: "p2", t: "tphoto", src: "zz/b.png", at: 40, until: 55, explain: true }], []);
    return expect(a.status === 1 && /✘ باقٍ طويلاً 12\.0 ث: #p1/.test(a.out) && b.status === 0, a.status !== 1 ? `البقاء الطويل لم يُكشف: ${a.out.trim().slice(0, 100)}` : `رُفض خطأً: ${b.out.trim().slice(0, 100)}`);
  });
  add("late.scenefx_too_long", LATE, "element-late-or-stays-too-long", "مؤثر خلفية 10 ث ← مرفوض؛ 5 ث ← مقبول", async () => {
    const a = await late("fx_long", [{ id: "f1", t: "scenefx", fx: "bars", from: 40, to: 50 }], []), b = await late("fx_ok", [{ id: "f1", t: "scenefx", fx: "bars", from: 40, to: 45 }], []);
    return expect(a.status === 1 && /✘ مؤثر خلفية طويل 10\.0 ث: #f1/.test(a.out) && b.status === 0, a.status !== 1 ? `المؤثر الطويل لم يُكشف: ${a.out.trim().slice(0, 100)}` : `رُفض خطأً: ${b.out.trim().slice(0, 100)}`);
  });

  /* ── examples-built-as-features: scene words only POINT at a moment; scan picks no effect, write adds none */
  const SCENE_W = [...W("ودخلوا كلهم في السجن سنين طويلة", 5), ...W("وكان الناس في ضيق شديد جدا", 20), ...W("ثم جاء الماء من كل مكان", 40)];
  add("layers.scene_words_flag_only", LY, "examples-built-as-features", "كلمات المشاهد (السجن، ضيق، الماء) تنبّه إلى اللحظة فقط: لا مؤثر مختار في القيم، و«write» لا يضيف مؤثراً", async () => {
    const s = scratch("scene", { frames: 1800, items: [] }, SCENE_W), before = fs.readFileSync(s.f, "utf8");
    const a = await runAsync(NODE, [tool("layers.mjs"), "scan", s.p, "--spec", s.f], { cwd: ROOT });
    let L = []; try { L = JSON.parse(fs.readFileSync(path.join(D, "scene", "layers.json"), "utf8")); } catch { /* none */ }
    const sc = L.filter((l) => l.layer === "المشاهد"), picked = sc.filter((l) => Object.keys(l.vals ?? {}).some((k) => k !== "at") || !/فكّر/.test(l.note ?? ""));
    const b = await runAsync(NODE, [tool("layers.mjs"), "write", s.p, "--spec", s.f], { cwd: ROOT });
    const after = JSON.parse(fs.readFileSync(s.f, "utf8"));
    return expect(a.status === 0 && sc.length === 3 && !picked.length && b.status === 0 && /⚠ 3 لحظة قد تحمل الخلفيةُ معناها/.test(b.out) && fs.readFileSync(s.f, "utf8") === before && !after.items.some((i) => i.t === "scenefx"),
      sc.length !== 3 ? `لحظات المشاهد ${sc.length} لا 3 (خروج ${a.status}): ${(a.out + a.err).trim().slice(0, 100)}` : picked.length ? `اختار مؤثراً: ${JSON.stringify(picked[0].vals)}` : `write أضاف شيئاً أو لم ينبّه (خروج ${b.status}): ${(b.out + b.err).trim().slice(0, 100)}`);
  });
  add("layers.no_squeeze_water_src", "src/SceneFx.tsx", "examples-built-as-features", "المصدر: المؤثران المبنيان من الأمثلة (squeeze وwater) محذوفان من src/SceneFx.tsx (مكوّن لا يُشغَّل بلا رندر)", async () => {
    const s = fs.readFileSync(path.join(ROOT, "src", "SceneFx.tsx"), "utf8");
    return expect(!/["'](squeeze|water)["']/.test(s) && /export const SceneFx/.test(s), "عاد مؤثر squeeze أو water إلى src/SceneFx.tsx");
  });
};
