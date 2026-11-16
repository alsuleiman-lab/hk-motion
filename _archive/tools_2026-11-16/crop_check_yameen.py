import cv2

img = cv2.imread('render_work/debate_jobeX3sJVhM/yameen_stills/frame_15s.jpg')
h, w, _ = img.shape
print(f"Shape: {w}x{h}")

# Let's crop:
# 1. Left side (Document)
doc_crop = img[50:1030, 50:910]
cv2.imwrite('render_work/debate_jobeX3sJVhM/yameen_stills/doc_page_15s.jpg', doc_crop)

# 2. Right side (Debaters?)
right_crop = img[:, 960:]
cv2.imwrite('render_work/debate_jobeX3sJVhM/yameen_stills/right_half_15s.jpg', right_crop)

# 3. Check for any insets
print("Saved doc_page_15s.jpg and right_half_15s.jpg")

