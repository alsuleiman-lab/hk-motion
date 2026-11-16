import cv2
import glob

cas = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

for path in sorted(glob.glob("render_work/debate_jobeX3sJVhM/trans_*.jpg")):
    f_num = int(path.split("_")[-1].replace(".jpg", ""))
    im = cv2.imread(path)
    gray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
    faces = cas.detectMultiScale(gray, 1.1, 4, minSize=(80, 80))
    centers = [f[0] + f[2]//2 for f in faces]
    # If center ~900-960, it's solo. If centers has ~400 or ~1440, it's split.
    is_solo = any(700 <= c <= 1100 for c in centers)
    print(f"Frame {f_num} ({f_num/30.0:.2f}s): centers={centers} -> {'SOLO' if is_solo else 'SPLIT'}")

