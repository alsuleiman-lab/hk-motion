import json

words = json.load(open('render_work/lessons/XEGf__X_mdM/words.json', encoding='utf-8'))

# Clip 1: 674 to 840
c1 = []
for w in words:
    if 674.0 <= w['s'] <= 840.0:
        c1.append({
            'w': w['w'],
            's': round(w['s'] - 674.0, 2),
            'e': round(w['e'] - 674.0, 2),
            'p': w.get('p', 1.0)
        })
json.dump(c1, open('.tmp/clip1_words_raw.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print(f"Clip 1 raw words: {len(c1)}")

# Clip 2: 2720 to 2933
c2 = []
for w in words:
    if 2720.0 <= w['s'] <= 2933.0:
        c2.append({
            'w': w['w'],
            's': round(w['s'] - 2720.0, 2),
            'e': round(w['e'] - 2720.0, 2),
            'p': w.get('p', 1.0)
        })
json.dump(c2, open('.tmp/clip2_words_raw.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print(f"Clip 2 raw words: {len(c2)}")
