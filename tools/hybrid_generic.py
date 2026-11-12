"""GENERIC GPU compositor of the hybrid renderer (NVDEC decode -> CUDA/torch compositing -> NVENC encode). Used by tools/hybrid_any.mjs.
Remotion renders only the GRAPHICS layer (transparent PNG frames, sent over a local socket) and, every frame, POSTs where each <VSlot> video sits
on screen (affine matrix measured from the DOM: src/hybrid/Slot.tsx) to the HTTP port of this script. For each frame we composite
    static background image  ->  every video slot (decoded by NVDEC, warped/clipped/filtered on the GPU)  ->  the graphics PNG on top.
No per-project geometry. Run with ComfyUI's python (torch+cuda+cv2).
"""
import os, argparse, concurrent.futures, http.server, json, math, queue, socket, struct, subprocess, sys, threading, time
import numpy as np
import torch
import torch.nn.functional as F
import cv2

ap = argparse.ArgumentParser()
ap.add_argument("--listen", type=int, required=True)   # PNG frames from Remotion
ap.add_argument("--geom", type=int, required=True)     # slot geometry POSTs from the page
ap.add_argument("--out", required=True)
ap.add_argument("--bg", default="")                    # static background PNG (rendered once with {hybrid:"bg"})
ap.add_argument("--public", required=True)             # real public/ folder (video sources)
ap.add_argument("--w", type=int, default=1920)
ap.add_argument("--h", type=int, default=1080)
ap.add_argument("--fps", type=int, default=30)
ap.add_argument("--start", type=int, default=0)
ap.add_argument("--end", type=int, required=True)
ap.add_argument("--cq", type=int, default=int(os.environ.get("HY_CQ", "15")))   # flat cartoon art needs a lower cq to reach the 14 Mbps floor
ap.add_argument("--dump", default="")                  # debug: also write the composited frames at these indices as PNG (comma list) into this dir  "dir:1,2,3"
a = ap.parse_args()
W, H, FPS = a.w, a.h, a.fps
START, END = a.start, a.end
NF = END - START + 1
import os
BIAS = float(os.environ.get("HY_BIAS", "0.0001"))
dev = "cuda"
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


def probe(path):
    if path not in PROBE:
        o = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate,nb_frames,color_range,color_space", "-of", "json", path], capture_output=True, text=True).stdout
        s = json.loads(o)["streams"][0]
        n, d = s["r_frame_rate"].split("/")
        nb = int(s["nb_frames"]) if s.get("nb_frames", "N/A").isdigit() else 10 ** 9
        full = s.get("color_range") == "pc"
        m601 = s.get("color_space") in ("bt470bg", "smpte170m")
        PROBE[path] = (int(s["width"]), int(s["height"]), float(n) / float(d), nb, full, m601)
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
        cmd += ["-i", self.path, "-fps_mode", "passthrough", "-vf", "hwdownload,format=nv12", "-f", "rawvideo", "-pix_fmt", "nv12", "-"]
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


STREAMS = {}
SLOCK = threading.Lock()


def stream_for(path, key):
    with SLOCK:
        k = (path, key)
        if k not in STREAMS:
            STREAMS[k] = Stream(path)
        return STREAMS[k]


def slot_key(s):
    # same file, same playback rate and same offset between comp time and source time = the same continuously playing video
    return (s["rate"], round(s["t"] - s["f"] * s["rate"] / FPS, 3))


# ---------------- geometry server ----------------
geoms = {}
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
        obj = json.loads(self.rfile.read(n))
        for s in obj["slots"]:
            path = a.public + "/" + s["src"]
            st = stream_for(path, slot_key(s))
            st.prepare(int(math.floor(s["t"] * st.fps + BIAS)))
        with cv:
            geoms[obj["frame"]] = obj["slots"]
            if obj.get("under"):  # (2026-11-12) this frame also has an under-him layer (sent with bit 31 on the PNG socket)
                if UNDER_ON:
                    under_frames.add(obj["frame"])
                elif not UNDER_WARNED:
                    UNDER_WARNED.append(1); print(f"WARNING: frame {obj['frame']} has graphics UNDER his cut-out but hybrid_any got no --under: they are missing", flush=True)
            cv.notify_all()
        self.send_response(200)
        self._cors()
        self.send_header("Content-Length", "0")
        self.end_headers()


class Srv(http.server.ThreadingHTTPServer):
    daemon_threads = True
    request_queue_size = 64


