import cv2

cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

s = cv2.imread(r"render_work\debate_jobeX3sJVhM\test_hand_sheikh_crop.jpg")
fs = cascade.detectMultiScale(cv2.cvtColor(s, cv2.COLOR_BGR2GRAY), 1.1, 4)
print("Sheikh crop faces:")
for f in fs:
    print(f"   Face: x={f[0]}, y={f[1]}, w={f[2]}, h={f[3]} -> center_x={f[0]+f[2]//2}")

a = cv2.imread(r"render_work\debate_jobeX3sJVhM\test_hand_allahyari_crop.jpg")
fa = cascade.detectMultiScale(cv2.cvtColor(a, cv2.COLOR_BGR2GRAY), 1.1, 4)
print("Allahyari crop faces:")
for f in fa:
    print(f"   Face: x={f[0]}, y={f[1]}, w={f[2]}, h={f[3]} -> center_x={f[0]+f[2]//2}")

