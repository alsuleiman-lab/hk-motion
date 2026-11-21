/* THE MONTAGE BUILDER (tools/montage_build.mjs, 2026-11-21, user: «لازم حل جذري» — the gta6 episode: 6 refused element batches, 17 failed checks).
   The builder computes every item from the gates' own sources and must pass the whole gate set on its FIRST run. These cases run it on a fake project:
   fake cut words / sections / requirements under .tmp/selftest/<run>/d_mb/<case>/ (the project name is "selftest/<run>/d_mb/<case>", so every .tmp/<p>/…
   the builder or a gate reads is in the scratch tree), a scratch base spec and picks (--base / --picks), and the output to a scratch --out — never a real
   spec. The cut video is a real one, read only (the face zone needs a face track: anchor-kills-children_cut_s.mp4 and its cached track). The builder's own
   scratch workspace is .tmp/selftest/montage_build/<name>/ (tools/lib/gate_sandbox.mjs, junctions released when it exits). */
export default async (api) => {
  const { add, manual, expect, put, runAsync, RUN, ROOT, NODE, path, fs } = api;
  /* the whole build + 18 gates takes 20–40 s: over the edit hook's 20 s, so after an edit it is named (يدوي) and runs with --for / the full self-test */
  const HOOKED = process.argv.includes("--hook");
  const D = path.join(RUN, "d_mb");
  const pName = (n) => path.relative(path.join(ROOT, ".tmp"), path.join(D, n)).split(path.sep).join("/");
  const CUT = "anchor-kills-children_cut_s.mp4";
  const SPEECH = "بسم الله والحمد لله. اليوم نتكلم عن الصبر في البيت. لماذا يغضب الإنسان من أولاده؟ انتبه يا أخي من الغضب الشديد. " +
    "الغضب نار تحرق صاحبها قبل غيره. والصبر مفتاح كل خير في البيت. من صبر على أولاده نال الأجر العظيم. وقد صبر عليهم 150 ألف أب. " +
    "الصبر جذر والأجر ثمرته الطيبة. والبيت الهادئ يربي أولادا هادئين. والسلام عليكم ورحمة الله وبركاته.";
  const words = (text, t0) => text.split(" ").map((w, i) => ({ w, s: +(t0 + i * 0.45).toFixed(2), e: +(t0 + i * 0.45 + 0.4).toFixed(2) }));
  const mbTool = path.join(ROOT, "tools", "montage_build.mjs");
  /** a fake project: words, the same words as the final-audio transcript, 4 sections, an empty (or given) requirement ledger written AFTER the words */
  const project = (n, { req = [] } = {}) => {
    const p = pName(n), T = path.join(D, n), W = words(SPEECH, 0.3), dur = Math.ceil(W.at(-1).e + 3.6);   /* coverage_check: nothing empty > 5 s up to 3 s before the end */
    put(path.join(T, "cut_words.json"), W); put(path.join(T, "drift_fresh.json"), W);
    put(path.join(T, "sections.json"), [{ title: "الصبر في البيت", at: 0 }, { title: "لماذا يغضب الإنسان", at: 6 }, { title: "الغضب نار", at: 13 }, { title: "الأجر العظيم", at: 19 }]);
    const rq = put(path.join(T, "requirements.json"), req); const later = new Date(Date.now() + 5000); fs.utimesSync(rq, later, later);
    const base = put(path.join(D, `${n}.base.json`), JSON.stringify({ id: p, title: "اختبار الباني", fps: 30, frames: dur * 30, cut: CUT, galleryRef: true, brand: "steel", date: "2026-11-21", showTitleBar: true,
      zooms: [{ from: 10, to: 12 }], shake: [], bumper: { position: "none" }, items: [{ t: "nameTag", at: 12, dur: 3 }] }, null, 1));
    return { p, T, base, out: path.join(D, `${n}.out.json`) };
  };
  const picks = (n, moments = {}) => put(path.join(D, `${n}.picks.json`), { moments: { cover: { vals: { src: "anchor-kills-children/cover_gpt.png" } }, ...moments }, metaphors: [], extra: [] });
  const build = (x, pk, extra = []) => runAsync(NODE, [mbTool, x.p, "--base", x.base, "--picks", pk, "--out", x.out, "--no-mattes", ...extra], { cwd: ROOT, timeout: 300000 });

  /* ── the template: every moment that needs a choice, in one file (the due picks of pick_triggers, the count «150 ألف», the sections, the drawn meaning) */
  add("mb.template_all_moments", "tools/montage_build.mjs", "element-constraints-one-by-one", "قالب الاختيارات يذكر كل لحظة تحتاج اختياراً في ملف واحد: العناصر المستحقة (سؤال، تحذير)، العدد، الأقسام، المعنى المجسّد", async () => {
    const x = project("tpl"), f = path.join(D, "tpl.template.json");
    const r = await runAsync(NODE, [mbTool, x.p, "--base", x.base, "--picks-template", "--out", f], { cwd: ROOT, timeout: 60000 });
    let t = {}; try { t = JSON.parse(fs.readFileSync(f, "utf8")); } catch { /* none */ }
    const ids = Object.keys(t.moments ?? {}), want = ["cover", "sections", "due:BigQuestion", "due:AlertFrame", "number:0"];
    const miss = want.filter((k) => !ids.includes(k));
    return expect(r.status === 0 && !miss.length && (t.metaphors ?? []).length >= 1, `خروج ${r.status}؛ ناقص من القالب: ${miss.join("، ") || "—"}؛ المعاني ${(t.metaphors ?? []).length} — ${(r.out + r.err).trim().split(/\r?\n/).pop()?.slice(0, 120)}`);
  });

  /* ── the proof: built from picks that give only the cover, the whole gate set passes on the FIRST run of the written spec */
  if (HOOKED) manual("mb.build_first_run_passes", "tools/montage_build.mjs", "error-then-check-then-fix", "الباني يبني المونتاج من الاختيارات وحدها، وكل البوابات تنجح من أول تشغيل على المواصفة المكتوبة", "بناء كامل و18 بوابة (20–40 ث) فوق مهلة الهوك: node tools/guard_selftest.mjs --for tools/montage_build.mjs");
  else add("mb.build_first_run_passes", "tools/montage_build.mjs", "error-then-check-then-fix", "الباني يبني المونتاج من الاختيارات وحدها، وكل البوابات تنجح من أول تشغيل على المواصفة المكتوبة (لا رفض ثم إصلاح)", async () => {
    const x = project("build"), r = await build(x, picks("build"));
    let s = null; try { s = JSON.parse(fs.readFileSync(x.out, "utf8")); } catch { /* none */ }
    const els = new Set((s?.items ?? []).map((i) => i.el ?? i.t)), rail = (s?.items ?? []).find((i) => i.el === "SectionsRail");
    const ok = r.status === 0 && /✔ كل البوابات \(\d+\) نجحت من أول تشغيل/.test(r.out) && s?.items?.[0]?.t === "cover" && ["BigQuestion", "AlertFrame"].every((e) => els.has(e)) && rail && rail.at <= 10;
    return expect(ok, r.status !== 0 ? `خروج ${r.status}: ${(r.out + r.err).split(/\r?\n/).filter((l) => /✘|BUG/.test(l)).slice(0, 4).join(" | ").slice(0, 300)}` : `الناتج ناقص: الغلاف أول؟ ${s?.items?.[0]?.t}؛ العناصر ${[...els].join(",").slice(0, 120)}؛ خط الأقسام ${rail?.at}`);
  });

  /* ── a requirement with no picture anywhere: the builder names it and writes NOTHING (never an invalid item, never a waiver) */
  add("mb.missing_media_no_write", "tools/montage_build.mjs", "waivers-asked-not-filled", "صف مطلوب بلا صورة ولا بديل: الباني يسمّيه ويطلب الوسائط، ولا يكتب مواصفة ناقصة ولا يكتب إعفاءً", async () => {
    const x = project("media", { req: [{ id: 1, kind: "state", text: "رجل يصلي", t: 5.2, need: ["pic", "tphoto", "scholar"], before: 3, after: 5, ctx: "" }] });
    const r = await build(x, picks("media"));
    return expect(r.status === 3 && /req:1/.test(r.out) && !fs.existsSync(x.out), `خروج ${r.status}؛ كُتبت المواصفة؟ ${fs.existsSync(x.out)} — ${r.out.trim().split(/\r?\n/).slice(0, 2).join(" | ").slice(0, 160)}`);
  });

  /* ── one source: a gate whose number the builder reads changes shape → the builder stops loudly (never builds on a stale copy of a rule) */
  add("mb.rule_source_changed_loud", "tools/montage_build.mjs", "element-constraints-one-by-one", "إن تغيّر شكل قاعدة في بوابة يقرأ الباني رقمها منها (حد بقاء الصورة في late_check) يتوقف ويقول «مصدر القاعدة تغيّر» ولا يبني بنسخة قديمة", async () => {
    const R = path.join(D, "rootcopy");
    const files = ["montage_build.mjs", "lib/gate_sandbox.mjs", "lib/gate_set.mjs", "lib/scraps_times.mjs", "cover_item.mjs", "prepublish_gates.mjs", "element_slots.mjs", "late_check.mjs", "coverage_check.mjs", "writing_sync.mjs", "writing_place.mjs", "mg_usage_audit.mjs", "pick_triggers.mjs", "names_scan.mjs", "grid_plan.mjs", "name_doubt.mjs"];
    for (const f of files) put(path.join(R, "tools", f), fs.readFileSync(path.join(ROOT, "tools", f), "utf8"));
    const lc = path.join(R, "tools", "late_check.mjs"); put(lc, fs.readFileSync(lc, "utf8").replace(/\$\{d > 10 \? "✘" : "⚠"\}/, '${d > LIMIT ? "✘" : "⚠"}'));
    const r = await runAsync(NODE, [path.join(R, "tools", "montage_build.mjs"), "x", "--picks-template"], { cwd: R, timeout: 30000 });
    return expect(r.status !== 0 && /مصدر القاعدة تغيّر/.test(r.out + r.err) && /late_check/.test(r.out + r.err), `خروج ${r.status}: ${(r.out + r.err).trim().split(/\r?\n/).slice(0, 2).join(" | ").slice(0, 160)}`);
  });
};
