/* THE CLIP'S SOUND ON THE CLIP'S FRAME GRID (2026-11-22, the real 3 h 46 min stream, clips s1122_khariji and s1122_deist_full failed the audio gate «نقرات عند وصلات القص» although tools/stream/join_fade.py had dipped every join):
   the stream's one-pass cut audio (tools/audio_cut.py) joins its segments at SAMPLE-EXACT cumulative positions, the clip's map/picture join them on the renderer's cumulative FRAME rounding (lazy_clip.mjs piecesOf n0),
   up to ±16 ms apart. The old clip_lazy cut the clip's sound at the frame-grid piece boundaries (ffmpeg atrim), so every join sat up to a frame away from the map's n: the join fade dipped mid-speech, the gate measured
   a speech onset as a click (khariji 1705.2 s ×14.1), the sound of a source second was out of step with its picture frame. Kept here, no GPU, tiny synthetic files under the run folder:
   1) lz.clip_audio_on_frame_grid   every stretch of the clip's sound equals the SOURCE sound at the map's own source second, at the map's own clip second (sample-exact, ±1 sample of rounding): for the raw cut audio and for a
                                    cleaned copy delayed by one RNNoise frame (480 samples) — the delay is measured and taken back. A control (the old way: cut at the frame-grid piece boundaries) must FAIL the same measure, so the
                                    synthetic stream really has joins off the frame grid; and clip_lazy must call tools/stream/clip_audio.py, not slice with atrim.
   2) lz.join_polish_lazy_joinok    tools/join_polish.py must not crash on the [] that clip_lazy writes to .tmp/<clip>/join_ok.json (it rewrote the clip's map first, then died on dict.update(list)). */
