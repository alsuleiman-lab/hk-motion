from PIL import Image
import numpy as np
import os

base_dir = r"S:\AI_Tools\Remotion_Workspace\public\jar_bakheel"
poses = ["hands_up", "point_talk", "hands_hips", "hands_folded", "shrug_spread", "hands_behind"]

for p in poses:
    path = os.path.join(base_dir, f"{p}.png")
    img = Image.open(path).convert("RGBA")
    arr = np.array(img)
    h, w, _ = arr.shape
    
    # Skin mask: peach color
    skin = (arr[:,:,3] > 200) & (arr[:,:,0] > 220) & (arr[:,:,1] > 140) & (arr[:,:,1] < 210) & (arr[:,:,2] > 115) & (arr[:,:,2] < 185)
    ys, xs = np.where(skin)
    if len(ys) == 0:
        continue
    ymin, ymax = ys.min(), ys.max()
    xmin, xmax = xs.min(), xs.max()
    h_face = ymax - ymin
    w_face = xmax - xmin
    
    # Find mouth: dark pixels in the lower half of face (y > ymin + 0.45*h_face)
    face_arr = arr[ymin:ymax, xmin:xmax]
    dark_in_face = (face_arr[:,:,3] > 200) & (face_arr[:,:,0] < 80) & (face_arr[:,:,1] < 80) & (face_arr[:,:,2] < 80)
    yd, xd = np.where(dark_in_face)
    
    # Filter for mouth (below eyes)
    is_mouth = yd > (h_face * 0.42)
    if np.any(is_mouth):
        mouth_ymin = ymin + yd[is_mouth].min()
        mouth_ymax = ymin + yd[is_mouth].max()
        mouth_xmin = xmin + xd[is_mouth].min()
        mouth_xmax = xmin + xd[is_mouth].max()
        mouth_cy = (mouth_ymin + mouth_ymax) / 2.0
        mouth_cx = (mouth_xmin + mouth_xmax) / 2.0
        print(f"{p}: size={w}x{h}, face=({xmin},{ymin})-({xmax},{ymax}), mouth center=({mouth_cx:.1f}, {mouth_cy:.1f}), mouth size=({mouth_xmax-mouth_xmin}x{mouth_ymax-mouth_ymin})")

