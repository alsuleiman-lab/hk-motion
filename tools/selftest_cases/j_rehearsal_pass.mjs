/* THE REHEARSAL MADE TO PASS END TO END (tools/rehearsal.mjs on the fixed test video, 2026-11-21 — «انهي اصلاحك يلا بأحسن صورة ممكنة»). The run of 11:14 failed
   at the builder (5 gates on what it built), at the reel's check (the bare slice: no element, no push-in) and at the reel's render («judder 0/0 … stale/skipped»).
   The root causes, each guarded here:
   1) builder-writing-minute-drift       the builder counted «one scraps a minute» on the cut words, writing_place on its own reading → two in one minute, all refused
   2) builder-generator-fail-written     a generator that failed on the copy stopped the loop with no gate run, and the spec was WRITTEN (no writing: 8–12 s gaps)
   3) builder-bumper-after-build         the bumper was placed by the check stage after the build, so the build itself failed «لا فاصل في الخطة»
   4) builder-template-entry-not-a-pick  a template entry {el: null} counted as the agent's choice: a due pick with a full window was named «missing»
   5) builder-gap-end-drift              the builder's gap mirror stopped at dur − 3 (coverage_check), `layers gaps` counts to dur
   6) builder-sandbox-cut-audio          the scratch copy had no cut audio: matte_windows → ensureCut saw «sound changed» and failed
   7) builder-sandbox-public-kind        a real build after a scratch build refused «public/ of links here»
   8) reel-not-built-by-builder          the reel went to the check as the bare slice: no moves (zooms), cams: [] (grid_plan crashed), not registered
   9) orphan-false-pause-pieces          orphan_scan judged «speech removed» on the raw words: a slow speaker's kept words flagged five times
   10) judder-zero-steps-no-file         the reel render was refused, the judder check ran on the missing file and blamed «stale/skipped frames»
   11) rehearsal-guard-unreported        the rehearsal never reported its stages to the guard: every check failed «tasks: مفتوح 10»
   No GPU: fake projects under .tmp/selftest/<run>/j_rp/, a cut video read only (the face zone needs a cached face track), tiny CPU-made files. */
