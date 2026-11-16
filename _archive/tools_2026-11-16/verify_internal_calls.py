import json

with open(r"temp_debate\segments.json", "r", encoding="utf-8") as f:
    segs = json.load(f)

# Inspect inside each call for any secondary greetings or caller changes:
calls = [
    ("Call 1", 56.0, 1279.0),
    ("Call 2", 1328.0, 1770.0),
    ("Call 3", 1778.0, 2146.0),
    ("Call 4", 2146.0, 2680.0),
    ("Call 5", 2699.0, 2907.0),
    ("Call 6", 2908.0, 4402.0),
    ("Call 7", 4402.0, 4991.0),
    ("Call 8", 4993.0, 5693.0)
]

for name, st, en in calls:
    sub = [s for s in segs if st <= s["start"] <= en]
    print(f"\n{name}: {st:.1f}s -> {en:.1f}s ({len(sub)} segs, raw {(en-st)/60:.2f} min)")
    # Check for unexpected greetings inside
    for s in sub[5:-5]: # skip start and end
        for kw in ["السلام عليكم", "وعليكم السلام", "تفضل يا", "اتصال ثاني", "اتصال جديد", "شكرا لك"]:
            if kw in s["text"]:
                m = int(s["start"] // 60)
                sec = int(s["start"] % 60)
                print(f"  [Potential inside marker at {m:02d}:{sec:02d}]: {s['text']}")

