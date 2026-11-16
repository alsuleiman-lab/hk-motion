from PIL import Image

img = Image.open(r"s:\AI_Tools\Remotion_Workspace\public\sheikh_tirmidhi29_frame.jpg")
# Save a thumbnail 960x540
thumb = img.resize((960, 540))
thumb.save(r"s:\AI_Tools\Remotion_Workspace\public\source_thumb.jpg")

# In the bottom bar, let's crop the bottom 120px: from y=960 to 1080 across full width 1920
bottom_bar = img.crop((0, 960, 1920, 1080))
bottom_bar.save(r"s:\AI_Tools\Remotion_Workspace\public\source_bottom_bar_full.jpg")

# Also crop the bottom right (where sheikh sits) and bottom left
bottom_right = img.crop((1200, 960, 1920, 1080))
bottom_right.save(r"s:\AI_Tools\Remotion_Workspace\public\source_bottom_right.jpg")

bottom_left = img.crop((0, 960, 900, 1080))
bottom_left.save(r"s:\AI_Tools\Remotion_Workspace\public\source_bottom_left.jpg")

print("Cropped source frames successfully!")

