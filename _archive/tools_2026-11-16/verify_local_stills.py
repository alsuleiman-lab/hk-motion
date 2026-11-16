import cv2, os

for f in ['f90.png', 'f250.png', 'f500.png', 'f950.png']:
    p = os.path.join('render_work/yameen_stills', f)
    img = cv2.imread(p)
    h, w, _ = img.shape
    
    sheikh_box = img[65:265, 275:517]
    allahyari_box = img[65:265, 22:265]
    sub_box = img[276:318, 22:517]
    doc_box = img[347:912, 22:517]
    
    print(f"Still {f} ({w}x{h}):")
    print(f"  Sheikh box mean={sheikh_box.mean():.1f}")
    print(f"  Allahyari box mean={allahyari_box.mean():.1f}")
    print(f"  Sub box mean={sub_box.mean():.1f}")
    print(f"  Doc box mean={doc_box.mean():.1f}")
