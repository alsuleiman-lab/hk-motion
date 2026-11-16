import json

with open('public/nifas_reel_words.json', 'r', encoding='utf-8') as f:
    words = json.load(f)

# Group words into breath phrases
phrases = []
cur = []
cur_s = None
for i, w in enumerate(words):
    if cur_s is None: cur_s = w['s']
    cur.append(w['w'])
    pause = (words[i+1]['s'] - w['e'] > 0.4) if i < len(words) - 1 else True
    if pause or len(cur) >= 12:
        phrases.append((cur_s, w['e'], " ".join(cur)))
        cur = []
        cur_s = None

for s, e, txt in phrases:
    print(f"[{s:05.2f} -> {e:05.2f}] {txt}")

