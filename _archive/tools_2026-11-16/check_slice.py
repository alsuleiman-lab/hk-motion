from PIL import Image
import numpy as np

img = Image.open(r"s:\AI_Tools\Remotion_Workspace\public\portrait_fifth_5.jpg")
arr = np.array(img)
h, w, c = arr.shape
print(f"Fifth 5 size: {w}x{h}")

# The bottom bar in the original video:
# In source 1080p, the bar is at the bottom.
# Scaled by 1.777, the bottom 100px of source is the bottom 178px of portrait!
# Let's crop the bottom 180px of fifth 5:
bottom_bar = img.crop((0, h - 180, w, h))
bottom_bar.save(r"s:\AI_Tools\Remotion_Workspace\public\portrait_bottom_bar_slice.jpg")
print("Saved portrait_bottom_bar_slice.jpg")

