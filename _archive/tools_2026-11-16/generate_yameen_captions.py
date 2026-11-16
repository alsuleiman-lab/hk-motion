import json

with open('public/debate_yameen_words.json', 'r', encoding='utf-8') as f:
    raw_words = json.load(f)

# Word corrections dictionary
corrections = {
    "حسنياري": "حسن ياري",
    "يسبن": "يسبنا",
    "الرحمة": "الرحمن",
    "مصادرين": "مصادرنا",
    "يد": "يدي",
    "وعي": "وعن"
}

cleaned_words = []
for w in raw_words:
    # If end time is past 35.45s, skip (this is the next hadith intro)
    if w['start'] >= 35.45:
        continue
    word_text = w['word'].strip()
    if word_text in corrections:
        word_text = corrections[word_text]
    cleaned_words.append({
        "word": word_text,
        "start": w['start'],
        "end": min(w['end'], 35.45),
        "prob": w.get('prob', 0.9)
    })

print(f"Total cleaned words: {len(cleaned_words)}")

# Chunk words into natural reading phrases (chunks of 3-6 words, or natural pauses)
chunks = []
current_chunk = []

for i, w in enumerate(cleaned_words):
    current_chunk.append(w)
    
    # Check if should break chunk
    is_last = (i == len(cleaned_words) - 1)
    word_text = w['word']
    
    break_here = False
    if is_last:
        break_here = True
    elif len(current_chunk) >= 5:
        break_here = True
    elif len(current_chunk) >= 3 and (
        word_text in ["ياري", "اليمين", "يسبنا", "أنا", "وسلم", "النور", "الرحمن", "العقول", "الآن", "وجل", "عندكم", "33"]
    ):
        break_here = True
    elif i + 1 < len(cleaned_words) and (cleaned_words[i+1]['start'] - w['end'] > 0.35):
        break_here = True
        
    if break_here and current_chunk:
        chunks.append({
            "chunkIndex": len(chunks),
            "start": current_chunk[0]['start'],
            "end": current_chunk[-1]['end'],
            "text": " ".join([cw['word'] for cw in current_chunk]),
            "words": current_chunk
        })
        current_chunk = []

with open('src/debate_yameen_captions.json', 'w', encoding='utf-8') as f:
    json.dump(chunks, f, ensure_ascii=False, indent=2)

print(f"Generated {len(chunks)} caption chunks:")
for c in chunks:
    print(f"  [{c['start']:.2f}s - {c['end']:.2f}s]: {c['text']}")

