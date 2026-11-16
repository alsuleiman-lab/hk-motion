import cv2

cas = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
for name in ["sheikh_natural_680.jpg", "allahyari_natural_680.jpg"]:
    im = cv2.imread(f"render_work/debate_jobeX3sJVhM/{name}")
    gray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
    faces = cas.detectMultiScale(gray, 1.1, 4, minSize=(60, 60))
    print(f"File {name} (size {im.shape[1]}x{im.shape[0]}):")
    for (x, y, w, h) in faces:
        print(f"  Face at x={x}, y={y}, w={w}, h={h}. Top headroom={y}px, chin bottom={y+h}px, remaining below={im.shape[0]-(y+h)}px")

