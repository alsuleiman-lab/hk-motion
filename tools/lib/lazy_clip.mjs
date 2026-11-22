// A STREAM CLIP AS A RANGE LIST OVER THE ORIGINAL (user 2026-11-22: «القص مرة واحدة… بلا ترميز قبل الرندر الأخير»; the cut is ONE mechanism for every kind, only the operations differ).
//
// The clip project's cut is the stream's cut list (public/<stream>_map.json: segments {a,b,n}, a/b = seconds of the ORIGINAL, n = the cut timeline) restricted to the clip's source ranges,
// with n re-based to the clip's own timeline: public/<clip>_map.json = {segments:[{a,b,n,type}], duration, model:"cut_model"}. The picture is never copied or encoded:
// the render reads the original through that list (tools/cut_lazy.mjs edlSetup → tools/gpu/edl_stream.py); the sound is the lossless cut audio sliced for the clip (.tmp/<clip>/cut_audio.wav).
// .tmp/<clip>/lazy_clip.json is the marker (tools/cut_lazy.mjs status → "lazy": the heavy cut video is NOT built by ensureCut).
//
// Everything on the clip's own timeline (cut_words.json, cut.wav, cut_audio.wav, speakers.json) is in CLIP seconds; everything that the list points into (words_table.json, words.json, vad.json,
// tr_vad.json, map a/b) is in ORIGINAL seconds — exactly the domains the stream's own project has, so every tool that reads «words + map» keeps working unchanged.
//
// What a tool that needs PIXELS uses (never an encode): `viewFile(id)` = an ffmpeg concat list over the original (decode only); `frameJpg` = one still decoded from the original at a clip second.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

export const FPS = 30;
const root = path.resolve(import.meta.dirname, "..", "..");
const R = (...a) => path.join(root, ...a);
const rd = (f, d = null) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };

export const markerFile = (id) => R(".tmp", id, "lazy_clip.json");
export const isLazy = (id) => fs.existsSync(markerFile(id));
export const readMarker = (id) => rd(markerFile(id));
/** true when the old path (every clip sliced and encoded from a whole-stream cut video) is asked for explicitly */
export const encodeMode = () => process.env.STREAM_ENCODE === "1";

/** the original recording of a lazy clip (absolute), from its prep_config (the same file tools/cut_lazy.mjs info() reads) */
export const srcOf = (id) => { const c = rd(R(".tmp", id, "prep_config.json"), {}); return c.source ? path.resolve(root, c.source) : R("public", `${id}_src.mp4`); };

/** "a-b,c-d" (source seconds) → cut-timeline pieces of the stream, on whole frames; plus the offsets of each piece on the clip timeline.
 *  parentMap = the stream's map (segments {a,b,n}); returns {pieces:[{cs,ce,off}] (seconds), frames, D} */
export function piecesOf(parentMap, spec, words = []) {
  const segs = parentMap.segments;
  /* the stream's cut frames, by the cumulative rounding the renderer uses (tools/gpu/edl_stream.py): segment k starts at cut frame n0[k] and has len[k] frames */
  const n0 = [], len = []; let cum = 0;
  for (const g of segs) { const d = g.b - g.a, f0 = Math.round(cum * FPS); cum += d; n0.push(f0); len.push(Math.round(cum * FPS) - f0); }
  const raw = [];
  for (const r of String(spec).split(",")) {
    const [a, b] = r.split("-").map(Number); if (!(b > a)) continue;
    for (let k = 0; k < segs.length; k++) {
      const g = segs[k], lo = Math.max(g.a, a), hi = Math.min(g.b, b); if (hi - lo <= 0.02) continue;
      const f0 = n0[k] + Math.round((lo - g.a) * FPS), f1 = n0[k] + Math.min(len[k], Math.max(Math.round((hi - g.a) * FPS), Math.round((lo - g.a) * FPS) + 1));
      const l = raw[raw.length - 1];
      if (l && l.f1 === f0) l.f1 = f1; else raw.push({ f0, f1 });   // touching stretches of the stream's cut join into one piece
    }
  }
  /* THE ONE CUT RULE AT A CLIP'S EDGES: the clip's ranges come from the unaligned VAD words of the plan (tools/stream/clip_cut_all.mjs), the cut model's from the ALIGNED table (up to ~0.3 s apart). An edge that lands
     inside a table word would start the clip on the tail of a word (the old slice hid it: the half word was dropped from the clip's table but stayed in its sound). The edge moves out to the word's own edge,
     inside the same stretch of the stream's cut: a clip begins and ends on whole words. */
  const segAt = (f) => { for (let k = 0; k < segs.length; k++) if (f >= n0[k] && f <= n0[k] + len[k]) return k; return -1; };
  const sorted = [...words].sort((x, y) => x.s - y.s);
  for (const p of raw) {
    for (let g = 0; g < 4; g++) {   // an edge can hit a second word after moving out of the first
      const k = segAt(p.f0 + 1e-9); if (k < 0) break; const s0 = segs[k].a + (p.f0 - n0[k]) / FPS, w = sorted.find((x) => x.s < s0 - 0.01 && x.e > s0 + 0.01); if (!w) break;
      p.f0 = Math.max(n0[k], n0[k] + Math.floor((w.s - segs[k].a) * FPS + 1e-6));
    }
    for (let g = 0; g < 4; g++) {
      const k = segAt(p.f1 - 1e-9); if (k < 0) break; const s1 = segs[k].a + (p.f1 - n0[k]) / FPS, w = sorted.find((x) => x.s < s1 - 0.01 && x.e > s1 + 0.01); if (!w) break;
      p.f1 = Math.min(n0[k] + len[k], n0[k] + Math.ceil((w.e - segs[k].a) * FPS - 1e-6));
    }
  }
  const pieces = []; let off = 0;
  for (const p of raw) { const nf = Math.max(1, p.f1 - p.f0); pieces.push({ f0: p.f0, nf, cs: p.f0 / FPS, ce: (p.f0 + nf) / FPS, off: off / FPS, offF: off }); off += nf; }
  return { pieces, frames: off, D: +(off / FPS).toFixed(3), n0, len };
}

