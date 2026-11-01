import cv2, numpy as np

img = cv2.imread(r"render_work\debate_jobeX3sJVhM\cand1_left_3620.jpg")
print(f"Mean RGB: {img.mean(axis=(0,1))}")
# Is it mostly white/paper text or webcam?
# If mean brightness is > 200, it's a book/pdf document!
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
print(f"Mean gray: {gray.mean():.1f}, std: {gray.std():.1f}, >200 pct: {(gray > 200).mean()*100:.1f}%")

img3735 = cv2.imread(r"render_work\debate_jobeX3sJVhM\cand1_left_3735.jpg")
gray3735 = cv2.cvtColor(img3735, cv2.COLOR_BGR2GRAY)
print(f"3735 Left: Mean gray: {gray3735.mean():.1f}, std: {gray3735.std():.1f}, >200 pct: {(gray3735 > 200).mean()*100:.1f}%")

