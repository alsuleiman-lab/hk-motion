import subprocess, numpy as np, json
# A = sheikh-only full-frame cam; B = split with a source panel on the left. Compare the flower/curtain region with a reference A frame (cut t=16).
W, H = 480, 270
def grab(args):
    p = subprocess.run(["ffmpeg", "-v", "error"] + args + ["-vf", f"scale={W}:{H}", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
    return np.frombuffer(p.stdout, np.uint8).reshape(H, W, 3).astype(int)
ref = grab(["-ss", "16", "-i", "../../public/yh_cut.mp4"])
box = (slice(62, 190), slice(35, 160))
p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", "../../public/yh_cut.mp4", "-vf", f"fps=4,scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
d = []
while True:
    b = p.stdout.read(W * H * 3)
    if len(b) < W * H * 3:
        break
    a = np.frombuffer(b, np.uint8).reshape(H, W, 3).astype(int)
    d.append(float(np.abs(a[box] - ref[box]).mean()))
json.dump(d, open("layout.json", "w"))
isA = [x < 22 for x in d]
segs = []
s = 0
for i in range(1, len(isA) + 1):
    if i == len(isA) or isA[i] != isA[s]:
        segs.append([isA[s], s / 4, i / 4])
        s = i
print([[("A" if k else "B"), a, b] for k, a, b in segs if b - a >= 1.5])
print(sorted(d)[::40])
