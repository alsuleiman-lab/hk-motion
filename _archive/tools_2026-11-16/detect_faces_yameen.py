import cv2

cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
img = cv2.imread('render_work/debate_jobeX3sJVhM/yameen_stills/frame_15s.jpg')
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
faces = cascade.detectMultiScale(gray, 1.1, 4)

print(f"Detected {len(faces)} faces in frame_15s:")
for i, (x, y, w, h) in enumerate(faces):
    print(f"Face {i}: x={x}, y={y}, w={w}, h={h}")
    face_crop = img[max(0, y-30):min(1080, y+h+30), max(0, x-30):min(1920, x+w+30)]
    cv2.imwrite(f'render_work/debate_jobeX3sJVhM/yameen_stills/face_{i}.jpg', face_crop)