threading.Thread(target=Srv(("127.0.0.1", a.geom), H_).serve_forever, daemon=True).start()

# ---------------- PNG layer from Remotion ----------------
cv2.setNumThreads(1)
pngs = {}
upngs, under_frames = {}, set()
UNDER_ON, UNDER_WARNED = os.environ.get("HY_UNDER") == "1", []   # under-him layer: compressed PNGs by frame, and the frames whose geometry says they need one
pool = concurrent.futures.ThreadPoolExecutor(max_workers=7)


def decode_png(data):
    im = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_UNCHANGED)
    if im.shape[2] == 3:
        im = np.dstack([im, np.full(im.shape[:2], 255, np.uint8)])
    t = torch.empty(im.shape, dtype=torch.uint8, pin_memory=True)
    t.numpy()[...] = im
    return t  # BGRA, pinned (async upload)


def t_top_socket():
    srv = socket.socket()
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind(("127.0.0.1", a.listen))
    srv.listen(1)
    print("READY", flush=True)
    conn, _ = srv.accept()
    fh = conn.makefile("rb", buffering=1 << 20)
    while True:
        hdr = fh.read(8)
        if len(hdr) < 8:
            break
        idx, ln = struct.unpack("<II", hdr)
        data = fh.read(ln)
        with cv:   # kept compressed; decoded only a few frames ahead of the compositor (several browsers send far ahead: 8 MB per decoded frame)
            if idx & 0x80000000:
                upngs[idx & 0x7FFFFFFF] = data
            else:
                pngs[idx] = data
            cv.notify_all()


threading.Thread(target=t_top_socket, daemon=True).start()

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
    return smp


VEIL_RGB = torch.tensor([6.0, 12.0, 22.0], device=dev).view(3, 1, 1)  # BgClip veil colour


def draw_slot(out, s, src, mat=None):
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
    # clip box grown by 1 output px so no seam shows under a border ring drawn by Remotion
    grow = 1.0 / scl
    d = rrect_sdf(qx - w / 2, qy - h / 2, w / 2 + grow, h / 2 + grow, max(0.0, s["r"] + grow)) * scl
    cov = (0.5 - d).clamp(0, 1) * s["o"]
    # the video frame itself may be smaller than the clipped box (e.g. a letter-boxed "contain" copy): never smear its edge pixels over the rest of the box
    if s["vx"] > 0.01 or s["vy"] > 0.01 or s["vx"] + s["vw"] < w - 0.01 or s["vy"] + s["vh"] < h - 0.01 or True:
        ex = torch.minimum(qx - s["vx"], s["vx"] + s["vw"] - qx) * scl
        ey = torch.minimum(qy - s["vy"], s["vy"] + s["vh"] - qy) * scl
        cov = cov * (torch.minimum(ex, ey) + 0.5).clamp(0, 1)
    sh_, sw_ = src.shape[1:]
    kx, ky = scl * s["vw"] / sw_, scl * s["vh"] / sh_
    if kx < 0.8 or ky < 0.8:  # large reduction: pre-filter (area-like) so it matches the browser's smooth scaling, then warp 1:1
        nw, nh = max(2, int(round(sw_ * min(kx, 1.0)))), max(2, int(round(sh_ * min(ky, 1.0))))
        src = F.interpolate(src[None], size=(nh, nw), mode="bilinear", antialias=True, align_corners=False)[0]
    gx = (qx - s["vx"]) / s["vw"] * 2 - 1
    gy = (qy - s["vy"]) / s["vh"] * 2 - 1
    smp = F.grid_sample(src[None], torch.stack([gx, gy], -1)[None], mode="bilinear", padding_mode="border", align_corners=False)[0]
    smp = apply_fx(smp, s["fx"], scl)
    veil = s["fx"].get("veil", 0)
    if veil:  # (2026-11-12) BgClip's dark veil = CSS radial-gradient(ellipse at 50% 45%, rgba(6,12,22,veil*.5) 0%, rgba(6,12,22,veil+.25) 100%), farthest-corner, in the box
        cx, cy, rx0, ry0 = w * 0.5, h * 0.45, w * 0.5, h * 0.45
        k = math.sqrt(1.0 + (0.55 / 0.45) ** 2)
        tt = torch.sqrt(((qx - cx) / (rx0 * k)) ** 2 + ((qy - cy) / (ry0 * k)) ** 2).clamp(0, 1)
        al = (veil * 0.5 + (veil * 0.5 + 0.25) * tt)[None]
        smp = smp * (1.0 - al) + VEIL_RGB * al
    if mat is not None:  # (2026-11-12) isolated cut-out: alpha = matte red; below `fl` (fraction of the height) the original picture stays whole — as MaskedVideo's shader
        al = F.grid_sample(mat[0:1][None], torch.stack([gx, gy], -1)[None], mode="bilinear", padding_mode="border", align_corners=False)[0, 0] / 255.0
        fl = s.get("fl", 0) or 0
        if fl > 0:
            v = ((qy - s["vy"]) / s["vh"] - fl) / 0.02
            v = v.clamp(0, 1)
            al = torch.maximum(al, v * v * (3 - 2 * v))
        cov = cov * al.clamp(0, 1)
    reg = out[:, y0:y1, x0:x1]
    out[:, y0:y1, x0:x1] = reg * (1.0 - cov[None]) + smp * cov[None]
    return out


