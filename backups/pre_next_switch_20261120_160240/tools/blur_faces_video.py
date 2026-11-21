"""Hard-edged blur that FOLLOWS a woman's face inside a clip rectangle of a video (user order 2026-11-17, «أنت تعمل عليها بلور»; القواعد: امرأة في مقطع ← طمس حادّ يتبع وجهها).
Usage: python -I tools/blur_faces_video.py in.mp4 out.mp4 --rect x,y,w,h --range a-b [--range c-d ...] [--grow 2.2] [--hold 1.2] [--log faces.json]
  rect  = the clip window in video pixels (only faces INSIDE it are blurred; his own face is never touched)
  range = seconds of THIS video where a woman may be (outside the ranges nothing is touched)
  Per frame YuNet (.tmp/models/yunet.onnx) finds the faces in the rect; every face box is grown by --grow (hard rectangle edges, nothing recognisable survives);
  a frame with no detection inside a range keeps the last box for --hold seconds (profile / half-out-of-frame faces), and before the first detection takes the first box.
  A range that never finds a face blurs its WHOLE rect (the clip cannot be tracked → the whole clip, القواعد). Audio copied, NVENC encode."""
import sys, json, subprocess, cv2, numpy as np

argv = sys.argv[1:]
src, dst = argv[0], argv[1]
rect = None; ranges = []; grow = 2.2; hold = 1.2; logf = None
i = 2
while i < len(argv):
    if argv[i] == "--rect": rect = [int(float(v)) for v in argv[i + 1].split(",")]; i += 2
    elif argv[i] == "--range": a, b = argv[i + 1].split("-"); ranges.append((float(a), float(b))); i += 2
    elif argv[i] == "--grow": grow = float(argv[i + 1]); i += 2
    elif argv[i] == "--hold": hold = float(argv[i + 1]); i += 2
    elif argv[i] == "--log": logf = argv[i + 1]; i += 2
    else: i += 1
if not rect or not ranges: sys.exit("usage: --rect x,y,w,h --range a-b")
rx, ry, rw, rh = rect

cap = cv2.VideoCapture(src); fps = cap.get(5); W = int(cap.get(3)); H = int(cap.get(4))
det = cv2.FaceDetectorYN.create(".tmp/models/yunet.onnx", "", (rw, rh), 0.5, 0.3, 5000)
in_range = lambda t: any(a <= t <= b for a, b in ranges)

# pass 1: detect
boxes = {}   # frame -> [(x,y,w,h)] in video pixels
n = 0
while True:
    ok, f = cap.read()
    if not ok: break
    t = n / fps
    if in_range(t):
        crop = f[ry:ry + rh, rx:rx + rw]
        det.setInputSize((rw, rh))
        _, faces = det.detect(crop)
        boxes[n] = [(rx + int(fc[0]), ry + int(fc[1]), int(fc[2]), int(fc[3])) for fc in (faces if faces is not None else [])]
    n += 1
total = n
# fill gaps: hold the last box(es) for `hold` seconds, back-fill the first box
rng_frames = sorted(boxes)
last = None; last_i = -999; out_boxes = {}
for k in rng_frames:
    if boxes[k]: last, last_i = boxes[k], k; out_boxes[k] = boxes[k]
    elif last is not None and (k - last_i) / fps <= hold: out_boxes[k] = last
    else: out_boxes[k] = []
first = next((out_boxes[k] for k in rng_frames if out_boxes[k]), None)
whole = []
if first is not None:
    for k in rng_frames:
        if out_boxes[k]: break
        out_boxes[k] = first
else:
    whole = ranges   # never found: blur the whole rect over the range
log = {"frames": total, "fps": fps, "faces": {str(k): out_boxes[k] for k in rng_frames if out_boxes[k]}, "whole_rect_ranges": whole,
       "detected_frames": sum(1 for k in rng_frames if boxes[k]), "range_frames": len(rng_frames)}
if logf: json.dump(log, open(logf, "w"), indent=1)

def blur(f, x0, y0, x1, y1):
    x0, y0, x1, y1 = max(0, x0), max(0, y0), min(W, x1), min(H, y1)
    if x1 <= x0 or y1 <= y0: return
    roi = f[y0:y1, x0:x1]
    small = cv2.resize(roi, (max(3, roi.shape[1] // 40), max(3, roi.shape[0] // 40)), interpolation=cv2.INTER_AREA)
    small = cv2.GaussianBlur(small, (0, 0), 1.2)
    f[y0:y1, x0:x1] = cv2.GaussianBlur(cv2.resize(small, (roi.shape[1], roi.shape[0]), interpolation=cv2.INTER_LINEAR), (0, 0), 12)

# pass 2: blur + encode
cap.release(); cap = cv2.VideoCapture(src)
p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-", "-i", src, "-map", "0:v", "-map", "1:a?",
                      "-c:v", "h264_nvenc", "-preset", "p5", "-rc", "vbr", "-cq", "18", "-b:v", "0", "-g", "15", "-pix_fmt", "yuv420p", "-c:a", "copy", dst], stdin=subprocess.PIPE)
n = 0
while True:
    ok, f = cap.read()
    if not ok: break
    t = n / fps
    if any(a <= t <= b for a, b in whole): blur(f, rx, ry, rx + rw, ry + rh)
    for (x, y, w, h) in out_boxes.get(n, []):
        cx, cy = x + w / 2, y + h / 2
        bw, bh = w * grow, h * grow * 1.15
        blur(f, int(cx - bw / 2), int(cy - bh / 2), int(cx + bw / 2), int(cy + bh / 2))
    p.stdin.write(f.tobytes()); n += 1
p.stdin.close(); p.wait()
print(json.dumps({k: log[k] for k in ("frames", "detected_frames", "range_frames", "whole_rect_ranges")}, ensure_ascii=False))
