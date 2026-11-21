#!/usr/bin/env node
// PRE-RENDER CHECK — nothing new may be found after the render (user 2026-11-21, GTA 6: «ليش تظهر أخطاء بعد الرندر؟ … لازم حل جذري»: each format was
// rendered 3–4 times because a missing cover, a click in the audio tail, the face zone, a click at a reel join and a misrecited verse surfaced only after it).
// Every check that runs on a rendered file has a TWIN here that measures the same property BEFORE the render (the map: data/prerender_map.md):
//   · the montage's final AUDIO is built first, exactly as the render will build it: the composition's own <Audio> records are collected with no picture
//     (tools/lib/audio_plan.mjs: Remotion renderFrames imageFormat "none", the full render's input props — the cut voice split around the bumper, the bumper's
//     sound, spec.sfx, scene sounds, the cover's sound, the tail, the music removals / bleeps / recitation fixes already in the cut audio) and mixed by the
//     render's own mixer into .tmp/<p>/prerender/audio_<L|R>.wav. That file gets final_review's audio checks (cut model / silences, peak, tail, reel joins)
//     plus clicks at every edge of the mix and the loudness. tools/gpu_render.mjs then MUXES THIS FILE (same plan = same bytes) instead of mixing its own;
//   · what the spec decides (cover first, bumper present and placed, short length with the bumper, two elements in one place / on the face, sections,
//     package, questions, audio gate proof, recitation) is checked from the spec and the cut;
//   · what needs pixels gets a short low-cost preview of the risky moments only: the 10 s judder probe (tools/judder_probe.mjs) and quarter-size stills at
//     the first split, the middle, the isolation windows and the end, scanned for black frames.
//   node tools/prerender_check.mjs <p> [--o land|port|both] [--no-pixels] [--no-listen] [--json]   (--no-* = a quick look; a pass with a skipped twin still counts)
// Writes .tmp/<p>/prerender.json (per orientation: every twin's result, the audio plan and the checked wav). tools/render_queue.mjs admit and every FULL
// render of tools/gpu_render.mjs refuse a montage without a pass newer than its spec, words, cut list and audio sources (tools/lib/prerender_gate.mjs).
// final_review stays: it confirms; when it fails on a property prerender passed it prints «عيب في البرنامج لا في الحلقة» with the property, so the twin is fixed.
// Self-test: tools/selftest_cases/e_prerender.mjs (synthetic audio, scratch specs; every case fails when its twin is taken out).
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const FPS = 30, BUMPER_FRAMES = 150, LUFS = { min: -30, max: -9 }, EXEMPT_BUMPER = ["paper", "ad", "explainer", "cartoon"];
const rd = (f, d = null) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const run = (cmd, args, o = {}) => spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 27, windowsHide: true, ...o });
const mmss = (t) => `${Math.floor(Math.max(0, t) / 60)}:${(Math.max(0, t) % 60).toFixed(2).padStart(5, "0")}`;
const R = (ok, msg) => ({ ok: !!ok, msg });

/* ── audio measures on a file (the same ffmpeg filters final_review runs on the rendered file) ── */
export const volume = (file, tail = null) => { const e = run("ffmpeg", ["-hide_banner", ...(tail ? ["-sseof", `-${tail}`] : []), "-i", file, "-af", "volumedetect", "-f", "null", "-"]).stderr || ""; return { max: Number(e.match(/max_volume: (-?[\d.]+) dB/)?.[1]), mean: Number(e.match(/mean_volume: (-?[\d.]+) dB/)?.[1]) }; };
export const loudness = (file) => { const e = run("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr || ""; const s = e.slice(e.lastIndexOf("Summary:")); return { I: Number(s.match(/I:\s+(-?[\d.]+) LUFS/)?.[1]), LRA: Number(s.match(/LRA:\s+(-?[\d.]+) LU/)?.[1]), peak: Number(s.match(/Peak:\s+(-?[\d.]+) dBFS/)?.[1]) }; };
export const duration = (file) => Number(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).stdout.trim());
/** silences > maxGap, the part inside the bumper excused (final_review's rule for files without a cut-model map) */
export function silences(file, bumper, { db = -38, maxGap = 0.4, dur = duration(file) } = {}) {
  const e = run("ffmpeg", ["-hide_banner", "-i", file, "-af", `silencedetect=noise=${db}dB:d=${maxGap}`, "-f", "null", "-"]).stderr || "";
  const starts = [...e.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1])), durs = [...e.matchAll(/silence_duration: ([\d.]+)/g)].map((m) => Number(m[1]));
  const bAt = typeof bumper?.at === "number" ? bumper.at : 0, bEnd = bumper?.position === "end";
  return starts.map((s, i) => ({ s, d: durs[i] ?? dur - s })).map((g) => { if (!bumper) return g; const a = bAt - (bEnd ? 0.6 : 0), b = bAt + bumper.seconds; if (g.s >= a && g.s < b) { const en = g.s + g.d; return { s: b, d: en - b }; } return g; }).filter((g) => g.d > maxGap);
}
/** every edge of the mix (a piece of sound starts or stops while the file goes on): the bumper, each sfx, the tail, the voice split — no sample jump there */
export function mixEdges(plan, NF, fps = FPS) {
  const t = new Set(); for (const x of plan ?? []) { if (x.at > 0) t.add(x.at); if (x.at + x.frames < NF) t.add(x.at + x.frames); }
  return [...t].sort((a, b) => a - b).map((f) => +(f / fps).toFixed(4));
}

