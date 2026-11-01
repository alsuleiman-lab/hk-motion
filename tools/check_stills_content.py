import cv2, glob, os

files = sorted(glob.glob('render_work/debate_jobeX3sJVhM/yameen_stills/frame_*.jpg'))

for f in files:
    img = cv2.imread(f)
    h, w, _ = img.shape
    # Left half mean color
    left = img[:, :w//2]
    right = img[:, w//2:]
    
    # Check if left is document (white page usually has mean > 150)
    left_gray = cv2.cvtColor(left, cv2.COLOR_BGR2GRAY)
    right_gray = cv2.cvtColor(right, cv2.COLOR_BGR2GRAY)
    
    doc_area = left_gray[200:800, 100:800]
    
    print(f"{os.path.basename(f)}: left_mean={left_gray.mean():.1f}, doc_area_mean={doc_area.mean():.1f}, right_mean={right_gray.mean():.1f}")

