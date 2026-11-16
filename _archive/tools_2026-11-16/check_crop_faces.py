import cv2

cas = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

for name in ["test_p1_sheikh.jpg", "test_p1_allahyari.jpg", "test_p2_sheikh_solo.jpg"]:
    im = cv2.imread(f"render_work/debate_jobeX3sJVhM/{name}")
    h, w, _ = im.shape
    gray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
    faces = cas.detectMultiScale(gray, 1.1, 4, minSize=(60, 60))
    print(f"\n{name} (size: {w}x{h}):")
    for (x, y, fw, fh) in faces:
        cx = x + fw // 2
        cy = y + fh // 2
        print(f"  Face at x={x}, y={y}, w={fw}, h={fh}. Center=({cx}, {cy}). Distance from image center {w//2}: {cx - w//2}px")

