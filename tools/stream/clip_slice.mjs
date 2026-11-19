// مقطع من بث = شريحة من القص الواحد للبث كله (أمر المستخدم 2026-11-16: «القص مرة واحدة في البداية ثم تقسم مقاطع»): بلا قص ولا تفريغ ولا تنعيم جديد.
//   node tools/stream/clip_slice.mjs <بث> <id> a-b[,c-d…]     a-b بثواني المصدر (من clip_table.json)؛ عدة نطاقات تُلصق بالترتيب
// المقطع مشروع قائم بنفسه خطّ زمنه هو زمن القص (خريطته هوية): public/<id>_{src,cut,cut_s}.mp4 (شريحة من القص المنعَّم) و_map.json،
// و.tmp/<id>/ بالكلمات والصوت والكشف الصوتي والمتكلمين مقتطعة ومزاحة من ملفات البث؛ ثم آيات وحركات ومتطلبات وبوابة الصوت بأدواتها المعتادة.
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import { spawnSync } from "node:child_process";
try { os.setPriority(process.pid, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* best effort */ }
process.chdir(path.resolve(import.meta.dirname, "..", ".."));
const [P, id, spec] = process.argv.slice(2);
if (!P || !id || !spec) { console.error("usage: node tools/stream/clip_slice.mjs <stream> <id> a-b[,c-d…]"); process.exit(2); }
const TP = path.join(".tmp", P), T = path.join(".tmp", id), PY = process.env.PY ?? "S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe";
const rd = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const map = rd(path.join("public", `${P}_map.json`)).segments;
// 1) نطاقات المصدر ← قطع من زمن القص (تلتحم المتجاورة)
const pieces = [];
for (const r of spec.split(",")) { const [a, b] = r.split("-").map(Number); for (const g of map) { const lo = Math.max(g.a, a), hi = Math.min(g.b, b); if (hi - lo > 0.02) { const cs = g.n + (lo - g.a), ce = g.n + (hi - g.a); const l = pieces[pieces.length - 1]; if (l && Math.abs(cs - l[1]) < 0.02) l[1] = ce; else pieces.push([cs, ce]); } } }
if (!pieces.length) { console.error(`✘ ${id}: النطاق ${spec} خارج ما بقي من القص`); process.exit(1); }
for (let k = 0; k < pieces.length; k++) pieces[k][1] = pieces[k][0] + Math.max(1, Math.round((pieces[k][1] - pieces[k][0]) * 30)) / 30;   // كل قطعة بعدد صحيح من الإطارات: الكلمات والخريطة والفيديو والصوت على خط زمني واحد بلا انجراف
const off = []; let acc = 0; for (const [a, b] of pieces) { off.push(acc); acc += b - a; } const D = +acc.toFixed(3);
const toChild = (t) => { for (let k = 0; k < pieces.length; k++) if (t >= pieces[k][0] - 1e-6 && t < pieces[k][1] + 1e-6) return t - pieces[k][0] + off[k]; return null; };
const sh = (cmd, args) => { const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 1 << 26, windowsHide: true, env: { ...process.env, PYTHONIOENCODING: "utf-8", STREAM_SLICE_OK: "1" } }); if (r.status !== 0) throw new Error(`${cmd} ${args.slice(0, 3).join(" ")}: ${(r.stderr || r.stdout || "").slice(-300)}`); return r.stdout; };
fs.mkdirSync(T, { recursive: true }); fs.mkdirSync(path.join("public", id), { recursive: true });
// 2) شريحة الصوت أو الفيديو من ملف البث
const slice = (inF, outF, video) => {
  if (pieces.length > 40) {   // مقطع طويل بقطع كثيرة (وصلات حذف السكتات): دخل واحد وفلتر واحد بدل ملف دخل لكل قطعة (ffmpeg لا يحتمل مئات المداخل)
    const ss = Math.max(0, Math.min(...pieces.map((p) => p[0])) - 1), n = pieces.length, nfOf = ([pa, pb]) => Math.max(1, Math.round((pb - pa) * 30));
    const vs = video ? `[0:v]split=${n}${pieces.map((_, i) => `[sv${i}]`).join("")};` : "", as = `[0:a]asplit=${n}${pieces.map((_, i) => `[sa${i}]`).join("")};`;
    const body = pieces.map((p, i) => { const s0 = (p[0] - ss).toFixed(4), e0 = (p[1] - ss).toFixed(4), nf = nfOf(p);
      return (video ? `[sv${i}]trim=start=${s0}:end=${e0},setpts=PTS-STARTPTS,fps=30,trim=end_frame=${nf},setpts=PTS-STARTPTS[v${i}];` : "") + `[sa${i}]atrim=start=${s0}:end=${e0},asetpts=PTS-STARTPTS,atrim=end=${(nf / 30).toFixed(5)},asetpts=PTS-STARTPTS[a${i}];`; }).join("");
    const cat = pieces.map((_, i) => (video ? `[v${i}]` : "") + `[a${i}]`).join("") + `concat=n=${n}:v=${video ? 1 : 0}:a=1${video ? "[v]" : ""}[a]`;
    const fcf = path.join(T, "slice_fc.txt"); fs.writeFileSync(fcf, vs + as + body + cat);
    sh("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-threads", "4", "-ss", ss.toFixed(3), "-i", inF, "-/filter_complex", fcf, ...(video ? ["-map", "[v]", "-map", "[a]", "-c:v", "h264_nvenc", "-preset", "p7", "-rc", "vbr", "-cq", "19", "-b:v", "0", "-r", "30", "-c:a", "aac", "-b:a", "192k", "-ar", "48000"] : ["-map", "[a]"]), outF]);
    return;
  }
  const ins = pieces.flatMap(([a, b]) => ["-ss", a.toFixed(3), "-t", (b - a).toFixed(3), "-i", inF]);
  const n = pieces.length, fc = video ? pieces.map(([pa, pb], i) => { const nf = Math.max(1, Math.floor((pb - pa) * 30 + 1e-6)); return `[${i}:v]setpts=PTS-STARTPTS,fps=30,trim=end_frame=${nf},setpts=PTS-STARTPTS[v${i}];[${i}:a]asetpts=PTS-STARTPTS,atrim=end=${(nf / 30).toFixed(5)},asetpts=PTS-STARTPTS[a${i}];`; }).join("")   /* كل قطعة فيديو وصوت بطول متساوٍ بالإطار: لا حشو صمت عند الوصلات (كان يضيف نحو 0.46 ث لمقطع من 54 وصلة فتظهر سكتات في الناتج لا في الصوت المنظَّف) */ + pieces.map((_, i) => `[v${i}][a${i}]`).join("") + `concat=n=${n}:v=1:a=1[v][a]`
    : pieces.map((_, i) => `[${i}:a]asetpts=PTS-STARTPTS[a${i}];`).join("") + pieces.map((_, i) => `[a${i}]`).join("") + `concat=n=${n}:v=0:a=1[a]`;
  sh("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-threads", "4", ...ins, "-filter_complex", fc, ...(video ? ["-map", "[v]", "-map", "[a]", "-c:v", "h264_nvenc", "-preset", "p7", "-rc", "vbr", "-cq", "19", "-b:v", "0", "-r", "30", "-c:a", "aac", "-b:a", "192k", "-ar", "48000"] : ["-map", "[a]"]), outF]);
};
// SLICE_VIDEO: ملف القص الحالي للأب إن كان بإصدار جديد بعد قص جزء (المواصفة `cut`، يمرّره tools/reel_from_episode.mjs)
(await import("../cut_lazy.mjs")).ensureCut(P);   // the parent's cut video matches its cut list (tools/cut_lazy.mjs)
const parentVideo = process.env.SLICE_VIDEO && fs.existsSync(process.env.SLICE_VIDEO) ? process.env.SLICE_VIDEO : ["cut_s", "cut"].map((s) => path.join("public", `${P}_${s}.mp4`)).find((f) => fs.existsSync(f));
if (!parentVideo) { console.error(`✘ لا قص لـ${P} بعد`); process.exit(1); }
const cutS = path.join("public", `${id}_cut_s.mp4`); slice(parentVideo, cutS, true);
for (const s of ["cut", "src"]) { const f = path.join("public", `${id}_${s}.mp4`); try { fs.rmSync(f); } catch { /* new */ } try { fs.linkSync(cutS, f); } catch { fs.copyFileSync(cutS, f); } }
/* (2026-11-18) the child map keeps the parent's cut-model segments (clip / speech types) on the child timeline, so the audio gate measures the slice with
   the ONE cut rule (word gaps, clip windows exempt) instead of raw file silence — a reel sliced from a cut episode failed on pauses the episode passed */
