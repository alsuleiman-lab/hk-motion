import json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r"render_work\debate_jobeX3sJVhM\segments.json", "r", encoding="utf-8") as f:
    segs = json.load(f)

sub = [s for s in segs if 3430 <= s["start"] <= 3540]
for s in sub:
    print(f"[{s['start']:6.1f} -> {s['end']:6.1f}] {s['text']}")
