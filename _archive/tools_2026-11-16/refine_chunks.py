import json

with open('public/debate_yameen_words.json', 'r', encoding='utf-8') as f:
    raw_words = json.load(f)

# Word corrections
corrections = {
    "حسنياري": "حسن ياري",
    "يسبن": "يسبنا",
    "الرحمة": "الرحمن",
    "مصادرين": "مصادرنا",
    "يد": "يدي",
    "وعي": "وعن"
}

cleaned = []
for w in raw_words:
    if w['start'] >= 35.45:
        continue
    txt = w['word'].strip()
    if txt in corrections:
        txt = corrections[txt]
    cleaned.append({
        "word": txt,
        "start": w['start'],
        "end": min(w['end'], 35.45),
        "prob": w.get('prob', 0.9)
    })

# Semantic sentence splits
breakpoints = [
    "يقول",      # End of chunk 0
    "اليمين",    # End of chunk 1
    "يسبنا",     # End of chunk 2
    "أنا",       # End of chunk 3
    "وسلم",      # End of chunk 4
    "النور",     # End of chunk 5
    "الرحمن",    # End of chunk 6
    "العقول",    # End of chunk 7
    "الآن",      # End of chunk 8
    "الله",      # Can be end of hadith quote 1
    "عندكم",     # End of chunk 10
    "33",        # End of chunk 11
    "الله",      # End of hadith quote 2
    "33"         # End of chunk 13
]

chunks_def = [
    (0, 4),    # الأستاذ الشيعي حسن ياري يقول
    (4, 8),    # أنتم تثبتون لله اليمين
    (8, 10),   # وكأنه يسبنا
    (10, 14),  # الذي أثبته ليس أنا
    (14, 25),  # الله سبحانه وتعالى على لسان محمد صلى الله عليه وسلم
    (25, 31),  # قال المتقون على منابر من النور
    (31, 34),  # على يمين الرحمن
    (34, 41),  # الآن هذه الرواية عندكم في مرآة العقول
    (41, 46),  # ما جبت لك مصادرنا الآن
    (46, 55),  # يقول بين يدي الله عز وجل وعن يمين الله
    (55, 58),  # والحديث صحيح عندكم
    (58, 65),  # وفي الرواية في الجزء التاسع صفحة 33
    (65, 75),  # يقول كان بين يدي الله عز وجل وعن يمين الله
    (75, 78)   # أيضا في الصفحة 33
]

refined_chunks = []
for idx, (s_idx, e_idx) in enumerate(chunks_def):
    c_words = cleaned[s_idx:e_idx]
    if not c_words:
        continue
    c_start = c_words[0]['start']
    c_end = c_words[-1]['end']
    text = " ".join([w['word'] for w in c_words])
    refined_chunks.append({
        "chunkIndex": idx,
        "start": c_start,
        "end": c_end,
        "text": text,
        "words": c_words
    })

with open('src/debate_yameen_captions.json', 'w', encoding='utf-8') as f:
    json.dump(refined_chunks, f, ensure_ascii=False, indent=2)

print(f"Generated {len(refined_chunks)} refined chunks:")
for c in refined_chunks:
    print(f"[{c['start']:.2f}s - {c['end']:.2f}s]: {c['text']}")

