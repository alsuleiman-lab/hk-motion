import cv2

for t in [3585, 3620, 3735]:
    l = cv2.imread(f"render_work/debate_jobeX3sJVhM/cand1_left_{t}.jpg")
    r = cv2.imread(f"render_work/debate_jobeX3sJVhM/cand1_right_{t}.jpg")
    print(f"Time {t}: Left shape={l.shape}, Right shape={r.shape}")
    # Let's see average brightness or faces in each half
    cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    fl = cascade.detectMultiScale(cv2.cvtColor(l, cv2.COLOR_BGR2GRAY), 1.1, 4)
    fr = cascade.detectMultiScale(cv2.cvtColor(r, cv2.COLOR_BGR2GRAY), 1.1, 4)
    print(f"   Left faces: {len(fl)}, Right faces: {len(fr)}")
    for f in fl:
        print(f"      L face: {f}")
    for f in fr:
        print(f"      R face: {f}")

