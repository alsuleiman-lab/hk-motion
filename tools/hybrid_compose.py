"""GPU compositor of the hybrid renderer (NVDEC decode -> CUDA/torch compositing -> NVENC encode). Everything heavy runs on the NVIDIA card.
Remotion draws only the GRAPHICS (top.mov, ProRes 4444 with alpha, no video inside); this script puts the video layers underneath it,
following the per-frame geometry in timeline.json (src/hybrid/geom.ts). Full HD output.
Run with ComfyUI's python: python_embeded/python.exe tools/hybrid_compose.py --timeline t.json --top top.mov --out out.mp4 [--assets dir] ...
"""
import argparse, json, math, queue, subprocess, sys, threading, time
import numpy as np
import torch
import torch.nn.functional as F

ap = argparse.ArgumentParser()
ap.add_argument("--timeline", required=True)
ap.add_argument("--top", default="")  # (legacy) a ProRes file with the graphics
ap.add_argument("--listen", type=int, default=0)  # stream mode: Remotion sends the graphics as PNG frames over a local socket
ap.add_argument("--out", required=True)
ap.add_argument("--src", default="public/tir_cut_v3.mp4")
ap.add_argument("--brolls", default="public/stock/prep/ab_prepped.mp4,public/stock/prep/ps_prepped.mp4,public/stock/prep/ip_prepped.mp4")
ap.add_argument("--assets", default=".tmp/hybrid")
ap.add_argument("--w", type=int, default=1920)
ap.add_argument("--h", type=int, default=1080)
ap.add_argument("--orient", default="landscape")  # landscape (1920x1080) | portrait (1080x1920)
ap.add_argument("--win", dest="win", default=None)
ap.add_argument("--cq", type=int, default=17)
ap.add_argument("--top-filter", default="format=rgba")
a = ap.parse_args()
PORTRAIT = a.orient == "portrait"
W, H = (1080, 1920) if PORTRAIT else (1920, 1080)
SW, SH = 1920, 1080  # the source video (tir_cut_v3) is always Full HD landscape
if a.win is None:
    a.win = "public/tirwin/composed_all_p.mp4" if PORTRAIT else "public/tirwin/composed_all.mp4"
dev = "cuda"
torch.backends.cudnn.benchmark = True
tl = json.load(open(a.timeline))
START, END = tl["start"], tl["end"]
NF = END - START + 1
FS = W * H * 3 // 2  # output / window frame (NV12)
FS_SRC = SW * SH * 3 // 2  # source frame (NV12)


