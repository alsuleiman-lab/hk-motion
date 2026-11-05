import json, re

with open(r"temp_debate\segments.json", "r", encoding="utf-8") as f:
    segs = json.load(f)

print(f"Total segments: {len(segs)}")

# Let's search for keywords that indicate call transitions:
call_keywords = [
    "اتصال", "تفضل", "ألو", "الو", "السلام عليكم", "وعليكم السلام", 
    "حياك", "أهلا", "اهلا", "مرحبا", "معنا", "شكرا", "مع السلامة", 
    "قطع", "الخط", "نأخذ", "أبو", "ابو", "أخ", "اخ", "يا شيخ", "ياشيخ"
]

transitions = []
for i, s in enumerate(segs):
    t = s["text"]
    st = s["start"]
    et = s["end"]
    # Check if this segment has interesting keywords
    for kw in ["اتصال", "تفضل", "ألو", "الو", "معنا", "نأخذ", "قطع الخط", "مع السلامة", "حياك الله"]:
        if kw in t:
            transitions.append((i, st, et, t))
            break

print(f"Found {len(transitions)} potential transition segments.")

with open(r"temp_debate\transitions.txt", "w", encoding="utf-8") as out:
    for idx, st, et, text in transitions:
        m = int(st // 60)
        s = int(st % 60)
        out.write(f"[{m:02d}:{s:02d}] (seg {idx}, {st:.1f}s - {et:.1f}s): {text}\n")

# Also print a summary every 2 minutes or whenever major greeting occurs
print("Transitions written to temp_debate\\transitions.txt")

