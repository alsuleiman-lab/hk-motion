import json

with open(r"temp_debate\segments.json", "r", encoding="utf-8") as f:
    segs = json.load(f)

with open(r"temp_debate\call_boundaries.txt", "w", encoding="utf-8") as out:
    for i, s in enumerate(segs):
        t = s["text"]
        st = s["start"]
        et = s["end"]
        m = int(st // 60)
        sec = int(st % 60)
        for p in ["السلام عليكم", "وعليكم السلام", "نأخذ اتصال", "اتصال", "تفضل", "ألو", "الو", "مع السلامة", "شكرا لك", "حياك الله", "قطع الخط", "نكتفي"]:
            if p in t:
                out.write(f"[{m:02d}:{sec:02d}] (seg {i:4d}, {st:6.1f}s - {et:6.1f}s): {t}\n")
                break

print("Done writing call_boundaries.txt")
