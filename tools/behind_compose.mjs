// Put graphics BETWEEN the speaker and the wall (the user's definition):
//   layer 1 = original video (the wall/room)  ->  layer 2 = graphics (alpha)  ->  layer 3 = the speaker cut out with the RVM matte
//   node tools/behind_compose.mjs <source.mp4> <alpha_matte.mp4> <graphics_alpha.mov> <out.mp4>
// graphics_alpha.mov: render the graphics-only composition with  --codec=prores --prores-profile=4444 --pixel-format=yuva444p10le --image-format=png
// (Remotion cannot reliably stack a transparent webm over another video, so the final stacking is done here in ffmpeg.)
import { execFileSync } from "child_process";
const [src, alpha, gfx, out] = process.argv.slice(2);
const fc = [
  "[0:v]format=yuv420p,split[bg][fgsrc]",
  "[bg][1:v]overlay=format=auto[withgfx]",
  "[2:v]format=gray,lutyuv=y='clip((val-40)*1.45,0,255)',erosion,gblur=sigma=1.1[a]",
  "[fgsrc][a]alphamerge[fg]",
  "[withgfx][fg]overlay=format=auto,format=yuv420p[v]",
].join(";");
execFileSync("ffmpeg", ["-hide_banner", "-v", "error", "-y", "-i", src, "-i", gfx, "-i", alpha, "-filter_complex", fc, "-map", "[v]", "-map", "0:a?", "-c:v", "libx264", "-preset", "veryfast", "-crf", "15", "-c:a", "aac", out], { stdio: "inherit" });
console.log("composed ->", out);
