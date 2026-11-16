import subprocess, json
from PIL import Image, ImageDraw

PY = "C:/Users/mshms/AppData/Local/Programs/Python/Python310/python.exe"

# 1. Run face_track on all 3 cut clips
for c in ["c1", "c2", "c3"]:
    video = f"public/tirmidhi29_{c}_cut.mp4"
    out_json = f".tmp/{c}_facetrack.json"
    subprocess.run([PY, "tools/face_track.py", video, out_json], check=True)
    with open(out_json) as f:
        d = json.load(f)
    boxes = [b for b in d["boxes"] if b[1] is not None]
    avg_x = sum(b[1] + b[3]/2 for b in boxes) / len(boxes)
    avg_y = sum(b[2] + b[4]/2 for b in boxes) / len(boxes)
    min_top = min(b[2] for b in boxes)
    max_bot = max(b[2] + b[4] for b in boxes)
    print(f"[{c}] Face Center: ({avg_x:.1f}, {avg_y:.1f}), Top: {min_top}, Bot: {max_bot}")
    
    # Calculate exact left offset to center face at X=540 in 1080x1920
    scale = 1920.0 / 1080.0 # 1.777778
    exact_left = 540.0 - (avg_x * scale)
    print(f"[{c}] Recommended Video CSS: left: {exact_left:.1f}px, top: 0px, width: {1920*scale:.1f}px, height: 1920px\n")

