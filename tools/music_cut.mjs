// REMOVE THE MUSIC FROM ONE SPAN of a built montage (user 2026-11-19, HK-Motion: «بدل حذف أضع حذف موسيقى»): the span's audio is cut out, the music is taken off it by the local music remover
// (S:/AI_Tools/RemoveMusic: UVR MDX-Net KARA 2 through Audio Separator on the GPU, the speech stem only), and the speech-only audio is put back in the same place with 30 ms crossfades.
// The VIDEO is not touched (stream copy): a few seconds, whatever the length of the video.
//   node tools/music_cut.mjs <p> <A> <B> [--pad 1.0]        (A,B = seconds of the CURRENT cut, or f<frame>; the stage hears 1 s of context around the span)
// Writes a NEW versioned file public/<p>_cut_s_b<n>.mp4 (the Studio is never given a file that changes under it), points data/specs/<p>.json `cut` at it, gives it its light Studio copy
// (the old light video is linked, the sound copy is new) and refreshes .tmp/<p>/cut.wav + cut16k.wav. Older versions beyond the last two are deleted like tools/cut_block.mjs does.
// For the whole recording or one clip BEFORE the cut use tools/clip_audio_fix.mjs --music instead.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const [p, a0, b0, ...rest] = process.argv.slice(2);
if (!p || !a0 || !b0) { console.error("usage: node tools/music_cut.mjs <p> <A> <B> [--pad 1.0]"); process.exit(2); }
process.chdir(path.resolve(import.meta.dirname, ".."));
const sec = (x) => (/^f\d+/.test(x) ? Number(x.slice(1)) / 30 : Number(x));
const opt = (k, d) => { const i = rest.indexOf(`--${k}`); return i < 0 ? d : rest[i + 1]; };
const A = Math.round(sec(a0) * 30) / 30, B = Math.round(sec(b0) * 30) / 30, PAD = Number(opt("pad", "1.0"));
if (!(B > A)) { console.error("✘ B must be after A"); process.exit(2); }
const T = path.join(".tmp", p), W = path.join(T, "music"), specF = path.join("data", "specs", `${p}.json`);
const spec = JSON.parse(fs.readFileSync(specF, "utf8")), src = path.join("public", spec.cut);
if (!fs.existsSync(src)) { console.error(`✘ ${src} is missing`); process.exit(1); }
const RM = "S:/AI_Tools/RemoveMusic", SEP = `${RM}/.venv/Scripts/audio-separator.exe`;
if (!fs.existsSync(SEP)) { console.error(`✘ the music remover is missing: ${SEP}`); process.exit(1); }
const run = (cmd, args, o = {}) => { const r = spawnSync(cmd, args, { encoding: "utf8", windowsHide: true, maxBuffer: 1 << 26, ...o }); if (r.status !== 0) { console.error((r.stderr || r.stdout || "").slice(-1500)); process.exit(1); } return r; };
const ff = (args) => run("ffmpeg", ["-v", "error", "-y", "-threads", "4", ...args]);
const dur = Number(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src]).stdout.trim());
if (A >= dur) { console.error(`✘ ${A}s is past the end of the video (${dur.toFixed(2)}s)`); process.exit(2); }
const B2 = Math.min(B, Math.floor(dur * 30) / 30);
fs.rmSync(W, { recursive: true, force: true }); fs.mkdirSync(path.join(W, "stems"), { recursive: true });
const t0 = Date.now(), s0 = Math.max(0, A - PAD), s1 = Math.min(dur, B2 + PAD);

// 1) the whole audio (48 kHz stereo, the rate the pipeline uses) and the span with its context (44.1 kHz stereo: the model's rate)
const full = path.join(W, "full.wav"), ctx = path.join(W, "ctx.wav");
ff(["-i", src, "-map", "0:a:0", "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", full]);
ff(["-ss", s0.toFixed(3), "-t", (s1 - s0).toFixed(3), "-i", full, "-ar", "44100", "-c:a", "pcm_s16le", ctx]);

