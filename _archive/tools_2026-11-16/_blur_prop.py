import cv2, numpy as np
img = cv2.imread("public/eu/prop_fr.jpg")
out = img.copy().astype(np.float32)
H, W = img.shape[:2]
# every person's head in the shot (cx, cy, rx, ry); gaussian blur strength 15 with a soft elliptical mask
for (cx, cy, rx, ry) in [(135, 400, 78, 85), (955, 340, 48, 48), (1055, 370, 50, 52), (1130, 385, 38, 45), (1215, 380, 42, 50), (1270, 385, 22, 40)]:
    blur = cv2.GaussianBlur(img, (0, 0), 15).astype(np.float32)
    m = np.zeros((H, W), np.float32)
    cv2.ellipse(m, (cx, cy), (rx, ry), 0, 0, 360, 1.0, -1)
    m = cv2.GaussianBlur(m, (0, 0), 7)[..., None]
    out = blur * m + out * (1 - m)
cv2.imwrite("public/eu/prop_fr_blur15.jpg", np.clip(out, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 93])
print("ok")
