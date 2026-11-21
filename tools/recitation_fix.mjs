// RECITATION FIX IN HIS OWN VOICE — the standard method (user 2026-11-21, gta6, «ستة. جيد… أضيفه للموتور»: of the methods tried on «عذابٌ شديد» → «عذابٌ أليم»,
// he chose Chatterbox multilingual cloned from HIS OWN recitation just before the slip; critical-rules 17).
//
//   node tools/recitation_fix.mjs <p> --at <cut s> --from "<spoken words>" --to "<correct words with tashkeel>"            candidates + previews + QC
//   node tools/recitation_fix.mjs <p> --at … --from … --to … --apply [--pick <cand name | wav>] [--force]                    the splice + every shift
//   options: --seeds 7,23,31 (default) · --ex 0.4 --cfg 0.3 (the chosen setting) · --ref-len 9 (seconds of his recitation before the slip) · --match (also a
//            pitch-matched «_m» variant) · --no-gen (re-finalize/QC what is there)
//
// 1. the words: --from is found in .tmp/<p>/cut_words.json nearest --at; the span A..B runs from the middle of the gap before the first word to the middle of
//    the gap after the last one (a cut-list join inside a gap is preferred), whole frames.
// 2. the voice: tools/voice/rf_gen_chatterbox.py (Chatterbox venv, t3 v3, exaggeration 0.4, cfg 0.3, one candidate per seed), reference = his recitation in
//    the cut audio from ~9 s before the slip up to A; the text goes through the arabic-tts-pronunciation pipeline.
// 3. the candidates: tools/voice/rf_finalize.py (trimmed, at the loudness of his wrong words, an in-context preview made by THE SAME splice as --apply, MP3
//    copies) and tools/voice/rf_qc.py (faster-whisper large-v3: alone and in context the correct words and none of the wrong ones; loudness ±1 dB; length
//    ±35 %; silence after ≤ 0.4 s). Files: .tmp/<p>/recitation_fix/<A>/cand_s<seed>{,_ctx}.{wav,mp3}, qc.txt.
// 4. --apply (critical-rules 17): tools/voice/rf_splice.py writes the new cut audio (his gap + the words + his own pause, 30 ms fades, whole frames);
//    tools/cut_block.mjs (JSON-only, --src) replaces the span in the cut LIST with the original picture of the span cut to the new length (a longer one is
//    held on its last frame) and shifts by the difference every time after it: spec items/zooms/behind+mattes/shifts/splits/bumper, cut_words, verses.json,
//    writing, notes, draft; the words said now go into cut_words; the verse card's word times follow and the card becomes `full: true`; cut.wav/cut16k.wav and
//    the light Studio copy follow (lazy cut: the heavy file is built again only when its pixels are needed). Then verse_audit runs.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

process.chdir(path.resolve(import.meta.dirname, ".."));
const argv = process.argv.slice(2), p = argv[0];
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; }, has = (k) => argv.includes(`--${k}`);
if (!p || p.startsWith("--") || opt("at") == null || !opt("from") || !opt("to")) {
  console.error('usage: node tools/recitation_fix.mjs <p> --at <cut s> --from "<spoken words>" --to "<correct words with tashkeel>" [--apply [--pick <name|wav>]] [--seeds 7,23,31]');
  process.exit(2);
}
const CBX_PY = "S:/AI_Tools/VoiceWorkflow/.chatterbox-venv/Scripts/python.exe", CPY = "S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe";
const L = await import("./cut_lazy.mjs"), SPY = L.PY;
const rd = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const say = (m) => console.log(`recitation_fix: ${m}`), die = (m) => { console.error(`✘ recitation_fix: ${m}`); process.exit(1); };
const run = (exe, args, { show = false, env = {} } = {}) => {
  const r = spawnSync(exe, args, { encoding: "utf8", windowsHide: true, maxBuffer: 1 << 27, env: { ...process.env, PYTHONIOENCODING: "utf-8", ...env } });
  if (show && r.stdout) process.stdout.write(r.stdout.split("\n").filter((l) => !/Sampling:|it\/s\]/.test(l)).join("\n"));
  if (r.status !== 0) die(`${path.basename(args[0] ?? exe)} failed (exit ${r.status}): ${(r.stderr || r.stdout || "").trim().split("\n").slice(-4).join(" | ")}`);
  return r.stdout || "";
};
const ff = (args) => run("ffmpeg", ["-v", "error", "-y", "-threads", "4", ...args]);

