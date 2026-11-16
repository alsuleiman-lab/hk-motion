import json

with open("public/shia_insult_v2_words.json", "r", encoding="utf-8") as f:
    words = json.load(f)

with open("render_work/debate_jobeX3sJVhM/all_words_v2.txt", "w", encoding="utf-8") as out:
    for i, w in enumerate(words):
        out.write(f"{i:3d}: [{w['s']:5.2f} -> {w['e']:5.2f}] {w['w']}\n")

print(f"Wrote {len(words)} words to all_words_v2.txt")

