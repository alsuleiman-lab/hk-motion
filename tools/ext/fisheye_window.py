# تشويه «عين السمكة» حول نقطة في نافذة زمنية من فيديو، مع بقاء كل الإطارات الأخرى كما هي (أمر المستخدم 2026-11-19: تركيز على حكّ الأنف في الريل الأول).
#   python tools/ext/fisheye_window.py <in.mp4> <out.mp4> cx cy radius strength t0 t1 [ramp=0.25]
# الإخراج بلا صوت وبنفس الأبعاد والإطارات؛ تُعالَج المنطقة حول النقطة فقط وتُقرأ الإطارات الباقية وتُكتب كما هي.
import sys, subprocess, json, numpy as np
inp, out = sys.argv[1], sys.argv[2]
cx, cy, R, A, t0, t1 = [float(x) for x in sys.argv[3:9]]
ramp = float(sys.argv[9]) if len(sys.argv) > 9 else 0.25
pr = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate", "-of", "json", inp]))["streams"][0]
W, H = int(pr["width"]), int(pr["height"]); n, d = pr["r_frame_rate"].split("/"); fps = float(n) / float(d)
dec = subprocess.Popen(["ffmpeg", "-v", "error", "-hwaccel", "cuda", "-i", inp, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-", "-c:v", "h264_nvenc", "-preset", "p7", "-rc", "vbr", "-cq", "15", "-b:v", "0", "-pix_fmt", "yuv420p", "-an", out], stdin=subprocess.PIPE)
x0, x1, y0, y1 = int(max(0, cx - R)), int(min(W, cx + R)), int(max(0, cy - R)), int(min(H, cy + R))
yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
dx, dy = xx - cx, yy - cy; u = np.minimum(np.hypot(dx, dy) / R, 1.0)
sm = lambda v: v * v * (3 - 2 * v) if 0 <= v <= 1 else (0.0 if v < 0 else 1.0)
fs = W * H * 3; i = 0; hit = 0
while True:
    buf = dec.stdout.read(fs)
    if len(buf) < fs: break
    t = i / fps; k = sm((t - t0) / ramp) * sm((t1 - t) / ramp)
    if k > 0.001:
        fr = np.frombuffer(buf, np.uint8).reshape(H, W, 3).copy()
        f = 1 - (A * k) * (1 - u) ** 2        # عامل سحب المصدر نحو المركز: يكبّر المركز ويبقى الحدّ ثابتاً
        sx = np.clip(cx + dx * f, 0, W - 1.001); sy = np.clip(cy + dy * f, 0, H - 1.001)
        ix, iy = sx.astype(np.int32), sy.astype(np.int32); fx, fy = (sx - ix)[..., None], (sy - iy)[..., None]
        src = fr
        p = (src[iy, ix] * (1 - fx) * (1 - fy) + src[iy, ix + 1] * fx * (1 - fy) + src[iy + 1, ix] * (1 - fx) * fy + src[iy + 1, ix + 1] * fx * fy)
        fr[y0:y1, x0:x1] = np.clip(p + 0.5, 0, 255).astype(np.uint8)
        buf = fr.tobytes(); hit += 1
    enc.stdin.write(buf); i += 1
enc.stdin.close(); enc.wait(); dec.wait()
print(f"frames {i}, distorted {hit}")
