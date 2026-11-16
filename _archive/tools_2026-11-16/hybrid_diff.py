"""mean/max abs difference (0-255) between two images, plus where the worst block is.   python hybrid_diff.py a.png b.png"""
import sys, cv2, numpy as np
a = cv2.imread(sys.argv[1]).astype(np.float32); b = cv2.imread(sys.argv[2]).astype(np.float32)
d = np.abs(a - b).mean(axis=2)
bs = 64; H, W = d.shape
blocks = d[:H // bs * bs, :W // bs * bs].reshape(H // bs, bs, W // bs, bs).mean(axis=(1, 3))
y, x = np.unravel_index(blocks.argmax(), blocks.shape)
print(f"mean={d.mean():.2f} p99={np.percentile(d,99):.1f} max={d.max():.0f} worst64block@({x*bs},{y*bs})={blocks.max():.1f} frac>24={(d>24).mean()*100:.2f}%")
