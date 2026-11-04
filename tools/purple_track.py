"""Head boxes of a woman in a purple jacket, found per frame by colour (hand keys + flow lose her in fast camera pans).
Usage: python tools/purple_track.py <video> <out.json> a-b [a-b ...]   (seconds; clip area = left 740 px)
out.json = blur_clip_keys groups [[t,x,y,w,h],...]: one per run of frames where the jacket is seen (small gaps held)."""
import sys, json, cv2, numpy as np
src, out = sys.argv[1], sys.argv[2]
wins = [tuple(float(v) for v in a.split("-")) for a in sys.argv[3:]]
cap = cv2.VideoCapture(src); fps = cap.get(5); S = 0.5
groups = []
for a, b in wins:
    cap.set(cv2.CAP_PROP_POS_FRAMES, int(round(a * fps))); run = []; miss = 0; last = None
    for i in range(int(round(a * fps)), int(round(b * fps)) + 1):
        ok, f = cap.read()
        if not ok: break
        t = i / fps
        hsv = cv2.cvtColor(cv2.resize(f[140:930, :740], None, fx=S, fy=S), cv2.COLOR_BGR2HSV)
        m = cv2.inRange(hsv, (116, 70, 50), (146, 255, 255))
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)); m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
        n, lab, st, cen = cv2.connectedComponentsWithStats(m)
        best = None
        if n > 1:
            k = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
            if st[k, cv2.CC_STAT_AREA] > 500: best = st[k]
        if best is not None:
            x, y, w, h, ar = best; ys = np.where(lab[:, x:x + w] == k)[0]; top = float(np.percentile(ys, 3))
            W = w / S; hd = min(230.0, max(170.0, 0.7 * W)); cx = (x + w / 2) / S; wd = min(190.0, max(140.0, 0.45 * W))
            # head sits right above the shoulder line (+20 px overlap), generous box (face + hair)
            by = top / S + 140 - hd + 30; bx = max(0.0, cx - wd / 2)
            if cx - wd / 2 < 0: wd = cx + wd / 2
            last = [round(t, 4), bx, by, wd, hd]; run.append(last); miss = 0
        else:
            miss += 1
            if last is not None and miss <= 4: run.append([round(t, 4)] + last[1:])
            elif run: groups.append(run); run = []; last = None
    if run: groups.append(run)
json.dump(groups, open(out, "w")); print("groups", len(groups), "frames", sum(len(g) for g in groups))
