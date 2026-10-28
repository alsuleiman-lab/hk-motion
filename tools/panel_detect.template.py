import subprocess, numpy as np, json
W, H = 240, 135
p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", "../../public/yh_cut.mp4", "-vf", f"fps=4,scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
fr = []
while True:
    b = p.stdout.read(W * H * 3)
    if len(b) < W * H * 3:
        break
    a = np.frombuffer(b, np.uint8).reshape(H, W, 3).astype(int)
    L = a[:, :110]
    red = ((L[..., 0] > 150) & (L[..., 1] < 90) & (L[..., 2] < 90)).mean()
    fr.append(round(float(red), 4))
json.dump(fr, open("red.json", "w"))
on = [r > 0.01 for r in fr]
segs = []
s = None
for i, o in enumerate(on):
    if o and s is None:
        s = i
    if not o and s is not None:
        segs.append([s / 4, i / 4])
        s = None
if s is not None:
    segs.append([s / 4, len(on) / 4])
print(segs)
