"""Per-frame boxes of WOMEN's faces in a clip window (YuNet face detector + who-is-a-woman rules), for tools/blur_clip_keys.py.
Usage: python tools/women_faces.py <video> <model.onnx> <hand_keys.json> <out.json> a-b [a-b ...]
Woman = a face (1) right above the purple jacket blob, or (2) inside a hand-keyed woman box (hand_keys.json groups, linear in time) grown by 140 px.
Output: blur_clip_keys groups, face box grown x1.9 (hair); gaps <= 0.7 s held."""
import sys, json, cv2, numpy as np
src, model, hk, out = sys.argv[1:5]
force = [tuple(float(v) for v in a.split("-")) for a in (sys.argv[sys.argv.index("--force") + 1].split(",") if "--force" in sys.argv else [])]
args = [a for a in sys.argv[5:] if "--force" not in a and a not in (sys.argv[sys.argv.index("--force") + 1] if "--force" in sys.argv else "")]
wins = [tuple(float(v) for v in a.split("-")) for a in args]
cap = cv2.VideoCapture(src); fps = cap.get(5)
hand = [sorted(g) for g in json.load(open(hk))]
def hand_boxes(t):
    r = []
    for g in hand:
        if g[0][0] - 0.3 <= t <= g[-1][0] + 0.3:
            ts = [k[0] for k in g]; r.append([float(np.interp(t, ts, [k[j] for k in g])) for j in (1, 2, 3, 4)])
    return r
det = cv2.FaceDetectorYN.create(model, "", (740, 790), 0.55, 0.3, 50)
def purple(frame):
    hsv = cv2.cvtColor(cv2.resize(frame, None, fx=.5, fy=.5), cv2.COLOR_BGR2HSV)
    m = cv2.inRange(hsv, (116, 70, 50), (146, 255, 255)); m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)); m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    if n < 2: return None
    k = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    if st[k, cv2.CC_STAT_AREA] < 500: return None
    x, y, w, h, _a = st[k]; return (x * 2, y * 2, w * 2, h * 2)   # in crop pixels
tracks = []   # each: list of [t,x,y,w,h]
def put(t, b):
    for tr in tracks:
        lt = tr[-1]
        if t - lt[0] <= 0.7 and abs((lt[1] + lt[3] / 2) - (b[0] + b[2] / 2)) < 160 and abs((lt[2] + lt[4] / 2) - (b[1] + b[3] / 2)) < 160 and lt[0] < t:
            tr.append([t] + b); return
    tracks.append([[t] + b])
for a, b in wins:
    cap.set(cv2.CAP_PROP_POS_FRAMES, int(round(a * fps)))
    for i in range(int(round(a * fps)), int(round(b * fps)) + 1):
        ok, f = cap.read()
        if not ok: break
        t = i / fps; crop = f[140:930, :740]
        _, faces = det.detect(crop)
        if faces is None: continue
        pj = purple(crop); hb = hand_boxes(t); pbest = None
        if pj is not None:
            pc = pj[0] + pj[2] / 2; cand = [j for j, fc in enumerate(faces) if fc[2] >= 0.1 * pj[2] and pj[1] - 200 <= fc[1] + fc[3] / 2 <= pj[1] + 40 and pj[0] - 0.6 * pj[2] <= fc[0] + fc[2] / 2 <= pj[0] + 1.6 * pj[2]]
            if cand: pbest = max(cand, key=lambda j: faces[j][1] + faces[j][3] / 2)   # the woman sits in front: her face is the lowest one above her jacket
        for j, fc in enumerate(faces):
            x, y, w, h = [float(v) for v in fc[:4]]; cx, cy = x + w / 2, y + h / 2
            woman = any(fa <= t <= fb for fa, fb in force)   # --force a-b,c-d : every face in these spans is a woman
            if pbest is not None and j == pbest: woman = True
            for (hx, hy, hw, hh) in hb:
                if hx - 70 <= cx <= hx + hw + 70 and hy - 70 <= cy + 140 <= hy + hh + 70: woman = True   # hand keys are full-frame pixels, the crop starts at y = 140
            if woman:
                gw, gh = w * 1.9, h * 1.9; put(t, [cx - gw / 2, cy + 140 - gh / 2 - gh * 0.05, gw, gh])
json.dump([tr for tr in tracks if len(tr) > 1], open(out, "w")); print("tracks", len(tracks), "boxes", sum(len(t) for t in tracks))
