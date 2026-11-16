import json

with open(r"temp_debate\segments.json", "r", encoding="utf-8") as f:
    segs = json.load(f)

# Let's inspect intervals in detail:
intervals = [
    ("CALLER 1 END / SHEIKH TRANSITION / CALLER 2 START", 1240, 1345),
    ("CALLER 2 END / CALLER 3 START", 1740, 1820),
    ("CALLER 3 END / CALLER 4 START", 2110, 2170),
    ("CALLER 4 END / SHEIKH TALK / CALLER 5 START", 2650, 2715),
    ("CALLER 5 END / CALLER 6 START", 2870, 2935),
    ("CALLER 6 END / SHEIKH TALK / CALLER 7 START", 4350, 4425),
    ("CALLER 7 END / CALLER 8 START", 4950, 5010),
    ("CALLER 8 END / OUTRO", 5670, 5729)
]

with open(r"temp_debate\detailed_transitions.txt", "w", encoding="utf-8") as out:
    for title, st, en in intervals:
        out.write(f"\n======================================================\n")
        out.write(f"=== {title} ({st}s -> {en}s) ===\n")
        out.write(f"======================================================\n")
        for s in segs:
            if st <= s["start"] <= en:
                m = int(s["start"] // 60)
                sec = int(s["start"] % 60)
                out.write(f"[{m:02d}:{sec:02d}] ({s['start']:6.2f} - {s['end']:6.2f}): {s['text']}\n")

print("Wrote detailed_transitions.txt")

