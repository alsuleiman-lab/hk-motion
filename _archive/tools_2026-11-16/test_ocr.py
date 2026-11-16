import cv2

try:
    import pytesseract
    txt1 = pytesseract.image_to_string(r"render_work\debate_jobeX3sJVhM\cand1_doc_crop.jpg", lang="ara+eng")
    print("Tesseract found:")
    print(txt1[:300])
except Exception as e:
    print(f"Tesseract not available: {e}")

