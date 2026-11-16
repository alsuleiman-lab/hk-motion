from PIL import Image

crop = Image.open(r"s:\AI_Tools\Remotion_Workspace\public\sheikh_correct_crop.jpg")
W, H = crop.size # 1080, 1920

# 5th fifth: y from 1536 to 1920
fifth_5 = crop.crop((0, 1536, 1080, 1920))
fifth_5.save(r"s:\AI_Tools\Remotion_Workspace\public\portrait_fifth_5.jpg")
print("Saved portrait_fifth_5.jpg (y: 1536 to 1920)")

# 4th fifth: y from 1152 to 1536
fifth_4 = crop.crop((0, 1152, 1080, 1536))
fifth_4.save(r"s:\AI_Tools\Remotion_Workspace\public\portrait_fifth_4.jpg")
print("Saved portrait_fifth_4.jpg (y: 1152 to 1536)")

