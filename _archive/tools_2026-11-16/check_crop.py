from PIL import Image
import numpy as np

img = Image.open(r"s:\AI_Tools\Remotion_Workspace\public\sheikh_tirmidhi29_frame.jpg")
w, h = img.size
print(f"Image size: {w}x{h}")

# In standard lessons, the Sheikh is seated at his desk.
# Let's check skin tone / face region by color in HSV or YCbCr
img_rgb = np.array(img)
# Sheikh typically wears dark/medium clothes with white/grey ghutra or hat, or sitting in front of bookshelves
# Let's crop a 1080x1920 portrait centered at 960 (center)
# Left offset for 1080 width from 1920:
# center = 960 -> left = (1920 - 1080)/2 = 420.
# If scaled to height 1920: scale = 1920/1080 = 1.7777 -> scaled width = 1920 * 16/9 = 3413.
# In a 1080x1920 portrait frame:
# scale width = 3413, height = 1920.
# If center: left = (1080 - 3413) / 2 = -1166!
print(f"Centered: left = -1166, top = 0, width = 3413, height = 1920")

