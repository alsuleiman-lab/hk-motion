import cv2

cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

for t in [100, 105, 110, 115, 120, 125]:
    img = cv2.imread(f"render_work/debate_jobeX3sJVhM/left_t_{t}.jpg")
    faces = cascade.detectMultiScale(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), 1.1, 4)
    print(f"Time {t}s (left half): {len(faces)} faces, mean brightness={img.mean():.1f}")
    for f in faces:
        print(f"   face: {f}")

