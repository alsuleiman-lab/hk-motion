import json

with open(r"temp_debate\segments.json", "r", encoding="utf-8") as f:
    segs = json.load(f)

def print_detail(st, en):
    for s in segs:
        if st <= s["start"] <= en:
            m = int(s["start"] // 60)
            sec = int(s["start"] % 60)
            print(f"[{m:02d}:{sec:02d}] {s['start']:.2f} -> {s['end']:.2f}: {s['text']}")

print("--- Caller 3 end / Caller 4 start ---")
print_detail(2110, 2160)