/** the clip's map: the stream's segments cut to the pieces, on the ORIGINAL's seconds; n on the clip's timeline */
export function childSegments(parentMap, P) {
  const { pieces, n0, len } = P, segs = parentMap.segments, out = [];
  for (const pc of pieces) {
    for (let k = 0; k < segs.length; k++) {
      const g = segs[k], s0 = n0[k], s1 = n0[k] + len[k], lo = Math.max(s0, pc.f0), hi = Math.min(s1, pc.f0 + pc.nf); if (hi <= lo) continue;
      const a = +(g.a + (lo - s0) / FPS).toFixed(6), nf = hi - lo, n = +((pc.offF + (lo - pc.f0)) / FPS).toFixed(6);
      const l = out[out.length - 1], seg = { a, b: +(a + nf / FPS).toFixed(6), n, ...(g.type ? { type: g.type } : {}) };
      if (l && Math.abs(l.b - seg.a) < 1e-6 && Math.abs(l.n + (l.b - l.a) - seg.n) < 1e-6 && l.type === seg.type) { l.b = seg.b; } else out.push(seg);
    }
  }
  return out;
}

/** WHERE THE CLIP'S SOUND COMES FROM, one entry per stretch of one stream segment (2026-11-22, the real stream: the one-pass cut audio joins its segments at SAMPLE-EXACT cumulative positions
 *  (tools/audio_cut.py), the clip's picture and map join them on the renderer's cumulative FRAME rounding (n0 above): the two phases differ by up to ±16 ms, so a clip sliced from the stream's audio at
 *  piece boundaries carried every join up to a frame away from the map's n, where the gate, the join fade and the picture look for it; a speech onset inside the join's own 8 ms fade-in then read as a
 *  click at n — khariji 1705.2 s, ×14.1). Entry = {k: stream segment, off: seconds into that segment's own sound, dur: seconds, n: clip second to place it at (a whole frame)}. tools/stream/clip_audio.py
 *  lays each stretch at its n, so the sound of a source second plays at the picture frame of that second and every join sits exactly on the map's n. */
export function audioPlan(parentMap, P) {
  const { pieces, n0, len } = P, plan = [];
  for (const pc of pieces) {
    for (let k = 0; k < parentMap.segments.length; k++) {
      const s0 = n0[k], s1 = n0[k] + len[k], lo = Math.max(s0, pc.f0), hi = Math.min(s1, pc.f0 + pc.nf); if (hi <= lo) continue;
      plan.push({ k, off: +((lo - s0) / FPS).toFixed(6), dur: +((hi - lo) / FPS).toFixed(6), n: +((pc.offF + (lo - pc.f0)) / FPS).toFixed(6) });
    }
  }
  return plan;
}

/** a clip second → the second of the original, through the clip's map (null when outside) */
export const clipToSrc = (segments, t) => { for (const g of segments) if (t >= g.n - 1e-6 && t <= g.n + (g.b - g.a) + 1e-6) return g.a + (t - g.n); return null; };

/** THE PICTURE OF A LAZY CLIP FOR A TOOL THAT NEEDS PIXELS: a small JSON naming the clip (.tmp/<id>/cut_view.lazy.json) that stands where a cut video's path would. It is not media; the helpers below turn
 *  it into ffmpeg arguments that DECODE the original through the clip's list, frame for frame the way the renderer reads it (tools/gpu/edl_stream.py), and write nothing but the raw frames a tool asks for. */
