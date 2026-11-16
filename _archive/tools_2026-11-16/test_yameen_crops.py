import cv2

img = cv2.imread('render_work/debate_jobeX3sJVhM/yameen_stills/frame_15s.jpg')
h, w, _ = img.shape
print(f"Full Frame: {w}x{h}")

# Save full frame to inspect
cv2.imwrite('render_work/debate_jobeX3sJVhM/yameen_stills/full_15s.jpg', img)

# Let's inspect where Sheikh Muhammad is in the right half:
# Top right area:
sheikh_crop = img[50:520, 1150:1850]
cv2.imwrite('render_work/debate_jobeX3sJVhM/yameen_stills/sheikh_raw.jpg', sheikh_crop)

# Allahyari inset at bottom right:
allahyari_crop = img[580:960, 990:1400]
cv2.imwrite('render_work/debate_jobeX3sJVhM/yameen_stills/allahyari_raw.jpg', allahyari_crop)

# Document on left:
doc_crop = img[70:950, 70:920]
cv2.imwrite('render_work/debate_jobeX3sJVhM/yameen_stills/doc_raw.jpg', doc_crop)

print("Saved raw crops.")

