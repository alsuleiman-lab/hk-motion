from PIL import Image

img = Image.open(r"s:\AI_Tools\Remotion_Workspace\public\sheikh_tirmidhi29_frame.jpg")
# Scale height to 1920
new_w = int(1920 * 16 / 9) # 3413
new_h = 1920
scaled = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

# Try center crop
left = (new_w - 1080) // 2 # 1166
crop_center = scaled.crop((left, 0, left + 1080, 1920))
crop_center.save(r"s:\AI_Tools\Remotion_Workspace\public\sheikh_crop_test.jpg")
print("Saved sheikh_crop_test.jpg")

