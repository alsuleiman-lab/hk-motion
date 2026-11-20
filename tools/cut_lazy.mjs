// THE CUT AS A LIST OVER THE ORIGINAL, THE HEAVY FILE ON DEMAND (user 2026-11-19: «قص الفيديو شبيه ببرامج المونتاج… يظل عندنا الملف الأصلي، ما نحتاج ملفات كثيرة»).
//
// Before: every deletion (or music removal) rebuilt/spliced the heavy cut video (~1.7 GB) at once.
// Now the cut is the LIST (public/<p>_map.json: the kept stretches of the original, seconds on the 1/30 grid) + the audio of the cut (.tmp/<p>/cut_audio.wav, the one thing a list
// cannot give back: music removal and level fixes live in it). A deletion edits the list, the audio and the light Studio copy (the Studio plays only the light copy) and does NOT touch
// the heavy file, which becomes stale. The heavy file is the cache of «list + audio»: it is built again, from the original and in ONE pass, only when something needs its pixels
// (a render, face/window/matte tools): `ensureCut(p)` — a few ms when it is fresh.
//
//   state  .tmp/<p>/cut_state.json  {map: sha1 of the list, audio: size:mtime of the cut audio}   (what the heavy file was built from)
//   ensureCut(p)    fresh → nothing · only the audio differs → remux (video copied, new audio) · the list differs → one-pass GPU build from the original (tools/cut_build_gpu.py)
//   CLI             node tools/cut_lazy.mjs status|ensure|init <p>
// Legacy projects (no state) are treated as fresh once, at the first lazy edit (`initLazy`).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

export const PY = "C:/Users/mshms/AppData/Local/Programs/Python/Python310/python.exe";
const root = path.resolve(import.meta.dirname, "..");
const R = (...a) => path.join(root, ...a);
const sha = (f) => crypto.createHash("sha1").update(fs.readFileSync(f)).digest("hex");
const rd = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const log = (m) => console.log(`cut_lazy: ${m}`);

export const info = (p) => {
  const T = R(".tmp", p), spec = rd(R("data", "specs", `${p}.json`), null), cfg = rd(path.join(T, "prep_config.json"), {});
  const src = cfg.source ? path.resolve(root, cfg.source) : R("public", `${p}_src.mp4`);
  return { p, T, spec, src, mapF: R("public", `${p}_map.json`), heavy: spec?.cut ? R("public", spec.cut) : null, audio: path.join(T, "cut_audio.wav"), stateF: path.join(T, "cut_state.json") };
};
const audioStamp = (f) => { try { const s = fs.statSync(f); return `${s.size}:${Math.floor(s.mtimeMs)}`; } catch { return "none"; } };
export const stamp = (p) => { const i = info(p); return { map: fs.existsSync(i.mapF) ? sha(i.mapF) : "none", audio: audioStamp(i.audio) }; };
/* PIXEL EDITS ON THE CUT VIDEO (2026-11-20, readiness audit): the women's blur (tools/blur_region.py, blur_faces_video.py) is written INTO the heavy cut file, and
   clip_people_gate checks that file — but the render reads the ORIGINAL through the cut list (edlSetup) and a list change rebuilds the heavy file from the
   original: both dropped the blur silently while the gate passed. A heavy file written after its build (mtime past state.at) carries edits the list does not
   have: it is marked {pixelEdits: true}, the render then reads the heavy file itself, and a rebuild from the original is REFUSED (HK_DROP_PIXEL_EDITS=1 when
   the blur will be applied again right after). The flag goes only when the heavy file is rebuilt from the original. */
const heavyM = (i) => { try { return fs.statSync(i.heavy).mtimeMs; } catch { return 0; } };
export const pixelEdits = (p) => { const i = info(p), st = rd(i.stateF, null); if (!st || !i.heavy) return false; return !!st.pixelEdits || (st.at && heavyM(i) > st.at + 120e3); };
/** before a pipeline tool rewrites the heavy file itself (eager cut_block(s)): a blur written since the last build is remembered as a flag, since the new write hides its mtime */
export const notePixelEdits = (p) => { const i = info(p), st = rd(i.stateF, null); if (st && !st.pixelEdits && pixelEdits(p)) fs.writeFileSync(i.stateF, JSON.stringify({ ...st, pixelEdits: true })); return pixelEdits(p); };
/** `edits`: the heavy file just written still carries edits of its own (a remux that copied the picture, an eager splice of a blurred file) */
export const markFresh = (p, { edits = false } = {}) => { const i = info(p); fs.mkdirSync(i.T, { recursive: true }); fs.writeFileSync(i.stateF, JSON.stringify({ ...stamp(p), at: Date.now(), ...(edits ? { pixelEdits: true } : {}) })); };

/** "fresh" | "audio" (only the sound differs) | "video" (the list differs or the file is gone) | "legacy" (never tracked) */
export const status = (p) => {
  const i = info(p); if (!i.spec?.cut) return "legacy";
  const st = rd(i.stateF, null); if (!st) return "legacy";
  if (!fs.existsSync(i.heavy)) return "video";
  const now = stamp(p);
  if (st.map !== now.map) return "video";
  return st.audio !== now.audio ? "audio" : "fresh";
};

