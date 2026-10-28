import sys, cv2, numpy as np
src, out = sys.argv[1], sys.argv[2]
fill_holes = len(sys.argv) > 3 and sys.argv[3] == "fill"
img = cv2.imread(src)
h, w = img.shape[:2]
near = (img.min(axis=2) > 236).astype(np.uint8)
flood = np.zeros((h + 2, w + 2), np.uint8)
for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2)]:
    if near[seed[1], seed[0]]:
        cv2.floodFill(near.copy(), flood, seed, 2, flags=4 | (255 << 8))
alpha = np.where(flood[1:-1, 1:-1] > 0, 0, 255).astype(np.uint8)
if fill_holes:
    cnts, _ = cv2.findContours((alpha > 128).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    filled = np.zeros_like(alpha)
    for c in cnts:
        if cv2.contourArea(c) > 3000: cv2.drawContours(filled, [c], -1, 255, -1)
    alpha = filled
n, lab, stats, _ = cv2.connectedComponentsWithStats((alpha > 128).astype(np.uint8))
if n > 1:
    big = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    alpha = np.where(lab == big, alpha, 0).astype(np.uint8)
alpha = cv2.erode(alpha, np.ones((3, 3), np.uint8), iterations=1)
alpha = cv2.GaussianBlur(alpha, (0, 0), 1.0)
rgba = np.dstack([img, alpha])
ys, xs = np.where(alpha > 10)
cv2.imwrite(out, rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1])
print(out)
