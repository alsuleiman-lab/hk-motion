import json

with open("public/shia_insult_words.json", "r", encoding="utf-8") as f:
    words = json.load(f)

chunks = []
cur_words = []
MAX_WORDS = 5
MAX_GAP = 0.6

for w in words:
    if not cur_words:
        cur_words.append(w)
        continue

    prev = cur_words[-1]
    gap = w["s"] - prev["e"]
    
    # Break chunk if max words reached, or gap > MAX_GAP, or punctuation
    should_break = (len(cur_words) >= MAX_WORDS) or (gap > MAX_GAP) or (prev["w"].endswith(("،", "!", "؟", ".", ":", "؛")))

    if should_break:
        chunks.append({
            "start": round(cur_words[0]["s"], 2),
            "end": round(cur_words[-1]["e"] + 0.15, 2),
            "text": " ".join([x["w"] for x in cur_words]),
            "words": [{"w": x["w"], "s": round(x["s"], 2), "e": round(x["e"], 2)} for x in cur_words]
        })
        cur_words = [w]
    else:
        cur_words.append(w)

if cur_words:
    chunks.append({
        "start": round(cur_words[0]["s"], 2),
        "end": round(cur_words[-1]["e"] + 0.15, 2),
        "text": " ".join([x["w"] for x in cur_words]),
        "words": [{"w": x["w"], "s": round(x["s"], 2), "e": round(x["e"], 2)} for x in cur_words]
    })

with open("src/shia_insult_captions.json", "w", encoding="utf-8") as f:
    json.dump(chunks, f, ensure_ascii=False, indent=2)

print(f"Generated {len(chunks)} caption chunks in src/shia_insult_captions.json")

