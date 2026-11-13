"""PSNR of every GPU dump <dir>/gpu/hy_NNNNNN.png against Remotion's still <dir>/ref/fN.png (alpha composited over black, as an MP4 shows it).
   python -I tools/gpu/psnr_pairs.py <dir>   -> last line: {"N": dB, ...}; a panel <dir>/panel_N.jpg (Remotion | GPU | |diff|x6) when under 40 dB."""
import json, os, sys
import cv2, numpy as np

d = sys.argv[1]
out = {}
for fn in sorted(os.listdir(os.path.join(d, "gpu"))) if os.path.isdir(os.path.join(d, "gpu")) else []:
    if not fn.startswith("hy_"):
        continue
    f = int(fn[3:9])
    rp = os.path.join(d, "ref", f"f{f}.png")
    if not os.path.exists(rp):
        continue
    r = cv2.imread(rp, cv2.IMREAD_UNCHANGED).astype(np.float64)
    if r.ndim == 3 and r.shape[2] == 4:
        r = r[..., :3] * r[..., 3:4] / 255.0
    g = cv2.imread(os.path.join(d, "gpu", fn)).astype(np.float64)
    if r.shape != g.shape:
        out[str(f)] = -1.0
        continue
    mse = ((r - g) ** 2).mean()
    p = 99.0 if mse < 1e-10 else 10 * np.log10(255 ** 2 / mse)
    out[str(f)] = round(float(p), 2)
    if p < 40:
        h = 360 if g.shape[1] >= g.shape[0] else 640
        pan = np.hstack([r, g, np.clip(np.abs(r - g) * 6, 0, 255)])
        cv2.imwrite(os.path.join(d, f"panel_{f}.jpg"), cv2.resize(pan.astype(np.uint8), (int(pan.shape[1] * h / pan.shape[0]), h)))
print(json.dumps(out))
