"""Compare frames of the GPU renderer with the hybrid reference (both dumped with --dump dir:frames).
  python tools/gpu/compare_frames.py --ref <dir with hy_NNNNNN.png> --test <dir with gp_NNNNNN.png> --out <dir> [--frames a,b,c]
Writes, per frame: a panel  reference | GPU renderer | difference map (|diff| x 8, plus a red overlay where any channel differs by > 8 levels),
and summary.json: PSNR per frame (RGB, 8-bit), min/mean, max abs diff, % of pixels differing by > 2 / > 8 levels, and the TIMING check:
edge correlation (Sobel magnitude, normalised cross-correlation) of the test frame against the reference frames f-1, f, f+1 when those are
dumped too — the best match must be f (a picture one frame early/late correlates better with the neighbour)."""
import argparse, glob, json, math, os, re
import numpy as np
import cv2

ap = argparse.ArgumentParser()
ap.add_argument("--ref", required=True)
ap.add_argument("--test", required=True)
ap.add_argument("--out", required=True)
ap.add_argument("--ref-prefix", default="hy")
ap.add_argument("--test-prefix", default="gp")
ap.add_argument("--frames", default="")
ap.add_argument("--panel-width", type=int, default=2880)
a = ap.parse_args()
os.makedirs(a.out, exist_ok=True)


def frames_in(d, pre):
    return sorted(int(m.group(1)) for f in glob.glob(os.path.join(d, pre + "_*.png")) if (m := re.search(pre + r"_(\d+)\.png$", f)))


ref_set = set(frames_in(a.ref, a.ref_prefix))
frames = [int(x) for x in a.frames.split(",") if x] if a.frames else [f for f in frames_in(a.test, a.test_prefix) if f in ref_set]
load = lambda d, p, f: cv2.imread(os.path.join(d, f"{p}_{f:06d}.png"), cv2.IMREAD_COLOR)


def psnr(x, y):
    mse = np.mean((x.astype(np.float64) - y.astype(np.float64)) ** 2)
    return float("inf") if mse == 0 else 10 * math.log10(255.0 ** 2 / mse)


def edges(im):
    g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(np.float32)
    gx, gy = cv2.Sobel(g, cv2.CV_32F, 1, 0, ksize=3), cv2.Sobel(g, cv2.CV_32F, 0, 1, ksize=3)
    e = np.sqrt(gx * gx + gy * gy)
    return (e - e.mean()) / (e.std() + 1e-6)


def ncc(e1, e2):
    return float(np.mean(e1 * e2))


rows = []
for f in frames:
    R, T = load(a.ref, a.ref_prefix, f), load(a.test, a.test_prefix, f)
    if R is None or T is None:
        rows.append({"frame": f, "error": "missing"}); continue
    d = np.abs(R.astype(np.int16) - T.astype(np.int16))
    dm = d.max(axis=2)
    row = {"frame": f, "psnr": round(psnr(R, T), 2), "maxAbs": int(dm.max()), "pctOver2": round(100 * float((dm > 2).mean()), 3), "pctOver8": round(100 * float((dm > 8).mean()), 3)}
    # timing: test frame vs reference f-1 / f / f+1 (on edges of the whole picture: the moving video dominates)
    nb = {k: load(a.ref, a.ref_prefix, f + k) for k in (-1, 0, 1)}
    if nb[-1] is not None or nb[1] is not None:
        et = edges(T)
        sc = {k: round(ncc(et, edges(im)), 5) for k, im in nb.items() if im is not None}
        best = max(sc, key=sc.get)
        row["timing"] = {"ncc": sc, "best": best, "ok": best == 0}
    rows.append(row)
    # panel
    heat = cv2.applyColorMap(np.clip(dm.astype(np.int32) * 8, 0, 255).astype(np.uint8), cv2.COLORMAP_INFERNO)
    heat[dm > 8] = (0, 0, 255)
    lab = lambda im, s: cv2.putText(im.copy(), s, (24, 60), cv2.FONT_HERSHEY_SIMPLEX, 1.6, (0, 255, 255), 3, cv2.LINE_AA)
    panel = np.hstack([lab(R, f"hybrid (reference) {f}"), lab(T, "GPU renderer"), lab(heat, f"|diff|x8  PSNR {row['psnr']} dB")])
    s = a.panel_width / panel.shape[1]
    cv2.imwrite(os.path.join(a.out, f"panel_{f:06d}.jpg"), cv2.resize(panel, None, fx=s, fy=s, interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 90])

ok = [r for r in rows if "psnr" in r]
fin = [r["psnr"] for r in ok if math.isfinite(r["psnr"])]
summ = {"frames": len(rows), "psnrMin": min((r["psnr"] for r in ok), default=None), "psnrMean": round(sum(fin) / len(fin), 2) if fin else (float("inf") if ok else None),
        "framesBelow45": [r["frame"] for r in ok if r["psnr"] < 45], "timingChecked": sum(1 for r in ok if "timing" in r), "timingFail": [r["frame"] for r in ok if "timing" in r and not r["timing"]["ok"]], "rows": rows}
json.dump(summ, open(os.path.join(a.out, "summary.json"), "w"), indent=1)
print(json.dumps({k: v for k, v in summ.items() if k != "rows"}))
