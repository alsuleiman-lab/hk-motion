import cv2

cap = cv2.VideoCapture(r"public\debate_hand_cut.mp4")
cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

times = [5, 30, 60, 100, 130, 140]
for t in times:
    cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
    ret, frame = cap.read()
    if ret:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = cascade.detectMultiScale(gray, 1.1, 4)
        print(f"Time {t}s (shape={frame.shape}): {len(faces)} faces detected")
        for f in faces:
            print(f"   Face: x={f[0]}, y={f[1]}, w={f[2]}, h={f[3]}")
        cv2.imwrite(f"render_work/debate_jobeX3sJVhM/hand_cut_frame_{t}.jpg", frame)

cap.release()
print("Done tracking faces.")

