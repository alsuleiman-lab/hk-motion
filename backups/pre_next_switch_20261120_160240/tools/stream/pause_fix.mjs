// إصلاح بوابة الصوت لمقطع من بث (2026-11-16): سكتات > 0.40 ث تُقصَّر إلى 0.30 وأصوات لم تُحسم (تنحنح، «اه» في الحدّ، همهمة) تُحذف، ثم يُعاد اقتطاع المقطع من القص الواحد.
//   node tools/stream/pause_fix.mjs <بث> <مقطع> [<مقطع> …]
// يقرأ نتيجة tools/audio_gate.mjs، يحوّل زمن المقطع إلى زمن المصدر بخريطة القص، ثم يعدّل ranges المقطع في .tmp/<بث>/clip_table.json ويشغّل clip_slice.mjs؛ حتى 3 جولات.
// بعد النجاح يلزم بناء المواصفة من جديد (clip_autobuild ثم clip_repair ثم fast_run checks) لأن الكلمات تغيّرت.
import fs from "node:fs"; import path from "node:path"; import { spawnSync } from "node:child_process";
process.chdir(path.resolve(import.meta.dirname, "..", ".."));
const [P, ...ids0] = process.argv.slice(2), ids = ids0.filter((x, i) => !x.startsWith("--") && !(i > 0 && ids0[i - 1] === "--rem")); if (!P || !ids.length) { console.error("usage: node tools/stream/pause_fix.mjs <stream> <id> …"); process.exit(2); }
const rd = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const PY = process.env.PY ?? "S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe";
const gate = (id) => { const T = path.join(".tmp", id), r = spawnSync(process.execPath, ["tools/audio_gate.mjs", id, "--cut", path.join(T, "cut.wav"), "--map", path.join("public", `${id}_map.json`), "--tr", path.join(T, "tr_vad.json"), "--src16k", path.join(T, "a16k.wav"), "--audio", path.join(T, "cut.wav")], { encoding: "utf8", maxBuffer: 1 << 26 }); return { ok: r.status === 0, out: (r.stdout ?? "") + (r.stderr ?? "") }; };
const finalSil = (id) => { const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", (fs.existsSync(path.join(".tmp", id, "cut_clean.wav")) ? path.join(".tmp", id, "cut_clean.wav") : path.join(".tmp", id, "cut.wav")), "-af", "silencedetect=noise=-38dB:d=0.33", "-f", "null", "-"], { encoding: "utf8", maxBuffer: 1 << 26 }); const out = []; let s = null;
  for (const l of (r.stderr ?? "").split(String.fromCharCode(10))) { const a = l.match(/silence_start: ([0-9.]+)/); if (a) s = Number(a[1]); const b = l.match(/silence_duration: ([0-9.]+)/); if (b && s !== null) { const d = Number(b[1]); if (s > 0.3) out.push([s, d]); s = null; } } return out; };
