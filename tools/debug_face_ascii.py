from PIL import Image
import numpy as np

img = Image.open(r"S:\AI_Tools\Remotion_Workspace\public\jar_bakheel\point_talk.png").convert("RGBA")
arr = np.array(img)

# Face is around x: 100..230, y: 35..170
# Let's inspect the center of the face x: 140..190, y: 70..150
sub = arr[70:150, 140:190]
dark = (sub[:,:,3] > 200) & (sub[:,:,0] < 80) & (sub[:,:,1] < 80) & (sub[:,:,2] < 80)
# Print map of dark pixels
for r in range(dark.shape[0]):
    line = "".join(["#" if dark[r, c] else "." for c in range(dark.shape[1])])
    if "#" in line:
        print(f"y={70+r:3d}: {line}")

