import cv2, subprocess, json, numpy as np

# Analyze face positions in source.mp4 between 6103s and 6224s
video = r"render_work/debate_jobeX3sJVhM/source.mp4"
start_sec = 6103.0
duration = 122.0

cas = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

# Sample 1 frame every 2 seconds
sheikh_faces = []
shia_faces = []

cap = cv2.VideoCapture(video)
fps = cap.get(cv2.CAP_PROP_FPS)

print(f"Reading video from {start_sec}s...")
for sec in range(int(start_sec), int(start_sec + duration), 2):
    cap.set(cv2.CAP_PROP_POS_MSEC, sec * 1000.0)
    ret, frame = cap.read()
    if not ret:
        break
    
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    # Left half: Shia (0 to 960)
    shia_roi = gray[:, 0:960]
    shia_det = cas.detectMultiScale(shia_roi, 1.2, 4, minSize=(60, 60))
    if len(shia_det) > 0:
        # take the largest
        b = max(shia_det, key=lambda x: x[2]*x[3])
        shia_faces.append({"t": sec - start_sec, "x": int(b[0]), "y": int(b[1]), "w": int(b[2]), "h": int(b[3])})

    # Right half: Sheikh (960 to 1920)
    sheikh_roi = gray[:, 960:1920]
    sheikh_det = cas.detectMultiScale(sheikh_roi, 1.2, 4, minSize=(60, 60))
    if len(sheikh_det) > 0:
        b = max(sheikh_det, key=lambda x: x[2]*x[3])
        sheikh_faces.append({"t": sec - start_sec, "x": int(960 + b[0]), "y": int(b[1]), "w": int(b[2]), "h": int(b[3])})

cap.release()

with open("render_work/debate_jobeX3sJVhM/face_stats.json", "w", encoding="utf-8") as f:
    json.dump({"sheikh": sheikh_faces, "shia": shia_faces}, f, indent=2)

print(f"Detected {len(sheikh_faces)} sheikh frames and {len(shia_faces)} shia frames.")
# Compute average face center and bounds
if sheikh_faces:
    avg_x = np.mean([f["x"] + f["w"]/2 for f in sheikh_faces])
    avg_y = np.mean([f["y"] + f["h"]/2 for f in sheikh_faces])
    min_top = min([f["y"] for f in sheikh_faces])
    max_bot = max([f["y"] + f["h"] for f in sheikh_faces])
    print(f"Sheikh Face Center: X={avg_x:.1f}, Y={avg_y:.1f}. Head top min={min_top}, chin max={max_bot}")

if shia_faces:
    avg_x = np.mean([f["x"] + f["w"]/2 for f in shia_faces])
    avg_y = np.mean([f["y"] + f["h"]/2 for f in shia_faces])
    min_top = min([f["y"] for f in shia_faces])
    max_bot = max([f["y"] + f["h"] for f in shia_faces])
    print(f"Shia Face Center: X={avg_x:.1f}, Y={avg_y:.1f}. Head top min={min_top}, chin max={max_bot}")

