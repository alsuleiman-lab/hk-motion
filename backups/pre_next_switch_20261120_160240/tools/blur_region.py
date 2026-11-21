"""Heavy hard-edged blur of whole rectangles over time windows (a woman's clip card: the whole card is blurred, user 2026-11-13).
Usage: python tools/blur_region.py in.mp4 out.mp4 a-b:x,y,w,h [a-b:x,y,w,h ...]
  a-b = seconds of THIS video; x,y,w,h = pixels. Audio copied. The blur is a strong down/up-scale (nothing recognisable survives), sharp rectangle edges."""
import sys, subprocess, cv2, numpy as np
src, dst = sys.argv[1:3]
wins = []
for a in sys.argv[3:]:
    r, b = a.split(":"); t0, t1 = [float(v) for v in r.split("-")]; x, y, w, h = [int(float(v)) for v in b.split(",")]
    wins.append((t0, t1, x, y, w, h))
cap = cv2.VideoCapture(src); fps = cap.get(5); W = int(cap.get(3)); H = int(cap.get(4))
p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-", "-i", src, "-map", "0:v", "-map", "1:a?",
                      "-c:v", "h264_nvenc", "-preset", "p5", "-rc", "vbr", "-cq", "18", "-b:v", "0", "-g", "15", "-pix_fmt", "yuv420p", "-c:a", "copy", dst], stdin=subprocess.PIPE)
i = 0
while True:
    ok, f = cap.read()
    if not ok: break
    t = i / fps
    for t0, t1, x, y, w, h in wins:
        if t0 <= t <= t1:
            x0, y0, x1, y1 = max(0, x), max(0, y), min(W, x + w), min(H, y + h)
            roi = f[y0:y1, x0:x1]
            small = cv2.resize(roi, (max(3, roi.shape[1] // 40), max(3, roi.shape[0] // 40)), interpolation=cv2.INTER_AREA)
            small = cv2.GaussianBlur(small, (0, 0), 1.2)
            f[y0:y1, x0:x1] = cv2.GaussianBlur(cv2.resize(small, (roi.shape[1], roi.shape[0]), interpolation=cv2.INTER_LINEAR), (0, 0), 12)
    p.stdin.write(f.tobytes()); i += 1
p.stdin.close(); p.wait(); print("frames", i)
