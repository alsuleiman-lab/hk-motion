import json

with open(r"render_work\debate_jobeX3sJVhM\segments.json", "r", encoding="utf-8") as f:
    segs = json.load(f)

sub = [s for s in segs if 5900 <= s["start"] <= 6110]
with open(r"render_work\debate_jobeX3sJVhM\pre_insult_debate.txt", "w", encoding="utf-8") as f:
    for s in sub:
        f.write(f"[{s['start']:6.1f} -> {s['end']:6.1f}] {s['text']}\n")

print(f"Dumped {len(sub)} segs to pre_insult_debate.txt")

