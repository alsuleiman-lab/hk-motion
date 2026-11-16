"""Fill see-through holes in the dark torso/arms of a portrait matte (1080x1920 crop; RVM leaves black-robe areas semi-transparent when they merge with the dark monitor/desk behind).
Usage: python tools/matte_body_fill.py <src.mp4> <alpha_in.mp4> <alpha_out.mp4> [--y0 1000] [--y1 1760] [--k 121] [--vmax 135]
Inside the rows y0..y1 only: closing of the person mask with a big ellipse, then every pixel that the closing adds AND is dark in the source (robe, v < vmax) becomes opaque.
Skin/chair/wall pixels are never added, so the neck/chair gaps above y0 and the desk below y1 are untouched. The new edge is feathered."""
import sys, subprocess, cv2, numpy as np
src, alp, out = sys.argv[1:4]
a = sys.argv[4:]
opt = lambda n, d: type(d)(a[a.index("--" + n) + 1]) if ("--" + n) in a else d
y0, y1, k, vmax = opt("y0", 1000), opt("y1", 1760), opt("k", 121), opt("vmax", 135)
cs, ca = cv2.VideoCapture(src), cv2.VideoCapture(alp)
w, h = int(cs.get(3)), int(cs.get(4))
p = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{w}x{h}", "-r", "30", "-i", "-", "-c:v", "libx264", "-crf", "10", "-preset", "fast", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
ker = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
n = 0
while True:
    ok1, fs = cs.read(); ok2, fa = ca.read()
    if not (ok1 and ok2): break
    g = cv2.cvtColor(fa, cv2.COLOR_BGR2GRAY)
    reg = g[y0:y1]
    m = (reg > 128).astype(np.uint8) * 255
    closed = cv2.morphologyEx(m, cv2.MORPH_CLOSE, ker)
    v = cv2.cvtColor(fs, cv2.COLOR_BGR2HSV)[y0:y1, :, 2]
    add = ((closed > 0) & (m == 0) & (cv2.GaussianBlur(v, (0, 0), 3) < vmax)).astype(np.uint8) * 255
    add = cv2.GaussianBlur(add, (0, 0), 3.0)
    g[y0:y1] = np.maximum(reg, add)
    p.stdin.write(g.tobytes()); n += 1
p.stdin.close(); p.wait()
print("frames", n, "->", out)