const T = path.join(".tmp", p), specF = path.join("data", "specs", `${p}.json`), spec = rd(specF, null);
if (!spec) die(`no spec ${specF}`);
const I = L.initLazy(p);   // the audio truth of the cut: .tmp/<p>/cut_audio.wav (made from the cut video once for a project the lazy cut did not track yet)
const W0 = rd(path.join(T, "cut_words.json"), null); if (!W0) die(`no ${T}/cut_words.json`);
const Wd = (Array.isArray(W0) ? W0 : W0.words).map((w) => ({ s: +w.s, e: +(w.e ?? w.s + 0.2), w: String(w.w) })).sort((a, b) => a.s - b.s);
const norm = (s) => String(s).replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ‌‍]/g, "").replace(/[ٱأإآ]/g, "ا").replace(/ء/g, "").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[^ء-ي ]/g, " ").split(/\s+/).filter(Boolean);
const lev = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
const same = (x, y) => x === y || (Math.min(x.length, y.length) > 3 && lev(x, y) <= 1);

// ── 1. the words and the span ──
const at = Number(opt("at")), F = norm(opt("from")), TO = opt("to");
let best = null;
for (let i = 0; i + F.length <= Wd.length; i++) {
  if (!F.every((x, k) => norm(Wd[i + k].w).length === 1 && same(norm(Wd[i + k].w)[0], x))) continue;
  const dist = Math.abs(Wd[i].s - at); if (dist <= 4 && (!best || dist < best.dist)) best = { i, dist };
}
if (!best) die(`«${opt("from")}» not found in cut_words within 4 s of ${at} (the words there: «${Wd.filter((w) => Math.abs(w.s - at) < 3).map((w) => w.w).join(" ")}»)`);
const first = Wd[best.i], last = Wd[best.i + F.length - 1], prev = Wd[best.i - 1], next = Wd[best.i + F.length];
const map = rd(I.mapF, null); if (!map) die(`no ${I.mapF}`);
const joins = map.segments.slice(1).map((g) => Math.round(g.n * 30));
const pickFrame = (lo, hi) => {   // a whole frame inside the gap lo..hi: a join of the cut list if one is there, else the middle
  const a = Math.ceil(lo * 30 - 1e-6), b = Math.floor(hi * 30 + 1e-6), mid = Math.round(((lo + hi) / 2) * 30);
  if (b < a) return mid;
  const j = joins.filter((f) => f >= a && f <= b).sort((x, y) => Math.abs(x - mid) - Math.abs(y - mid))[0];
  return j ?? Math.min(b, Math.max(a, mid));
};
const fA = pickFrame(prev ? prev.e : first.s - 0.3, first.s), fB = pickFrame(last.e, next ? next.s : last.e + 0.3), A = fA / 30, B = fB / 30;
const segAt = (t) => { for (const g of map.segments) if (t >= g.n - 1e-4 && t < g.n + (g.b - g.a) - 1e-4) return g; return null; };
const gA = segAt(A); if (!gA) die(`cut ${A} is outside the cut list`);
const SA = +(gA.a + (A - gA.n)).toFixed(4);
const tag = A.toFixed(2), D = path.join(T, "recitation_fix", tag); fs.mkdirSync(D, { recursive: true });
say(`«${Wd.slice(best.i, best.i + F.length).map((w) => w.w).join(" ")}» ${first.s.toFixed(2)}–${last.e.toFixed(2)} s → «${TO}»; span ${A.toFixed(3)}–${B.toFixed(3)} s (frames ${fA}–${fB}), source ${SA.toFixed(3)} s`);
say(`before: «${Wd.slice(Math.max(0, best.i - 4), best.i).map((w) => w.w).join(" ")}» · after: «${Wd.slice(best.i + F.length, best.i + F.length + 4).map((w) => w.w).join(" ")}»`);

// reference: his own recitation up to A (≥ 4 s, about --ref-len), starting on a word; context of the preview: ~5 s before, ~4 s after
const refLen = Number(opt("ref-len", 9));
const refW = Wd.find((w) => w.s >= A - refLen && w.s < A - 4) ?? Wd.find((w) => w.s >= A - refLen) ?? first;
const ctxW0 = Wd.find((w) => w.s >= A - 5) ?? first, ctxW1 = [...Wd].reverse().find((w) => w.e <= B + 4) ?? last;
const J = {
  p, dir: path.resolve(D), cut_audio: path.resolve(I.audio), from: opt("from"), to: TO, at,
  A, B, fA, fB, SA, first_s: first.s, last_e: last.e, next_s: next ? next.s : B + 0.1,
  ref: path.resolve(D, "ref.wav"), ref_span: [+(refW.s - 0.03).toFixed(3), A],
  ctx_from: +Math.max(0, ctxW0.s - 0.1).toFixed(3), ctx_to: +Math.max(B + 0.5, ctxW1.e + 0.15).toFixed(3),
  seeds: String(opt("seeds", "7,23,31")).split(",").map(Number).filter(Number.isFinite), exaggeration: Number(opt("ex", 0.4)), cfg: Number(opt("cfg", 0.3)), match: has("match"),
};
const jobF = path.join(D, "job.json"); fs.writeFileSync(jobF, JSON.stringify(J, null, 1));

