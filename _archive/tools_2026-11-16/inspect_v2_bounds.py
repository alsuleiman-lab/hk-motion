import json

with open("render_work/lessons/o29nNfDl5_U/words.json", encoding="utf-8") as f:
    words = json.load(f)

# Words 55s to 85s
sub_st = [w for w in words if 55 <= w["s"] <= 85]
lines = ["=== V2 START ==="]
for w in sub_st:
    lines.append(f"{w['s']:.2f}s -> {w['e']:.2f}s: {w['w']}")

# Words 190s to 215s
sub_en = [w for w in words if 190 <= w["s"] <= 215]
lines.append("\n=== V2 END ===")
for w in sub_en:
    lines.append(f"{w['s']:.2f}s -> {w['e']:.2f}s: {w['w']}")

with open("scratch_v2_exact.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print("V2 exact boundaries saved.")
