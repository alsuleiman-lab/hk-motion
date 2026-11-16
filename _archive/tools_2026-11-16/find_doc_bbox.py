import cv2, numpy as np

img = cv2.imread(r"render_work\debate_jobeX3sJVhM\sec_050_left_view.jpg")
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Let's find bright bounding boxes (white paper document)
# White paper usually has pixel values > 220
white_mask = gray > 210
rows = np.where(white_mask.any(axis=1))[0]
cols = np.where(white_mask.any(axis=0))[0]

if len(rows) and len(cols):
    y_min, y_max = rows[0], rows[-1]
    x_min, x_max = cols[0], cols[-1]
    print(f"White document bbox: x=[{x_min}, {x_max}], y=[{y_min}, {y_max}], size={x_max-x_min}x{y_max-y_min}")
    doc_crop = img[y_min:y_max, x_min:x_max]
    cv2.imwrite(r"render_work\debate_jobeX3sJVhM\doc_crop_sec50.jpg", doc_crop)
else:
    print("No large white bbox found")

# Let's also check other frames: 040, 060, 070, 080, 090, 100
for s in [40, 60, 70, 80, 90, 100]:
    frame = cv2.imread(f"render_work/debate_jobeX3sJVhM/source_track/raw_sec_{s:03d}_left.jpg")
    g = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    wm = g > 210
    r = np.where(wm.any(axis=1))[0]
    c = np.where(wm.any(axis=0))[0]
    if len(r) and len(c):
        print(f"Sec {s}: bbox x=[{c[0]}, {c[-1]}], y=[{r[0]}, {r[-1]}]")

