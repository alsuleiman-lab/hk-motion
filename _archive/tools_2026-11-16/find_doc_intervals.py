import cv2, numpy as np

cap = cv2.VideoCapture(r"public\debate_hand_cut.mp4")
fps = cap.get(cv2.CAP_PROP_FPS)
total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

# We want to check the left half of each second
timeline = []
for f in range(0, total, 15): # every 0.5s
    cap.set(cv2.CAP_PROP_POS_FRAMES, f)
    ret, frame = cap.read()
    if not ret:
        break
    t = f / fps
    left = frame[:, :960]
    gray = cv2.cvtColor(left, cv2.COLOR_BGR2GRAY)
    # Check brightness of document area (y from 200 to 1000, x from 50 to 900)
    doc_area = gray[250:950, 50:900]
    mean_val = doc_area.mean()
    is_doc = mean_val > 140 # document page is bright white/cream
    timeline.append((t, f, round(mean_val, 1), is_doc))

cap.release()

# Let's find intervals where is_doc is True
intervals = []
in_doc = False
start_t = 0
for t, f, m, d in timeline:
    if d and not in_doc:
        in_doc = True
        start_t = t
    elif not d and in_doc:
        in_doc = False
        intervals.append((start_t, t))
if in_doc:
    intervals.append((start_t, total/fps))

print("Document display intervals on cut timeline:")
for a, b in intervals:
    print(f"   From {a:.2f}s to {b:.2f}s (duration {b-a:.2f}s)")

