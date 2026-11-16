import cv2

PY = "C:/Users/mshms/AppData/Local/Programs/Python/Python310/python.exe"

img = cv2.imread(r"s:\AI_Tools\Remotion_Workspace\public\sheikh_correct_crop.jpg")
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

cas = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
faces = cas.detectMultiScale(gray, 1.2, 4)

for (x, y, w, h) in faces:
    print(f"Face in portrait (1080x1920): x={x}, y={y}, w={w}, h={h}")
    print(f"Center X: {x + w/2:.1f} (Ideal: 540)")
    print(f"Top of face: {y}, Bottom of face: {y + h}")
    # Draw rectangle and save
    cv2.rectangle(img, (x, y), (x + w, y + h), (0, 255, 0), 4)

cv2.imwrite(r"s:\AI_Tools\Remotion_Workspace\public\sheikh_detected_face.jpg", img)
print("Saved sheikh_detected_face.jpg")

