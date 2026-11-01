from PIL import Image

im2 = Image.open("render_work/debate_jobeX3sJVhM/sample_6190.jpg")
# Crop sheikh in frame 6190 around center 1450
c = im2.crop((960, 0, 1920, 1080))
c.save("render_work/debate_jobeX3sJVhM/sheikh_6190.jpg")
print("Saved sheikh 6190")

