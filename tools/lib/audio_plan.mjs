// THE MONTAGE'S FINAL AUDIO, ONE BUILDER FOR THE CHECK AND THE RENDER (user 2026-11-21, GTA 6: «ليش تظهر أخطاء بعد الرندر؟ … لازم حل جذري»: a click in the
// audio tail and a click at a reel join were found only by final_review on the RENDERED file, so each format was rendered 3–4 times).
// The render's audio is decided by the composition's own <Audio> records (window.remotion_collectAssets, per frame): the cut voice (split around the bumper),
// the bumper's sound, spec.sfx, scene-effect sounds, the cover's sound, the tail. This file turns those records into segments and mixes them — the SAME code
// in tools/gpu_render.mjs (after the frames) and in tools/prerender_check.mjs (BEFORE any pixel: the records are collected with no picture, Remotion
// renderFrames imageFormat "none", with the full render's own input props). So the file prerender_check measures is byte-for-byte the audio the render muxes.
//   segmentsFromFrames(frames, start)          frames = [{frame, audioAndVideoAssets}] → [{id, src, startRel, trim, rate, vols, last}]
//   mixToFile(segs, out, {NF, fps, root, edl, codec})   the gpu_render mix (amix normalize=0, padded to the picture) → out (wav pcm or aac)
//   planOf(segs, {root, edl, fps})             the plan in plain numbers (source path relative to root, start/trim/duration frames, rate, volume)
//   comparePlans(a, b)                         [] = the same audio; else one line per difference
//   collectAudioFrames({compId, inputProps, start, end, concurrency})   the records with no picture (Remotion renderFrames, imageFormat none)
//   inputStamp(plan, root)                     size|mtime of every source file of the plan (a source changed = the verified mix is stale)
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { execFileSync } from "node:child_process";

/** the segments of the mix, exactly as tools/gpu_render.mjs built them inline until 2026-11-21 */
export function segmentsFromFrames(frames, start) {
  const open = new Map(), segs = [];
  for (const f of [...frames].sort((a, b) => a.frame - b.frame)) {
    const rel = f.frame - start, present = new Set();
    for (const a of f.audioAndVideoAssets ?? []) {
      if (a.type !== "audio") continue;
      present.add(a.id);
      let o = open.get(a.id);
      if (!o) { o = { id: a.id, src: a.src, startRel: rel, trim: a.mediaFrame, rate: a.playbackRate, vols: [], last: rel }; open.set(a.id, o); segs.push(o); }
      o.vols.push(a.volume); o.last = rel;
    }
    for (const [id] of open) if (!present.has(id)) open.delete(id);
  }
  return segs;
}

