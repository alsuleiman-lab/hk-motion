"""Share of pixels that the graphics layer (<Gfx>) changes between two renders of the same frame. Prints one JSON line {gfx:<share>}.
Usage: python tools/frame_audit.py <with_graphics.png> <without_graphics.png>"""
import sys, json, cv2, numpy as np
A = cv2.imread(sys.argv[1]); B = cv2.imread(sys.argv[2])
if A.shape != B.shape: A = cv2.resize(A, (B.shape[1], B.shape[0]))
d = (np.abs(A.astype(np.int16) - B.astype(np.int16)).max(axis=2) > 14)
print(json.dumps({"gfx": float(d.mean())}))
