"""ONE GPU PASS: the cut video, the smoothed video and the Studio's light copy, built together (user 2026-11-19: «هل نستطيع أن نتجاوز التنعيم والترميز الثالث، فنعتمد على الترميز الأساسي»).
Until now a cut was three full encodes in a row: tools/cut_edl.mjs build (the cut), tools/smooth_dups.py (the smoothing, in the background) and tools/make_preview_proxy.mjs (the light Studio copy).
This does them in one pass over the frames, all on the card (NVDEC -> torch -> NVENC), nothing downloaded to the processor:

    python tools/cut_build_gpu.py <src.mp4> <map.json> <out.mp4> [--audio-from cut.wav] [--proxy] [--cq 15] [--no-smooth] [--x0 900] [--thr 0.35] [--until S]

  * the frames of every kept stretch (map.json: segments a,b = source seconds on the 1/30 s grid) are decoded with a seek per stretch (the removed parts are never decoded),
    placed on the 30 fps cut timeline the way ffmpeg's -r 30 does (nearest source frame), and run through the SAME duplicate-frame repair as tools/smooth_dups.py
    (a frame equal to its predecessor while the next one differs becomes the average of its two neighbours) on the continuous cut stream;
  * <out.mp4> = the smoothed cut at the quality of the old chain (NVENC p5 vbr cq 15, g 15, no B-frames), with the audio (--audio-from wav -> aac 192k);
  * --proxy also writes the light Studio copy in the same pass: <out>_prev_<v>.mp4 (960 wide, p4 cq 30, g 15) + <out>_prev_<v>.m4a (aac 128k) and registers it in
    data/preview_proxies.json (<v> = <out>'s modified time in base 36, like tools/make_preview_proxy.mjs), so `stage.mjs check` finds the proxy up to date;
  * everything is written to <name>.part files and moved into place when whole: a file the Studio plays never disappears or half exists.
Prints one summary line. Exit 3 = the GPU path is not usable here (the caller falls back to the old chain)."""
import sys, os, json, subprocess, time, math
from fractions import Fraction

sys.stdout.reconfigure(encoding="utf-8")
a = sys.argv[1:]
if len(a) < 3:
    print(__doc__); sys.exit(2)
src, mapf, out = a[0], a[1], a[2]
opts = a[3:]
def opt(k, d=None):
    return opts[opts.index("--" + k) + 1] if ("--" + k) in opts else d
CQ = int(opt("cq", "15")); X0 = int(opt("x0", "900")); THR = float(opt("thr", "0.35")); UNTIL = float(opt("until", "0")) or None
SMOOTH = "--no-smooth" not in opts; PROXY = "--proxy" in opts; WAV = opt("audio-from", None)
GPU_PY = os.environ.get("PY", "S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe")
if not os.environ.get("CUT_BUILD_CHILD"):
    try:
        import torch  # noqa: F401
    except ImportError:
        if os.path.exists(GPU_PY):
            sys.exit(subprocess.run([GPU_PY, "-I", os.path.abspath(__file__), *sys.argv[1:]], env={**os.environ, "CUT_BUILD_CHILD": "1"}).returncode)
        sys.exit(3)

try:
    import torch
    import torch.nn.functional as F
    sys.path.insert(0, os.environ.get("GR_PYNVC", r"S:\AI_Tools\PyNvVideoCodec_GpuRender\site"))
    import PyNvVideoCodec as nvc
    assert torch.cuda.is_available()
except Exception as e:  # noqa: BLE001
    print(f"cut_build_gpu: GPU path unavailable ({e})"); sys.exit(3)
try:   # below-normal priority, blocking CUDA sync (a waiting thread sleeps instead of spinning a core): the machine stays smooth
    import ctypes
    ctypes.WinDLL("kernel32").SetPriorityClass(ctypes.WinDLL("kernel32").GetCurrentProcess(), 0x4000)
    cu = ctypes.WinDLL("nvcuda.dll"); d = ctypes.c_int(); cu.cuInit(0); cu.cuDeviceGet(ctypes.byref(d), 0); cu.cuDevicePrimaryCtxSetFlags_v2(d, 0x04)
except Exception:  # noqa: BLE001
    pass

t0 = time.time()
pr = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate", "-of", "json", src],
                               capture_output=True, text=True, check=True).stdout)["streams"][0]
