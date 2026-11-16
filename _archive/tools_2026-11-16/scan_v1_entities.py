import json

with open("public/lesson58_v1_words.json", encoding="utf-8") as f:
    words = json.load(f)

# Find key entities and quotes in the timeline
entities = [
    "بيبرس", "الجاشنكير", "المملوكية", "متذوق", "القلعة", "ابن تيمية", "الصوفية",
    "نصر المنبجي", "ابن حجر", "ابن عربي", "ابن العربي", "خارجي", "المقريزي",
    "زين الدين", "ابن مخلوف", "الشوكاني", "تاج الدين", "لا يستغاث", "البرزالي",
    "مصر", "الإمام أحمد", "العز بن عبد السلام"
]

hits = []
for w in words:
    for e in entities:
        if e in w["w"]:
            hits.append((w["s"], w["e"], e, w["w"]))

# Group into scenes / key moments
print(f"Total words in cut video: {len(words)}")
print(f"Timeline starts at {words[0]['s']}s and ends at {words[-1]['e']}s")

with open("scratch_v1_hits.txt", "w", encoding="utf-8") as f:
    for s, e, ent, orig in hits:
        f.write(f"[{s:.2f}s - {e:.2f}s] {ent} (word: {orig})\n")

print(f"Found {len(hits)} entity mentions.")
