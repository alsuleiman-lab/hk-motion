// بناء بيانات ريل أو حلقة مناظرة من شريحة مقتطعة (tools/stream/clip_slice.mjs) — أمر المستخدم 2026-11-19: نموذج «فوق وتحت مع تكبير المتكلم».
//   node tools/debate_build.mjs <id> --title "العنوان" [--laughs "a-b,c-d"] [--verses '[{"from":..,"to":..,"text":"…","ref":"…"}]'] [--sections '[{"from":..,"title":"…"}]'] [--land]
// يقرأ .tmp/<id>/cut_words.json (كلمات الشريحة بمتحدثيها) فيبني الأدوار (S الشيخ، R الخصم) ويكتب data/debate/<id>.json الذي تقرؤه تركيبة DebateReel / DebateEpisode.
import fs from "node:fs"; import path from "node:path"; import { spawnSync } from "node:child_process";
process.chdir(path.resolve(import.meta.dirname, ".."));
const [id, ...rest] = process.argv.slice(2);
const opt = (k) => { const i = rest.indexOf("--" + k); return i < 0 ? null : rest[i + 1]; };
if (!id) { console.error('usage: node tools/debate_build.mjs <id> --title "…" [--laughs "a-b,…"] [--verses json] [--sections json] [--land]'); process.exit(2); }
const rd = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const map = rd(path.join("public", `${id}_map.json`));
const parent = opt("parent") ?? "munazara-yahud";
const dur = map.duration ?? map.segments.reduce((s, g) => s + (g.b - g.a), 0);
/* كلمات الشريحة بمتحدثيها: من جدول كلمات البث الأصلي (بزمن الأصل) ← زمن قص البث (خريطته) ← زمن الشريحة (قطعها في clip_table.json كما اقتطعتها clip_slice) */
const pmap = rd(path.join("public", `${parent}_map.json`)).segments;
const rng = rd(path.join(".tmp", parent, "clip_table.json")).find((x) => x.id === id).ranges;
const pieces = []; for (const r of rng) for (const g of pmap) { const lo = Math.max(g.a, r.from), hi = Math.min(g.b, r.to); if (hi - lo > 0.02) { const cs = g.n + (lo - g.a), ce = g.n + (hi - g.a), l = pieces[pieces.length - 1]; if (l && Math.abs(cs - l[1]) < 0.02) l[1] = ce; else pieces.push([cs, ce]); } }
for (let k = 0; k < pieces.length; k++) pieces[k][1] = pieces[k][0] + Math.max(1, Math.round((pieces[k][1] - pieces[k][0]) * 30)) / 30;
const off = []; { let acc = 0; for (const [x, y] of pieces) { off.push(acc); acc += y - x; } }
const toCut = (t) => { for (const g of pmap) if (t >= g.a - 1e-6 && t <= g.b + 1e-6) return g.n + (t - g.a); return null; };
const toChild = (c) => { for (let k = 0; k < pieces.length; k++) if (c >= pieces[k][0] - 1e-6 && c < pieces[k][1] + 1e-6) return c - pieces[k][0] + off[k]; return null; };
const words = rd(path.join(".tmp", parent, "words_table.json")).words.flatMap((pw) => { const cs = toCut(pw.s), ce = toCut(pw.e); const s0 = cs == null ? null : toChild(cs), e0 = ce == null ? null : toChild(ce); return s0 == null ? [] : [{ w: pw.w, s: s0, e: e0 ?? s0 + 0.2, sp: pw.sp }]; });
const spkJ = (() => { try { return rd(path.join(".tmp", id, "speakers.json")); } catch { return null; } })();
const nameOf = (lab) => (lab == null ? null : spkJ?.speakers?.[lab]?.name ?? lab);
const who = (w) => { const lab = w.sp ?? w.spk ?? null; if (lab == null) return null; const n = nameOf(lab); return n === "sheikh" || lab === "SPEAKER_03" || lab === "SPEAKER_04" ? "S" : (lab === "SPEAKER_11" ? "R" : null); };
// 1) تسمية كل كلمة ثم تنعيم: كلمة منفردة تخالف جارتيها تأخذ تسميتهما، وغير المعروف (المقدّم والمتصلون) يرث السابق
let lab = words.map(who);
for (let i = 0; i < lab.length; i++) if (lab[i] == null) lab[i] = lab.slice(0, i).reverse().find((x) => x) ?? lab.slice(i).find((x) => x) ?? "S";
for (let pass = 0; pass < 2; pass++) for (let i = 1; i < lab.length - 1; i++) if (lab[i] !== lab[i - 1] && lab[i - 1] === lab[i + 1]) lab[i] = lab[i - 1];
// 2) أدوار: من أول كلمة في الدور إلى أول كلمة في الدور التالي، ودور لا يتجاوز 0.8ث يُضم إلى سابقه
const turns = []; words.forEach((w, i) => { if (!turns.length || turns[turns.length - 1].who !== lab[i]) turns.push({ from: i === 0 ? 0 : +w.s.toFixed(3), to: 0, who: lab[i] }); });
turns.forEach((t, k) => { t.to = k < turns.length - 1 ? turns[k + 1].from : +dur.toFixed(3); });
const merged = []; for (const t of turns) { const l = merged[merged.length - 1]; if (l && (t.to - t.from < 0.8 || l.who === t.who)) l.to = t.to; else merged.push({ ...t }); }
// 3) مشاهد البث الموجَّه لكل لحظة (كل 0.25ث من ملف الشريحة): doc = وثيقة مشاركة (يسار أبيض) · full = كاميرا الشيخ وحدها بإطارها الذهبي (زاوية داكنة) · غير ذلك split = نصفان
const SC_FPS = 4, SW = 64, SH = 36;
const sr = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", path.join("public", `${id}_cut.mp4`), "-an", "-vf", `fps=${SC_FPS},scale=${SW}:${SH}:flags=area`, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { maxBuffer: 1 << 30 });
const nF = Math.floor(sr.stdout.length / (SW * SH * 3)), L = (i, x, y) => { const o = i * SW * SH * 3 + (y * SW + x) * 3; return 0.299 * sr.stdout[o] + 0.587 * sr.stdout[o + 1] + 0.114 * sr.stdout[o + 2]; };
const kinds = []; for (let i = 0; i < nF; i++) { let tl = 0, c = 0; for (let y = 0; y < 3; y++) for (let x = 0; x < 8; x++) { tl += L(i, x, y); c++; } tl /= c; let lf = 0; c = 0; for (let y = 6; y < 28; y++) for (let x = 2; x < 14; x++) { lf += L(i, x, y); c++; } lf /= c; let mid = 0; c = 0; for (let y = 6; y < 28; y++) for (let x = 24; x < 30; x++) { mid += L(i, x, y); c++; } mid /= c; kinds.push(lf > 200 ? "doc" : (tl < 60 ? "full" : (mid < 55 ? "split3" : "split"))); }
for (let i = 1; i < kinds.length - 1; i++) if (kinds[i] !== kinds[i - 1] && kinds[i - 1] === kinds[i + 1]) kinds[i] = kinds[i - 1];   // وميض إطار واحد
const scenes = []; kinds.forEach((k, i) => { const l = scenes[scenes.length - 1]; if (l && l.kind === k) l.to = (i + 1) / SC_FPS; else scenes.push({ from: i / SC_FPS, to: (i + 1) / SC_FPS, kind: k }); });
if (scenes.length) scenes[scenes.length - 1].to = Math.max(scenes[scenes.length - 1].to, dur);
const num = (s) => String(s ?? "").split(",").filter(Boolean).map((x) => { const [a, b] = x.split("-").map(Number); return { from: a, to: b }; });
const autoVerses = () => { try { return rd(path.join(".tmp", id, "verses.json")).filter((v) => v.times?.length).map((v) => ({ from: v.times[0], to: +(v.times[v.times.length - 1] + 0.35).toFixed(2), text: v.words.join(" "), ref: `${v.name} · ${v.ref}` })); } catch { return []; } };
const data = { src: `${id}_cut.mp4`, frames: Math.round(dur * 30), title: opt("title") ?? id, turns: merged, scenes, laughs: num(opt("laughs")), verses: opt("verses") ? JSON.parse(opt("verses")) : autoVerses(), ...(opt("sections") ? { sections: JSON.parse(opt("sections")) } : {}), ...(opt("focus") ? { focus: JSON.parse(opt("focus")) } : {}), ...(opt("rsrc") ? { rSrc: opt("rsrc") } : {}), ...(fs.existsSync(path.join("data", "debate", "footer.json")) ? { footer: rd(path.join("data", "debate", "footer.json")) } : {}) };   // focus = تركيز على لحظة في صورة الخصم؛ rSrc = ملف فيديو بديل لصورة الخصم؛ footer = اسم المناظرة ورابطها واسم القناة (data/debate/footer.json، أمر المستخدم 2026-11-19)
fs.mkdirSync(path.join("data", "debate"), { recursive: true });
fs.writeFileSync(path.join("data", "debate", `${id}.json`), JSON.stringify(data, null, 1));
const sh = merged.filter((t) => t.who === "S").reduce((s, t) => s + t.to - t.from, 0);
console.log(`✔ data/debate/${id}.json — ${dur.toFixed(1)}ث، ${data.frames} إطاراً، ${merged.length} دوراً (الشيخ ${sh.toFixed(0)}ث)`);
