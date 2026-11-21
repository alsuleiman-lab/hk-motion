// JOIN SEAM CHECK (ledger intro-reel-join-click, 2026-11-20: the gta6 intro reel, built «as is» from episode ranges, had an audible click at a join; the
// cause was a word's decaying tail left at the cut point, and the audio gate only ever said «مراجعة لم تُحسم [64.36-65.06]»). Nothing measured the joins
// of a reel on its audio: the reel tool's «حدّ داخل كلمة» check is skipped with --as-is, and for cut-model maps the energy scans of the audio gate are off.
// For every join (a place where two pieces that are not neighbours in the source meet) it checks, ON THE DELIVERED AUDIO at the join's time:
//   1) the join is not inside a word (the parent's word table, source seconds, 20 ms margin) nor in a word's decaying tail: the RMS of the 40 ms before the
//      join (and of the 40 ms after it) must not be clearly above the room's noise floor (10th percentile of 20 ms frames in ±3 s, + 15 dB, never below −55 dBFS);
//   2) no click at the join itself: in ±3 ms of it, neither a sample jump (largest first difference) nor a peak far above the ±20 ms around it.
//   node tools/join_seam_check.mjs <audio|video> --name <project> [--root <dir>] [--kinds reel,block,episode] [--bumper-at s --bumper-sec s]
//        the joins of a reel cut from an episode (data/specs/<p>.json fromEpisode + the episode's map + the reel's map) or of an episode's cut-model map
//   node tools/join_seam_check.mjs <audio|video> --joins 0.9,1.8 [--words <words.json in the file's seconds>]     raw join times (self-test, any file)
// Exit 1 on any finding; one Arabic line per bad join with its time (m:ss.cc in the file). Used by tools/reel_from_episode.mjs (snap before the slice,
// gate after it) and tools/final_review.mjs (reels). Self-test: tools/guard_selftest.mjs «seam.*».
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const SEAM = { win: 0.04, core: 0.003, ring: 0.02, floorWin: 3, frame: 0.02, floorPct: 0.10, overFloor: 15, minVoiced: -55, jumpRatio: 8, peakRatio: 6, minJump: 0.004, wordMargin: 0.02, tailGap: 0.15 };
export const mmss = (t) => { const s = Math.max(0, t); return `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, "0")}`; };
const dB = (r) => 20 * Math.log10(r + 1e-12);

/** mono PCM of a file (or of [t0, t0+dur]) as Float32Array at sr */
export function decode(file, { sr = 48000, t0 = null, dur = null } = {}) {
  const args = ["-v", "error", "-threads", "4", ...(t0 !== null ? ["-ss", Math.max(0, t0).toFixed(4)] : []), "-i", file, ...(dur !== null ? ["-t", dur.toFixed(4)] : []), "-vn", "-ac", "1", "-ar", String(sr), "-f", "s16le", "-"];
  const r = spawnSync("ffmpeg", args, { maxBuffer: 1 << 30, windowsHide: true });
  if (r.status !== 0) throw new Error(`ffmpeg: ${String(r.stderr).slice(-200)}`);
  const b = r.stdout, n = b.length >> 1, y = new Float32Array(n);
  for (let i = 0; i < n; i++) y[i] = b.readInt16LE(i * 2) / 32768;
  return y;
}
export const fileDuration = (f) => Number(String(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], { encoding: "utf8", windowsHide: true }).stdout).trim());

/** an audio view: {y, sr, t0} — sample of time t = y[(t - t0) * sr] */
const rmsOf = (A, a, b) => { const i0 = Math.max(0, Math.round((a - A.t0) * A.sr)), i1 = Math.min(A.y.length, Math.round((b - A.t0) * A.sr)); let e = 0; for (let i = i0; i < i1; i++) e += A.y[i] * A.y[i]; return i1 > i0 ? Math.sqrt(e / (i1 - i0)) : 0; };
/** the room floor and the voiced threshold around t (dBFS) */
export function floorAt(A, t, S = SEAM) {
  const fr = []; for (let a = t - S.floorWin; a < t + S.floorWin; a += S.frame) { if (a < A.t0 || a + S.frame > A.t0 + A.y.length / A.sr) continue; fr.push(Math.max(-100, dB(rmsOf(A, a, a + S.frame)))); }
  fr.sort((x, y) => x - y);
  const floor = fr.length ? fr[Math.floor(fr.length * S.floorPct)] : -100;
  return { floor, thr: Math.max(floor + S.overFloor, S.minVoiced) };
}
/** energy before / after the join and the click measures at t */
export function measureJoin(A, t, S = SEAM) {
  const { floor, thr } = floorAt(A, t, S);
  const before = dB(rmsOf(A, t - S.win, t)), after = dB(rmsOf(A, t, t + S.win));
  const c = Math.round((t - A.t0) * A.sr), k = Math.round(S.core * A.sr), R = Math.round(S.ring * A.sr), y = A.y;
  let jMax = 0, pMax = 0, dE = 0, yE = 0, n = 0;
  for (let i = Math.max(1, c - R); i < Math.min(y.length, c + R); i++) {
    const d = Math.abs(y[i] - y[i - 1]);
    if (Math.abs(i - c) <= k) { jMax = Math.max(jMax, d); pMax = Math.max(pMax, Math.abs(y[i])); } else { dE += d * d; yE += y[i] * y[i]; n++; }
  }
  const dR = n ? Math.sqrt(dE / n) : 0, yR = n ? Math.sqrt(yE / n) : 0;
  const jump = dR > 0 ? jMax / dR : jMax > 0 ? Infinity : 0, peak = yR > 0 ? pMax / yR : pMax > 0 ? Infinity : 0;
  return { floor, thr, before, after, jump, peak, jMax, pMax };
}

