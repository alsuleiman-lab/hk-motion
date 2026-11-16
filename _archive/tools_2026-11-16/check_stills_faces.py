import cv2

cas = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
for name in ["shia_speaks.png", "sheikh_speech.png", "sheikh_curse.png"]:
    im = cv2.imread(f"render_work/debate_jobeX3sJVhM/stills/{name}")
    h, w, _ = im.shape
    gray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
    faces = cas.detectMultiScale(gray, 1.1, 4, minSize=(40, 40))
    print(f"\n{name} (rendered scale 0.5: {w}x{h}):")
    for (x, y, fw, fh) in faces:
        # In original 1080x1920, multiply by 2
        print(f"  Face at x={x*2}, y={y*2}, w={fw*2}, h={fh*2}")
        # Check if face is in top half (Sheikh: y=122..802) or bottom half (Shia: y=882..1562)
        if 122 <= y*2 <= 802:
            print(f"    -> Sheikh panel (y 122..802): headroom above face = {y*2 - 122}px, chin bottom = {y*2+fh*2}px (panel bottom 802)")
        elif 882 <= y*2 <= 1562:
            print(f"    -> Shia panel (y 882..1562): headroom above face = {y*2 - 882}px, chin bottom = {y*2+fh*2}px (panel bottom 1562)")

