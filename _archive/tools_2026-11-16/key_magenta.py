"""Cut a generated object out of a flat MAGENTA background (user 2026-11-13: paper cut-outs for the paper-montage B-roll).
Usage: python -I tools/key_magenta.py in.png out.png    → transparent PNG cropped to the object (soft edge, magenta spill removed)."""
import sys, numpy as np
from PIL import Image
im = Image.open(sys.argv[1]).convert("RGB"); a = np.asarray(im).astype(np.float32)
R, G, B = a[..., 0], a[..., 1], a[..., 2]
mag = np.minimum(R, B) - G                      # how magenta a pixel is (high = background)
alpha = np.clip(1.0 - (mag - 40.0) / 90.0, 0.0, 1.0)
# flood from the border only: keep interior magenta-ish shapes (e.g. red/purple details) by requiring connectivity to the border
from collections import deque
h, w = alpha.shape; bg = np.zeros((h, w), bool); dq = deque()
for x in range(w):
    for y in (0, h - 1):
        if alpha[y, x] < 0.5: bg[y, x] = True; dq.append((y, x))
for y in range(h):
    for x in (0, w - 1):
        if alpha[y, x] < 0.5 and not bg[y, x]: bg[y, x] = True; dq.append((y, x))
while dq:
    y, x = dq.popleft()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ny, nx = y + dy, x + dx
        if 0 <= ny < h and 0 <= nx < w and not bg[ny, nx] and alpha[ny, nx] < 0.75: bg[ny, nx] = True; dq.append((ny, nx))
al = np.where(bg, 0.0, 1.0) * 1.0
edge = (alpha > 0.0) & (alpha < 1.0) & ~bg
al = np.where(bg, 0.0, np.where(edge, alpha, 1.0))
# despill: pull R and B down toward G on edge pixels
spill = np.clip(mag, 0, None) * (al < 1.0)
R2 = R - spill * 0.8; B2 = B - spill * 0.8
out = np.dstack([R2, G, B2, al * 255.0]).clip(0, 255).astype(np.uint8)
img = Image.fromarray(out, "RGBA"); bb = img.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox()
if bb: img = img.crop(bb)
img.save(sys.argv[2]); print(sys.argv[2], img.size)
