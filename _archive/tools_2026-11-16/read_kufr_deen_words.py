import json

with open(".tmp/s2_ashari_kufr_deen_words.json", encoding="utf-8") as f:
    words = json.load(f)

cur = []
st = 0
for w in words:
    if not cur: st = w['s']
    cur.append(w['w'])
    if any(p in w['w'] for p in ['.', '!', '؟', '،']) or w['e'] - st > 3.5:
        print(f"{st:5.2f} -> {w['e']:5.2f}: {' '.join(cur)}")
        cur = []
if cur:
    print(f"{st:5.2f} -> {words[-1]['e']:5.2f}: {' '.join(cur)}")

