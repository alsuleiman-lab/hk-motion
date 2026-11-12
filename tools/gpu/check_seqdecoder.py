"""Check tools/gpu/nvseq.py (SeqDecoder) against ffmpeg's own decode, frame by frame:
  python -I tools/gpu/check_seqdecoder.py <video> [<video> ...]
  -> per file: sequential pass over every frame, then 200 random jumps (forward, backward, near, far); max |diff| of the NV12 planes must be 0."""
import os, random, subprocess, sys, time
sys.path.insert(0, r"S:\AI_Tools\PyNvVideoCodec_GpuRender\site")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import torch
torch.zeros(1, device="cuda")
from nvseq import SeqDecoder

ok_all = True
for p in sys.argv[1:]:
    s = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", p], capture_output=True, text=True).stdout.strip().split(",")
    w, h = int(s[0]), int(s[1])
    n = w * h * 3 // 2
    ff = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-map", "0:v:0", "-fps_mode", "passthrough", "-f", "rawvideo", "-pix_fmt", "nv12", "-"], capture_output=True).stdout, np.uint8).reshape(-1, n)
    pts = sorted(int(x) for x in subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "packet=pts", "-of", "csv=p=0", p], capture_output=True, text=True).stdout.split())
    d = SeqDecoder(p, pts, w, h)
    bad = []

    def check(i):
        x = d.frame(i)
        if x is None:
            bad.append((i, "none")); return
        a = x.contiguous().reshape(-1).cpu().numpy()
        m = int(np.abs(a.astype(np.int16) - ff[i].astype(np.int16)).max())
        if m:
            bad.append((i, m))

    t0 = time.time()
    for i in range(len(ff)):
        check(i)
    seq = time.time() - t0
    rnd = random.Random(7)
    t0 = time.time()
    for _ in range(200):
        i = rnd.randrange(len(ff))
        check(i)
        for j in range(i + 1, min(len(ff), i + rnd.randrange(1, 40))):   # then play on a little, as a slot does
            check(j)
    print(f"{os.path.basename(p)}: {len(ff)} frames (packets {len(pts)}), sequential {seq:.1f}s, jumps {time.time() - t0:.1f}s -> "
          + ("BIT-EXACT" if not bad else f"{len(bad)} WRONG, first {bad[:6]}"), flush=True)
    ok_all &= not bad
sys.exit(0 if ok_all else 1)
