from PIL import Image

# Open sample frames
im1 = Image.open("render_work/debate_jobeX3sJVhM/sample_6110.jpg")
im2 = Image.open("render_work/debate_jobeX3sJVhM/sample_6190.jpg")

w, h = im1.size # 1920, 1080

# In portrait 1080x1920:
# If we have two video panels stacked vertically:
# For example:
# Top panel: Sheikh Muhammad bin Shams al-Din
# Bottom panel: Hassan Allahyari
# Or vice versa depending on who is speaking or fixed split.
# In Shorts:
# Usually:
# Header area / Top margin: y = 80 to 200
# Top panel: 980 wide x 680 high (aspect ratio ~16:11 or 16:10 or 4:3)
# Middle divider with speaker name tags: y = 890 to 1030 (outside the video frames!)
# Bottom panel: 980 wide x 680 high
# Bottom captions area: y = 1680 to 1860

# Let's crop the Sheikh from right half:
# Sheikh is in x: 960 to 1920 (width 960).
# Center of Sheikh is around x = 960 + 480 = 1440.
# Let's test different crops for Sheikh (e.g. x: 1040 to 1840, y: 50 to 850)
sheikh_crop = im1.crop((1060, 40, 1820, 840)) # 760x800
sheikh_crop.save("render_work/debate_jobeX3sJVhM/crop_sheikh_test.jpg")

# Crop Allahyari:
allahyari_crop = im1.crop((100, 40, 860, 840)) # 760x800
allahyari_crop.save("render_work/debate_jobeX3sJVhM/crop_allahyari_test.jpg")

print("Saved test crops successfully.")

