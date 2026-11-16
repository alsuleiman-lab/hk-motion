import cv2

for t in [3585, 3620, 3735]:
    img = cv2.imread(f"render_work/debate_jobeX3sJVhM/cand1_frame_{t}.jpg")
    h, w, _ = img.shape
    # Left half: [0:h, 0:w//2]
    # Right half: [0:h, w//2:w]
    cv2.imwrite(f"render_work/debate_jobeX3sJVhM/cand1_left_{t}.jpg", img[:, :w//2])
    cv2.imwrite(f"render_work/debate_jobeX3sJVhM/cand1_right_{t}.jpg", img[:, w//2:])
    print(f"Saved halves for {t}")

