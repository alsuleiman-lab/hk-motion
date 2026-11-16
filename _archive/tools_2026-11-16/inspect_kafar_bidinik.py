import json

with open(".tmp/stream2_calls_transcript.json", encoding="utf-8") as f:
    data = json.load(f)

print("=== Detailed dialogue from 1550s to 1695s ===")
for s in data:
    start = s.get("start", 0)
    end = s.get("end", 0)
    text = s.get("text", "")
    if 1550 <= start <= 1695:
        print(f"{start:6.1f}s -> {end:6.1f}s: {text}")