def ff_nv12_reader(path, start_frame, nframes, fps=30, w=W, h=H):
    """ffmpeg: NVDEC decode -> NV12 raw on stdout (only 3.1 MB/frame cross the pipe)."""
    cmd = ["ffmpeg", "-v", "error", "-hwaccel", "cuda", "-hwaccel_output_format", "cuda"]
    if start_frame:
        cmd += ["-ss", f"{start_frame / fps:.6f}"]
    cmd += ["-i", path, "-frames:v", str(nframes), "-vf", "hwdownload,format=nv12", "-f", "rawvideo", "-pix_fmt", "nv12", "-"]
    return subprocess.Popen(cmd, stdout=subprocess.PIPE, bufsize=w * h * 3 // 2 * 6)


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


def nv12_to_rgb(buf, w, h):
    t = torch.frombuffer(buf, dtype=torch.uint8).to(dev, non_blocking=True)
    y = t[: w * h].view(h, w).float()
    uv = t[w * h:].view(h // 2, w // 2, 2).float()
    u = F.interpolate(uv[..., 0][None, None], size=(h, w), mode="bilinear", align_corners=False)[0, 0]
    v = F.interpolate(uv[..., 1][None, None], size=(h, w), mode="bilinear", align_corners=False)[0, 0]
    Y = (y - 16.0) * 1.164383
    U = u - 128.0
    V = v - 128.0
    return torch.stack([Y + 1.792741 * V, Y - 0.213249 * U - 0.532909 * V, Y + 2.112402 * U]).clamp_(0, 255)


def rgb_to_nv12(rgb):
    r, g, b = rgb[0], rgb[1], rgb[2]
    y = 16.0 + 0.182586 * r + 0.614231 * g + 0.062007 * b
    u = 128.0 - 0.100644 * r - 0.338572 * g + 0.439216 * b
    v = 128.0 + 0.439216 * r - 0.398942 * g - 0.040274 * b
    u = F.avg_pool2d(u[None, None], 2)[0, 0]
    v = F.avg_pool2d(v[None, None], 2)[0, 0]
    return torch.cat([y.reshape(-1), torch.stack([u, v], -1).reshape(-1)]).add_(0.5).clamp_(0, 255).to(torch.uint8)


# ---------------- assets (rendered once by Remotion stills) ----------------
def load_png(path, rgba):
    from PIL import Image
    im = Image.open(path).convert("RGBA" if rgba else "RGB")
    return torch.from_numpy(np.array(im)).to(dev).permute(2, 0, 1).float()


BGS = {}  # background kinds: L (landscape scenes), Pexp (portrait explainer), Psplit (portrait split)
if PORTRAIT:
    BGS["Pexp"] = (load_png(f"{a.assets}/HybridGradP135.png", False), load_png(f"{a.assets}/HybridVigP.png", True))
    BGS["Psplit"] = (load_png(f"{a.assets}/HybridGradP160.png", False), None)
else:
    BGS["L"] = (load_png(f"{a.assets}/HybridGrad.png", False), load_png(f"{a.assets}/HybridVig.png", True))
STAR = load_png(f"{a.assets}/HybridStar.png", True)  # 4x140x140 straight alpha
STAR3 = STAR.repeat(1, 3, 3)  # 420x420 for wrap-around sampling
ys, xs = torch.meshgrid(torch.arange(H, device=dev) + 0.5, torch.arange(W, device=dev) + 0.5, indexing="ij")  # pixel centres (CSS space)


def over(dst, rgb, alpha):
    return dst * (1.0 - alpha) + rgb * alpha


def bg_frame(kind, sx, sy):
    GRAD, VIG = BGS[kind]
    out = GRAD.clone()
    # stars: tile coordinate = ((p - offset) mod 140); sample from the 3x3 tiled copy (+140) with bilinear filtering
    tx = torch.remainder(xs - sx, 140.0) + 140.0
    ty = torch.remainder(ys - sy, 140.0) + 140.0
    grid = torch.stack([tx / 420.0 * 2 - 1, ty / 420.0 * 2 - 1], -1)[None]
    st = F.grid_sample(STAR3[None], grid, mode="bilinear", padding_mode="border", align_corners=False)[0]
    out = over(out, st[:3], st[3:4] / 255.0)
    if VIG is not None:
        out = over(out, VIG[:3], VIG[3:4] / 255.0)
    return out


def rrect_sdf(qx, qy, hx, hy, r):
    px = qx.abs() - (hx - r)
    py = qy.abs() - (hy - r)
    return torch.sqrt(px.clamp(min=0) ** 2 + py.clamp(min=0) ** 2) - r + torch.minimum(torch.maximum(px, py), torch.zeros_like(px))


def gauss_blur(m, sigma):
    if sigma < 0.5:
        return m
    k = int(math.ceil(sigma * 3))
    x = torch.arange(-k, k + 1, device=dev).float()
    g = torch.exp(-(x ** 2) / (2 * sigma * sigma))
    g = g / g.sum()
    m = F.conv2d(F.pad(m[None, None], (k, k, 0, 0), mode="replicate"), g.view(1, 1, 1, -1))
    m = F.conv2d(F.pad(m, (0, 0, k, k), mode="replicate"), g.view(1, 1, -1, 1))
    return m[0, 0]


SHQ = 4  # shadows are computed on a 1/4 resolution grid (they are very soft)
ysq, xsq = torch.meshgrid(torch.arange(H // SHQ, device=dev) + 0.5, torch.arange(W // SHQ, device=dev) + 0.5, indexing="ij")


def draw_shadow(out, L):
    sh = L["shadow"]
    if not sh:
        return out
    c, s = math.cos(L["rot"]), math.sin(L["rot"])
    ox = L["cx"] + (sh["dx"] * c - sh["dy"] * s) * L["scl"]
    oy = L["cy"] + (sh["dx"] * s + sh["dy"] * c) * L["scl"]
    px, py = xsq * SHQ - ox, ysq * SHQ - oy
    qx = (px * c + py * s) / L["scl"]
    qy = (-px * s + py * c) / L["scl"]
    d = rrect_sdf(qx, qy, L["wo"] / 2, L["ho"] / 2, L["ro"]) * L["scl"]
    m = (0.5 - d / SHQ).clamp(0, 1)
    m = gauss_blur(m, sh["blur"] / 2 * L["scl"] / SHQ)
    m = F.interpolate(m[None, None], size=(H, W), mode="bilinear", align_corners=False)[0, 0]
    al = (m * sh["rgba"][3] * L["opacity"])[None]
    col = torch.tensor(sh["rgba"][:3], device=dev).view(3, 1, 1)
    return over(out, col, al)


def draw_video(out, L, srcimg, sw, shh):
    c, s = math.cos(L["rot"]), math.sin(L["rot"])
    px, py = xs - L["cx"], ys - L["cy"]
    qx = (px * c + py * s) / L["scl"]
    qy = (-px * s + py * c) / L["scl"]
    bw = L["bw"]
    # inner (video) box, grown by 1 output px so no seam shows under the border ring drawn by Remotion
    grow = 1.0 / L["scl"]
    d = rrect_sdf(qx, qy, L["wo"] / 2 - bw + grow, L["ho"] / 2 - bw + grow, max(0.0, L["ro"] - bw)) * L["scl"]
    cov = (0.5 - d).clamp(0, 1) * L["opacity"]
    u = qx + (L["wo"] / 2 - bw)
    v = qy + (L["ho"] / 2 - bw)
    sx = L["srcX"] + u / L["mapScale"]
    sy = L["srcY"] + v / L["mapScale"]
    grid = torch.stack([sx / sw * 2 - 1, sy / shh * 2 - 1], -1)[None]
    smp = F.grid_sample(srcimg[None], grid, mode="bilinear", padding_mode="border", align_corners=False)[0]
    return over(out, smp, cov[None])


# ---------------- sources ----------------
class WinCache:
    """decodes a 'behind the body' window (a few seconds) on demand."""

    def __init__(self):
        self.key = None
        self.frames = None

    def get(self, wf):
        blk = wf // 114
        if self.key != blk:
            p = ff_nv12_reader(a.win, blk * 114, 114)
            self.frames = []
            for _ in range(114):
                b = read_exact(p.stdout, FS)
                if b is None:
                    break
                self.frames.append(b)
            p.wait()
            self.key = blk
        i = min(wf - blk * 114, len(self.frames) - 1)
        return nv12_to_rgb(self.frames[i], W, H)


def load_broll(path):
    pr = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", path], capture_output=True, text=True).stdout.strip().split(",")
    bw_, bh_ = int(pr[0]), int(pr[1])
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", path, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    raw = p.stdout.read()
    p.wait()
    n = len(raw) // (bw_ * bh_ * 3)
    t = torch.frombuffer(bytearray(raw), dtype=torch.uint8).view(n, bh_, bw_, 3).to(dev)
    return t, bw_, bh_


BROLLS = [load_broll(x) for x in a.brolls.split(",") if x]
wincache = WinCache()

# ---------------- threads ----------------
q_main = queue.Queue(maxsize=6)
q_top = queue.Queue(maxsize=6)
q_out = queue.Queue(maxsize=6)


def t_main():
    """decodes the source in runs of consecutive frames (the 3-minute essence jumps between pieces)."""
    runs = []
    for sp in tl["frames"]:
        sf = sp.get("srcF", sp["f"])
        if runs and runs[-1][0] + runs[-1][1] == sf:
            runs[-1][1] += 1
        else:
            runs.append([sf, 1])
    last = None
    for start_f, cnt in runs:
        p = ff_nv12_reader(a.src, start_f, cnt, w=SW, h=SH)
        for _ in range(cnt):
            b = read_exact(p.stdout, FS_SRC)
            if b is None:
                b = last  # the source has one frame less than the composition: hold the last one
            last = b
            q_main.put(b)
        p.wait()


import socket, struct, concurrent.futures
import cv2
cv2.setNumThreads(1)
frames_fut = {}
cv = threading.Condition()
pool = concurrent.futures.ThreadPoolExecutor(max_workers=7)


def decode_png(data):
    im = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_UNCHANGED)
    if im.shape[2] == 3:
        im = np.dstack([im, np.full(im.shape[:2], 255, np.uint8)])
    return im  # BGRA


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
        fut = pool.submit(decode_png, data)
        with cv:
            frames_fut[idx] = fut
            cv.notify_all()


def get_top(idx):
    with cv:
        cv.wait_for(lambda: idx in frames_fut)
        fut = frames_fut.pop(idx)
    return fut.result()


def t_top():
    cmd = ["ffmpeg", "-v", "error", "-i", a.top, "-frames:v", str(NF), "-vf", a.top_filter, "-f", "rawvideo", "-pix_fmt", "rgba", "-"]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, bufsize=W * H * 4 * 4)
    n = W * H * 4
    for _ in range(NF):
        b = read_exact(p.stdout, n)
        q_top.put(b)


def t_write():
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "nv12", "-s", f"{W}x{H}", "-r", "30", "-i", "-",
                            "-c:v", "h264_nvenc", "-preset", "p5", "-tune", "hq", "-rc", "vbr", "-cq", str(a.cq), "-b:v", "0", "-profile:v", "high",
                            "-bsf:v", "h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0", a.out],
                           stdin=subprocess.PIPE, bufsize=FS * 6)
    while True:
        b = q_out.get()
        if b is None:
            break
        enc.stdin.write(b)
    enc.stdin.close()
    enc.wait()