/** the audio truth of the cut (.tmp/<p>/cut_audio.wav): made from the heavy file's sound the first time a lazy edit happens (legacy project), kept by every later edit */
export const initLazy = (p) => {
  const i = info(p);
  if (!fs.existsSync(i.audio)) {
    if (!i.heavy || !fs.existsSync(i.heavy)) throw new Error(`no cut audio and no cut video for ${p}`);
    fs.mkdirSync(i.T, { recursive: true });
    const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-threads", "4", "-i", i.heavy, "-map", "0:a:0", "-ar", "48000", "-c:a", "pcm_s16le", i.audio + ".part.wav"], { encoding: "utf8", windowsHide: true });
    if (r.status !== 0) throw new Error("cannot extract the cut audio: " + (r.stderr || "").slice(-300));
    fs.renameSync(i.audio + ".part.wav", i.audio);
  }
  if (!fs.existsSync(i.stateF)) markFresh(p);   // legacy: the heavy file was kept current by the old path, so it is fresh right now
  return i;
};

/** an EAGER edit rewrote the heavy cut file itself: the audio truth is taken again from it and the state says «fresh» */
export const resetFromHeavy = (p) => { const i = info(p), pe = !!rd(i.stateF, {})?.pixelEdits; fs.rmSync(i.audio, { force: true }); fs.rmSync(i.stateF, { force: true }); initLazy(p); markFresh(p, { edits: pe }); };   /* an eager edit splices the heavy file itself: its blur (flagged by notePixelEdits before the write) is still in it */

export const channels = (f) => Number(spawnSync("ffprobe", ["-v", "error", "-select_streams", "a:0", "-show_entries", "stream=channels", "-of", "csv=p=0", f], { encoding: "utf8", windowsHide: true }).stdout.trim()) || 1;

const replaceFile = (part, target) => { try { fs.renameSync(part, target); } catch (e) { throw new Error(`cannot replace ${path.basename(target)} (${e.code ?? e.message}) — is it open in a render?`); } };

