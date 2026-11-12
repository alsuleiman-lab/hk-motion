"""Which seek is right? Frame `idx` of a video decoded three ways vs the ground truth (sequential CPU decode from the start, no seek):
ffmpeg -ss (the hybrid's reader), PyNvVideoCodec random access, PyNvVideoCodec sequential access.   python tools/gpu/seek_truth.py <video> <idx> [<idx> ...]"""
import json, subprocess, sys
import numpy as np
sys.path.insert(0, r"S:\AI_Tools\PyNvVideoCodec_GpuRender\site")
import torch
torch.zeros(1, device="cuda")
import PyNvVideoCodec as nvc

p = sys.argv[1]
s = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate", "-of", "json", p], capture_output=True, text=True).stdout)["streams"][0]
w, h = int(s["width"]), int(s["height"]); a_, b_ = s["r_frame_rate"].split("/"); fps = float(a_) / float(b_)
n = w * h * 3 // 2


def ff(args):
    return np.frombuffer(subprocess.run(["ffmpeg", "-v", "error"] + args + ["-f", "rawvideo", "-pix_fmt", "nv12", "-"], capture_output=True).stdout, np.uint8)[:n]


SEQ = {}
def seq_frames(upto):   # ground truth: plain sequential CPU decode, frame k = k-th frame out of the decoder
    if upto not in SEQ:
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-map", "0:v", "-fps_mode", "passthrough", "-frames:v", str(upto + 1), "-f", "rawvideo", "-pix_fmt", "nv12", "-"], capture_output=True).stdout
        SEQ.clear(); SEQ[upto] = np.frombuffer(raw, np.uint8)
    return SEQ[upto]
def gt(k, upto):
    a = seq_frames(upto); return a[k * n:(k + 1) * n]


m = lambda a, b: int(np.abs(a.astype(int) - b.astype(int)).max()) if a.size == b.size == n else f"size {a.size}/{b.size}"
for idx in map(int, sys.argv[2:]):
    truth = gt(idx, idx + 1)
    seek = ff(["-hwaccel", "cuda", "-hwaccel_output_format", "cuda", "-ss", f"{(idx - 0.5) / fps:.6f}", "-i", p, "-fps_mode", "passthrough", "-vf", "hwdownload,format=nv12", "-frames:v", "1"])
    d = nvc.SimpleDecoder(p, gpu_id=0, use_device_memory=True, output_color_type=nvc.OutputColorType.NATIVE)
    rnd = torch.from_dlpack(d[idx]).cpu().numpy().reshape(-1)[:n]
    d2 = nvc.SimpleDecoder(p, gpu_id=0, use_device_memory=True, output_color_type=nvc.OutputColorType.NATIVE)
    for i in range(max(0, idx - 40), idx):
        d2[i]
    seqn = torch.from_dlpack(d2[idx]).cpu().numpy().reshape(-1)[:n]
    # which truth-neighbour does each match best? (an off-by-one shows here)
    near = {k: gt(idx + k, idx + 1) for k in (-1, 1)}
    best = lambda x: min([(-1, near[-1]), (0, truth), (1, near[1])], key=lambda kv: np.abs(kv[1].astype(int) - x.astype(int)).mean() if kv[1].size == n else 1e9)[0]
    print(f"{p.split('/')[-1]} frame {idx}: truth vs ffmpeg -ss {m(truth, seek)} (closest {best(seek):+d}) | nvc random {m(truth, rnd)} (closest {best(rnd):+d}) | nvc sequential {m(truth, seqn)} (closest {best(seqn):+d})")
