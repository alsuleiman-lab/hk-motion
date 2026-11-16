"""(kept from the fatiha reel 2026-10-26; used for «المقطع خلف الشيخ»: matte_gpu.py --no-clean then this) Remove the white mesh chair from the RVM matte (bright + unsaturated, not warm), keep the biggest blob, restore enclosed holes. Usage: python clean_matte.py video.mp4 matte.mp4 out.mp4"""
import sys, subprocess, numpy as np, torch, torch.nn.functional as F, cv2
vid, mat, out = sys.argv[1:4]
W, H = 1080, 1920
def dec(p, fmt, ch):
    return subprocess.Popen(["ffmpeg", "-v", "error", "-hwaccel", "cuda", "-i", p, "-f", "rawvideo", "-pix_fmt", fmt, "-"], stdout=subprocess.PIPE, bufsize=W * H * ch * 4)
dv, dm = dec(vid, "rgb24", 3), dec(mat, "gray", 1)
enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{W}x{H}", "-r", "30", "-i", "-", "-c:v", "h264_nvenc", "-preset", "p5", "-cq", "16", "-pix_fmt", "yuv420p", "-g", "30", out], stdin=subprocess.PIPE)
dev = "cuda"; n = 0
while True:
    bv = dv.stdout.read(W * H * 3); bm = dm.stdout.read(W * H)
    if len(bv) < W * H * 3 or len(bm) < W * H: break
    v = torch.frombuffer(bytearray(bv), dtype=torch.uint8).to(dev).view(H, W, 3).float() / 255
    m = torch.frombuffer(bytearray(bm), dtype=torch.uint8).to(dev).view(H, W).float() / 255
    mx, mn = v.max(2).values, v.min(2).values
    sat = (mx - mn) / (mx + 1e-4)
    warm = (v[..., 0] - v[..., 2]) > 0.06
    chair = (mx > 0.62) & (sat < 0.16) & ~warm
    c = F.max_pool2d(chair.float()[None, None], 9, 1, 4)[0, 0] > 0
    kill = c & (mx > 0.45) & ~warm
    kill[1150:] = False
    m0 = m
    m = torch.where(kill, torch.zeros_like(m), m)
    q = (F.avg_pool2d(m[None, None], 4)[0, 0] > 0.5).byte().cpu().numpy()
    nl, lab, st, _ = cv2.connectedComponentsWithStats(q, 8)
    body = (lab == 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))).astype(np.uint8) if nl > 1 else q
    ff = np.pad(body.copy(), 1); msk = np.zeros((ff.shape[0] + 2, ff.shape[1] + 2), np.uint8)
    cv2.floodFill(ff, msk, (0, 0), 2); outside = (ff[1:-1, 1:-1] == 2)
    keep = torch.from_numpy((~outside).astype(np.float32)).to(dev)[None, None]
    keep = F.interpolate(F.max_pool2d(keep, 3, 1, 1), size=(H, W), mode="bilinear")[0, 0]
    m = m0 * keep.clamp(0, 1) * torch.where(kill & (keep < 0.5), torch.zeros_like(m), torch.ones_like(m))
    m = F.avg_pool2d(m[None, None], 3, 1, 1)[0, 0]
    enc.stdin.write((m * 255).byte().cpu().numpy().tobytes()); n += 1
enc.stdin.close(); enc.wait(); print("frames", n)
