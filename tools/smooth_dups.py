"""Smooth a screen-recording cut whose frames were duplicated by a frame-rate conversion («الفيديو يرتجف وليس انسيابياً», user 2026-10-22): every frame that is a
repeat of the previous one (measured on the webcam side of the frame) is replaced by the 50/50 blend of its neighbours, so motion becomes even. Audio is copied.
Usage: python tools/smooth_dups.py <in.mp4> <out.mp4> [--x0 900] [--thr 0.35] [--cpu]
Streams the frames (3-frame window, constant memory); prints how many frames were repaired.
(user 2026-11-14 «من المفترض ان نعمل على الكرت فقط») all on the card by default: NVDEC decodes into CUDA memory, the duplicate test and the blend run
on the GPU in NV12, NVENC encodes from CUDA memory (PyNvVideoCodec) — measured before: ~2.8 CPU cores (OpenCV CPU decode, CPU blend, a BGR pipe
that ffmpeg converted to YUV on the CPU). The test is the same: mean |gray difference| on every 4th pixel right of x0, gray = 1.164·(Y−16), which is
what OpenCV's BGR→gray of a BT.601 decode gives. --cpu (or no CUDA/PyNvVideoCodec) = the old OpenCV way, kept unchanged."""
import os, sys, subprocess, json
from fractions import Fraction
src, out = sys.argv[1], sys.argv[2]
a = sys.argv[3:]
x0 = int(a[a.index("--x0") + 1]) if "--x0" in a else 900
thr = float(a[a.index("--thr") + 1]) if "--thr" in a else 0.35
tmp = out.replace(".mp4", "_noaudio.mp4")
GPU_PY = os.environ.get("PY", "S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe")   # has torch + cv2 (tools/stage.mjs starts this tool with the system python)
if "--cpu" not in a and not os.environ.get("SMOOTH_DUPS_CHILD"):
    try:
        import torch  # noqa: F401
    except ImportError:
        if os.path.exists(GPU_PY):
            sys.exit(subprocess.run([GPU_PY, "-I", os.path.abspath(__file__), *sys.argv[1:]], env={**os.environ, "SMOOTH_DUPS_CHILD": "1"}).returncode)


def finish(n, fixed):
    subprocess.run(["ffmpeg", "-hide_banner", "-v", "error", "-y", "-i", tmp, "-i", src, "-map", "0:v", "-map", "1:a", "-c", "copy", out], check=True)
    os.remove(tmp)
    print(f"frames {n}, duplicates repaired {fixed} ({100 * fixed / max(n, 1):.1f}%) -> {out}")


