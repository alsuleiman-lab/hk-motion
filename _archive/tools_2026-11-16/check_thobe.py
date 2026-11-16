from PIL import Image
import numpy as np

img = Image.open(r"s:\AI_Tools\Remotion_Workspace\public\sheikh_crop_test.jpg")
arr = np.array(img)
# Sheikh chest area: y from 900 to 1400, x from 300 to 780
chest = arr[900:1300, 350:730]
mean_color = np.mean(chest, axis=(0, 1))
print("Mean RGB of clothes:", mean_color)

