"""GPU RENDERER — compositor (tools/gpu_render.mjs). Derived from tools/hybrid_generic.py (kept unchanged as the fallback); same compositing
semantics (affine slots, rounded clip, matte + floor, veil, blur/brightness/contrast/saturate, stacking videos -> under layer -> cut-outs -> top).
Difference: the graphics layers are NOT screenshots. Electron windows (tools/gpu/electron_worker.cjs) draw the Remotion bundle on the GPU and
hand over each frame as a D3D11 shared texture; tools/gpu/bridge.dll copies it GPU -> GPU into a CUDA tensor (premultiplied BGRA).
This script also schedules the frames over the Electron windows (TCP control port) so that they never run far ahead of the encoder.
Run with ComfyUI's python (torch+cuda+cv2).
"""
import os, argparse, http.server, json, math, queue, socket, subprocess, sys, threading, time
import numpy as np
import torch
import torch.nn.functional as F
import cv2
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "gpu"))
from gpu_bridge import Bridge

ap = argparse.ArgumentParser()
ap.add_argument("--ctl", type=int, required=True)      # control port: the Electron graphics workers connect here
ap.add_argument("--workers", type=int, default=1)      # number of Electron processes expected
ap.add_argument("--block", type=int, default=60)       # frames handed to a window at a time
ap.add_argument("--lookahead", type=int, default=240)  # a block may start only this many frames ahead of the encoder (bounds GPU memory)
ap.add_argument("--under", default="")                 # "a-b,c-d": frames that also need the under-him layer
ap.add_argument("--mark-rows", type=int, default=8)
ap.add_argument("--geom", type=int, required=True)     # slot geometry POSTs from the page
ap.add_argument("--out", required=True)
ap.add_argument("--bg", default="")                    # static background PNG (rendered once with {hybrid:"bg"})
ap.add_argument("--bg-parts", default="")              # "base|stars|vignette" PNGs of the decorated background (KhBg), stars at position 0 0
ap.add_argument("--stars-drift", default="0.25,0.15")  # KhBg star drift, px per frame (src/KhKit.tsx KHBG_DRIFT)
ap.add_argument("--public", required=True)             # real public/ folder (video sources)
ap.add_argument("--w", type=int, default=1920)
ap.add_argument("--h", type=int, default=1080)
ap.add_argument("--fps", type=int, default=30)
ap.add_argument("--start", type=int, default=0)
ap.add_argument("--end", type=int, required=True)
ap.add_argument("--cq", type=int, default=int(os.environ.get("HY_CQ", "15")))   # flat cartoon art needs a lower cq to reach the 14 Mbps floor
ap.add_argument("--dump", default="")                  # debug: also write the composited frames at these indices as PNG (comma list) into this dir  "dir:1,2,3"
ap.add_argument("--frames", default="")                # (2026-11-13) only these scattered frames (comma list, ascending), e.g. the check sheet's stills
a = ap.parse_args()
W, H, FPS = a.w, a.h, a.fps
START, END = a.start, a.end
FRAMES = sorted(set(int(x) for x in a.frames.split(",") if x)) if a.frames else None
FIDX = {f: i for i, f in enumerate(FRAMES)} if FRAMES else None
NF = len(FRAMES) if FRAMES else END - START + 1
import os
# source frame = the NEAREST to the slot time, as Remotion's frame extractor picks it (2026-11-12: a 25 fps clip in a 30 fps video was one frame
# early half the time with the old floor(t*fps + 0.0001); identical for clips at the video's own rate). HY_BIAS overrides it for tests.
BIAS = float(os.environ.get("HY_BIAS", "0.5"))
dev = "cuda"
# (user 2026-11-14 «من المفترض ان نعمل على الكرت فقط») CUDA's default on a 20-core machine is to SPIN a CPU core while waiting for the GPU
# (stream/event synchronize, .cpu(), the bridge's cuStreamSynchronize). Blocking sync = the thread sleeps until the GPU signals: same frames, less CPU.
# Must be set before torch creates the primary context.
if os.environ.get("GR_SPIN") is None:
    try:
        import ctypes
        _cu = ctypes.WinDLL("nvcuda.dll"); _d = ctypes.c_int()
        _cu.cuInit(0); _cu.cuDeviceGet(ctypes.byref(_d), 0)
        _r = _cu.cuDevicePrimaryCtxSetFlags_v2(_d, 0x04)   # CU_CTX_SCHED_BLOCKING_SYNC
        if _r: print(f"WARNING: blocking sync not set (CUresult {_r})", flush=True)
    except Exception as e:
        print("WARNING: blocking sync not set: " + str(e), flush=True)
torch.backends.cudnn.benchmark = True
FS = W * H * 3 // 2


def read_exact(pipe, n):
    buf = bytearray(n)
    mv = memoryview(buf)
    got = 0
    while got < n:
        r = pipe.readinto(mv[got:])
        if not r:
            return None
        got += r
    return buf


# (range-scale, V->R, U->G, V->G, U->B) per (full range?, BT.601?)
COEF = {(False, False): (1.164383, 1.792741, 0.213249, 0.532909, 2.112402), (False, True): (1.164383, 1.596027, 0.391762, 0.812968, 2.017232),
        (True, False): (1.0, 1.5748, 0.187324, 0.468124, 1.8556), (True, True): (1.0, 1.402, 0.344136, 0.714136, 1.772)}


