from PIL import Image

im = Image.open("render_work/debate_jobeX3sJVhM/sample_6110.jpg")

# In 1080x1920 vertical canvas:
# We want two video panels:
# Panel dimension: width = 980, height = 680 (aspect ratio 1.44:1)
# Original video is 1920x1080.
# Sheikh is in [960:1920, 0:1080].
# Center of Sheikh is x = 1440, y = 350.
# If we take a 980x680 box:
# In source video coords (1920x1080):
# If scale = 1.0 (unscaled):
# Sheikh region of size 960x680 from y=0 to y=680!
# At y=0..680:
# Head top is at y=40 -> 40px headroom!
# Beard ends at y=500.
# Chest down to y=680.
# This captures Sheikh completely with head, eyes, beard, and chest, and 0 cutoff!

sheikh_natural = im.crop((960, 0, 1920, 680))
sheikh_natural.save("render_work/debate_jobeX3sJVhM/sheikh_natural_680.jpg")

# What about Allahyari in [0:960, 0:1080]?
# Allahyari head is at x=480, y=100.
# From y=0 to y=680:
# Head has 100px headroom. Beard/chest down to 680.
# 960x680 fits perfectly!
allahyari_natural = im.crop((0, 0, 960, 680))
allahyari_natural.save("render_work/debate_jobeX3sJVhM/allahyari_natural_680.jpg")

print("Saved natural crops 960x680 successfully.")

