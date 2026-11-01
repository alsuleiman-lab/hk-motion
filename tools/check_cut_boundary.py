import json

with open("public/shia_insult_v2_map.json", "r", encoding="utf-8") as f:
    m = json.load(f)

for s in m["segments"]:
    # Part 1 was 30.8s. In clip_v2_raw, 30.8s is the boundary.
    if s["a"] >= 30.5:
        print(f"Boundary found at cut timeline: n = {s['n']:.2f}s (source raw a = {s['a']:.2f}s)")
        break

