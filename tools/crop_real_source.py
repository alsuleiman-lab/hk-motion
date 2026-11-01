import cv2

frame = cv2.imread(r"render_work\debate_jobeX3sJVhM\source_track\raw_sec_050_full.jpg")
# In raw_sec_050:
# Left column is x=0 to 960, y=0 to 1080
# Where is the browser chrome / top bar?
# Let's crop y from 160 to 1040, x from 30 to 930
doc = frame[160:1040, 30:930]
cv2.imwrite(r"render_work\debate_jobeX3sJVhM\test_real_source_crop.jpg", doc)

# Let's test on sec 70, 80, 90
for s in [40, 60, 70, 80, 90]:
    f = cv2.imread(f"render_work/debate_jobeX3sJVhM/source_track/raw_sec_{s:03d}_full.jpg")
    c = f[160:1040, 30:930]
    cv2.imwrite(f"render_work/debate_jobeX3sJVhM/test_source_{s}.jpg", c)

print("Saved test real source crops.")

