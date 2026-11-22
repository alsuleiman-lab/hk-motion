// (user 2026-11-22: «التفريغ لازم أسرع بكثير بلا أي نقص في الدقة») tools/transcribe_vad_segments.py got a batch path (--batch N: several VAD segments decoded together on the card).
// Measured on the real stream sample: batching is NOT word-identical to the one-by-one decode (a batched matrix product rounds differently; near-tie beam choices change
// words in 3-6 of 66 segments), so the tool's default stays 1 (the old path). This case runs a tiny real Arabic clip (data/voices) through the model loaded ONCE, one by one and
// 4 at a time, and holds the rule: the batch may be the default ONLY while it gives the same words and word times (±0.02 s) on the clip; the old path and the batch path must both
// produce words for every segment. It uses the card (~12 s). A failure: someone raised BATCH_DEFAULT without identity — put it back to 1.
export default async (api) => {
  const { add, expect, runAsync, ROOT, path } = api;
  const PY = process.env.PY ?? "S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe";
  add("transcribe.batch_identity_gate", "tools/transcribe_vad_segments.py", "transcribe-speed-identity", "التفريغ المجمَّع لا يكون الافتراضي إلا إن أعطى الكلمات نفسها وأزمنتها كالتفريغ مقطعاً مقطعاً", async () => {
    const r = await runAsync(PY, [path.join(ROOT, "tools", "selftest_cases", "n_batch_transcribe_run.py")], { cwd: ROOT, env: { ...process.env, PYTHONIOENCODING: "utf-8" }, timeout: 120000 });
    const line = String(r.out).split(/\r?\n/).find((l) => l.startsWith("RESULT "));
    if (!line) return expect(false, `لا نتيجة (الرمز ${r.status}): ${String(r.err || r.out).trim().split(/\r?\n/).slice(-2).join(" | ").slice(0, 240)}`);
    const j = JSON.parse(line.slice(7));
    const ran = j.segments === 4 && j.words > 10;
    const gate = j.batch_default === 1 || (j.same_words && j.max_dt <= 0.02);
    return expect(ran && gate, `الافتراضي ${j.batch_default}؛ ${j.words} كلمة في ${j.segments} مقاطع؛ نفس الكلمات: ${j.same_words}${j.diff_segments.length ? ` (مختلفة: ${j.diff_segments.join(",")})` : ""}؛ أكبر فرق زمن ${j.max_dt} ث؛ متسلسل ${j.seq_s} ث، مجمَّع ${j.bat_s} ث`);
  });
};
