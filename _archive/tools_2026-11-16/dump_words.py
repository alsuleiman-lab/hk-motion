import json

with open('public/debate_yameen_words.json', 'r', encoding='utf-8') as f:
    words = json.load(f)

with open('yameen_words_debug.txt', 'w', encoding='utf-8') as out:
    for i, w in enumerate(words):
        out.write(f"{i}: {w['start']:.2f} - {w['end']:.2f} ({w['prob']:.2f}) -> {w['word']}\n")

print(f"Wrote {len(words)} words to yameen_words_debug.txt")