W, H = int(pr["width"]), int(pr["height"])
SFPS = float(Fraction(pr["r_frame_rate"]))
FPS = 30
segs = json.load(open(mapf, encoding="utf-8"))["segments"]
if UNTIL is not None:
    keep, acc = [], 0.0
    for s in segs:
        if acc >= UNTIL: break
        keep.append(s); acc += s["b"] - s["a"]
    segs = keep
xs = X0 if X0 < W else 0
PW = 960 if W > 960 else W
PH = int(round(H * PW / W / 2)) * 2

dec = nvc.CreateSimpleDecoder(open(src, "rb"), gpuid=0, useDeviceMemory=True, outputColorType=nvc.OutputColorType.NATIVE)
STREAM = torch.cuda.current_stream()

def frames():
    """the continuous 30 fps cut stream, NV12 (3H/2, W) uint8 tensors on the card"""
    cum = 0.0   # cumulative rounding: the video has round(total x 30) frames, as long as the audio built from the same map (per-segment rounding drifted by 2 frames in 18 minutes)
    for s in segs:
        d = s["b"] - s["a"]
        n = int(round((cum + d) * FPS)) - int(round(cum * FPS)); cum += d
        idx = [int(round((s["a"] + k / FPS) * SFPS)) for k in range(n)]
        if not idx: continue
        lo, hi = idx[0], idx[-1]
        dec.seek_to_index(lo)
        got, base, k = [], lo, 0   # got = decoded frames [base, base+len(got))
        last = None
        for want in idx:
            while want >= base + len(got):
                batch = dec.get_batch_frames(32)
                if not batch:
                    break
                base += len(got); got = [torch.from_dlpack(f) for f in batch]   # decoded frames base.. (the decoder reuses its surfaces: cloned when taken)
            j = want - base
            if 0 <= j < len(got):
                x = got[j]; last = (x[..., :W] if x.shape[-1] != W else x).clone()
            if last is None:
                raise RuntimeError(f"no frame for source index {want} (segment {s['a']}-{s['b']})")
            yield last

def gray(f):   # (Y - 16) * 255/219 on every 4th pixel right of x0 (the webcam side): same as tools/smooth_dups.py
    return (f[:H:4, xs::4].float() - 16.0) * (255.0 / 219.0)

def isdup(g1, g0):
    return float((g1 - g0).abs().mean()) < THR

