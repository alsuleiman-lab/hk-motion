/* THE STREAM DRESS REHEARSAL (tools/stream/stream_rehearsal.mjs, 2026-11-22 — «لازم ما أشوف أخطاء» on a 3 h 47 min stream): the engine bugs it found on a 10-minute sample
   of the real stream, each guarded here so the real stream never meets them:
   1) cut-speech-past-media-end      a recording that ends while he is still speaking: the VAD (measured on the 16 kHz wav, 0.1–0.3 s longer than the container) gave a speech
                                     stretch past the end of the video and the plan failed «قطع داخل كلمة» on a word nobody could keep — stage cut stopped, nothing built
   2) lost-speech-ordered-rem        every retake dropped by a written decision (--rem from redo.txt) failed lost_speech_check «مقصوصة بالقص», so the one cut that passed stopped the run
   3) stream-clip-no-bumper          coverage_check refused every landscape stream clip «لا فاصل في الخطة» (the stream builder never placed the bumper; the montage places it, the render adds none)
   4) stream-rehearsal-scoped        the rehearsal's own purge/plan must stay scoped to zz_stream_rehearsal* and never touch Videos or another project
   No GPU: scratch roots under .tmp/selftest/<run>/l_sr/, tiny CPU-made files (ffmpeg lavfi); the real project folders are never written. */
