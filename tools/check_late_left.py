import cv2

cap = cv2.VideoCapture(r"public\debate_hand_cut.mp4")
fps = cap.get(cv2.CAP_PROP_FPS)

for t in [100, 105, 110, 115, 120, 125]:
    cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
    ret, frame = cap.read()
    if ret:
        cv2.imwrite(f"render_work/debate_jobeX3sJVhM/left_t_{t}.jpg", frame[:, :960])
        print(f"Saved left_t_{t}")

cap.release()

