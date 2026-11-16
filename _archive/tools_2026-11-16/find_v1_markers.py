import json

with open("render_work/lessons/o29nNfDl5_U/vad.json", encoding="utf-8") as f:
    vad = json.load(f)

with open("render_work/lessons/o29nNfDl5_U/words.json", encoding="utf-8") as f:
    words = json.load(f)

# Find start where he introduces Baybars and the plot against Ibn Taymiyyah
# Let's see words around 1340s - 1400s (22:20 - 23:20)
def find_words_near(text, st, en):
    return [w for w in words if st <= w["s"] <= en and text in w["w"]]

print("Words with بيبرس:")
for w in words:
    if 1300 <= w["s"] <= 1950 and ("بيبرس" in w["w"] or "المنبجي" in w["w"] or "مخلوف" in w["w"] or "التسعينية" in w["w"]):
        print(f"{w['s']:.2f}s: {w['w']}")
