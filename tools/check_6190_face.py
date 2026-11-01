import cv2

cas = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
im = cv2.imread("render_work/debate_jobeX3sJVhM/sheikh_6190.jpg")
gray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
faces = cas.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=3, minSize=(60, 60))
print("Sheikh 6190 faces:", faces)