def nv12_to_rgb(buf, w, h, full=False, m601=False):
    t = (buf if torch.is_tensor(buf) else torch.frombuffer(buf, dtype=torch.uint8)).to(dev, non_blocking=True)
    y = t[: w * h].view(h, w).float()
    uv = t[w * h:].view(h // 2, w // 2, 2).float()
    u = F.interpolate(uv[..., 0][None, None], size=(h, w), mode="bilinear", align_corners=False)[0, 0]
    v = F.interpolate(uv[..., 1][None, None], size=(h, w), mode="bilinear", align_corners=False)[0, 0]
    k, rv, gu, gv, bu = COEF[(full, m601)]
    Y = (y - (0.0 if full else 16.0)) * k
    U = u - 128.0
    V = v - 128.0
    return torch.stack([Y + rv * V, Y - gu * U - gv * V, Y + bu * U]).clamp_(0, 255)


def rgb_to_nv12(rgb):
    r, g, b = rgb[0], rgb[1], rgb[2]
    y = 16.0 + 0.182586 * r + 0.614231 * g + 0.062007 * b
    u = 128.0 - 0.100644 * r - 0.338572 * g + 0.439216 * b
    v = 128.0 + 0.439216 * r - 0.398942 * g - 0.040274 * b
    u = F.avg_pool2d(u[None, None], 2)[0, 0]
    v = F.avg_pool2d(v[None, None], 2)[0, 0]
    return torch.cat([y.reshape(-1), torch.stack([u, v], -1).reshape(-1)]).add_(0.5).clamp_(0, 255).to(torch.uint8)


# ---------------- video sources ----------------
PROBE = {}
CODEC = {}


def probe(path):
    if path not in PROBE:
        o = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate,nb_frames,color_range,color_space,codec_name", "-of", "json", path], capture_output=True, text=True).stdout
        js = json.loads(o or "{}")
        if not js.get("streams"):
            raise RuntimeError("ffprobe found no video stream in " + repr(path))
        s = js["streams"][0]
        n, d = s["r_frame_rate"].split("/")
        nb = int(s["nb_frames"]) if s.get("nb_frames", "N/A").isdigit() else 10 ** 9
        full = s.get("color_range") == "pc"
        m601 = s.get("color_space") in ("bt470bg", "smpte170m")
        PROBE[path] = (int(s["width"]), int(s["height"]), float(n) / float(d), nb, full, m601)
        CODEC[path] = s.get("codec_name", "")
    return PROBE[path]


class Stream:
    """one ffmpeg NVDEC process per continuously playing slot; frames are read in order (gaps are skipped, big jumps restart ffmpeg)."""

    def __init__(self, path):
        self.path = path
        self.w, self.h, self.fps, self.n, self.full, self.m601 = probe(path)
        self.proc = None
        self.pos = 0
        self.cur_idx = -1
        self.cur = None
        self.lock = threading.Lock()
        self.last_use = 0
        self.gen = 0
        self.q = None

    def _start(self, idx):
        self._kill()
        cmd = ["ffmpeg", "-v", "error", "-hwaccel", "cuda", "-hwaccel_output_format", "cuda"]
        if idx > 0:
            cmd += ["-ss", f"{max(0.0, (idx - 0.5) / self.fps):.6f}"]
        # -fps_mode passthrough (2026-11-12): with the default CFR mode ffmpeg DUPLICATED the first frame after a seek, so every stream started mid-file
        # (partial/patch renders, clip cards, restarts) showed the frame BEFORE the one asked for — one frame early (measured by edge correlation on frame 9600)
        cmd += ["-threads", "2", "-i", self.path, "-fps_mode", "passthrough", "-vf", "hwdownload,format=nv12", "-f", "rawvideo", "-pix_fmt", "nv12", "-"]
        self.proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, bufsize=self.w * self.h * 3 // 2 * 4)
        self.pos = idx
        # read-ahead (2026-11-11): a thread reads the next frames into pinned memory while the GPU works on the current one
        self.gen += 1
        self.q = queue.Queue(maxsize=8)
        threading.Thread(target=self._reader, args=(self.gen, self.proc, self.q), daemon=True).start()

    def _reader(self, gen, proc, q):
        n = self.w * self.h * 3 // 2
        while gen == self.gen:
            t = torch.empty(n, dtype=torch.uint8, pin_memory=True)
            mv = memoryview(t.numpy())
            got = 0
            while got < n:
                r = proc.stdout.readinto(mv[got:])
                if not r:
                    break
                got += r
            item = t if got == n else None
            while gen == self.gen:
                try:
                    q.put(item, timeout=0.5)
                    break
                except queue.Full:
                    continue
            if item is None:
                return

    def _kill(self):
        if self.proc is not None:
            try:
                self.proc.kill()
            except Exception:
                pass
            self.proc = None
        self.gen += 1

    def prepare(self, idx):  # called when the geometry arrives: launch ffmpeg early so its start-up overlaps with other work
        with self.lock:
            if self.proc is None and self.cur_idx < 0:
                self._start(max(0, min(idx, self.n - 1)))

    def get(self, idx):
        idx = max(0, min(idx, self.n - 1))
        with self.lock:
            if idx == self.cur_idx:
                return self.cur
            if self.proc is None or idx < self.pos or idx - self.pos > 150:
                self._start(idx)
            buf = None
            while self.pos <= idx:
                b = self.q.get()
                if b is None:  # past the end of the file: hold the last frame
                    self.q.put(None)
                    print("EOF", self.path, idx, self.pos, self.n, flush=True)
                    break
                buf = b
                self.pos += 1
            if buf is None:
                return self.cur
            self.cur_idx = idx
            self.cur = nv12_to_rgb(buf, self.w, self.h, self.full, self.m601)
            return self.cur

    def idle_kill(self, frame_no):
        with self.lock:
            if self.proc is not None and frame_no - self.last_use > 120:
                self._kill()
                self.cur_idx = -1


try:   # NVIDIA's PyNvVideoCodec (own folder on S:, not ComfyUI's site-packages): NVDEC decodes straight into CUDA memory
    sys.path.insert(0, os.environ.get("GR_PYNVC", r"S:\AI_Tools\PyNvVideoCodec_GpuRender\site"))
    import PyNvVideoCodec as nvc
except Exception as e:
    nvc = None
    print("WARNING: PyNvVideoCodec unavailable, falling back to ffmpeg readers (frames pass through the CPU): " + str(e), flush=True)


class NvStream:
    """one NVDEC session per continuously playing slot, frames decoded straight into CUDA memory (no CPU round trip).
    Same frame for an index as the ffmpeg reader above: checked bit-exact (max |diff| 0) by tools/gpu/check_decoder.py, after seeks too."""

    def __init__(self, path):
        self.path = path
        self.w, self.h, self.fps, self.n, self.full, self.m601 = probe(path)
        self.dec = None
        self.cur_idx = -1
        self.cur = None
        self.lock = threading.Lock()
        self.last_use = 0
        self.fb = None   # ffmpeg reader taking over after a decoder error

    def _open(self):
        if self.dec is None:
            self.dec = nvc.SimpleDecoder(self.path, gpu_id=0, use_device_memory=True, output_color_type=nvc.OutputColorType.NATIVE)
            self.n = min(self.n, len(self.dec))

    def prepare(self, idx):   # geometry arrived: open the decoder now (overlaps with the rest of the frame)
        def go():
            with self.lock:
                self._open()
        if self.dec is None:
            threading.Thread(target=go, daemon=True).start()

    def get(self, idx):
        with self.lock:
            if self.fb is not None:
                return self.fb.get(idx)
            try:
                self._open()
                idx = max(0, min(idx, self.n - 1))
                if idx == self.cur_idx:
                    return self.cur
                x = torch.from_dlpack(self.dec[idx])          # NV12 (h*3/2, pitch) on the GPU; the decoder reuses this surface: convert at once
            except Exception as e:   # e.g. a container announcing more frames than it holds: the ffmpeg reader holds the last frame, as in the hybrid
                print(f"WARNING: PyNvVideoCodec failed on {self.path} at {idx} ({str(e).splitlines()[0][:120]}): ffmpeg reader from here", flush=True)
                self.dec = None
                self.fb = Stream(self.path)
                return self.fb.get(idx)
            if x.shape[-1] != self.w:
                x = x[..., : self.w]
            self.cur = nv12_to_rgb(x.reshape(-1) if x.is_contiguous() else x.contiguous().reshape(-1), self.w, self.h, self.full, self.m601)
            self.cur_idx = idx
            return self.cur

    def _kill(self):
        self.dec = None
        if self.fb is not None:
            self.fb._kill()

    def idle_kill(self, frame_no):
        if self.fb is not None:
            self.fb.last_use = self.last_use
            return self.fb.idle_kill(frame_no)
        with self.lock:
            if self.dec is not None and frame_no - self.last_use > 120:
                self.dec = None
                self.cur_idx = -1


class VpxStream:
    """(2026-11-12) VP9 on NVDEC straight into CUDA: SimpleDecoder indexed VP9 superframes wrongly (the NEXT frame, drifting), so the low-level
    demuxer + decoder are driven by tools/gpu/nvseq.py, which counts the pictures in output order from a keyframe located by its packet timestamp.
    Bit-exact with ffmpeg's decode, sequential and after jumps (tools/gpu/check_seqdecoder.py)."""

    def __init__(self, path, pts):
        from nvseq import SeqDecoder   # tools/gpu is on sys.path (see gpu_bridge above)
        self.path = path
        self.w, self.h, self.fps, self.n, self.full, self.m601 = probe(path)
        self.n = min(self.n, len(pts))
        self.sd = SeqDecoder(path, pts, self.w, self.h)
        self.cur_idx, self.cur = -1, None
        self.lock = threading.Lock()
        self.last_use = 0
        self.fb = None

    def prepare(self, idx):
        pass

    def get(self, idx):
        with self.lock:
            if self.fb is not None:
                return self.fb.get(idx)
            idx = max(0, min(idx, self.n - 1))
            if idx == self.cur_idx:
                return self.cur
            try:
                x = self.sd.frame(idx)
            except Exception as e:
                print(f"WARNING: NVDEC (nvseq) failed on {self.path} at {idx} ({str(e).splitlines()[0][:120]}): ffmpeg reader from here", flush=True)
                self.sd.close()
                self.fb = Stream(self.path)
                return self.fb.get(idx)
            if x is None:   # past the end: hold the last frame, as the ffmpeg reader does
                return self.cur
            self.cur = nv12_to_rgb(x.reshape(-1), self.w, self.h, self.full, self.m601)
            self.cur_idx = idx
            return self.cur

    def _kill(self):
        self.sd.close()
        if self.fb is not None:
            self.fb._kill()

    def idle_kill(self, frame_no):
        if self.fb is not None:
            self.fb.last_use = self.last_use
            return self.fb.idle_kill(frame_no)
        with self.lock:
            if frame_no - self.last_use > 120:
                self.sd.close()
                self.sd.dec = None
                self.cur_idx = -1


def vp9_packets(path):
    """sorted packet timestamps of a VP9 stream, or None when it has packets the frame count cannot follow (show_existing_frame: 1–3 byte packets)"""
    o = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "packet=pts,size", "-of", "csv=p=0", path], capture_output=True, text=True).stdout.split()
    rows = [r.split(",") for r in o if r.count(",") == 1 and r.split(",")[0].lstrip("-").isdigit()]
    if not rows or any(int(s) <= 3 for _, s in rows):
        return None
    return sorted(int(t) for t, _ in rows)


