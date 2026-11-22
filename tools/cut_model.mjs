// THE cut model (user 2026-11-16: «نموذج قص واحد يبني كل شيء على أزمنة الكلمات، فلا يختلف القص عن الفحص»).
// One source of truth  : .tmp/<p>/words_table.json (tools/words_table.py: large-v3 transcript + wav2vec2 word alignment, built once at prep).
// One rule             : data/cut_rules.json (maxGap, keepGap, padBefore, padAfter) — nowhere else.
// One plan             : public/<p>_map.json segments {a, b, n, type: speech | clip | sound}; the clip ranges live IN the plan (no hand-passed exemptions).
// One check            : verifyCut() below — used by stage cut, audio_gate and final_review. It measures the gap between consecutive kept words in the OUTPUT
//                        timeline (word times mapped through the plan), cuts inside a word, and whether a given file still matches the plan. Nothing else measures pauses.
//
//   node tools/cut_model.mjs plan   <p> [--rem a-b,…] [--keep a-b,…] [--keep-sound a-b,…] [--no-auto-keep]   → public/<p>_map.json + .tmp/<p>/cut_plan.json
//   node tools/cut_model.mjs verify <p> [--file <video|wav>] [--json]                                          → exit 1 + every violation (time, kind, value, limit, words, fix)
//
// Construction (so the cutter never produces a pause over the limit): a word is kept or removed whole (a removed range takes the words whose middle lies in it — a cut
// never falls inside a word). Between two kept neighbours a gap ≤ keepGap stays whole; a longer gap keeps (keepGap − padBefore) after the first word and padBefore before
// the next. Edges never cross into a neighbouring word (kept or removed). Edges sit on the 1/fps grid, outward, then clamped back off any neighbouring word.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

