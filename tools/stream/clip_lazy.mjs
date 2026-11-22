// مقطع من بث = قائمة نطاقات فوق الأصل، بلا ترميز فيديو (أمر المستخدم 2026-11-22: «القص مرة واحدة… بلا إعادة ترميز قبل الرندر الأخير»).
//   node tools/stream/clip_lazy.mjs <بث> <id> a-b[,c-d…]        a-b بثواني المصدر (من clip_table.json)؛ عدة نطاقات بالترتيب
//   node tools/stream/clip_lazy.mjs status <id>                  ما سُجّل للمقطع وما لم يُبنَ (لا فيديو)
//   node tools/stream/clip_lazy.mjs view <id>                    قائمة ffmpeg فوق الأصل (قراءة بلا ترميز) لأداة تحتاج بكسلات المقطع
// بديل tools/stream/clip_slice.mjs (الذي يقتطع شريحة فيديو بـh264_nvenc لكل مقطع من قص البث الكامل): هنا لا يُكتب ملف فيديو واحد؛ يُكتب:
//   public/<id>_map.json       خريطة المقطع = خريطة قص البث مقيَّدة بنطاقات المقطع: a/b بثواني الأصل، n على خط المقطع (tools/lib/lazy_clip.mjs)
//   .tmp/<id>/cut_audio.wav    صوت القص اللاضائع مقتطعاً للمقطع (الصوت يُقتطع رخيصاً؛ هو ما يقرؤه الرندر مع القائمة، tools/cut_lazy.mjs edlSetup)
//   .tmp/<id>/lazy_clip.json   علامة المقطع الكسول: لا يبني ensureCut له ملف قص ثقيلاً
// وبزمن المقطع: cut_words.json وcut.wav وcut_clean.wav وcut16k.wav وspeakers.json؛ وبزمن الأصل (كما عند البث نفسه): words.json وwords_vad.json وwords_table.json وvad.json وtr_vad.json،
// فتعمل كل أداة تقرأ «كلمات + خريطة» (verse_scan، audio_gate، verifyCut في فحص ما قبل الرندر…) كما هي. ثم آيات وحركات ومتطلبات وبوابة الصوت بأدواتها المعتادة.
// STREAM_ENCODE=1 يعيد المسار القديم كله (clip_slice.mjs) — يختاره fast_run.mjs وclip_cut_all.mjs.
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import { spawnSync } from "node:child_process";
try { os.setPriority(process.pid, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* best effort */ }
process.chdir(path.resolve(import.meta.dirname, "..", ".."));
const L = await import("../lib/lazy_clip.mjs");
const rd = (f, d = null) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const A = process.argv.slice(2);

if (A[0] === "status" || A[0] === "view") {
  const id = A[1]; if (!id || !L.isLazy(id)) { console.error(`✘ ${id ?? "؟"}: ليس مقطعاً كسولاً (لا .tmp/<id>/lazy_clip.json)`); process.exit(1); }
  if (A[0] === "view") { console.log(L.viewFile(id)); process.exit(0); }
  const m = L.readMarker(id), cut = path.join("public", `${id}_cut_s.mp4`), sz = (f) => (fs.existsSync(f) ? `${(fs.statSync(f).size / 1e6).toFixed(1)} MB` : "غير موجود");
  console.log(`${id}: كسول من ${m.parent}؛ ${m.pieces.length} قطعة، ${m.D}ث، ${m.segments} مدى من الأصل (${path.basename(L.srcOf(id))})`);
  console.log(`  ملف قص ثقيل ${cut}: ${sz(cut)} — صوت القص ${sz(path.join(".tmp", id, "cut_audio.wav"))}`); process.exit(0);
}

const SKIP = new Set(((A.includes("--skip") ? A[A.indexOf("--skip") + 1] : "") + "," + (process.env.CLIP_LAZY_SKIP ?? "")).split(",").filter(Boolean));   // --skip requirements,… : تشخيص/اختبار فقط (requirements يشغّل تفريغ large-v3 على كرت الشاشة)
const [P, id, spec] = A.filter((x, i) => !x.startsWith("--") && A[i - 1] !== "--skip");
if (!P || !id || !spec) { console.error("usage: node tools/stream/clip_lazy.mjs <stream> <id> a-b[,c-d…]"); process.exit(2); }
const TP = path.join(".tmp", P), T = path.join(".tmp", id), PY = process.env.PY ?? "S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe";
const t0 = Date.now();
const parentMap = rd(path.join("public", `${P}_map.json`));
if (!parentMap?.segments?.length) { console.error(`✘ ${id}: لا خريطة قص للبث ${P} (public/${P}_map.json): شغّل القص أولاً`); process.exit(1); }
const tableWords = (() => { const t = rd(path.join(TP, "words_table.json")); return (t?.words ?? []).map((w) => ({ s: +(w.s ?? w.start), e: +(w.e ?? w.end ?? w.s) })); })();
const PC = L.piecesOf(parentMap, spec, tableWords), { pieces, D } = PC;
if (!pieces.length) { console.error(`✘ ${id}: النطاق ${spec} خارج ما بقي من القص`); process.exit(1); }
const segs = L.childSegments(parentMap, PC);
fs.mkdirSync(T, { recursive: true });
const sh = (cmd, args) => { const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 1 << 26, windowsHide: true, env: { ...process.env, PYTHONIOENCODING: "utf-8", STREAM_SLICE_OK: "1" } }); if (r.status !== 0) throw new Error(`${cmd} ${args.slice(0, 3).join(" ")}: ${(r.stderr || r.stdout || "").slice(-300)}`); return r.stdout; };
// زمن القص للبث ← زمن المقطع (القطع على الإطارات الكاملة)
const toChild = (t) => { for (const p of pieces) if (t >= p.cs - 1e-6 && t < p.ce + 1e-6) return t - p.cs + p.off; return null; };
const srcToCut = (t) => { for (const g of parentMap.segments) if (t >= g.a - 1e-6 && t <= g.b + 1e-6) return g.n + (t - g.a); return null; };
const inSegs = (s, e, tol = 0.02) => segs.some((g) => e > g.a + tol && s < g.b - tol);   // كلمة أو مدى يتقاطع مع نطاق المقطع (زمن الأصل)

