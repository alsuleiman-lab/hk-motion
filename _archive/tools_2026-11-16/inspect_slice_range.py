import json

with open(".tmp/stream2_calls_transcript.json", encoding="utf-8") as f:
    data = json.load(f)

for s in data:
    if 1565 <= s.get("start", 0) <= 1695:
        print(f"{s.get('start', 0):6.2f}s -> {s.get('end', 0):6.2f}s: {s.get('text', '')}")