export const RULES = JSON.parse(fs.readFileSync(new URL("../data/cut_rules.json", import.meta.url), "utf8"));
const T = (p) => path.join(".tmp", p);
const read = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const ranges = (s) => String(s || "").split(",").filter(Boolean).map((r) => r.split("-").map(Number)).filter(([a, b]) => b > a);
const mmss = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, "0")}`;

/** the container duration of the project's source video. The cut can never reach past it, yet the 16 kHz wav of its audio (the VAD, the transcript and the aligned words
 *  are measured on it) can be 0.1–0.3 s LONGER: a recording that ends while he is still speaking (the last 5 s of a stream sample, or the live stream's own last sentence) then
 *  had a speech stretch / last word running past the end of the video and the plan failed «قطع داخل كلمة» on a word nobody could keep (found by the stream dress rehearsal 2026-11-22). */
const mediaDurCache = new Map();
export function mediaDur(p) {
  if (mediaDurCache.has(p)) return mediaDurCache.get(p);
  const f = read(path.join(T(p), "prep_config.json"), {}).source ?? path.join("public", `${p}_src.mp4`);
  let d = Infinity; try { if (fs.existsSync(f)) { const x = fileDur(f); if (x > 0) d = x; } } catch { /* unreadable: no clamp */ }
  mediaDurCache.set(p, d); return d;
}
/** words clamped to the media: a word that ends past it ends at it, one that starts at or past it is gone */
export const clampWords = (words, D) => (D === Infinity || !words.some((w) => w.e > D) ? words : words.filter((w) => w.s < D - 0.02).map((w) => (w.e > D ? { ...w, e: D } : w)));

/** the word table (source seconds). Falls back to words.json (not aligned) for projects made before the table existed — reported, never silent. */
export function loadTable(p) {
  const t = read(path.join(T(p), "words_table.json"), null);
  if (t?.words?.length) return { words: clampWords(t.words, mediaDur(p)), source: "words_table" };
  const w = read(path.join(T(p), "words.json"), []);
  return { words: w.map((x, i) => ({ i, w: x.w, s: x.s, e: x.e, p: x.p ?? null, aligned: false })), source: w.length ? "words.json (غير محاذى)" : "none" };
}

/** speech the VAD hears where the table has no word (a word Whisper missed): kept as pseudo-words so the plan never drops speech silently; listed for a listen */
export function untranscribed(p, words) {
  const D = mediaDur(p);
  let vad = []; try { vad = JSON.parse(fs.readFileSync(path.join(T(p), "vad.json"), "utf8")).speech ?? []; } catch { return []; }
  const out = [];
  for (const [s0, e0] of vad) {
    const inside = words.filter((w) => w.e > s0 && w.s < e0).sort((x, y) => x.s - y.s);
    let cur = s0;
    for (const w of [...inside, { s: e0, e: e0 }]) { if (w.s - cur > 0.35) out.push({ w: "[غير مفرَّغ]", s: +(cur + 0.05).toFixed(3), e: +Math.min(w.s - 0.05, D).toFixed(3), p: null, aligned: false, pseudo: true }); cur = Math.max(cur, w.e); }
  }
  return out.filter((x) => x.e - x.s > 0.25);
}

/** shown clips with their own voice: other speakers' turns inside the display windows (prep: sources.json × speakers.json), merged across < 4 s */
export function autoClips(p) {
  try {
    const wins = read(path.join(T(p), "sources.json"), {}).windows ?? [];
    const turns = (read(path.join(T(p), "speakers.json"), {}).turns ?? []).filter((t) => t.name !== "sheikh" && wins.some((w) => t.s >= w.a - 0.5 && t.e <= w.b + 0.5));
    return turns.map((t) => [Math.max(0, t.s - 0.15), t.e + 0.15]).sort((x, y) => x[0] - y[0]).reduce((o, g) => { const l = o[o.length - 1]; if (l && g[0] - l[1] < 4) l[1] = Math.max(l[1], g[1]); else o.push([...g]); return o; }, []);
  } catch { return []; }
}

/** build the plan from the table: returns segments [{a,b,n,type}] in source seconds */
export function buildPlan(words, { rem = [], keep = [], keepSound = [], duration = Infinity, rules = RULES } = {}) {
  const { keepGap, padBefore, padAfter, fps } = rules;
  const mid = (w) => (w.s + w.e) / 2, inR = (t, R) => R.some(([a, b]) => t >= a && t <= b);
  const W = [...words].sort((x, y) => x.s - y.s);
  const kept = W.map((w) => !inR(mid(w), rem) && !inR(mid(w), keepSound));
  const iv = [];
  let prev = -1;
  for (let i = 0; i < W.length; i++) {
    if (!kept[i]) continue;
    const w = W[i], before = i > 0 ? W[i - 1].e : 0;
    if (prev < 0 || i - prev > 1 || w.s - W[prev].e > keepGap) {   // a new stretch: close the previous one with its tail, open this one with its head
      if (prev >= 0) { const nx = W[prev + 1] ? W[prev + 1].s : Infinity; iv[iv.length - 1][1] = Math.min(W[prev].e + (keepGap - padBefore), nx - 0.01, duration); }
      iv.push([Math.max(w.s - padBefore, before + 0.01, 0), w.e]);
    } else iv[iv.length - 1][1] = w.e;
    prev = i;
  }
  if (prev >= 0) { const nx = W[prev + 1] ? W[prev + 1].s : Infinity; iv[iv.length - 1][1] = Math.min(W[prev].e + padAfter + 0.1, nx - 0.01, duration); }
  for (const [a, b] of keepSound) iv.push([a, Math.min(b, duration)]);
  iv.sort((x, y) => x[0] - y[0]);
  const merged = iv.reduce((o, g) => { const l = o[o.length - 1]; if (l && g[0] <= l[1] + 0.005) l[1] = Math.max(l[1], g[1]); else o.push([...g]); return o; }, []);
  // 1/fps grid, outward, then back off any word that is not inside the segment (never cut into a neighbour)
  const grid = merged.map(([a, b]) => {
    let A = Math.floor(a * fps) / fps, B = Math.ceil(b * fps) / fps;
    for (const w of W) { if (w.e > A && w.s < a && w.e <= a + 1e-6) A = Math.ceil(w.e * fps) / fps; if (w.s < B && w.e > b && w.s >= b - 1e-6) B = Math.floor(w.s * fps) / fps; }
    return [A, Math.min(B, duration)];
  }).filter(([a, b]) => b - a > 1 / fps);
  let n = 0;
  return grid.map(([a, b]) => {
    const type = keepSound.some(([x, y]) => a < y && b > x) ? "sound" : keep.some(([x, y]) => a < y && b > x) ? "clip" : "speech";
    const g = { a: +a.toFixed(4), b: +b.toFixed(4), n: +n.toFixed(4), type }; n += b - a; return g;
  });
}

const fileDur = (f) => Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], { encoding: "utf8" }).stdout.trim());

/** THE check. segments = the plan (source seconds, in play order); words = the table; bumper = {at (cut s), seconds, end} when the file carries one.
    Returns [{t (final video s), kind, value, limit, prev, next, src, fix}] — empty = the cut obeys the rule. */
export function verifyCut({ segments, words, file = null, bumper = null, rules = RULES }) {
  const { maxGap, padBefore, fileTolerance } = rules;
  const v = [];
  const shift = (t) => (bumper && !bumper.end && t >= (bumper.at ?? 0) - 1e-6 ? t + bumper.seconds : t);
  const out = [];   // kept words in play order with output times
  for (const g of segments) {
    for (const w of words) {
      const inside = w.s >= g.a - 0.005 && w.e <= g.b + 0.005, part = !inside && w.e > g.a + 0.02 && w.s < g.b - 0.02;
      if (inside) out.push({ w, g, s: g.n + (w.s - g.a), e: g.n + (w.e - g.a) });
      else if (part && g.type !== "sound") v.push({ t: shift(g.n + Math.max(0, w.s - g.a)), kind: "قطع داخل كلمة", value: +(Math.min(w.e, g.b) - Math.max(w.s, g.a)).toFixed(2), limit: 0, prev: w.w, next: "", src: `${w.s.toFixed(2)}–${w.e.toFixed(2)}`, fix: `حافة المقطع ${g.a.toFixed(2)}–${g.b.toFixed(2)} تقطع الكلمة: أعد الخطة (cut_model plan) ولا تقصّ بيدك داخل كلمة` });
    }
  }
  out.sort((x, y) => x.s - y.s);
  const exempt = (g) => g.type === "clip" || g.type === "sound";
  for (let i = 1; i < out.length; i++) {
    const A = out[i - 1], B = out[i], gap = B.s - A.e;
    if (gap > maxGap && !(exempt(A.g) && exempt(B.g)))
      v.push({ t: +shift(A.e).toFixed(2), kind: "سكتة", value: +gap.toFixed(2), limit: maxGap, prev: A.w.w, next: B.w.w, src: `${A.w.e.toFixed(2)}–${B.w.s.toFixed(2)}`, fix: A.g === B.g ? `السكتة داخل مقطع واحد: الخطة لم تُبنَ بالنموذج — أعد cut_model plan` : `بين مقطعين: أعد cut_model plan (لا ترقيع باليد)` });
  }
  const total = segments.reduce((s, g) => s + (g.b - g.a), 0);
  if (out.length && segments[0]?.type === "speech" && out[0].s > maxGap) v.push({ t: shift(0), kind: "سكتة في البداية", value: +out[0].s.toFixed(2), limit: maxGap, prev: "", next: out[0].w.w, src: `${segments[0].a.toFixed(2)}`, fix: "أعد cut_model plan" });
  if (file) {
    const want = total + (bumper ? bumper.seconds : 0), got = fileDur(file);
    if (!(Math.abs(got - want) <= fileTolerance)) v.push({ t: 0, kind: "الملف لا يطابق الخطة", value: +(got || 0).toFixed(2), limit: +want.toFixed(2), prev: "", next: "", src: path.basename(file), fix: "الملف بُني من قص آخر: أعد بناءه من الخطة الحالية (stage cut) أو أعد الرندر" });
  }
  return v.sort((x, y) => x.t - y.t);
}

/** the plan + table + bumper of a project, ready for verifyCut */
export function projectInputs(p) {
  const map = read(path.join("public", `${p}_map.json`), null);
  const { words: w0, source } = loadTable(p);
  const words = [...w0, ...untranscribed(p, w0)];
  const spec = read(path.join("data", "specs", `${p}.json`), {});
  const b = spec.bumper && typeof spec.bumper.at === "number" ? { at: spec.bumper.at, seconds: spec.bumper.seconds ?? 5, end: !!spec.bumper.end } : null;
  return { segments: map?.segments ?? null, words, source, bumper: b };
}

export const printViolations = (v) => v.map((x) => `✘ [${mmss(x.t)} في الفيديو] ${x.kind}: ${x.value}ث${x.kind === "الملف لا يطابق الخطة" ? ` (المتوقع ${x.limit}ث)` : x.limit ? ` (الحد ${x.limit}ث)` : ""}${x.prev && x.next ? ` بين «${x.prev}» و«${x.next}»` : x.prev ? ` في «${x.prev}»` : x.next ? ` قبل «${x.next}»` : ""} — المصدر ${x.src} — ${x.fix}`);

/** content id of a file (sha256 of its bytes): gate states are kept per file, never per project */
export const contentId = (f) => { const h = crypto.createHash("sha256"); const fd = fs.openSync(f, "r"), buf = Buffer.alloc(1 << 22); let n; while ((n = fs.readSync(fd, buf, 0, buf.length)) > 0) h.update(buf.subarray(0, n)); fs.closeSync(fd); return h.digest("hex"); };

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve("tools/cut_model.mjs")) {
  const [cmd, p, ...rest] = process.argv.slice(2);
  const opt = (k, d) => (rest.includes("--" + k) ? rest[rest.indexOf("--" + k) + 1] : d);
  if (!p || !["plan", "verify"].includes(cmd)) { console.error("usage: node tools/cut_model.mjs plan|verify <p> [options] (see header)"); process.exit(2); }
  if (cmd === "plan") {
    const { words, source } = loadTable(p);
    if (!words.length) { console.error(`✘ لا جدول كلمات لـ${p}: شغّل stage prep أولاً`); process.exit(2); }
    const cfg = read(path.join(T(p), "prep_config.json"), {});
    const duration = fileDur(path.join("public", `${p}_src.mp4`)) || Infinity;
    const keep = [...ranges(opt("keep", "")), ...(rest.includes("--no-auto-keep") ? [] : autoClips(p))];
    const extra = untranscribed(p, words);
    const segments = buildPlan([...words, ...extra], { rem: ranges(opt("rem", "")), keep, keepSound: ranges(opt("keep-sound", "")), duration });
    if (extra.length) console.log(`ℹ كلام يسمعه الكاشف بلا كلمات في الجدول (أُبقي، استمع إليه): ${extra.map((x) => `${x.s.toFixed(2)}–${x.e.toFixed(2)}`).join("، ")}`);
    const total = segments.reduce((s, g) => s + (g.b - g.a), 0);
    fs.writeFileSync(path.join("public", `${p}_map.json`), JSON.stringify({ segments, duration: +total.toFixed(3), model: "cut_model" }, null, 1));
    fs.writeFileSync(path.join(T(p), "cut_plan.json"), JSON.stringify({ at: new Date().toISOString(), rules: RULES, table: source, rem: ranges(opt("rem", "")), keep, keepSound: ranges(opt("keep-sound", "")), audioOnly: !!cfg.audioOnly }, null, 1));
    const v = verifyCut({ segments, words: [...words, ...extra] });
    console.log(`plan: ${segments.length} segments (${segments.filter((g) => g.type !== "speech").length} clip/sound) · ${total.toFixed(1)} s · table ${source} · ${v.length ? `✘ ${v.length} violation(s)` : "✔ no pause > " + RULES.maxGap + " s by construction"}`);
    for (const l of printViolations(v)) console.log(l);
    process.exit(v.length ? 1 : 0);
  }
  const inp = projectInputs(p);
  if (!inp.segments) { console.error(`✘ لا خطة قص (public/${p}_map.json)`); process.exit(2); }
  const file = opt("file", null);
  const v = verifyCut({ segments: inp.segments, words: inp.words, file, bumper: file && /_cut|_audio|\.wav$/i.test(file) ? null : inp.bumper });
  if (rest.includes("--json")) console.log(JSON.stringify({ table: inp.source, violations: v }));
  else { console.log(v.length ? printViolations(v).join("\n") : `✔ القص يطابق القاعدة (لا سكتة > ${RULES.maxGap}ث بين كلمتين${file ? "، والملف يطابق الخطة" : ""}) — الجدول: ${inp.source}`); }
  process.exit(v.length ? 1 : 0);
}