const inWord = (words, t, S = SEAM) => (t === null || t === undefined || !words?.length ? null : words.find((w) => w.s + S.wordMargin < t && w.e - S.wordMargin > t) ?? null);
const EXEMPT = new Set(["clip", "sound"]);   // a shown clip or a kept sound: its audio is not speech (music, another video), the cut model exempts it too — only the click test
/** sound right after the join is the next kept word's onset (fine: word tables start late) unless the source word before the in-edge ended just before it
    (the tail of a deleted word, the gta6 case) or no word starts soon after it (an unknown sound) */
const afterIsTail = (words, t, S = SEAM) => { if (!words?.length || t === null || t === undefined) return true; const pv = words.filter((w) => w.e <= t + S.wordMargin).pop(), nx = words.find((w) => w.s >= t - S.wordMargin); return (pv && t - pv.e < S.tailGap) || !nx || nx.s - t > S.tailGap; };
/** findings for one join: [] = clean. j = {t (file s), kind, outSrc, inSrc (word-table seconds)} */
export function judgeJoin(A, j, words, S = SEAM) {
  const m = measureJoin(A, j.t, S), out = [], soft = [];   // soft: the energy findings at the EPISODE's own joins (its gates judged them; reported, not failed)
  const E = j.kind === "episode" || j.kind === "cut" ? soft : out;
  const wo = inWord(words, j.outSrc, S), wi = j.inSrc !== j.outSrc ? inWord(words, j.inSrc, S) : null;
  if (wo) out.push(`الطرف الخارج داخل كلمة «${wo.w}»`);
  if (wi) out.push(`الطرف الداخل داخل كلمة «${wi.w}»`);
  if (m.before > m.thr && !EXEMPT.has(j.outType)) E.push(`ذيل كلمة قبل الوصلة (آخر ${Math.round(S.win * 1000)} م.ث ${m.before.toFixed(0)} dB والأرضية ${m.floor.toFixed(0)} dB)`);
  if (m.after > m.thr && !EXEMPT.has(j.inType) && afterIsTail(words, j.inSrc, S)) E.push(`صوت كلمة بعد الوصلة مباشرة (أول ${Math.round(S.win * 1000)} م.ث ${m.after.toFixed(0)} dB والأرضية ${m.floor.toFixed(0)} dB)`);
  if ((m.jump > S.jumpRatio && m.jMax > S.minJump) || (m.peak > S.peakRatio && dB(m.pMax) > m.floor + 20)) out.push(`نقرة عند الوصلة (قفزة ×${Number.isFinite(m.jump) ? m.jump.toFixed(1) : "∞"}، قمة ×${Number.isFinite(m.peak) ? m.peak.toFixed(1) : "∞"} فوق ما حولها)`);
  return { ...j, m, issues: out, notes: soft };
}
/** check joins on a file; joins = [{t, kind?, outSrc?, inSrc?}] in the file's seconds */
export function checkFile(file, joins, words = null, S = SEAM) {
  const D = fileDuration(file);
  if (!(D > 0)) throw new Error(`الملف لا يُقرأ: ${file}`);   // fail closed: no file is no pass
  const inside = joins.filter((j) => j.t > S.win && j.t < D - S.win);
  if (!inside.length) return [];
  if (D <= 900) { const A = { y: decode(file), sr: 48000, t0: 0 }; return inside.map((j) => judgeJoin(A, j, words, S)); }
  return inside.map((j) => { const t0 = Math.max(0, j.t - S.floorWin - 0.1), A = { y: decode(file, { t0, dur: 2 * S.floorWin + 0.2 }), sr: 48000, t0 }; return judgeJoin(A, j, words, S); });
}

