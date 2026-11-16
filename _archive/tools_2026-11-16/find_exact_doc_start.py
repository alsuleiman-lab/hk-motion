import cv2

cap = cv2.VideoCapture(r"public\debate_hand_cut.mp4")
fps = cap.get(cv2.CAP_PROP_FPS)

# Check from second 25 to 40 every 0.5s
for t_sec in [25, 27, 29, 31, 32, 33, 34, 35, 36, 37, 38]:
    cap.set(cv2.CAP_PROP_POS_MSEC, t_sec * 1000)
    ret, frame = cap.read()
    if ret:
        left = frame[:, :960]
        cv2.imwrite(f"render_work/debate_jobeX3sJVhM/trans_left_{t_sec}.jpg", left)
        print(f"t={t_sec}s: left mean brightness={left.mean():.1f}")

cap.release()