// 1) الخريطة والعلامة: لا فيديو
const model = parentMap.model === "cut_model" ? { model: "cut_model" } : {};
fs.writeFileSync(path.join("public", `${id}_map.json`), JSON.stringify({ segments: segs, duration: D, ...model }));
fs.mkdirSync(path.join("public", id), { recursive: true });
fs.writeFileSync(L.markerFile(id), JSON.stringify({ id, parent: P, D, frames: PC.frames, ranges: spec, pieces: pieces.map((p) => ({ cs: p.cs, ce: p.ce, off: p.off })), segments: segs.length, at: new Date().toISOString() }, null, 1));
// 2) شرائح الصوت (رخيصة): الصوت وحده، لا فيديو
const sliceAudio = (inF, outF, rate = 48000, mono = false) => {
  const n = pieces.length, ss = Math.max(0, Math.min(...pieces.map((p) => p.cs)) - 1), nf = (p) => p.ce - p.cs;
  const body = pieces.map((p, i) => `[sa${i}]atrim=start=${(p.cs - ss).toFixed(5)}:end=${(p.cs - ss + nf(p)).toFixed(5)},asetpts=PTS-STARTPTS[a${i}];`).join("");
  const fc = `[0:a]asplit=${n}${pieces.map((_, i) => `[sa${i}]`).join("")};` + body + pieces.map((_, i) => `[a${i}]`).join("") + `concat=n=${n}:v=0:a=1[a]`;
  const fcf = path.join(T, "slice_fc.txt"); fs.writeFileSync(fcf, fc);
  sh("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-threads", "4", "-ss", ss.toFixed(3), "-i", inF, "-/filter_complex", fcf, "-map", "[a]", "-ar", String(rate), ...(mono ? ["-ac", "1"] : []), "-c:a", "pcm_s16le", outF + ".part.wav"]);
  fs.renameSync(outF + ".part.wav", outF);
};
{ // cut16k.wav للأب: يصنعه القص الواحد بلا cut16k (مرة واحدة، آمن لأربع شرائح معاً)
  const p16 = path.join(TP, "cut16k.wav");
  if (!fs.existsSync(p16)) {
    const from = ["cut_audio.wav", "cut_clean.wav", "cut.wav"].map((f) => path.join(TP, f)).find((f) => fs.existsSync(f));
    if (from) { const tmp = path.join(TP, `cut16k.${process.pid}.part.wav`); sh("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-threads", "4", "-i", from, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", tmp]); try { fs.renameSync(tmp, p16); } catch { try { fs.rmSync(tmp); } catch { /* another slice made it first */ } } }
  }
}
const audioMain = [["cut.wav", "cut.wav", 48000, false], ["cut_clean.wav", "cut_clean.wav", 48000, false], ["cut16k.wav", "cut16k.wav", 16000, true]];
for (const [s, d, r, m] of audioMain) if (fs.existsSync(path.join(TP, s))) sliceAudio(path.join(TP, s), path.join(T, d), r, m);
{ const ca = ["cut_audio.wav", "cut_clean.wav"].map((f) => path.join(TP, f)).find((f) => fs.existsSync(f)); if (!ca) throw new Error(`لا صوت قص للبث ${P} (.tmp/${P}/cut_audio.wav)`); sliceAudio(ca, path.join(T, "cut_audio.wav"), 48000, false); }
// 3) كلمات المقطع بزمنه (من كلمات البث بعد القص)
const cw0 = rd(path.join(TP, "cut_words.json")), cw = (cw0.words ?? cw0).map((w) => ({ w: w.w ?? w.word, s: +(w.s ?? w.start), e: +(w.e ?? w.end) })).map((w) => ({ ...w, c: toChild((w.s + w.e) / 2) })).filter((w) => w.c !== null).map((w) => { const d = w.e - w.s, cs = Math.max(0, +(w.c - d / 2).toFixed(3)); return { w: w.w, s: cs, e: +Math.min(D, cs + d).toFixed(3) }; });
cw.sort((a, b) => a.s - b.s);
fs.writeFileSync(path.join(T, "cut_words.json"), JSON.stringify(cw, null, 1));
fs.writeFileSync(path.join(T, "cut_words_large.json"), JSON.stringify(cw));
fs.writeFileSync(path.join(T, "cut_transcript.txt"), cw.reduce((o, w, i) => { if (i % 12 === 0) o.push(`[${w.s.toFixed(1)}] `); o[o.length - 1] += w.w + " "; return o; }, []).join("\n") + "\n");
// 4) ما تشير إليه القائمة يبقى بزمن الأصل: الكلمات والجدول والكشف الصوتي والتفريغ المقسَّم
const srcWords = (f) => { const x = rd(path.join(TP, f)); return Array.isArray(x) ? x : x?.words ?? null; };
{ const w = srcWords("words_vad.json") ?? srcWords("words.json") ?? []; const rw = w.filter((x) => inSegs(+(x.s ?? x.start), +(x.e ?? x.end ?? x.s)));
  fs.writeFileSync(path.join(T, "words.json"), JSON.stringify(rw)); fs.writeFileSync(path.join(T, "words_vad.json"), JSON.stringify(rw)); }
try {
  const pt = rd(path.join(TP, "words_table.json")), tw = (pt.words ?? []).filter((w) => inSegs(+(w.s ?? w.start), +(w.e ?? w.end ?? w.s))).map((w, i) => ({ ...w, i }));
  if (tw.length) fs.writeFileSync(path.join(T, "words_table.json"), JSON.stringify({ model: `restricted from ${P} (words_table.json) to the clip's ranges by clip_lazy — ORIGINAL seconds`, from: P, words: tw }));
} catch { /* the stream has no word table (an old project): the clip falls back to its words, as before */ }
{ const merge = (arr) => { const out = []; for (const [s, e] of arr.sort((x, y) => x[0] - y[0])) { const l = out[out.length - 1]; if (l && s - l[1] < 0.02) l[1] = Math.max(l[1], e); else out.push([s, e]); } return out; };
  const pv = rd(path.join(TP, "vad.json"), {}), sp = [];
  for (const [s0, e0] of pv.speech ?? []) for (const g of segs) { const lo = Math.max(s0, g.a), hi = Math.min(e0, g.b); if (hi - lo > 0.02) sp.push([+lo.toFixed(3), +hi.toFixed(3)]); }
  fs.writeFileSync(path.join(T, "vad.json"), JSON.stringify({ ...pv, speech: merge(sp) }));
  const ptr = rd(path.join(TP, "tr_vad.json"), []), tsegs = Array.isArray(ptr) ? ptr : ptr.segments ?? [];
  const tr = tsegs.filter((s) => inSegs(s.s, s.e)).map((s, i) => ({ ...s, i }));
  fs.writeFileSync(path.join(T, "tr_vad.json"), JSON.stringify(tr)); }
// 5) إعدادات التجهيز: المصدر هو الأصل نفسه (لا نسخة)، وبلا نوافذ مصدر
const parentCfg = rd(path.join(TP, "prep_config.json"), {});
fs.writeFileSync(path.join(T, "prep_config.json"), JSON.stringify({ source: parentCfg.source ?? path.join("public", `${P}_src.mp4`), original: parentCfg.original ?? "", audioOnly: false, slicedFrom: P, lazy: true }, null, 2));
fs.writeFileSync(path.join(T, "sources.json"), JSON.stringify({ video: parentCfg.source ?? path.join("public", `${P}_src.mp4`), keyframes: 5, threshold: 22, windows: [] }, null, 2));
for (const f of ["noise_gaps.json", "explicit_rem.json", "join_ok.json"]) fs.writeFileSync(path.join(T, f), "[]");
// 6) المتكلمون: أدوار البث (زمن الأصل) ← زمن المقطع (الخريطة ثم القطع)
try {
  const sp = rd(path.join(TP, "speakers.json")), turns = [];
  for (const t of sp.turns) { const a = srcToCut(Math.max(t.s, 0)), b = srcToCut(t.e); const ca = a === null ? null : toChild(a), cb = b === null ? null : toChild(b); if (ca !== null && cb !== null && cb > ca) turns.push({ ...t, s: +ca.toFixed(2), e: +cb.toFixed(2) }); }
  turns.sort((x, y) => x.s - y.s);
  fs.writeFileSync(path.join(T, "speakers.json"), JSON.stringify({ speakers: sp.speakers, turns }));
  fs.writeFileSync(path.join(T, "speakers.txt"), turns.map((t) => `[${t.s.toFixed(1)}–${t.e.toFixed(1)}] ${t.name}: ${t.text}`).join("\n") + "\n");
} catch { /* لا تمييز للمتكلمين في البث */ }
// 7) ما كان يكتبه القص: آيات، حركات، متطلبات، ثم بوابة الصوت (الخريطة بزمن الأصل: a16k وtr_vad للأصل كما في قص البث نفسه)
const node = (a) => sh(process.execPath, a), out = [];
const tm = { reg: +((Date.now() - t0) / 1000).toFixed(1) }; let tk = Date.now(); const lap = (k) => { tm[k] = +((Date.now() - tk) / 1000).toFixed(1); tk = Date.now(); };
for (const [n, a] of [["verse_scan", ["tools/verse_scan.mjs", id]], ["moves_plan", ["tools/moves_plan.mjs", id]], ["requirements", ["tools/requirements.mjs", id]]].filter(([n]) => !SKIP.has(n))) { try { out.push(`${n}: ${node(a).trim().split("\n").pop().slice(0, 90)}`); } catch (e) { out.push(`⚠ ${n}: ${String(e.message).slice(0, 160)}`); } lap(n); }
const a16 = path.join(TP, "a16k.wav");
try { out.push(`audio_gate:${node(["tools/audio_gate.mjs", id, "--cut", path.join(T, "cut.wav"), "--map", path.join("public", `${id}_map.json`), "--tr", path.join(T, "tr_vad.json"), "--src16k", a16, "--audio", path.join(T, "cut.wav")]).trim().split("\n").slice(-2).join(" | ").slice(0, 160)}`); } catch (e) { out.push(`✘ audio_gate: ${String(e.message).slice(0, 240)}`); } lap("audio_gate");
console.log(`✔ ${id}: ${D}ث من ${pieces.length} قطعة (${segs.length} مدى من الأصل)؛ ${cw.length} كلمة؛ بلا ملف فيديو (${((Date.now() - t0) / 1000).toFixed(1)}ث؛ التسجيل والصوت ${tm.reg ?? "؟"}ث، ${Object.entries(tm).filter(([k]) => k !== "reg").map(([k, v]) => `${k} ${v}ث`).join("، ")})\n  ` + out.join("\n  "));
if (out.some((l) => l.startsWith("✘"))) { console.error(`✘ ${id}: بوابة الصوت على المقطع لم تنجح — لا يُسلَّم مقطع قبل نجاحها`); console.error(`  بعد قرارك في الأصوات (noise_ok.json) أعد البوابة وحدها: node tools/audio_gate.mjs ${id} --cut ${path.join(T, "cut.wav")} --map ${path.join("public", `${id}_map.json`)} --tr ${path.join(T, "tr_vad.json")} --src16k ${a16} --audio ${path.join(T, "cut.wav")}`); process.exit(1); }
void PY;
