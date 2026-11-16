import json

with open('public/nifas_40_words.json', 'r', encoding='utf-8') as f:
    words = json.load(f)

START = 311.0
END = 406.5

reel_words = []
for w in words:
    if w['s'] >= START and w['e'] <= END + 0.5:
        reel_words.append({
            's': round(max(0, w['s'] - START), 2),
            'e': round(w['e'] - START, 2),
            'w': w['w'],
            'p': w['p']
        })

with open('public/nifas_reel_words.json', 'w', encoding='utf-8') as f:
    json.dump(reel_words, f, ensure_ascii=False, indent=2)

print(f"Created nifas_reel_words.json with {len(reel_words)} words.")
print("First word:", reel_words[0])
print("Last word:", reel_words[-1])

