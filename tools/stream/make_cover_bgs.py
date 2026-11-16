# 6 decorated cover backgrounds (1080x1920, dark calm, a repeated eight-point star lattice + vignette) for streams' auto-built clips (user 2026-11-16: a fast template instead of a topic picture per clip).
import math, os, random
from PIL import Image, ImageDraw, ImageFilter
OUT = "public/stream_bg"; os.makedirs(OUT, exist_ok=True)
TONES = [(18, 38, 72), (52, 24, 40), (20, 58, 54), (62, 44, 20), (36, 30, 74), (24, 48, 30)]
def star(d, cx, cy, r, col, w):
    pts = []
    for i in range(16):
        a = math.pi * 2 * i / 16 - math.pi / 2; rr = r if i % 2 == 0 else r * 0.62
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    d.polygon(pts, outline=col, width=w)
for k, t in enumerate(TONES, 1):
    random.seed(k)
    img = Image.new("RGB", (1080, 1920), t); px = img.load()
    for y in range(1920):                                   # vertical gradient
        f = 0.55 + 0.45 * (1 - abs(y - 700) / 1300)
        for x in range(0, 1080):
            px[x, y] = (int(t[0] * f), int(t[1] * f), int(t[2] * f))
    d = ImageDraw.Draw(img); col = tuple(min(255, c + 26) for c in t)
    for gy in range(-1, 9):
        for gx in range(-1, 6):
            star(d, gx * 230 + (115 if gy % 2 else 0), gy * 230, 105, col, 2)
    img = img.filter(ImageFilter.GaussianBlur(1.2))
    img.save(f"{OUT}/bg_{k}.jpg", quality=90)
print("ok")
