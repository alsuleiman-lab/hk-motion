import json
import sys

sys.stdout.reconfigure(encoding='utf-8')
data = json.load(open('render_work/lessons/GAMoY6n_Fw8/c2_words.json', encoding='utf-8'))
for w in data:
    if 'ملاحد' in w['w'] or 'نحكي' in w['w'] or (w['s'] > 6.0 and w['s'] < 16.0):
        print(f"{w['s']:.2f} - {w['e']:.2f} (frame {int(w['s']*30)}): {w['w']}")
