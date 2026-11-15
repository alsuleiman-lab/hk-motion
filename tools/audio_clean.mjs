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
const af = `arnndn=m='${model}'`;
const args = ["-v", "error", "-y", "-i", inp, "-af", af, "-threads", "4",
  ...(isVideo ? ["-map", "0:v?", "-map", "0:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart"] : []), out];
for (let i = 1; ; i++) { try { execFileSync("ffmpeg", args, { stdio: "inherit", windowsHide: true }); break; } catch (e) { if (i >= 4) throw e; console.error(`⚠ arnndn crashed (${e.status}) — retry ${i}/3`); } }   // the filter sometimes dies with 0xC0000005 on a run that passes on the next (nvidia_crash 2026-11-14)
console.log(`✔ voice cleaned → ${out}`);
