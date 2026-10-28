"""Find clicks/pops at the joins of a cut (a join can leave a transient even with the 8 ms fades).
Usage: python tools/join_click_scan.py <cut.mp4|wav> <map.json> [--ratio 4]
A join is flagged when the high-frequency (>2.5 kHz) energy in the 12 ms around it is > ratio x the larger of (the median of its neighbourhood ±120 ms, the energy just before/after it): a speech onset keeps its energy, a click does not."""
import sys, json, subprocess
import numpy as np
src, mp = sys.argv[1:3]
ratio = float(sys.argv[sys.argv.index("--ratio") + 1]) if "--ratio" in sys.argv else 4.0
sr = 48000
y = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vn", "-f", "f32le", "-ac", "1", "-ar", str(sr), "-"], capture_output=True).stdout, np.float32).astype(np.float64)
hp = y - np.convolve(y, np.ones(24) / 24, mode="same")   # crude high-pass
segs = json.load(open(mp))["segments"]
bad = []
for x in segs[1:]:
    c = int(x["n"] * sr); w = int(0.006 * sr)
    a = (hp[c - w:c + w] ** 2).mean()
    nb = np.median([(hp[c + k * w * 2 - w:c + k * w * 2 + w] ** 2).mean() for k in range(-10, 11) if k not in (-1, 0, 1)])
    post = (hp[c + w:c + 7 * w] ** 2).mean(); pre = (hp[max(0, c - 7 * w):c - w] ** 2).mean()
    ref = max(nb if nb == nb else 0, post, pre)   # a real speech onset keeps its energy after the join; a click does not
    if ref > 1e-9 and a > ratio * ref and a > 2e-6: bad.append((round(x["n"], 2), round(float(a / ref), 1)))
print("joins:", len(segs) - 1, "| flagged clicks:", len(bad)); print(bad[:40])