threading.Thread(target=t_main, daemon=True).start()
if a.listen:
    threading.Thread(target=t_top_socket, daemon=True).start()
else:
    threading.Thread(target=t_top, daemon=True).start()
writer = threading.Thread(target=t_write, daemon=True)
writer.start()

PROF = {"wait_main": 0.0, "wait_top": 0.0, "gpu": 0.0, "put": 0.0}
t0 = time.time()
for i in range(NF):
    spec = tl["frames"][i]
    _a = time.time()
    mainbuf = q_main.get()
    _b = time.time()
    topimg = get_top(START + i) if a.listen else None
    topbuf = None if a.listen else q_top.get()
    _c = time.time()
    PROF["wait_main"] += _b - _a
    PROF["wait_top"] += _c - _b
    S = nv12_to_rgb(mainbuf, SW, SH)
    base = spec["base"]
    srcimg = S if base["src"] == "main" else wincache.get(base["winFrame"])
    iw, ih = (SW, SH) if base["src"] == "main" else (W, H)
    z = base["z"]
    if abs(z - 1.0) > 1e-6 or base["scale"] != 1 or base["offX"] != 0 or base["offY"] != 0:
        px = base["ox"] + (xs - base["ox"]) / z  # zoomed output position
        py = base["oy"] + (ys - base["oy"]) / z
        gx = (px + base["offX"]) / base["scale"] / iw * 2 - 1
        gy = (py + base["offY"]) / base["scale"] / ih * 2 - 1
        img = F.grid_sample(srcimg[None], torch.stack([gx, gy], -1)[None], mode="bilinear", padding_mode="border", align_corners=False)[0]
    else:
        img = srcimg
    out = img
    if spec["scene"]:
        out = bg_frame(spec["scene"]["bg"], spec["scene"]["starsX"], spec["scene"]["starsY"])
    for L in spec["layers"]:
        out = draw_shadow(out, L)
        if L["src"] == "main":
            out = draw_video(out, L, S, SW, SH)
            if L["id"] == "bgv":  # blue veil over the enlarged background video (same gradient as the scene background, 80%)
                out = over(out, BGS["L"][0], 0.8)
        else:
            bi = int(L["src"][5:])
            tens, bwid, bhei = BROLLS[bi]
            fr = tens[min(L["sf"], tens.shape[0] - 1)].permute(2, 0, 1).float()
            out = draw_video(out, L, fr, bwid, bhei)
    if a.listen:
        T = torch.from_numpy(topimg).to(dev, non_blocking=True).permute(2, 0, 1).float()[[2, 1, 0, 3]]  # BGRA -> RGBA
    else:
        T = torch.frombuffer(topbuf, dtype=torch.uint8).to(dev, non_blocking=True).view(H, W, 4).permute(2, 0, 1).float()
    out = over(out, T[:3], T[3:4] / 255.0)
    nv = rgb_to_nv12(out).cpu().numpy().tobytes()
    _d = time.time()
    PROF["gpu"] += _d - _c
    q_out.put(nv)
    PROF["put"] += time.time() - _d
    if i % 150 == 0:
        el = time.time() - t0
        print(f"frame {i}/{NF}  {i / max(el, 1e-6):.1f} fps", flush=True)
q_out.put(None)
writer.join()
el = time.time() - t0
print(f"DONE {NF} frames in {el:.1f}s => {NF / el:.1f} fps", flush=True)
print("PROFILE", {k: round(v, 1) for k, v in PROF.items()}, flush=True)
