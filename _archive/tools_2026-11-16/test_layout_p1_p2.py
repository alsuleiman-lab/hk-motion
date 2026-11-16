from PIL import Image

# Open frame 300 (Part 1: Split Screen)
im_p1 = Image.open("render_work/debate_jobeX3sJVhM/frame_raw_300.jpg")
# Open frame 1200 (Part 2: Solo Camera)
im_p2 = Image.open("render_work/debate_jobeX3sJVhM/frame_raw_1200.jpg")

# Test 1: Part 1 Sheikh Crop
# Sheikh in Part 1 is centered at x=1440, y=300
# Card size 980x680
# In 1920x1080 coords, let's take a 960x666 crop centered at 1440:
# x from 1440 - 480 = 960 to 1920!
# y from 0 to 680
p1_sheikh = im_p1.crop((960, 0, 1920, 680))
p1_sheikh.save("render_work/debate_jobeX3sJVhM/test_p1_sheikh.jpg")

# Test 2: Part 1 Allahyari Crop
# Allahyari in Part 1 is centered at x=400..440, y=300
# x from 0 to 960 (center 480)
p1_allahyari = im_p1.crop((0, 0, 960, 680))
p1_allahyari.save("render_work/debate_jobeX3sJVhM/test_p1_allahyari.jpg")

# Test 3: Part 2 Sheikh Solo Crop!
# In Part 2, Sheikh is centered at x=930..950, y=330!
# He is in the CENTER of the 1920x1080 frame!
# For a large portrait card of width 980 and height 980 (square) or 980x1100:
# Center is x=960.
# If we crop x from (960 - 490) = 470 to (960 + 490) = 1450 (width 980!)
# y from 0 to 980:
p2_sheikh_solo = im_p2.crop((470, 0, 1450, 980))
p2_sheikh_solo.save("render_work/debate_jobeX3sJVhM/test_p2_sheikh_solo.jpg")

print("Saved test crops for Part 1 and Part 2.")

