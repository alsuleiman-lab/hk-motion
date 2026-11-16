import json

with open(r"public\debate_hand_words.json", "r", encoding="utf-8") as f:
    words = json.load(f)

# Group words into rhythmic short phrases (3-7 words per caption)
captions = []
cur_words = []
cur_start = 0

for i, w in enumerate(words):
    if not cur_words:
        cur_start = w["start"]
    cur_words.append(w)
    
    # Break conditions:
    # 1. pause between words > 0.35s
    # 2. word count reaches 5-7
    # 3. punctuation or natural boundary
    is_last = (i == len(words) - 1)
    next_w = words[i+1] if not is_last else None
    pause = (next_w["start"] - w["end"]) if next_w else 1.0
    
    text = " ".join([x["word"] for x in cur_words])
    
    if len(cur_words) >= 5 or pause > 0.35 or is_last or any(p in w["word"] for p in [".", "،", "؟", "!"]):
        captions.append({
            "start": round(cur_start, 2),
            "end": round(w["end"], 2),
            "text": text.replace("،", "").replace(".", "").replace("؟", "").strip(),
            "words": [{
                "word": x["word"].replace("،", "").replace(".", "").strip(),
                "start": x["start"],
                "end": x["end"]
            } for x in cur_words]
        })
        cur_words = []

print(f"Total captions grouped: {len(captions)}")

with open(r"src\debate_hand_captions.json", "w", encoding="utf-8") as f:
    json.dump(captions, f, ensure_ascii=False, indent=2)

print("Saved src/debate_hand_captions.json")

