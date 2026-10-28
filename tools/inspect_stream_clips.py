import json

words = json.load(open('render_work/lessons/XEGf__X_mdM/words.json', encoding='utf-8'))

with open('render_work/lessons/XEGf__X_mdM/clips_detail.txt', 'w', encoding='utf-8') as out:
    # Clip 1: 11:00 to 14:30 (660s to 880s)
    c1_words = [w for w in words if 660 <= w['s'] <= 880]
    out.write('=== CLIP 1 ===\n')
    for i in range(0, len(c1_words), 10):
        txt = ' '.join(w['w'] for w in c1_words[i:i+10])
        out.write(f"[{c1_words[i]['s']:.2f} -> {c1_words[min(i+9, len(c1_words)-1)]['e']:.2f}]: {txt}\n")

    # Clip 2: 45:20 to 49:00 (2720s to 2940s)
    c2_words = [w for w in words if 2720 <= w['s'] <= 2940]
    out.write('\n=== CLIP 2 ===\n')
    for i in range(0, len(c2_words), 10):
        txt = ' '.join(w['w'] for w in c2_words[i:i+10])
        out.write(f"[{c2_words[i]['s']:.2f} -> {c2_words[min(i+9, len(c2_words)-1)]['e']:.2f}]: {txt}\n")

print("Saved clips_detail.txt")
