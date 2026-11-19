"""SMART CUT without re-encoding the video (user 2026-11-19: «احذف هذه الكلمة، كما يعمل بريمير برو»): delete spans from an already built cut and keep everything else bit for bit.
    python tools/cut_splice.py <in.mp4> <out.mp4> --keep s-e,s-e,… (frames of <in>, e exclusive) [--kind main|proxy] [--audio-from file] [--fade 0.012]

The cut videos of this project (tools/cut_build_gpu.py) are NVENC h264, 30 fps, no B-frames, an IDR every 15 frames, SPS/PPS inside every IDR. Deleting a span therefore needs a new encode of
only the frames that share a GOP with a cut point (at most 14 + 14 per join, about one second); every whole GOP in between is copied packet for packet. A 4-minute re-encode of the whole video
becomes a few seconds, the quality of everything else does not change by a single bit, and the video stays one ordinary mp4 that the Studio and the final render read as before.
  * the new pieces are encoded by a fresh encoder with the SAME settings as the original (main: p5 vbr cq 15, proxy: p4 cq 30), so their SPS/PPS equal the original's; when the input does not
    carry exactly that SPS (a file made by another tool) this exits 4 and the caller does a full encode instead;
  * the audio is cut from <audio-from> (any audio/video file or wav) with a 12 ms fade at every join, aac 192k (main) / the caller's choice, and muxed with -c copy for the video;
  * everything is written as .part files and moved into place when whole. Prints one summary line. Exit 3 = GPU unusable here, 4 = the input cannot be spliced (use the full encode)."""
import sys, os, subprocess, ctypes, time, json
sys.stdout.reconfigure(encoding="utf-8")
a = sys.argv[1:]
if len(a) < 3 or "--keep" not in a:
    print(__doc__); sys.exit(2)
inp, out = a[0], a[1]
def opt(k, d=None):
    return a[a.index("--" + k) + 1] if ("--" + k) in a else d
KIND = opt("kind", "main"); AUDIO = opt("audio-from", None); FADE = float(opt("fade", "0.012"))
keep = []
for part in opt("keep").split(","):
    s, e = part.split("-"); keep.append((int(s), int(e)))
keep.sort()
for i, (s, e) in enumerate(keep):
    if not (e > s) or (i and s < keep[i - 1][1]):
        print("cut_splice: kept ranges overlap or are empty"); sys.exit(2)
GPU_PY = os.environ.get("PY", "S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe")
if not os.environ.get("CUT_SPLICE_CHILD"):
    try:
        import torch  # noqa: F401
    except ImportError:
        if os.path.exists(GPU_PY):
            sys.exit(subprocess.run([GPU_PY, "-I", os.path.abspath(__file__), *sys.argv[1:]], env={**os.environ, "CUT_SPLICE_CHILD": "1"}).returncode)
        sys.exit(3)
try:
    import torch
    sys.path.insert(0, os.environ.get("GR_PYNVC", r"S:\AI_Tools\PyNvVideoCodec_GpuRender\site"))
    import PyNvVideoCodec as nvc
    assert torch.cuda.is_available()
except Exception as e:  # noqa: BLE001
    print(f"cut_splice: GPU path unavailable ({e})"); sys.exit(3)
try:
    k32 = ctypes.WinDLL("kernel32"); k32.SetPriorityClass(k32.GetCurrentProcess(), 0x4000)
    cu = ctypes.WinDLL("nvcuda.dll"); d_ = ctypes.c_int(); cu.cuInit(0); cu.cuDeviceGet(ctypes.byref(d_), 0); cu.cuDevicePrimaryCtxSetFlags_v2(d_, 0x04)
except Exception:  # noqa: BLE001
    pass

