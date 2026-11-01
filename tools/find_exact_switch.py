import cv2

cap = cv2.VideoCapture("public/shia_insult_v2_cut.mp4")
fps = cap.get(cv2.CAP_PROP_FPS)

# Scan from 25.0s to 28.0s
start_frame = int(25.0 * fps)
end_frame = int(28.0 * fps)

print(f"Scanning frames {start_frame} to {end_frame} (fps={fps})...")
for f_idx in range(start_frame, end_frame, 2):
    cap.set(cv2.CAP_PROP_POS_FRAMES, f_idx)
    ret, frame = cap.read()
    if not ret: break
    
    # Check if frame is split screen or solo:
    # In split screen, there is a vertical divider line or different backgrounds at x=955..965.
    # In full screen, the background behind Sheikh spans across x=960.
    t_sec = f_idx / fps
    cv2.imwrite(f"render_work/debate_jobeX3sJVhM/trans_{f_idx}.jpg", frame)

cap.release()
print("Saved transition frames.")

