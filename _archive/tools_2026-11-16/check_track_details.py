import cv2, os, glob

for f in sorted(glob.glob(r"render_work\debate_jobeX3sJVhM\source_track\raw_sec_*_full.jpg")):
    img = cv2.imread(f)
    h, w, _ = img.shape
    # Let's detect faces or see what windows exist
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = cascade.detectMultiScale(gray, 1.1, 4)
    # let's see average intensity of left vs right
    l_gray = gray[:, :w//2]
    r_gray = gray[:, w//2:]
    sec = os.path.basename(f).split("_")[2]
    print(f"Sec {sec}: L_mean={l_gray.mean():.1f}, R_mean={r_gray.mean():.1f}, faces={len(faces)}")
    for fc in faces:
        print(f"   face: x={fc[0]}, y={fc[1]}, w={fc[2]}, h={fc[3]}")