// ── 2–3. candidates ──
let pickPath = null;
const pk = opt("pick");
if (pk && fs.existsSync(pk)) pickPath = path.resolve(pk);
if (!pickPath && !has("no-gen") && !(has("apply") && pk)) {
  ff(["-ss", String(J.ref_span[0]), "-to", String(J.ref_span[1]), "-i", I.audio, "-ac", "1", "-ar", "24000", J.ref]);
  say(`his reference ${J.ref_span[0].toFixed(2)}–${A.toFixed(2)} s; Chatterbox (exaggeration ${J.exaggeration}, cfg ${J.cfg}), seeds ${J.seeds.join(", ")}…`);
  for (const f of fs.readdirSync(D).filter((x) => /^raw_s\d+\.wav$/.test(x))) fs.rmSync(path.join(D, f));
  run(CBX_PY, ["tools/voice/rf_gen_chatterbox.py", jobF], { show: true });
}
const raws = pickPath ? [pickPath] : fs.readdirSync(D).filter((x) => /^raw_s\d+\.wav$/.test(x)).map((x) => path.join(D, x));
if (!raws.length && !(has("apply") && pk)) die("no candidate generated");
if (raws.length) { run(CPY, ["tools/voice/rf_finalize.py", jobF, ...raws]); say("QC (faster-whisper large-v3, alone and in context)…"); run(CPY, ["tools/voice/rf_qc.py", "qc", jobF], { show: true }); }
const QC = rd(path.join(D, "qc.json"), []);
const hisDur = last.e - first.s;
if (!has("apply")) {
  const ok = QC.filter((q) => q.ok);
  say(`${ok.length}/${QC.length} candidates pass. Listen to the previews (in context): ${QC.map((q) => path.relative(".", q.ctx).replace(/\.wav$/, ".mp3")).join(" · ")}`);
  say(`then: node tools/recitation_fix.mjs ${p} --at ${at} --from "${opt("from")}" --to "${TO}" --apply --pick <name>`);
  process.exit(ok.length ? 0 : 1);
}

// ── 4. apply ──
const choice = pickPath ? QC.find((q) => q.src === path.basename(pickPath)) ?? QC[0]
  : pk ? QC.find((q) => q.name === pk || q.name === `cand_${pk}` || q.src === pk)
  : QC.filter((q) => q.ok).sort((a, b) => Math.abs(a.dur - hisDur) - Math.abs(b.dur - hisDur))[0];
if (!choice) die(`no candidate to apply (${pk ? `«${pk}» not found` : "none passes the QC"})`);
if (!choice.ok && !has("force")) die(`${choice.name} does not pass the QC (${["ok_words", "ok_db", "ok_dur", "ok_sil"].filter((k) => !choice[k]).join(", ")}) — --force only on the user's word`);
say(`applying ${choice.name} (${choice.dur} s, «${choice.inctx}»)`);
const verse0Json = rd(path.join(T, "verses.json"), null);
const frames0 = spec.frames, verse0 = JSON.parse(JSON.stringify(spec.items.filter((it) => it.t === "verse")));
const newAudio = I.audio + ".rf.wav";
const info = JSON.parse(run(CPY, ["tools/voice/rf_splice.py", jobF, choice.wav, newAudio]).trim().split("\n").pop());
const n = fB - fA, m = info.m, Dl = (n - m) / 30;
say(`new span ${m} frames (was ${n}): everything after ${B.toFixed(3)} s moves ${Dl >= 0 ? "back" : "forward"} ${Math.abs(Dl).toFixed(3)} s; silence after the words ${info.silence_after} s; ${info.act_db} dB (his ${info.target_db})`);
if (info.silence_after > 0.4 + 1e-6) die(`silence after the words ${info.silence_after} s > 0.4`);

