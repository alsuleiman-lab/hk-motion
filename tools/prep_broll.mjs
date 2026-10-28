// Prepare a stock B-roll clip so platform algorithms don't flag it as re-used content, and so flaws are hidden.
//   node tools/prep_broll.mjs prep  <in.mp4> <out.mp4> [--sec 2] [--w 1920] [--h 1080]
//   node tools/prep_broll.mjs sheet <in.mp4> <sheet.png>     (contact sheet of the whole clip, to check for women/faces BEFORE use)
//
// Standing rules (PREFERENCES.md): every B-roll video is modified (lighting + motion), is at most 2 s long,
// appears about once per 3 minutes of video, and must not contain women.
import { execFileSync } from "child_process";
import crypto from "crypto";

const [cmd, input, output, ...rest] = process.argv.slice(2);
const flag = (n, d) => { const i = rest.indexOf("--" + n); return i >= 0 ? rest[i + 1] : d; };
const ff = (args) => execFileSync("ffmpeg", ["-hide_banner", "-v", "error", "-y", ...args], { stdio: "inherit" });

if (cmd === "sheet") {
  ff(["-i", input, "-vf", "fps=2,scale=320:-1,tile=6x5", "-frames:v", "1", output]);
  console.log("sheet:", output);
} else if (cmd === "prep") {
  const sec = Math.min(2, parseFloat(flag("sec", "2")));          // hard cap: never more than 2 s
  const W = flag("w", "1920"), H = flag("h", "1080");
  // deterministic per-file variation so no two clips get the same treatment
  const h = crypto.createHash("md5").update(output).digest();
  const r = (i, a, b) => a + (h[i] / 255) * (b - a);
  const crop = r(0, 0.90, 0.95);                                   // crop 5-10% (hides edges / watermarks)
  const cx = r(1, 0.2, 0.8), cy = r(2, 0.2, 0.8);
  const speed = r(3, 1.03, 1.08);
  const eq = `eq=brightness=${r(4, -0.05, 0.05).toFixed(3)}:contrast=${r(5, 1.05, 1.14).toFixed(3)}:saturation=${r(6, 1.05, 1.2).toFixed(3)}:gamma=${r(7, 0.94, 1.06).toFixed(3)}`;
  const hue = `hue=h=${r(8, -7, 7).toFixed(1)}`;
  const vf = [
    `crop=iw*${crop.toFixed(3)}:ih*${crop.toFixed(3)}:(iw-iw*${crop.toFixed(3)})*${cx.toFixed(2)}:(ih-ih*${crop.toFixed(3)})*${cy.toFixed(2)}`,
    `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}`,
    eq, hue, "noise=alls=5:allf=t", "vignette=PI/5", `setpts=PTS/${speed.toFixed(3)}`, "fps=30",
  ].join(",");
  ff(["-i", input, "-t", String(sec * speed), "-vf", vf, "-t", String(sec), "-an", "-map_metadata", "-1", "-c:v", "libx264", "-preset", "veryfast", "-crf", "17", "-g", "15", "-pix_fmt", "yuv420p", output]);
  console.log(`prepped ${output}: <= ${sec}s, crop ${crop.toFixed(2)}, speed x${speed.toFixed(2)}`);
} else {
  console.log("usage: prep <in> <out> | sheet <in> <png>");
}
