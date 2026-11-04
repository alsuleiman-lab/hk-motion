"""Densify manual keyframe boxes by optical flow (camera pans make sparse keys miss).
Usage: python tools/track_keys.py <video> <keys.json> <out.json> [--scale 0.35]
keys.json = blur_clip_keys groups [[t,x,y,w,h],...]; out.json = same groups with one key per frame between the first and last key.
Between two keys: box centre integrated forward from the first key and backward from the second (Farneback flow, median inside the box), blended by time."""
import sys, json, cv2, numpy as np
src, kf, out = sys.argv[1:4]
sc = float(sys.argv[sys.argv.index("--scale") + 1]) if "--scale" in sys.argv else 0.35
cap = cv2.VideoCapture(src); fps = cap.get(5)
groups = json.load(open(kf)); res = []
def frames(i0, i1):
    cap.set(cv2.CAP_PROP_POS_FRAMES, i0); o = []
    for _ in range(i0, i1 + 1):
        ok, f = cap.read()
        if not ok: return None
        o.append(cv2.resize(cv2.cvtColor(f[:, :740], cv2.COLOR_BGR2GRAY), None, fx=sc, fy=sc))
    return o
def step(a, b, c, w, h):
    fl = cv2.calcOpticalFlowFarneback(a, b, None, 0.5, 3, 15, 3, 5, 1.1, 0)
    x0, y0 = int(max(0, (c[0] - w / 2) * sc)), int(max(0, (c[1] - h / 2) * sc)); x1, y1 = int(min(fl.shape[1], (c[0] + w / 2) * sc)) + 1, int(min(fl.shape[0], (c[1] + h / 2) * sc)) + 1
    if x1 <= x0 or y1 <= y0: return c
    r = fl[y0:y1, x0:x1].reshape(-1, 2)
    return (c[0] + float(np.median(r[:, 0])) / sc, c[1] + float(np.median(r[:, 1])) / sc)
for g in groups:
    g = sorted(g); dense = []
    for k0, k1 in zip(g, g[1:]):
        i0, i1 = int(round(k0[0] * fps)), int(round(k1[0] * fps))
        fr = frames(i0, i1) if i1 > i0 else None
        if fr is None: dense.append(k0); continue
        n = i1 - i0
        c = (k0[1] + k0[3] / 2, k0[2] + k0[4] / 2); fwd = [c]
        for j in range(n): c = step(fr[j], fr[j + 1], c, k0[3], k0[4]); fwd.append(c)
        c = (k1[1] + k1[3] / 2, k1[2] + k1[4] / 2); bwd = [c]
        for j in range(n, 0, -1): c = step(fr[j], fr[j - 1], c, k1[3], k1[4]); bwd.append(c)
        bwd = bwd[::-1]
        for j in range(n):
            s = j / n; cx = (1 - s) * fwd[j][0] + s * bwd[j][0]; cy = (1 - s) * fwd[j][1] + s * bwd[j][1]
            w = (1 - s) * k0[3] + s * k1[3]; h = (1 - s) * k0[4] + s * k1[4]
            dense.append([round((i0 + j) / fps, 4), cx - w / 2, cy - h / 2, w, h])
    dense.append(g[-1]); res.append(dense)
json.dump(res, open(out, "w")); print("groups", len(res), "keys", sum(len(d) for d in res))
