import cv2
import json

cas = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

for f_idx in [0, 300, 600, 900, 920, 930, 950, 1200, 1500]:
    im = cv2.imread(f"render_work/debate_jobeX3sJVhM/frame_raw_{f_idx}.jpg")
    gray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
    faces = cas.detectMultiScale(gray, 1.1, 4, minSize=(60, 60))
    print(f"Frame {f_idx}:")
    for (x, y, w, h) in faces:
        print(f"  Face at x={x}, y={y}, w={w}, h={h}, center_x={x+w//2}")

