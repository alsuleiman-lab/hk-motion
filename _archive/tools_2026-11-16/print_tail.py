import json

with open(".tmp/stream2_calls_transcript.json", "r", encoding="utf-8") as f:
    segs = json.load(f)

# Let's inspect from 3550s to 3850s
for s in segs:
    if 3550 <= s["start"] <= 3850:
        print(f"[{s['start']:6.1f}s -> {s['end']:6.1f}s] {s['text']}")