/* ── the twins: id (the property; final_review names its line with the same id), label, the post-render check it doubles ── */
export const TWINS = [
  { id: "cover", label: "الغلاف أول عنصر وصورته موجودة", post: "final_review «الغلاف أول عنصر» + gpu_render + render_queue", run: (c) => { const why = c.deps.coverFailure(c.p, c.spec); return R(!why, why ? why.replace(/^✘ /, "") : "الغلاف أول عنصر وصورته موجودة"); } },
  { id: "bumper", label: "الفاصل في المونتاج وفي موضعه", post: "final_review «فاصل الافتتاح عند…» + render_job/gpu_render (لا فاصل = لا رندر)", run: (c) => {
    const b = c.spec.bumper, needs = !EXEMPT_BUMPER.includes(c.spec.kind);
    if (!b) return R(!needs, needs ? `المونتاج بلا فاصل: node tools/bumper_at.mjs ${c.p} --write ثم انظره في الاستوديو` : "بلا فاصل (نوع المونتاج)");
    if (b.position === "none") return R(true, "بلا فاصل عمداً (position none)");
    if (!c.deps.bumperKnown(b.id)) return R(false, `فاصل مجهول «${b.id ?? ""}»: المونتاج لا يرسمه (node tools/bumper_at.mjs ${c.p} --write)`);
    const end = !!b.end || b.position === "end";
    if (end) return R(true, `الفاصل «${b.id}» في آخر المونتاج`);
    if (typeof b.at !== "number") return R(false, `الفاصل بلا «at» ولا end: node tools/bumper_at.mjs ${c.p} --write`);
    const want = c.deps.bumperWant(c.p);
    if (want === null || !Number.isFinite(want)) return R(true, `الفاصل عند ${b.at.toFixed(2)}ث (لا كلمات لقياس أول تحية)`);
    return R(Math.abs(b.at - want) <= 0.6, Math.abs(b.at - want) <= 0.6 ? `فاصل الافتتاح عند ${b.at.toFixed(2)}ث = قبل أول تحية` : `فاصل الافتتاح عند ${b.at.toFixed(2)}ث والمطلوب ${want.toFixed(2)}ث (قبل «بسم الله/السلام عليكم»)`);
  } },
  { id: "short", label: "طول القصير ومعه الفاصل", post: "final_review «طول القصير» + gpu_render (الريل فوق 179ث)", run: (c) => {
    if (!(c.spec.kind === "reel" || c.deps.isShort(c.p))) return null;
    const total = (c.NF ?? (c.spec.frames + (c.bumper ? BUMPER_FRAMES : 0))) / FPS;
    return R(total <= c.shortMax, `طول القصير ${total.toFixed(2)}ث والحد ${c.shortMax}ث (الفاصل داخله)${total > c.shortMax ? " — لن يكون Short: قصّر" : ""}`);
  } },
  { id: "overlap", label: "لا عنصران في مكان واحد ولا عنصر على الوجه", post: "gpu_render + render_queue (overlap_gate) + نظرة المستخدم على الوجه", run: (c) => { const bad = c.deps.overlap(c.p, c.o === "L" ? "land" : "port"); return R(!bad.length, bad.length ? `${bad.length} تراكب/مكان مرفوض: ${bad.slice(0, 3).join(" · ")}` : "لا تراكب، ولا شيء على الوجه، ولا خارج الشاشة"); } },
  { id: "sections", label: "الأقسام وخطها", post: "final_review «الأقسام»", run: (c) => { if (c.o !== "L" || !c.deps.pre.appliesToEpisode(c.p, c.spec)) return null; const s = c.deps.pre.sectionsFailures(c.p, c.spec); return R(!s.length, s.length ? `الأقسام: ${s.join(" · ")}` : "الأقسام بعدد الجدول، وخط الأقسام في أول الثواني"); } },
  { id: "package", label: "حزمة يوتيوب", post: "final_review «حزمة يوتيوب»", run: (c) => { if (c.o !== "L" || !c.deps.pre.appliesToEpisode(c.p, c.spec)) return null; const k = c.deps.pre.packageFailures(c.p); return R(!k.length, k.length ? `حزمة يوتيوب: ${k.join(" · ")}` : "حزمة يوتيوب: الوصف والوسوم والفصول وقائمة التشغيل"); } },
  { id: "questions", label: "صفحة الأسئلة مجابة", post: "final_review «صفحة الأسئلة»", run: (c) => { const q = c.deps.pre.questionsFailures(c.p); if (!q.length && !c.deps.hasQuestions(c.p)) return null; return R(!q.length, q.length ? q[0] : "صفحة الأسئلة: كل بند مجاب"); } },
  { id: "audio_gate", label: "بوابة الصوت على الملفات الحالية", post: "final_review «بوابة الصوت»", run: (c) => c.deps.audioGate(c.p) },
  { id: "recitation", label: "التلاوة تطابق المصحف", post: "المستخدم وجدها بعد الرندر (gta6 النور 19)", run: (c) => c.deps.recitation(c.p) },
  { id: "audio", label: "صوت المونتاج النهائي مبني بطول الصورة", post: "final_review «لا مسار صوت» + «المدة»", run: (c) => {
    if (!c.wav || !fs.existsSync(c.wav)) return R(false, `لم يُبنَ صوت المونتاج قبل الرندر${c.audioWhy ? ": " + c.audioWhy : ""}`);
    const d = duration(c.wav), want = c.NF / FPS;
    return R(c.plan?.length > 0 && Math.abs(d - want) <= 0.05, `صوت المونتاج ${d.toFixed(2)}ث (الصورة ${want.toFixed(2)}ث)، ${c.plan?.length ?? 0} مقطع صوت`);
  } },
  { id: "cut_plan", label: "لا سكتة فوق الحد ولا قطع داخل كلمة في صوت المونتاج", post: "final_review «القص في هذا الملف…» / «سكتات >»", run: (c) => {
    if (!c.wav || !fs.existsSync(c.wav)) return R(false, "لا صوت لفحصه");
    if (c.cutModel) {
      const b = c.bumper ? { at: c.bumper.position === "end" ? Infinity : (c.bumper.at ?? 0), seconds: c.bumper.seconds, end: c.bumper.position === "end" } : null;
      const vio = c.deps.verifyCut({ segments: c.cutModel.segments, words: c.cutModel.words, file: c.wav, bumper: b });
      return R(!vio.length, vio.length ? `القص يخالف القاعدة في ${vio.length} موضعاً: ${c.deps.printViolations(vio).slice(0, 3).join(" · ")}` : `لا سكتة بين كلمتين فوق الحد ولا قطع داخل كلمة، والصوت يطابق خطة القص (${c.cutModel.source})`);
    }
    const g = silences(c.wav, c.bumper);
    return R(!g.length, g.length ? `سكتات > 0.4ث: ${g.slice(0, 5).map((x) => `${mmss(x.s)} (${x.d.toFixed(2)}ث)`).join("، ")}` : "لا سكتة > 0.4ث");
  } },
  { id: "peak", label: "قمة الصوت دون 0 dB", post: "final_review «قمة الصوت»", run: (c) => { if (!c.wav || !fs.existsSync(c.wav)) return R(false, "لا صوت لفحصه"); const v = volume(c.wav); return R(Number.isFinite(v.max) && v.max < -0.1, `قمة الصوت ${v.max} dB (المتوسط ${v.mean} dB)${v.max >= -0.1 ? " — قمة 0 dB: أخفّض" : ""}`); } },
  { id: "tail", label: "ذيل الصوت بلا نقرة", post: "final_review «ذيل الصوت (آخر 0.6ث)»", run: (c) => {
    if (!c.wav || !fs.existsSync(c.wav)) return R(false, "لا صوت لفحصه");
    const max = volume(c.wav).max, tmax = volume(c.wav, 0.6).max, ok = !Number.isFinite(tmax) || (tmax < -1 && !(Number.isFinite(max) && tmax > max - 0.05 && tmax > -3));
    return R(ok, `ذيل الصوت (آخر 0.6ث) قمته ${Number.isFinite(tmax) ? tmax : "؟"} dB${ok ? "" : " — ذيل تالف يُسمع نقرة: أصلح الصوت (audio_clean) ثم أعد"}`);
  } },
  { id: "seams", label: "وصلات الريل بلا نقرة ولا ذيل كلمة", post: "final_review «وصلات الريل» (join_seam_check على صوت الملف)", run: (c) => { if (!c.wav || !fs.existsSync(c.wav)) return R(false, "لا صوت لفحصه"); const r = c.deps.seamLine(c.p, c.wav, c.bumper); return r ? R(r.ok, r.msg) : null; } },
  { id: "edges", label: "لا نقرة عند حواف الصوت (الفاصل، المؤثرات، الذيل)", post: "final_review «ذيل الصوت» يرى الآخر وحده؛ النقرة عند الفاصل وُجدت بالسمع (umawi 2026-11-17)", run: (c) => {
    if (!c.wav || !fs.existsSync(c.wav)) return R(false, "لا صوت لفحصه");
    const edges = c.edges ?? mixEdges(c.plan, c.NF); if (!edges.length) return R(true, "لا حواف داخل الصوت");
    const bad = c.deps.edgeClicks(c.wav, edges);
    return R(!bad.length, bad.length ? `نقرة عند ${bad.length} من ${edges.length} حافة: ${bad.slice(0, 4).map((x) => `${mmss(x.t)} (قفزة ×${Number.isFinite(x.jump) ? x.jump.toFixed(0) : "∞"})`).join("، ")}` : `${edges.length} حافة بلا نقرة`);
  } },
  { id: "loudness", label: "علوّ الصوت في حدّه", post: "لا فحص بعد الرندر (يُسمع فقط)", run: (c) => { if (!c.wav || !fs.existsSync(c.wav)) return R(false, "لا صوت لفحصه"); const L = loudness(c.wav), ok = Number.isFinite(L.I) && L.I >= LUFS.min && L.I <= LUFS.max; return R(ok, `العلوّ ${Number.isFinite(L.I) ? L.I : "؟"} LUFS (الحد ${LUFS.min}…${LUFS.max})، المدى ${L.LRA} LU، القمة ${L.peak} dBFS${ok ? "" : Number(L.I) < LUFS.min ? " — خافت جداً" : " — عالٍ جداً"}`); } },
  { id: "listen", label: "لا «عفواً/أعيد/مونتاج» مسموعة في صوت المونتاج", post: "«فك الصوت المرندر كاملاً قبل أي نشر» (checking، مصيبة على السوريين 2026-11-20)", run: (c) => (c.noListen ? { ok: true, msg: "تُرك بأمر --no-listen", skipped: true } : c.deps.listen(c)) },
  { id: "judder", label: "لا ارتجاف (عيّنة 10ث قبل الرندر)", post: "render_job judder_check على الملف + final_review «بوابة الارتجاف»", pixels: true, run: (c) => c.deps.probe(c) },
  { id: "black", label: "لا إطار أسود عند المواضع الخطرة", post: "«أمسح الناتج كله بحثاً عن مقاطع سوداء» (remotion-render، إدلب 2026-11-15)", pixels: true, run: (c) => c.deps.black(c) },
];

