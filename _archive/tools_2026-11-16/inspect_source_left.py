import cv2

img = cv2.imread(r"render_work\debate_jobeX3sJVhM\cand1_left_3620.jpg")
h, w, _ = img.shape
print(f"cand1_left_3620 shape: {w}x{h}")

# Let's save a clear slice of the center of this left image
# If it's a PDF or browser with book text:
cv2.imwrite(r"render_work\debate_jobeX3sJVhM\left_3620_full.jpg", img)
print("Saved left_3620_full.jpg")

