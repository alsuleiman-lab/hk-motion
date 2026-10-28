"""Overlap of drawn graphics with the face zone, for tools/face_fast.mjs — ONE process for all stills.
Usage: python tools/face_alpha.py <jobs.json>   jobs = [{"png": path, "zone": [x0, y0, x1, y1]}, ...] (still pixels)
A gfx-only still is transparent wherever nothing is drawn: overlap = share of the zone whose alpha > 25 (≈10 %).
Prints one JSON list [overlap | null] in job order (null = still missing)."""
import sys, json, cv2

out = []
for j in json.load(open(sys.argv[1])):
    im = cv2.imread(j["png"], cv2.IMREAD_UNCHANGED)
    if im is None or im.ndim < 3 or im.shape[2] < 4:
        out.append(None); continue
    x0, y0, x1, y1 = j["zone"]
    a = im[max(0, y0):max(0, y1), max(0, x0):max(0, x1), 3]
    out.append(round(float((a > 25).mean()), 4) if a.size else 0.0)
print(json.dumps(out))
