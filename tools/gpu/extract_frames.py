"""Extract frames (and their ±1 neighbours) of a video as PNG <prefix>_NNNNNN.png, one sequential decode pass (no seeking: exact frame numbers).
  python tools/gpu/extract_frames.py <video> <outdir> <prefix> <frame,frame,...> [--neighbours]"""
import os, subprocess, sys
import numpy as np
import cv2

video, out, pre, lst = sys.argv[1:5]
nb = "--neighbours" in sys.argv
want = sorted({g for f in map(int, lst.split(",")) for g in ((f - 1, f, f + 1) if nb else (f,)) if g >= 0})
os.makedirs(out, exist_ok=True)
w, h = map(int, subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", video], capture_output=True, text=True).stdout.strip().split(","))
p = subprocess.Popen(["ffmpeg", "-v", "error", "-hwaccel", "cuda", "-i", video, "-map", "0:v", "-fps_mode", "passthrough", "-frames:v", str(want[-1] + 1), "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], stdout=subprocess.PIPE)
n = w * h * 3
s = set(want)
for i in range(want[-1] + 1):
    b = p.stdout.read(n)
    if len(b) < n:
        break
    if i in s:
        cv2.imwrite(os.path.join(out, f"{pre}_{i:06d}.png"), np.frombuffer(b, np.uint8).reshape(h, w, 3))
p.kill()
print("extracted", len(os.listdir(out)), "frames")