export function viewFile(id) {
  const f = R(".tmp", id, "cut_view.lazy.json"), body = JSON.stringify({ lazy: true, id, src: srcOf(id), map: `public/${id}_map.json` });
  fs.mkdirSync(path.dirname(f), { recursive: true });
  if (!fs.existsSync(f) || fs.readFileSync(f, "utf8") !== body) fs.writeFileSync(f, body);
  return f;
}
export const isView = (f) => String(f).toLowerCase().endsWith(".lazy.json");
const viewId = (f) => JSON.parse(fs.readFileSync(f, "utf8")).id;
const srcFacts = (src) => { const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=start_time,r_frame_rate", "-of", "json", src], { encoding: "utf8", windowsHide: true }); const s = JSON.parse(r.stdout || "{}").streams?.[0] ?? {}; const [a, b] = String(s.r_frame_rate ?? "30/1").split("/").map(Number); return { start: Number(s.start_time) || 0, sfps: b ? a / b : 30 }; };
/** the clip's cut frames, as the renderer lays them out: segment k = {a, f0, n} (cumulative rounding of tools/gpu/edl_stream.py) */
export function layout(id) { const m = rd(R("public", `${id}_map.json`)); let cum = 0; return m.segments.map((g) => { const f0 = Math.round(cum * FPS); cum += g.b - g.a; return { a: g.a, f0, n: Math.round(cum * FPS) - f0 }; }); }
/** ffmpeg arguments that decode clip frames [f0, f0+n) of a lazy clip, frame-accurately, from the ORIGINAL through the list, then run `tail` (a filter chain, e.g. «crop=…,scale=…,format=gray») and emit it:
 *  ["-ss", pre, "-copyts", "-i", src, "-/filter_complex", <file>, "-map", "[o]"]. The picture of a cut frame k is the source frame round((a + k/30)·sfps) (the plan of edl_stream.py), selected by its timestamp. */
export function windowArgs(id, f0, n, tail, { dir = R(".tmp", id) } = {}) {
  const src = srcOf(id), { start, sfps } = srcFacts(src), lay = layout(id), P = [];
  for (const s of lay) {
    const k0 = Math.max(f0, s.f0) - s.f0, k1 = Math.min(f0 + n, s.f0 + s.n) - s.f0; if (k1 <= k0) continue;
    const i0 = Math.round((s.a + k0 / FPS) * sfps), i1 = Math.round((s.a + (k1 - 1) / FPS) * sfps);
    P.push({ s: start + (i0 - 0.5) / sfps, e: start + (i1 + 0.5) / sfps, nf: k1 - k0 });
  }
  if (!P.length) throw new Error(`${id}: frames ${f0}–${f0 + n} are outside the clip`);
  const m = P.length, cfr = Math.abs(sfps - FPS) > 0.01 ? `fps=${FPS},` : "";
  const head = m === 1 ? "[0:v]" : `[0:v]split=${m}${P.map((_, i) => `[sv${i}]`).join("")};`;
  const body = P.map((p, i) => `${m === 1 ? "" : `[sv${i}]`}trim=start=${p.s.toFixed(6)}:end=${p.e.toFixed(6)},setpts=PTS-STARTPTS,${cfr}trim=end_frame=${p.nf},setpts=PTS-STARTPTS[v${i}];`).join("");
  const cat = m === 1 ? `[v0]${tail}[o]` : P.map((_, i) => `[v${i}]`).join("") + `concat=n=${m}:v=1:a=0,${tail}[o]`;
  fs.mkdirSync(dir, { recursive: true });
  const fcf = path.join(dir, `win_${f0}_${n}_${process.pid}.fc.txt`); fs.writeFileSync(fcf, head + body + cat);
  return { args: ["-ss", Math.max(0, P[0].s - 2).toFixed(3), "-copyts", "-i", src, "-/filter_complex", fcf, "-map", "[o]"], file: fcf };
}
/** raw frames of a lazy clip (what judder_check reads): `n` frames from clip second `startSec`, through `tail`; returns the stdout Buffer. A view file (cut_view.lazy.json) names the clip. */
export function rawWindow(view, startSec, n, tail, { maxBuffer = 1 << 28 } = {}) {
  const id = viewId(view), w = windowArgs(id, Math.round(startSec * FPS), n, tail);
  try { return spawnSync("ffmpeg", ["-v", "error", ...w.args, "-frames:v", String(n), "-f", "rawvideo", "-"], { maxBuffer, windowsHide: true }).stdout; } finally { try { fs.rmSync(w.file, { force: true }); } catch { /* left */ } }
}
/** the clip's duration in seconds (a view stands for a video file in ffprobe-like questions) */
export const viewDuration = (view) => rd(R("public", `${viewId(view)}_map.json`)).duration;

/** Remotion DOWNLOADS every <Audio>/<Video> src of a composition when it collects the audio records (tools/lib/audio_plan.mjs collectAudioFrames, even with no picture): a lazy clip has no file under spec.cut, so the
 *  download is a 404 and the prerender audio is never built. A HARD LINK of the cut audio (a valid media file Remotion can probe, no bytes written) stands at that path only while the records are collected (the sound is mixed from .tmp/<id>/cut_audio.wav
 *  by name, never from this link: audio_plan srcPath); it is removed when the collection ends. Nothing is encoded. */
export async function withPlaceholder(id, spec, fn) {
  if (!isLazy(id) || !spec?.cut) return fn();
  const f = R("public", spec.cut), made = !fs.existsSync(f);
  if (made) { const wav = R(".tmp", id, "cut_audio.wav"); try { fs.linkSync(wav, f); } catch { fs.copyFileSync(wav, f); } }
  try { return await fn(); } finally { if (made) { try { fs.rmSync(f, { force: true }); } catch { /* held open: left, zero bytes */ } } }
}

const PY310 = "C:/Users/mshms/AppData/Local/Programs/Python/Python310/python.exe";
/** his face track of a lazy clip (the same JSON tools/face_track.py gives for a cut video: {fps:2, W, H, boxes}), decoded from the ORIGINAL through the list on the processor (windowArgs: frame-exact, so box k is clip second k/2).
 *  Cached by the clip's list and the original's size, so a changed list or file is tracked again. Returns the JSON file. */
export function faceTrackFile(id) {
  const m = fs.statSync(R("public", `${id}_map.json`)), s = fs.statSync(srcOf(id));
  const f = R(".tmp", id, "facetrack", `${id}_lazy_${s.size}_${Math.round(m.mtimeMs)}.json`);
  if (!fs.existsSync(f)) {
    fs.mkdirSync(path.dirname(f), { recursive: true });
    const frames = layout(id).reduce((t, g) => t + g.n, 0), w = windowArgs(id, 0, frames, "fps=2,scale=480:270,format=gray");
    try {
      /* NVDEC decodes (a decode, never an encode) unless FACE_TRACK_CPU=1; a card that refuses (busy, no memory) or a track with no frames is tried once more on the processor. The filters run on the processor either way. */
      const run = (hw) => spawnSync(PY310, [R("tools", "face_track.py"), srcOf(id), f, "--lazy-args", JSON.stringify([...(hw ? ["-hwaccel", "cuda"] : []), ...w.args])], { cwd: root, encoding: "utf8", windowsHide: true, env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
      const ok = () => { try { return JSON.parse(fs.readFileSync(f, "utf8")).boxes.length > 0; } catch { return false; } };
      let r = run(process.env.FACE_TRACK_CPU !== "1");
      if ((r.status !== 0 || !ok()) && process.env.FACE_TRACK_CPU !== "1") r = run(false);
      if (r.status !== 0 || !ok()) throw new Error("face_track failed: " + (r.stderr || "").slice(-300));
    } finally { try { fs.rmSync(w.file, { force: true }); } catch { /* left */ } }
  }
  return f;
}

/** one still (jpg) of the clip at clip-second t, decoded from the original at the mapped second (a seek in the original; nothing about the cut is encoded) */
export function frameJpg(id, t, out, { scale = null } = {}) {
  const m = rd(R("public", `${id}_map.json`)), s = clipToSrc(m.segments, t); if (s === null) return false;
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-ss", s.toFixed(4), "-i", srcOf(id), "-frames:v", "1", ...(scale ? ["-vf", `scale=${scale}`] : []), "-q:v", "3", out], { windowsHide: true });
  return r.status === 0 && fs.existsSync(out);
}

/** the whole-frame mean luma of the clip at clip-second t (0–255), read from the original: the black-frame measure without a cut video */
export function lumaAt(id, t) {
  const m = rd(R("public", `${id}_map.json`)), s = clipToSrc(m.segments, t); if (s === null) return null;
  const r = spawnSync("ffmpeg", ["-hide_banner", "-ss", s.toFixed(4), "-i", srcOf(id), "-frames:v", "1", "-vf", "scale=160:-2,signalstats,metadata=print:key=lavfi.signalstats.YAVG", "-f", "null", "-"], { encoding: "utf8", windowsHide: true });
  const y = Number(String(r.stderr).match(/YAVG=([\d.]+)/)?.[1]); return Number.isFinite(y) ? y : null;
}
