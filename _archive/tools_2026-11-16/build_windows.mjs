// Source clips + person mattes for the "words behind the body" windows (landscape AND portrait), on the GPU (NVDEC / RVM / NVENC).
//   node tools/build_windows.mjs <cut.mp4> <outDir> <headCentreX_inSource> <t1> <t2> ...     (t = start seconds of each 3.8 s window in the CUT video)
// Writes: <outDir>/all.mp4 (windows joined, 114 frames each), .tmp/<name>/alpha_l.mp4 + alpha_p.mp4 (mattes), <outDir>/headx.json (head centre x per window, landscape),
//         .tmp/<name>/all_p.mp4 (portrait crop 9:16 around the head).  Then: render the graphics layer (project's Behind / BehindP comps) and compose with tools/behind_compose.mjs.
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

const [cutFile, outDir, headCx, ...ts] = process.argv.slice(2);
const root = "S:/AI_Tools/Remotion_Workspace";
const PY = "S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe";
const name = path.basename(outDir);
const work = path.join(root, ".tmp", name);
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(work, { recursive: true });
const run = (cmd, args) => execFileSync(cmd, args, { stdio: "inherit", cwd: root });
const list = [];
ts.forEach((t, i) => {
  const w = path.join(outDir, `w${i}.mp4`);
  // exactly 114 frames per window so the offsets stay aligned (-t would give 114 or 115)
  run("ffmpeg", ["-v", "error", "-y", "-ss", String(t), "-i", cutFile, "-frames:v", "114", "-r", "30", "-an", "-c:v", "h264_nvenc", "-preset", "p5", "-rc", "vbr", "-cq", "12", "-b:v", "0", "-g", "15", "-bf", "0", "-pix_fmt", "yuv420p", w]);
  list.push(`file 'w${i}.mp4'`); // relative to list.txt itself (the concat demuxer resolves it from the list's folder)
});
fs.writeFileSync(path.join(outDir, "list.txt"), list.join("\n"));
const all = path.join(outDir, "all.mp4");
run("ffmpeg", ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", path.join(outDir, "list.txt"), "-c", "copy", all]);
const alphaL = path.join(work, "alpha_l.mp4");
run(PY, ["tools/matte_rvm.py", all, alphaL, "--ratio", "0.5", "--reset", "114"]);
// head centre of each window (median x of matte pixels in the top 420 rows, middle frame)
const measure = `
import cv2, numpy as np, json, sys
cap=cv2.VideoCapture(sys.argv[1]); n=int(sys.argv[2]); xs=[]
for w in range(n):
    cap.set(cv2.CAP_PROP_POS_FRAMES, w*114+57); ok,fr=cap.read()
    g=fr[:,:,0] if fr.ndim==3 else fr
    ys,x=np.where(g[0:420,:]>128)
    xs.append(round(float(np.median(x)),1) if len(x) else 960.0)
json.dump(xs,open(sys.argv[3],'w')); print(xs)
`;
fs.writeFileSync(path.join(work, "measure.py"), measure);
run(PY, [path.join(work, "measure.py"), alphaL, String(ts.length), path.join(outDir, "headx.json")]);
// portrait: 608x1080 around the head, scaled to 1080x1920
const cx = Math.round(Number(headCx) - 304);
const allP = path.join(work, "all_p.mp4");
run("ffmpeg", ["-v", "error", "-y", "-i", all, "-vf", `crop=608:1080:${cx}:0,scale=1080:1920:flags=lanczos`, "-c:v", "libx264", "-preset", "veryfast", "-crf", "12", "-g", "15", "-an", allP]);
run(PY, ["tools/matte_rvm.py", allP, path.join(work, "alpha_p.mp4"), "--ratio", "0.4", "--reset", "114"]);
console.log("windows ready in", outDir, "| mattes in", work);
