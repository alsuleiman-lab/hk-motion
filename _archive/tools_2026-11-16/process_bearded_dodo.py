import os
from PIL import Image, ImageDraw
import numpy as np

src_path = r"C:\Users\mshms\.gemini\antigravity\brain\d3dfcd2a-f815-4fd8-96d9-fb0ae1157876\.user_uploaded\media_1793272325698_70c9f19e.png"
out_dir = r"S:\AI_Tools\Remotion_Workspace\cartoon_projects\dodo_style\assets"
public_dir = r"S:\AI_Tools\Remotion_Workspace\public\jar_bakheel"

img = Image.open(src_path).convert("RGBA")
arr = np.array(img)
h, w, _ = arr.shape
print(f"Original size: {w}x{h}")

# The watermark is at the bottom (y > h - 35)
# Crop out the bottom watermark
arr_clean = arr.copy()
arr_clean[int(h * 0.88):, :] = [255, 255, 255, 255] # erase watermark area

# Make white background transparent
rgb = arr_clean[:, :, :3]
is_white = (rgb[:, :, 0] >= 240) & (rgb[:, :, 1] >= 240) & (rgb[:, :, 2] >= 240)
arr_clean[is_white, 3] = 0

# Soft edge transparency
fringe = (rgb[:, :, 0] >= 225) & (rgb[:, :, 1] >= 225) & (rgb[:, :, 2] >= 225) & (~is_white)
arr_clean[fringe, 3] = 130

# Find tight bounding box of the character
rows = np.where(arr_clean[:, :, 3] > 0)[0]
cols = np.where(arr_clean[:, :, 3] > 0)[1]
if len(rows) > 0 and len(cols) > 0:
    ymin, ymax = rows.min(), rows.max()
    xmin, xmax = cols.min(), cols.max()
    # Add 4px padding
    ymin = max(0, ymin - 4)
    ymax = min(h, ymax + 5)
    xmin = max(0, xmin - 4)
    xmax = min(w, xmax + 5)
    cropped = arr_clean[ymin:ymax, xmin:xmax]
else:
    cropped = arr_clean

out_img = Image.fromarray(cropped)
for target in [out_dir, public_dir]:
    out_img.save(os.path.join(target, "bearded_hands_hips.png"))
    print(f"Saved {os.path.join(target, 'bearded_hands_hips.png')} ({out_img.size})")

# Let's also create the closed-mouth and open-mouth versions for the bearded character:
# Inside the black beard, there is the mouth: an oval area with white background and black line
# Let's inspect where the mouth is inside the beard:
arr_b = np.array(out_img)
hb, wb, _ = arr_b.shape
print(f"Cropped bearded size: {wb}x{hb}")

# Mouth in beard is white pixels surrounded by black beard:
# Beard is large black region (x in 0.3*wb..0.75*wb, y in 0.2*hb..0.6*hb)
# Mouth is where R>200, G>200, B>200 inside this beard region!
b_y1, b_y2 = int(0.25 * hb), int(0.55 * hb)
b_x1, b_x2 = int(0.40 * wb), int(0.75 * wb)
sub_b = arr_b[b_y1:b_y2, b_x1:b_x2]
is_mouth_white = (sub_b[:, :, 0] > 180) & (sub_b[:, :, 1] > 180) & (sub_b[:, :, 2] > 180)

ym, xm = np.where(is_mouth_white)
if len(ym) > 0:
    m_y = b_y1 + int(ym.mean())
    m_x = b_x1 + int(xm.mean())
    print(f"Detected mouth center in beard: x={m_x}, y={m_y}")
    
    # Create closed mouth version (mouth is small white oval with a black smile line, or just black beard with smile line)
    # The uploaded image already has a gentle closed/smiling mouth!
    # Let's create an OPEN mouth version for speaking:
    open_img = out_img.copy()
    draw_open = ImageDraw.Draw(open_img)
    # Draw open talking mouth inside the beard:
    # A bigger white/reddish oval with dark interior
    draw_open.ellipse([m_x - 14, m_y - 12, m_x + 14, m_y + 12], fill=(255, 255, 255, 255), outline=(0, 0, 0, 255), width=3)
    draw_open.ellipse([m_x - 9, m_y - 8, m_x + 9, m_y + 8], fill=(136, 19, 55, 255), outline=(0, 0, 0, 255), width=2)
    
    for target in [out_dir, public_dir]:
        open_img.save(os.path.join(target, "bearded_hands_hips_open.png"))
        out_img.save(os.path.join(target, "bearded_hands_hips_closed.png"))
        print("Saved open and closed mouth for bearded character")

print("Processing finished!")

