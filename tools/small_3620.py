import cv2

img = cv2.imread(r"render_work\debate_jobeX3sJVhM\cand1_frame_3620.jpg")
# let's save a smaller version to inspect
cv2.imwrite(r"render_work\debate_jobeX3sJVhM\frame_3620_small.jpg", cv2.resize(img, (960, 540)))
print("Saved frame_3620_small.jpg")

