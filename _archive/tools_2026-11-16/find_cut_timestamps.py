import json

with open("render_work/debate_jobeX3sJVhM/segments.json", "r", encoding="utf-8") as f:
    segs = json.load(f)

# Search segments between 6080s and 6240s
target_segs = [s for s in segs if 6090 <= s["start"] <= 6235]
with open("render_work/debate_jobeX3sJVhM/detailed_cut_search.txt", "w", encoding="utf-8") as out:
    for s in target_segs:
        out.write(f"[{s['start']:.2f} -> {s['end']:.2f}] {s['text']}\n")

print(f"Wrote {len(target_segs)} segments.")

