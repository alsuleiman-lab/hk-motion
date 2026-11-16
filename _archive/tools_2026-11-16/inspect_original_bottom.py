from PIL import Image

img = Image.open(r"s:\AI_Tools\Remotion_Workspace\public\sheikh_tirmidhi29_frame.jpg")
w, h = img.size
print(f"Source size: {w}x{h}")

# The original video has a bar at the bottom!
# Let's crop the bottom 200px of the source video (y: 880 to 1080)
bottom_slice = img.crop((0, h - 200, w, h))
bottom_slice.save(r"s:\AI_Tools\Remotion_Workspace\public\original_bottom_bar.jpg")
print("Saved original_bottom_bar.jpg")

