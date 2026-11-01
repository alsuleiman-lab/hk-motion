import cv2
import json

# Check clip_v2_raw.mp4 frame by frame
cap = cv2.VideoCapture("render_work/debate_jobeX3sJVhM/clip_v2_raw.mp4")
fps = cap.get(cv2.CAP_PROP_FPS)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
print(f"Total frames in clip_v2_raw: {total_frames}, fps: {fps}")

# Part 1 is ~30.8s (frames 0 to ~924)
# Part 2 is ~42.3s (frames 925 to end)
# Let's inspect frames around 0, 300, 600, 900, 930, 1000, 1500, 2000
for f_idx in [0, 300, 600, 900, 920, 930, 950, 1200, 1500, 1800, 2100]:
    cap.set(cv2.CAP_PROP_POS_FRAMES, f_idx)
    ret, frame = cap.read()
    if ret:
        cv2.imwrite(f"render_work/debate_jobeX3sJVhM/frame_raw_{f_idx}.jpg", frame)
        print(f"Saved frame {f_idx} (time {f_idx/fps:.2f}s)")

cap.release()

