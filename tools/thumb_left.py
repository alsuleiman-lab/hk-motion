import cv2

l = cv2.imread(r"render_work\debate_jobeX3sJVhM\cand1_left_3620.jpg")
# let's save a thumbnail or check text in it
cv2.imwrite(r"render_work\debate_jobeX3sJVhM\cand1_left_3620_thumb.jpg", cv2.resize(l, (480, 540)))

l3735 = cv2.imread(r"render_work\debate_jobeX3sJVhM\cand1_left_3735.jpg")
cv2.imwrite(r"render_work\debate_jobeX3sJVhM\cand1_left_3735_thumb.jpg", cv2.resize(l3735, (480, 540)))
print("Saved thumbs.")

