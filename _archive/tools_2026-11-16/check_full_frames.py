import cv2

cas = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

for name in ["full_6110.jpg", "full_6150.jpg", "full_6190.jpg"]:
    im = cv2.imread(f"render_work/debate_jobeX3sJVhM/{name}")
    gray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
    faces = cas.detectMultiScale(gray, 1.1, 4, minSize=(60, 60))
    print(f"\n=== {name} (size: {im.shape[1]}x{im.shape[0]}) ===")
    for (x, y, w, h) in faces:
        print(f"Face: x={x}, y={y}, w={w}, h={h}, center_x={x+w//2}, center_y={y+h//2}")

