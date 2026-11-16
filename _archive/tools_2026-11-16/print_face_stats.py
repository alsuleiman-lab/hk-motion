import json

with open(".tmp/c1_facetrack.json", "r") as f:
    data = json.load(f)

print("W, H:", data["W"], data["H"])
boxes = [b for b in data["boxes"] if b[1] is not None]
xs = [b[1] for b in boxes]
ys = [b[2] for b in boxes]
ws = [b[3] for b in boxes]
hs = [b[4] for b in boxes]

print(f"X: min={min(xs)}, max={max(xs)}, avg={sum(xs)/len(xs):.1f}")
print(f"Y: min={min(ys)}, max={max(ys)}, avg={sum(ys)/len(ys):.1f}")
print(f"W: min={min(ws)}, max={max(ws)}, avg={sum(ws)/len(ws):.1f}")
print(f"H: min={min(hs)}, max={max(hs)}, avg={sum(hs)/len(hs):.1f}")

# Face center in 1920x1080 source:
avg_cx = sum(xs)/len(xs) + sum(ws)/len(ws)/2
avg_cy = sum(ys)/len(ys) + sum(hs)/len(hs)/2
print(f"Average Face Center in Source (1920x1080): ({avg_cx:.1f}, {avg_cy:.1f})")
print(f"Face Top (Hair): {min(ys)}")
print(f"Face Bottom (Chin/Beard start): {max(ys) + max(hs)}")

