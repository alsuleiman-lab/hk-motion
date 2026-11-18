// The sound of the clips he plays inside his recording (user 2026-11-18, spoken in «مذيع يقتل أطفاله»):
//   «لما يكون الصوت من أذن وحدة أعمله من الجهتين … دائماً»  → the clip sound is put on BOTH sides, always;
//   «المقاطع اللي راح أشغلها فيها موسيقى … عندنا أداة جيدة لإزالة الموسيقى استخدمها» → --music: the clip sound loses its music
//   (the local tool S:/AI_Tools/RemoveMusic: UVR MDX-Net through Audio Separator on the GPU, speech stem only).
// His recordings carry three audio tracks: 0 = the mix, 1 = his microphone, 2 = the computer (the clips). The mix is rebuilt from
// his microphone + the fixed computer track and becomes track 0 (what the cut reads); the old mix is kept as the last track.
//   node tools/clip_audio_fix.mjs <p> [--music]        (run after stage prep, before stage cut)
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const [p, ...rest] = process.argv.slice(2);
if (!p) { console.error("usage: node tools/clip_audio_fix.mjs <p> [--music]"); process.exit(2); }
process.chdir(path.resolve(import.meta.dirname, ".."));
const SRC = path.join("public", `${p}_src.mp4`), T = path.join(".tmp", p, "clip_audio");
if (!fs.existsSync(SRC)) { console.error(`✘ ${SRC} missing (run stage prep first)`); process.exit(1); }
fs.mkdirSync(T, { recursive: true });
const run = (cmd, args) => { const r = spawnSync(cmd, args, { encoding: "utf8", windowsHide: true, maxBuffer: 1 << 26 }); if (r.status !== 0) { console.error(`✘ ${path.basename(cmd)} failed:\n${String(r.stderr).slice(-1500)}`); process.exit(1); } return r; };
const tracks = run("ffprobe", ["-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", SRC]).stdout.trim().split(/\s+/).filter(Boolean).length;
const done = path.join(T, "done.json");
if (fs.existsSync(done)) { console.log(`✔ already fixed (${JSON.parse(fs.readFileSync(done, "utf8")).at}) — nothing to do`); process.exit(0); }
if (tracks < 3) { console.error(`✘ ${tracks} audio track(s): this tool needs the mix + microphone + computer tracks`); process.exit(1); }

const mic = path.join(T, "mic.wav"), pc = path.join(T, "pc.wav");
run("ffmpeg", ["-v", "error", "-y", "-threads", "4", "-i", SRC, "-map", "0:a:1", "-ar", "48000", "-ac", "2", mic, "-map", "0:a:2", "-ar", "48000", "-ac", "2", pc]);
let speech = pc;
if (rest.includes("--music")) {
  const RM = "S:/AI_Tools/RemoveMusic", SEP = `${RM}/.venv/Scripts/audio-separator.exe`, out = path.join(T, "stems");
  if (!fs.existsSync(SEP)) { console.error(`✘ the music removal tool is missing: ${SEP}`); process.exit(1); }
  fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  console.log("… removing the music from the clip sound (UVR MDX-Net on the GPU)");
  run(SEP, [path.resolve(pc), "--model_filename", "UVR_MDXNET_KARA_2.onnx", "--single_stem", "Vocals", "--output_format", "WAV", "--output_dir", path.resolve(out), "--model_file_dir", `${RM}/models`]);
  speech = fs.readdirSync(out).filter((f) => /vocals/i.test(f)).map((f) => path.join(out, f))[0];
  if (!speech) { console.error("✘ no speech stem came out of the separator"); process.exit(1); }
}
// both sides: each side gets both channels (a one-sided clip is heard from the two ears; a balanced one stays balanced)
const mix = path.join(T, "mix.wav");
run("ffmpeg", ["-v", "error", "-y", "-threads", "4", "-i", mic, "-i", speech, "-filter_complex",
  "[1:a]aresample=48000,pan=stereo|c0=0.7*c0+0.7*c1|c1=0.7*c0+0.7*c1[pc];[0:a][pc]amix=inputs=2:normalize=0:duration=longest,alimiter=limit=0.95[a]", "-map", "[a]", mix]);
const tmp = SRC.replace(/\.mp4$/, ".fixing.mp4");
run("ffmpeg", ["-v", "error", "-y", "-threads", "4", "-i", SRC, "-i", mix, "-map", "0:v:0", "-map", "1:a:0", "-map", "0:a:1", "-map", "0:a:2", "-map", "0:a:0",
  "-c:v", "copy", "-c:a:0", "aac", "-b:a:0", "256k", "-c:a:1", "copy", "-c:a:2", "copy", "-c:a:3", "copy", "-movflags", "+faststart", tmp]);
fs.renameSync(tmp, SRC);
const a16 = path.join(".tmp", p, "a16k.wav");   /* the audio gate compares the cut with this: rebuilt from the new track 0 */
if (fs.existsSync(a16)) run("ffmpeg", ["-v", "error", "-y", "-i", SRC, "-map", "0:a:0", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", a16]);
for (const f of [mic, pc, mix]) fs.rmSync(f, { force: true });
fs.writeFileSync(done, JSON.stringify({ at: new Date().toISOString(), music: rest.includes("--music") }, null, 1));
console.log(`✔ ${SRC}: clip sound on both sides${rest.includes("--music") ? ", music removed" : ""}; track 0 = his microphone + the fixed clip sound (old mix kept as the last track)`);
