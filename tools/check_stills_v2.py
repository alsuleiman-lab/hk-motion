import cv2

cas = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

for name in ["sceneA_debate.png", "sceneB_solo.png", "sceneB_solo2.png"]:
    im = cv2.imread(f"render_work/debate_jobeX3sJVhM/stills_v2/{name}")
    h, w, _ = im.shape
    gray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
    faces = cas.detectMultiScale(gray, 1.1, 4, minSize=(40, 40))
    print(f"\n{name} (size: {w}x{h}, scale 0.5):")
    for (x, y, fw, fh) in faces:
        # Scale back to 1080x1920
        fx, fy, f_w, f_h = x*2, y*2, fw*2, fh*2
        cx, cy = fx + f_w//2, fy + f_h//2
        print(f"  Face at x={fx}, y={fy}, size={f_w}x{f_h}. Center=({cx}, {cy}). Headroom above card: {fy}px")

