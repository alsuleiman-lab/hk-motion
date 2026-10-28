"""Overlap test between graphics and the speaker's face/hair (user rule 2026-10-18: «فحص آلي لازم»).
Usage: python tools/face_check.py <with_graphics.png> <without_graphics.png> [--region x,y,w,h] [--thr 0.008]
 - the face is detected in the render WITHOUT graphics (OpenCV Haar: frontal default/alt2 + profile + flipped profile), the biggest box wins
 - the box is grown to include the hair/head: +38% up, +8% sides, down to the END OF THE BEARD (+1.9x face height; --nobeard = only +5%)
 - "changed pixels" = |with - without| > 14 on any channel (so ANY overlay counts, even a half-transparent one)
 - prints one JSON line {face:[x,y,w,h]|null, zone:[...], overlap:<changed share of the zone>, ok:bool}; ok=False when overlap > thr (default 0.8%)
 - --region x,y,w,h (render pixels) limits BOTH the search and the zone to the rect where the person is shown (use it for video-in-a-card layouts)
 - no face found => ok=null (warn: look at the frame yourself)"""
import sys, json, cv2, numpy as np

with_p, without_p = sys.argv[1], sys.argv[2]
a = sys.argv[3:]
region = tuple(int(v) for v in a[a.index("--region") + 1].split(",")) if "--region" in a else None
thr = float(a[a.index("--thr") + 1]) if "--thr" in a else 0.008
A = cv2.imread(with_p); B = cv2.imread(without_p)
H, W = B.shape[:2]
if A.shape != B.shape:
    A = cv2.resize(A, (W, H))
g = cv2.equalizeHist(cv2.cvtColor(B, cv2.COLOR_BGR2GRAY))
ox, oy = 0, 0
cas = lambda n: cv2.CascadeClassifier(cv2.data.haarcascades + n)
min_side = max(36, int(min(g.shape) * 0.035))
boxes = []
for n in ("haarcascade_frontalface_default.xml", "haarcascade_frontalface_alt2.xml"):
    boxes += [tuple(b) for b in cas(n).detectMultiScale(g, 1.08, 4, minSize=(min_side, min_side))]
if not boxes:
    prof = cas("haarcascade_profileface.xml")
    boxes += [tuple(b) for b in prof.detectMultiScale(g, 1.08, 3, minSize=(min_side, min_side))]
    fl = cv2.flip(g, 1)
    boxes += [(g.shape[1] - x - w, y, w, h) for (x, y, w, h) in prof.detectMultiScale(fl, 1.08, 3, minSize=(min_side, min_side))]
if not boxes:
    print(json.dumps({"face": None, "ok": None, "note": "no face found in the clean render: check the frame by eye"}))
    sys.exit(0)
if region:   # keep only faces centred inside the region
    rx, ry, rw, rh = region
    inside = [b for b in boxes if rx <= b[0] + b[2] / 2 <= rx + rw and ry <= b[1] + b[3] / 2 <= ry + rh]
    boxes = inside or boxes
x, y, w, h = max(boxes, key=lambda b: b[2] * b[3])
x += ox; y += oy
zx0, zx1 = max(0, int(x - 0.08 * w)), min(W, int(x + 1.08 * w))
beard = "--nobeard" not in a   # the Sheikh's beard is protected too (rule 2026-10-18): the zone runs down to the end of the beard
zy0, zy1 = max(0, int(y - 0.38 * h)), min(H, int(y + (1.9 if beard else 1.05) * h))
if region:   # the person lives inside this rect (e.g. a polaroid video card): its frame/border is design, not a cover-up
    rx, ry, rw, rh = region
    zx0, zx1, zy0, zy1 = max(zx0, rx), min(zx1, rx + rw), max(zy0, ry), min(zy1, ry + rh)
d = np.abs(A.astype(np.int16) - B.astype(np.int16)).max(axis=2) > 14
zone = d[zy0:zy1, zx0:zx1]
ov = float(zone.mean()) if zone.size else 0.0
print(json.dumps({"face": [int(x), int(y), int(w), int(h)], "zone": [zx0, zy0, zx1, zy1], "overlap": round(ov, 4), "ok": ov <= thr}))
