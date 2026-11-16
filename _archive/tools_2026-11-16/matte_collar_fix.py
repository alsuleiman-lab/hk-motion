"""Smooth the ragged saw-tooth edge that RVM + matte_strong leave where the white chair mesh meets the robe collar (both sides of the neck, 1080x1920 portrait crop).
Usage: python tools/matte_collar_fix.py <alpha_in.mp4> <alpha_out.mp4> [--y0 740] [--y1 1010] [--k 41]
Inside the two shoulder windows only (outside the beard column) the alpha gets a big median blur + a hard re-threshold, which removes thin spikes and speckles and keeps the robe edge smooth."""
import sys, subprocess, cv2, numpy as np
src, out = sys.argv[1:3]
a = sys.argv[3:]
opt = lambda n, d: type(d)(a[a.index("--" + n) + 1]) if ("--" + n) in a else d
y0, y1, k = opt("y0", 740), opt("y1", 1010), opt("k", 41)
cap = cv2.VideoCapture(src)
w, h = int(cap.get(3)), int(cap.get(4))
p = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{w}x{h}", "-r", "30", "-i", "-", "-c:v", "libx264", "-crf", "10", "-preset", "fast", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
wins = [(180, 420), (660, 900)]
n = 0
while True:
    ok, fr = cap.read()
    if not ok: break
    g = cv2.cvtColor(fr, cv2.COLOR_BGR2GRAY)
    for x0, x1 in wins:
        reg = g[y0:y1, x0:x1]
        m = cv2.medianBlur(reg, k)
        m = cv2.GaussianBlur(m, (0, 0), 2.0)
        m = np.clip((m.astype(np.float32) - 110) * 3.0, 0, 255).astype(np.uint8)
        # feather the window border so the fix blends into the untouched alpha
        wgt = np.ones(reg.shape, np.float32)
        f = 25
        wgt[:f, :] *= np.linspace(0, 1, f)[:, None]; wgt[-f:, :] *= np.linspace(1, 0, f)[:, None]
        wgt[:, :f] *= np.linspace(0, 1, f)[None, :]; wgt[:, -f:] *= np.linspace(1, 0, f)[None, :]
        g[y0:y1, x0:x1] = (reg * (1 - wgt) + m * wgt).astype(np.uint8)
    p.stdin.write(g.tobytes()); n += 1
p.stdin.close(); p.wait()
print("frames", n, "->", out)
