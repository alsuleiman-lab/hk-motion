"""Gate: no visible person in a clip window or a B-roll without a decision (user 2026-11-13: a woman's clip was shown unblurred; B-roll with girls/hands was added).
Usage: python -I tools/clip_people_gate.py <spec.json>
Samples the spec's cut video (spec.cut) once per second INSIDE every spec.splits clip rectangle (and every `bgclip`/`full` window over the whole frame),
runs YuNet and lists every face still visible. A face is accepted only when spec.clipPeople covers its second with an explicit decision:
  "clipPeople": [{"from": 0, "to": 38.1, "who": "man (name)", "ok": true}]      (ok = a MAN: shown as it is)
A woman's face (or anyone not decided) must be blurred in the cut video (tools/blur_region.py) — a blurred face is not detected, so the gate passes only then.
Also fails when a split clip window carries no decision at all and a face is detected.  Exit 1 on any open face."""
import sys, json, cv2, numpy as np, os
sys.stdout.reconfigure(encoding="utf-8")
spec = json.load(open(sys.argv[1], encoding="utf-8"))
cut = os.path.join("public", spec["cut"])
model = ".tmp/models/yunet.onnx"
cap = cv2.VideoCapture(cut); fps = cap.get(5); W = int(cap.get(3)); H = int(cap.get(4)); n = int(cap.get(7))
det = cv2.FaceDetectorYN.create(model, "", (W, H), 0.7, 0.3, 5000)
dec = spec.get("clipPeople", [])
rects = []
for s in spec.get("splits", []): rects.append((s["from"], s["to"], s["clip"]["x"], 0, s["clip"]["w"], H, "نافذة المقطع"))
stock = [it for it in spec.get("items", []) if it.get("t") in ("bgclip", "full") and it.get("src")]
bad = []
for t0, t1, x, y, w, h, what in rects:
    t = t0
    while t < t1:
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(t * fps)); ok, f = cap.read()
        if ok:
            _, faces = det.detect(f)
            for fc in (faces if faces is not None else []):
                cx, cy = fc[0] + fc[2] / 2, fc[1] + fc[3] / 2
                if x <= cx <= x + w and y <= cy <= y + h and not any(d["from"] <= t <= d["to"] and d.get("ok") for d in dec):
                    bad.append((round(t, 1), what, int(cx), int(cy)))
        t += 1.0
# B-roll files are scanned themselves (the cut video does not contain them): a face in the stock clip = not allowed without a decision
for it in stock:
    sp = os.path.join("public", it["src"])
    if not os.path.exists(sp): continue
    c2 = cv2.VideoCapture(sp); n2 = int(c2.get(7)); w2 = int(c2.get(3)); h2 = int(c2.get(4)); d2 = cv2.FaceDetectorYN.create(model, "", (w2, h2), 0.7, 0.3, 5000)
    for k in range(0, max(1, n2), max(1, n2 // 6)):
        c2.set(cv2.CAP_PROP_POS_FRAMES, k); ok, fr = c2.read()
        if ok:
            _, fc = d2.detect(fr)
            if fc is not None and len(fc): bad.append((round(k / max(1, c2.get(5)), 1), "B-roll " + it["src"], int(fc[0][0]), int(fc[0][1])))
if bad:
    print(f"✘ clip_people_gate: {len(bad)} وجه ظاهر بلا قرار (امرأة أو غير محسوم) — اطمسه في فيديو القص (tools/blur_region.py) أو سجّل «رجل» في clipPeople بعد النظر بعينك:")
    for b in bad[:12]: print("  ", b)
    sys.exit(1)
print(f"✔ clip_people_gate: لا وجه ظاهر بلا قرار في {len(rects)} نافذة")
