// Voice clean-up (user 2026-11-13, picked by ear from 6 tools: «الشبكة الصغيرة لإزالة الضجيج» = RNNoise, FFmpeg arnndn + model data/audio_models/rnnoise_sh.rnnn).
//   node tools/audio_clean.mjs <in.mp4|in.wav> [out]     → out defaults to <in>_clean.<ext>; video stream copied untouched, only his voice track denoised.
// Apply to his recording's audio (the cut video) BEFORE sfx are mixed, never to the sfx or the bumper.
import { execFileSync } from "child_process";
import path from "path"; import fs from "fs";
const [inp, outArg] = process.argv.slice(2);
if (!inp || !fs.existsSync(inp)) { console.error("usage: node tools/audio_clean.mjs <in.mp4|in.wav> [out]"); process.exit(2); }
const model = path.resolve("data/audio_models/rnnoise_sh.rnnn").replace(/\\/g, "/").replace(/^([A-Za-z]):/, "$1\\:");
const ext = path.extname(inp), out = outArg ?? inp.slice(0, -ext.length) + "_clean" + ext;
const isVideo = /\.(mp4|mov|mkv|webm)$/i.test(inp);
/* (2026-11-21, gta6: final_review «ذيل الصوت قمته -0.2 dB») arnndn works in 480-sample frames and pads the input up to a whole frame: that last frame came out as
   full-scale DC garbage (cut_clean.wav ended with 480 samples at −32768, heard as a click at the very end of the render). The input is padded with silence before
   the filter, so the garbage frame falls in the padding, and the output is trimmed back to the input's exact length. */
const dur = Number(execFileSync("ffprobe", ["-v", "error", "-select_streams", "a:0", "-show_entries", "stream=duration:format=duration", "-of", "default=nw=1:nk=1", inp], { encoding: "utf8", windowsHide: true }).trim().split(/\s+/).find((x) => Number(x) > 0));
if (!(dur > 0)) console.error("⚠ audio_clean: input length unknown — not padded, the last 480-sample frame may come out as a click (final_review checks the tail)");
const af = dur > 0 ? `apad=pad_dur=0.1,arnndn=m='${model}',atrim=duration=${dur}` : `arnndn=m='${model}'`;
const args = ["-v", "error", "-y", "-i", inp, "-af", af, "-threads", "4",
  ...(isVideo ? ["-map", "0:v?", "-map", "0:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart"] : []), out];
for (let i = 1; ; i++) { try { execFileSync("ffmpeg", args, { stdio: "inherit", windowsHide: true }); break; } catch (e) { if (i >= 4) throw e; console.error(`⚠ arnndn crashed (${e.status}) — retry ${i}/3`); } }   // the filter sometimes dies with 0xC0000005 on a run that passes on the next (nvidia_crash 2026-11-14)
console.log(`✔ voice cleaned → ${out}`);