STREAMS = {}
SLOCK = threading.Lock()


def stream_for(path, key):
    with SLOCK:
        k = (path, key)
        if k not in STREAMS:
            probe(path)
            # NVDEC straight to CUDA only for the codecs checked frame-exact against the hybrid's reader (tools/gpu/check_decoder.py, seek_truth.py):
            # h264 / av1 by SimpleDecoder (hevc not checked yet); VP9 by tools/gpu/nvseq.py (SimpleDecoder was one frame ahead and drifting on VP9
            # superframes, 2026-11-12; checked bit-exact by tools/gpu/check_seqdecoder.py). Anything else: the ffmpeg reader, exactly as in the hybrid.
            on = nvc is not None and not os.environ.get("GR_FFMPEG_DECODE")
            pk = vp9_packets(path) if on and CODEC.get(path) == "vp9" else None
            if pk:
                STREAMS[k] = VpxStream(path, pk)
            elif on and CODEC.get(path) in ("h264", "av1"):
                STREAMS[k] = NvStream(path)
            else:
                if on and CODEC.get(path) == "vp9":
                    print(f"WARNING: {path}: VP9 with show_existing_frame packets — ffmpeg reader (frames pass through the CPU)", flush=True)
                STREAMS[k] = Stream(path)
        return STREAMS[k]


def slot_key(s):
    # same file, same playback rate and same offset between comp time and source time = the same continuously playing video
    return (s["rate"], round(s["t"] - s["f"] * s["rate"] / FPS, 3))


# ---------------- geometry server ----------------
geoms = {}
NOHOST = set()
cv = threading.Condition()


class H_(http.server.BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "*")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0))
        on_geom(json.loads(self.rfile.read(n)))
        self.send_response(200)
        self._cors()
        self.send_header("Content-Length", "0")
        self.end_headers()


def on_geom(obj):
    """the video-slot geometry of one frame (src/hybrid/Slot.tsx): from the control channel (GPU renderer) or the legacy XHR port"""
    for s in obj["slots"]:
        path = a.public + "/" + s["src"]
        st = stream_for(path, slot_key(s))
        st.prepare(int(math.floor(s["t"] * st.fps + BIAS)))
    if obj.get("levels"):   # extra layers below the videos for this frame (<HyLayer z>): queue them for the level windows
        note_levels(obj["frame"], obj["levels"])
        threading.Thread(target=schedule, daemon=True).start()
    with cv:
        if obj.get("nohost"):   # composition without <HybridHost>: its whole picture is the graphics layer, over black (as Remotion's JPEG capture: body background black)
            NOHOST.add(obj["frame"])
        geoms[obj["frame"]] = obj["slots"]
        if obj.get("under"):  # (2026-11-12) this frame also has an under-him layer
            if UNDER_ON:
                under_frames.add(obj["frame"])
            elif not UNDER_WARNED:
                UNDER_WARNED.append(1); print(f"WARNING: frame {obj['frame']} has graphics UNDER his cut-out but no --under was given: they are missing", flush=True)
        cv.notify_all()


class Srv(http.server.ThreadingHTTPServer):
    daemon_threads = True
    request_queue_size = 64


threading.Thread(target=Srv(("127.0.0.1", a.geom), H_).serve_forever, daemon=True).start()