t0 = time.time()
FPS, GOP, TB = 30, 15, 90000
dm = nvc.CreateDemuxer(inp)
W, H = dm.Width(), dm.Height()
nb = int(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=nb_frames", "-of", "csv=p=0", inp], capture_output=True, text=True).stdout.strip() or 0)
if not nb or keep[-1][1] > nb:
    print(f"cut_splice: a kept range reaches past the {nb} frames of the input"); sys.exit(2)
STREAM = torch.cuda.current_stream()
PRESET, CQ = ("P4", 30) if KIND == "proxy" else ("P5", 15)

def new_enc():
    return nvc.CreateEncoder(W, H, "NV12", False, codec="h264", preset=PRESET, tuning_info="high_quality", rc="vbr", cq=CQ, bitrate=0, maxbitrate=0,
                             gop=GOP, bf=0, fps=FPS, gpu_id=0, cudastream=STREAM.cuda_stream)

enc0 = new_enc(); sps = bytes(enc0.GetSequenceParams())
def packets():
    while True:
        pk = dm.Demux()
        if pk.bsl == 0:
            return
        yield ctypes.string_at(pk.bsl_data, pk.bsl), bool(pk.key)
first = next(packets())
if not first[0].startswith(sps):
    print("cut_splice: the input does not carry this tool's SPS/PPS (made by another encoder): full encode needed"); sys.exit(4)
import itertools
pk_iter = itertools.chain([first], packets())

part_v = out[:-4] + ".video.part.mp4"
mux = nvc.FFmpegMuxer(file_path=part_v, media_format=nvc.GetMediaFormat(part_v), codec="h264", width=W, height=H, fps_num=FPS, fps_den=1, timebase_num=1, timebase_den=TB, extradata=enc0.GetSequenceParams())
mux.SetUniformPtsIncrement(TB // FPS)
del enc0

# the plan: copy whole GOPs, re-encode the frames that share a GOP with a cut point
ops = []
for s, e in keep:
    ca = s if s % GOP == 0 else (s // GOP + 1) * GOP
    cb = e if (e % GOP == 0 or e == nb) else (e // GOP) * GOP
    if ca >= cb:
        ops.append(("enc", s, e))
    else:
        if s < ca: ops.append(("enc", s, ca))
        ops.append(("copy", ca, cb))
        if cb < e: ops.append(("enc", cb, e))

dec = None
OUT = [0]   # packets muxed so far: the muxer places packet k at k x 3000 (uniform increment), so every packet carries its global output index (an encoder's own timestamps restart per piece)
def put(data, typ):
    mux.MuxVideoPacket(data, typ, OUT[0]); OUT[0] += 1
class NV12:
    def __init__(self, t):
        self.p = [t[:H].view(H, W, 1), t[H:].reshape(H // 2, W // 2, 2)]
    def cuda(self):
        return self.p

def encode_range(s, e):
    global dec
    if dec is None:
        dec = nvc.CreateSimpleDecoder(open(inp, "rb"), gpuid=0, useDeviceMemory=True, outputColorType=nvc.OutputColorType.NATIVE)
    enc = new_enc(); got = []
    dec.seek_to_index(s)
    while len(got) < e - s:
        batch = dec.get_batch_frames(min(32, e - s - len(got)))
        if not batch:
            raise RuntimeError(f"the decoder returned no frame at {s + len(got)}")
        for f in batch:
            x = torch.from_dlpack(f); got.append((x[..., :W] if x.shape[-1] != W else x).clone())
    for i, x in enumerate(got):
        STREAM.synchronize()
        pp = nvc.NV_ENC_PIC_PARAMS(); pp.inputTimeStamp = i
        for p in enc.Encode(NV12(x.contiguous()), pp):
            put(bytes(p["data"]), p["picture_type"])
    for p in enc.EndEncode():
        put(bytes(p["data"]), p["picture_type"])
    del enc

idx, copied, reenc = -1, 0, 0
try:
    for kind, s, e in ops:
        if kind == "enc":
            encode_range(s, e); reenc += e - s
        else:
            while idx < e - 1:
                data, key = next(pk_iter); idx += 1
                if idx >= s:
                    put(data, 3 if key else 0); copied += 1
    mux.Finalize(); del mux
except Exception as ex:  # noqa: BLE001
    try: os.remove(part_v)
    except OSError: pass
    print(f"cut_splice: failed: {ex}"); sys.exit(3)

t_video = time.time() - t0
total = sum(e - s for s, e in keep)
def ff(*args):
    subprocess.run(["ffmpeg", "-hide_banner", "-v", "error", "-y", *args], check=True)
final_part = out[:-4] + ".part.mp4"
if AUDIO:
    # the audio of the kept stretches only, a 12 ms fade at every join (no click, no change of length). The audio is taken out of its file FIRST (a copy of the audio packets only,
    # seconds) so the big video is read once, by the final copy-mux; reading the 2 GB input again through the filter graph cost most of the time
    aud_in, tmp = AUDIO, []
    if AUDIO.lower().endswith((".mp4", ".mov", ".mkv")):
        aud_in = out[:-4] + ".audio_in.m4a"; tmp.append(aud_in)
        ff("-i", AUDIO, "-vn", "-map", "0:a:0", "-c:a", "copy", aud_in)
    parts, labels = [], []
    for i, (s, e) in enumerate(keep):
        d = (e - s) / FPS
        f = f"[0:a]atrim=start={s / FPS:.4f}:end={e / FPS:.4f},asetpts=PTS-STARTPTS"
        if i > 0: f += f",afade=t=in:st=0:d={FADE}"
        if i < len(keep) - 1: f += f",afade=t=out:st={max(0, d - FADE):.4f}:d={FADE}"
        parts.append(f + f"[a{i}]"); labels.append(f"[a{i}]")
    graph = ";".join(parts) + ";" + "".join(labels) + f"concat=n={len(keep)}:v=0:a=1[a]"
    aud_out = out[:-4] + ".audio_out.m4a"; tmp.append(aud_out)
    ff("-i", aud_in, "-filter_complex", graph, "-map", "[a]", "-c:a", "aac", "-b:a", "192k", aud_out)
    ff("-i", part_v, "-i", aud_out, "-map", "0:v", "-map", "1:a", "-c", "copy", "-movflags", "+faststart", final_part)
    os.remove(part_v)
    for t in tmp:
        try: os.remove(t)
        except OSError: pass
else:
    os.replace(part_v, final_part)
os.replace(final_part, out)
print(f"cut_splice: {len(keep)} kept ranges, {total} frames ({total / FPS:.2f} s): {copied} frames copied, {reenc} re-encoded, {time.time() - t0:.1f} s (video {t_video:.1f} s, audio+mux {time.time() - t0 - t_video:.1f} s) -> {out}")