// 2) the music off (GPU)
console.log(`… removing the music from ${A.toFixed(2)}–${B2.toFixed(2)}s (context ${(s1 - s0).toFixed(1)}s) with the local music remover`);
run(SEP, [path.resolve(ctx), "--model_filename", "UVR_MDXNET_KARA_2.onnx", "--single_stem", "Vocals", "--output_format", "WAV", "--output_dir", path.resolve(path.join(W, "stems")), "--model_file_dir", `${RM}/models`]);
const stem = fs.readdirSync(path.join(W, "stems")).filter((f) => /vocals/i.test(f)).map((f) => path.join(W, "stems", f))[0];
if (!stem) { console.error("✘ no speech stem came out of the music remover"); process.exit(1); }

// 3) back to 48 kHz, cut to exactly the span, the same length as the span it replaces
const patch = path.join(W, "patch.wav");
ff(["-i", stem, "-ar", "48000", "-ac", "2", "-ss", (A - s0).toFixed(4), "-t", (B2 - A).toFixed(4), "-c:a", "pcm_s16le", patch]);
const out = path.join(W, "audio_new.wav");
run("C:/Users/mshms/AppData/Local/Programs/Python/Python310/python.exe", ["-I", "tools/audio_patch.py", full, patch, A.toFixed(4), out, "--fade", "0.03"]);

// 4) the new versioned file: the video as it is, the new audio
const nFile = path.join(T, "cut_block_n.txt");
const n = 1 + Math.max(0, ...fs.readdirSync("public").map((f) => Number(f.match(new RegExp(`^${p}_cut_s_b(\\d+)`))?.[1] ?? 0)), Number(fs.existsSync(nFile) ? fs.readFileSync(nFile, "utf8") : 0));
fs.writeFileSync(nFile, String(n));
const outName = `${p}_cut_s_b${n}.mp4`, dst = path.join("public", outName), part = dst.replace(/\.mp4$/, ".part.mp4");
ff(["-i", src, "-i", out, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", part]);
fs.renameSync(part, dst);

// 5) the light Studio copy: the light video is the same frames (hard link under the new version), the sound copy is made from the new audio
try {
  const LIST = path.join("data", "preview_proxies.json"), px = fs.existsSync(LIST) ? JSON.parse(fs.readFileSync(LIST, "utf8")) : {}, rel = path.relative("public", src).replace(/\\/g, "/"), v0 = px[rel];
  const pv0 = src.replace(/\.mp4$/, `_prev_${v0}.mp4`);
  if (v0 && fs.existsSync(pv0)) {
    const v1 = Math.floor(fs.statSync(dst).mtimeMs / 1000).toString(36), base = dst.replace(/\.mp4$/, "");
    const pv1 = `${base}_prev_${v1}.mp4`, pa1 = `${base}_prev_${v1}.m4a`;
    try { fs.linkSync(pv0, pv1); } catch { fs.copyFileSync(pv0, pv1); }
    ff(["-i", out, "-vn", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", pa1]);
    px[outName] = v1; fs.writeFileSync(LIST, JSON.stringify(px, null, 1));
  }
} catch (e) { console.log("light copy skipped:", e.message); }

// 6) the data: the new file takes the old one's name (one name, no extra version) or, if that is refused, the spec points at the versioned name; the audio the gates and the transcript tools read is rebuilt
{
  const { swapInPlace } = await import("./hk_inplace.mjs");
  if (swapInPlace({ fresh: dst, target: src })) console.log(`music_cut: the new file replaced ${path.basename(src)} (no extra version)`);
  else { spec.cut = outName; fs.writeFileSync(specF, JSON.stringify(spec, null, 1)); }
}
ff(["-i", out, "-ac", "1", "-ar", "48000", path.join(T, "cut.wav")]);
ff(["-i", path.join(T, "cut.wav"), "-ar", "16000", "-ac", "1", path.join(T, "cut16k.wav")]);
for (let k = 1; k < n - 1; k++) for (const f of fs.readdirSync("public").filter((x) => x.startsWith(`${p}_cut_s_b${k}.`) || x.startsWith(`${p}_cut_s_b${k}_prev_`))) { try { fs.rmSync(path.join("public", f)); } catch { /* open in the Studio */ } }
fs.rmSync(path.join(W, "full.wav"), { force: true });
console.log(`music_cut: ${A.toFixed(2)}–${B2.toFixed(2)}s speech only (${((Date.now() - t0) / 1000).toFixed(0)} s) → ${spec.cut}`);
