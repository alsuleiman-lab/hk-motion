"""Face track of the speaker's recording, for tools/face_fast.mjs (user 2026-10-27: «فحص الوجه سريع جداً»).
Usage: python tools/face_track.py <video> <out.json> [--fps 2]
 - ffmpeg decodes on the NVIDIA card and scales to 480x270 (NVDEC + scale_cuda), FPS frames per second, piped raw into ONE OpenCV process
 - Haar frontal (default, then alt2) on each small frame, profile as fallback; HIS face is followed by continuity (not the biggest box)
 - prints/writes {"fps":F, "W":1920, "H":1080, "boxes":[[t, x, y, w, h] | [t, null], ...]} in SOURCE pixels (1920x1080 basis)
The camera is fixed, so missing detections are filled later from the nearest ones (face_fast.mjs)."""
import sys, json, subprocess, numpy as np, cv2

video, out = sys.argv[1], sys.argv[2]
fps = float(sys.argv[sys.argv.index("--fps") + 1]) if "--fps" in sys.argv else 2.0
SW, SH = 480, 270
probe = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", video], capture_output=True, text=True).stdout.strip().split(",")
VW, VH = int(probe[0]), int(probe[1])
# cuts built by cut_edl have a keyframe every 0.5 s: decoding keyframes only gives the same 2 fps without decoding the rest (≈5x faster)
kf = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v", "-skip_frame", "nokey", "-show_entries", "frame=pts_time", "-of", "csv=p=0",
                     "-read_intervals", "%+12", video], capture_output=True, text=True).stdout.split()
kf = [float(v) for v in kf if v.replace(".", "", 1).isdigit()]
gaps = {round(b - a, 2) for a, b in zip(kf, kf[1:])}
if len(kf) > 4 and len(gaps) == 1 and 0 < next(iter(gaps)) <= 1.0:
    fps = 1 / next(iter(gaps))
    cmd = ["ffmpeg", "-hide_banner", "-v", "error", "-skip_frame", "nokey", "-hwaccel", "cuda", "-hwaccel_output_format", "cuda", "-i", video,
           "-vf", f"scale_cuda={SW}:{SH},hwdownload,format=nv12,format=gray", "-fps_mode", "passthrough", "-f", "rawvideo", "-"]
else:
    cmd = ["ffmpeg", "-hide_banner", "-v", "error", "-hwaccel", "cuda", "-hwaccel_output_format", "cuda", "-i", video,
           "-vf", f"fps={fps},scale_cuda={SW}:{SH},hwdownload,format=nv12,format=gray", "-f", "rawvideo", "-"]
p = subprocess.Popen(cmd, stdout=subprocess.PIPE, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
cas = lambda n: cv2.CascadeClassifier(cv2.data.haarcascades + n)
front = [cas("haarcascade_frontalface_default.xml"), cas("haarcascade_frontalface_alt2.xml")]
prof = cas("haarcascade_profileface.xml")
sx, sy = VW / SW, VH / SH
cands, i, n = [], 0, SW * SH
while True:
    buf = p.stdout.read(n)
    if len(buf) < n:
        break
    g = cv2.equalizeHist(np.frombuffer(buf, np.uint8).reshape(SH, SW))
    found = []
    for c in front:   # the second cascade only when the first finds nothing; his face is ≥ 40 px at this size
        found += [tuple(b) for b in c.detectMultiScale(g, 1.2, 4, minSize=(40, 40))]
        if found:
            break
    if not found:
        found += [tuple(b) for b in prof.detectMultiScale(g, 1.1, 3, minSize=(18, 18))]
        found += [(SW - x - w, y, w, h) for (x, y, w, h) in prof.detectMultiScale(cv2.flip(g, 1), 1.1, 3, minSize=(18, 18))]
    cands.append([(round(x * sx), round(y * sy), round(w * sx), round(h * sy)) for (x, y, w, h) in found])
    i += 1
p.wait()
# follow HIS face, not the biggest one: faces inside a shown clip can be bigger. Start from the most common position (the camera is fixed and
# he is on screen most of the time), then each frame takes the candidate nearest to the last one; a jump > 450 px = not him (missing)
cx = lambda b: b[0] + b[2] / 2
allx = sorted(cx(b) for c in cands for b in c)
last = (allx[len(allx) // 2] if allx else VW / 2, None)
boxes = []
for k, c in enumerate(cands):
    t = round(k / fps, 3)
    best = min(c, key=lambda b: abs(cx(b) - last[0])) if c else None
    if best and abs(cx(best) - last[0]) <= 450:
        boxes.append([t, *best]); last = (cx(best), best)
    else:
        boxes.append([t, None])
json.dump({"fps": fps, "W": VW, "H": VH, "boxes": boxes}, open(out, "w"))
print(json.dumps({"frames": i, "found": sum(1 for b in boxes if b[1] is not None)}))
