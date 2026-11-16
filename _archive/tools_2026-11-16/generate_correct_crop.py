from PIL import Image

# Open source frame
img = Image.open(r"s:\AI_Tools\Remotion_Workspace\public\sheikh_tirmidhi29_frame.jpg")
W, H = img.size # 1920, 1080

scale = 1920.0 / 1080.0 # 1.777778
scaled_w = int(W * scale) # 3413
scaled_h = 1920

scaled_img = img.resize((scaled_w, scaled_h), Image.Resampling.LANCZOS)

# Crop with left = 2146 (so x from 2146 to 2146 + 1080)
crop_left = 2146
crop_right = crop_left + 1080
portrait_frame = scaled_img.crop((crop_left, 0, crop_right, 1920))
portrait_frame.save(r"s:\AI_Tools\Remotion_Workspace\public\sheikh_correct_crop.jpg")
print(f"Saved sheikh_correct_crop.jpg (cropped from {crop_left} to {crop_right})")