/** run the twins on a context; ids = a subset (self-test). A twin that does not apply returns null and is left out */
export async function runTwins(c, ids = null) {
  const out = [];
  for (const t of TWINS) {
    if (ids && !ids.includes(t.id)) continue;
    if (t.pixels && c.noPixels) { out.push({ id: t.id, label: t.label, ok: true, skipped: true, msg: "تُرك بأمر --no-pixels" }); continue; }
    let r; try { r = await t.run(c); } catch (e) { r = R(false, `انهار الفحص: ${String(e?.message ?? e).slice(0, 200)}`); }
    if (r) out.push({ id: t.id, label: t.label, ok: r.ok, msg: r.msg, ...(r.skipped ? { skipped: true } : {}) });
  }
  return out;
}

/* ── the real dependencies (the self-test replaces the ones that read the real workspace) ── */
export async function realDeps() {
  const { coverFailure } = await import("./cover_item.mjs");
  const pre = await import("./prepublish_gates.mjs");
  const SL = await import("./short_limit.mjs");
  const { overlapFailures } = await import("./lib/overlap_gate.mjs");
  const CM = await import("./cut_model.mjs");
  const SEAMJ = await import("./join_seam_check.mjs");
  const man = rd(path.join(ROOT, "public/fawasel/manifest.json"), { bumpers: [] });
  return {
    coverFailure, pre, isShort: SL.isShort, overlap: overlapFailures, verifyCut: CM.verifyCut, printViolations: CM.printViolations,
    bumperKnown: (id) => !!man.bumpers?.find((x) => x.id === id),
    bumperWant: (p) => { if (!fs.existsSync(path.join(ROOT, ".tmp", p, "cut_words.json"))) return null; const r = run(process.execPath, ["tools/bumper_at.mjs", p]); const n = Number(String(r.stdout).trim().split(/\s+/).pop()); return r.status === 0 && Number.isFinite(n) ? n : null; },
    hasQuestions: (p) => fs.existsSync(path.join(ROOT, ".tmp", p, "questions.json")),
    seamLine: (p, file, bumper) => SEAMJ.finalReviewLine(p, file, bumper, ROOT),
    edgeClicks: (file, edges) => edgeClicks(file, edges, SEAMJ),
    audioGate: (p) => audioGate(p),
    recitation: (p) => { if (!fs.existsSync(path.join(ROOT, ".tmp", p, "cut_words.json"))) return null; const r = run(process.execPath, ["tools/recitation_check.mjs", p, "--strict"]); const lines = `${r.stdout}\n${r.stderr}`.split(/\r?\n/).filter((l) => /^\s*✘/.test(l)); return R(r.status === 0, r.status === 0 ? "كل تلاوة في كلامه تطابق المصحف (أو أقرّها المستخدم في verseAccepted)" : `التلاوة: ${lines.slice(0, 2).join(" · ").slice(0, 300) || "انظر .tmp/" + p + "/recitation_check.md"}`); },
    probe: (c) => probeTwin(c), black: (c) => blackTwin(c), listen: (c) => listenTwin(c),
  };
}
/** a sample jump at an edge (join_seam_check's click measure, the jump part only: a sound that starts or stops on a non-zero sample) */
export function edgeClicks(file, edges, SEAMJ) {
  const S = SEAMJ.SEAM, out = [];
  for (const t of edges) {
    const t0 = Math.max(0, t - 1), A = { y: SEAMJ.decode(file, { t0, dur: 2 }), sr: 48000, t0 };
    const m = SEAMJ.measureJoin(A, t, S);
    if (m.jump > S.jumpRatio && m.jMax > S.minJump && 20 * Math.log10(m.jMax + 1e-12) > m.floor + 6) out.push({ t, jump: m.jump, jMax: m.jMax });
  }
  return out;
}
/** final_review's audio-gate proof check, run before the render (the proof must hash the CURRENT files; a stale proof re-runs the gate with its saved args) */
export function audioGate(p) {
  const sha = (f) => { try { return crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, f))).digest("hex"); } catch { return null; } };
  let proof = rd(path.join(ROOT, ".tmp/gates", `${p}.audio.ok`));
  let stale = proof?.files ? Object.entries(proof.files).filter(([f, h]) => sha(f) !== h).map(([f]) => f) : ["(لا إثبات)"];
  if (stale.length) {
    const args = rd(path.join(ROOT, ".tmp", p, "gate_args.json"));
    if (args) { run(process.execPath, ["tools/audio_gate.mjs", ...args]); proof = rd(path.join(ROOT, ".tmp/gates", `${p}.audio.ok`)); stale = proof?.files ? Object.entries(proof.files).filter(([f, h]) => sha(f) !== h).map(([f]) => f) : ["(فشلت إعادة التشغيل)"]; }
  }
  return R(!stale.length, stale.length ? `بوابة الصوت لـ${p} لم تنجح على الملفات الحالية: ${stale.join("، ")}` : `بوابة الصوت نجحت لـ${p} على الملفات الحالية`);
}

