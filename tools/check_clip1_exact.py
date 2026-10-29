import json

words_path = r"s:\AI_Tools\Remotion_Workspace\render_work\lessons\tirmidhi_29\words.json"
with open(words_path, "r", encoding="utf-8") as f:
    words = json.load(f)

with open(r"s:\AI_Tools\Remotion_Workspace\render_work\lessons\tirmidhi_29\clip1_exact.txt", "w", encoding="utf-8") as f:
    f.write("--- Start Candidates ---\n")
    for w in words:
        if 768.0 <= w["s"] <= 776.0:
            f.write(f"{w['s']:.2f} -> {w['e']:.2f}: {w['w']}\n")
    f.write("--- End Candidates ---\n")
    for w in words:
        if 860.0 <= w["s"] <= 867.0:
            f.write(f"{w['s']:.2f} -> {w['e']:.2f}: {w['w']}\n")
