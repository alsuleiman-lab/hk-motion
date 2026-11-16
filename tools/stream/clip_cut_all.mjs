// قصّ مقاطع البث من تسجيله الكامل بحدود كلمات منطوقة، ثم تجهيز كل مقطع (تفريغ وتمييز متكلمين).
//   node tools/stream/clip_cut_all.mjs <plan.json> --resolve        يحسب الحدود من الكلمات ويكتب الجدول .tmp/<p>/clip_table.json ولا يقصّ
//   node tools/stream/clip_cut_all.mjs <plan.json> [--only a,b]      يقتطع المقاطع شرائح من القص الواحد للبث (بعد cut_smart على البث كله): clip_slice.mjs لكل مقطع
// ملف الخطة: { src, words, clips: [ { id, topic, kind?, ranges: [ { a, b, start, end, sw?, ew?, endMode? } ] } ] }
//   a/b زمنان تقريبيان من التفريغ؛ start/end عبارتان من كلام المتكلم نفسه تحدّدان الحدّين بدقة الكلمة (البحث حول a وb)؛
//   sw=[قبل,بعد] نافذة بحث البداية (افتراضي 3 و10)، ew نافذة بحث النهاية (10 و4)؛ endMode: last (افتراضي) أو first.
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import { spawnSync } from "node:child_process";
try { os.setPriority(process.pid, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* best effort */ }
process.chdir(path.resolve(import.meta.dirname, "..", ".."));
const [planF, ...rest] = process.argv.slice(2);
if (!planF) { console.error("usage: node tools/stream/clip_cut_all.mjs <plan.json> [--resolve] [--only a,b]"); process.exit(2); }
const P = JSON.parse(fs.readFileSync(planF, "utf8"));
const only = rest.includes("--only") ? new Set(rest[rest.indexOf("--only") + 1].split(",")) : null;
const norm = (s) => String(s).replace(/[ً-ْٰـ]/g, "").replace(/[إأآٱا]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[^\p{L}\p{N}]/gu, "");
const W = JSON.parse(fs.readFileSync(P.words, "utf8")).map((w) => ({ s: w.s, e: w.e, n: norm(w.w) }));
const proj = path.basename(path.dirname(P.words)), T = path.join(".tmp", proj);
const tok = (p) => p.split(/\s+/).map(norm).filter(Boolean);
/** كل مواضع عبارة بين زمنين لبداية أول كلمة */
const finds = (q, lo, hi) => { const out = []; for (let i = 0; i < W.length; i++) { if (W[i].s < lo) continue; if (W[i].s > hi) break; if (q.every((x, j) => W[i + j]?.n === x)) out.push(i); } return out; };
const warn = [];
const edge = (r, id, which) => {
  const q = tok(r[which]), [wb, wa] = r[which === "start" ? "sw" : "ew"] ?? (which === "start" ? [3, 10] : [10, 4]), at = which === "start" ? r.a : r.b;
  let hit = finds(q, at - wb, at + wa), qq = q;
  if (!hit.length && q.length > 2) { qq = which === "start" ? q.slice(0, 2) : q.slice(-2); hit = finds(qq, at - wb - 2, at + wa + 2); if (hit.length) warn.push(`${id}: «${r[which]}» غير مطابقة كلها فاعتمدتُ كلمتين منها`); }
  if (!hit.length) throw new Error(`${id}: لم أجد «${r[which]}» قرب ${at} ث`);
  const mode = which === "end" ? (r.endMode ?? "last") : "first";
  const i = mode === "last" ? hit[hit.length - 1] : hit[0];
  if (which === "start") { const f = Math.min(W[i].s - 0.04, Math.max(W[i].s - 0.15, (W[i - 1]?.e ?? 0) + 0.03)); return +Math.max(0, f).toFixed(2); }
  const j = i + qq.length - 1, t = Math.max(W[j].e + 0.04, Math.min(W[j].e + 0.3, (W[j + 1]?.s ?? 1e9) - 0.03));
  return +t.toFixed(2);
};
const table = P.clips.map((c) => {
  const ranges = c.ranges.map((r) => ({ from: edge(r, c.id, "start"), to: edge(r, c.id, "end") }));
  if (ranges.some((r) => !(r.to > r.from))) throw new Error(`${c.id}: حدّان معكوسان ${JSON.stringify(ranges)}`);
  return { id: c.id, topic: c.topic, kind: c.kind ?? "main", from: c.from, ranges, dur: +ranges.reduce((s, r) => s + r.to - r.from, 0).toFixed(1) };
});
fs.mkdirSync(T, { recursive: true });
fs.writeFileSync(path.join(T, "clip_table.json"), JSON.stringify(table, null, 1));
warn.forEach((w) => console.log("⚠", w));
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
for (const c of table) console.log(c.id, mmss(c.dur), c.ranges.map((r) => `${r.from}-${r.to}`).join(" + "), "|", c.topic);
console.log(`المجموع ${table.length} مقطعاً، ${mmss(table.reduce((s, c) => s + c.dur, 0))}`);
if (rest.includes("--resolve")) process.exit(0);

const log = path.join(T, "clip_batch.log");
const say = (s) => { const l = `[${new Date().toTimeString().slice(0, 8)}] ${s}`; console.log(l); fs.appendFileSync(log, l + String.fromCharCode(10)); };
// الاقتطاع: كل مقطع شريحة من القص الواحد للبث (clip_slice.mjs)؛ لا تجهيز ولا قص لمقطع وحده (يرفضه stage.mjs)
// (user order 2026-11-16: whole job ≤ 2 h) clips are sliced N at a time (--jobs N, default 4): each slice is ffmpeg + a short audio gate, independent of the others
const failed = [], jobs = Math.max(1, Number(rest.includes("--jobs") ? rest[rest.indexOf("--jobs") + 1] : 4));
const { spawn } = await import("node:child_process");
const todo = table.filter((c) => !only || only.has(c.id));
const slice1 = (c) => new Promise((resolve) => {
  const t0 = Date.now(), ch = spawn(process.execPath, ["tools/stream/clip_slice.mjs", proj, c.id, c.ranges.map((x) => `${x.from}-${x.to}`).join(",")], { windowsHide: true });
  let out = "", err = ""; ch.stdout.on("data", (d) => (out += d)); ch.stderr.on("data", (d) => (err += d));
  ch.on("close", (code) => { const s = ((Date.now() - t0) / 1000).toFixed(0);
    if (code !== 0) { say(`✘ ${c.id} (${s}s): ${(err || out).slice(-300)}`); failed.push(c.id); } else say(`(${s}s) ` + out.trim().split(String.fromCharCode(10)).join(" | ").slice(0, 400));
    resolve(); });
});
{ let next = 0; await Promise.all(Array.from({ length: Math.min(jobs, todo.length) }, async () => { while (next < todo.length) await slice1(todo[next++]); })); }
say(failed.length ? `انتهى مع إخفاق: ${failed.join(" ")}` : "انتهى اقتطاع كل المقاطع");
process.exit(failed.length ? 1 : 0);
