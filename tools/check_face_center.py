from PIL import Image
import numpy as np

img = Image.open(r"s:\AI_Tools\Remotion_Workspace\public\sheikh_crop_test.jpg")
arr = np.array(img)
h, w, _ = arr.shape

# In the upper third (face area): y from 300 to 800
face_zone = arr[300:800, :, :]
# Skin tones roughly: R > 130, G > 90, B > 70, R > G, R > B
skin_mask = (face_zone[:, :, 0] > 120) & (face_zone[:, :, 1] > 80) & (face_zone[:, :, 2] > 60) & (face_zone[:, :, 0] > face_zone[:, :, 2] + 20)
y_indices, x_indices = np.where(skin_mask)
if len(x_indices) > 0:
    mean_x = np.mean(x_indices)
    print(f"Face center X in portrait (0..1080): {mean_x:.1f}")
    offset_needed = mean_x - (w / 2)
    print(f"Offset needed from center: {offset_needed:.1f}px")
else:
    print("Could not find skin mask, assuming centered.")

