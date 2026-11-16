import json

with open("render_work/debate_jobeX3sJVhM/segments.json", "r", encoding="utf-8") as f:
    segs = json.load(f)

for s in segs[2665:2672]:
    print(s)