/** the lag of a rendered file against the timeline's own cut audio (a render can start its audio a frame late: measured 20–25 ms on a real reel, which
    puts the speech of the 40 ms before a join into the window). Envelope cross-correlation at 1 ms over `dur` s from timeline `from`; returns
    {offset (file s − timeline s), corr} — corr < 0.5 = not found (offset = shift) */
export function alignOffset(file, ref, { from = 5, dur = 40, shift = 0, maxLag = 0.25 } = {}) {
  const sr = 8000, bin = 8, D = Math.min(fileDuration(ref) - from - 0.5, dur);
  if (!(D >= 5)) return { offset: shift, corr: 0 };
  const r = decode(ref, { sr, t0: from, dur: D }), f = decode(file, { sr, t0: from + shift - maxLag, dur: D + 2 * maxLag });
  const env = (y) => { const n = Math.floor(y.length / bin), e = new Float64Array(n); for (let i = 0; i < n; i++) { let q = 0; for (let k = 0; k < bin; k++) q += Math.abs(y[i * bin + k]); e[i] = q / bin; } return e; };
  const er = env(r), ef = env(f), n = er.length, mr = er.reduce((a, b) => a + b, 0) / n; for (let i = 0; i < n; i++) er[i] -= mr;
  const nr = Math.sqrt(er.reduce((a, b) => a + b * b, 0)); let best = { L: Math.round(maxLag * 1000), c: -1 };
  for (let L = 0; L + n <= ef.length; L++) { let xy = 0, sf = 0, sf2 = 0; for (let i = 0; i < n; i++) { const v = ef[i + L]; xy += er[i] * v; sf += v; sf2 += v * v; } const c = xy / (nr * Math.sqrt(Math.max(1e-18, sf2 - (sf * sf) / n))); if (c > best.c) best = { L, c }; }
  return best.c >= 0.5 ? { offset: +(shift + best.L / 1000 - maxLag).toFixed(4), corr: +best.c.toFixed(3) } : { offset: shift, corr: +best.c.toFixed(3) };
}

