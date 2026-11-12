import subprocess, json, sys, os, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import torch, cv2, numpy as np
from gpu_bridge import Bridge

ELECTRON = "S:/AI_Tools/Electron_GpuRender/node_modules/electron/dist/electron.exe"
here = os.path.dirname(os.path.abspath(__file__))
torch.zeros(1, device="cuda")
p = subprocess.Popen([ELECTRON, here + "/probe_osr2.cjs"], stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
br = None
dst = torch.zeros((1088, 1920, 4), dtype=torch.uint8, device="cuda")
got = 0
t0 = time.time()
for line in p.stdout:
    try:
        m = json.loads(line)
    except Exception:
        continue
    print("paint", m)
    if br is None:
        br = Bridge(m["w"], m["h"], 8)
        print(br.info)
    mk = br.fetch(m["pid"], m["handle"], dst)
    p.stdin.write(f"release {m['n']}\n"); p.stdin.flush()
    print("marker", mk, flush=True)
    if got == 0:
        p.stdin.write("mark 1234567\n"); p.stdin.flush()
    got += 1
    if mk == 1234567 or got > 40:
        break
a = dst.cpu().numpy()
print("pixel (100,100) BGRA", a[150, 150], "green", a[300, 500], "marker row", a[1084, 8], a[1084, 24], "empty", a[900, 900])
cv2.imwrite(os.environ.get("TEMP", ".") + "/bridge_test.png", a[:1080])
p.stdin.write("quit\n"); p.stdin.flush()
