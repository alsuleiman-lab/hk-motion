import json

with open(".tmp/stream2_calls_transcript.json", "r", encoding="utf-8") as f:
    segs = json.load(f)

print("--- Inspecting Call 5 (2495s - 3150s) ---")
for s in segs:
    if 2500 <= s["start"] <= 2850:
        print(f"[{s['start']:6.1f}s -> {s['end']:6.1f}s] {s['text']}")

