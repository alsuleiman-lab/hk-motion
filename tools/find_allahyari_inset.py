import cv2

frame50 = cv2.imread(r"render_work\debate_jobeX3sJVhM\source_track\raw_sec_050_full.jpg")
h, w, _ = frame50.shape # 1080, 1920

# Let's inspect the bottom-right inset in frame50
# The inset has two webcam boxes:
# Left webcam: Allahyari
# Right webcam: Sheikh
# Let's crop the bottom right area: y: 550 to 1050, x: 950 to 1850
inset = frame50[550:1050, 950:1850]
cv2.imwrite(r"render_work\debate_jobeX3sJVhM\inset_sec50.jpg", inset)

# Let's see: Allahyari is on the left of this inset:
# x: 980 to 1400, y: 560 to 960
allahyari_inset = frame50[560:960, 980:1400]
cv2.imwrite(r"render_work\debate_jobeX3sJVhM\allahyari_inset_sec50.jpg", allahyari_inset)

print("Saved inset_sec50 and allahyari_inset_sec50")

