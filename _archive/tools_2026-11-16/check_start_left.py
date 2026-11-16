import cv2

for s in range(0, 45, 5):
    # calculate frame
    cap = cv2.VideoCapture(r"public\debate_hand_cut.mp4")
    cap.set(cv2.CAP_PROP_POS_MSEC, s * 1000)
    ret, frame = cap.read()
    if ret:
        cv2.imwrite(f"render_work/debate_jobeX3sJVhM/start_check_s{s:02d}.jpg", frame[:, :960])
        print(f"Sec {s}: mean brightness = {frame[:, :960].mean():.1f}")
    cap.release()