def run_gpu():
    import torch
    sys.path.insert(0, os.environ.get("GR_PYNVC", r"S:\AI_Tools\PyNvVideoCodec_GpuRender\site"))
    import PyNvVideoCodec as nvc
    try:   # blocking CUDA sync: a waiting thread sleeps instead of spinning a CPU core (see tools/gpu_compositor.py)
        import ctypes
        cu = ctypes.WinDLL("nvcuda.dll"); d = ctypes.c_int(); cu.cuInit(0); cu.cuDeviceGet(ctypes.byref(d), 0); cu.cuDevicePrimaryCtxSetFlags_v2(d, 0x04)
    except Exception:
        pass
    pr = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate", "-of", "json", src],
                                   capture_output=True, text=True, check=True).stdout)["streams"][0]
    W, H = int(pr["width"]), int(pr["height"])
    fr = Fraction(pr["r_frame_rate"]).limit_denominator(1001)
    xs = x0 if x0 < W else 0   # the default x0=900 targets the webcam side of landscape footage; a portrait clip may be narrower
    dm = nvc.CreateDemuxer(src)
    dec = nvc.CreateDecoder(gpuid=0, codec=dm.GetNvCodecId(), usedevicememory=True)

    def frames():
        while True:
            pk = dm.Demux()
            last = pk.bsl == 0
            for f in dec.Decode(nvc.PacketData() if last else pk):
                x = torch.from_dlpack(f)
                yield (x[..., :W] if x.shape[-1] != W else x).clone()   # the decoder reuses its surfaces: copy at once (GPU -> GPU)
            if last:
                return

    def gray(f):   # (Y − 16)·1.164 on every 4th pixel right of x0 = OpenCV's gray of its BT.601 BGR decode
        return (f[:H:4, xs::4].float() - 16.0) * (255.0 / 219.0)

    def isdup(g1, g0):
        return float((g1 - g0).abs().mean()) < thr

    enc = nvc.CreateEncoder(W, H, "NV12", False, codec="h264", preset="P5", tuning_info="high_quality", rc="vbr", cq=15, bitrate=0, maxbitrate=0,
                            gop=15, bf=0, fps=round(float(fr)), gpu_id=0, cudastream=torch.cuda.current_stream().cuda_stream)   # = the ffmpeg line of --cpu
    TB = 90000
    mux = nvc.FFmpegMuxer(file_path=tmp, media_format=nvc.GetMediaFormat(tmp), codec="h264", width=W, height=H, fps_num=fr.numerator, fps_den=fr.denominator,
                          timebase_num=1, timebase_den=TB, extradata=enc.GetSequenceParams())
    mux.SetUniformPtsIncrement(round(TB / float(fr)))

    class NV12:
        def __init__(self, t):
            self.t = t; self.p = [t[:H].view(H, W, 1), t[H:].reshape(H // 2, W // 2, 2)]

        def cuda(self):
            return self.p

    n = [0]

    def write(t):
        torch.cuda.current_stream().synchronize()
        pp = nvc.NV_ENC_PIC_PARAMS(); pp.inputTimeStamp = n[0]; n[0] += 1
        for p in enc.Encode(NV12(t.contiguous()), pp):
            mux.MuxVideoPacket(bytes(p["data"]), p["picture_type"], p["timestamp"])

    it = frames()
    prev, cur, nxt = next(it, None), next(it, None), next(it, None)
    fixed = 0
    if prev is None:
        raise RuntimeError("no frames decoded")
    write(prev)
    if cur is not None:
        gp, gc = gray(prev), gray(cur)
        while cur is not None:
            gn = gray(nxt) if nxt is not None else None
            out_f = cur
            if nxt is not None and isdup(gc, gp) and not isdup(gn, gc):
                out_f = ((prev.to(torch.int16) + nxt.to(torch.int16) + 1) >> 1).to(torch.uint8); fixed += 1   # 50/50, rounded (cv2.addWeighted)
            write(out_f)
            prev, gp = cur, gc
            cur, gc = nxt, gn
            nxt = next(it, None) if nxt is not None else None
    for p in enc.EndEncode():
        mux.MuxVideoPacket(bytes(p["data"]), p["picture_type"], p["timestamp"])
    mux.Finalize()
    del mux   # the file is complete only once the muxer object is gone
    return n[0], fixed


def run_cpu():
    import cv2, numpy as np
    cap = cv2.VideoCapture(src)
    fps = cap.get(cv2.CAP_PROP_FPS); W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)); H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    xs = x0 if x0 < W else 0
    ff = subprocess.Popen(["ffmpeg", "-hide_banner", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
                           "-c:v", "h264_nvenc", "-preset", "p5", "-rc", "vbr", "-cq", "15", "-b:v", "0", "-g", "15", "-bf", "0", "-pix_fmt", "yuv420p", tmp], stdin=subprocess.PIPE)
    def gray(f): return cv2.cvtColor(f[::4, xs::4], cv2.COLOR_BGR2GRAY).astype(np.float32)
    def isdup(g1, g0): return float(np.abs(g1 - g0).mean()) < thr
    ok, prev = cap.read(); ok2, cur = cap.read(); ok3, nxt = cap.read()
    n = 0; fixed = 0
    if not ok2:
        ff.stdin.write(prev.tobytes()); n = 1
    else:
        ff.stdin.write(prev.tobytes()); n = 1
        gp, gc = gray(prev), gray(cur)
        while ok2:
            gn = gray(nxt) if ok3 else None
            out_f = cur
            if ok3 and isdup(gc, gp) and not isdup(gn, gc):
                out_f = cv2.addWeighted(prev, 0.5, nxt, 0.5, 0); fixed += 1
            ff.stdin.write(out_f.tobytes()); n += 1
            prev, gp = cur, gc
            cur, gc, ok2 = nxt, gn, ok3
            ok3, nxt = cap.read() if ok3 else (False, None)
    ff.stdin.close()
    if ff.wait() != 0:
        raise RuntimeError(f"ffmpeg encode failed ({ff.returncode})")
    return n, fixed


res = None
if "--cpu" not in a:
    try:
        res = run_gpu()
    except Exception as e:
        print(f"WARNING: GPU path failed ({str(e).splitlines()[0][:160] if str(e) else type(e).__name__}) — the OpenCV CPU path", flush=True)
if res is None:
    # (2026-11-16) the failed GPU path's muxer still had <tmp> open (its frame was alive in the exception's traceback, and the CPU path ran INSIDE the except block):
    # the CPU encode then produced a file with no streams. Out of the except block + a collection frees it; the half-written file goes before the CPU path writes
    import gc; gc.collect()
    try: os.remove(tmp)
    except FileNotFoundError: pass
    res = run_cpu()
finish(*res)