// the LIST and every time after the span: tools/cut_block.mjs (JSON-only) with the original picture of the span cut to the new length
const SB = +(SA + m / 30).toFixed(4);
const cb = spawnSync(process.execPath, ["tools/cut_block.mjs", p, `f${fA}`, `f${fB}`, "--src", String(SA), String(SB), "--force"], { encoding: "utf8", env: { ...process.env, CUT_BLOCK_JSON_ONLY: "1", CUT_BLOCK_OUT: spec.cut } });
if (cb.status !== 0) { fs.rmSync(newAudio, { force: true }); die(`cut_block: ${(cb.stderr || cb.stdout).trim().split("\n").slice(-3).join(" | ")}`); }
console.log((cb.stdout || "").trim().split("\n").slice(-1)[0]);
if (m > n) {   // longer: the picture of the span, then its last frame held (one-frame pieces of the list)
  const M = rd(I.mapF), k = M.segments.findIndex((g) => Math.abs(g.a - SA) < 1e-3 && Math.abs(g.b - SB) < 1e-3);
  if (k >= 0) { const g = M.segments[k], end = +(SA + n / 30).toFixed(4), f1 = +(end - 1 / 30).toFixed(4); M.segments.splice(k, 1, { ...g, b: end }, ...Array.from({ length: m - n }, () => ({ ...g, a: f1, b: end }))); let t = 0; for (const s of M.segments) { s.n = +t.toFixed(4); t += s.b - s.a; } fs.writeFileSync(I.mapF, JSON.stringify(M)); }
}
fs.renameSync(newAudio, I.audio);
ff(["-i", I.audio, "-ac", "1", "-ar", "48000", path.join(T, "cut.wav")]);
ff(["-i", path.join(T, "cut.wav"), "-ar", "16000", "-ac", "1", path.join(T, "cut16k.wav")]);

// the light Studio copy (the Studio plays only it): spliced the same way, its sound from the new cut audio
{
  const LIST = path.join("data", "preview_proxies.json"), px = rd(LIST, {}), rel = spec.cut, v0 = px[rel], base = path.join("public", rel.replace(/\.mp4$/i, ""));
  const pv0 = `${base}_prev_${v0}.mp4`, pa0 = `${base}_prev_${v0}.m4a`, v1 = Date.now().toString(36), pv1 = `${base}_prev_${v1}.mp4`, pa1 = `${base}_prev_${v1}.m4a`;
  if (v0 && fs.existsSync(pv0)) {
    /* shorter: the smart cut (copied GOPs, tools/cut_splice.py); a copy made by another encoder (exit 4) or a longer span (held last frame): one quick re-encode of the light copy */
    const sp = m <= n ? spawnSync(SPY, ["tools/cut_splice.py", pv0, pv1, "--keep", `0-${fA + m},${fB}-${frames0}`, "--kind", "proxy"], { encoding: "utf8", windowsHide: true, maxBuffer: 1 << 26 }) : { status: 1 };
    if (sp.status !== 0) {
      fs.rmSync(pv1, { force: true });
      const head = m <= n ? `[0:v]trim=end_frame=${fA + m},setpts=PTS-STARTPTS[v0]` : `[0:v]trim=end_frame=${fB},setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop=${m - n}[v0]`;
      ff(["-i", pv0, "-filter_complex", `${head};[0:v]trim=start_frame=${fB},setpts=PTS-STARTPTS[v1];[v0][v1]concat=n=2:v=1:a=0[v]`, "-map", "[v]", "-an", "-c:v", "h264_nvenc", "-preset", "p4", "-cq", "28", "-g", "30", "-movflags", "+faststart", pv1]);
    }
    ff(["-i", I.audio, "-vn", "-c:a", "aac", "-aac_coder", "fast", "-b:a", "128k", "-movflags", "+faststart", pa1]);
    px[rel] = v1; fs.writeFileSync(LIST, JSON.stringify(px, null, 1));
    for (const f of [pv0, pa0]) { try { fs.rmSync(f, { force: true }); } catch { /* the Studio still reads it: the next proxy run removes it */ } }
    say(`light copy → ${path.basename(pv1)}`);
  } else say("no light copy registered: make_preview_proxy makes one");
}