/* ── the joins of a project ── */
const rd = (f, d = null) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
/** the word table of a project in SOURCE seconds ({w,s,e}) */
export function sourceWords(p, root = process.cwd()) {
  const T = path.join(root, ".tmp", p), wt = rd(path.join(T, "words_table.json")), sp = rd(path.join(T, "speakers.json")), v = rd(path.join(T, "words_vad.json")) ?? rd(path.join(T, "words.json"));
  const raw = wt?.words?.length ? wt.words : sp?.words?.length ? sp.words : (v?.words ?? v);
  return Array.isArray(raw) ? raw.map((w) => ({ w: w.w ?? w.word, s: +(w.s ?? w.start), e: +(w.e ?? w.end) })).filter((w) => Number.isFinite(w.s) && Number.isFinite(w.e)).sort((a, b) => a.s - b.s) : [];
}
/** joins of an episode's cut-model map: every place two segments that are not neighbours in the source meet (cut time; src edges for the word check) */
export function mapJoins(segs) {
  const J = []; for (let i = 1; i < segs.length; i++) { const a = segs[i - 1], b = segs[i]; if (b.a - a.b > 0.02) J.push({ t: +b.n.toFixed(4), kind: "cut", outSrc: a.b, inSrc: b.a, outType: a.type ?? "speech", inType: b.type ?? "speech" }); }
  return J;
}
/** the pieces clip_slice cuts for a reel (cut time of the episode, merged when touching, each a whole number of frames) with their parent sub-parts */
export function reelPieces(ranges, parentSegs, fps = 30) {
  const pieces = [];
  for (const [ri, r] of ranges.entries()) for (const g of parentSegs) {
    const lo = Math.max(g.a, r.from), hi = Math.min(g.b, r.to); if (hi - lo <= 0.02) continue;
    const cs = g.n + (lo - g.a), ce = g.n + (hi - g.a), sub = { cs, ce, sa: lo, sb: hi, type: g.type ?? "speech" }, l = pieces[pieces.length - 1];
    if (l && Math.abs(cs - l.ce) < 0.02) { l.ce = ce; l.sub.push(sub); l.r1 = ri; } else pieces.push({ cs, ce, sub: [sub], r0: ri, r1: ri });
  }
  for (const p of pieces) { const ce = p.cs + Math.max(1, Math.round((p.ce - p.cs) * fps)) / fps, last = p.sub[p.sub.length - 1]; last.sb += ce - p.ce; last.ce = ce; p.ce = ce; }
  let acc = 0; for (const p of pieces) { p.off = acc; acc += p.ce - p.cs; }
  return pieces;
}
/** joins of a reel cut from an episode, on the reel's CURRENT timeline (its map: cut_blocks after the build move or remove joins and add their own) */
export function reelJoins(id, root = process.cwd()) {
  const spec = rd(path.join(root, "data", "specs", `${id}.json`)), fe = spec?.fromEpisode;
  if (!fe?.project || !fe?.ranges?.length) return null;
  const pm = rd(path.join(root, "public", `${fe.project}_map.json`));
  if (!pm?.segments?.length) return { why: `لا خريطة قص للحلقة ${fe.project}` };
  const pieces = reelPieces(fe.ranges, pm.segments), J = [];
  const sliceToSrc = (t) => { for (const p of pieces) for (const s of p.sub) { const a = p.off + (s.cs - p.cs), b = a + (s.ce - s.cs); if (t >= a - 1e-4 && t <= b + 1e-4) return s.sa + (t - a); } return null; };
  pieces.forEach((p, k) => {
    if (k > 0) { const q = pieces[k - 1]; J.push({ s: p.off, kind: "reel", outSrc: q.sub[q.sub.length - 1].sb, inSrc: p.sub[0].sa, outType: q.sub[q.sub.length - 1].type, inType: p.sub[0].type }); }
    for (let i = 1; i < p.sub.length; i++) if (p.sub[i].sa - p.sub[i - 1].sb > 0.02) J.push({ s: p.off + (p.sub[i].cs - p.cs), kind: "episode", outSrc: p.sub[i - 1].sb, inSrc: p.sub[i].sa, outType: p.sub[i - 1].type, inType: p.sub[i].type });
  });
  const rm = rd(path.join(root, "public", `${id}_map.json`)), rs = rm?.segments ?? [];
  const toNow = (t) => { if (!rs.length) return t; const g = rs.find((x) => t >= x.a - 1e-3 && t < x.b - 1e-3) ?? rs.find((x) => Math.abs(t - x.b) < 1e-3); return g ? g.n + (t - g.a) : null; };
  const out = J.map((j) => ({ ...j, t: toNow(j.s) })).filter((j) => j.t !== null);
  for (let i = 1; i < rs.length; i++) if (rs[i].a - rs[i - 1].b > 0.02) out.push({ s: rs[i].a, t: rs[i].n, kind: "block", outSrc: sliceToSrc(rs[i - 1].b), inSrc: sliceToSrc(rs[i].a), outType: rs[i - 1].type ?? "speech", inType: rs[i].type ?? "speech" });
  out.sort((a, b) => a.t - b.t);
  return { joins: out.map(({ s, ...j }) => ({ ...j, t: +j.t.toFixed(4) })), words: sourceWords(fe.project, root), parent: fe.project };
}
/** joins of any project: a reel from an episode, else the project's own cut-model map */
export function projectJoins(p, root = process.cwd()) {
  const r = reelJoins(p, root); if (r) return r;
  const m = rd(path.join(root, "public", `${p}_map.json`));
  if (m?.model !== "cut_model" || !m.segments?.length) return { why: `لا خريطة قص بالنموذج لـ${p}` };
  return { joins: mapJoins(m.segments), words: sourceWords(p, root), parent: p };
}
const KIND_AR = { reel: "وصلة الريل", block: "وصلة حذف في الريل", episode: "وصلة من قص الحلقة", cut: "وصلة القص" };
export const describe = (r, notes = false) => `${KIND_AR[r.kind] ?? "وصلة"} عند ${mmss(r.t)} (${r.t.toFixed(2)}ث): ${(notes ? r.notes : r.issues).join("؛ ")}`;
/** shift timeline seconds to the file's seconds when an opening bumper is in it */
export const withBumper = (joins, bumper) => (!bumper || bumper.position === "end" || !Number.isFinite(+bumper.seconds) ? joins : joins.map((j) => ({ ...j, t: j.t >= (+bumper.at || 0) - 1e-3 ? j.t + +bumper.seconds : j.t })));

