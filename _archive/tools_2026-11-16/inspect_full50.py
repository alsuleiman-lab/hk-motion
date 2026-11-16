import cv2

frame50 = cv2.imread(r"render_work\debate_jobeX3sJVhM\source_track\raw_sec_050_full.jpg")
# What is on the right side and what is on the left side of raw_sec_050_full.jpg?
# Let's see: full frame is 1920x1080.
# Let's save a smaller version of the full frame to inspect:
cv2.imwrite(r"C:\Users\mshms\.gemini\antigravity\brain\89b70e81-4249-4272-b3b4-0b6a91b92f56\full_50_inspection.jpg", cv2.resize(frame50, (960, 540)))
print("Saved full_50_inspection.jpg")

