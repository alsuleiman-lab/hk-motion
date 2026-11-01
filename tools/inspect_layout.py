import json
from PIL import Image

im = Image.open("render_work/debate_jobeX3sJVhM/sample_6110.jpg")
print(f"Image size: {im.size}") # width, height

# Let's crop test regions:
# Allahyari is on left (0 to 960)
# Sheikh is on right (960 to 1920)
# Height is 1080.
# In Shorts (1080x1920):
# If stacked: Top panel height and Bottom panel height.
# Let's see how much headroom Sheikh and Allahyari have in the source 1920x1080 frame.

