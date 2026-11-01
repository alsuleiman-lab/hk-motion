import cv2, os

cap = cv2.VideoCapture('public/debate_yameen_cut.mp4')
fps = cap.get(cv2.CAP_PROP_FPS)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
duration = total_frames / fps
print(f"FPS: {fps}, Total frames: {total_frames}, Duration: {duration:.2f}s")

# Extract sample frames every 3 seconds
os.makedirs('render_work/debate_jobeX3sJVhM/yameen_stills', exist_ok=True)
for t in range(0, int(duration), 3):
    f = int(t * fps)
    cap.set(cv2.CAP_PROP_POS_FRAMES, f)
    ret, frame = cap.read()
    if ret:
        cv2.imwrite(f'render_work/debate_jobeX3sJVhM/yameen_stills/frame_{t:02d}s.jpg', frame)
        print(f"Saved frame at {t}s")

cap.release()
print("Extracted stills.")

