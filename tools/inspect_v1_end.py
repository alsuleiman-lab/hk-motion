import json

with open("render_work/lessons/o29nNfDl5_U/words.json", encoding="utf-8") as f:
    words = json.load(f)

sub = [w for w in words if 1780 <= w["s"] <= 1840]
lines = []
for w in sub:
    lines.append(f"{w['s']:.2f}s -> {w['e']:.2f}s: {w['w']}")

with open("scratch_v1_end.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

