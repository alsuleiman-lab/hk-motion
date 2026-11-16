import cv2, os

cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
stills_dir = r"render_work\debate_jobeX3sJVhM\stills_hand"

for name in ["f300.png", "f900.png", "f1500.png", "f3600.png", "f4200.png"]:
    p = os.path.join(stills_dir, name)
    if not os.path.exists(p):
        continue
    img = cv2.imread(p)
    h, w, _ = img.shape
    faces = cascade.detectMultiScale(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), 1.1, 4)
    print(f"Still {name} (shape {w}x{h}): {len(faces)} faces")
    for f in faces:
        cx = f[0] + f[2] // 2
        cy = f[1] + f[3] // 2
        print(f"   Face: [x={f[0]}, y={f[1]}, w={f[2]}, h={f[3]}], center=({cx}, {cy})")