const parentMap = rd(path.join("public", `${P}_map.json`)), childSegs = [];
for (const g of parentMap.segments) { const gs = g.n, ge = g.n + (g.b - g.a); for (let k = 0; k < pieces.length; k++) { const lo = Math.max(gs, pieces[k][0]), hi = Math.min(ge, pieces[k][1]); if (hi - lo > 0.02) { const c = +(lo - pieces[k][0] + off[k]).toFixed(4); childSegs.push({ a: c, b: +(c + hi - lo).toFixed(4), n: c, ...(g.type ? { type: g.type } : {}) }); } } }
childSegs.sort((x, y) => x.n - y.n);
fs.writeFileSync(path.join("public", `${id}_map.json`), JSON.stringify(parentMap.model === "cut_model" && childSegs.length ? { segments: childSegs, duration: D, model: "cut_model" } : { segments: [{ a: 0, b: D, n: 0 }], duration: D }));
// SLICE_AUDIO_CHECK=1: صوت للأب لا يطابق طول خريطته (قديم من قبل قص جزء) لا يُقتطع، فلا تنحرف الشريحة
const parentD = rd(path.join("public", `${P}_map.json`)).duration;
const staleWav = (f) => { if (process.env.SLICE_AUDIO_CHECK !== "1" || !parentD) return false; const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], { encoding: "utf8", windowsHide: true }); const d = Number(String(r.stdout).trim()); if (Number.isFinite(d) && Math.abs(d - parentD) > 0.15) { console.log(`⚠ ${path.basename(f)} (${d.toFixed(2)}ث) لا يطابق خريطة ${P} (${parentD}ث): لم يُقتطع`); return true; } return false; };
for (const [src, dst] of [["cut.wav", "cut.wav"], ["cut_clean.wav", "cut_clean.wav"], ["cut16k.wav", "cut16k.wav"]]) if (fs.existsSync(path.join(TP, src)) && !staleWav(path.join(TP, src))) slice(path.join(TP, src), path.join(T, dst), false);
fs.copyFileSync(path.join(T, "cut16k.wav"), path.join(T, "a16k.wav"));
// 3) الكلمات (زمن القص ← زمن المقطع)
const cw0 = rd(path.join(TP, "cut_words.json")), cw = (cw0.words ?? cw0).map((w) => ({ w: w.w ?? w.word, s: +(w.s ?? w.start), e: +(w.e ?? w.end) })).map((w) => ({ ...w, c: toChild((w.s + w.e) / 2) })).filter((w) => w.c !== null).map((w) => { const s = toChild(Math.min(w.s, w.c + 0)) ?? w.s; const d = w.e - w.s; const cs = Math.max(0, +(w.c - d / 2).toFixed(3)); return { w: w.w, s: cs, e: +Math.min(D, cs + d).toFixed(3) }; });
cw.sort((a, b) => a.s - b.s);   // نطاقات بترتيب المستخدم لا بالترتيب الزمني: الكلمات بزمن المقطع
fs.writeFileSync(path.join(T, "cut_words.json"), JSON.stringify(cw, null, 1));
for (const f of ["cut_words_large.json", "words.json", "words_vad.json"]) fs.writeFileSync(path.join(T, f), JSON.stringify(cw));
fs.writeFileSync(path.join(T, "cut_transcript.txt"), cw.reduce((o, w, i) => { if (i % 12 === 0) o.push(`[${w.s.toFixed(1)}] `); o[o.length - 1] += w.w + " "; return o; }, []).join("\n") + "\n");
// 4) كشف صوتي جديد على الشريحة (ثوانٍ) ثم تفريغ موزَّع عليه، وإعدادات التجهيز
sh(PY, ["tools/vad_segments.py", path.join(T, "a16k.wav"), path.join(T, "vad.json"), "--padstart", "100", "--padend", "180", "--minsil", "150"]);
/* (2026-11-18) with a cut-model parent the child's speech stretches are the PARENT's (source → parent cut → child), so the one cut rule sees the same
   untranscribed sounds the parent's plan saw; a fresh detection on the slice split them across the joins («cut inside a word» that the episode never had) */
