import cv2

img = cv2.imread(r"render_work\debate_jobeX3sJVhM\doc_crop_sec50.jpg")
print(f"doc_crop_sec50 shape: {img.shape}")

# Let's crop the actual text of the hadith in doc_crop_sec50
# Let's see what text or rows are in this image
h, w, _ = img.shape
# Save top, middle, bottom
cv2.imwrite(r"render_work\debate_jobeX3sJVhM\doc_top.jpg", img[:h//3, :])
cv2.imwrite(r"render_work\debate_jobeX3sJVhM\doc_mid.jpg", img[h//3:2*h//3, :])
cv2.imwrite(r"render_work\debate_jobeX3sJVhM\doc_bot.jpg", img[2*h//3:, :])
print("Saved doc sections.")

