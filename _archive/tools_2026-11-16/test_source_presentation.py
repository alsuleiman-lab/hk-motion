import cv2

frame15 = cv2.imread(r"render_work\debate_jobeX3sJVhM\source_track\raw_sec_020_full.jpg")
frame70 = cv2.imread(r"render_work\debate_jobeX3sJVhM\source_track\raw_sec_070_full.jpg")

# Test 1: Full Page fit (card is 980x670)
# Page in source: x: 180 to 780 (w=600), y: 80 to 1000 (h=920)
page15 = frame15[80:1000, 180:780]
# Scale to height 670:
h15, w15, _ = page15.shape
scale_fit = 670.0 / h15
page15_fit = cv2.resize(page15, (int(w15 * scale_fit), 670))
# Center on a 980x670 canvas with cream background
canvas15 = cv2.imread(r"render_work\debate_jobeX3sJVhM\test_hand_sheikh_crop.jpg") # get canvas size 980x680
canvas15[:] = (240, 246, 253) # cream
start_x = (980 - page15_fit.shape[1]) // 2
canvas15[:670, start_x:start_x+page15_fit.shape[1]] = page15_fit
cv2.imwrite(r"render_work\debate_jobeX3sJVhM\test_canvas15_fullpage.jpg", canvas15)

# Test 2: Zoomed in on the exact Hadith text (Hadith is in y: 120 to 550, x: 200 to 760)
page70_zoom = frame70[120:580, 200:760] # h=460, w=560
# Scale to fill 980 width: scale = 980 / 560 = 1.75 -> h = 460 * 1.75 = 805
# Or scale to height 670: scale = 670 / 460 = 1.45 -> w = 560 * 1.45 = 812
page70_zoom_scaled = cv2.resize(page70_zoom, (812, 670))
canvas70 = canvas15.copy()
start_x70 = (980 - 812) // 2
canvas70[:670, start_x70:start_x70+812] = page70_zoom_scaled
cv2.imwrite(r"render_work\debate_jobeX3sJVhM\test_canvas70_zoom.jpg", canvas70)

print("Saved test_canvas15_fullpage and test_canvas70_zoom")