/** the joins on the FILE's clock: an opening bumper shifts what follows it, and the render's own lag is measured against the spec's cut file when it exists */
export function fileJoins(p, file, joins, bumper = null, root = process.cwd()) {
  const spec = rd(path.join(root, "data", "specs", `${p}.json`)), ref = spec?.cut ? path.join(root, "public", spec.cut) : null, J = withBumper(joins, bumper);
  if (!ref || !fs.existsSync(ref) || path.resolve(ref) === path.resolve(file)) return { joins: J, offset: 0, corr: null };
  const start = bumper && bumper.position !== "end" && Number.isFinite(+bumper.seconds), at = start ? +bumper.at || 0 : 0;
  const a = alignOffset(file, ref, start ? { from: at + 3, shift: +bumper.seconds } : {}), extra = a.offset - (start ? +bumper.seconds : 0);
  return { joins: J.map((j) => ({ ...j, t: +(j.t + extra).toFixed(4) })), offset: extra, corr: a.corr };
}
/** final_review: null when the file is not a reel cut from an episode; else {ok, msg} */
export function finalReviewLine(p, file, bumper = null, root = process.cwd()) {
  const r = reelJoins(p, root); if (!r) return null;
  if (r.why) return { ok: false, msg: `وصلات الريل: ${r.why}` };
  let res; try { res = checkFile(file, fileJoins(p, file, r.joins, bumper, root).joins, r.words); } catch (e) { return { ok: false, msg: `وصلات الريل لم تُفحص: ${String(e?.message ?? e).slice(0, 160)}` }; }
  const bad = res.filter((x) => x.issues.length), noW = r.words.length ? "" : " (بلا جدول كلمات الحلقة: فحص «داخل كلمة» لم يجرِ، والطاقة والنقرة جرتا)";
  return { ok: !bad.length, msg: bad.length ? `وصلات الريل: ${bad.length} من ${res.length} فيها نقرة أو ذيل كلمة${noW}:\n${bad.map((x) => "   " + describe(x)).join("\n")}` : `وصلات الريل (${res.length}): لا نقرة ولا ذيل كلمة ولا قطع داخل كلمة${noW}` };
}

/* ── snap (tools/reel_from_episode.mjs, before the slice): move a reel join that is not quiet to the nearest quiet point of its word gap ── */
/** viewAt(t) = an audio view of the episode's cut audio around t (or one view for all); S0/E0 = piece start/end (cut time); words = [{w, cs, ce}] in cut time.
    Returns {S, E, notes, fail}: E is on the frame grid from S, as clip_slice keeps it */
export function snapPiece(viewAt, S0, E0, words, { snapStart = true, snapEnd = true, fps = 30 } = {}, S = SEAM) {
  const V = typeof viewAt === "function" ? viewAt : () => viewAt;
  const notes = [], quietIn = (t) => { const A = V(t), { thr } = floorAt(A, t, S); return dB(rmsOf(A, t, t + S.win)) <= thr; }, quietOut = (t) => { const A = V(t), { thr } = floorAt(A, t, S); return dB(rmsOf(A, t - S.win, t)) <= thr; };
  const straddle = (t) => words.find((w) => w.cs + S.wordMargin < t && w.ce - S.wordMargin > t);
  const within = words.filter((w) => (w.cs + w.ce) / 2 >= S0 && (w.cs + w.ce) / 2 <= E0), first = within[0], last = within[within.length - 1];
  const before = words.filter((w) => w.ce <= (first?.cs ?? S0)).pop(), after = words.find((w) => w.cs >= (last?.ce ?? E0));
  let Sn = S0, fail = null, failStart = false, failEnd = false;
  if (snapStart && (!quietIn(S0) || straddle(S0))) {
    const lo = Math.max(S0 - 0.15, before ? before.ce : -Infinity), hi = Math.min(S0 + 0.08, first ? first.cs : Infinity), c = [];
    for (let t = lo; t <= hi + 1e-9; t += 0.005) if (quietIn(t) && !straddle(t)) c.push(t);
    if (c.length) { Sn = c.sort((a, b) => Math.abs(a - S0) - Math.abs(b - S0))[0]; notes.push(`بداية الجزء ${mmss(S0)} ← ${mmss(Sn)} (كانت على صوت كلمة)`); }
    else { failStart = true; fail = `بداية الجزء عند ${mmss(S0)} على صوت كلمة، ولا فراغ هادئ بين «${before?.w ?? "—"}» و«${first?.w ?? "—"}»`; }
  }
  const m0 = Math.max(1, Math.round((E0 - S0) * fps)), En0 = Sn + m0 / fps;   // clip_slice keeps a whole number of frames from the piece start
  let En = En0;
  if (snapEnd && (!quietOut(En0) || straddle(En0))) {
    const c = [];
    for (let m = m0 - 6; m <= m0 + 9; m++) { const t = Sn + m / fps; if (m < 1 || (last && t < last.ce) || (after && t > after.cs)) continue; if (quietOut(t) && !straddle(t)) c.push(t); }
    if (c.length) { En = c.sort((a, b) => Math.abs(a - En0) - Math.abs(b - En0))[0]; notes.push(`نهاية الجزء ${mmss(En0)} ← ${mmss(En)} (كانت في ذيل «${last?.w ?? "—"}»)`); }
    else { failEnd = true; fail = (fail ? fail + "؛ " : "") + `نهاية الجزء عند ${mmss(En0)} في ذيل كلمة، ولا فراغ هادئ بين «${last?.w ?? "—"}» و«${after?.w ?? "—"}»`; }
  }
  return { S: Sn, E: En, notes, fail, failStart, failEnd };
}

