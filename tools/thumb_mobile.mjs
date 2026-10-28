// Phone-size legibility test for covers/thumbnails (skill thumbnail-design).
// usage: node tools/thumb_mobile.mjs <out.png> <thumb1.png> [thumb2.png …]
// Each row = one thumbnail as YouTube shows it: home feed on a phone (360 px wide), "up next"/search on a phone (168 px), and 168 px in grey
// (if the idea is gone in grey, the contrast is carried by colour only). Rows are drawn on the dark and the light YouTube UI with the duration badge.
// Pass: at 168 px you can still read every headline word and recognise each face in one glance.
import { execFileSync } from "node:child_process";
const [out, ...ins] = process.argv.slice(2);
if (!out || !ins.length) { console.error("usage: node tools/thumb_mobile.mjs <out.png> <thumb.png> …"); process.exit(2); }
const args = ["-loglevel", "error", "-y"];
ins.forEach((f) => args.push("-i", f));
const parts = [];
ins.forEach((_, i) => {
  // the duration badge YouTube paints bottom-right
  const badge = (w, h) => `drawbox=x=${w - Math.round(w * 0.16)}:y=${h - Math.round(h * 0.17)}:w=${Math.round(w * 0.13)}:h=${Math.round(h * 0.12)}:color=black@0.8:t=fill`;
  parts.push(`[${i}]split=3[a${i}][b${i}][c${i}]`);
  parts.push(`[a${i}]scale=360:202,${badge(360, 202)},pad=400:240:20:19:color=0x0f0f0f[A${i}]`);
  parts.push(`[b${i}]scale=168:94,${badge(168, 94)},pad=200:240:16:73:color=0x0f0f0f[B${i}]`);
  parts.push(`[c${i}]scale=168:94,hue=s=0,pad=200:240:16:73:color=0xffffff[C${i}]`);
  parts.push(`[A${i}][B${i}][C${i}]hstack=3[R${i}]`);
});
parts.push(ins.map((_, i) => `[R${i}]`).join("") + (ins.length > 1 ? `vstack=${ins.length}` : "null") + ",scale=iw*2:ih*2:flags=neighbor[o]");
args.push("-filter_complex", parts.join(";"), "-map", "[o]", "-frames:v", "1", out);
execFileSync("ffmpeg", args, { stdio: "inherit" });
console.log("sheet →", out);