/** make the heavy cut file match the list and the audio. Returns what was done. */
export const ensureCut = (p, { quiet = false } = {}) => {
  const i = info(p), st = status(p);
  if (st === "fresh" || st === "legacy") { if (st === "fresh") notePixelEdits(p); return st; }
  const say = quiet ? () => {} : log, pe0 = notePixelEdits(p);
  const t0 = Date.now(), part = i.heavy.replace(/\.mp4$/i, ".part.mp4");
  if (st === "audio") {
    say(`the sound changed since the cut video was built → only the sound of ${path.basename(i.heavy)} is replaced (the picture is copied)`);
    const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-threads", "4", "-i", i.heavy, "-i", i.audio, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-f", "mp4", part], { encoding: "utf8", windowsHide: true });
    if (r.status !== 0) throw new Error("remux failed: " + (r.stderr || "").slice(-400));
    replaceFile(part, i.heavy);
  } else {
    if (fs.existsSync(i.heavy) && pe0 && process.env.HK_DROP_PIXEL_EDITS !== "1")
      throw new Error(`${path.basename(i.heavy)} carries edits made on the cut video itself (a women's blur?) that the cut list does not have: building it again from the original would DROP them. Re-apply them after the rebuild: HK_DROP_PIXEL_EDITS=1 node tools/cut_lazy.mjs ensure ${p}, then the blur again, then clip_people_gate.`);
    say(`the cut list changed since the cut video was built → ${path.basename(i.heavy)} is built again from the original in one pass (about 4 minutes for 18)`);
    const args = ["tools/cut_build_gpu.py", i.src, i.mapF, i.heavy, ...(fs.existsSync(i.audio) ? ["--audio-from", i.audio] : []), ...(process.env.HK_SMOOTH === "0" ? ["--no-smooth"] : [])];
    const r = spawnSync(PY, args, { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 1 << 26 });
    if (r.status !== 0) throw new Error(`the one-pass build failed (exit ${r.status}): ${(r.stdout || "").trim().split("\n").slice(-2).join(" | ")} ${(r.stderr || "").slice(-300)}`);
    say((r.stdout || "").trim().split("\n").filter((l) => /^cut_build_gpu/.test(l)).slice(-1)[0] ?? "built");
  }
  // tools that still read <p>_cut.mp4 find the same whole file
  try { const c0 = R("public", `${p}_cut.mp4`); if (fs.existsSync(c0) && path.resolve(c0) !== path.resolve(i.heavy)) { const tl = c0 + ".swap.mp4"; fs.rmSync(tl, { force: true }); fs.linkSync(i.heavy, tl); fs.renameSync(tl, c0); } } catch { /* held open: left as it is */ }
  const want = Math.round((i.spec?.frames ?? 0)), got = Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", i.heavy], { encoding: "utf8", windowsHide: true }).stdout.trim()) * 30;
  if (want && Math.abs(got - want) > 2) console.error(`cut_lazy: ⚠ the cut video has ${got.toFixed(0)} frames but the spec says ${want}: the list and the spec disagree`);
  markFresh(p, { edits: st === "audio" && pe0 }); syncProxy(p);   /* the remux copies the picture (its blur stays); a rebuild from the original has none */
  say(`${st === "audio" ? "sound replaced" : "built"} in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  return st;
};

/** the light copy keeps the heavy file's version name after a rebuild, so `make_preview_proxy --auto` finds it up to date (same frames, same sound) */
const syncProxy = (p) => {
  try {
    const i = info(p), LIST = R("data", "preview_proxies.json"), px = rd(LIST, {}), rel = i.spec.cut, v0 = px[rel]; if (!v0 || !fs.existsSync(i.heavy)) return;
    const v = Math.floor(fs.statSync(i.heavy).mtimeMs / 1000).toString(36); if (v === v0) return;
    const base = i.heavy.replace(/.mp4$/i, "");
    for (const ext of ["mp4", "m4a"]) { const from = `${base}_prev_${v0}.${ext}`, to = `${base}_prev_${v}.${ext}`; if (fs.existsSync(from)) { fs.rmSync(to, { force: true }); fs.renameSync(from, to); } }
    px[rel] = v; fs.writeFileSync(LIST, JSON.stringify(px, null, 1));
  } catch { /* the proxy run makes a new one */ }
};

/** is this heavy cut file (path relative to public/) stale? `make_preview_proxy --auto` must not make a light copy from it then (the light copy is the newer truth) */
export const isStaleHeavy = (rel) => {
  const m = path.basename(rel).match(/^(.+?)_cut(?:_s)?(?:_bd+)?.mp4$/); if (!m) return false;
  const s = status(m[1]); return s === "video" || s === "audio";
};

/** THE EXPORT FROM THE ORIGINAL (phase 2): for a project the lazy cut tracks, the GPU renderer reads the cut straight from the original through the cut list
 *  (tools/gpu/edl_stream.py), so no cut video is built for it at all. Writes the registry the compositor reads (env HK_EDL_MAP) and returns {p, file, heavy, audio}; the audio of the cut comes
 *  from .tmp/<p>/cut_audio.wav. Returns null (after `ensureCut`, the old way) for an untracked project, HK_EDL=0, or a source codec NVDEC reads differently from the build. */
export const edlSetup = (comp) => {
  const p = projectOf(comp); if (!p) return null;
  const i = info(p), st = status(p);
  const pe = st !== "legacy" && notePixelEdits(p); if (pe) console.log(`cut_lazy: ${p} — the cut video carries its own edits (blur): rendered from the cut video, not from the original`);
  const ok = !pe && process.env.HK_EDL !== "0" && st !== "legacy" && fs.existsSync(i.src) && fs.existsSync(i.mapF) && fs.existsSync(i.audio);
  const codec = ok ? spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name", "-of", "csv=p=0", i.src], { encoding: "utf8", windowsHide: true }).stdout.trim() : "";
  if (!ok || !["h264", "hevc", "av1"].includes(codec)) { ensureCut(p); return null; }
  const file = path.join(i.T, "edl_map.json");
  fs.writeFileSync(file, JSON.stringify({ [i.heavy]: { src: i.src, map: i.mapF, smooth: process.env.HK_SMOOTH !== "0" } }));
  const frames = Math.round(i.spec?.frames ?? 0), segs = rd(i.mapF, { segments: [] }).segments, tot = segs.reduce((s, x) => s + x.b - x.a, 0) * 30;
  if (frames && Math.abs(tot - frames) > 3) console.error(`cut_lazy: ⚠ the cut list is ${tot.toFixed(0)} frames but the spec says ${frames}`);
  console.log(`cut_lazy: ${p} is exported from the original through the cut list (no cut video is built; the sound is the cut audio)`);
  return { p, file, heavy: i.heavy, audio: i.audio };
};

/** a composition id (Studio/render name like `Jordan-Arrests-Both`) → the project whose spec exists, or null */
export const projectOf = (comp) => {
  const base = String(comp ?? "").replace(/-(Both|BothV|L)$/i, "").toLowerCase();
  for (const c of [base, base.replace(/-/g, "_")]) if (fs.existsSync(R("data", "specs", `${c}.json`))) return c;
  /* a spec with its own composition id (spec.compId, src/SpecComps.tsx) */
  try { for (const f of fs.readdirSync(R("data", "specs"))) if (f.endsWith(".json") && String(rd(R("data", "specs", f), {})?.compId ?? "").toLowerCase() === base) return f.slice(0, -5); } catch { /* no specs */ }
  return null;
};
export const ensureCutForComp = (comp) => { const p = projectOf(comp); if (p) ensureCut(p); return p; };

if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, "/")}`) {
  const [cmd, p] = process.argv.slice(2);
  if (!cmd || !p) { console.error("usage: node tools/cut_lazy.mjs status|ensure|init <p>"); process.exit(2); }
  try {
    if (cmd === "status") console.log(status(p));
    else if (cmd === "init") { initLazy(p); console.log("ok"); }
    else if (cmd === "ensure") console.log(ensureCut(p));
    else { console.error("unknown command"); process.exit(2); }
  } catch (e) { console.error("✘ " + e.message); process.exit(1); }
}