/** tools/reel_from_episode.mjs before the slice: ranges [{from, to}] (source s) of the episode → the same ranges with every reel join moved into a quiet
    point of its word gap. words = the episode's word table (source s); audio = the episode's cut file (what clip_slice slices). Returns {ranges, notes, fails} */
export function snapReelRanges({ ranges, parentSegs, words, audio, fps = 30, view = null }, S = SEAM) {
  const segEnd = (g) => g.n + (g.b - g.a);
  const srcToCut = (t) => { for (const g of parentSegs) if (t >= g.a - 1e-6 && t <= g.b + 1e-6) return g.n + (t - g.a); return null; };
  const cutToSrc = (t) => { for (const g of parentSegs) if (t >= g.n - 1e-6 && t <= segEnd(g) + 1e-6) return g.a + (t - g.n); return null; };
  const cw = words.map((w) => { const m = srcToCut((w.s + w.e) / 2); return m === null ? null : { w: w.w, cs: m - (w.e - w.s) / 2, ce: m + (w.e - w.s) / 2 }; }).filter(Boolean).sort((a, b) => a.cs - b.cs);
  const out = ranges.map((r) => ({ ...r })), pieces = reelPieces(out, parentSegs, fps), V = view ?? viewMaker(audio, S), notes = [], fails = [], bad = [];
  pieces.forEach((p, k) => {
    if (pieces.length < 2) return;
    const raw0 = p.sub[0].cs, rawE = p.cs + (p.sub[p.sub.length - 1].ce - p.cs);   // reelPieces already holds the frame-rounded end
    const r = snapPiece(V, raw0, rawE, cw, { snapStart: k > 0, snapEnd: k < pieces.length - 1, fps }, S);
    const lab = `الجزء ${p.r0 + 1}${p.r1 !== p.r0 ? `–${p.r1 + 1}` : ""}`;
    if (r.fail) { fails.push(`${lab}: ${r.fail}`); if (r.failStart) bad.push({ part: p.r0, edge: "from" }); if (r.failEnd) bad.push({ part: p.r1, edge: "to" }); return; }
    if (Math.abs(r.S - raw0) > 1e-4) { const a = cutToSrc(r.S); if (a !== null) out[p.r0].from = +a.toFixed(4); }
    if (Math.abs(r.E - rawE) > 1e-4) { const b = cutToSrc(r.E); if (b !== null) out[p.r1].to = +b.toFixed(4); }
    for (const n of r.notes) notes.push(`${lab}: ${n}`);
  });
  return { ranges: out, notes, fails, bad };
}

/** THE REEL SUGGESTER'S OWN OUTPUT IS BUILDABLE (rehearsal 2026-11-21, ledger reel-suggest-unbuildable: the story of reel_from_episode --story-only started a
    part between «طفل» and «عمره», two words with no quiet point between them, and its own build refused it). Before the story is written every reel join is
    judged by THE SAME RULE the build applies (snapReelRanges above: a quiet point of the cut audio, not inside a word); a boundary that fails moves to the
    nearest word gap that has such a point — the gaps that leave the fewest context findings first (ctx(ranges) = how many findings; a sentence boundary
    scores 0), then the nearest, within `reach` seconds and never into another part's words or under `minDur` — and a part with no such gap is dropped.
    words = the episode's words in SOURCE seconds [{w,s,e}]; ranges = [{from, to}] source seconds in story order.
    Returns {ranges, kept (input index of each), notes, dropped (input indexes), fails (left unresolved: [] unless maxIter ran out)} */