/** an asset src (bundle URL or file URL) → a file under root/public; the heavy cut is read as the cut audio when the render reads the cut from the original (edl) */
export const srcPath = (s, root, edl = null) => {
  let p;
  if (String(s).startsWith("file:")) p = decodeURIComponent(new URL(s).pathname.replace(/^\//, ""));
  else { try { const u = new URL(s); const m = decodeURIComponent(u.pathname).match(/\/public\/(.*)$/); p = m ? `${root}/public/${m[1]}` : s; } catch { p = s; } }
  return edl?.audio && path.resolve(p).toLowerCase() === path.resolve(edl.heavy).toLowerCase() ? edl.audio : p;
};
const meanVol = (o) => o.vols.reduce((a, b) => a + b, 0) / o.vols.length;

/** the filter graph of the mix (same text gpu_render wrote to audio_fc.txt) */
export function mixGraph(segs, { NF, fps = 30, root, edl = null, log = () => {} }) {
  const inputs = [], parts = [], mixIn = [], uniq = new Map();
  segs.forEach((o, k) => {
    const v = meanVol(o);
    if (Math.max(...o.vols) - Math.min(...o.vols) > 0.02) log(`audio ${o.id}: volume varies (${Math.min(...o.vols).toFixed(2)}–${Math.max(...o.vols).toFixed(2)}), using the mean`);
    const dur = (o.last - o.startRel + 1) / fps, ms = Math.round((o.startRel / fps) * 1000);
    const sp = srcPath(o.src, root, edl); if (!uniq.has(sp)) { uniq.set(sp, { idx: uniq.size, n: 0 }); inputs.push("-i", sp); } const u = uniq.get(sp); o.inLabel = `u${u.idx}_${u.n++}`;
    parts.push(`[${o.inLabel}]atrim=start=${(o.trim / fps).toFixed(4)}:duration=${(dur * o.rate).toFixed(4)},asetpts=PTS-STARTPTS${o.rate !== 1 ? `,atempo=${o.rate}` : ""},volume=${v.toFixed(4)},adelay=${ms}:all=1[a${k}]`);
    mixIn.push(`[a${k}]`);
  });
  const splits = [...uniq.values()].map((u) => `[${u.idx}:a]aresample=48000,${u.n > 1 ? `asplit=${u.n}${Array.from({ length: u.n }, (_, j) => `[u${u.idx}_${j}]`).join("")}` : `anull[u${u.idx}_0]`}`);
  parts.unshift(...splits);
  /* (2026-11-20) padded with silence to the picture: a bumper whose own sound is shorter (shelf: 3.84 s) left the file's audio 1.1 s short */
  const fc = parts.join(";\n") + ";\n" + mixIn.join("") + `amix=inputs=${mixIn.length}:duration=longest:normalize=0:dropout_transition=0,aresample=48000,apad=whole_dur=${(NF / fps).toFixed(4)},atrim=duration=${(NF / fps).toFixed(4)}[a]`;
  return { inputs, fc };
}

/** mix the segments into `out`: codec "aac" (what the render muxes) or "pcm" (the checked master; the render encodes it to aac) */
export function mixToFile(segs, out, { NF, fps = 30, root, edl = null, codec = "aac", work = path.dirname(out), log = () => {} }) {
  if (!segs.length) return false;
  const { inputs, fc } = mixGraph(segs, { NF, fps, root, edl, log });
  fs.mkdirSync(work, { recursive: true });
  const fcFile = path.join(work, "audio_fc.txt"); fs.writeFileSync(fcFile, fc);
  const enc = codec === "pcm" ? ["-c:a", "pcm_s16le"] : ["-c:a", "aac", "-b:a", "192k"];
  execFileSync("ffmpeg", ["-v", "error", "-y", "-threads", "4", ...inputs, "-/filter_complex", fcFile, "-map", "[a]", ...enc, out]);
  return true;
}

/** the plan in numbers a person can read and two runs can compare */
export const planOf = (segs, { root, edl = null, fps = 30 }) => segs.map((o) => ({
  src: path.relative(root, srcPath(o.src, root, edl)).replace(/\\/g, "/"), at: o.startRel, frames: o.last - o.startRel + 1, trim: +Number(o.trim).toFixed(3), rate: o.rate, vol: +meanVol(o).toFixed(4),
})).sort((a, b) => a.at - b.at || a.src.localeCompare(b.src) || a.trim - b.trim);

/** [] when the two plans make the same audio (frames exact, volume within 0.001); else the Arabic lines of what differs */
export function comparePlans(a, b) {
  const out = [], A = [...(a ?? [])], B = [...(b ?? [])];
  if (A.length !== B.length) out.push(`عدد مقاطع الصوت ${A.length} في الفحص و${B.length} في الرندر`);
  const key = (x) => `${x.src}|${x.at}`, mb = new Map(B.map((x) => [key(x), x]));
  for (const x of A) {
    const y = mb.get(key(x));
    if (!y) { out.push(`مقطع «${x.src}» عند الإطار ${x.at} في الفحص وليس في الرندر`); continue; }
    if (y.frames !== x.frames || Math.abs(y.trim - x.trim) > 1e-3 || y.rate !== x.rate || Math.abs(y.vol - x.vol) > 1e-3) out.push(`مقطع «${x.src}» عند الإطار ${x.at}: الطول ${x.frames}/${y.frames}، البداية ${x.trim}/${y.trim}، السرعة ${x.rate}/${y.rate}، الحجم ${x.vol}/${y.vol}`);
    mb.delete(key(x));
  }
  for (const y of mb.values()) out.push(`مقطع «${y.src}» عند الإطار ${y.at} في الرندر وليس في الفحص`);
  return out.slice(0, 12);
}

/** size|mtime of every source of the plan */
export const inputStamp = (plan, root) => Object.fromEntries([...new Set(plan.map((x) => x.src))].sort().map((s) => { try { const st = fs.statSync(path.resolve(root, s)); return [s, `${st.size}:${Math.floor(st.mtimeMs)}`]; } catch { return [s, "missing"]; } }));

/** the composition's audio records for frames start..end with NO picture (Remotion renderFrames, imageFormat "none"): the same React tree the GPU render
    draws (same input props), so the same <Audio> records. A tiny server answers the geometry posts a VSlot makes in the "top" layer. */
export async function collectAudioFrames({ compId, inputProps, start = 0, end = null, concurrency = 4, serveUrl = null, log = () => {} }) {
  const { openBrowser, renderFrames, selectComposition } = await import("@remotion/renderer");
  const geom = http.createServer((q, r) => { q.resume(); q.on("end", () => { r.writeHead(200, { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" }); r.end("ok"); }); });
  await new Promise((r) => geom.listen(0, "127.0.0.1", r));
  const props = { ...inputProps, hybridPort: geom.address().port };
  let url = serveUrl;
  if (!url) url = (await (await import("./cached_bundle.mjs")).cachedServeUrl(compId, { tag: "prerender" })).serveUrl;
  log(`audio records: bundle ready (${compId})`);
  const browser = await openBrowser("chrome", { chromiumOptions: { gl: "angle" } });
  try {
    const composition = await selectComposition({ serveUrl: url, id: compId, inputProps: props, puppeteerInstance: browser, chromiumOptions: { gl: "angle" } });
    const last = end === null ? composition.durationInFrames - 1 : Math.min(end, composition.durationInFrames - 1);
    const t0 = Date.now();
    const r = await renderFrames({
      composition, serveUrl: url, inputProps: props, imageFormat: "none", outputDir: null, frameRange: [start, last], concurrency, puppeteerInstance: browser,
      chromiumOptions: { gl: "angle" }, timeoutInMilliseconds: 120000, logLevel: "error", onStart: () => {}, onFrameUpdate: (n) => { if (n % 900 === 0) log(`audio records: ${n}/${last - start + 1} frames (${((Date.now() - t0) / 1000).toFixed(0)} s)`); },
    });
    return { frames: r.assetsInfo.assets.map((f) => ({ frame: f.frame, audioAndVideoAssets: f.audioAndVideoAssets })), composition, start, end: last };
  } finally { try { await browser.close({ silent: true }); } catch { /* gone */ } geom.close(); }
}
