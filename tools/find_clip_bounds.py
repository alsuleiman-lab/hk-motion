import json

with open(r'render_work\debate_jobeX3sJVhM\segments.json', 'r', encoding='utf-8') as f:
    segs = json.load(f)

print("--- START BOUNDS CANDIDATES ---")
for s in segs:
    if 6060 <= s['start'] <= 6085:
        m, sec = int(s['start']//60), s['start']%60
        print(f"ID {s['id']}: [{m:02d}:{sec:05.2f}] {s['text']}")

print("\n--- END BOUNDS CANDIDATES ---")
for s in segs:
    if 6230 <= s['start'] <= 6265:
        m, sec = int(s['start']//60), s['start']%60
        print(f"ID {s['id']}: [{m:02d}:{sec:05.2f}] {s['text']}")

