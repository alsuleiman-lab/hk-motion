import json

with open(r"temp_debate\segments.json", "r", encoding="utf-8") as f:
    segs = json.load(f)

with open(r"temp_debate\call5_full.txt", "w", encoding="utf-8") as out:
    for s in segs:
        if 2690 <= s["start"] <= 2915:
            m = int(s["start"] // 60)
            sec = int(s["start"] % 60)
            out.write(f"[{m:02d}:{sec:02d}] ({s['start']:.1f}s - {s['end']:.1f}s): {s['text']}\n")

print("Wrote call5_full.txt")

