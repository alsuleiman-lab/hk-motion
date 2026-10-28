"""Stronger background isolation (user 2026-10-22: «عزل خلفية أقوى — أحياناً الكرسي يظهر / انتبه لأخطاء العزل»).
RVM leaves the white mesh chair (and bits of the room) semi-transparent beside the head/shoulders. This post-process cleans the alpha WITHOUT eating skin/ears/glasses:
  1. unsaturated, bright pixels (chair mesh) are removed above `--ymax` OUTSIDE the face column (`--xl`..`--xr`); inside the column only on the semi-transparent fringe;
  2. grey, non-skin pixels in the narrow strips beside the head (x<`--xs0` or x>`--xs1`, above the shoulders) are removed;
  3. row-run filter on the head zone: per row only the run of alpha that holds the head centre (± a margin) is kept, so detached chair stubs vanish;
  4. only the biggest blob (+ big blobs: hands/cup) is kept, thin leftovers vanish with an opening on the head zone, the edge is shaved 1 px and feathered.
Usage: python tools/matte_strong.py <src.mp4> <rvm_alpha.mp4> <out_alpha.mp4> [--ymax 1050] [--vmin 150] [--smax 38] [--xl 300] [--xr 800] [--xs0 335] [--xs1 790]
src and alpha must match (same size and frame count). Output = grayscale video (white = person) for ffmpeg alphamerge."""
import sys, subprocess, cv2, numpy as np
src, alp, out = sys.argv[1:4]
a = sys.argv[4:]
opt = lambda n, d: type(d)(a[a.index("--" + n) + 1]) if ("--" + n) in a else d
ymax, vmin, smax = opt("ymax", 1050), opt("vmin", 150), opt("smax", 38)
xl, xr, xs0, xs1 = opt("xl", 300), opt("xr", 800), opt("xs0", 335), opt("xs1", 790)
cs, ca = cv2.VideoCapture(src), cv2.VideoCapture(alp)
fps = cs.get(cv2.CAP_PROP_FPS); W = int(cs.get(cv2.CAP_PROP_FRAME_WIDTH)); H = int(cs.get(cv2.CAP_PROP_FRAME_HEIGHT))
ff = subprocess.Popen(["ffmpeg", "-hide_banner", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
                       "-c:v", "libx264", "-preset", "veryfast", "-crf", "8", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
k3 = np.ones((3, 3), np.uint8); k5 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)); k11 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
HEAD_Y = 780
n = 0
while True:
    ok1, f = cs.read(); ok2, g = ca.read()
    if not (ok1 and ok2): break
    al = g[:, :, 0].astype(np.float32) / 255.0
    al0 = al.copy()
    hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV)
    white = ((hsv[:, :, 2] >= vmin) & (hsv[:, :, 1] <= smax)).astype(np.uint8)
    white[ymax:, :] = 0
    col = np.zeros_like(white); col[:, xl:xr] = 1
    white = (((white > 0) & (col == 0)) | ((white > 0) & (al < 0.9))).astype(np.uint8)
    side = np.zeros_like(white); side[:770, :xs0] = 1; side[:770, xs1:] = 1
    greyish = ((hsv[:, :, 2] > 95) & (hsv[:, :, 1] < 45)).astype(np.uint8)
    _y, _x = np.nonzero(al0[150:520] > 0.5); _cx = int(np.median(_x)) if _x.size else W // 2
    side[:, max(_cx - 255, 0):_cx + 255] = 0   # never treat the face's own shaded skin as chair
    white = ((white > 0) | ((side > 0) & (greyish > 0))).astype(np.uint8)
    white = cv2.dilate(white, k5)
    al[white > 0] = 0
    # adaptive side rule: bright unsaturated (chair mesh) beside the head/beard, relative to the head centre
    ys0, xs0_ = np.nonzero(al[150:520] > 0.5)
    cx0 = int(np.median(xs0_)) if xs0_.size else W // 2
    sd = ((hsv[:, :, 2] >= 125) & (hsv[:, :, 1] <= 50)).astype(np.uint8)
    reg = np.zeros_like(sd); reg[330:980, :max(cx0 - 200, 0)] = 1; reg[330:980, cx0 + 200:] = 1
    reg[640:980, :max(cx0 - 115, 0)] = 1; reg[640:980, cx0 + 115:] = 1   # beard zone is dark: closer margin is safe
    sd = cv2.dilate((sd & reg), k5)
    al[sd > 0] = 0
    # row-run filter on the head zone: keep, per row, only the run of alpha that holds the head centre (or lies within a margin of it)
    head = al[:HEAD_Y] > 0.5
    ys, xs = np.nonzero(head[150:520])
    cx = int(np.median(xs)) if xs.size else W // 2
    lo, hi = cx - 255, cx + 255
    for y in range(HEAD_Y):
        row = head[y]
        if not row.any(): continue
        idx = np.flatnonzero(np.diff(np.concatenate(([0], row.view(np.int8), [0]))))
        for s0, e0 in zip(idx[::2], idx[1::2]):
            if e0 < lo or s0 > hi:
                al[y, s0:e0] = 0
    m = (al > 0.5).astype(np.uint8)
    nb, lab, st, _ = cv2.connectedComponentsWithStats(m, connectivity=8)
    if nb > 1:
        big = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
        keep = np.isin(lab, [big] + [j for j in range(1, nb) if j != big and st[j, cv2.CC_STAT_AREA] > 60000])
        al[~keep] = 0
    hb = (al[:HEAD_Y] > 0.5).astype(np.uint8)
    op = cv2.morphologyEx(hb, cv2.MORPH_OPEN, k11)
    al[:HEAD_Y][(hb > 0) & (op == 0)] = 0
    # close notches at the temple/ear (RVM misses skin there): closing inside the head column only
    hm = (al > 0.5).astype(np.uint8)
    cl = cv2.morphologyEx(hm, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (45, 45)))
    colm = np.zeros_like(cl); colm[:HEAD_Y, max(_cx - 255, 0):_cx + 255] = 1
    al = np.maximum(al, ((cl > 0) & (colm > 0) & (hm == 0)).astype(np.float32))
    # restore dark (hair/beard/earbud) and saturated (skin) pixels the rules ate, near the kept person only (chair is bright+grey, never restored)
    near = cv2.dilate((al > 0.5).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41)))
    keepc = ((hsv[:, :, 2] < 105) | (hsv[:, :, 1] > 55)) & (al0 > 0.5) & (near > 0)
    al[keepc] = np.maximum(al[keepc], al0[keepc])
    al = cv2.erode(al, k3, iterations=1)
    al = cv2.GaussianBlur(al, (0, 0), 1.3)
    al = np.clip((al - 0.08) * 1.12, 0, 1)
    ff.stdin.write((al * 255).astype(np.uint8).tobytes()); n += 1
ff.stdin.close(); ff.wait()
print("frames", n, "->", out)
