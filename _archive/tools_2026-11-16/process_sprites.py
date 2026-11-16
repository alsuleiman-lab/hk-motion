import os
from PIL import Image
import numpy as np

src_path = r"C:\Users\mshms\.gemini\antigravity\brain\d3dfcd2a-f815-4fd8-96d9-fb0ae1157876\.user_uploaded\media_1793269338307_f4163a25.png"
out_dir = r"S:\AI_Tools\Remotion_Workspace\public\jar_bakheel"
os.makedirs(out_dir, exist_ok=True)

img = Image.open(src_path).convert("RGBA")
w, h = img.size
print(f"Loaded image size: {w}x{h}")

# The image is a 3x2 grid of poses:
# Row 0 (top): y from 0 to h//2 (~266)
# Row 1 (bottom): y from h//2 to h
# Columns: x in 3 sections: 0..w//3, w//3..2*w//3, 2*w//3..w

cols = 3
rows = 2
cell_w = w // cols
cell_h = h // rows

pose_names = [
    "hands_up",     # Top left: Both hands raised up, mouth open shouting
    "point_talk",   # Top center: Pointing with left/right hand, mouth open
    "hands_hips",   # Top right: Hands on hips, mouth frowning/talking
    "hands_folded", # Bottom left: Hands clasped in front, smiling
    "shrug_spread", # Bottom center: Hands spread in shrug / question
    "hands_behind"  # Bottom right: Hands behind head / relaxing
]

arr = np.array(img)

# Make white background transparent
# Background is almost pure white (> 245 in RGB)
# Let us do a clean mask for the white background:
# Since background is white, pixels with R>240, G>240, B>240 are background.
# Inside the mouth or eyes, it is black or red/dark. The shirt is light blue/grey (~185, 208, 222), face is peach (~252, 179, 149).

for idx, name in enumerate(pose_names):
    r = idx // cols
    c = idx % cols
    
    x1 = c * cell_w
    x2 = (c + 1) * cell_w
    y1 = r * cell_h
    y2 = (r + 1) * cell_h
    
    cell = arr[y1:y2, x1:x2].copy()
    
    # Let's find tight bounding box of the character in this cell
    # Non-white pixels:
    rgb = cell[:, :, :3]
    is_not_white = (rgb[:, :, 0] < 245) | (rgb[:, :, 1] < 245) | (rgb[:, :, 2] < 245)
    
    # Transparent mask
    alpha = cell[:, :, 3]
    # Smooth alpha near edges if needed, or simple threshold:
    # Where pixel is white, set alpha = 0
    is_white = (rgb[:, :, 0] >= 248) & (rgb[:, :, 1] >= 248) & (rgb[:, :, 2] >= 248)
    cell[is_white, 3] = 0
    
    # Soften slight fringes
    fringe = (rgb[:, :, 0] >= 240) & (rgb[:, :, 1] >= 240) & (rgb[:, :, 2] >= 240) & (~is_white)
    cell[fringe, 3] = 120
    
    # Find bounding box
    rows_has_content = np.where(cell[:, :, 3] > 0)[0]
    cols_has_content = np.where(cell[:, :, 3] > 0)[1]
    
    if len(rows_has_content) > 0 and len(cols_has_content) > 0:
        ymin, ymax = rows_has_content.min(), rows_has_content.max()
        xmin, xmax = cols_has_content.min(), cols_has_content.max()
        # Add 4px padding
        ymin = max(0, ymin - 4)
        ymax = min(cell.shape[0], ymax + 5)
        xmin = max(0, xmin - 4)
        xmax = min(cell.shape[1], xmax + 5)
        cropped = cell[ymin:ymax, xmin:xmax]
    else:
        cropped = cell
        
    out_img = Image.fromarray(cropped)
    out_file = os.path.join(out_dir, f"{name}.png")
    out_img.save(out_file)
    print(f"Saved {out_file} ({out_img.size[0]}x{out_img.size[1]})")

print("All sprites extracted successfully!")

