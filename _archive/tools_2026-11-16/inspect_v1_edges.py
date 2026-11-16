import json

with open("render_work/lessons/o29nNfDl5_U/words.json", encoding="utf-8") as f:
    words = json.load(f)

# Show words 1315 to 1350
sub = [w for w in words if 1315 <= w["s"] <= 1350]
print("OPENING:")
for w in sub:
    print(f"{w['s']:.2f}s -> {w['e']:.2f}s: {w['w']}")

# Show words around 1830 to 1870 (ending)
sub_end = [w for w in words if 1830 <= w["s"] <= 1870]
print("\nENDING:")
for w in sub_end:
    print(f"{w['s']:.2f}s -> {w['e']:.2f}s: {w['w']}")