# ---------------- encoder thread ----------------
q_out = queue.Queue(maxsize=6)


def t_write():
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "nv12", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                            "-c:v", "h264_nvenc", "-preset", "p5", "-tune", "hq", "-rc", "vbr", "-cq", str(a.cq), "-b:v", "18M", "-maxrate", "26M", "-bufsize", "52M", "-profile:v", "high",   # R-RENDER-QUALITY.1: final >= 14 Mbps (cq alone gave 10.3 Mbps on a lesson)
                           
                            "-bsf:v", "h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0", a.out],
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
futs, LOOKAHEAD = {}, 14
t0 = time.time()
for i in range(NF):
    fno = START + i
    _a = time.time()
    with cv:
        if not cv.wait_for(lambda: fno in geoms and (fno in pngs or fno in futs) and (fno not in under_frames or fno in upngs), timeout=180):
            print(f"ERROR: no geometry/graphics for frame {fno} (is the composition wrapped in <HybridHost>?)", flush=True)
            sys.exit(2)
        slots = geoms.pop(fno)
        for j in range(fno, fno + LOOKAHEAD):
            if j not in futs and j in pngs:
                futs[j] = pool.submit(decode_png, pngs.pop(j))
        fut = futs.pop(fno)
        ufut = pool.submit(decode_png, upngs.pop(fno)) if fno in under_frames else None
        under_frames.discard(fno)
    _w = time.time()
    top = fut.result()
    _b = time.time()
    if FINE: PF["png"] += _b - _w
    PROF["wait"] += _b - _a
    out = BG.clone()
    if os.environ.get("HY_DEBUG"): print("SLOTS", fno, json.dumps(slots)[:900], flush=True)
    def put_layer(out, L):  # a transparent BGRA layer over `out`
        T = L.to(dev, non_blocking=True).permute(2, 0, 1).float()[[2, 1, 0, 3]]
        return out * (1.0 - T[3:4] / 255.0) + T[:3] * (T[3:4] / 255.0)
    # stacking (2026-11-12): plain videos → under-him layer → masked cut-outs → top layer
    slots = [x for x in slots if not x.get("mt")] + [None] + [x for x in slots if x.get("mt")]
    for s in slots:
        if s is None:
            if ufut is not None:
                out = put_layer(out, ufut.result())
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
    T = top.to(dev, non_blocking=True).permute(2, 0, 1).float()[[2, 1, 0, 3]]  # BGRA -> RGBA
    out = out * (1.0 - T[3:4] / 255.0) + T[:3] * (T[3:4] / 255.0)
    if fno in dump_set:
        cv2.imwrite(f"{dump_dir}/hy_{fno:06d}.png", out.round().clamp(0, 255).byte().permute(1, 2, 0).cpu().numpy()[..., ::-1])
    _t = _pf("top", _t)
    nv_h = torch.empty(FS, dtype=torch.uint8, pin_memory=True)
    nv_h.copy_(rgb_to_nv12(out), non_blocking=True)
    ev = torch.cuda.Event(); ev.record()
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
print(f"DONE {NF} frames in {el:.1f}s => {NF / el:.1f} fps", flush=True)
print("PROFILE", {k: round(v, 1) for k, v in PROF.items()}, flush=True)
if FINE: print("FINE", {k: round(v, 1) for k, v in PF.items()}, flush=True)
