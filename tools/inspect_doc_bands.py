import cv2

doc = cv2.imread('render_work/debate_jobeX3sJVhM/yameen_stills/doc_fitted_990x1130.jpg')
h, w, _ = doc.shape
print(f"Doc fitted size: {w}x{h}")

# Let's crop lines across doc to see where the hadith is clearest:
# The hadith: "كان بين يدي الله عز وجل وعن يمين الله"
# Let's crop middle bands:
for i in range(4):
    band = doc[i*250:(i+1)*250, :]
    cv2.imwrite(f'render_work/debate_jobeX3sJVhM/yameen_stills/doc_band_{i}.jpg', band)

print("Saved doc bands.")

