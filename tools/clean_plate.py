"""Clean plate of the room WITHOUT him (2026-11-20, «أنا أختفي شوي شوي… لما أقول زائد ثمنطعش»): the picture an under-layer effect draws where he was, so
his cut-out can fade away and only the room is left (src/BehindFx.tsx `plate`). The camera and the room do not move; he does, so most of what he covers in one
frame is seen in another:
  1. one frame every `--every` s of the cut (each repeated 4 times so the recurrent matting model settles, state reset per frame) → RVM alpha (tools/matte_gpu.py);
  2. per pixel, the median of the frames where he is NOT there (alpha < 0.5, grown by `--grow` px: the chair and the room stay, his outline and shadow go);
  3. what he never uncovers (the middle of the chair behind his back, the desk under his arms) is filled from its surroundings (Telea at quarter size,
     strongly blurred, a little grain): a soft out-of-focus chair, not a real picture — the under-layer effect covers the middle with its own picture (the
     badge disc does) and darkens the rest.
Usage: python -X utf8 tools/clean_plate.py <cut.mp4> <out.jpg> [--every 2] [--from 0] [--to <end>] [--grow 24]
Low priority, ≤ 4 threads; prints the share of the frame that had to be filled."""
import sys, os, subprocess, tempfile
import numpy as np, cv2

a = sys.argv[1:]
src, out = a[0], a[1]
opt = lambda n, d: type(d)(a[a.index("--" + n) + 1]) if ("--" + n) in a else d
every, t0, t1, grow = opt("every", 2.0), opt("from", 0.0), opt("to", -1.0), opt("grow", 24)
try: os.nice(10)
except Exception: pass
try:
    import psutil; psutil.Process().nice(psutil.BELOW_NORMAL_PRIORITY_CLASS)
except Exception: pass
PY = sys.executable
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
info = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration", "-of", "default=nw=1", src], capture_output=True, text=True).stdout
kv = dict(l.split("=", 1) for l in info.split() if "=" in l)
W, H, dur = int(kv["width"]), int(kv["height"]), float(kv["duration"])
if t1 <= 0: t1 = dur
tmp = tempfile.mkdtemp(prefix="plate_", dir=os.path.join(ROOT, ".tmp"))
clip, mat = os.path.join(tmp, "s.mp4"), os.path.join(tmp, "m.mp4")
step = max(1, round(every * 30))
# the sampled frames, each held for 4 frames (setpts ×4 then fps=30 duplicates them)
r = subprocess.run(["ffmpeg", "-v", "error", "-y", "-threads", "4", "-ss", f"{t0:.3f}", "-to", f"{t1:.3f}", "-i", src, "-an",
                    "-vf", f"select='not(mod(n\\,{step}))',setpts=N*4/30/TB,fps=30", "-c:v", "h264_nvenc", "-preset", "p5", "-rc", "constqp", "-qp", "12", clip], capture_output=True, text=True)
if r.returncode: sys.exit("trim: " + r.stderr)
r = subprocess.run([PY, "-X", "utf8", os.path.join(ROOT, "tools", "matte_gpu.py"), clip, mat, "--ratio", "0.25", "--no-clean", "--reset", "4"], capture_output=True, text=True, cwd=ROOT)
if r.returncode: sys.exit("matte: " + r.stdout + r.stderr)

def frames(path, gray):
    c = 1 if gray else 3
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-threads", "4", "-i", path, "-f", "rawvideo", "-pix_fmt", "gray" if gray else "bgr24", "-"], stdout=subprocess.PIPE)
    n = W * H * c
    while True:
        b = p.stdout.read(n)
        if len(b) < n: break
        yield np.frombuffer(b, np.uint8).reshape(H, W, c) if c == 3 else np.frombuffer(b, np.uint8).reshape(H, W)

pics, masks = [], []
k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * grow + 1, 2 * grow + 1))
for i, (f, m) in enumerate(zip(frames(clip, False), frames(mat, True))):
    if i % 4 != 3: continue                      # the 4th copy: the model has settled on this frame
    pics.append(f.copy()); masks.append(cv2.dilate((m > 127).astype(np.uint8), k) > 0)
n = len(pics)
if n < 5: sys.exit(f"too few frames ({n})")
P, M = np.stack(pics), np.stack(masks)          # (n, H, W, 3), (n, H, W)
del pics, masks
plate = np.zeros((H, W, 3), np.uint8)
seen = (~M).sum(0)
for y0 in range(0, H, 60):                      # median over the frames that show the room there (row bands: bounded memory)
    blk = P[:, y0:y0 + 60].astype(np.float32)
    blk[M[:, y0:y0 + 60]] = np.nan
    med = np.nanmedian(blk, axis=0)
    plate[y0:y0 + 60] = np.nan_to_num(med).clip(0, 255).astype(np.uint8)
hole = (seen < 3).astype(np.uint8)
share = hole.mean()
if hole.any():
    # Telea at quarter size keeps the LOCAL colours (the white chair stays white; a pyramid push-pull averaged the curtains into a beige blob), and a strong
    # blur removes its propeller-like streaks (look 2026-11-20); a little grain so it does not read as a flat patch
    h2, q = cv2.dilate(hole, np.ones((15, 15), np.uint8)), 4
    small = cv2.inpaint(cv2.resize(plate, (W // q, H // q), interpolation=cv2.INTER_AREA), cv2.resize(h2, (W // q, H // q), interpolation=cv2.INTER_NEAREST), 20, cv2.INPAINT_TELEA)
    fill = cv2.resize(cv2.GaussianBlur(small, (0, 0), 9), (W, H), interpolation=cv2.INTER_CUBIC).astype(np.float32)
    fill += np.random.default_rng(7).normal(0, 1.6, fill.shape)
    wgt = cv2.GaussianBlur(h2.astype(np.float32), (0, 0), 6)[..., None]
    plate = (plate * (1 - wgt) + fill * wgt).clip(0, 255).astype(np.uint8)
os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
cv2.imwrite(out, plate, [cv2.IMWRITE_JPEG_QUALITY, 93])
if "--hole" in a: cv2.imwrite(a[a.index("--hole") + 1], hole * 255)   # where the room was never seen (for a look)
for f in (clip, mat):
    try: os.remove(f)
    except OSError: pass
try: os.rmdir(tmp)
except OSError: pass
print(f"clean_plate: {n} frames, filled {share * 100:.1f}% of the frame → {out}")