export default async (api) => {
  const { add, manual, expect, put, runAsync, RUN, ROOT, NODE, path, fs } = api;
  const { pathToFileURL } = await import("node:url");
  const HOOKED = process.argv.includes("--hook");
  const D = path.join(RUN, "j_rp");
  const src = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
  const pName = (n) => path.relative(path.join(ROOT, ".tmp"), path.join(D, n)).split(path.sep).join("/");
  const imp = (f) => import(pathToFileURL(path.join(ROOT, f)).href);

  /* ── 1) the minute of a phrase: writing_place's own reading, shared ── */
  const WT = ["tools/lib/writing_times.mjs", "tools/writing_place.mjs", "tools/montage_build.mjs"], WTL = "builder-writing-minute-drift";
  add("wp.minute_is_writing_place_reading", WT, WTL, "الدقيقة التي تُعدّ فيها العبارة هي قراءة writing_place نفسها (الأحدث من القراءتين): كلمة 1:59.7 في التفريغ الأخير و2:00.05 في كلمات القص ← الدقيقة 2", async () => {
    const { wpReadings, wpPlace, wpMinuteKey } = await imp("tools/lib/writing_times.mjs");
    const T = path.join(D, "wp");
    put(path.join(T, "drift_fresh.json"), [{ w: "قال", s: 118.9, e: 119.3 }, { w: "كلمة", s: 119.7, e: 120.0 }, { w: "لكن", s: 120.1, e: 120.3 }, { w: "أحيانا", s: 120.4, e: 120.9 }, { w: "إنسان", s: 121.0, e: 121.5 }]);
    put(path.join(T, "cut_words.json"), [{ w: "قال", s: 119.0, e: 119.3 }, { w: "كلمة", s: 120.05, e: 120.3 }, { w: "لكن", s: 120.35, e: 120.5 }, { w: "أحيانا", s: 120.6, e: 120.9 }, { w: "إنسان", s: 121.1, e: 121.5 }]);
    const R = wpReadings(T), a = wpPlace(R, { text: "كلمة لكن أحيانا", from: 119 }), none = wpPlace(R, { text: "عبارة لم يقلها", from: 0 });
    return expect(a && a.at === 120.05 && wpMinuteKey("scraps", a.at) === "scraps@2" && none === null, `الزمن ${a?.at} (${a ? wpMinuteKey("scraps", a.at) : "—"})، عبارة ليست كلامه: ${JSON.stringify(none)}`);
  });
  add("wp.shared_by_builder_src", WT, WTL, "المصدر: الباني يعدّ الدقيقة ويختار الزمن بدالة writing_place نفسها (wpPlace / wpMinuteKey)، وwriting_place بلا نسخة خاصة من التوقيت", async () => {
    const mb = src("tools/montage_build.mjs"), wp = src("tools/writing_place.mjs"), fill = mb.slice(mb.indexOf("function fillGaps("), mb.indexOf("function extendIntoGaps("));
    return expect(/from "\.\/lib\/writing_times\.mjs"/.test(mb) && /wpMinuteKey\(w\.t, wpOf\(/.test(fill) && /const wp = WPR \? wpOf\(ph\.text/.test(fill) && /Math\.max\(ph\.at, wp\?\.at/.test(fill) && /wpPlace\(RD, it\)/.test(wp) && /wpMinuteKey\(o\.t, o\.at\)/.test(wp) && !/Math\.floor\(o\.at \/ 60\)/.test(wp), "الباني أو writing_place عاد إلى توقيت خاص به");
  });

  /* ── 2–5, 8) one fake build: the picks file IS the template (the rehearsal's way), a writing phrase he never said, no bumper, no zooms in the base ── */
  const BL = "builder-generator-fail-written", mbTool = path.join(ROOT, "tools", "montage_build.mjs"), CUT = "anchor-kills-children_cut_s.mp4";
  const SPEECH = "بسم الله والحمد لله. اليوم نتكلم عن الصبر في البيت. لماذا يغضب الإنسان من أولاده؟ انتبه يا أخي من الغضب الشديد. " +
    "الغضب نار تحرق صاحبها قبل غيره. والصبر مفتاح كل خير في البيت. من صبر على أولاده نال الأجر العظيم. وقد صبر عليهم 150 ألف أب. " +
    "الصبر جذر والأجر ثمرته الطيبة. والبيت الهادئ يربي أولادا هادئين. والسلام عليكم ورحمة الله وبركاته.";
  /* a plain speech (no due element, no sections, no mention): nothing on the board where the two planned scraps go, so writing_place itself judges them */
  const PLAIN = "اليوم نتكلم عن الصبر في البيت. الصبر خلق عظيم عند الناس كلهم. والبيت الهادئ يربي أولادا هادئين دائما. من صبر على أولاده نال الأجر الكبير. " +
    "والصبر مفتاح كل خير في البيت. والكلمة الطيبة تبني البيت الطيب. والولد يتعلم من أبيه كل يوم. والبيت الصابر بيت سعيد دائما. " +
    "والرجل الحليم يملك نفسه عند الغضب. والصبر عاقبته خير كثير. والسلام عليكم ورحمة الله وبركاته.";
  const fakeBuild = async (n, { speech = SPEECH, sections = true, writing = [], metaphors = null, nameAt = 12 } = {}) => {
    const p = pName(n), T = path.join(D, n), W = speech.split(" ").map((w, i) => ({ w, s: +(0.3 + i * 0.45).toFixed(2), e: +(0.3 + i * 0.45 + 0.4).toFixed(2) })), dur = Math.ceil(W.at(-1).e + 3.6);
    put(path.join(T, "cut_words.json"), W); put(path.join(T, "drift_fresh.json"), W);
    if (sections) put(path.join(T, "sections.json"), [{ title: "الصبر في البيت", at: 0 }, { title: "لماذا يغضب الإنسان", at: 6 }, { title: "الغضب نار", at: 13 }, { title: "الأجر العظيم", at: 19 }]);
    put(path.join(T, "moves.json"), { zooms: [{ from: 10, to: 12, why: "اختبار", text: "" }], shake: [] });
    const rq = put(path.join(T, "requirements.json"), []); const later = new Date(Date.now() + 5000); fs.utimesSync(rq, later, later);
    const base = put(path.join(D, `${n}.base.json`), JSON.stringify({ id: p, title: "اختبار التجربة", fps: 30, frames: dur * 30, cut: CUT, galleryRef: true, brand: "steel", date: "2026-11-21", showTitleBar: true, zooms: [], shake: [], items: [{ t: "nameTag", at: nameAt, dur: 3 }] }, null, 1));
    const tplF = path.join(D, `${n}.tpl.json`), out = path.join(D, `${n}.out.json`);
    const t = await runAsync(NODE, [mbTool, p, "--base", base, "--picks-template", "--out", tplF], { cwd: ROOT, timeout: 60000 });
    let tpl = {}; try { tpl = JSON.parse(fs.readFileSync(tplF, "utf8")); } catch { /* none */ }
    tpl.moments = { ...(tpl.moments ?? {}), cover: { el: null, vals: { src: "anchor-kills-children/cover_gpt.png" } } };
    tpl.writing = writing; if (metaphors) tpl.metaphors = metaphors;
    const pk = put(path.join(D, `${n}.picks.json`), tpl);
    const r = await runAsync(NODE, [mbTool, p, "--base", base, "--picks", pk, "--out", out, "--no-mattes"], { cwd: ROOT, timeout: 300000 });
    let s = null; try { s = JSON.parse(fs.readFileSync(out, "utf8")); } catch { /* none */ }
    return { t, r, s, tpl };
  };
  let fb = null, fw = null; const FB = () => (fb ??= fakeBuild("tplbuild"));
  /* two scraps of his words in ONE minute (the 11:14 failure itself): writing_place refuses both, the builder drops them and fills the gaps again */
  const FW = () => (fw ??= fakeBuild("wpbuild", { speech: PLAIN, writing: [{ t: "scraps", text: "يربي أولادا هادئين", from: 6 }, { t: "scraps", text: "نال الأجر الكبير", from: 10 }], metaphors: [{ el: "WordCloud", vals: { at: 17 } }], nameAt: 13.6 }));
  const why = (x) => `خروج ${x.r.status}: ${(x.r.out + x.r.err).split(/\r?\n/).filter((l) => /✘|BUG|رفض/.test(l)).slice(0, 4).join(" | ").slice(0, 300)}`;
  const longCase = (id, files, ledger, title, fn) => (HOOKED ? manual(id, files, ledger, title, "بناء كامل و16 بوابة (30–60 ث) فوق مهلة الهوك: node tools/guard_selftest.mjs --for tools/montage_build.mjs") : add(id, files, ledger, title, fn));
  longCase("mb.refused_writing_refilled", "tools/montage_build.mjs", BL, "writing_place يرفض عبارتين في خطة الباني (قصاصتان في دقيقة واحدة) ← تخرجان من الخطة ويُملأ مكانها في الدورة التالية، وكل البوابات تنجح — لا مواصفة تُكتب بلا كتابة", async () => {
    const x = await FW();
    return expect(x.r.status === 0 && /✔ كل البوابات \(\d+\) نجحت من أول تشغيل/.test(x.r.out) && /writing_place رفضها/.test(x.r.out) && (x.s?.items ?? []).filter((i) => i.t === "scraps").length <= 1, why(x));
  });
  longCase("mb.bumper_planned_by_build", "tools/montage_build.mjs", "builder-bumper-after-build", "حلقة بلا فاصل في الأساس: الباني يضعه بنفسه (bumper_at --write على النسخة) — لا «لا فاصل في الخطة» على ما بناه", async () => {
    const x = await FB(), b = x.s?.bumper;
    return expect(x.r.status === 0 && b && (Number(b.at) > 0 || b.end), `${why(x)} — الفاصل: ${JSON.stringify(b)}`);
  });
  longCase("mb.template_is_no_pick", "tools/montage_build.mjs", "builder-template-entry-not-a-pick", "ملف الاختيارات = القالب نفسه (كل لحظة el: null): يُبنى كالافتراضي — العناصر المستحقة موجودة، ولا لحظة تُسمّى ناقصة", async () => {
    const x = await FB(), els = new Set((x.s?.items ?? []).map((i) => i.el ?? i.t));
    return expect(x.t.status === 0 && Object.keys(x.tpl.moments ?? {}).length >= 3 && x.r.status === 0 && !/ينقص البناءَ/.test(x.r.out) && ["BigQuestion", "AlertFrame"].every((e) => els.has(e)), `${why(x)} — العناصر ${[...els].join(",").slice(0, 160)}`);
  });
  longCase("mb.moves_when_base_has_none", "tools/montage_build.mjs", "reel-not-built-by-builder", "أساس بلا حركات (ريل من حلقة): الباني يأخذ التقريب من moves.json (خطة الحركات) فلا «الحركات: 0 تقريب»", async () => {
    const x = await FB();
    return expect(x.r.status === 0 && x.s?.zooms?.[0]?.from === 10 && Array.isArray(x.s?.shake), `${why(x)} — الحركات ${JSON.stringify(x.s?.zooms)}`);
  });
  add("mb.generator_fail_never_written_src", "tools/montage_build.mjs", BL, "المصدر: مولّد فشل على النسخة = لا كتابة للمواصفة الحقيقية (يُعدّ بوابة فاشلة)، والعبارات المرفوضة لا تُعرض ثانية", async () => {
    const s = src("tools/montage_build.mjs");
    return expect(/const genBad = genFail \|\| !gates \?/.test(s) && /if \(genBad\) bad\.push\(genBad\);/.test(s) && /if \(genBad && !pbad\.includes\(genBad\)\) pbad\.push\(genBad\)/.test(s) && /REJECTED\.add\(t\)/.test(s) && /!REJECTED\.has\(x\.text\)/.test(s), "حارس فشل المولّد أو العبارات المرفوضة اختفى");
  });
  add("mb.template_entry_src", "tools/montage_build.mjs", "builder-template-entry-not-a-pick", "المصدر: العنصر المستحق يذهب إلى فراغ ما لم يختر الوكيل عنصراً فعلاً (el أو code)، والمعنى المجسّد كذلك", async () => {
    const s = src("tools/montage_build.mjs");
    return expect(/m\.kind === "due" && !\(P\[m\.id\]\?\.el \|\| P\[m\.id\]\?\.code\)/.test(s) && /g = g0\?\.el \|\| g0\?\.code/.test(s), "شرط «اختيار الوكيل» عاد إلى وجود المدخل وحده");
  });
  add("mb.gaps_to_video_end_src", "tools/montage_build.mjs", "builder-gap-end-drift", "المصدر: مرآة الفراغات في الباني تعدّ إلى آخر الفيديو (layers gaps) لا إلى ما قبله بثلاث ثوانٍ (coverage_check) — الأشد منهما", async () => {
    const s = src("tools/montage_build.mjs"), g = s.slice(s.indexOf("function gapsOf("), s.indexOf("function firstGapsOf("));
    const lg = src("tools/layers.mjs");
    return expect(/if \(DUR - end > minGap\) out\.push\(\[end, DUR\]\)/.test(g) && !/DUR - 3/.test(g) && /if \(dur - end > GAP\) gaps\.push\(\[end, dur\]\)/.test(lg), "الباني أو layers gaps غيّر حدّ آخر الفيديو");
  });

  /* ── 6, 7) the scratch workspace: the cut audio linked; a real build after a scratch one ── */
  const SB = ["tools/lib/gate_sandbox.mjs", "tools/montage_build.mjs"];
  add("sandbox.cut_audio_and_public_kind", SB, "builder-sandbox-cut-audio", "نسخة العمل: صوت القص موجود فيها بحجمه وزمنه (رابط صلب) فلا يرى cut_lazy «الصوت تغيّر»؛ ونسخة حقيقية بعد نسخة تجريبية للمشروع نفسه لا ترفض «public/ of links»", async () => {
    const { makeSandbox } = await imp("tools/lib/gate_sandbox.mjs");
    const p = pName("sbp"), T0 = path.join(D, "sbp"), wav = put(path.join(T0, "cut_audio.wav"), "RIFF-fake-audio-bytes"); put(path.join(T0, "cut_state.json"), { map: "x", audio: "y" });
    const name = path.relative(path.join(ROOT, ".tmp", "selftest", "montage_build"), path.join(D, "sbroot"));
    let a = null, b = null, err = "";
    try {
      a = makeSandbox(p, { name, ownPublic: true });
      const st0 = fs.statSync(wav), st1 = (() => { try { return fs.statSync(path.join(a.tmp, "cut_audio.wav")); } catch { return null; } })();
      const same = st1 && st1.size === st0.size && Math.abs(st1.mtimeMs - st0.mtimeMs) < 5;
      a.release();
      try { b = makeSandbox(p, { name, ownPublic: false }); } catch (e) { err = String(e.message ?? e); }
      const junc = b ? fs.lstatSync(b.pub).isSymbolicLink() : false;
      return expect(same && !err && junc, `صوت القص في النسخة: ${st1 ? `${st1.size} بايت` : "غائب"} (المطابقة ${same}) · نسخة حقيقية بعد التجريبية: ${err || (junc ? "رابط إلى public" : "ليس رابطاً")}`);
    } finally { try { b?.release(); } catch { /* gone */ } try { a?.release(); } catch { /* gone */ } }
  });
  add("mb.sandbox_names_src", "tools/montage_build.mjs", "builder-sandbox-public-kind", "المصدر: البناء التجريبي (--out) في نسخة عمل غير نسخة البناء الحقيقي", async () => {
    const s = src("tools/montage_build.mjs");
    return expect(/const SB_NAME = `build_\$\{p\}\$\{REAL \? "" : "_scratch"\}`/.test(s) && /makeSandbox\(p, \{ name: SB_NAME, ownPublic: !REAL \}\)/.test(s), "اسم نسخة العمل لم يعد يفرّق الحقيقي من التجريبي");
  });

  /* ── 8) the reel: moves, cams, registration, built by the builder ── */
  const RL = "reel-not-built-by-builder";
  add("reel.cams_and_registration_src", ["tools/reel_from_episode.mjs", "tools/lib/face_zone.mjs", "tools/rehearsal.mjs"], RL, "المصدر: الريل يأخذ كاميرا وجه الحلقة مزاحة إلى زمنه، ويُسجَّل مونتاجاً، ويقول إن التالي بناؤه بالباني؛ ومنطقة الوجه تقبل قائمة كاميرا فارغة؛ والتجربة تبني الريل بالباني", async () => {
    const r = src("tools/reel_from_episode.mjs"), fz = src("tools/lib/face_zone.mjs"), rh = src("tools/rehearsal.mjs");
    return expect(/cams: reelCams/.test(r) && /\(epSpec\.cams \?\? \[\]\)\.forEach/.test(r) && /\["tools\/montage_guard\.mjs", "start", id\]/.test(r) && /node tools\/montage_build\.mjs \$\{id\} --picks-template/.test(r) && /spec\.cams\?\.length \? spec\.cams :/.test(fz) && /\[node, "tools\/montage_build\.mjs", REEL, "--picks"/.test(rh), "حلقة الريل (الكاميرا، التسجيل، البناء) انقطعت");
  });

  /* ── 9) orphan_scan on the aligned word table ── */
  const OL = "orphan-false-pause-pieces";
  const orphanRoot = (n, extraRemoved) => {
    const R = path.join(D, n); put(path.join(R, "tools", "orphan_scan.mjs"), src("tools/orphan_scan.mjs"));
    put(path.join(R, "public", "zzorph_map.json"), { segments: [{ a: 0, b: 2 }, { a: 4.5, b: 5.5 }, { a: 8, b: 10 }] });   // a 1.0 s piece between two 2.5 s cuts
    const T = path.join(R, ".tmp", "zzorph");
    put(path.join(T, "cut_words.json"), [{ w: "أول", s: 0.2, e: 1.8 }, { w: "الإنسان", s: 2.1, e: 2.7 }, { w: "هذا", s: 3.1, e: 3.6 }]);
    /* the raw words put the KEPT words' starts 0.3 s early, inside the cuts; the aligned table has them inside their kept stretches */
    put(path.join(T, "words.json"), [{ w: "أول", s: 0.2, e: 1.8 }, { w: "الإنسان", s: 4.3, e: 5.0 }, { w: "هذا", s: 7.8, e: 8.6 }]);
    put(path.join(T, "words_table.json"), { words: [{ w: "أول", s: 0.2, e: 1.8 }, ...(extraRemoved ? [{ w: "محذوفة", s: 3.0, e: 3.6 }] : []), { w: "الإنسان", s: 4.6, e: 5.2 }, ...(extraRemoved ? [{ w: "محذوفة2", s: 6.5, e: 7.0 }] : []), { w: "هذا", s: 8.1, e: 8.6 }] });
    return runAsync(NODE, [path.join(R, "tools", "orphan_scan.mjs"), "zzorph"], { cwd: R, timeout: 20000 });
  };
  add("orphan.kept_words_not_orphans", "tools/orphan_scan.mjs", OL, "قطعة بين سكتتين محذوفتين لمتكلم بطيء (كلماته كلها باقية في جدول الكلمات المحاذى) ليست بقايا، ولو وقعت بدايات كلماته في التفريغ الخام داخل الحذف", async () => {
    const x = await orphanRoot("orph_ok", false);
    return expect(x.status === 0 && /✔ orphan_scan/.test(x.out), `خروج ${x.status}: ${x.out.trim().slice(0, 200)} ${x.err.slice(0, 120)}`);
  });
  add("orphan.real_removal_flagged", "tools/orphan_scan.mjs", OL, "وقطعة حُذف كلام حقيقي قبلها وبعدها (في الجدول المحاذى) تبقى منبَّهاً عليها", async () => {
    const x = await orphanRoot("orph_bad", true);
    return expect(x.status === 1 && /قطعة صغيرة بين حذفين/.test(x.out), `خروج ${x.status}: ${x.out.trim().slice(0, 200)} ${x.err.slice(0, 120)}`);
  });

  /* ── 10) judder: no file / no comparable step is its own verdict; the render script never measures a failed render ── */
  const JL = "judder-zero-steps-no-file", JF = ["tools/judder_check.mjs", "tools/gpu/render_project.sh"];
  add("judder.no_file_no_verdict", JF, JL, "فحص الارتجاف على ملف غير موجود: «لا ملف للقياس» (خروج 3) لا «0/0 … FAILED (stale/skipped frames)»", async () => {
    const x = await runAsync(NODE, [path.join(ROOT, "tools", "judder_check.mjs"), path.join(D, "nothing.mp4"), "--src", path.join(D, "nothing.mp4"), "--name", "zz_selftest_jnf", "--at", "1"], { cwd: ROOT, timeout: 20000 });
    return expect(x.status === 3 && /NO FILE/.test(x.out) && !/stale\/skipped/.test(x.out), `خروج ${x.status}: ${x.out.trim().slice(0, 200)}`);
  });
  add("judder.zero_steps_no_verdict", JF, JL, "نافذة خارج الملف (0 خطوة للمقارنة): «لا حكم» (خروج 3) لا اتهام الرندر بإطارات متأخرة", async () => {
    const f = path.join(D, "tiny.mp4"); fs.mkdirSync(D, { recursive: true });
    const mk = await runAsync("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", "testsrc=size=320x240:rate=30:duration=2", "-c:v", "mpeg4", "-q:v", "5", "-threads", "2", f], { timeout: 30000 });
    if (mk.status !== 0) return expect(false, "ffmpeg: " + mk.err.slice(-160));
    const x = await runAsync(NODE, [path.join(ROOT, "tools", "judder_check.mjs"), f, "--src", f, "--name", "zz_selftest_jzs", "--at", "60", "--crop", "0,0,320,240"], { cwd: ROOT, timeout: 30000 });
    return expect(x.status === 3 && /NO STEPS/.test(x.out) && !/stale\/skipped/.test(x.out), `خروج ${x.status}: ${x.out.trim().slice(0, 240)}`);
  });
  add("render.failed_render_not_measured_src", ["tools/gpu/render_project.sh", "tools/rehearsal.mjs"], JL, "المصدر: رندر خرج بغير صفر أو بلا ملف يقول سببه ولا يُقاس ارتجافه؛ والتجربة لا تستأنف عمل الكرت الموقوف بين رندريها (GPU_KEEP_PAUSED)", async () => {
    const s = src("tools/gpu/render_project.sh"), rh = src("tools/rehearsal.mjs"), iRc = s.indexOf('if [ $rc != 0 ] || [ ! -f "$out/$comp.mp4" ]'), iJ = s.indexOf("fw=$(node tools/free_windows.mjs");
    return expect(iRc > 0 && iRc < iJ && /continue; fi/.test(s.slice(iRc, iRc + 400)) && /\[ -z "\$GPU_KEEP_PAUSED" \] && node tools\/lib\/gpu_busy\.mjs resume/.test(s) && /GPU_KEEP_PAUSED: "1"/.test(rh) && /resumePaused\(\{ by: P/.test(rh), "سقط فحص خروج الرندر قبل الارتجاف أو حارس الاستئناف");
  });

  /* ── 11) the rehearsal reports what it ran; the builder closes its plan with its evidence ── */
  add("rehearsal.reports_stages_src", ["tools/rehearsal.mjs", "tools/montage_build.mjs"], "rehearsal-guard-unreported", "المصدر: التجربة تكتب تقرير كل مرحلة نجحت للحارس (الأسئلة، القص، السياق، الأصول، الغلاف، الريل، الخطة، الهوك، البناء، المراجعة)، والباني يسجّل عناصره بنود خطة مغلقة بدليل البوابات في البناء الحقيقي الناجح وحده", async () => {
    const rh = src("tools/rehearsal.mjs"), mb = src("tools/montage_build.mjs");
    const stages = ["questions", "cut", "context", "assets", "cover", "plan", "hook", "build", "review"].every((st) => new RegExp(`G\\([A-Z]+, "${st}"|G\\(proj, "${st}"`).test(rh));
    return expect(stages && /if \(r\.ok && !r\.skipped\) REPORT\[s\.id\]\?\.\(\)/.test(rh) && /else reportBuilt\(c\[2\], picks\)/.test(rh) && /reportReview\(P\)/.test(rh) && /reportReview\(REEL\)/.test(rh) && /if \(REAL && !pbad\.length\) \{\s*const PF = path\.join\(T, "plan\.json"\)/.test(mb), "تقرير مرحلة أو بنود خطة الباني سقط");
  });
  add("rehearsal.to_stage_src", "tools/rehearsal.mjs", "rehearsal-guard-unreported", "المصدر: --to يوقف التجربة بعد مرحلته بلا حذف، والتشغيل الجزئي لا يُسجَّل نجاحاً للتجربة", async () => {
    const rh = src("tools/rehearsal.mjs");
    return expect(/if \(passedTo\) \{ res\[s\.id\] = \{ status: "skipped" \}; continue; \}/.test(rh) && /rec\.ok = !fails\.length && !rec\.to && !rec\.from/.test(rh), "الإيقاف بعد مرحلة أو تمييز التشغيل الجزئي سقط");
  });
};