export function seamSafeRanges({ ranges, parentSegs, words, audio = null, view = null, fps = 30, reach = 6, minDur = 3, ctx = null, maxIter = null }, S = SEAM) {
  const segEnd = (g) => g.n + (g.b - g.a);
  const srcToCut = (t) => { for (const g of parentSegs) if (t >= g.a - 1e-6 && t <= g.b + 1e-6) return g.n + (t - g.a); return null; };
  const cutToSrc = (t) => { for (const g of parentSegs) if (t >= g.n - 1e-6 && t <= segEnd(g) + 1e-6) return g.a + (t - g.n); return null; };
  const cw = words.map((w) => { const mid = (w.s + w.e) / 2, m = srcToCut(mid); return m === null ? null : { w: w.w, mid, cs: m - (w.e - w.s) / 2, ce: m + (w.e - w.s) / 2 }; }).filter(Boolean).sort((a, b) => a.cs - b.cs);
  const V = view ?? viewMaker(audio, S);
  const quietIn = (t) => { const A = V(t); return dB(rmsOf(A, t, t + S.win)) <= floorAt(A, t, S).thr; }, quietOut = (t) => { const A = V(t); return dB(rmsOf(A, t - S.win, t)) <= floorAt(A, t, S).thr; };
  const straddle = (t) => cw.some((w) => w.cs + S.wordMargin < t && w.ce - S.wordMargin > t);   // snapPiece's «inside a word»
  const strip = ({ _i, _tried, ...r }) => r, inR = (r) => cw.filter((w) => w.mid >= r.from && w.mid <= r.to);
  let cur = ranges.map((r, i) => ({ ...r, _i: i, _tried: new Set() }));
  const notes = [], dropped = [], lim = maxIter ?? 4 * ranges.length + 4;
  const done = (fails = []) => ({ ranges: cur.map(strip), kept: cur.map((r) => r._i), notes, dropped, fails });
  for (let it = 0; it < lim; it++) {
    const sn = snapReelRanges({ ranges: cur.map((r) => ({ from: r.from, to: r.to })), parentSegs, words, audio, fps, view: V }, S);
    if (!sn.fails.length) return done();
    const b = sn.bad[0]; if (!b) return done(sn.fails);
    const r = cur[b.part], ws = inR(r), lab = `الجزء ${r._i + 1}`;
    const drop = (why) => { dropped.push(r._i); cur.splice(b.part, 1); notes.push(`${lab} حُذف من القصة: ${why}`); };
    if (!ws.length) { drop("بلا كلام في قص الحلقة"); continue; }
    const first = ws[0], last = ws[ws.length - 1], k0 = cw.indexOf(first), k1 = cw.indexOf(last), others = new Set(cur.filter((x) => x !== r).flatMap(inR));
    const cands = [];
    for (let j = 0; j < cw.length; j++) {
      if (b.edge === "from") {
        if (j > k1 || Math.abs(cw[j].cs - first.cs) > reach || last.ce - cw[j].cs < minDur || (j < k0 && cw.slice(j, k0).some((w) => others.has(w)))) continue;
        const lo = j > 0 ? cw[j - 1].ce : Math.max(0, cw[j].cs - 0.3), hi = cw[j].cs; if (!(hi > lo)) continue;
        cands.push({ j, lo, hi, target: Math.max((lo + hi) / 2, hi - 0.12), dist: Math.abs(cw[j].cs - first.cs), prev: cw[j - 1]?.w, next: cw[j].w });
      } else {
        if (j < k0 || Math.abs(cw[j].ce - last.ce) > reach || cw[j].ce - first.cs < minDur || (j > k1 && cw.slice(k1 + 1, j + 1).some((w) => others.has(w)))) continue;
        const lo = cw[j].ce, hi = j + 1 < cw.length ? cw[j + 1].cs : cw[j].ce + 0.3; if (!(hi > lo)) continue;
        cands.push({ j, lo, hi, target: Math.min((lo + hi) / 2, lo + 0.26), dist: Math.abs(cw[j].ce - last.ce), prev: cw[j].w, next: cw[j + 1]?.w });
      }
    }
    for (const c of cands) { c.key = `${b.edge}:${c.j}`; c.src = cutToSrc((c.lo + c.hi) / 2); c.n = ctx && c.src !== null ? ctx(cur.map((x, i) => (i === b.part ? { ...strip(x), [b.edge]: c.src } : strip(x)))) : 0; }
    const order = cands.filter((c) => c.src !== null && !r._tried.has(c.key)).sort((x, y) => x.n - y.n || x.dist - y.dist);
    let moved = null;
    for (const c of order) {
      r._tried.add(c.key);
      const pts = []; for (let t = c.lo; t <= c.hi + 1e-9; t += 0.005) if ((b.edge === "from" ? quietIn(t) : quietOut(t)) && !straddle(t)) pts.push(t);
      if (!pts.length) continue;
      const t = pts.sort((x, y) => Math.abs(x - c.target) - Math.abs(y - c.target))[0], src = cutToSrc(t);
      if (src !== null) { moved = { t, src, c }; break; }
    }
    if (!moved) { drop(`لا فراغ هادئ بين كلمتين قرب ${b.edge === "from" ? "بدايته" : "نهايته"} (±${reach}ث)`); continue; }
    const old = srcToCut(r[b.edge]);
    r[b.edge] = +moved.src.toFixed(4);
    notes.push(`${lab}: ${b.edge === "from" ? "بدايته" : "نهايته"} ${mmss(old ?? 0)} ← ${mmss(moved.t)} بين «${moved.c.prev ?? "—"}» و«${moved.c.next ?? "—"}» (الحدّ القديم بلا فراغ هادئ؛ أقرب فراغ بين كلمتين${moved.c.n ? "، بملاحظة سياق" : ""})`);
  }
  const last = snapReelRanges({ ranges: cur.map((r) => ({ from: r.from, to: r.to })), parentSegs, words, audio, fps, view: V }, S);
  return done(last.fails);
}
/** a cached view maker for a long file: one decoded window of ±(floorWin + 0.5) s per region */
export function viewMaker(file, S = SEAM) {
  const cache = []; const half = S.floorWin + 0.5;
  return (t) => { const hit = cache.find((A) => Math.max(0, t - S.floorWin - 0.3) >= A.t0 && t + S.floorWin + 0.3 <= A.t1); if (hit) return hit; const t0 = Math.max(0, t - half - 0.5), A = { y: decode(file, { t0, dur: 2 * half + 1 }), sr: 48000, t0, t1: t0 + 2 * half + 1 }; cache.push(A); return A; };
}

