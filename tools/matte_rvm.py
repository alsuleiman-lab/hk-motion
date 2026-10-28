"""Person matting for video with Robust Video Matting (RVM, TorchScript). Runs on the GPU with ComfyUI's embedded Python.
Usage: python_embeded/python.exe tools/matte_rvm.py <in.mp4> <alpha_out.mp4> [--ratio 0.5] [--model models/rvm_resnet50_fp32.torchscript]
Output: a grayscale video where white = person, black = background (feed it to ffmpeg alphamerge)."""
import sys, subprocess, numpy as np, cv2, torch
src, out = sys.argv[1], sys.argv[2]
a = sys.argv[3:]
ratio = float(a[a.index("--ratio")+1]) if "--ratio" in a else 0.5
model_path = a[a.index("--model")+1] if "--model" in a else "models/rvm_resnet50_fp32.torchscript"
reset = int(a[a.index("--reset")+1]) if "--reset" in a else 0   # reset the temporal memory every N frames (use when the input is a concatenation of unrelated windows)
dev = "cuda"
model = torch.jit.load(model_path, map_location=dev).eval()
cap = cv2.VideoCapture(src)
fps = cap.get(cv2.CAP_PROP_FPS); w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)); h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
ff = subprocess.Popen(["ffmpeg", "-hide_banner", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{w}x{h}", "-r", str(fps), "-i", "-",
                       "-c:v", "libx264", "-preset", "veryfast", "-crf", "10", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
rec = [None] * 4
n = 0
with torch.no_grad():
    while True:
        ok, bgr = cap.read()
        if not ok: break
        if reset and n and n % reset == 0: rec = [None] * 4
        t = torch.from_numpy(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)).to(dev).permute(2, 0, 1).float().div(255).unsqueeze(0)
        fgr, pha, *rec = model(t, *rec, ratio)
        ff.stdin.write((pha[0, 0].clamp(0, 1) * 255).byte().cpu().numpy().tobytes()); n += 1
ff.stdin.close(); ff.wait()
print("frames", n, "->", out)
