import cv2

cap = cv2.VideoCapture(r"render_work\debate_jobeX3sJVhM\source.mp4")
fps = cap.get(cv2.CAP_PROP_FPS)

# Let's inspect frames at t = 3585s, 3620s, 3650s, 3700s, 3735s
times = [3585, 3620, 3650, 3700, 3735]
for t in times:
    cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
    ret, frame = cap.read()
    if ret:
        cv2.imwrite(f"render_work/debate_jobeX3sJVhM/cand1_frame_{t}.jpg", frame)
        print(f"Saved frame at {t}s")

cap.release()

