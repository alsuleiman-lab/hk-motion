import json

with open(".tmp/stream2_calls_transcript.json", "r", encoding="utf-8") as f:
    segs = json.load(f)

print("--- Inspecting Call 4 (1140s - 1450s) ---")
for s in segs:
    if 1140 <= s["start"] <= 1450:
        print(f"[{s['start']:6.1f}s -> {s['end']:6.1f}s] {s['text']}")