class NV12:
    def __init__(self, t, h, w):
        self.p = [t[:h].view(h, w, 1), t[h:].reshape(h // 2, w // 2, 2)]
    def cuda(self):
        return self.p

def new_enc(w, h, preset, cq):
    return nvc.CreateEncoder(w, h, "NV12", False, codec="h264", preset=preset, tuning_info="high_quality", rc="vbr", cq=cq, bitrate=0, maxbitrate=0,
                             gop=15, bf=0, fps=FPS, gpu_id=0, cudastream=STREAM.cuda_stream)

TB = 90000
def new_mux(path, enc, w, h):
    m = nvc.FFmpegMuxer(file_path=path, media_format=nvc.GetMediaFormat(path), codec="h264", width=w, height=h, fps_num=FPS, fps_den=1,
                        timebase_num=1, timebase_den=TB, extradata=enc.GetSequenceParams())
    m.SetUniformPtsIncrement(TB // FPS)
    return m

base_name = out[:-4] if out.lower().endswith(".mp4") else out
part_v, part_pv = base_name + ".video.part.mp4", base_name + ".prevvideo.part.mp4"
enc = new_enc(W, H, "P5", CQ); mux = new_mux(part_v, enc, W, H)
penc = pmux = None
if PROXY:
    penc = new_enc(PW, PH, "P4", 30); pmux = new_mux(part_pv, penc, PW, PH)
ts = [0, 0]

def push(t):
    STREAM.synchronize()
    pp = nvc.NV_ENC_PIC_PARAMS(); pp.inputTimeStamp = ts[0]; ts[0] += 1
    for p in enc.Encode(NV12(t.contiguous(), H, W), pp):
        mux.MuxVideoPacket(bytes(p["data"]), p["picture_type"], p["timestamp"])
    if PROXY:
        y = F.interpolate(t[:H].unsqueeze(0).unsqueeze(0).float(), size=(PH, PW), mode="area")
        uv = t[H:].reshape(H // 2, W // 2, 2).permute(2, 0, 1).unsqueeze(0).float()
        uv = F.interpolate(uv, size=(PH // 2, PW // 2), mode="area")
        pt = torch.cat([y[0, 0].round().clamp(0, 255).to(torch.uint8), uv[0].permute(1, 2, 0).round().clamp(0, 255).to(torch.uint8).reshape(PH // 2, PW)], 0).contiguous()
        STREAM.synchronize()
        pq = nvc.NV_ENC_PIC_PARAMS(); pq.inputTimeStamp = ts[1]; ts[1] += 1
        for p in penc.Encode(NV12(pt, PH, PW), pq):
            pmux.MuxVideoPacket(bytes(p["data"]), p["picture_type"], p["timestamp"])

def finish_enc(e, m):
    for p in e.EndEncode():
        m.MuxVideoPacket(bytes(p["data"]), p["picture_type"], p["timestamp"])
    m.Finalize()

n, fixed = 0, 0
try:
    it = frames()
    prev, cur, nxt = next(it, None), next(it, None), next(it, None)
    if prev is None:
        raise RuntimeError("the map has no frames")
    push(prev); n += 1
    if cur is not None:
        if SMOOTH:
            gc = gray(cur); d01 = float((gc - gray(prev)).abs().mean())   # distance cur<->prev, computed once per pair (one card->host sync per frame)
        while cur is not None:
            out_f = cur
            if SMOOTH:
                gn = gray(nxt) if nxt is not None else None
                d12 = float((gn - gc).abs().mean()) if gn is not None else None
                if nxt is not None and d01 < THR and not (d12 < THR):
                    out_f = ((prev.to(torch.int16) + nxt.to(torch.int16) + 1) >> 1).to(torch.uint8); fixed += 1   # 50/50, rounded (cv2.addWeighted)
                gc, d01 = gn, d12
            push(out_f); n += 1
            prev, cur, nxt = cur, nxt, (next(it, None) if nxt is not None else None)
    finish_enc(enc, mux); del mux
    if PROXY:
        finish_enc(penc, pmux); del pmux
except Exception as e:  # noqa: BLE001
    for f in (part_v, part_pv):
        try: os.remove(f)
        except OSError: pass
    print(f"cut_build_gpu: failed after {n} frames: {e}"); sys.exit(3)

def ff(*args):
    subprocess.run(["ffmpeg", "-hide_banner", "-v", "error", "-y", *args], check=True)

part_out = base_name + ".part.mp4"
if WAV:
    ff("-i", part_v, "-i", WAV, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", part_out)
    os.remove(part_v)
else:
    os.replace(part_v, part_out)
# into place: atomic replace (a file the Studio plays is never missing)
os.replace(part_out, out)
msg = f"cut_build_gpu: {len(segs)} segments, {n} frames ({n / FPS:.1f} s), {fixed} duplicates repaired ({100 * fixed / max(n, 1):.1f}%), {time.time() - t0:.0f} s -> {out}"
if PROXY:
    # <v> = modified time in seconds, base 36 (tools/make_preview_proxy.mjs: Math.floor(mtimeMs / 1000).toString(36))
    sec = int(os.stat(out).st_mtime)
    digs = "0123456789abcdefghijklmnopqrstuvwxyz"; v = ""
    q = sec
    while q: q, r = divmod(q, 36); v = digs[r] + v
    pv, pa = base_name + f"_prev_{v}.mp4", base_name + f"_prev_{v}.m4a"
    os.replace(part_pv, pv)
    if WAV:
        ff("-i", WAV, "-vn", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", pa)
    # older proxies of this video go; the list says which version is current
    d_, stem = os.path.dirname(out) or ".", os.path.basename(base_name)
    for f in os.listdir(d_):
        if f.startswith(stem + "_prev") and f.endswith((".mp4", ".m4a")) and not f.startswith(f"{stem}_prev_{v}."):
            try: os.remove(os.path.join(d_, f))
            except OSError: pass
    lst = os.environ.get("CUT_BUILD_PROXY_LIST", "data/preview_proxies.json")
    try:
        L = json.load(open(lst, encoding="utf-8")) if os.path.exists(lst) else {}
        rel = os.path.relpath(os.path.abspath(out), os.path.abspath("public")).replace("\\", "/")
        L[rel] = v
        json.dump(L, open(lst, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    except Exception as e:  # noqa: BLE001
        print("cut_build_gpu: could not register the proxy:", e)
    msg += f" + light copy {os.path.getsize(pv) / 1e6:.0f} MB (v={v})"
print(msg)
