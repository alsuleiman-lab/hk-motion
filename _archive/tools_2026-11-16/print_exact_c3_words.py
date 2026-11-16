import json

with open(r"s:\AI_Tools\Remotion_Workspace\render_work\lessons\tirmidhi_29\c3_cut_words.json", "r", encoding="utf-8") as f:
    words = json.load(f)

with open(r"s:\AI_Tools\Remotion_Workspace\render_work\lessons\tirmidhi_29\c3_words_timed.txt", "w", encoding="utf-8") as out:
    for i, w in enumerate(words):
        out.write(f"[{w['s']:.2f} -> {w['e']:.2f}] {w['w']}\n")

print("Wrote c3_words_timed.txt")