const map = rd(path.join("public", `${P}_map.json`), { segments: [] }).segments;
const cutRangesToSrc = ([cs, ce]) => { const out = []; for (const g of map) { const lo = Math.max(g.n, cs), hi = Math.min(g.n + (g.b - g.a), ce); if (hi - lo > 0.02) out.push({ from: +(g.a + (lo - g.n)).toFixed(3), to: +(g.a + (hi - g.n)).toFixed(3) }); } return out; };
for (const id of ids) {
  const tf = path.join(".tmp", P, "clip_table.json"); let fixed = false;
  if (process.argv.includes("--reslice")) { const c0 = rd(tf, []).find((x) => x.id === id); if (c0) { const r0 = spawnSync(process.execPath, ["tools/stream/clip_slice.mjs", P, id, c0.ranges.map((x) => x.from + "-" + x.to).join(",")], { encoding: "utf8", maxBuffer: 1 << 26 }); console.log(id + ": أُعيد الاقتطاع من الجدول (" + (r0.status === 0 ? "نجح" : "فشل") + ")"); } }
  const MAXR = process.argv.includes("--rounds") ? Number(process.argv[process.argv.indexOf("--rounds") + 1]) : 3;   // --rounds 1: جولة الحذف المطلوبة وحدها (لا حذف آلي لما تكشفه البوابة بعدها، فقد يكون حرفاً مهموساً داخل كلمة)
  for (let round = 1; round <= MAXR; round++) {
    const g = gate(id); const fs2 = g.ok && process.argv.includes("--final") ? finalSil(id) : []; if (g.ok && !fs2.length && !(round === 1 && process.argv.includes("--rem"))) { console.log(`✔ ${id}: بوابة الصوت نجحت${round > 1 ? " بعد " + (round - 1) + " جولة" : ""}`); fixed = true; break; }
    const rem = [];   // فترات تُحذف بزمن المقطع
    const pm = g.out.match(/سكتات > 0\.40ث: \d+ ([^\n(]*)\(/); for (const m of (pm?.[1] ?? "").matchAll(/\[([0-9.]+)ث ×([0-9.]+)\]/g)) { const t = Number(m[1]), len = Number(m[2]); rem.push([t + 0.10, t + len - 0.10]); }
    const nm = g.out.match(/لم تُحسم: \d+ ([^\n—]*)—/); for (const m of (nm?.[1] ?? "").matchAll(/\[([0-9.]+)-([0-9.]+)/g)) rem.push([Number(m[1]), Number(m[2])]);
    { const ri = process.argv.indexOf("--rem"); if (ri > 0 && round === 1) for (const x of process.argv[ri + 1].split(",")) { const [a, b] = x.split("-").map(Number); if (b > a) rem.push([a, b]); } }   // مقاطع صمت محدّدة بزمن المقطع (مما كشفته المراجعة النهائية على الناتج)
    for (const [s, d] of fs2) rem.push([s + 0.11, s + d - 0.11]);   // كاشف المراجعة النهائية بعتبة 0.33 (ناتج الرندر يقيس أطول من الشريحة بنحو 0.13 ث): يبقى 0.22 ث
    if (!rem.length) { console.log(`✘ ${id}: بوابة الصوت فشلت بسبب لا أعالجه آلياً:\n${g.out.split("\n").filter((l) => l.includes("✘")).join("\n")}`); break; }
    const table = rd(tf, []), c = table.find((x) => x.id === id); if (!c) { console.log(`✘ ${id}: لا سجل في الجدول`); break; }
    // قطع المقطع بزمن القص، ثم زمن المقطع ← زمن القص
    const pieces = []; for (const r of c.ranges) for (const g of map) { const lo = Math.max(g.a, r.from), hi = Math.min(g.b, r.to); if (hi - lo > 0.02) { const cs = g.n + (lo - g.a), ce = g.n + (hi - g.a), l = pieces[pieces.length - 1]; if (l && Math.abs(cs - l[1]) < 0.02) l[1] = ce; else pieces.push([cs, ce]); } }   // كما في clip_slice.mjs
    const off = []; let acc = 0; for (const [a, b] of pieces) { off.push(acc); acc += b - a; }
    const cutOf = (t) => { for (let k = 0; k < pieces.length; k++) if (t >= off[k] - 1e-6 && t <= off[k] + (pieces[k][1] - pieces[k][0]) + 1e-6) return pieces[k][0] + (t - off[k]); return null; };
    const keepChild = []; let cur = 0; for (const [a, b] of rem.sort((x, y) => x[0] - y[0])) { if (a > cur) keepChild.push([cur, a]); cur = Math.max(cur, b); } if (cur < acc) keepChild.push([cur, acc]);
    const newCut = []; for (const [a, b] of keepChild) for (let k = 0; k < pieces.length; k++) { const lo = Math.max(a, off[k]), hi = Math.min(b, off[k] + (pieces[k][1] - pieces[k][0])); if (hi - lo > 0.05) newCut.push([pieces[k][0] + (lo - off[k]), pieces[k][0] + (hi - off[k])]); }
    const ranges = newCut.flatMap(cutRangesToSrc); if (!ranges.length) { console.log(`✘ ${id}: لم يبقَ شيء بعد الحذف`); break; }
    c.ranges = ranges; c.dur = +ranges.reduce((s, r) => s + r.to - r.from, 0).toFixed(1); fs.writeFileSync(tf, JSON.stringify(table, null, 1));
    console.log(`${id}: جولة ${round} — حذف ${rem.map(([a, b]) => `${a.toFixed(2)}-${b.toFixed(2)}`).join("، ")} → ${ranges.length} نطاقاً`);
    const r = spawnSync(process.execPath, ["tools/stream/clip_slice.mjs", P, id, ranges.map((x) => `${x.from}-${x.to}`).join(",")], { encoding: "utf8", maxBuffer: 1 << 26 });
    if (r.status !== 0) { console.log(`✘ ${id}: اقتطاع فشل: ${(r.stderr || r.stdout).slice(-200)}`); break; }
  }
  if (!fixed) process.exitCode = 1;
}
