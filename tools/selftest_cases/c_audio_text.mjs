// Self-test cases: audio and text guards (2026-11-21, user «نعم» to tests for the 19 untested guards). Loaded by tools/guard_selftest.mjs (api = its helpers).
// Ledger ids: audio-tail-click, bleep-inside-quran, soft-afwan-missed, map-for-title-country, writing-ignores-context.
// Everything is fake and tiny: wav files written here (48 kHz mono, ≤ 8 s) and word lists, under api.RUN (.tmp/selftest/). The bleep tools run with a scratch cwd
// (their data/, .tmp/<p>/ and public/ are scratch copies). names_scan + name_doubt read .tmp/<p>/ of the root by project name: the project is
// zz_selftest_c_* (no real project has that name), it holds no audio (no second listening, no GPU), and each case removes its own folder when done.
// Each case asserts the guard AND its control, so it fails when the guard is taken out (checked on mutated copies, never on the real files).
export default async (api) => {
  const { add, expect, runAsync, RUN, ROOT, NODE, SCR, path, fs } = api;
  const D = path.join(RUN, "c_audio_text");
  const inScr = (p) => path.resolve(p).toLowerCase().startsWith(path.resolve(SCR).toLowerCase() + path.sep);
  const putBin = (p, buf) => { if (!inScr(p)) throw new Error("refusing to write outside .tmp/selftest: " + p); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, buf); return p; };
  const putJ = (p, data) => putBin(p, Buffer.from(typeof data === "string" ? data : JSON.stringify(data)));
  const PY = [process.env.PY_NUMPY, "C:/Users/mshms/AppData/Local/Programs/Python/Python310/python.exe", "S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe"].find((f) => f && fs.existsSync(f));
  const pyEnv = { ...process.env, PYTHONIOENCODING: "utf-8" };   // (-I ignores it: "-X utf8" below is what makes the Arabic output readable)

  /* ── wav helpers (16-bit mono PCM) ── */
  const SR = 48000;
  const wav = (p, n, fn) => {
    const b = Buffer.alloc(44 + n * 2);
    b.write("RIFF", 0); b.writeUInt32LE(36 + n * 2, 4); b.write("WAVE", 8); b.write("fmt ", 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
    b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(n * 2, 40);
    for (let i = 0; i < n; i++) b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(fn(i / SR) * 32768))), 44 + i * 2);
    return putBin(p, b);
  };
  const readWav = (p) => {
    const b = fs.readFileSync(p); let o = 12, sr = SR, ch = 1;
    while (o + 8 <= b.length) { const id = b.toString("ascii", o, o + 4), len = b.readUInt32LE(o + 4);
      if (id === "fmt ") { ch = b.readUInt16LE(o + 10); sr = b.readUInt32LE(o + 12); }
      if (id === "data") { const n = Math.floor(Math.min(len, b.length - o - 8) / 2 / ch), y = new Float32Array(n); for (let i = 0; i < n; i++) y[i] = b.readInt16LE(o + 8 + i * 2 * ch) / 32768; return { y, sr }; }
      o += 8 + len + (len & 1); }
    return { y: new Float32Array(0), sr };
  };
  const peakDb = (y, a = 0, b = y.length) => { let m = 0; for (let i = Math.max(0, a); i < Math.min(y.length, b); i++) m = Math.max(m, Math.abs(y[i])); return m > 0 ? 20 * Math.log10(m) : -Infinity; };
  const tone = (t) => 0.3 * Math.sin(2 * Math.PI * 180 * t) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 3 * t));
  const tail = (s) => s.split("\n").filter((l) => l.trim()).slice(-3).join(" | ").slice(0, 160);

  /* 1) AUDIO TAIL CLICK (tools/audio_clean.mjs, gta6 2026-11-21: arnndn pads its last 480-sample frame with full-scale garbage) */
  add("tail.clean_no_click", "tools/audio_clean.mjs", "audio-tail-click", "تنظيف الصوت (arnndn) لا يترك نقرة في آخره، وطول الملف كما هو", async () => {
    const n = 48624;   // 1.013 s: not a whole number of 480-sample frames
    const inp = wav(path.join(D, "clean_in.wav"), n, (t) => tone(t) + 0.01 * (Math.random() - 0.5)), out = path.join(D, "clean_out.wav");
    const x = await runAsync(NODE, [path.join(ROOT, "tools", "audio_clean.mjs"), inp, out], { cwd: ROOT, timeout: 30000 });   // cwd = root: the model path is relative
    if (x.status !== 0 || !fs.existsSync(out)) return expect(false, `الأداة فشلت (خروج ${x.status}): ${tail(x.err + x.out)}`);
    const { y } = readWav(out), tp = peakDb(y, y.length - 0.6 * SR), body = peakDb(y, 0, y.length - 0.6 * SR);
    return expect(Math.abs(y.length - n) <= 1 && tp < -3 && tp < body + 1, `الطول ${y.length} (الأصل ${n})، قمة آخر 0.6 ث ${tp.toFixed(1)} dB (الجسم ${body.toFixed(1)} dB)`);
  });
  add("tail.final_review_rejects", "tools/final_review.mjs", "audio-tail-click", "الفحص النهائي يرفض ملفاً آخر إطار فيه بقمة كاملة، ويقبل ذيلاً سليماً", async () => {
    const d = path.join(D, "fr");   // its own cwd: final_review reads .tmp/gates/ there (empty) and writes nothing without --name
    const n = 1.5 * SR, bad = wav(path.join(d, "burst.wav"), n, (t) => (t >= 1.5 - 0.01 ? -1 : 0.3 * Math.sin(2 * Math.PI * 180 * t))), good = wav(path.join(d, "ok.wav"), n, (t) => 0.3 * Math.sin(2 * Math.PI * 180 * t));
    const [a, b] = await Promise.all([bad, good].map((f) => runAsync(NODE, [path.join(ROOT, "tools", "final_review.mjs"), f], { cwd: d, timeout: 30000 })));
    const la = (a.out.match(/^.*ذيل الصوت.*$/m) ?? [""])[0], lb = (b.out.match(/^.*ذيل الصوت.*$/m) ?? [""])[0];
    return expect(/^✘ ذيل الصوت/.test(la) && /^✔ ذيل الصوت/.test(lb), `الذيل التالف: «${la || "لا سطر: " + tail(a.err)}»، السليم: «${lb || "لا سطر: " + tail(b.err)}»`);
  });

  /* 2) NO BLEEP INSIDE THE QURAN OR A HADITH, ONE BLEEP ON THE MIDDLE HALF, bleepKeep (tools/bleep_words.py + tools/bleep_fix.py; mufti-hiraba 2026-11-20) */
  const BW = ["tools/bleep_words.py"], BF = ["tools/bleep_fix.py", "tools/bleep_words.py"];
  const bleepRoot = (name, spec) => {
    const r = path.join(D, name), p = "zzbleep";
    putBin(path.join(r, "data", "sensitive_words.json"), fs.readFileSync(path.join(ROOT, "data", "sensitive_words.json")));
    putJ(path.join(r, "data", "specs", `${p}.json`), spec);
    putJ(path.join(r, "public", `${p}_map.json`), { segments: [{ a: 0, b: 8, n: 0 }] });   // the cut = the source (identity map)
    return { r, p };
  };
  // source seconds: «يقتلوا» inside a recited verse, «القتل» and «داعش» outside it
  const BWORDS = [{ w: "قال", s: 0.4, e: 0.7 }, { w: "يقتلوا", s: 1.0, e: 1.5 }, { w: "القتل", s: 3.0, e: 3.6 }, { w: "داعش", s: 5.0, e: 5.4 }];
  const bwRun = async (name, keep) => {
    if (!PY) return { err: "لا بايثون فيه numpy" };
    const { r, p } = bleepRoot(name, keep ? { id: "zzbleep", bleepKeep: keep } : { id: "zzbleep" });
    putJ(path.join(r, ".tmp", p, "words_vad.json"), BWORDS);
    putJ(path.join(r, ".tmp", p, "verses.json"), [{ ref: "zz", times: [1.0, 1.5] }]);
    wav(path.join(r, ".tmp", p, "cut.wav"), 8 * SR, (t) => 0.3 * Math.sin(2 * Math.PI * 180 * t));   // speech level well above the beep (the level gate passes)
    const x = await runAsync(PY, ["-I", "-X", "utf8", path.join(ROOT, "tools", "bleep_words.py"), p, path.join(r, "out.wav")], { cwd: r, env: pyEnv, timeout: 30000 });
    const spots = [...x.out.matchAll(/src\s+([\d.]+)-\s*([\d.]+) -> cut ([\d.]+)-([\d.]+)/g)].map((m) => ({ s: +m[1], a: +m[3], b: +m[4] }));
    return { ...x, spots, n: Number(x.out.match(/(\d+) spots/)?.[1] ?? -1) };
  };
  const at = (spots, s) => spots.find((q) => Math.abs(q.s - s) < 0.01);
  add("bleep.verse_protected_half", BW, "bleep-inside-quran", "لا صافرة على «يقتلوا» داخل آية، و«القتل» خارجها صافرة واحدة على النصف الأوسط بعد «ال»", async () => {
    const x = await bwRun("bw_verse", null); if (x.err) return expect(false, x.err);
    const q = at(x.spots, 3.0), want = [3.24 + 0.36 * 0.25, 3.24 + 0.36 * 0.75];   // «القتل» 3.0–3.6: after «ال» (2 of 5 letters) 3.24, its 25–75 %
    const ok = x.status === 0 && !at(x.spots, 1.0) && q && Math.abs(q.a - want[0]) < 0.005 && Math.abs(q.b - want[1]) < 0.005 && at(x.spots, 5.0) && x.n === 2;
    return expect(ok, at(x.spots, 1.0) ? "صافرة داخل الآية" : !q ? "«القتل» بلا صافرة" : `الصافرات ${x.spots.map((s) => `${s.s}:${s.a.toFixed(2)}-${s.b.toFixed(2)}`).join(" ")} (${x.n}، خروج ${x.status}) ${x.status ? tail(x.err) : ""}`);
  });
  add("bleep.keep_root", BW, "bleep-inside-quran", "جذر في bleepKeep للحلقة («قتل») يبقى بلا صافرة، وغيره («داعش») يُكتم", async () => {
    const x = await bwRun("bw_keep", ["قتل"]); if (x.err) return expect(false, x.err);
    return expect(x.status === 0 && !at(x.spots, 3.0) && at(x.spots, 5.0) && x.n === 1, `الصافرات عند ${x.spots.map((s) => s.s).join("، ") || "لا شيء"} (${x.n}، خروج ${x.status}) ${x.status ? tail(x.err) : ""}`);
  });
  add("bleep.fix_hadith_root_half", BF, "bleep-inside-quran", "إصلاح الصافرات: كلمة داخل حديث يعود صوتها بلا صافرة، والمستثناة كذلك، و«القتل» صافرة واحدة على نصف جذرها الأوسط فقط", async () => {
    if (!PY) return expect(false, "لا بايثون فيه numpy");
    const { r, p } = bleepRoot("bf", { id: "zzbleep", bleepKeep: ["ذبح"] }), T = path.join(r, ".tmp", p);
    // cut seconds: «يقتلوا» inside a narrated hadith, «القتل» outside, «يذبح» kept for this episode. Silent sound everywhere: any sample left = a bleep.
    putJ(path.join(T, "cut_words.json"), [{ w: "يقتلوا", s: 1.0, e: 1.5 }, { w: "القتل", s: 3.0, e: 3.6 }, { w: "يذبح", s: 5.0, e: 5.4 }]);
    putJ(path.join(T, "hadith.json"), [{ at: 0.8, until: 1.7 }]);
    wav(path.join(T, "cut_audio.wav"), 8 * SR, () => 0); const src = wav(path.join(r, "src.wav"), 8 * SR, () => 0);
    putJ(path.join(T, "prep_config.json"), { source: src });
    const x = await runAsync(PY, ["-I", "-X", "utf8", path.join(ROOT, "tools", "bleep_fix.py"), p], { cwd: r, env: pyEnv, timeout: 40000 });   // no tools/audio_clean.mjs in this cwd: the raw (silent) piece is used
    if (x.status !== 0) return expect(false, `الأداة فشلت (خروج ${x.status}): ${tail(x.err + x.out)}`);
    const { y, sr } = readWav(path.join(T, "cut_audio.wav")), loud = [];
    for (let i = 0; i < y.length; i++) if (Math.abs(y[i]) > 0.003) loud.push(i / sr);
    const a = 3.24 + 0.36 * 0.25, b = 3.24 + 0.36 * 0.75, first = loud[0], last = loud.at(-1);   // the root «قتل» = letters 2–5 of «القتل»: 3.24–3.60
    const ok = /أُعيد صوت «يقتلوا»[^\n]*آية أو حديث/.test(x.out) && /مستثنى/.test(x.out) && loud.length && first >= a - 0.002 && first < a + 0.02 && last <= b + 0.002 && last > b - 0.02;
    return expect(ok, loud.length ? `صوت الصافرة من ${first.toFixed(3)} إلى ${last.toFixed(3)} (المطلوب ${a.toFixed(2)}–${b.toFixed(2)} فقط): ${tail(x.out)}` : `لا صافرة على «القتل»: ${tail(x.out)}`);
  });

  /* 3) A RESTART WHOSE «عفواً» WAS NOT TRANSCRIBED (tools/find_restarts.mjs; mufti-hiraba 7:11, 2026-11-20) */
  const W = (list) => list.map(([w, s, e]) => ({ w, s, e }));
  const restarts = (name, words) => runAsync(NODE, [path.join(ROOT, "tools", "find_restarts.mjs"), putJ(path.join(D, `${name}.json`), W(words))], { cwd: ROOT });
  add("restart.unheard_marker", "tools/find_restarts.mjs", "soft-afwan-missed", "«وتسمى قطعة … [سكتة بلا عفواً] … وتسمى قطع الطريق» ← إعادة تُقص؛ والتكرار بلا سكتة ليس إعادة", async () => {
    const take = (gap) => [["وتسمى", 10.0, 10.4], ["قطعة", 10.45, 10.9], ["وتسمى", 10.9 + gap, 11.3 + gap], ["قطع", 11.35 + gap, 11.7 + gap], ["الطريق", 11.75 + gap, 12.2 + gap], ["عند", 12.25 + gap, 12.5 + gap], ["الفقهاء", 12.55 + gap, 13.1 + gap]];
    const [a, b] = await Promise.all([restarts("restart_pause", take(1.3)), restarts("restart_flow", take(0.12))]);
    const hit = /restart \(unheard marker[^\n]*first take @10\.0[^\n]*repeat @12\.2/.test(a.out), none = !/restart/.test(b.out.replace(/^markers:.*$/m, ""));
    return expect(hit && none, !hit ? `لم تُكشف الإعادة: ${tail(a.out)}` : `تكرار بلا سكتة عُدّ إعادة: ${tail(b.out)}`);
  });

  /* 4) NO MAP FOR A COUNTRY THAT COMPLETES A TITLE (tools/names_scan.mjs; «مفتي الأردن», frame 3111, 2026-11-20) */
  const NS = ["tools/names_scan.mjs"];
  const scan = async (tag, phrases) => {
    const p = `zz_selftest_c_${tag}_${process.pid}`, d = path.join(ROOT, ".tmp", p);
    if (!/^zz_selftest_c_[a-z]+_\d+$/.test(p)) throw new Error("not a self-test project: " + p);
    try {
      fs.mkdirSync(d, { recursive: true });   // only this zz_selftest_c_* folder in the real .tmp/ (names_scan and name_doubt read .tmp/<p>/ by name); no audio in it
      const words = phrases.flatMap(([t0, text]) => text.split(" ").map((w, i) => ({ w, s: +(t0 + i * 0.45).toFixed(2), e: +(t0 + i * 0.45 + 0.4).toFixed(2), p: 0.9 })));
      fs.writeFileSync(path.join(d, "cut_words.json"), JSON.stringify(words));
      const x = await runAsync(NODE, [path.join(ROOT, "tools", "names_scan.mjs"), p], { cwd: ROOT, timeout: 30000 });
      let names = null; try { names = JSON.parse(fs.readFileSync(path.join(d, "names.json"), "utf8")); } catch { /* none */ }
      return { ...x, names };
    } finally { fs.rmSync(d, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 }); }
  };
  add("titlemap.title_no_map", NS, "map-for-title-country", "«مفتي الأردن» «ملك الأردن» «رئيس سوريا» ← لا خريطة؛ و«سافرت إلى الأردن» مرتين ← خريطة", async () => {
    const [a, b] = await Promise.all([
      scan("title", [[40, "قال مفتي الأردن إن الأمر"], [80, "وقال ملك الأردن كلاما"], [120, "ثم قال رئيس سوريا كذلك"], [160, "وعند رئيس سوريا جواب"]]),
      scan("place", [[40, "ثم سافرت إلى الأردن مرة"], [80, "ورجعت من الأردن بعدها"]]),
    ]);
    const nA = a.names?.places?.length ?? -1, mB = b.names?.maps ?? -1;
    return expect(nA === 0 && mB === 1, nA !== 0 ? `بلد في لقب عُدّ مكاناً (${nA}): ${(a.names?.places ?? []).map((h) => h.said).join("، ") || tail(a.out + a.err)}` : `البلد المذكور مكاناً بلا خريطة (${mB}): ${tail(b.out + b.err)}`);
  });
  add("titlemap.wazir", NS, "map-for-title-country", "«وزير الأردن» ← لا خريطة", async () => {
    const a = await scan("wazir", [[40, "قال وزير الأردن إن الأمر"], [80, "وقال وزير الأردن كلاما"]]), n = a.names?.places?.length ?? -1;
    return n === 0 ? { ok: true } : { ok: false, known: true, why: `ثغرة معروفة في tools/names_scan.mjs: الكلمة قبل البلد تمرّ على bare() أولاً فتقطع واو «وزير» كأنها حرف عطف («زير»)، فلا تطابق قائمة الألقاب، فتُرسم خريطة (${n} ذكر)` };
  });

  /* 5) WRITING IS A COMPLETE MEANING (tools/writing_sync.mjs; lesson short «صفحة 129 وقال أبو طالب المكي وعند», 2026-11-17) */
  add("writing.dangling_refused", "tools/writing_sync.mjs", "writing-ignores-context", "عبارة تنتهي بـ«وعند/قال/إلى/الذي» أو تبدأ بـ«صفحة» ← مرفوضة؛ والجملة التامة تمرّ", async () => {
    const T = ["صفحة 129 وقال أبو طالب المكي وعند", "ثم إن الإمام أحمد قال", "رجع الحديث كله إلى", "وهذا هو الحق الذي", "العلم نور يهدي القلوب"];
    const spec = putJ(path.join(D, "writing", "zzwrite.json"), { id: "zzwrite", items: T.map((text, i) => ({ t: i % 2 ? "scraps" : "torn", text, at: 40 + i * 10, until: 44 + i * 10 })) });
    const words = putJ(path.join(D, "writing", "zzwrite_words.json"), []);   // no spoken words: only the meaning check can fail
    const x = await runAsync(NODE, [path.join(ROOT, "tools", "writing_sync.mjs"), spec, "--words", words], { cwd: ROOT });
    const bad = [...x.out.matchAll(/✘ (torn|scraps)#(\d)[^\n]*عبارة ناقصة/g)].map((m) => +m[2]).sort().join(",");
    return expect(x.status === 1 && bad === "0,1,2,3", `المرفوضة ${bad || "لا شيء"} (المطلوب 0,1,2,3 والخامسة تمرّ)، خروج ${x.status}`);
  });
};
