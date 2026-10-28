"""Blur faces in an image (OpenCV Haar cascades; frontal + profile + flipped profile).
Usage: python tools/blur_faces.py in.jpg out.jpg [--min 28] [--extra x,y,w,h ...]
Detection is imperfect: ALWAYS review the output and add --extra rectangles (pixels, original size) for missed faces."""
import sys, cv2, numpy as np
src, dst = sys.argv[1], sys.argv[2]
mn = 28; extra = []; manual = False
a = sys.argv[3:]
i = 0
while i < len(a):
    if a[i] == "--min": mn = int(a[i+1]); i += 2
    elif a[i] == "--manual": manual = True; i += 1
    elif a[i] == "--extra": extra.append(tuple(int(v) for v in a[i+1].split(","))); i += 2
    else: i += 1
img = cv2.imread(src); g = cv2.equalizeHist(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY))
H, W = g.shape
cas = lambda n: cv2.CascadeClassifier(cv2.data.haarcascades + n)
boxes = []
for n in (() if manual else ("haarcascade_frontalface_default.xml", "haarcascade_frontalface_alt2.xml", "haarcascade_profileface.xml")):
    c = cas(n)
    for r in c.detectMultiScale(g, 1.08, 4, minSize=(mn, mn)): boxes.append(tuple(int(v) for v in r))
c = cas("haarcascade_profileface.xml") if not manual else None
for (x, y, w, h) in ([] if manual else c.detectMultiScale(cv2.flip(g, 1), 1.08, 4, minSize=(mn, mn))): boxes.append((W - x - w, y, w, h))
boxes += extra
# merge overlapping
merged = []
for b in sorted(boxes, key=lambda b: -b[2]*b[3]):
    if not any(min(b[0]+b[2], m[0]+m[2]) - max(b[0], m[0]) > 0.5*min(b[2], m[2]) and min(b[1]+b[3], m[1]+m[3]) - max(b[1], m[1]) > 0.5*min(b[3], m[3]) for m in merged): merged.append(b)
out = img.copy()
for (x, y, w, h) in merged:
    p = int(0.25*w); x0, y0, x1, y1 = max(0, x-p), max(0, y-p), min(W, x+w+p), min(H, y+h+p)
    roi = out[y0:y1, x0:x1]
    k = max(15, (x1-x0)//2 | 1)
    roi = cv2.GaussianBlur(roi, (k, k), 0); roi = cv2.GaussianBlur(roi, (k, k), 0)
    mask = np.zeros(roi.shape[:2], np.uint8); cv2.ellipse(mask, ((x1-x0)//2, (y1-y0)//2), ((x1-x0)//2, (y1-y0)//2), 0, 0, 360, 255, -1)
    mask = cv2.GaussianBlur(mask, (15, 15), 0)[..., None] / 255.0
    out[y0:y1, x0:x1] = (roi*mask + out[y0:y1, x0:x1]*(1-mask)).astype(np.uint8)
cv2.imwrite(dst, out, [cv2.IMWRITE_JPEG_QUALITY, 92])
print(len(merged), "faces blurred:", merged)
