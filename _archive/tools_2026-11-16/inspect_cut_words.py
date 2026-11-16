import json

with open('.tmp/cut_words_utf8.txt', 'w', encoding='utf-8') as out:
    c1 = json.load(open('public/clip1_words.json', encoding='utf-8'))
    out.write(f"=== CLIP 1 (Duration: {c1['duration']}s, Words: {len(c1['words'])}) ===\n")
    for i in range(0, len(c1['words']), 10):
        chunk = c1['words'][i:i+10]
        txt = ' '.join(w['w'] for w in chunk)
        out.write(f"[{chunk[0]['s']:.2f} -> {chunk[-1]['e']:.2f}]: {txt}\n")

    c2 = json.load(open('public/clip2_words.json', encoding='utf-8'))
    out.write(f"\n=== CLIP 2 (Duration: {c2['duration']}s, Words: {len(c2['words'])}) ===\n")
    for i in range(0, len(c2['words']), 10):
        chunk = c2['words'][i:i+10]
        txt = ' '.join(w['w'] for w in chunk)
        out.write(f"[{chunk[0]['s']:.2f} -> {chunk[-1]['e']:.2f}]: {txt}\n")

print("Saved .tmp/cut_words_utf8.txt")
