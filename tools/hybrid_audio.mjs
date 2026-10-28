// Audio of the lesson without Remotion (the Remotion audio-only render still drives Chrome for every frame = very slow):
// the speech track of tir_cut_v3.mp4 + the light whoosh effects (times/levels from src/sfxConfig.ts via the exported timeline), mixed by ffmpeg.
//   node tools/hybrid_audio.mjs <timeline.json> <out.aac> [startFrame] [endFrame]
import { execFileSync } from "child_process";
import fs from "fs";
const [tlPath, out, a = "0", b = ""] = process.argv.slice(2);
const root = "S:/AI_Tools/Remotion_Workspace";
const tl = JSON.parse(fs.readFileSync(tlPath, "utf8"));
const start = Number(a), end = b === "" ? tl.end : Number(b);
const t0 = start / 30, dur = (end - start + 1) / 30;
const segs = tl.segs;
const SRC = root + "/" + (tl.src || "public/tir_cut_v3.mp4");
const inputs = segs ? ["-i", SRC] : ["-ss", String(t0), "-t", String(dur), "-i", SRC];
const parts = [], mixIn = ["[0:a]"];
if (segs) { // the 3-minute essence: the speech of each piece, joined with tiny fades so the cuts do not click
  segs.forEach((g, k) => { const st = g.a / 30, d = g.n / 30; parts.push(`[0:a]atrim=start=${st}:duration=${d},asetpts=PTS-STARTPTS,afade=t=in:d=0.012,afade=t=out:st=${(d - 0.012).toFixed(3)}:d=0.012[k${k}]`); });
  parts.push(segs.map((_, k) => `[k${k}]`).join("") + `concat=n=${segs.length}:v=0:a=1[sp]`);
  mixIn[0] = "[sp]";
}
let n = 1;
for (const s of tl.sfx) {
  const at = s.at - t0;
  if (at < -2 || at > dur) continue;
  inputs.push("-i", root + "/public/sfx/whoosh.wav");
  const ms = Math.max(0, Math.round(at * 1000));
  parts.push(`[${n}:a]atrim=0:2,adelay=${ms}|${ms},volume=${s.vol}[s${n}]`);
  mixIn.push(`[s${n}]`);
  n++;
}
const fc = (parts.length ? parts.join(";") + ";" : "") + mixIn.join("") + `amix=inputs=${mixIn.length}:duration=first:normalize=0:dropout_transition=0,aresample=48000[a]`;
execFileSync("ffmpeg", ["-v", "error", "-y", ...inputs, "-filter_complex", fc, "-map", "[a]", "-c:a", "aac", "-b:a", "192k", out]);
console.log("audio ->", out, "sfx", n - 1);
