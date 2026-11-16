import json

with open(r'S:\AI_Tools\Remotion_Workspace\.tmp\tirmidhi_30\words.json', 'r', encoding='utf-8') as f:
    words = json.load(f)

for w in words:
    if 335 <= w['s'] <= 420:
        print(f"{w['s']:.2f} -> {w['e']:.2f}: {w['w']}")

