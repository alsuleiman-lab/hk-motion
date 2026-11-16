from PIL import Image
import numpy as np

img = Image.open(r"s:\AI_Tools\Remotion_Workspace\public\original_bottom_bar.jpg")
arr = np.array(img)
print("Shape:", arr.shape)
# Find non-black rows in bottom 200px
# Let's check mean brightness per row from y = 0 to 200 (which corresponds to y=880 to 1080 in source)
for y in range(0, 200, 10):
    row_mean = np.mean(arr[y, :, :])
    print(f"Row {880 + y}: brightness {row_mean:.1f}")

