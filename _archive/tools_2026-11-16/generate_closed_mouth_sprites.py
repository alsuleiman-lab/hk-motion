from PIL import Image, ImageDraw
import numpy as np
import os

base_dir = r"S:\AI_Tools\Remotion_Workspace\public\jar_bakheel"
poses = [
    "hands_up",
    "point_talk",
    "hands_hips",
    "hands_folded",
    "shrug_spread",
    "hands_behind"
]

# For both regular and miser prefixes:
prefixes = ["", "miser_"]

for prefix in prefixes:
    for p in poses:
        fname = f"{prefix}{p}.png"
        path = os.path.join(base_dir, fname)
        img = Image.open(path).convert("RGBA")
        arr = np.array(img)
        h, w, _ = arr.shape
        
        # Skin color sample
        skin_mask = (arr[:,:,3] > 200) & (arr[:,:,0] > 220) & (arr[:,:,1] > 140) & (arr[:,:,1] < 210) & (arr[:,:,2] > 115) & (arr[:,:,2] < 185)
        skin_rgb = arr[skin_mask, :3].mean(axis=0).astype(int)
        
        # Find mouth dark pixels in face region
        ys, xs = np.where(skin_mask)
        ymin, ymax = ys.min(), ys.max()
        xmin, xmax = xs.min(), xs.max()
        h_face = ymax - ymin
        
        # Crop mouth region
        # Mouth is strictly between ymin + 0.45*h_face and ymin + 0.90*h_face, and x in [xmin + 0.3*w_face, xmin + 0.7*w_face]
        w_face = xmax - xmin
        m_y1 = int(ymin + 0.45 * h_face)
        m_y2 = int(ymin + 0.92 * h_face)
        m_x1 = int(xmin + 0.30 * w_face)
        m_x2 = int(xmin + 0.70 * w_face)
        
        # Create closed-mouth image:
        closed_img = img.copy()
        draw = ImageDraw.Draw(closed_img)
        
        # Find dark pixels inside mouth box (mouth outline & cavity)
        sub = arr[m_y1:m_y2, m_x1:m_x2]
        dark = (sub[:,:,3] > 200) & (sub[:,:,0] < 80) & (sub[:,:,1] < 80) & (sub[:,:,2] < 80)
        
        # Fill mouth with skin color
        yd, xd = np.where(dark)
        if len(yd) > 0:
            m_center_y = m_y1 + (yd.min() + yd.max()) // 2
            m_center_x = m_x1 + (xd.min() + xd.max()) // 2
            m_width = (xd.max() - xd.min())
            
            # Fill the mouth cavity with skin color
            # Use ellipse or filled box matching mouth bounds
            y_box_min = m_y1 + yd.min() - 2
            y_box_max = m_y1 + yd.max() + 2
            x_box_min = m_x1 + xd.min() - 2
            x_box_max = m_x1 + xd.max() + 2
            
            # Patch skin over open mouth
            fill_color = (int(skin_rgb[0]), int(skin_rgb[1]), int(skin_rgb[2]), 255)
            draw.rectangle([x_box_min, y_box_min, x_box_max, y_box_max], fill=fill_color)
            
            # Draw a closed mouth doodle: a clean curved smile or neutral horizontal line
            line_w = max(16, int(m_width * 0.75))
            draw.line(
                [(m_center_x - line_w // 2, m_center_y), (m_center_x + line_w // 2, m_center_y)],
                fill=(0, 0, 0, 255),
                width=5
            )
            # Slight curved ends
            draw.point([(m_center_x - line_w // 2, m_center_y - 1), (m_center_x + line_w // 2, m_center_y - 1)], fill=(0,0,0,255))
            
        out_closed_path = os.path.join(base_dir, f"{prefix}{p}_closed.png")
        closed_img.save(out_closed_path)
        print(f"Generated closed mouth: {out_closed_path}")

print("All closed mouth sprites generated successfully!")