/* ── CLI ── */
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2), opt = (k) => (argv.includes(`--${k}`) ? argv[argv.indexOf(`--${k}`) + 1] : null);
  const file = argv[0];
  if (!file || file.startsWith("--") || !fs.existsSync(file)) { console.error("usage: node tools/join_seam_check.mjs <audio|video> --name <project> [--root dir] [--kinds reel,block,episode] | --joins t1,t2 [--words f.json]"); process.exit(2); }
  let joins, words = null, label;
  if (opt("joins")) {
    joins = opt("joins").split(",").map(Number).filter(Number.isFinite).map((t) => ({ t, kind: "raw", outSrc: t, inSrc: t }));
    if (opt("words")) { const w = rd(opt("words")); words = (w?.words ?? w ?? []).map((x) => ({ w: x.w, s: +x.s, e: +x.e })); }
    label = `${joins.length} وصلة`;
  } else if (opt("name")) {
    const r = projectJoins(opt("name"), path.resolve(opt("root") ?? "."));
    if (r.why) { console.log(`✘ ${r.why}`); process.exit(1); }
    const kinds = opt("kinds") ? opt("kinds").split(",") : null;
    const fj = fileJoins(opt("name"), file, r.joins.filter((j) => !kinds || kinds.includes(j.kind)), opt("bumper-at") !== null ? { at: +opt("bumper-at"), seconds: +opt("bumper-sec"), position: "start" } : null, path.resolve(opt("root") ?? "."));
    joins = fj.joins; if (fj.corr !== null) console.log(`ℹ تأخر صوت الملف عن خط الزمن ${Math.round(fj.offset * 1000)} م.ث (الترابط ${fj.corr})`);
    words = r.words; label = `${opt("name")}: ${joins.length} وصلة (${Object.entries(joins.reduce((o, j) => ((o[j.kind] = (o[j.kind] ?? 0) + 1), o), {})).map(([k, n]) => `${KIND_AR[k]} ${n}`).join("، ")})`;
  } else { console.error("✘ --name <project> أو --joins t1,t2"); process.exit(2); }
  const res = checkFile(file, joins, words), bad = res.filter((x) => x.issues.length);
  if (argv.includes("--json")) console.log(JSON.stringify(res.map(({ m, ...x }) => ({ ...x, before: +m.before.toFixed(1), after: +m.after.toFixed(1), floor: +m.floor.toFixed(1), jump: +m.jump.toFixed(1), peak: +m.peak.toFixed(1) }))));
  for (const x of bad) console.log("✘ " + describe(x));
  for (const x of res.filter((y) => y.notes?.length)) console.log("ℹ " + describe(x, true) + " — قصّ الحلقة نفسه حكمت عليه بواباته: ملاحظة لا فشل");
  console.log(`${bad.length ? "✘" : "✔"} وصلات ${label}: ${bad.length ? `${bad.length} فيها نقرة أو ذيل كلمة أو قطع داخل كلمة` : "لا نقرة ولا ذيل كلمة ولا قطع داخل كلمة"}`);
  process.exit(bad.length ? 1 : 0);
}