/* ── the listening twin: the checked mix IS the delivered audio, so it is transcribed now (large-v3, the cue-word decoder) and searched for the markers ── */
const PY = process.env.PY ?? "S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe";
function listenTwin(c) {
  if (!c.wav || !fs.existsSync(c.wav)) return R(false, "لا صوت لفحصه");
  const sha = crypto.createHash("sha256").update(fs.readFileSync(c.wav)).digest("hex").slice(0, 16), out = projT(c.p, `listen_${sha}.json`);
  if (!fs.existsSync(out)) {
    const r = run(PY, ["-X", "utf8", path.join(ROOT, "tools", "transcribe_words.py"), c.wav, out], { timeout: 1800000, env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
    if (r.status !== 0 || !fs.existsSync(out)) return R(false, `التفريغ لم يعمل: ${String(r.stderr || r.stdout).trim().split(/\r?\n/).pop()?.slice(0, 200)}`);
  }
  const fr = run(process.execPath, ["tools/find_restarts.mjs", out]), m = (fr.stdout.match(/^markers: (.*)$/m)?.[1] ?? "").trim();
  const marks = m && m !== "none" ? m.split(/\s+/).map((x) => { const [w, t] = x.split("@"); return `«${w}» عند ${mmss(Number(t))}`; }) : [];
  return R(!marks.length, marks.length ? `مسموع في صوت المونتاج: ${marks.slice(0, 6).join("، ")} — احذف المحاولة الخاطئة (montage-orders) ثم أعد` : `فُرّغ صوت المونتاج كاملاً (${path.relative(ROOT, out)}): لا «عفواً/أعيد/مونتاج»`);
}

/* ── the pixel twins: a short preview of the risky moments, never the whole video ── */
const projT = (p, ...a) => path.join(ROOT, ".tmp", p, "prerender", ...a);
function probeTwin(c) {
  const g = rd(path.join(ROOT, ".tmp/gates", `${c.p}.probe.ok`)), specM = fs.statSync(path.join(ROOT, "data/specs", `${c.p}.json`)).mtimeMs;
  if (g && g.id === c.comp && g.at > specM) return R(true, `عيّنة الارتجاف نجحت لـ${c.comp} بعد آخر تعديل للمواصفة (الإطارات ${g.frames?.join("–")})`);
  const src = path.join("public", c.spec.cut ?? `${c.p}_cut_s.mp4`);
  const cm = (c.spec.cams || []).map((x) => ({ cx: x.cx, d: Math.min(x.to, c.spec.frames / FPS) - x.from })).sort((a, b) => b.d - a.d)[0];
  const crop = c.o === "R" ? ["--crop", "250,300,580,700", "--src-crop", `${Math.round((cm?.cx ?? 940) - 163)},169,326,394`] : [];
  const r = run(process.execPath, ["tools/judder_probe.mjs", c.comp, "--src", src, "--offset", "0", "--name", c.p, "--random", ...crop], { timeout: 900000 });
  const last = `${r.stdout}\n${r.stderr}`.split(/\r?\n/).filter((l) => /judder|✘|✔/.test(l)).slice(-2).join(" · ").slice(0, 240);
  return R(r.status === 0, r.status === 0 ? `عيّنة الارتجاف 10ث نجحت: ${last}` : `عيّنة الارتجاف فشلت: ${last}`);
}
/** the risky frames (cut timeline): inside the first split, the middle, the first isolation windows, near the end */
export function riskyFrames(spec, o) {
  const F = spec.frames, f = (s) => Math.max(0, Math.min(F - 1, Math.round(s * FPS))), pts = [];
  const sp = (o === "L" ? spec.splits ?? [] : [...(spec.psplits ?? []), ...(spec.splits ?? [])]).filter((x) => x.to - x.from > 1).sort((a, b) => a.from - b.from);
  if (sp[0]) pts.push(["split1", f(sp[0].from + Math.min(1.5, (sp[0].to - sp[0].from) / 2))]);
  pts.push(["middle", f(F / FPS / 2)]);
  for (const [i, w] of (spec.behind ?? []).slice(0, 2).entries()) pts.push([`window${i + 1}`, f(w.from + Math.min(1, (w.to - w.from) / 2))]);
  pts.push(["end", Math.max(0, F - 10)]);
  return [...new Map(pts.map(([n, x]) => [x, [n, x]])).values()];
}
/** mean luma (0–255) of a picture; a frame under BLACK_Y is black (a dark root background blackens the split windows: إدلب 2026-11-15) */
export const BLACK_Y = 16;
export const meanLuma = (f) => Number((run("ffmpeg", ["-hide_banner", "-i", f, "-vf", "signalstats,metadata=print:key=lavfi.signalstats.YAVG", "-f", "null", "-"]).stderr || "").match(/YAVG=([\d.]+)/)?.[1]);
function blackTwin(c) {
  const dir = projT(c.p, `stills_${c.o}`); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const pts = riskyFrames(c.spec, c.o);
  const r = run(process.execPath, ["tools/stills.mjs", c.comp, dir, ...pts.map(([n, x]) => `${n}:${x}`), "--scale", "0.25"], { timeout: 900000 });
  if (r.status !== 0) return R(false, `لقطات المواضع الخطرة لم تُرسم: ${String(r.stderr || r.stdout).trim().split(/\r?\n/).pop()?.slice(0, 200)}`);
  const bad = [];
  for (const [n, x] of pts) {
    const f = path.join(dir, `${n}.png`); if (!fs.existsSync(f)) { bad.push(`${n} (لا لقطة)`); continue; }
    const y = meanLuma(f);
    if (!(y > BLACK_Y)) bad.push(`${n} عند ${mmss(x / FPS)} (سطوع ${Number.isFinite(y) ? y.toFixed(0) : "؟"})`);
  }
  return R(!bad.length, bad.length ? `إطار أسود أو شبه أسود: ${bad.join("، ")} — لقطاته في ${path.relative(ROOT, dir)}` : `${pts.length} لقطة خطرة بلا إطار أسود (${path.relative(ROOT, dir)})`);
}

/* ── the audio of the montage, built before the render ── */
async function buildAudio(p, spec, comp, o, log) {
  const AP = await import("./lib/audio_plan.mjs"), { edlSetup } = await import("./cut_lazy.mjs");
  const edl = edlSetup(comp);
  const man = rd(path.join(ROOT, "public/fawasel/manifest.json"), { bumpers: [] }), b = spec.bumper;
  const bump = !!(b && b.position !== "none" && man.bumpers?.find((x) => x.id === b.id) && (b.end || b.position === "end" || typeof b.at === "number"));   // gpu_render's BUMP rule
  const inputProps = { hybrid: "top", hybridLayers: true, ...(bump ? { withBumper: true } : {}) };   // gpu_render's full-render props (render_job passes no --props)
  const t0 = Date.now();
  const { frames, composition } = await AP.collectAudioFrames({ compId: comp, inputProps, start: 0, end: null, concurrency: Number(process.env.PRERENDER_CONC || 4), log });
  const NF = composition.durationInFrames, segs = AP.segmentsFromFrames(frames, 0);
  const have = new Set(frames.map((f) => f.frame)); let miss = 0; for (let f = 0; f < NF; f++) if (!have.has(f)) miss++;
  if (miss) throw new Error(`سجلات الصوت ناقصة لـ${miss} إطاراً`);
  const wav = projT(p, `audio_${o}.wav`);
  AP.mixToFile(segs, wav, { NF, fps: FPS, root: ROOT, edl, codec: "pcm", work: projT(p, `work_${o}`), log });
  const plan = AP.planOf(segs, { root: ROOT, edl, fps: FPS });
  log(`صوت ${o === "L" ? "العرضي" : "الطولي"}: ${plan.length} مقطع، ${NF} إطاراً، في ${((Date.now() - t0) / 1000).toFixed(0)} ث`);
  const bumper = bump ? { id: b.id, title: man.bumpers.find((x) => x.id === b.id)?.title, seconds: BUMPER_FRAMES / FPS, at: b.end || b.position === "end" ? spec.frames / FPS : b.at, position: b.end || b.position === "end" ? "end" : "start" } : null;
  return { wav, plan, NF, edl, bumper, planStamp: AP.inputStamp(plan, ROOT) };
}

/* ── CLI ── */
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.chdir(ROOT);
  const argv = process.argv.slice(2), opt = (k, d = null) => (argv.includes(`--${k}`) ? argv[argv.indexOf(`--${k}`) + 1] : d);
  const p = argv.find((a) => !a.startsWith("--") && argv[argv.indexOf(a) - 1] !== "--o");
  const specF = path.join(ROOT, "data/specs", `${p}.json`);
  if (!p || !fs.existsSync(specF)) { console.error(`usage: node tools/prerender_check.mjs <p> [--o land|port|both] [--no-pixels] [--json]${p ? ` — لا مواصفة data/specs/${p}.json` : ""}`); process.exit(2); }
  const G = await import("./lib/prerender_gate.mjs");
  const spec = rd(specF), reel = spec.kind === "reel", forms = spec.forms ?? (reel ? ["port"] : ["port", "land"]);
  const want = opt("o", "both"), orients = ["land", "port"].filter((f) => forms.includes(f) && (want === "both" || want === f)).map((f) => (f === "land" ? "L" : "R")).sort();   // L before R (landscape first)
  const compBase = spec.compId || p.split("-").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join("-");
  const log = (m) => console.log(`[prerender] ${m}`);
  const deps = await realDeps(), SL = await import("./short_limit.mjs");
  let cutModel = null; { const map = rd(path.join(ROOT, "public", `${p}_map.json`)); if (map?.model === "cut_model") { const { projectInputs } = await import("./cut_model.mjs"); const { words, source } = projectInputs(p); cutModel = { segments: map.segments, words, source }; } }
  const specSha = G.sha(specF), side = G.sideStamp(p);
  const prev = rd(G.recordFile(p), {}), rec = { p, at: new Date().toISOString(), spec: specSha, side, orients: { ...(prev?.spec === specSha ? prev.orients : {}) } };
  let allOk = true;
  for (const o of orients) {
    const comp = compBase + (o === "L" ? "-L" : "");
    log(`${comp}: بناء صوت المونتاج النهائي قبل الرندر (بلا صورة)…`);
    let A = null, audioWhy = "";
    try { A = await buildAudio(p, spec, comp, o, log); } catch (e) { audioWhy = String(e?.message ?? e).slice(0, 300); }
    const ctx = { p, spec, o, comp, root: ROOT, deps, shortMax: SL.SHORT_MAX, cutModel, noPixels: argv.includes("--no-pixels"), noListen: argv.includes("--no-listen"), audioWhy,
      wav: A?.wav ?? null, plan: A?.plan ?? [], NF: A?.NF ?? spec.frames, bumper: A?.bumper ?? null };
    const twins = await runTwins(ctx);
    const ok = twins.every((t) => t.ok);
    allOk &&= ok;
    rec.orients[o] = { ok, at: new Date().toISOString(), comp, NF: ctx.NF, wav: A ? path.relative(ROOT, A.wav).replace(/\\/g, "/") : null, wavStamp: A ? G.stampOf(A.wav) : null, wavSha: A ? G.sha(A.wav) : null,
      plan: A?.plan ?? [], planStamp: A?.planStamp ?? {}, edl: A?.edl ? path.relative(ROOT, A.edl.audio).replace(/\\/g, "/") : null, bumper: ctx.bumper, pixels: !ctx.noPixels, twins };
    console.log(`\n${o === "L" ? "العرضي" : "الطولي"} (${comp}):`);
    for (const t of twins) console.log(`${t.ok ? (t.skipped ? "–" : "✔") : "✘"} [${t.id}] ${t.msg}`);
  }
  fs.mkdirSync(path.dirname(G.recordFile(p)), { recursive: true });
  fs.writeFileSync(G.recordFile(p), JSON.stringify(rec, null, 1));
  if (argv.includes("--json")) console.log(JSON.stringify(rec));
  console.log(`\n${allOk ? "✔ فحص ما قبل الرندر نجح" : "✘ فحص ما قبل الرندر فشل"} لـ${p} (${orients.map((o) => (o === "L" ? "العرضي" : "الطولي")).join(" ثم ")}) — ${path.relative(ROOT, G.recordFile(p))}${allOk ? "؛ الرندر يأخذ هذا الصوت كما هو" : "؛ لا رندر حتى يُصلَح ويُعاد"}`);
  process.exit(allOk ? 0 : 1);
}
