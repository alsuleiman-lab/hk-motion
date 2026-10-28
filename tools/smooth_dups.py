"""Smooth a screen-recording cut whose frames were duplicated by a frame-rate conversion («الفيديو يرتجف وليس انسيابياً», user 2026-10-22): every frame that is a
repeat of the previous one (measured on the webcam side of the frame) is replaced by the 50/50 blend of its neighbours, so motion becomes even. Audio is copied.
Usage: python tools/smooth_dups.py <in.mp4> <out.mp4> [--x0 900] [--thr 0.35]
Streams the frames (3-frame window, constant memory): OpenCV decodes, NVENC (ffmpeg) encodes; prints how many frames were repaired."""
import os, sys, subprocess, cv2, numpy as np
src, out = sys.argv[1], sys.argv[2]
a = sys.argv[3:]
x0 = int(a[a.index("--x0") + 1]) if "--x0" in a else 900
thr = float(a[a.index("--thr") + 1]) if "--thr" in a else 0.35
cap = cv2.VideoCapture(src)
fps = cap.get(cv2.CAP_PROP_FPS); W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)); H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
# The default x0=900 targets the webcam side of landscape footage. For portrait
# clips this can fall beyond the frame and produce an empty image slice.
if x0 >= W:
    x0 = 0
tmp = out.replace(".mp4", "_noaudio.mp4")
ff = subprocess.Popen(["ffmpeg", "-hide_banner", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
                       "-c:v", "h264_nvenc", "-preset", "p5", "-rc", "vbr", "-cq", "15", "-b:v", "0", "-g", "15", "-bf", "0", "-pix_fmt", "yuv420p", tmp], stdin=subprocess.PIPE)
def gray(f): return cv2.cvtColor(f[::4, x0::4], cv2.COLOR_BGR2GRAY).astype(np.float32)
def isdup(g1, g0): return float(np.abs(g1 - g0).mean()) < thr
ok, prev = cap.read(); ok2, cur = cap.read(); ok3, nxt = cap.read()
n = 0; fixed = 0
if not ok2:
    ff.stdin.write(prev.tobytes()); n = 1
else:
    ff.stdin.write(prev.tobytes()); n = 1
    gp, gc = gray(prev), gray(cur)
    while ok2:
        gn = gray(nxt) if ok3 else None
        out_f = cur
        if ok3 and isdup(gc, gp) and not isdup(gn, gc):
            out_f = cv2.addWeighted(prev, 0.5, nxt, 0.5, 0); fixed += 1
        ff.stdin.write(out_f.tobytes()); n += 1
        prev, gp = cur, gc
        cur, gc, ok2 = nxt, gn, ok3
        ok3, nxt = cap.read() if ok3 else (False, None)
ff.stdin.close(); ff.wait()
subprocess.run(["ffmpeg", "-hide_banner", "-v", "error", "-y", "-i", tmp, "-i", src, "-map", "0:v", "-map", "1:a", "-c", "copy", out], check=True)
os.remove(tmp)
print(f"frames {n}, duplicates repaired {fixed} ({100 * fixed / max(n, 1):.1f}%) -> {out}")
