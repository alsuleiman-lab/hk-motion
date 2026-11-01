import cv2
import json

cas_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
cas = cv2.CascadeClassifier(cas_path)

im1 = cv2.imread("render_work/debate_jobeX3sJVhM/sample_6110.jpg")
im2 = cv2.imread("render_work/debate_jobeX3sJVhM/sample_6190.jpg")

for name, im in [("6110", im1), ("6190", im2)]:
    gray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
    
    # Shia (0..960)
    shia_roi = gray[:, 0:960]
    shia_faces = cas.detectMultiScale(shia_roi, 1.1, 5, minSize=(80, 80))
    print(f"\nFrame {name} Shia faces in ROI (0..960):")
    for (x, y, w, h) in shia_faces:
        print(f"  x={x}, y={y}, w={w}, h={h}, center_x={x+w//2}, center_y={y+h//2}")

    # Sheikh (960..1920)
    sheikh_roi = gray[:, 960:1920]
    sheikh_faces = cas.detectMultiScale(sheikh_roi, 1.1, 5, minSize=(80, 80))
    print(f"Frame {name} Sheikh faces in ROI (960..1920):")
    for (x, y, w, h) in sheikh_faces:
        print(f"  x={960+x}, y={y}, w={w}, h={h}, center_x={960+x+w//2}, center_y={y+h//2}")

