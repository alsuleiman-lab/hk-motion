import json

with open(r"temp_debate\segments.json", "r", encoding="utf-8") as f:
    segs = json.load(f)

with open(r"temp_debate\call3_end_detail.txt", "w", encoding="utf-8") as out:
    for s in segs:
        if 2110 <= s["start"] <= 2155:
            m = int(s["start"] // 60)
            sec = int(s["start"] % 60)
            out.write(f"[{m:02d}:{sec:02d}] ({s['start']:.2f} - {s['end']:.2f}): {s['text']}\n")

print("Wrote call3_end_detail.txt")

