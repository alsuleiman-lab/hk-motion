import cv2

img = cv2.imread(r"render_work\debate_jobeX3sJVhM\cand1_frame_3620.jpg")
# Let's crop the left area (e.g. 100 to 800 x, 100 to 900 y)
cv2.imwrite(r"render_work\debate_jobeX3sJVhM\cand1_doc_crop.jpg", img[100:900, 50:850])

# Let's see 3735 frame: who is talking?
img3735 = cv2.imread(r"render_work\debate_jobeX3sJVhM\cand1_frame_3735.jpg")
cv2.imwrite(r"render_work\debate_jobeX3sJVhM\cand1_3735_crop_left.jpg", img3735[100:900, 50:850])
cv2.imwrite(r"render_work\debate_jobeX3sJVhM\cand1_3735_crop_right.jpg", img3735[100:900, 950:1850])
print("Saved crops.")

