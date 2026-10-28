// Add reverb/echo to a voice (e.g. Quran recitation) with ffmpeg — convolution reverb from a synthetic decaying-noise impulse response.
//   node tools/reverb.mjs <in.mp3|wav|mp4> <out.mp3|wav> [preset=mosque|hall|light|echo]
// light = a little air | mosque = mosque / mihrab (tail ~2.2 s) | hall = big hall (~3.2 s) | echo = plain repeating echo.
// The wet signal is measured and set to a fixed level BELOW the dry voice (light -16 dB, mosque -9 dB, hall -6 dB), so the recitation stays clear whatever the source level.
// The reverb is band-limited (180 Hz–3.8 kHz) so it never muddies the bass or hisses. Output = voice + tail (the tail is not cut). No music, peaks limited.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const [inp, out, preset = "mosque"] = process.argv.slice(2);
if (!inp || !out) { console.log("usage: node tools/reverb.mjs <in> <out> [mosque|hall|light|echo]"); process.exit(1); }
const ff = (args) => spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { encoding: "utf8" });
const mean = (f) => { const r = spawnSync("ffmpeg", ["-hide_banner", "-i", f, "-af", "volumedetect", "-vn", "-f", "null", "-"], { encoding: "utf8" }); return parseFloat(/mean_volume: ([-\d.]+) dB/.exec(r.stderr)?.[1] ?? "-30"); };
const tmp = path.resolve(".tmp/reverb"); fs.mkdirSync(tmp, { recursive: true });

if (preset === "echo") {
  const r = ff(["-i", inp, "-af", "aecho=0.8:0.85:120|240:0.35|0.2,alimiter=limit=0.95", "-vn", out]);
  if (r.status) { console.error(r.stderr); process.exit(1); }
  console.log(`echo -> ${out}`); process.exit(0);
}
const P = { light: { tail: 1.2, decay: 4.5, off: 16 }, mosque: { tail: 2.2, decay: 2.6, off: 9 }, hall: { tail: 3.2, decay: 1.8, off: 6 } };
const c = P[preset] ?? P.mosque;
const dry = path.join(tmp, "dry.wav"), ir = path.join(tmp, "ir.wav"), wet = path.join(tmp, "wet.wav");
ff(["-i", inp, "-af", `aformat=sample_rates=48000:channel_layouts=mono,apad=pad_dur=${c.tail}`, "-vn", dry]);
ff(["-f", "lavfi", "-i", `anoisesrc=color=pink:duration=${c.tail}:sample_rate=48000:amplitude=0.8`, "-af", `aformat=channel_layouts=mono,afade=t=in:d=0.004,volume='exp(-t*${c.decay})':eval=frame,lowpass=f=3800,highpass=f=180`, ir]);
ff(["-i", dry, "-i", ir, "-filter_complex", "[0:a][1:a]afir=gtype=-1:irnorm=-1:dry=1:wet=0.01[w]", "-map", "[w]", wet]);
const dryMean = mean(inp), wetMean = mean(wet);
const gain = dryMean - c.off - wetMean;   // dB to bring the wet to (dry mean - offset)
const r = ff(["-i", dry, "-i", wet, "-filter_complex", `[1:a]volume=${gain.toFixed(2)}dB[w];[0:a][w]amix=inputs=2:normalize=0:duration=longest,alimiter=limit=0.95[o]`, "-map", "[o]", out]);
if (r.status) { console.error(r.stderr); process.exit(1); }
console.log(`reverb(${preset}): wet ${gain.toFixed(1)} dB relative -> ${out}`);
