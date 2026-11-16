import cv2

for t in [3585, 3620, 3650, 3700, 3735]:
    img = cv2.imread(f"render_work/debate_jobeX3sJVhM/cand1_frame_{t}.jpg")
    print(f"Frame {t}: shape={img.shape}")
    # Let's detect faces
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = cascade.detectMultiScale(gray, 1.1, 4)
    print(f"Detected {len(faces)} faces at {t}s:")
    for (x, y, w, h) in faces:
        print(f"   Face: x={x}, y={y}, w={w}, h={h}")

