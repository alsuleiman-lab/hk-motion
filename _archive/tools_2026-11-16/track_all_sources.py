import cv2, os

cap = cv2.VideoCapture(r"render_work\debate_jobeX3sJVhM\clip_hand_raw.mp4")
fps = cap.get(cv2.CAP_PROP_FPS)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
duration = total_frames / fps
print(f"Total frames: {total_frames}, duration: {duration:.1f}s, fps: {fps}")

out_dir = r"render_work\debate_jobeX3sJVhM\source_track"
os.makedirs(out_dir, exist_ok=True)

# Sample every 10 seconds: 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160
for sec in range(0, int(duration), 10):
    cap.set(cv2.CAP_PROP_POS_MSEC, sec * 1000)
    ret, frame = cap.read()
    if ret:
        h, w, _ = frame.shape
        # frame is 1920x1080
        # left half is 0:960
        left_half = frame[:, :960]
        cv2.imwrite(os.path.join(out_dir, f"raw_sec_{sec:03d}_full.jpg"), frame)
        cv2.imwrite(os.path.join(out_dir, f"raw_sec_{sec:03d}_left.jpg"), left_half)
        print(f"Sec {sec:03d}: saved")

cap.release()
print("Done extracting raw samples.")

