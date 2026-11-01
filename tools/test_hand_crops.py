import cv2

frame = cv2.imread(r"render_work\debate_jobeX3sJVhM\hand_cut_frame_30.jpg")
h, w, _ = frame.shape

# Card size: 980x680
# Scale: 1.05 -> resized frame: (2016, 1134)
scaled = cv2.resize(frame, (int(w * 1.05), int(h * 1.05)))

# Crop Sheikh: left=960, top=60, width=980, height=680
sheikh_crop = scaled[60:60+680, 960:960+980]
cv2.imwrite(r"render_work\debate_jobeX3sJVhM\test_hand_sheikh_crop.jpg", sheikh_crop)

# Crop Allahyari at frame 140
frame140 = cv2.imread(r"render_work\debate_jobeX3sJVhM\hand_cut_frame_140.jpg")
scaled140 = cv2.resize(frame140, (int(w * 1.05), int(h * 1.05)))
# If left = -50 in CSS, it means we take x from 0 or wait!
# If left = 50px inside a container, x starts at 0 and goes to 980 - 50?
# In CSS: if <OffthreadVideo style={{ position: "absolute", left: -50, top: -60, width: 2016, height: 1134 }} />
# Then the visible window in the 980-wide container starts at x = 50 in scaled140!
# Let's see: face at 140 is at x=343 in original (x=360 in scaled).
# If visible window is x=0 to 980, center is 490.
# So if we shift video by left = -(360 - 490) = +130px? Wait, left in CSS cannot be positive if video width is 2016 and container is 980!
# If video starts at left: 0, x=0 to 980 of scaled is visible. In scaled, Allahyari face is at x=360.
# So if left: 0, Allahyari is at x=360 (near center of 980)!
# To put x=360 at x=490, we can scale slightly more or set left: 0 or crop from 0 to 980:
allahyari_crop = scaled140[60:60+680, 0:980]
cv2.imwrite(r"render_work\debate_jobeX3sJVhM\test_hand_allahyari_crop.jpg", allahyari_crop)

print("Saved test crops.")

