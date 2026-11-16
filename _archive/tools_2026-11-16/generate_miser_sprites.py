import os
from PIL import Image
import numpy as np

base_dir = r"S:\AI_Tools\Remotion_Workspace\public\jar_bakheel"
pose_names = [
    "hands_up",
    "point_talk",
    "hands_hips",
    "hands_folded",
    "shrug_spread",
    "hands_behind"
]

# The neighbor has a light blue shirt.
# Let's inspect the blue shirt color range:
# Blue channel is notably higher than Red channel in shirt, whereas face has Red > Blue (peach color: R~250, G~180, B~150).
# Shirt: R ~ 180-210, G ~ 205-225, B ~ 220-245.
# Let's create a "miser" version for each pose where the shirt is changed to a stingy olive/mustard color (R: 215, G: 195, B: 120 or olive green R: 160, G: 185, B: 130).

for name in pose_names:
    img_path = os.path.join(base_dir, f"{name}.png")
    img = Image.open(img_path).convert("RGBA")
    arr = np.array(img)
    
    r = arr[:, :, 0].astype(float)
    g = arr[:, :, 1].astype(float)
    b = arr[:, :, 2].astype(float)
    a = arr[:, :, 3]
    
    # Mask for shirt:
    # Blue is higher than red by at least 15, and alpha > 50, and not pure white
    shirt_mask = (a > 50) & (b > r + 10) & (g > 140) & (r < 235)
    
    # Let's tint shirt to olive-amber for the miser:
    miser_arr = arr.copy()
    # Replace shirt pixels
    miser_arr[shirt_mask, 0] = np.clip(r[shirt_mask] * 0.95 + 20, 0, 255).astype(np.uint8) # More red
    miser_arr[shirt_mask, 1] = np.clip(g[shirt_mask] * 0.92, 0, 255).astype(np.uint8) # Slightly less green
    miser_arr[shirt_mask, 2] = np.clip(b[shirt_mask] * 0.55, 0, 255).astype(np.uint8) # Much less blue -> creates mustard/olive
    
    out_img = Image.fromarray(miser_arr)
    out_file = os.path.join(base_dir, f"miser_{name}.png")
    out_img.save(out_file)
    print(f"Created {out_file}")

print("Miser variants generated!")

