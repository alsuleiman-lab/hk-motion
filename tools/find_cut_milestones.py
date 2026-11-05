import json
with open(r'S:\AI_Tools\Remotion_Workspace\public\nifas_40_words.json', 'r', encoding='utf-8') as f:
    words = json.load(f)

for w in words:
    if any(k in w['w'] for k in ['سئلت', 'بالإجماع', 'مصيبة', 'المعتمد', 'أعلى']):
        print(f"{w['s']:.2f}s: {w['w']}")