# ---------------- graphics layers from the Electron windows (GPU textures) ----------------
cv2.setNumThreads(1)
MR = a.mark_rows
torch.zeros(1, device=dev)                       # create torch's CUDA context before the bridge binds to it
BR = Bridge(W, H + MR, MR)
print("bridge:", BR.info, flush=True)
tops, utops, under_frames = {}, {}, set()        # frame -> CUDA uint8 (H+MR, W, 4) premultiplied BGRA
UNDER_RANGES = [tuple(map(int, r.split("-"))) for r in a.under.split(",") if r]
UNDER_RANGES = [(max(x, START), min(y, END)) for x, y in UNDER_RANGES if min(y, END) >= max(x, START)]
UNDER_ON, UNDER_WARNED = bool(UNDER_RANGES), []
consumed = [START]                               # next frame the encoder needs
WINS = {}                                        # window id -> {"conn", "mode", "busy"}
CONNS = []
blocks = {"top": [[x, min(END, x + a.block - 1)] for x in range(START, END + 1, a.block)],
          "under": [[x, min(y, x + a.block - 1)] for (ua, y) in UNDER_RANGES for x in range(ua, y + 1, a.block)]}
if FRAMES:   # one-frame blocks at the listed frames only
    blocks = {"top": [[f, f] for f in FRAMES], "under": [[f, f] for f in FRAMES if any(x <= f <= y for x, y in UNDER_RANGES)]}


