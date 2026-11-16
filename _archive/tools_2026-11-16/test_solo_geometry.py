from PIL import Image
import cv2

# Test solo crop for Sheikh in Part 2:
# Video: 1920x1080.
# Card: width 980, height 1350 in Remotion canvas.
# Scale: video scaled to height 1350 -> scale = 1.25.
# Video scaled size: width = 1920 * 1.25 = 2400, height = 1350.
# Sheikh face in 1920x1080 is at x=950, y=200.
# In scaled coords: x = 950 * 1.25 = 1187.5.
# Card center = 490.
# Left offset = 490 - 1187.5 = -697.5 ≈ -700.
# Top offset = 0.
# In source coords (1920x1080):
# Crop box corresponds to:
# x from (700 / 1.25) = 560 to (560 + 980 / 1.25) = 560 + 784 = 1344.
# y from 0 to 1080.

im = Image.open("render_work/debate_jobeX3sJVhM/frame_raw_1200.jpg")
crop_p2 = im.crop((560, 0, 1344, 1080))
crop_p2_resized = crop_p2.resize((980, 1350), Image.Resampling.LANCZOS)
crop_p2_resized.save("render_work/debate_jobeX3sJVhM/test_sheikh_solo_final.jpg")

# Detect face in this crop
cas = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
im_cv = cv2.imread("render_work/debate_jobeX3sJVhM/test_sheikh_solo_final.jpg")
gray = cv2.cvtColor(im_cv, cv2.COLOR_BGR2GRAY)
faces = cas.detectMultiScale(gray, 1.1, 4, minSize=(80, 80))
print("Faces in solo crop (size 980x1350):")
for (x, y, w, h) in faces:
    cx = x + w // 2
    print(f"Face at x={x}, y={y}, w={w}, h={h}. Center x={cx} (image center is 490), headroom above={y}px")

