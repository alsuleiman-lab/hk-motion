import os
from PIL import Image, ImageDraw
import numpy as np

base_dir = r"S:\AI_Tools\Remotion_Workspace\public\jar_bakheel"
target_dir = r"S:\AI_Tools\Remotion_Workspace\cartoon_projects\dodo_style\assets"

poses = [
    "hands_up",
    "point_talk",
    "hands_hips",
    "hands_folded",
    "shrug_spread",
    "hands_behind"
]

# Yellow shirt color from the uploaded image: R~245, G~185, B~15
yellow_shirt = (245, 185, 15)

for p in poses:
    # 1. Base image (open and closed mouth)
    for state in ["", "_closed"]:
        src_file = os.path.join(base_dir, f"{p}{state}.png")
        if not os.path.exists(src_file):
            continue
        img = Image.open(src_file).convert("RGBA")
        arr = np.array(img)
        h, w, _ = arr.shape
        
        # Change shirt to bright golden yellow (from the uploaded character)
        a = arr[:, :, 3]
        r = arr[:, :, 0].astype(float)
        g = arr[:, :, 1].astype(float)
        b = arr[:, :, 2].astype(float)
        
        # Shirt mask (blue > red + 10)
        shirt_mask = (a > 50) & (b > r + 10) & (g > 140) & (r < 235)
        
        # Replace shirt with golden yellow
        arr[shirt_mask, 0] = np.clip(yellow_shirt[0] * (r[shirt_mask]/200.0), 0, 255).astype(np.uint8)
        arr[shirt_mask, 1] = np.clip(yellow_shirt[1] * (g[shirt_mask]/210.0), 0, 255).astype(np.uint8)
        arr[shirt_mask, 2] = np.clip(yellow_shirt[2] * (b[shirt_mask]/230.0), 0, 255).astype(np.uint8)
        
        # Find face bounds to position the beard
        skin_mask = (arr[:,:,3] > 200) & (arr[:,:,0] > 220) & (arr[:,:,1] > 140) & (arr[:,:,1] < 210) & (arr[:,:,2] > 115) & (arr[:,:,2] < 185)
        ys, xs = np.where(skin_mask)
        if len(ys) > 0 and len(xs) > 0:
            ymin, ymax = ys.min(), ys.max()
            xmin, xmax = xs.min(), xs.max()
            h_face = ymax - ymin
            w_face = xmax - xmin
            
            # Beard center and size
            # Center of the face horizontally
            fc_x = (xmin + xmax) // 2
            # Beard starts below the eyes (around ymin + 0.45*h_face) and extends down to ymax + 5
            b_top = int(ymin + 0.44 * h_face)
            b_bottom = int(ymax + 6)
            b_left = int(fc_x - 0.38 * w_face)
            b_right = int(fc_x + 0.38 * w_face)
            
            # Draw beard as a rich black rounded oval
            bearded_img = Image.fromarray(arr)
            draw = ImageDraw.Draw(bearded_img)
            
            # Black beard
            draw.ellipse([b_left, b_top, b_right, b_bottom], fill=(0, 0, 0, 255))
            
            # Inside the beard: mouth
            m_cy = (b_top + b_bottom) // 2 - 2
            m_cx = fc_x
            
            if state == "_closed":
                # Closed mouth: white oval with black smile line
                draw.ellipse([m_cx - 12, m_cy - 7, m_cx + 12, m_cy + 7], fill=(255, 255, 255, 255), outline=(0, 0, 0, 255), width=3)
                draw.arc([m_cx - 8, m_cy - 4, m_cx + 8, m_cy + 5], start=0, end=180, fill=(0, 0, 0, 255), width=3)
            else:
                # Open mouth: white oval with dark cavity
                draw.ellipse([m_cx - 14, m_cy - 10, m_cx + 14, m_cy + 10], fill=(255, 255, 255, 255), outline=(0, 0, 0, 255), width=3)
                draw.ellipse([m_cx - 9, m_cy - 7, m_cx + 9, m_cy + 7], fill=(136, 19, 55, 255), outline=(0, 0, 0, 255), width=2)
        else:
            bearded_img = Image.fromarray(arr)
            
        out_name = f"bearded_{p}{state}.png"
        for dest in [base_dir, target_dir]:
            bearded_img.save(os.path.join(dest, out_name))
            
    print(f"Generated bearded {p}")

print("All bearded poses generated successfully!")

