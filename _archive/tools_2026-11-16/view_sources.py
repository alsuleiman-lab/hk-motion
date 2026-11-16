import cv2

img = cv2.imread(r"render_work\debate_jobeX3sJVhM\source_track\raw_sec_050_left.jpg")
h, w, _ = img.shape
print(f"Sec 50 Left image: {w}x{h}")

# Save full crop to artifact or scratch to inspect
cv2.imwrite(r"render_work\debate_jobeX3sJVhM\sec_050_left_view.jpg", img)

# Also let's inspect sec 000, 020, 050, 080, 100, 140
for s in [0, 20, 50, 80, 100, 140]:
    frame = cv2.imread(f"render_work/debate_jobeX3sJVhM/source_track/raw_sec_{s:03d}_full.jpg")
    cv2.imwrite(f"render_work/debate_jobeX3sJVhM/full_view_sec_{s:03d}.jpg", frame)

print("Saved views.")

