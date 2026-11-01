import cv2

cap = cv2.VideoCapture(r"public\debate_hand_cut.mp4")
fps = cap.get(cv2.CAP_PROP_FPS)

# Card size: 980x640 (Bottom Panel)
# Period 1: t = 10s (Left half, Allahyari camera)
cap.set(cv2.CAP_PROP_POS_MSEC, 10 * 1000)
_, f10 = cap.read()
# In f10 (1920x1080), Allahyari is in left half x: 0 to 960
# Scale and crop to 980x640:
p1_crop = cv2.resize(f10[60:1040, 0:960], (980, 640))
cv2.imwrite(r"render_work\debate_jobeX3sJVhM\allahyari_p1.jpg", p1_crop)

# Period 2: t = 50s (Allahyari is in the bottom-right inset: x: 980 to 1400, y: 560 to 960)
cap.set(cv2.CAP_PROP_POS_MSEC, 50 * 1000)
_, f50 = cap.read()
# In f50, Allahyari inset is: y: 560 to 960 (h=400), x: 980 to 1400 (w=420)
# Center of Allahyari face is around x=1190, y=760
# Let's crop y: 560 to 960, x: 980 to 1400 and scale to 980x640:
p2_crop = cv2.resize(f50[560:960, 980:1400], (980, 640))
cv2.imwrite(r"render_work\debate_jobeX3sJVhM\allahyari_p2.jpg", p2_crop)

# Period 3: t = 135s (Left half, Allahyari camera full)
cap.set(cv2.CAP_PROP_POS_MSEC, 135 * 1000)
_, f135 = cap.read()
p3_crop = cv2.resize(f135[60:1040, 0:960], (980, 640))
cv2.imwrite(r"render_work\debate_jobeX3sJVhM\allahyari_p3.jpg", p3_crop)

cap.release()
print("Saved allahyari_p1, p2, p3.")

