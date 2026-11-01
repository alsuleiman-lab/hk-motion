import cv2, numpy as np

img = cv2.imread('render_work/debate_jobeX3sJVhM/yameen_stills/frame_15s.jpg')

# 1. Sheikh Muhammad:
# In the original 1920x1080 frame, Sheikh's camera box is:
# Let's find exact bounds of his camera box in the right half:
# It's at y: 60 to 520 (height ~460), x: 1040 to 1880 (width ~840).
# The target container is 485x400 (aspect ratio 1.21:1).
# If we crop x: 1140 to 1780 (width 640), y: 70 to 510 (height ~440),
# aspect ratio is 640/440 = 1.45.
# Let's make it 485x400: width = 400 * (485/400) = 485.
# Let's crop y: 55 to 505 (h=450), x: 1100 to 1645 (w=545, ratio=1.21):
sheikh_fitted = cv2.resize(img[55:505, 1100:1645], (485, 400))
cv2.imwrite('render_work/debate_jobeX3sJVhM/yameen_stills/sheikh_fitted_485x400.jpg', sheikh_fitted)

# 2. Hassan Allahyari:
# In the bottom-right inset, Allahyari camera is:
# y: 570 to 970 (h=400), x: 980 to 1420 (w=440).
# Let's crop y: 565 to 975 (h=410), x: 960 to 1456 (w=496, ratio=1.21):
allahyari_fitted = cv2.resize(img[565:975, 975:1471], (485, 400))
cv2.imwrite('render_work/debate_jobeX3sJVhM/yameen_stills/allahyari_fitted_485x400.jpg', allahyari_fitted)

# 3. Document (Mir'at al-Uqul, page 33):
# Target box: 990x1130
# In the frame, the document is at x: 80 to 760, y: 70 to 930.
# The hadith text is in the middle of page 33: "كان بين يدي الله عز وجل وعن يمين الله".
# Let's crop x: 70 to 780 (w=710), y: 70 to 880 (h=810):
doc_fitted = cv2.resize(img[70:880, 70:780], (990, 1130))
cv2.imwrite('render_work/debate_jobeX3sJVhM/yameen_stills/doc_fitted_990x1130.jpg', doc_fitted)

# Let's assemble a full test canvas 1080x1920:
canvas = np.full((1920, 1080, 3), (245, 240, 235), dtype=np.uint8)

# Place Sheikh at top-right (x: 550, y: 130)
canvas[130:530, 550:1035] = sheikh_fitted

# Place Allahyari at top-left (x: 45, y: 130)
canvas[130:530, 45:530] = allahyari_fitted

# Place Document at bottom (x: 45, y: 695)
canvas[695:1825, 45:1035] = doc_fitted

cv2.imwrite('render_work/debate_jobeX3sJVhM/yameen_stills/layout_preview_15s.jpg', canvas)
print("Saved layout_preview_15s.jpg!")

