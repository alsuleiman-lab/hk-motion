import json

words_path = r"s:\AI_Tools\Remotion_Workspace\render_work\lessons\tirmidhi_29\words.json"
with open(words_path, "r", encoding="utf-8") as f:
    words = json.load(f)

with open(r"s:\AI_Tools\Remotion_Workspace\render_work\lessons\tirmidhi_29\clip2_exact.txt", "w", encoding="utf-8") as f:
    f.write("--- Start Candidates ---\n")
    for w in words:
        if 2130.0 <= w["s"] <= 2140.0:
            f.write(f"{w['s']:.2f} -> {w['e']:.2f}: {w['w']}\n")
    f.write("--- End Candidates ---\n")
    for w in words:
        if 2258.0 <= w["s"] <= 2268.0:
            f.write(f"{w['s']:.2f} -> {w['e']:.2f}: {w['w']}\n")