def ahead_ok(f):
    """a block may start only --lookahead frames ahead of the encoder (in list mode: that many LISTED frames / 4)"""
    return FIDX[f] - FIDX.get(consumed[0], 0) < max(4, a.lookahead // 4) if FRAMES else f < consumed[0] + a.lookahead
STATS = {"tex": 0, "stale": 0, "fetch": 0.0, "seek": [], "paint": [], "layerFrames": 0}
FATAL = []
wlock = threading.Lock()
# (2026-11-12) extra graphics layers BELOW the videos (<HyLayer z> in src/hybrid/Slot.tsx): the top layer's geometry of a frame lists the levels it
# needs; one Electron window per level renders those frames ({hybrid:"below", hybridLevel:z}), scheduled on demand.
level_need = {}                                  # frame -> [levels]
ltops = {}                                       # (level, frame) -> CUDA uint8 layer
lpend = {}                                       # level -> sorted list of frames still to hand to that level's window


def note_levels(frame, levels):
    with wlock:
        level_need[frame] = list(levels)
        for z in levels:
            L = lpend.setdefault(z, [])
            if frame not in L:
                L.append(frame)
                L.sort()


def csend(conn, obj):
    with conn["lock"]:
        conn["sock"].sendall((json.dumps(obj) + "\n").encode())


def schedule():
    """hand the next block of each mode to an idle window, never more than --lookahead frames ahead of the encoder"""
    with wlock:
        for wid, w in sorted(WINS.items()):
            if w["busy"]:
                continue
            if w["mode"] == "below":   # on demand: the next run of consecutive frames that need this level
                L = lpend.get(w.get("level", 0), [])
                if L:
                    x = y = L.pop(0)
                    while L and L[0] == y + 1 and y - x + 1 < a.block:
                        y = L.pop(0)
                    w["busy"] = True
                    csend(w["conn"], {"t": "do", "w": wid, "a": x, "b": y})
                continue
            q = blocks[w["mode"]]
            if q and ahead_ok(q[0][0]):
                x, y = q.pop(0)
                w["busy"] = True
                csend(w["conn"], {"t": "do", "w": wid, "a": x, "b": y})


def t_conn(sock):
    conn = {"sock": sock, "lock": threading.Lock()}
    CONNS.append(conn)
    fh = sock.makefile("rb", buffering=1 << 16)
    scratch = torch.empty((H + MR, W, 4), dtype=torch.uint8, device=dev)
    for line in fh:
        m = json.loads(line)
        t = m["t"]
        if t == "tex":   # a painted frame: copy it now (GPU -> GPU), then let Electron release the texture
            t0 = time.time()
            mk = BR.fetch(m["pid"], int(m["h"]), scratch)
            STATS["fetch"] += time.time() - t0
            STATS["tex"] += 1
            ok = mk == m["e"]
            if ok:
                with cv:
                    wm = WINS[m["w"]]
                    if wm["mode"] == "below":
                        ltops[(wm.get("level", 0), mk)] = scratch
                        STATS["layerFrames"] += 1
                    else:
                        (utops if wm["mode"] == "under" else tops)[mk] = scratch
                    cv.notify_all()
                scratch = torch.empty((H + MR, W, 4), dtype=torch.uint8, device=dev)
            else:
                STATS["stale"] += 1
            csend(conn, {"t": "rel", "id": m["id"], "mk": mk, "ok": ok})
        elif t == "geom":
            if m["g"] is None:
                FATAL.append(f"frame {m['f']}: the page reported no video-slot geometry (is the composition wrapped in <HybridHost>?) — geometry seen for frames {m.get('seen')}")
                with cv:
                    cv.notify_all()
            else:
                on_geom(m["g"])
        elif t == "hello":
            with wlock:
                for x in m["windows"]:
                    WINS[x["w"]] = {"conn": conn, "mode": x["mode"], "busy": False, "level": x.get("level", 0)}
            print(f"worker {m['pid']}: {len(m['windows'])} windows ready in {m['loadSec']:.1f}s", flush=True)
            schedule()
        elif t == "done":
            STATS["seek"].append(m["seekMs"]); STATS["paint"].append(m["paintMs"])
            with wlock:
                WINS[m["w"]]["busy"] = False
            schedule()
        elif t == "fatal":
            FATAL.append(m["msg"])
            print(f"FATAL from window {m['w']}: {m['msg']}", flush=True)
            with cv:
                cv.notify_all()
        elif t == "bye":
            conn["bye"] = True


def t_ctl():
    srv = socket.socket()
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind(("127.0.0.1", a.ctl))
    srv.listen(8)
    print("READY", flush=True)
    while True:
        s, _ = srv.accept()
        s.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
        threading.Thread(target=t_conn, args=(s,), daemon=True).start()


threading.Thread(target=t_ctl, daemon=True).start()

# ---------------- background ----------------
ys, xs = torch.meshgrid(torch.arange(H, device=dev) + 0.5, torch.arange(W, device=dev) + 0.5, indexing="ij")
if a.bg:
    im = cv2.imread(a.bg, cv2.IMREAD_UNCHANGED)
    if im.shape[2] == 4:
        al = im[..., 3:4].astype(np.float32) / 255.0
        im = (im[..., :3].astype(np.float32) * al).astype(np.uint8)  # over black
    BG = torch.from_numpy(np.ascontiguousarray(im[..., ::-1])).to(dev).permute(2, 0, 1).float()
else:
    BG = torch.zeros(3, H, W, device=dev)


def _prem(path):
    """a PNG with alpha -> (premultiplied RGB 0..255 (3,H,W), alpha 0..1 (1,H,W)) on the GPU, or None"""
    im = cv2.imread(path, cv2.IMREAD_UNCHANGED) if path and os.path.exists(path) else None
    if im is None or im.ndim != 3 or im.shape[2] != 4:
        return None
    t = torch.from_numpy(np.ascontiguousarray(im[..., [2, 1, 0, 3]])).to(dev).permute(2, 0, 1).float()
    al = t[3:4] / 255.0
    return t[:3] * al, al


# (2026-11-12) the decorated background's stars DRIFT (KhBg: background-position = frame × 0.25 / 0.15 px). The static background froze them; with its
# three parts rendered apart (tools/gpu_render.mjs) the background of every frame is: gradient, then the stars shifted for that frame, then the vignette.
# The star layer is periodic (140 px × the composition's scale, found by autocorrelation), so a shift = sampling the frame-0 stars at a wrapped position.
STARS = None
if a.bg_parts:
    _pb, _ps, _pv = (a.bg_parts.split("|") + ["", "", ""])[:3]
    _base, _st, _vig = _prem(_pb), _prem(_ps), _prem(_pv)
    _m = (_base[1][0] > 0.5).nonzero() if _base is not None else None
    if _m is not None and _m.numel() and _st is not None and _vig is not None and float(_st[1].max()) > 0.01:
        _y0, _x0, _y1, _x1 = int(_m[:, 0].min()), int(_m[:, 1].min()), int(_m[:, 0].max()) + 1, int(_m[:, 1].max()) + 1
    else:
        _y0 = _x0 = _y1 = _x1 = 0
    if _x1 - _x0 >= 300 and _y1 - _y0 >= 300:   # a real background area (not a 140 px asset, not an empty image): else the plain static background

        def _period(sig, lo=100, hi=200):   # autocorrelation peak of a 1-D profile, sub-pixel (parabola)
            s = sig - sig.mean()
            f = torch.fft.rfft(s, n=2 * s.numel())
            ac = torch.fft.irfft(f * f.conj())[: s.numel()]
            k = int(torch.argmax(ac[lo:hi])) + lo
            y0, y1, y2 = float(ac[k - 1]), float(ac[k]), float(ac[k + 1])
            den = y0 - 2 * y1 + y2   # negative at a peak
            return k + (0.5 * (y0 - y2) / den if abs(den) > 1e-12 else 0.0)

        _a = _st[1][0, _y0:_y1, _x0:_x1]
        PX, PY = _period(_a.mean(0)), _period(_a.mean(1))
        _dx, _dy = (float(v) for v in a.stars_drift.split(","))
        _sc = (PX / 140.0 + PY / 140.0) / 2   # the composition's scale (MontageSpec's root scale), applied to the drift too
        _inside = torch.zeros(1, H, W, device=dev)
        _inside[:, _y0:_y1, _x0:_x1] = 1
        if abs(PX - PY) > 2 or not 0.8 < _sc < 1.2:   # not the KhBg star tile: keep the static background
            print(f"background: star period not found ({PX:.1f} x {PY:.1f} px): static background", flush=True)
        else:
            STARS = {"base": _base[0], "st": torch.cat([_st[0], _st[1]], 0)[None], "vig": _vig, "box": (_x0, _y0, _x1, _y1), "inside": _inside,
                     "drift": (_dx * _sc, _dy * _sc), "snap": os.environ.get("GR_STAR_SNAP", "none")}
            print(f"background: drifting stars, period {PX:.2f} x {PY:.2f} px (scale {_sc:.4f}), area {_x0},{_y0}-{_x1},{_y1}", flush=True)


def bg_for(fno):
    """the background of comp frame `fno`: the static image, or (KhBg) gradient + that frame's stars + vignette"""
    if STARS is None:
        return BG.clone()
    S = STARS
    ox, oy = fno * S["drift"][0], fno * S["drift"][1]
    if S["snap"] == "round":
        ox, oy = round(ox), round(oy)
    x0, y0, x1, y1 = S["box"]
    px_, py_ = PX, PY
    u = x0 + 2 + torch.remainder(xs - ox - (x0 + 2), px_)          # wrapped back into the first period inside the stars' area
    v = y0 + 2 + torch.remainder(ys - oy - (y0 + 2), py_)
    g = torch.stack([u / W * 2 - 1, v / H * 2 - 1], -1)[None]
    sv = F.grid_sample(S["st"], g, mode="bilinear", padding_mode="border", align_corners=False)[0] * S["inside"]
    out = S["base"] * (1.0 - sv[3:4]) + sv[:3]
    out = out * (1.0 - S["vig"][1]) + S["vig"][0]
    return out


def rrect_sdf(qx, qy, hx, hy, r):
    px = qx.abs() - (hx - r)
    py = qy.abs() - (hy - r)
    return torch.sqrt(px.clamp(min=0) ** 2 + py.clamp(min=0) ** 2) - r + torch.minimum(torch.maximum(px, py), torch.zeros_like(px))


def gauss_blur(img, sigma):  # img (3,h,w)
    if sigma < 0.4:
        return img
    k = int(math.ceil(sigma * 3))
    x = torch.arange(-k, k + 1, device=dev).float()
    g = torch.exp(-(x ** 2) / (2 * sigma * sigma))
    g = g / g.sum()
    c = img.shape[0]
    t = img[None]
    t = F.conv2d(F.pad(t, (k, k, 0, 0), mode="replicate"), g.view(1, 1, 1, -1).repeat(c, 1, 1, 1), groups=c)
    t = F.conv2d(F.pad(t, (0, 0, k, k), mode="replicate"), g.view(1, 1, -1, 1).repeat(c, 1, 1, 1), groups=c)
    return t[0]


def apply_fx(smp, fx, scl):
    if fx["blur"] > 0:
        s = fx["blur"] * scl
        f = 4 if s >= 8 else 1  # very soft blurs are done on a 1/4 resolution copy (same look, 16x cheaper)
        if f > 1:
            hh, ww = smp.shape[1:]
            d = F.interpolate(smp[None], size=(max(1, hh // f), max(1, ww // f)), mode="bilinear", antialias=True, align_corners=False)[0]
            d = gauss_blur(d, s / f)
            smp = F.interpolate(d[None], size=(hh, ww), mode="bilinear", align_corners=False)[0]
        else:
            smp = gauss_blur(smp, s)
    if fx["contrast"] != 1:
        smp = ((smp - 127.5) * fx["contrast"] + 127.5).clamp(0, 255)
    if fx["saturate"] != 1:
        grey = (0.2126 * smp[0] + 0.7152 * smp[1] + 0.0722 * smp[2])[None]
        smp = (grey + (smp - grey) * fx["saturate"]).clamp(0, 255)
    if fx["brightness"] != 1:
        smp = (smp * fx["brightness"]).clamp(0, 255)
    gm = fx.get("gm")
    if gm:   # the montage's colour grade (src/gradeMatrix.ts): the recording's layers only; one 3x4 matrix on 0..1 values, the same numbers the Studio feeds its SVG feColorMatrix
        m = torch.tensor(gm, device=smp.device, dtype=smp.dtype).view(3, 4)
        c_, h_, w_ = smp.shape
        flat = m[:, :3] @ (smp.reshape(3, -1) / 255.0) + m[:, 3:4]
        smp = (flat.clamp(0, 1) * 255.0).reshape(3, h_, w_)
    return smp


VEIL_RGB = torch.tensor([6.0, 12.0, 22.0], device=dev).view(3, 1, 1)  # BgClip veil colour


def draw_slot(out, s, src, mat=None):
    if s.get("fit") in ("cover", "contain"):   # (2026-11-12) VSlot fit: objectFit of the REAL source size in the box, centred
        sh0, sw0 = src.shape[1:]
        fx0_, fy0_, fw0_, fh0_ = s.get("fr", (0, 0, s["w"], s["h"]))   # the rect the picture is fitted in (HyVideo: its own box; else the clip box)
        kf = (max if s["fit"] == "cover" else min)(fw0_ / sw0, fh0_ / sh0)
        px_, py_ = s.get("fp", (0.5, 0.5))   # objectPosition as fractions (CSS: offset = (box - picture) * p)
        s = dict(s, vw=sw0 * kf, vh=sh0 * kf, vx=fx0_ + (fw0_ - sw0 * kf) * px_, vy=fy0_ + (fh0_ - sh0 * kf) * py_)
        if s.get("fz"):   # then a zoom z about the box point (ox, oy): CSS transform scale(z) with transform-origin there
            z_, ox_, oy_ = s["fz"]
            s = dict(s, vx=ox_ + z_ * (s["vx"] - ox_), vy=oy_ + z_ * (s["vy"] - oy_), vw=s["vw"] * z_, vh=s["vh"] * z_)
    ma, mb, mc, md, me, mf = s["m"]
    w, h = s["w"], s["h"]
    det = ma * md - mb * mc
    if abs(det) < 1e-9 or s["o"] <= 0.001:
        return out
    scl = math.sqrt(abs(det))
    X = [ma * x + mc * y + me for x, y in ((0, 0), (w, 0), (0, h), (w, h))]
    Y = [mb * x + md * y + mf for x, y in ((0, 0), (w, 0), (0, h), (w, h))]
    x0, x1 = max(0, int(math.floor(min(X)) - 3)), min(W, int(math.ceil(max(X)) + 3))
    y0, y1 = max(0, int(math.floor(min(Y)) - 3)), min(H, int(math.ceil(max(Y)) + 3))
    if x1 <= x0 or y1 <= y0:
        return out
    px, py = xs[y0:y1, x0:x1] - me, ys[y0:y1, x0:x1] - mf
    qx = (md * px - mc * py) / det
    qy = (-mb * px + ma * py) / det
    # clip box grown by 1 output px so no seam shows under a border ring drawn by Remotion; `g` (VSlot grow) = another growth, 0 = the exact box
    # (a window with no ring over its edge: the browser clips there, 2026-11-12)
    grow = s.get("g", 1.0) / scl
    rr = s["r"]
    if isinstance(rr, list):   # (2026-11-12) one radius per corner, CSS order: top-left, top-right, bottom-right, bottom-left
        tl, tr, br, bl = (torch.full_like(qx, max(0.0, v + grow)) for v in rr)
        rr = torch.where(qy < h / 2, torch.where(qx < w / 2, tl, tr), torch.where(qx < w / 2, bl, br))
    else:
        rr = max(0.0, rr + grow)
    d = rrect_sdf(qx - w / 2, qy - h / 2, w / 2 + grow, h / 2 + grow, rr) * scl
    cov = (0.5 - d).clamp(0, 1) * s["o"]
    # the video frame itself may be smaller than the clipped box (e.g. a letter-boxed "contain" copy): never smear its edge pixels over the rest of the box
    if s["vx"] > 0.01 or s["vy"] > 0.01 or s["vx"] + s["vw"] < w - 0.01 or s["vy"] + s["vh"] < h - 0.01 or True:
        ex = torch.minimum(qx - s["vx"], s["vx"] + s["vw"] - qx) * scl
        ey = torch.minimum(qy - s["vy"], s["vy"] + s["vh"] - qy) * scl
        # min, not product (2026-11-12): where the frame edge lies ON the clip edge (VSlot grow=0) a product squared the edge ramp = a dark seam;
        # with the default 1 px growth the two ramps never overlap, so the result there is unchanged
        cov = torch.minimum(cov, (torch.minimum(ex, ey) + 0.5).clamp(0, 1) * s["o"])
    sh_, sw_ = src.shape[1:]
    kx, ky = scl * s["vw"] / sw_, scl * s["vh"] / sh_
    if kx < 0.8 or ky < 0.8:  # large reduction: pre-filter (area-like) so it matches the browser's smooth scaling, then warp 1:1
        nw, nh = max(2, int(round(sw_ * min(kx, 1.0)))), max(2, int(round(sh_ * min(ky, 1.0))))
        src = F.interpolate(src[None], size=(nh, nw), mode="bilinear", antialias=True, align_corners=False)[0]
    gx = (qx - s["vx"]) / s["vw"] * 2 - 1
    gy = (qy - s["vy"]) / s["vh"] * 2 - 1
    up_ = os.environ.get("GR_UPSCALE", "bilinear") if (kx > 1.05 or ky > 1.05) else "bilinear"   # (2026-11-13 test) enlargement filter
    smp = F.grid_sample(src[None], torch.stack([gx, gy], -1)[None], mode=up_, padding_mode="border", align_corners=False)[0]
    if up_ == "bicubic":
        smp = smp.clamp(0, 255)
    smp = apply_fx(smp, s["fx"], scl)
    veil = s["fx"].get("veil", 0)
    if veil:  # (2026-11-12) BgClip's dark veil = CSS radial-gradient(ellipse at 50% 45%, rgba(6,12,22,veil*.5) 0%, rgba(6,12,22,veil+.25) 100%), farthest-corner, in the box
        cx, cy, rx0, ry0 = w * 0.5, h * 0.45, w * 0.5, h * 0.45
        k = math.sqrt(1.0 + (0.55 / 0.45) ** 2)
        tt = torch.sqrt(((qx - cx) / (rx0 * k)) ** 2 + ((qy - cy) / (ry0 * k)) ** 2).clamp(0, 1)
        al = (veil * 0.5 + (veil * 0.5 + 0.25) * tt)[None]
        smp = smp * (1.0 - al) + VEIL_RGB * al
    fl_px = s["fx"].get("featherL", 0)
    if fl_px:  # (2026-11-12, ported from hybrid_generic.py 6397951) his video slid aside: the left edge fades to transparent over fl_px box pixels
        cov = cov * (qx / fl_px).clamp(0, 1)
    for key_, ramp_ in (("featherR", lambda p: (w - qx) / p), ("featherT", lambda p: qy / p), ("featherB", lambda p: (h - qy) / p)):   # (2026-11-12) CSS mask-image
        p_ = s["fx"].get(key_, 0)   # linear-gradient fades of the box edges, px of the box
        if p_:
            cov = cov * ramp_(p_).clamp(0, 1)
    if mat is not None:  # (2026-11-12) isolated cut-out: alpha = matte red; below `fl` (fraction of the height) the original picture stays whole — as MaskedVideo's shader
        al = F.grid_sample(mat[0:1][None], torch.stack([gx, gy], -1)[None], mode="bilinear", padding_mode="border", align_corners=False)[0, 0] / 255.0
        fl = s.get("fl", 0) or 0
        if fl > 0:
            v = ((qy - s["vy"]) / s["vh"] - fl) / 0.02
            v = v.clamp(0, 1)
            al = torch.maximum(al, v * v * (3 - 2 * v))
        cov = cov * al.clamp(0, 1)
    shy = s["fx"].get("shadowY", 0)
    if shy or s["fx"].get("shadowBlur", 0):   # (2026-11-12) CSS drop-shadow(0 shadowY shadowBlur rgba(shR,shG,shB,shadowA)) of what the slot shows (its
        # coverage, the cut-out's matte included), in the slot's own space: offset and blur scaled by the transform; drawn under the picture
        sg, dy = s["fx"].get("shadowBlur", 0) / 2 * scl, shy * scl
        pad = int(math.ceil(3 * sg + abs(dy))) + 2
        Y0, Y1, X0, X1 = max(0, y0 - pad), min(H, y1 + pad), max(0, x0 - pad), min(W, x1 + pad)
        a = torch.zeros(1, Y1 - Y0, X1 - X0, device=cov.device)
        a[0, y0 - Y0:y1 - Y0, x0 - X0:x1 - X0] = cov
        a = gauss_blur(a.expand(3, -1, -1).contiguous(), sg)[0:1] if sg >= 0.4 else a
        sy = int(round(dy))
        a = torch.roll(a, shifts=sy, dims=1)
        if sy > 0:
            a[:, :sy] = 0
        elif sy < 0:
            a[:, sy:] = 0
        a = a * s["fx"].get("shadowA", 0.5)
        col = torch.tensor([s["fx"].get("shR", 0), s["fx"].get("shG", 0), s["fx"].get("shB", 0)], device=cov.device, dtype=out.dtype).view(3, 1, 1)
        out[:, Y0:Y1, X0:X1] = out[:, Y0:Y1, X0:X1] * (1.0 - a) + col * a
    reg = out[:, y0:y1, x0:x1]
    out[:, y0:y1, x0:x1] = reg * (1.0 - cov[None]) + smp * cov[None]
    return out


# ---------------- encoder thread ----------------
q_out = queue.Queue(maxsize=6)
H264_BSF = "h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0"
# (user 2026-11-14 «من المفترض ان نعمل على الكرت فقط») NVENC straight from CUDA memory (PyNvVideoCodec): the frame never leaves the card.
# Before: every frame was copied GPU -> CPU, pushed through a pipe (~90 MB/s) to ffmpeg, which copied it back to the GPU for NVENC
# (measured ~1 CPU core for the pipe thread + ffmpeg). Same NVENC settings as the ffmpeg line below. GR_FFENC=1 = the old ffmpeg way.
NVENC = nvc is not None and not os.environ.get("GR_FFENC")
PIN = [] if NVENC else [torch.empty(FS, dtype=torch.uint8, pin_memory=True) for _ in range(10)]   # > queue (6) + the one being written + the one being filled
ENC_STREAM = torch.cuda.current_stream()


class _NV12:   # the encoder's input: Y (H,W,1) and interleaved UV (H/2,W/2,2) planes of one contiguous CUDA buffer
    def __init__(self, t):
        self.t = t; self.p = [t[:W * H].view(H, W, 1), t[W * H:].view(H // 2, W // 2, 2)]

    def cuda(self):
        return self.p


def t_write_nvenc():
    raw = a.out[:-4] + "_nvenc.mp4"
    enc = nvc.CreateEncoder(W, H, "NV12", False, codec="h264", preset="P5", tuning_info="high_quality", rc="vbr", cq=a.cq,
                            bitrate=18000000, maxbitrate=26000000, vbvbufsize=52000000, profile="high", gop=250, bf=3, fps=FPS, gpu_id=0,
                            cudastream=ENC_STREAM.cuda_stream)   # R-RENDER-QUALITY.1 settings, as the ffmpeg line; gop/bf = ffmpeg's nvenc defaults (measured)
    # the library's own muxer writes every packet with its timestamp (a raw .h264 stream lost the B-frame display order when ffmpeg re-wrapped it:
    # measured, frames 0/1 swapped and the whole stream 1 frame short in time)
    TB = 90000
    mux = nvc.FFmpegMuxer(file_path=raw, media_format=nvc.GetMediaFormat(raw), codec="h264", width=W, height=H, fps_num=FPS, fps_den=1,
                          timebase_num=1, timebase_den=TB, extradata=enc.GetSequenceParams())
    mux.SetUniformPtsIncrement(TB // FPS)
    n = 0
    while True:
        b = q_out.get()
        if b is None:
            break
        b[1].synchronize()   # the frame is drawn (blocking wait: the thread sleeps), whatever stream the encoder copies on
        pp = nvc.NV_ENC_PIC_PARAMS(); pp.inputTimeStamp = n; n += 1
        for pk in enc.Encode(_NV12(b[0]), pp):
            mux.MuxVideoPacket(bytes(pk["data"]), pk["picture_type"], pk["timestamp"])
    for pk in enc.EndEncode():
        mux.MuxVideoPacket(bytes(pk["data"]), pk["picture_type"], pk["timestamp"])
    mux.Finalize()
    del mux   # the file is complete only once the muxer object is gone (measured: «Invalid data» before)
    r = subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-c", "copy", "-bsf:v", H264_BSF, a.out])   # colour tags, as the ffmpeg line
    if r.returncode:
        print("ERROR: muxing the NVENC stream failed", flush=True); os._exit(4)
    os.remove(raw)


def t_write():
    if NVENC:
        return t_write_nvenc()
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "nv12", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                            "-c:v", "h264_nvenc", "-preset", "p5", "-tune", "hq", "-rc", "vbr", "-cq", str(a.cq), "-b:v", "18M", "-maxrate", "26M", "-bufsize", "52M", "-profile:v", "high",   # R-RENDER-QUALITY.1: final >= 14 Mbps (cq alone gave 10.3 Mbps on a lesson)
                           
                            "-bsf:v", "h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0", "-threads", "4", a.out],   # project rule: ffmpeg -threads 4 at most
                           stdin=subprocess.PIPE, bufsize=FS * 6)
    while True:
        b = q_out.get()
        if b is None:
            break
        b[1].synchronize()
        enc.stdin.write(memoryview(b[0].numpy()))
    enc.stdin.close()
    enc.wait()


writer = threading.Thread(target=t_write, daemon=True)
writer.start()
dump_dir, dump_set = "", set()
if a.dump:
    dump_dir, lst = a.dump.rsplit(":", 1)
    dump_set = set(int(x) for x in lst.split(",") if x)

PROF = {"wait": 0.0, "gpu": 0.0, "put": 0.0}
FINE = os.environ.get("HY_PROF")   # fine per-stage timing (synchronises the GPU after each stage: slower, for measurement only)
PF = {"png": 0.0, "decode": 0.0, "draw": 0.0, "top": 0.0, "nv12": 0.0}
def _pf(k, t):
    if FINE:
        torch.cuda.synchronize(); n = time.time(); PF[k] += n - t; return n
    return t
def in_under(f):
    return any(x <= f <= y for x, y in UNDER_RANGES)


def put_pm(out, L):
    """a premultiplied BGRA layer (CUDA uint8, H+MR rows incl. the marker strip) over `out` (3,H,W float RGB 0..255)"""
    T = L[:H].permute(2, 0, 1).float()[[2, 1, 0, 3]]
    return out * (1.0 - T[3:4] / 255.0) + T[:3]


DUMP_PREFIX = os.environ.get("GR_DUMP_PREFIX", "gp")
t0 = time.time()
for i in range(NF):
    fno = FRAMES[i] if FRAMES else START + i
    _a = time.time()
    with cv:
        consumed[0] = fno
        if not cv.wait_for(lambda: FATAL or (fno in geoms and fno in tops and (fno not in under_frames or not in_under(fno) or fno in utops)
                                             and all((z, fno) in ltops for z in level_need.get(fno, ()))), timeout=300):
            print(f"ERROR: no geometry/graphics for frame {fno} (is the composition wrapped in <HybridHost>?)", flush=True)
            os._exit(2)
        if FATAL:
            print("ERROR: a graphics window failed: " + FATAL[0], flush=True)
            os._exit(3)
        slots = geoms.pop(fno)
        top = tops.pop(fno)
        utop = utops.pop(fno, None) if fno in under_frames else None
        utops.pop(fno, None)
        under_frames.discard(fno)
        need = level_need.pop(fno, [])
        layers = {z: ltops.pop((z, fno)) for z in need}
    if i % 10 == 0:
        schedule()
    _b = time.time()
    PROF["wait"] += _b - _a
    if fno in NOHOST:
        NOHOST.discard(fno)
        out = torch.zeros_like(BG)
    else:
        out = bg_for(fno)
    if os.environ.get("HY_DEBUG"): print("SLOTS", fno, json.dumps(slots)[:900], flush=True)
    # stacking (2026-11-12): layer 0 → plain videos z=0 → layer 1 → plain videos z=1 → … → under-him layer → masked cut-outs → top layer
    plain = [x for x in slots if not x.get("mt")]
    order = []
    for z in sorted(set(layers) | {x.get("z", 0) for x in plain}):
        if z in layers:
            order.append(("layer", z))
        order += [x for x in plain if x.get("z", 0) == z]
    slots = order + [None] + [x for x in slots if x.get("mt")]
    for s in slots:
        if s is None:
            if utop is not None:
                out = put_pm(out, utop)
            continue
        if isinstance(s, tuple):
            out = put_pm(out, layers[s[1]])
            continue
        path = a.public + "/" + s["src"]
        st = stream_for(path, slot_key(s))
        st.last_use = fno
        _t = time.time() if FINE else 0
        src = st.get(int(math.floor(s["t"] * st.fps + BIAS)))
        mat = None
        if s.get("mt"):  # masked slot: its matte is one more NVDEC stream, keyed like a video
            ms = stream_for(a.public + "/" + s["mt"], ("matte", round(s["mtT"] - s["f"] / FPS, 3)))
            ms.last_use = fno
            mat = ms.get(int(math.floor(s["mtT"] * ms.fps + BIAS)))
        _t = _pf("decode", _t)
        out = draw_slot(out, s, src, mat)
        _t = _pf("draw", _t)
    _t = time.time() if FINE else 0
    out = put_pm(out, top)
    if fno in dump_set or (FRAMES and dump_dir):
        cv2.imwrite(f"{dump_dir}/{DUMP_PREFIX}_{fno:06d}.png", out.round().clamp(0, 255).byte().permute(1, 2, 0).cpu().numpy()[..., ::-1])
        if os.environ.get("GR_DUMP_LAYER"):   # debug: the raw graphics layer (premultiplied BGRA) as Chromium painted it
            cv2.imwrite(f"{dump_dir}/{DUMP_PREFIX}_layer_{fno:06d}.png", top[:H].cpu().numpy())
    _t = _pf("top", _t)
    if NVENC:   # stays on the card: the encoder reads it on this same stream (queued behind the drawing), the queue keeps it alive until then
        nv_h = rgb_to_nv12(out)
    else:
        nv_h = PIN[i % len(PIN)]   # a ring of pinned buffers (was a fresh pinned allocation per frame: page-locking 3 MB costs CPU every frame)
        nv_h.copy_(rgb_to_nv12(out), non_blocking=True)
    ev = torch.cuda.Event(blocking=True); ev.record()
    nv = (nv_h, ev)
    _t = _pf("nv12", _t)
    _d = time.time()
    PROF["gpu"] += _d - _b
    q_out.put(nv)
    PROF["put"] += time.time() - _d
    if i % 100 == 0:
        for stm in list(STREAMS.values()):
            stm.idle_kill(fno)
    if i % 300 == 0:
        el = time.time() - t0
        print(f"frame {i}/{NF}  {i / max(el, 1e-6):.1f} fps  slots={len(slots)}", flush=True)
q_out.put(None)
writer.join()
for stm in STREAMS.values():
    stm._kill()
el = time.time() - t0
for c in CONNS:   # the workers write their audio assets, then exit
    try:
        csend(c, {"t": "quit"})
    except Exception:
        pass
for _ in range(100):
    if all(c.get("bye") for c in CONNS):
        break
    time.sleep(0.05)
print(f"DONE {NF} frames in {el:.1f}s => {NF / el:.1f} fps", flush=True)
print("PROFILE", {k: round(v, 1) for k, v in PROF.items()}, flush=True)
sk, pt = STATS["seek"], STATS["paint"]
print("GRAPHICS " + json.dumps({"layerFrames": STATS["layerFrames"], "textures": STATS["tex"], "stale": STATS["stale"], "fetchMsPerTex": round(1000 * STATS["fetch"] / max(1, STATS["tex"]), 2),
                                "seekMs": round(sum(sk) / max(1, len(sk)), 1), "paintWaitMs": round(sum(pt) / max(1, len(pt)), 1)}), flush=True)
if FINE: print("FINE", {k: round(v, 1) for k, v in PF.items()}, flush=True)