if (parentMap.model === "cut_model") {
  try {
    const pv = rd(path.join(TP, "vad.json")).speech ?? [], sp = [];
    for (const [s0, e0] of pv) for (const g of parentMap.segments) { const lo = Math.max(s0, g.a), hi = Math.min(e0, g.b); if (hi - lo <= 0.02) continue;
      const c0 = g.n + (lo - g.a), c1 = g.n + (hi - g.a);
      for (let k = 0; k < pieces.length; k++) { const l2 = Math.max(c0, pieces[k][0]), h2 = Math.min(c1, pieces[k][1]); if (h2 - l2 > 0.02) sp.push([+(l2 - pieces[k][0] + off[k]).toFixed(3), +(h2 - pieces[k][0] + off[k]).toFixed(3)]); } }
    sp.sort((x, y) => x[0] - y[0]);
    const vj = rd(path.join(T, "vad.json")); vj.speech = sp; fs.writeFileSync(path.join(T, "vad.json"), JSON.stringify(vj));
  } catch (e) { console.log(`⚠ parent speech stretches not mapped: ${e.message}`); }
}
const vad = rd(path.join(T, "vad.json")).speech;
const tr = vad.map(([s, e], i) => { const ws = cw.filter((w) => (w.s + w.e) / 2 >= s - 0.05 && (w.s + w.e) / 2 <= e + 0.05); return { i, s, e, text: ws.map((w) => w.w).join(" "), words: ws }; });
fs.writeFileSync(path.join(T, "tr_vad.json"), JSON.stringify(tr));
const parentCfg = fs.existsSync(path.join(TP, "prep_config.json")) ? rd(path.join(TP, "prep_config.json")) : {};
fs.writeFileSync(path.join(T, "prep_config.json"), JSON.stringify({ source: path.join("public", `${id}_src.mp4`), original: parentCfg.original ?? "", audioOnly: false, slicedFrom: P }, null, 2));
fs.writeFileSync(path.join(T, "sources.json"), JSON.stringify({ video: path.join("public", `${id}_src.mp4`), keyframes: 5, threshold: 22, windows: [] }, null, 2));
for (const f of ["noise_gaps.json", "explicit_rem.json", "join_ok.json"]) fs.writeFileSync(path.join(T, f), "[]");
// 5) المتكلمون: أدوار البث (زمن المصدر) ← زمن المقطع بالخريطة والشرائح
const srcToCut = (t) => { for (const g of map) if (t >= g.a - 1e-6 && t <= g.b + 1e-6) return g.n + (t - g.a); return null; };
try {
  const sp = rd(path.join(TP, "speakers.json")), turns = [];
  for (const t of sp.turns) { const a = srcToCut(Math.max(t.s, 0)), b = srcToCut(t.e); const ca = a === null ? null : toChild(a), cb = b === null ? null : toChild(b); if (ca !== null && cb !== null && cb > ca) turns.push({ ...t, s: +ca.toFixed(2), e: +cb.toFixed(2) }); }
  turns.sort((x, y) => x.s - y.s);
  fs.writeFileSync(path.join(T, "speakers.json"), JSON.stringify({ speakers: sp.speakers, turns }));
  fs.writeFileSync(path.join(T, "speakers.txt"), turns.map((t) => `[${t.s.toFixed(1)}–${t.e.toFixed(1)}] ${t.name}: ${t.text}`).join("\n") + "\n");
} catch { /* لا تمييز للمتكلمين في البث */ }
// 6) ما كان يكتبه قص المقطع: آيات، حركات، متطلبات، ثم بوابة الصوت على الشريحة
const node = (a) => sh(process.execPath, a);
const out = [];
for (const [n, a] of [["verse_scan", ["tools/verse_scan.mjs", id]], ["moves_plan", ["tools/moves_plan.mjs", id]], ["requirements", ["tools/requirements.mjs", id]]]) { try { out.push(`${n}: ${node(a).trim().split("\n").pop().slice(0, 90)}`); } catch (e) { out.push(`⚠ ${n}: ${String(e.message).slice(0, 160)}`); } }
try { out.push(`audio_gate: ${node(["tools/audio_gate.mjs", id, "--cut", path.join(T, "cut.wav"), "--map", path.join("public", `${id}_map.json`), "--tr", path.join(T, "tr_vad.json"), "--src16k", path.join(T, "a16k.wav"), "--audio", path.join(T, "cut.wav")]).trim().split("\n").slice(-2).join(" | ").slice(0, 160)}`); } catch (e) { out.push(`✘ audio_gate: ${String(e.message).slice(0, 240)}`); }
console.log(`✔ ${id}: ${D}ث من ${pieces.length} قطعة؛ ${cw.length} كلمة\n  ` + out.join("\n  "));