export default async (api) => {
  const { add, expect, put, runAsync, RUN, ROOT, NODE, path, fs } = api;
  const { pathToFileURL } = await import("node:url");
  const D = path.join(RUN, "l_sr");
  const src = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
  const imp = (f) => import(pathToFileURL(path.join(ROOT, f)).href);

  /* ── 1) the media end: a scratch cwd with a 5 s video, a VAD stretch to 5.3 and a last word to 5.25 ── */
  const CM = "tools/cut_model.mjs", CML = "cut-speech-past-media-end";
  const cmRun = async (code) => {
    const T = path.join(D, "cm"); put(path.join(T, ".tmp", "p1", "vad.json"), { speech: [[0.5, 2.0], [3.0, 5.3]] });
    put(path.join(T, ".tmp", "p1", "words_table.json"), { words: [{ w: "ا", s: 0.6, e: 1.0 }, { w: "ب", s: 3.2, e: 3.6 }, { w: "ج", s: 4.9, e: 5.25 }] });
    fs.mkdirSync(path.join(T, "public"), { recursive: true });
    const mp4 = path.join(T, "public", "p1_src.mp4");
    if (!fs.existsSync(mp4)) { const r = await runAsync("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", "color=c=black:s=64x64:d=5:r=30", "-f", "lavfi", "-i", "sine=d=5", "-t", "5", "-c:v", "libx264", "-c:a", "aac", mp4], { cwd: T, timeout: 60000 }); if (r.status !== 0) return { err: `ffmpeg: ${r.err.slice(-200)}` }; }
    const x = await runAsync(NODE, ["--input-type=module", "-e", `const m = await import(${JSON.stringify(pathToFileURL(path.join(ROOT, CM)).href)}); ${code}`], { cwd: T, timeout: 60000 });
    try { return JSON.parse(x.out.trim().split("\n").pop()); } catch { return { err: (x.err || x.out).slice(-300) }; }
  };
  add("sr.media_end_clamp_words", CM, CML, "كلمة أخيرة تنتهي بعد نهاية الفيديو (الصوت أطول من الحاوية): تُقصّ عند نهايته لا تُترك مقطوعة بالحافة", async () => {
    const r = await cmRun(`const t = m.loadTable("p1"); console.log(JSON.stringify({ d: m.mediaDur("p1"), e: t.words.map((w) => w.e) }));`);
    return expect(!r.err && Math.abs(r.d - 5) < 0.2 && r.e.every((e) => e <= r.d + 1e-6) && Math.abs(r.e.at(-1) - r.d) < 1e-6, r.err ?? `المدة ${r.d} ونهايات الكلمات ${JSON.stringify(r.e)}`);
  });
  add("sr.media_end_clamp_untranscribed", CM, CML, "كلام لم يُفرَّغ يمتد حتى آخر الملف: كلمته الصورية تنتهي عند نهاية الفيديو (لا «قطع داخل كلمة» على ما لا يُبقى)", async () => {
    const r = await cmRun(`const t = m.loadTable("p1"), u = m.untranscribed("p1", [t.words[1]]); console.log(JSON.stringify({ d: m.mediaDur("p1"), e: u.map((w) => w.e) }));`);
    return expect(!r.err && r.e.length >= 1 && r.e.every((e) => e <= r.d + 1e-6), r.err ?? `المدة ${r.d} ونهايات الصورية ${JSON.stringify(r.e)}`);
  });
  add("sr.media_end_verify_passes", CM, CML, "الخطة على تسجيل ينتهي أثناء الكلام تجتاز verifyCut (كان يفشل «قطع داخل كلمة» ويقف القص)", async () => {
    const r = await cmRun(`const t = m.loadTable("p1"), w = [...t.words, ...m.untranscribed("p1", t.words)], seg = m.buildPlan(w, { duration: m.mediaDur("p1") }), v = m.verifyCut({ segments: seg, words: w }); console.log(JSON.stringify({ n: seg.length, bad: v.filter((x) => x.kind === "قطع داخل كلمة").length }));`);
    return expect(!r.err && r.n > 0 && r.bad === 0, r.err ?? `${r.bad} قطع داخل كلمة`);
  });

  /* ── 2) lost_speech_check on a COPY of the tool in a scratch root (it chdirs to its own ../..) ── */
  const LS = "tools/stream/lost_speech_check.mjs", LSL = "lost-speech-ordered-rem";
  const lostRun = async (name, withRem) => {
    const root = path.join(D, name); fs.mkdirSync(path.join(root, "tools", "stream"), { recursive: true }); fs.copyFileSync(path.join(ROOT, LS), path.join(root, LS));
    const W = [], C = [], t0 = (i) => +(1 + i * 0.7).toFixed(2);
    for (let i = 0; i < 10; i++) W.push({ w: ["كلمة", "طويلة", "جدا", "وقال", "الشيخ", "بصوت", "واضح", "ومسموع", "للجميع", "هنا"][i], s: t0(i), e: t0(i) + 0.5 });
    const ret = [{ w: "عنده", s: 10.2, e: 10.6 }, { w: "شيء", s: 10.7, e: 11.0 }, { w: "من", s: 11.1, e: 11.3 }, { w: "الأعمال", s: 11.4, e: 11.9 }];   // the retake: said, dropped by a written decision
    for (let i = 0; i < 6; i++) W.push({ w: ["ثم", "قال", "الشيخ", "كلاما", "آخر", "طويلا"][i], s: 13 + i * 0.7, e: 13.5 + i * 0.7 });
    put(path.join(root, ".tmp", "pp", "words_vad.json"), [...W.slice(0, 10), ...ret, ...W.slice(10)]);
    put(path.join(root, ".tmp", "pp", "cut_words.json"), W);
    put(path.join(root, "public", "pp_map.json"), { segments: [{ a: 0, b: 10, n: 0 }, { a: 12, b: 20, n: 10 }], duration: 18 });
    if (withRem) put(path.join(root, ".tmp", "pp", "explicit_rem.json"), [[10.1, 12]]);
    const x = await runAsync(NODE, [path.join(root, LS), "pp"], { cwd: root, timeout: 30000 });
    return { code: x.status, out: x.out + x.err };
  };
  add("sr.lost_speech_ordered_rem_ok", LS, LSL, "كلمات حُذفت بأمر --rem (explicit_rem.json) ليست «ضائعة»: الفحص ينجح ويذكر أنها قرار مكتوب", async () => {
    const r = await lostRun("lsc_ok", true);
    return expect(r.code === 0 && /حُذفت بأمر --rem/.test(r.out) && !/✘/.test(r.out), `الخروج ${r.code}: ${r.out.slice(0, 200)}`);
  });
  add("sr.lost_speech_unordered_still_fails", LS, LSL, "الكلمات نفسها لو لم تُحذف بأمر ما زالت «مقصوصة بالقص» ويفشل الفحص (الحارس لم يُعطَّل)", async () => {
    const r = await lostRun("lsc_bad", false);
    return expect(r.code === 1 && /مقصوصة بالقص/.test(r.out), `الخروج ${r.code}: ${r.out.slice(0, 200)}`);
  });

  /* ── 3) the bumper of a stream clip is placed by the clip builder, at the end ── */
  const BL = "stream-clip-no-bumper";
  add("sr.bumper_end_flag_src", ["tools/bumper_at.mjs", "tools/stream/clip_build.mjs"], BL, "المصدر: bumper_at يقبل --end (الخاتمة مهما كان اسم المقطع ونوعه) وclip_build يضعه قبل التطبيع (فيراه تقرير «الباقية»)", async () => {
    const ba = src("tools/bumper_at.mjs"), cb = src("tools/stream/clip_build.mjs"), iN = cb.indexOf("tools/spec_normalize.mjs"), iB = cb.indexOf("bumper_at.mjs ${id} --write --end");
    return expect(/const END_AT = process\.argv\.includes\("--end"\)/.test(ba) && iN > 0 && iB > 0 && iB < iN, "الفاصل لم يعد يُوضع في خاتمة مقطع البث");
  });

  /* ── 3b) the slice: the clip's word table is the PARENT's aligned table, and a failed gate fails the slice ── */
  const SL = "tools/stream/clip_slice.mjs", SLL = "slice-gate-failed-passed";
  add("sr.slice_table_and_exit_src", SL, SLL, "المصدر: clip_slice يكتب words_table.json للمقطع من جدول الأب المحاذى (قبل بوابة الصوت)، ويخرج بـ1 إن طبعت البوابة ✘ (كان يطبعها ويخرج 0)", async () => {
    const t = src(SL), iT = t.indexOf('"words_table.json"'), iG = t.indexOf('"tools/audio_gate.mjs"'), iX = t.indexOf('out.some((l) => l.startsWith("✘"))');
    return expect(iT > 0 && iG > iT && iX > iG && /remapped from \$\{P\}/.test(t) && /srcToCut\(s0\)/.test(t) && /process\.exit\(1\)/.test(t.slice(iX, iX + 1200)), "جدول الكلمات أو الخروج 1 اختفى من clip_slice");
  });
  add("sr.sections_not_for_slices", "tools/prepublish_gates.mjs", "stream-slice-needs-sections", "مقطع مقتطع من بث أو درس (prep_config.slicedFrom) لا يُطلب له قسم ولو لم يبدأ اسمه بـstream_ (كان العرضي منه يفشل «لا أقسام»)", async () => {
    const G = await imp("tools/prepublish_gates.mjs"), root = path.join(D, "sec"), sp = { id: "zzq_2" };
    put(path.join(root, ".tmp", "zzq_2", "prep_config.json"), { slicedFrom: "zzq" }); put(path.join(root, ".tmp", "zzq_3", "prep_config.json"), { source: "x.mp4" });
    return expect(G.appliesToEpisode("zzq_2", sp, root) === false && G.appliesToEpisode("zzq_3", { id: "zzq_3" }, root) === true, "الشريحة تُطلب لها أقسام، أو الحلقة العادية لم تعد تُطلب لها");
  });
  add("sr.autobuild_no_waiver_src", ["tools/stream/clip_autobuild.mjs", "tools/stream/clip_pictures.mjs"], "stream-template-waivers", "المصدر: قالب البث لا يكتب إعفاءً (skipPicks / skipRequired) — يسرد المستحق في needs_picks.json، وclip_pictures يضيف عنصر كل مستحق من pictures.json بـvals", async () => {
    const ab = src("tools/stream/clip_autobuild.mjs"), cp = src("tools/stream/clip_pictures.mjs");
    return expect(!/sp\.skipPicks\s*=/.test(ab) && !/sp\.skipRequired\s*=/.test(ab) && /needs_picks\.json/.test(ab) && /p\.vals/.test(cp) && /Object\.entries\(p\.vals/.test(cp), "الإعفاء الآلي عاد إلى القالب أو سقط دعم vals");
  });

  add("sr.pictures_clear_before_add_src", "tools/stream/clip_pictures.mjs", "stream-template-waivers", "المصدر: clip_pictures يفسح الطريق (clearFor) قبل كل el.mjs add — el.mjs يرفض ما يجلب مخالفة، ولوحات القالب تملأ كل موضع — وينقل بطاقة الاسم والاشتراك لا يحذفها", async () => {
    const t = src("tools/stream/clip_pictures.mjs"), iC = t.indexOf("clearFor(s1,"), iA = t.indexOf('"tools/el.mjs", "add"');
    return expect(t.includes("function clearFor(") && iC > 0 && iA > iC && /nameTag/.test(t) && /نُقل/.test(t), "الإفساح قبل الإضافة اختفى");
  });

  /* ── 3c) the gate's join click: an energy blip in the room noise is not a click; the engine's one measure of a join decides ── */
  const AG = "tools/audio_gate.mjs", AGL = "gate-inaudible-join-click";
  const wav = (name, blip) => {   // 3 s of room noise (rms ≈ 0.001, −60 dBFS) with ONE sample jump of `blip` at 1.5 s; 16-bit mono 48 kHz
    const f = path.join(D, "seam", name), n = 48000 * 3, b = Buffer.alloc(44 + n * 2); let seed = 7; const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff - 0.5) * 2;
    b.write("RIFF", 0); b.writeUInt32LE(36 + n * 2, 4); b.write("WAVEfmt ", 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(48000, 24); b.writeUInt32LE(96000, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(n * 2, 40);
    for (let i = 0; i < n; i++) { let v = rnd() * 0.0017; if (i >= 72000 && i < 72004) v += blip; b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v * 32768))), 44 + i * 2); }
    fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, b); return f;
  };
  add("sr.seam_blip_inaudible_click_audible", ["tools/join_seam_check.mjs", AG], AGL, "قياس الوصلة الواحد: نتوء 0.002 في ضجيج الغرفة ليس نقرة، ونقرة 0.3 نقرة (على هذا يحكم audio_gate بعد الماسح الطاقي)", async () => {
    const SJ = await imp("tools/join_seam_check.mjs"), small = SJ.checkFile(wav("small.wav", 0.002), [{ t: 1.5, kind: "cut" }], null)[0], big = SJ.checkFile(wav("big.wav", 0.3), [{ t: 1.5, kind: "cut" }], null)[0];
    return expect(!small.issues.some((i) => /^نقرة/.test(i)) && big.issues.some((i) => /^نقرة/.test(i)), `الصغير: ${small.issues.join("؛") || "نظيف"} | الكبير: ${big.issues.join("؛") || "لم تُكشف"}`);
  });
  add("sr.gate_click_uses_seam_src", AG, AGL, "المصدر: audio_gate يعيد قياس كل وصلة يُعلّمها الماسح الطاقي بقياس الوصلة الواحد (join_seam_check) في خطة النموذج، ولا يُسقطها صامتاً (يطبع ما لم يُسمع)", async () => {
    const t = src(AG), iJ = t.indexOf("join_click_scan.py"), iS = t.indexOf('import("./join_seam_check.mjs")');
    return expect(iJ > 0 && iS > iJ && /planMap\?\.model === "cut_model"/.test(t.slice(iJ, iS)) && /لا تُسمع/.test(t) && /SJ\.mapJoins\(planMap\.segments\)/.test(t), "حكم الوصلة الواحد غاب عن بوابة الصوت");
  });

  add("sr.mix_edges_sfx_onset_not_edge", "tools/prerender_check.mjs", "sfx-onset-flagged-click", "حواف المزيج: بداية مؤثر صوتي (public/sfx) ليست حافة (كانت «نقرة ×59» فلا يمرّ مقطع)، ونهايته وكل سجل آخر بداية ونهاية تبقى حافة", async () => {
    const { mixEdges } = await imp("tools/prerender_check.mjs"), e = mixEdges([{ src: "public/sfx/el_tick.wav", at: 3, frames: 45 }, { src: "public/x_cut_s.mp4", at: 0, frames: 600 }, { src: "public/fawasel/f.mp4", at: 600, frames: 150 }], 750);
    return expect(JSON.stringify(e) === JSON.stringify([1.6, 20]), `الحواف ${JSON.stringify(e)}`);
  });

  add("sr.asr_audit_local_loader", "tools/asr_audit.mjs", "asr-audit-local-loader", "asr_audit: ملف يعرّف load_model بنفسه على large-v3 (واستدعاؤه ولو عبر وحدة tvs.load_model) لا يُخطَّأ، ونموذج أضعف ما زال يُرفض", async () => {
    const ok = path.join(D, "asr_ok"), bad = path.join(D, "asr_bad");
    put(path.join(ok, "tools", "a.py"), ['def load_model(threads=4):', '    return WhisperModel("large-v3", device="cuda", compute_type="float16")', "m = load_model(THREADS)", ""].join("\n")); put(path.join(ok, "tools", "c.py"), "m = tvs.load_model()\n");
    put(path.join(bad, "tools", "a.py"), ["def load_model(threads=4):", "    return Whisper" + "Model(" + '"small"' + ", device=" + '"cuda"' + ")", ""].join("\n"));
    const r1 = await runAsync(NODE, [path.join(ROOT, "tools", "asr_audit.mjs")], { cwd: ok }), r2 = await runAsync(NODE, [path.join(ROOT, "tools", "asr_audit.mjs")], { cwd: bad });
    return expect(r1.status === 0 && r2.status === 1, `الصحيح خرج ${r1.status}: ${r1.out.slice(0, 120)} | الأضعف خرج ${r2.status}`);
  });

  add("sr.repair_panel_held_src", "tools/stream/clip_repair.mjs", "repair-panel-overlap", "المصدر: clip_repair لا يبني لوحة سدّ فراغ تُمسك بعد آخر سطر فيها إلى ما بعد الفراغ (آخر سطر + 2.3ث ≤ نهاية الفراغ)", async () => {
    const t = src("tools/stream/clip_repair.mjs");
    return expect(t.includes("held = (l, many) => l.at + (many ? 0 : Math.max(0.5") && t.includes("+ 2.3 <= until1") && t.includes("rsK.length"), "حساب الإمساك غاب عن لوحة سدّ الفراغ");
  });

  /* ── 3d) the mix is the picture's length: a stream clip with an END bumper whose sound is shorter than its picture ── */
  const AUD = "tools/lib/audio_plan.mjs", AUL = "mix-shorter-than-picture";
  const mixLen = async (codec) => {   // 6 s stereo voice, two 0.05 s mono ticks (44.1 kHz), a mono 1.5 s bumper sound delayed to 6.0 s whose picture is 2 s: picture = 8 s (240 frames)
    const T = path.join(D, "mix");
    fs.mkdirSync(T, { recursive: true });
    const mk = async (n, a) => { const o = path.join(T, n); if (!fs.existsSync(o)) { const r = await runAsync("ffmpeg", ["-v", "error", "-y", ...a, o], { cwd: T, timeout: 60000 }); if (r.status !== 0) throw new Error("ffmpeg: " + r.err.slice(-200)); } return o; };
    const voice = await mk("voice.wav", ["-f", "lavfi", "-i", "sine=f=300:d=6,aformat=channel_layouts=stereo,aresample=48000"]), tick = await mk("tick.wav", ["-f", "lavfi", "-i", "sine=f=2000:d=0.05"]), bump = await mk("bump.wav", ["-f", "lavfi", "-i", "sine=f=500:d=1.5,aresample=48000"]);
    const seg = (id, src, startRel, last, vol) => ({ id, src, startRel, last, trim: 0, rate: 1, vols: [vol] }), AP = await imp(AUD), out = path.join(T, "out_" + codec + (codec === "pcm" ? ".wav" : ".m4a"));
    AP.mixToFile([seg("t0", tick, 3, 47, 0.04), seg("v", voice, 0, 179, 0.8), seg("t1", tick, 30, 74, 0.04), seg("b", bump, 180, 239, 1)], out, { NF: 240, fps: 30, root: ROOT, codec });
    const p = await runAsync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out], { timeout: 20000 }); return Number(p.out.trim());
  };
  add("sr.mix_length_pcm_master", [AUD, "tools/prerender_check.mjs"], AUL, "مزيج الصوت (الماستر wav لفحص ما قبل الرندر) بطول الصورة 8.0ث رغم فاصل خاتمة صوته أقصر من صورته وبضعة مؤثرات قصيرة (كان 7.5ث)", async () => {
    const d = await mixLen("pcm"); return expect(Math.abs(d - 8) < 0.03, `الطول ${d}ث والصورة 8ث`);
  });
  add("sr.mix_length_aac_mux", [AUD, "tools/gpu_render.mjs"], AUL, "مزيج الصوت (الـaac الذي يدمجه الرندر) بطول الصورة أيضاً — دالة واحدة للاثنين", async () => {
    const d = await mixLen("aac"); return expect(Math.abs(d - 8) < 0.06, `الطول ${d}ث والصورة 8ث`);
  });
  add("sr.mix_one_function_src", [AUD, "tools/prerender_check.mjs", "tools/gpu_render.mjs"], AUL, "المصدر: prerender_check وgpu_render يمزجان بـAP.mixToFile نفسها، وفيها مصدر الصمت بطول الصورة مدخلاً لـamix", async () => {
    const pr = src("tools/prerender_check.mjs"), gr = src("tools/gpu_render.mjs"), ap = src(AUD);
    return expect(pr.includes("AP.mixToFile(segs, wav") && gr.includes("AP.mixToFile(segs, audio") && ap.includes("anullsrc=r=48000:cl=stereo:d=") && ap.includes("[sil]amix=inputs="), "المزيج لم يعد دالة واحدة أو غاب مصدر الصمت");
  });

  add("sr.repair_short_gap_advances_next", "tools/stream/clip_repair.mjs", "repair-panel-overlap", "فراغ أقصر من 3ث بعد صورة: لا لوحة تُبنى (إمساكها يدخل التالية) فتُقدَّم اللوحة التالية إلى بدايته (كان الفراغ يبقى ويرفضه coverage_check)", async () => {
    const root = path.join(D, "rp"); fs.mkdirSync(path.join(root, "tools", "stream"), { recursive: true }); fs.copyFileSync(path.join(ROOT, "tools", "stream", "clip_repair.mjs"), path.join(root, "tools", "stream", "clip_repair.mjs"));
    put(path.join(root, ".tmp", "zq", "cut_words.json"), Array.from({ length: 90 }, (_, i) => ({ w: "كلمة" + i, s: +(i * 0.45).toFixed(2), e: +(i * 0.45 + 0.4).toFixed(2) })));
    put(path.join(root, "data", "specs", "zq.json"), { id: "zq", frames: 1500, items: [{ t: "cover", at: 0 }, { t: "pic", at: 19.2, until: 23.2 }, { t: "pick", el: "InkQuote", at: 24.9, until: 32, lines: [{ text: "كلمة55 كلمة56", at: 25.2 }] }] });
    const r = await runAsync(NODE, [path.join(root, "tools", "stream", "clip_repair.mjs"), "zq"], { cwd: root, timeout: 30000 }), sp = JSON.parse(fs.readFileSync(path.join(root, "data", "specs", "zq.json"), "utf8")), q = sp.items.find((i) => i.t === "pick" && i.el === "InkQuote");
    return expect(q && q.at < 23.6 && q.at >= 23.2, `اللوحة عند ${q?.at} (${(r.out + r.err).slice(0, 120)})`);
  });
  add("sr.clip_guard_wired_src", ["tools/stream/clip_guard.mjs", "tools/stream/fast_run.mjs"], "stream-clip-unregistered", "المصدر: fast_run checks يسجّل المقطع ويكتب تقارير مراحله (clip_guard --review) قبل stage check، وclip_guard لا يكتب تقريراً لمرحلة بلا دليل", async () => {
    const fr = src("tools/stream/fast_run.mjs"), cg = src("tools/stream/clip_guard.mjs"), iG = fr.indexOf("clip_guard.mjs"), iC = fr.indexOf('"tools/stage.mjs", "check"');
    return expect(iG > 0 && iC > iG && cg.includes("miss(") && cg.includes(".audio.ok") && cg.includes('"start", id'), "التسجيل قبل الفحص اختفى");
  });

  /* ── 4) the rehearsal tool itself: scoped names, the plan, never under Videos ── */
  const SRL = "stream-rehearsal-scoped", SR = "tools/stream/stream_rehearsal.mjs";
  add("sr.own_name_scoped", SR, SRL, "التنظيف يخص أسماء zz_stream_rehearsal وحدها (لا مشروعاً آخر ولا تجربة الحلقة)", async () => {
    const M = await imp(SR), yes = ["zz_stream_rehearsal", "zz_stream_rehearsal_2", "ZZ-Stream-Rehearsal-L", "zzstreamrehearsal_cut_s.mp4"], no = ["zz_rehearsal", "zz_rehearsal-reel", "stream_arsh_fakh_reel", "anchor-kills-children", "rehearsal", "zz_selftest_x"];
    return expect(yes.every(M.ownName) && no.every((n) => !M.ownName(n)), `خطأ في: ${[...yes.filter((n) => !M.ownName(n)), ...no.filter(M.ownName)].join("، ")}`);
  });
  add("sr.purge_dry_scoped", SR, SRL, "purge --dry على المساحة الحقيقية لا يذكر شيئاً من خارج أسماء التجربة (قراءة فقط)", async () => {
    const M = await imp(SR), r = M.purge({ dry: true }), bad = r.done.filter((x) => !/\(|^عنوان /.test(x) && !M.ownName(x.split("/").pop()));
    return expect(!bad.length, `خارج النطاق: ${bad.slice(0, 3).join("، ")}`);
  });
  add("sr.plan_order_and_scaling", SR, SRL, "خطة التجربة: كل مراحل البث بترتيبها (من التجهيز إلى الفحص النهائي)، ولكل مرحلة سبب قياسها الخطي أو غير الخطي", async () => {
    const M = await imp(SR), ids = M.plan().map((s) => s.id), want = ["setup", "start", "prep", "split", "cut", "slice", "titles", "build", "pictures", "repair", "montage_build", "scans", "prerender", "checks", "render", "final_review", "purge"];
    return expect(ids.join() === want.join() && ids.every((i) => M.SCALING[i]?.why && M.SCALING[i]?.k) && M.CLIPS.length === 3, `المراحل: ${ids.join(" ")}`);
  });
  add("sr.safe_by_source", SR, SRL, "المصدر: العيّنة تُقرأ من الأصل للقراءة فقط وتُرفض كتابتها تحت Videos، والرندر إلى مجلد التجربة لا «جاهز»، والتنظيف لا يجري إلا بـ--purge", async () => {
    const t = src(SR), j = JSON.parse(src("data/rehearsal/stream_source.json"));
    return expect(/path\.join\("Users", "mshms", "Videos"\)/.test(t) && /"-i", m\.origin/.test(t) && /path\.join\(OUT, "طولي"\)/.test(t) && !/جاهز/.test(t.replace(/«جاهز»/g, "").replace(/\/\/.*$/gm, "")) && /if \(purgeOn\) \{ const pg = purge\(\)/.test(t) && /s\.id === "purge" && \(!purgeOn \|\| to\)/.test(t) && j.startS === 1800 && j.lengthS === 600 && j.audioTracks === 3, "حدّ السلامة تغيّر");
  });
};
