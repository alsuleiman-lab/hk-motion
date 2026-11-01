import cv2

# Let's inspect left_15.jpg and source_page_70.jpg
img15 = cv2.imread(r"C:\Users\mshms\.gemini\antigravity\brain\89b70e81-4249-4272-b3b4-0b6a91b92f56\left_15.jpg")
h, w, _ = img15.shape
print(f"img15 shape: {w}x{h}")

# The document page has black borders around it:
# Let's find exactly where the page text is inside the 960x1080 column:
# Left margin is black (x=0 to ~180)
# Right margin is black (x=~780 to 960)
# Top margin is black (y=0 to ~90)
# Bottom margin is black (y=~990 to 1080)

# Let's test cropping x: 180 to 780 (width 600), y: 90 to 990 (height 900)
crop15 = img15[90:990, 180:780]
cv2.imwrite(r"render_work\debate_jobeX3sJVhM\crop_doc_15.jpg", crop15)

# Also for source_page_70:
img70 = cv2.imread(r"C:\Users\mshms\.gemini\antigravity\brain\89b70e81-4249-4272-b3b4-0b6a91b92f56\source_page_70.jpg")
# In img70: where is the page?
# In source_page_70 (it was cropped [160:1040, 30:930]), let's check original frame
f70 = cv2.imread(r"render_work\debate_jobeX3sJVhM\source_track\raw_sec_070_full.jpg")
left70 = f70[:, :960]
cv2.imwrite(r"render_work\debate_jobeX3sJVhM\left_70_raw.jpg", left70)
crop70 = left70[90:990, 180:780]
cv2.imwrite(r"render_work\debate_jobeX3sJVhM\crop_doc_70.jpg", crop70)

print("Saved crop_doc_15 and crop_doc_70.")

