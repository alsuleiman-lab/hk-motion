import json

with open(r"temp_debate\segments.json", "r", encoding="utf-8") as f:
    segs = json.load(f)

# Let's inspect where greetings or callers appear:
greetings = ["سلام", "مرحبا", "حياك", "ألو", "الو", "تفضل", "أهلا", "معنا", "شكرا", "يا شيخ", "ياشيخ", "مساء الخير", "صباح الخير"]

print("Scanning for greetings / call markers:")
for s in segs:
    txt = s["text"]
    for g in ["السلام عليكم", "وعليكم السلام", "ألو", "الو", "تفضل", "يا شيخ", "ياشيخ"]:
        if g in txt:
            m = int(s["start"] // 60)
            sec = int(s["start"] % 60)
            print(f"[{m:02d}:{sec:02d}] ({s['start']:.1f}s - {s['end']:.1f}s): {txt}")
            break