// the words said now (faster-whisper on the new cut audio) into cut_words; the verse card follows
const end = A + m / 30, verF = path.join(D, "verify.json");
run(CPY, ["tools/voice/rf_qc.py", "words", I.audio, String(Math.max(0, A - 6)), String(end + 4), verF]);
const V = rd(verF, { text: "", words: [] }), toN = norm(TO);
const said = []; for (const x of toN) { const w = V.words.find((y) => y.s >= info.cand_at - 0.25 && y.s < end + 0.1 && !said.includes(y) && norm(y.w).some((z) => same(z, x))); if (w) said.push(w); }
let newWords;
if (said.length === toN.length) newWords = said.map((w) => ({ s: +Math.max(w.s, info.cand_at).toFixed(3), e: +Math.min(w.e, end).toFixed(3), w: w.w.replace(/[^ء-يً-ْ]/g, "") }));
else {   // not every word heard back: times by letters over the candidate (the QC still has to pass)
  const lens = toN.map((x) => x.length), tot = lens.reduce((a, b) => a + b, 0); let t = info.cand_at + 0.03;
  newWords = norm(TO).map((x, k) => { const d = (info.cand_len - 0.06) * lens[k] / tot, w = { s: +t.toFixed(3), e: +(t + d).toFixed(3), w: x }; t += d; return w; });
  say(`⚠ only ${said.length}/${toN.length} words heard back by time: placed by letters`);
}
{ const wf = path.join(T, "cut_words.json"), W = rd(wf, []), arr = Array.isArray(W) ? W : W.words; arr.push(...newWords); arr.sort((a, b) => a.s - b.s); fs.writeFileSync(wf, JSON.stringify(W)); }
const mvT = (t, k, list) => {   // a verse word time before the change → after it
  if (t < A) return t; if (t >= B) return +(t - Dl).toFixed(3);
  const nw = norm(list[k] ?? "")[0] ?? "", hit = newWords.find((w) => same(norm(w.w)[0] ?? "", nw)); return hit ? hit.s : +end.toFixed(3);
};
const fixTimes = (times, words) => { const o = times.map((t, k) => mvT(t, k, words)); for (let k = 1; k < o.length; k++) if (o[k] < o[k - 1]) o[k] = o[k - 1]; return o; };
const touched = [];
const fixSpec = (sF) => {
  const S = rd(sF, null); if (!S) return;
  for (const it of S.items.filter((x) => x.t === "verse")) {
    const old = verse0.find((v) => (v.id && v.id === it.id) || (v.aya === it.aya && v.title === it.title)), ts = old?.times; if (!ts?.length) continue;
    if (!(ts[0] < B && (ts[ts.length - 1] >= A || (old.until ?? 0) >= A))) continue;
    it.times = fixTimes(ts, old.words); it.full = true; touched.push(`${it.title ?? ""} ${it.refText ?? it.aya ?? ""}`.trim());
  }
  /* a reel spec carries its length in seconds too, and an end bumper sits at that length (tools/cut_block.mjs moves only frames and a mid bumper) */
  if (typeof S.duration === "number") S.duration = +(S.frames / 30).toFixed(3);
  if (S.bumper?.end && typeof S.bumper.at === "number") S.bumper.at = +(S.frames / 30).toFixed(2);
  fs.writeFileSync(sF, JSON.stringify(S, null, 1));
};
fixSpec(specF);
for (const f of [path.join(T, "spec_frozen.json")]) if (fs.existsSync(f)) fs.copyFileSync(specF, f);
{ const vf = path.join(T, "verses.json"), Vs = rd(vf, null);
  if (Vs) { for (const v of Vs) if (v.cut?.length && v.cut[0] < end && v.cut[v.cut.length - 1] >= A - 1) { const o = verse0Json?.find((x) => x.sura === v.sura && x.aya === v.aya && x.times?.[0] === v.times?.[0]); if (o?.cut) v.cut = fixTimes(o.cut, o.words); } fs.writeFileSync(vf, JSON.stringify(Vs, null, 1)); } }
{ const lf = path.join(T, "recitation_fix", "applied.json"), lg = rd(lf, []); lg.push({ at: new Date().toISOString(), A, B, n, m, shift: +Dl.toFixed(4), from: opt("from"), to: TO, cand: choice.name, wav: path.relative(".", choice.wav), words: newWords, verse: touched }); fs.writeFileSync(lf, JSON.stringify(lg, null, 1)); }
say(`cut_words: «${newWords.map((w) => w.w).join(" ")}» at ${newWords.map((w) => w.s.toFixed(2)).join(", ")}; verse card ${touched.join(", ") || "—"} → full: true; heard now: «${V.text}»`);
say(`lazy cut: ${L.status(p)} (the heavy file is built again from the original when its pixels are needed)`);
const va = spawnSync(process.execPath, ["tools/verse_audit.mjs", specF, "--strict"], { encoding: "utf8" });
console.log((va.stdout || "").trim().split("\n").filter((l) => /^[✔✘⚠]|^\s+- /.test(l)).join("\n"));
say(va.status === 0 ? "DONE — next: audio_gate, writing_sync, late_check, element_slots, coverage_check, peek" : "applied, but verse_audit still reports a difference (above)");
process.exit(va.status === 0 ? 0 : 1);
