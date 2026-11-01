import cv2, numpy as np

frame70 = cv2.imread(r"render_work\debate_jobeX3sJVhM\source_track\raw_sec_070_full.jpg")
h, w, _ = frame70.shape # 1080, 1920

# In CSS, if container is 980x670, overflow: hidden.
# We want to crop from frame70 the region:
# x: 140 to 820 (width = 680), y: 100 to 770 (height = 670)
# This shows the entire top-to-mid section of the document with the highlighted hadith and book cover!

# Let's test this crop:
crop_test1 = frame70[100:770, 140:820]
# Scale to 980x670:
crop_test1_scaled = cv2.resize(crop_test1, (980, 670))
cv2.imwrite(r"render_work\debate_jobeX3sJVhM\remotion_doc_crop_test.jpg", crop_test1_scaled)

print("Saved remotion_doc_crop_test.jpg")

