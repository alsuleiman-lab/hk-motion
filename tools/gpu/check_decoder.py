"""Check that PyNvVideoCodec (NVDEC straight into CUDA) returns, for a frame index, exactly the frame the hybrid's ffmpeg reader returns
(tools/hybrid_generic.py Stream: -hwaccel cuda -ss (idx-0.5)/fps -i f -fps_mode passthrough, first frame read = idx).
  python tools/gpu/check_decoder.py <video> [<video> ...]   -> per file: max |diff| of the NV12 planes at a few indices (0 = identical)."""
import json, subprocess, sys
sys.path.insert(0, r"S:\AI_Tools\PyNvVideoCodec_GpuRender\site")
import numpy as np
import torch
torch.zeros(1, device="cuda")
import PyNvVideoCodec as nvc


def ffmpeg_frame(path, idx, fps, w, h):
    cmd = ["ffmpeg", "-v", "error", "-hwaccel", "cuda", "-hwaccel_output_format", "cuda"]
    if idx > 0:
        cmd += ["-ss", f"{max(0.0, (idx - 0.5) / fps):.6f}"]
    cmd += ["-i", path, "-fps_mode", "passthrough", "-vf", "hwdownload,format=nv12", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "nv12", "-"]
    b = subprocess.run(cmd, capture_output=True).stdout
    return np.frombuffer(b, np.uint8)[: w * h * 3 // 2]


res = {}
for p in sys.argv[1:]:
    s = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate,nb_frames,codec_name,pix_fmt", "-of", "json", p], capture_output=True, text=True).stdout)["streams"][0]
    n, d = s["r_frame_rate"].split("/")
    fps, w, h = float(n) / float(d), int(s["width"]), int(s["height"])
    nb = int(s.get("nb_frames", "0") or 0)
    try:
        dec = nvc.SimpleDecoder(p, gpu_id=0, use_device_memory=True, output_color_type=nvc.OutputColorType.NATIVE)
    except Exception as e:
        res[p] = {"error": str(e).splitlines()[0][:200], "codec": s["codec_name"], "pix_fmt": s.get("pix_fmt")}
        continue
    L = len(dec)
    out = {"codec": s["codec_name"], "pix_fmt": s.get("pix_fmt"), "size": [w, h], "fps": fps, "nb_frames": nb, "nvc_len": L, "diffs": {}}
    for idx in sorted(set([0, 1, min(L - 1, 37), L // 3, L // 3 + 1, L // 2, max(0, L - 2)])):
        try:
            a = torch.from_dlpack(dec[idx]).cpu().numpy().reshape(-1)[: w * h * 3 // 2]
        except Exception as e:
            out["diffs"][idx] = "nvc error: " + str(e).splitlines()[2][:90] if len(str(e).splitlines()) > 2 else str(e)[:90]
            continue
        b = ffmpeg_frame(p, idx, fps, w, h)
        out["diffs"][idx] = int(np.abs(a.astype(np.int16) - b.astype(np.int16)).max()) if b.size == a.size else f"size {b.size} vs {a.size}"
    res[p] = out
for p, o in res.items():
    print(p.split("/")[-1], o.get("codec"), o.get("pix_fmt"), "nb", o.get("nb_frames"), "nvc", o.get("nvc_len"), o.get("error", ""), json.dumps(o.get("diffs", {})))
