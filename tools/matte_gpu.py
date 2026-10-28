"""One-pass GPU matte (trial 2026-10-23): NVDEC decode -> RVM -> mask clean-up in PyTorch ON THE GPU -> NVENC gray mask video. No alpha WebM is made.
Replaces the three slow separate steps (tools/matte_rvm.py + tools/matte_strong_land.py on the CPU + libvpx-vp9 alpha encode).
Usage: python tools/matte_gpu.py <in.mp4> <mask_out.mp4> [--ratio 0.6] [--model models/rvm_resnet50_fp32.torchscript] [--reset N] [--no-clean] [--fill] [--lossless]
       [--ymax 700 --xl 840 --xr 1100 --xs0 760 --xs1 1180]   (same meaning as matte_strong_land.py; defaults suit the full-frame 1920x1080 landscape cut)
Output: grayscale video (white = person) for ffmpeg alphamerge or for a mask layer in Remotion. The clean-up follows matte_strong_land.py rule by rule
(chair mesh beside the head, side greys, row-run filter on the head zone, biggest blob, head opening, notch closing, dark/skin restore, erode+blur); differences:
square max-pool kernels instead of elliptical ones, and the blob filter runs on a quarter-size mask."""
import sys, subprocess, threading, queue, time
import numpy as np, torch, torch.nn.functional as F, cv2
import kornia
a = sys.argv[1:]
src, out = a[0], a[1]
opt = lambda n, d: type(d)(a[a.index("--" + n) + 1]) if ("--" + n) in a else d
ratio, reset = opt("ratio", 0.6), opt("reset", 0)
model_path = opt("model", "models/rvm_resnet50_fp32.torchscript")
ymax, xl, xr, xs0, xs1 = opt("ymax", 700), opt("xl", 840), opt("xr", 1100), opt("xs0", 760), opt("xs1", 1180)
CLEAN = "--no-clean" not in a
RUNFILTER = "--run" in a               # OFF by default: it cut hands raised beside the head with a straight edge at HEAD_Y (visual test 2026-10-23)
FILL = "--fill" in a                 # OFF by default (2026-10-23, user): filling holes can ruin the real gaps between fingers, arm and body
FILL_MAX = opt("fill-max", 2500)   # quarter-size pixels (2500 = 40 000 px at 1080p)
dev = "cuda"
pr = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate", "-of", "csv=p=0", src], capture_output=True, text=True).stdout.strip().split(",")
W, H = int(pr[0]), int(pr[1]); fn, fd = pr[2].split("/"); fps = float(fn) / float(fd)
dec = subprocess.Popen(["ffmpeg", "-hide_banner", "-v", "error", "-hwaccel", "cuda", "-i", src, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE, bufsize=W * H * 3 * 4)
LOSSLESS = "--lossless" in a   # ffv1 gray (huge, for measuring what NVENC compression does to the mask edges)
vcodec = ["-c:v", "ffv1", "-pix_fmt", "gray"] if LOSSLESS else ["-c:v", "h264_nvenc", "-preset", "p5", "-rc", "constqp", "-qp", "10", "-pix_fmt", "yuv420p"]
enc = subprocess.Popen(["ffmpeg", "-hide_banner", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-", *vcodec, out], stdin=subprocess.PIPE)
frames_q: "queue.Queue" = queue.Queue(maxsize=8)
def reader():
    n = W * H * 3
    while True:
        b = dec.stdout.read(n)
        if len(b) < n: break
        frames_q.put(np.frombuffer(b, np.uint8).reshape(H, W, 3).copy())
    frames_q.put(None)
threading.Thread(target=reader, daemon=True).start()
model = torch.jit.load(model_path, map_location=dev).eval()
HALF = "--half" in a
if HALF: model = model.half()

yy = torch.arange(H, device=dev).view(H, 1); xx = torch.arange(W, device=dev).view(1, W)
def median_x(mask_rows, y0, y1, default):
    ys, xs = torch.nonzero(mask_rows[y0:y1] > 0.5, as_tuple=True)
    return int(xs.float().median().item()) if xs.numel() else default
def maxpool(m, k): return F.max_pool2d(m[None, None], k, 1, k // 2)[0, 0]
def minpool(m, k): return -F.max_pool2d(-m[None, None], k, 1, k // 2)[0, 0]
def runs_touching(m, lo, hi):
    """keep, per row, only the runs of `m` (rows already sliced) that overlap columns lo..hi (exact version of the row-run filter, vectorised)"""
    h, w = m.shape; idx = torch.arange(w, device=dev).view(1, w).expand(h, w)
    seed = m & (idx >= lo) & (idx <= hi)
    neg = torch.full_like(idx, -1)
    brk_f = torch.cummax(torch.where(~m, idx, neg), 1).values
    seed_f = torch.cummax(torch.where(seed, idx, neg), 1).values
    reach_f = seed_f > brk_f
    mr, sr = m.flip(1), seed.flip(1)          # scan from the right: positions are indices in the flipped row
    brk_b = torch.cummax(torch.where(~mr, idx, neg), 1).values
    seed_b = torch.cummax(torch.where(sr, idx, neg), 1).values
    reach_b = (seed_b > brk_b).flip(1)
    return m & (reach_f | reach_b)

HEAD_Y = 470
def clean(rgb_u8, pha):
    f = rgb_u8.permute(2, 0, 1).float() / 255.0
    hsv = kornia.color.rgb_to_hsv(f[None])[0]
    V, S = hsv[2], hsv[1]
    al0 = pha.clone(); al = pha.clone()
    white = (V >= 150 / 255) & (S <= 38 / 255)
    white[ymax:, :] = False
    col = (xx >= xl) & (xx < xr)
    white = (white & ~col.expand(H, W)) | (white & (al < 0.9))
    _cx = median_x(al0, 80, 430, W // 2)
    side = torch.zeros((H, W), dtype=torch.bool, device=dev); side[:HEAD_Y, :xs0] = True; side[:HEAD_Y, xs1:] = True
    greyish = (V > 95 / 255) & (S < 45 / 255)
    side[:, max(_cx - 190, 0):_cx + 190] = False
    white = white | (side & greyish)
    al[maxpool(white.float(), 7) > 0] = 0
    cx0 = median_x(al, 80, 430, W // 2)
    sd = ((V >= 125 / 255) & (S <= 50 / 255))
    reg = torch.zeros_like(sd); reg[300:1000, :max(cx0 - 520, 0)] = True; reg[300:1000, cx0 + 520:] = True
    al[maxpool((sd & reg).float(), 7) > 0] = 0
    # row-run filter on the head zone
    head = al[:HEAD_Y] > 0.5
    cx = median_x(al, 80, 430, W // 2)
    if RUNFILTER:   # cuts hands raised beside the head with a straight horizontal edge at HEAD_Y (seen 2026-10-23); use --run to enable it
        keep_head = runs_touching(head, cx - 330, cx + 330)
        al[:HEAD_Y][head & ~keep_head] = 0
    # biggest blob (+ big blobs) on a quarter-size mask
    m = (al > 0.5).float()
    ms = (F.avg_pool2d(m[None, None], 4)[0, 0] > 0.5)
    msn = ms.to(torch.uint8).cpu().numpy()                       # 270x480: the component labelling is tiny, run it on the CPU (kornia's iterative version did not converge on big blobs and ate the head)
    nb, labn, st, _ = cv2.connectedComponentsWithStats(msn, connectivity=8)
    if nb > 1:
        big = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
        keepn = np.isin(labn, [big] + [j for j in range(1, nb) if j != big and st[j, cv2.CC_STAT_AREA] > 60000 / 16]).astype(np.float32)
        keep = torch.from_numpy(keepn).to(dev)
        keep_full = F.interpolate(maxpool(keep, 3)[None, None], size=(H, W), mode="nearest")[0, 0] > 0
        al[~keep_full & (m > 0)] = 0
    if FILL:   # fill small ENCLOSED holes (RVM leaves "smoke" patches inside the robe when a hand crosses it); gaps that touch the frame border are never filled
        mq = (F.avg_pool2d((al > 0.5).float()[None, None], 4)[0, 0] > 0.5).to(torch.uint8).cpu().numpy()
        nb2, lab2, st2, _ = cv2.connectedComponentsWithStats(1 - mq, connectivity=4)
        fillq = np.zeros_like(mq, dtype=np.float32)
        for j in range(1, nb2):
            x0, y0, w0, h0, ar = st2[j]
            if ar <= FILL_MAX and x0 > 0 and y0 > 0 and x0 + w0 < mq.shape[1] and y0 + h0 < mq.shape[0]: fillq[lab2 == j] = 1.0
        if fillq.any():
            fm = F.interpolate(maxpool(torch.from_numpy(fillq).to(dev), 3)[None, None], size=(H, W), mode="nearest")[0, 0] > 0
            al = torch.where(fm, torch.maximum(al, torch.ones_like(al)), al)
    hb = (al[:HEAD_Y] > 0.5).float()
    op = maxpool(minpool(hb, 11), 11)
    al[:HEAD_Y][(hb > 0) & (op == 0)] = 0
    # close notches in the head column
    hm = (al > 0.5).float()
    x0c, x1c = max(_cx - 190, 0), _cx + 190
    sub = hm[:HEAD_Y, max(x0c - 30, 0):x1c + 30]
    cl = minpool(maxpool(sub, 45), 45)[:, (x0c - max(x0c - 30, 0)):(x0c - max(x0c - 30, 0)) + (x1c - x0c)]
    reg2 = al[:HEAD_Y, x0c:x1c]
    al[:HEAD_Y, x0c:x1c] = torch.where((cl > 0) & (hm[:HEAD_Y, x0c:x1c] == 0), torch.ones_like(reg2), reg2)
    # restore dark / saturated pixels near the kept person
    near = maxpool((al > 0.5).float(), 41) > 0
    keepc = ((V < 105 / 255) | (S > 55 / 255)) & (al0 > 0.5) & near
    al = torch.where(keepc, torch.maximum(al, al0), al)
    al = minpool(al, 3)
    k = torch.exp(-0.5 * (torch.arange(-4, 5, device=dev).float() / 1.3) ** 2); k = (k / k.sum())
    al = F.conv2d(F.pad(al[None, None], (4, 4, 0, 0), mode="replicate"), k.view(1, 1, 1, 9))
    al = F.conv2d(F.pad(al, (0, 0, 4, 4), mode="replicate"), k.view(1, 1, 9, 1))[0, 0]
    return torch.clamp((al - 0.08) * 1.12, 0, 1)

rec = [None] * 4; n = 0; t0 = time.time()
with torch.no_grad():
    while True:
        fr = frames_q.get()
        if fr is None: break
        if reset and n and n % reset == 0: rec = [None] * 4
        rgb = torch.from_numpy(fr).to(dev, non_blocking=True)
        t = rgb.permute(2, 0, 1).float().div(255).unsqueeze(0)
        _fgr, pha, *rec = model(t.half() if HALF else t, *rec, ratio)
        p = pha[0, 0].float().clamp(0, 1)
        if CLEAN: p = clean(rgb, p)
        enc.stdin.write((p * 255).round().byte().cpu().numpy().tobytes()); n += 1
enc.stdin.close(); enc.wait(); dec.wait()
print(f"matte_gpu: {n} frames in {time.time() - t0:.1f}s ({n / max(time.time() - t0, 1e-6):.1f} fps)")
