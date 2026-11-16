import cv2
import json
import os
import numpy as np

cas_default = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
cas_alt = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_alt2.xml")
cas_prof = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_profileface.xml")

cuts = [
    ("stream_ifk_salul", "public/stream_ifk_salul_cut.mp4"),
    ("stream_sifat_sam3", "public/stream_sifat_sam3_cut.mp4"),
    ("stream_iman_makhluq", "public/stream_iman_makhluq_cut.mp4")
]

os.makedirs(".tmp/face_analysis", exist_ok=True)

def detect_faces(gray):
    boxes = []
    min_side = max(40, int(min(gray.shape) * 0.04))
    for cas in (cas_default, cas_alt):
        b = cas.detectMultiScale(gray, 1.1, 4, minSize=(min_side, min_side))
        boxes.extend([tuple(x) for x in b])
    if not boxes:
        b = cas_prof.detectMultiScale(gray, 1.1, 3, minSize=(min_side, min_side))
        boxes.extend([tuple(x) for x in b])
        fl = cv2.flip(gray, 1)
        b_fl = cas_prof.detectMultiScale(fl, 1.1, 3, minSize=(min_side, min_side))
        boxes.extend([(gray.shape[1] - x - w, y, w, h) for (x, y, w, h) in b_fl])
    return boxes

all_stats = {}

for name, path in cuts:
    cap = cv2.VideoCapture(path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps
    print(f"\n==========================================")
    print(f"Analyzing {name} ({duration:.1f}s, {total_frames} frames)...")
    
    # Sample every 1.5 seconds
    step = int(fps * 1.5)
    samples = []
    
    for fn in range(0, total_frames, step):
        cap.set(cv2.CAP_PROP_POS_FRAMES, fn)
        ret, frame = cap.read()
        if not ret:
            break
        sec = fn / fps
        H, W = frame.shape[:2]
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Check if there is an opponent or split screen
        # Let's detect all faces in the frame
        faces = detect_faces(gray)
        
        sample_info = {
            "fn": fn,
            "sec": round(sec, 2),
            "faces": []
        }
        
        for (x, y, w, h) in faces:
            cx = x + w // 2
            cy = y + h // 2
            sample_info["faces"].append({
                "x": int(x), "y": int(y), "w": int(w), "h": int(h),
                "cx": int(cx), "cy": int(cy)
            })
            
        samples.append(sample_info)
        
    cap.release()
    
    # Filter Sheikh faces (usually on the right side if split screen, or the primary face)
    # Let's inspect where faces appear
    all_cx = [f["cx"] for s in samples for f in s["faces"]]
    print(f"Total face detections: {len(all_cx)}")
    
    # Save a diagnostic plot/image of 3 sample frames with detected bounding boxes
    cap = cv2.VideoCapture(path)
    sample_timestamps = [5.0, duration / 2.0, max(5.0, duration - 10.0)]
    for idx, ts in enumerate(sample_timestamps):
        cap.set(cv2.CAP_PROP_POS_MSEC, ts * 1000.0)
        ret, frame = cap.read()
        if ret:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = detect_faces(gray)
            vis = frame.copy()
            for (x, y, w, h) in faces:
                cv2.rectangle(vis, (x, y), (x+w, y+h), (0, 255, 0), 3)
                cx = x + w // 2
                cy = y + h // 2
                cv2.circle(vis, (cx, cy), 6, (0, 0, 255), -1)
                cv2.putText(vis, f"cx={cx},cy={cy}", (x, max(30, y-10)), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
            cv2.imwrite(f".tmp/face_analysis/{name}_sample_{idx}.jpg", vis)
    cap.release()
    
    all_stats[name] = samples

with open(".tmp/face_analysis/face_stats.json", "w", encoding="utf-8") as f:
    json.dump(all_stats, f, indent=2)

print("\nFace analysis saved to .tmp/face_analysis/face_stats.json")

