import cv2, os

art_dir = r'C:\Users\mshms\.gemini\antigravity\brain\89b70e81-4249-4272-b3b4-0b6a91b92f56'
cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

for name in ['yameen_f90.png', 'yameen_f250.png', 'yameen_f500.png', 'yameen_f950.png']:
    p = os.path.join(art_dir, name)
    img = cv2.imread(p)
    h, w, _ = img.shape
    
    # Check top boxes (y: 130 to 530)
    # Sheikh box (x: 550 to 1035)
    sheikh_box = img[130:530, 550:1035]
    # Allahyari box (x: 45 to 530)
    allahyari_box = img[130:530, 45:530]
    # Subtitle bar (y: 552 to 637)
    sub_box = img[552:637, 45:1035]
    # Doc box (y: 695 to 1825, x: 45 to 1035)
    doc_box = img[695:1825, 45:1035]
    
    # Face detection in sheikh and allahyari boxes
    faces_sheikh = cascade.detectMultiScale(cv2.cvtColor(sheikh_box, cv2.COLOR_BGR2GRAY), 1.1, 3)
    faces_allahyari = cascade.detectMultiScale(cv2.cvtColor(allahyari_box, cv2.COLOR_BGR2GRAY), 1.1, 3)
    
    # Doc brightness
    doc_gray = cv2.cvtColor(doc_box, cv2.COLOR_BGR2GRAY)
    
    print(f"Still {name} (1080x1920):")
    print(f"  Sheikh Box: faces={len(faces_sheikh)}, mean={sheikh_box.mean():.1f}")
    print(f"  Allahyari Box: faces={len(faces_allahyari)}, mean={allahyari_box.mean():.1f}")
    print(f"  Subtitle Bar: mean={sub_box.mean():.1f}")
    print(f"  Doc Box: mean={doc_gray.mean():.1f} (expected ~170-200 for crisp page)")