export default async (api) => {
  const { add, expect, runAsync, ROOT, RUN, path, fs } = api;
  const { pathToFileURL } = await import("node:url");
  const PY = process.env.PY ?? "S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe";
  const LC = "tools/lib/lazy_clip.mjs", CA = "tools/stream/clip_audio.py", CL = "tools/stream/clip_lazy.mjs", LED = "stream-clip-join-frame-grid";

  add("lz.clip_audio_on_frame_grid", [LC, CA, CL, "tools/audio_cut.py"], LED, "صوت المقطع الكسول يوضع على شبكة إطارات المقطع: كل مدى منه يطابق صوت الأصل عند ثانية الأصل في الخريطة وفي ثانية المقطع نفسها (بعينة واحدة)، للصوت الخام وللمنظَّف المتأخر 480 عينة؛ والقص القديم عند حدود الإطارات يفشل المقياس نفسه", async () => {
    const D = path.join(RUN, "u_clip_audio"); fs.mkdirSync(D, { recursive: true });
    const J = (f, o) => { fs.writeFileSync(path.join(D, f), JSON.stringify(o)); return path.join(D, f); };
    const py = (name, code) => { const f = path.join(D, name); fs.writeFileSync(f, code); return f; };
    // 1) a synthetic stream: 48 s of seeded stereo noise; a cut list whose segment durations are NOT whole frames (phases off the frame grid)
    const segsIn = [[2.0, 4.41], [6.0, 9.13], [12.0, 15.47], [20.0, 24.23], [30.0, 33.31], [38.0, 41.0]];
    let cum = 0; const segments = segsIn.map(([a, b]) => { const g = { a, b, n: +cum.toFixed(3), type: "speech" }; cum += b - a; return g; });
    const parentMap = { segments, duration: +cum.toFixed(3), model: "cut_model" }, mapF = J("map.json", parentMap);
    const mk = py("mk.py", [
      "import numpy as np, wave, sys",
      "D = sys.argv[1]; rng = np.random.default_rng(7)",
      "x = (rng.standard_normal((48 * 48000, 2)) * 3000).astype('<i2')",
      "o = wave.open(D + '/src.wav', 'wb'); o.setnchannels(2); o.setsampwidth(2); o.setframerate(48000); o.writeframes(x.tobytes()); o.close()",
    ].join("\n"));
    let r = await runAsync(PY, ["-I", mk, D], { timeout: 60000 });
    if (r.status !== 0) return { ok: false, why: "لم تُصنع مادة الاختبار: " + (r.err || r.out).slice(-200) };
    r = await runAsync(PY, ["-I", path.join(ROOT, "tools", "audio_cut.py"), path.join(D, "src.wav"), mapF, path.join(D, "parent.wav")], { timeout: 60000 });   // the project's own one-pass audio cut
    if (r.status !== 0) return { ok: false, why: "audio_cut.py فشل: " + (r.err || r.out).slice(-200) };
    // the cleaned copy: the same sound delayed by one RNNoise frame
    const dl = py("delay.py", [
      "import numpy as np, wave, sys",
      "D = sys.argv[1]; w = wave.open(D + '/parent.wav'); x = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').reshape(-1, 2); w.close()",
      "y = np.concatenate([np.zeros((480, 2), '<i2'), x[:-480]])",
      "o = wave.open(D + '/clean.wav', 'wb'); o.setnchannels(2); o.setsampwidth(2); o.setframerate(48000); o.writeframes(y.tobytes()); o.close()",
    ].join("\n"));
    r = await runAsync(PY, ["-I", dl, D], { timeout: 60000 });
    if (r.status !== 0) return { ok: false, why: "نسخة التأخير لم تُصنع: " + (r.err || r.out).slice(-200) };
    // 2) the clip: two ranges of the source, its map and its sound plan, by the engine's own functions
    const L = await import(pathToFileURL(path.join(ROOT, LC)).href), PC = L.piecesOf(parentMap, "3-9.5,13-34"), cmap = L.childSegments(parentMap, PC), plan = L.audioPlan(parentMap, PC);
    const planF = J("plan.json", plan); J("cmap.json", cmap); J("pieces.json", PC.pieces.map((p) => ({ cs: p.cs, ce: p.ce })));
    const run = (src, out, extra) => runAsync(PY, ["-I", path.join(ROOT, CA), src, mapF, planF, out, ...extra], { timeout: 120000 });
    const a = await run(path.join(D, "parent.wav"), path.join(D, "clip_raw.wav"), []);
    const b = await run(path.join(D, "clean.wav"), path.join(D, "clip_clean.wav"), ["--lag-ref", path.join(D, "parent.wav")]);
    if (a.status !== 0 || b.status !== 0) return { ok: false, why: "clip_audio.py فشل: " + ((a.err || a.out) + (b.err || b.out)).slice(-240) };
    // 3) the measure, the same for the new files and for the control (the old cut at the frame-grid piece boundaries)
    const ck = py("check.py", [
      "import numpy as np, wave, json, sys",
      "D = sys.argv[1]; sr = 48000",
      "def rd(p):",
      "    w = wave.open(p); x = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').reshape(-1, w.getnchannels()); w.close(); return x",
      "src = rd(D + '/src.wav'); cmap = json.load(open(D + '/cmap.json')); pcs = json.load(open(D + '/pieces.json')); par = rd(D + '/parent.wav')",
      "def bad(out):",
      "    tested = nbad = 0; m0 = int(0.02 * sr)",
      "    for s in cmap:",
      "        n = int(round((s['b'] - s['a']) * sr)); a = int(round(s['a'] * sr)); d = int(round(s['n'] * sr))",
      "        if n < 2 * m0 + 10: continue",
      "        tested += 1",
      "        seg = out[d + m0:d + n - m0]",
      "        if not any(len(seg) and np.array_equal(seg, src[a + m0 + sh:a + n - m0 + sh][:len(seg)]) for sh in (-1, 0, 1)): nbad += 1",
      "    return tested, nbad",
      "res = {'raw': bad(rd(D + '/clip_raw.wav')), 'clean': bad(rd(D + '/clip_clean.wav'))}",
      "old = np.concatenate([par[int(round(p['cs'] * sr)):int(round(p['ce'] * sr))] for p in pcs])",
      "res['control_old'] = bad(old)",
      "print(json.dumps(res))",
    ].join("\n"));
    const c = await runAsync(PY, ["-I", ck, D], { timeout: 120000 });
    let res; try { res = JSON.parse(c.out.trim().split("\n").pop()); } catch { return { ok: false, why: "المقياس لم يعمل: " + (c.err || c.out).slice(-200) }; }
    const cl = fs.readFileSync(path.join(ROOT, CL), "utf8");
    const wired = /clip_audio\.py/.test(cl) && !/atrim=start/.test(cl);
    return expect(res.raw[0] >= 3 && res.raw[1] === 0 && res.clean[1] === 0 && res.control_old[1] > 0 && wired,
      `أمداء مقيسة ${res.raw[0]}: الصوت الخام خارج الشبكة ${res.raw[1]}، المنظَّف المتأخر ${res.clean[1]}، القص القديم (ضابط: يجب أن يفشل) ${res.control_old[1]}، clip_lazy يستدعي clip_audio.py بلا atrim: ${wired}`);
  });

  add("lz.join_polish_lazy_joinok", ["tools/join_polish.py", CL], LED, "join_polish لا ينهار على join_ok.json القائمة التي يكتبها clip_lazy (كان يعيد كتابة خريطة المقطع ثم يموت في dict.update على قائمة)", async () => {
    const src = fs.readFileSync(path.join(ROOT, "tools", "join_polish.py"), "utf8");
    return expect(/if not isinstance\(old, dict\): old = \{\}/.test(src) && /"join_ok\.json"/.test(src), "join_polish.py بلا حارس نوع join_ok.json");
  });
};
